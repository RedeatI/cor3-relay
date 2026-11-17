import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const script=source('auto-job-solver.js');
const fixture=()=>({jobId:'task-1',serverId:'server',type:'Decrypt & Extract',conditions:[
  {type:'DownloadFile',details:{files:[{fileId:'server-file',name:'report.dat'}]}},
  {type:'DecryptDownloadedFile',details:{files:[{fileId:'desktop-file',name:'report.dat'}]}}
]});
const file=()=>({id:'desktop-file',name:'report.eb52x',isEncrypted:true});
function context(extra={}){
  const c=vm.createContext({...extra});c.window=c;
  vm.runInContext(source('loadout-algorithms.js'),c);return c;
}
const jobFunction=(c,start,end)=>vm.runInContext(script.slice(script.indexOf(start),script.indexOf(end)),c);
test('a plaintext task target does not exclude its encrypted downloaded file',()=>{
  const a=context().Cor3LoadoutAlgorithms,f=file();
  const r=a.inspectDownloaded([f],fixture());assert.equal(r.file,f);assert.equal(r.proof,'id');
  assert.equal(a.decryptionType(fixture(),f.name),'.eb52x');
});
test('changed IDs can match the task stem across encrypted and plaintext extensions',()=>{
  const a=context().Cor3LoadoutAlgorithms,f={...file(),id:'new-id',name:'REPORT.ab52p'};
  assert.equal(a.inspectDownloaded([f],fixture()).file,f);
  assert.equal(a.decryptionType({...fixture(),fileType:'.ab52p'}),'.ab52p');
});
test('an explicit encrypted task format still excludes a wrong cipher',()=>{
  const a=context().Cor3LoadoutAlgorithms,job={fileInfo:{id:'f'},conditions:[{type:'DecryptFile',details:{fileExtension:'eb52x'}}]};
  assert.equal(a.selectDownloaded([{id:'f',name:'report.ab52p',isEncrypted:true}],job),null);
});
test('late updates and newest-file order cannot select an unrelated file',()=>{
  const a=context().Cor3LoadoutAlgorithms,wrong={id:'unrelated',name:'other.eb52x',isEncrypted:true,isNew:true};
  assert.equal(a.inspectDownloaded([wrong],fixture(),{fileId:wrong.id,fileName:wrong.name}).file,null);
});
test('a known different task cannot match by filename or an event',()=>{
  const a=context().Cor3LoadoutAlgorithms,f={...file(),jobId:'other-task'};
  const r=a.inspectDownloaded([f],fixture(),{fileId:f.id,fileName:f.name});
  assert.equal(r.file,null);assert.equal(r.reason,'unmatched');assert.equal(r.count,1);
});
test('ambiguous stems require a current event among those owned candidates',()=>{
  const a=context().Cor3LoadoutAlgorithms,one={...file(),id:'one'},two={...file(),id:'two',name:'report.ab52p'};
  assert.equal(a.inspectDownloaded([one,two],fixture()).reason,'ambiguous');
  assert.equal(a.inspectDownloaded([one,two],fixture(),{fileId:two.id,fileName:two.name}).file,two);
  assert.equal(a.inspectDownloaded([one,two],fixture(),{fileId:two.id,fileName:'stale'}).reason,'ambiguous');
});
test('an already decoded current task file remains usable without re-decrypting',()=>{
  const a=context().Cor3LoadoutAlgorithms,f={...file(),name:'report.dat',isEncrypted:false};
  assert.equal(a.selectDownloaded([f],fixture()),f);
});
test('folder schemas retain IDs and distinguish empty, malformed, and refused reads',()=>{
  const a=context().Cor3LoadoutAlgorithms;
  for(const data of [{id:'downloads',files:[file()]},{folder:{id:'downloads',files:[file()]}},{folderId:'downloads',files:[{file:{...file(),id:undefined,fileId:'desktop-file'}}]}]){
    const r=a.folderContents({data});assert.equal(r.id,'downloads');assert.equal(a.selectDownloaded(r.files,fixture()).id,'desktop-file');
  }
  assert.equal(a.inspectDownloaded([],fixture()).reason,'empty');
  assert.equal(a.inspectDownloaded(undefined,fixture()).reason,'unconfirmed');
  assert.equal(a.inspectDownloaded([{unknown:true}],fixture()).reason,'unconfirmed');
  assert.equal(a.folderContents({error:{message:'denied'}}).error.message,'denied');
});
function folderHarness({replies=[],afterSend=()=>{},sleep=()=>{}}={}){
  let listener=null,generation=1,allowed=true,attempt=0;
  const commands=[],logs=[];
  const c=context({state:{abortFlag:false,downloadFolderId:'downloads'},
    masterAllowed:()=>allowed,stepDiscoverDownloadFolder:async()=>{},delay:async ms=>sleep(ms),
    log:(...x)=>logs.push(x),friendlyError:x=>x,
    waitForEvent:(type,timeout,predicate)=>new Promise((resolve,reject)=>{assert.equal(type,'COR3_AUTOJOB_DESKTOP_FOLDER');listener={predicate,resolve,reject};}),
    sendCmd:(cmd,data)=>{
      commands.push({cmd,data});assert.equal(cmd,'open.folder');assert.ok(listener,'listen before sending');
      const l=listener;listener=null;
      for(const reply of replies[attempt++]||[]){if(l.predicate(reply)){afterSend(c);l.resolve(reply);return;}}
      l.reject(Error('timeout'));
    }
  });c.__cor3MasterGate={snapshot:()=>({generation})};
  jobFunction(c,'  async function openFolderAndFindFile(','  async function tryEarlyCompletion(');
  return {c,commands,logs,revoke:()=>generation++,stop:()=>allowed=false};
}
const own=files=>({data:{id:'downloads',files}});
test('production folder reader ignores another directory and catches synchronous own replies',async()=>{
  const h=folderHarness({replies:[[{data:{id:'other-folder',files:[file()]}},own([file()])]]});
  const job=fixture(),r=await h.c.openFolderAndFindFile(job);assert.equal(r.id,file().id);
  assert.equal(h.commands.length,1);assert.equal(job.fileType,'.eb52x');assert.equal(job.downloadOutcome,'observed');
});
test('a late file is found by bounded readonly retries without another download',async()=>{
  const h=folderHarness({replies:[[own([])],[own([file()])]]});
  assert.equal((await h.c.openFolderAndFindFile(fixture())).name,'report.eb52x');
  assert.equal(h.commands.length,2);assert.ok(h.commands.every(x=>x.cmd==='open.folder'));
});
test('folder reader gets fresh file update references after each response',async()=>{
  const two={...file(),id:'second',name:'report.ab52p'};let refs={};
  const h=folderHarness({replies:[[own([{...file(),id:'first'},two])]],afterSend:()=>refs={fileId:two.id,fileName:two.name}});
  assert.equal((await h.c.openFolderAndFindFile(fixture(),null,null,null,()=>refs)).id,two.id);
});
test('a directory refusal or unconfirmed response is never reported as an empty folder',async()=>{
  const refused=folderHarness({replies:[[{data:{folderId:'downloads'},error:{message:'denied'}}]]});
  await assert.rejects(refused.c.openFolderAndFindFile(fixture()),/DOWNLOAD_FOLDER_READ_FAILED/);
  const unknown=folderHarness({replies:[[{data:{id:'downloads'}}]]});
  await assert.rejects(unknown.c.openFolderAndFindFile(fixture()),/DOWNLOAD_FOLDER_RESPONSE_UNCONFIRMED/);
});
test('a document generation change during a folder read revokes the result',async()=>{
  let h;h=folderHarness({replies:[[own([file()])]],afterSend:()=>h.revoke()});
  await assert.rejects(h.c.openFolderAndFindFile(fixture()),/DOWNLOAD_SCOPE_REVOKED/);
  assert.equal(h.commands.length,1);
});
test('stopping during the late-file wait prevents the next read',async()=>{
  let h;h=folderHarness({replies:[[own([])]],sleep:()=>h.stop()});
  await assert.rejects(h.c.openFolderAndFindFile(fixture()),/DOWNLOAD_SCOPE_REVOKED/);
  assert.equal(h.commands.length,1);
});
test('four confirmed empty reads end with a specific missing-file result',async()=>{
  const h=folderHarness({replies:Array.from({length:4},()=>[own([])])});
  await assert.rejects(h.c.openFolderAndFindFile(fixture()),/DOWNLOAD_FOLDER_EMPTY/);assert.equal(h.commands.length,4);
});
test('unconfirmed download plus no file retains the unknown download outcome',async()=>{
  const h=folderHarness({replies:Array.from({length:4},()=>[own([])])});
  await assert.rejects(h.c.openFolderAndFindFile({...fixture(),downloadOutcome:'unconfirmed'}),/DOWNLOAD_RECEIPT_UNCONFIRMED/);
});
function flowHarness({download={data:{}},lostDownload=false}={}){
  const h=folderHarness({replies:[[own([])],[own([file()])]]}),{c}=h;
  const originalWait=c.waitForEvent,originalSend=c.sendCmd,decrypted=[];let downloadListener=false,filesListener=false,removed=0;
  Object.assign(c,{jobLabel:()=>'',createFileUpdateListener:()=>({fileId:null,fileName:null,remove:()=>removed++}),
    stepTakeJob:async()=>{},tryEarlyCompletion:async()=>null,stepSetEndpoint:async()=>{},stepLogin:async()=>{},humanDelay:()=>1,
    runDecryptFlow:async(...args)=>{decrypted.push(args);return {reward:'test'};},
    waitForEvent:(type,...args)=>{
      if(type==='COR3_AUTOJOB_SAI_FILES'){filesListener=true;return Promise.resolve({data:{files:[{fileId:'server-file',jobId:'task-1',name:'report.dat'}]}});}
      if(type==='COR3_AUTOJOB_SAI_FILE_DOWNLOAD'){downloadListener=true;return lostDownload?Promise.reject(Error('timeout')):Promise.resolve(download);}
      return originalWait(type,...args);
    },
    sendCmd:(cmd,data)=>{
      if(cmd==='open.folder')return originalSend(cmd,data);
      if(cmd==='get.files')assert.equal(filesListener,true,'server file list listener must be registered first');
      if(cmd==='file.download')assert.equal(downloadListener,true,'download acknowledgement listener must be registered first');
      h.commands.push({cmd,data});
    }
  });
  jobFunction(c,'  async function solveDecryptExtract(','  async function solveFileElimination(');
  return {...h,decrypted,removed:()=>removed};
}
test('production extract journey downloads once, finds the late encrypted file and passes its real format',async()=>{
  const h=flowHarness(),job=fixture();await h.c.solveDecryptExtract(job);
  assert.equal(h.commands.filter(x=>x.cmd==='file.download').length,1);assert.equal(job.fileType,'.eb52x');
  assert.deepEqual(h.decrypted[0].slice(0,2),['desktop-file','report.eb52x']);assert.equal(h.decrypted[0][3],true);assert.equal(h.removed(),1);
});
test('an explicit download rejection does not open folders or decrypt',async()=>{
  const h=flowHarness({download:{error:{message:'missing-software'}}});
  await assert.rejects(h.c.solveDecryptExtract(fixture()),/DOWNLOAD_REJECTED/);assert.equal(h.decrypted.length,0);
  assert.equal(h.commands.filter(x=>x.cmd==='open.folder').length,0);assert.equal(h.removed(),1);
});
test('a lost download reply checks the current folder without sending download twice',async()=>{
  const h=flowHarness({lostDownload:true});await h.c.solveDecryptExtract(fixture());
  assert.equal(h.commands.filter(x=>x.cmd==='file.download').length,1);assert.equal(h.decrypted.length,1);
});
test('production Data Download decrypts the same owned encrypted file when conditions require it',async()=>{
  const h=flowHarness(),job={...fixture(),type:'Data Download'};
  Object.assign(h.c,{jobConditionsRequireDecrypt:()=>true,extractFileInfoFromConditions:()=>({id:'desktop-file',name:'report.dat'})});
  jobFunction(h.c,'  async function solveDataDownload(','  async function solveLogDeletion(');
  await h.c.solveDataDownload(job);
  assert.equal(h.commands.filter(x=>x.cmd==='file.download').length,1);
  assert.deepEqual(h.decrypted[0].slice(0,2),['desktop-file','report.eb52x']);assert.equal(job.fileType,'.eb52x');assert.equal(h.removed(),1);
});
test('an already-downloaded reply reuses the owned file instead of reporting a download rejection',async()=>{
  const h=flowHarness({download:{error:{message:'file-already-downloaded'}}});await h.c.solveDecryptExtract(fixture());
  assert.equal(h.commands.filter(x=>x.cmd==='file.download').length,1);assert.equal(h.decrypted.length,1);
});
test('production folder discovery listens before sending and rejects other-window events',async()=>{
  let listener=null,timer=null,cleared=false;const c=context({state:{},location:{origin:'https://cor3.gg'},
    delay:async()=>{},log:()=>{},safeTimeout:fn=>(timer=fn,1),safeClearTimeout:()=>cleared=true});
  c.addEventListener=(type,fn)=>listener=fn;c.removeEventListener=()=>listener=null;
  c.sendCmd=()=>{
    assert.ok(listener,'desktop options listener registered before send');
    listener({source:{},origin:'https://cor3.gg',data:{type:'COR3_AUTOJOB_DESKTOP_OPTIONS',data:{folders:[{id:'wrong',name:'Downloads'}]}}});
    assert.ok(listener,'foreign window response ignored');
    // Events from the same VM use its global window proxy.
    vm.runInContext("__optionsHandler({source:window,origin:location.origin,data:{type:'COR3_AUTOJOB_DESKTOP_OPTIONS',data:{folders:[{id:'downloads',name:'Downloads'}]}}})",Object.assign(c,{__optionsHandler:listener}));
  };
  jobFunction(c,'  async function stepDiscoverDownloadFolder(','  async function runDecryptFlow(');
  assert.equal(await c.stepDiscoverDownloadFolder(),'downloads');assert.equal(c.state.downloadFolderId,'downloads');assert.equal(cleared,true);
});
