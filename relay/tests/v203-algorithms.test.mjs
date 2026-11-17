import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const jobSource=source('auto-job-solver.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function algorithms(extra={}){const c=vm.createContext({...extra});c.window=c;vm.runInContext(source('loadout-algorithms.js'),c);return {c,a:c.Cor3LoadoutAlgorithms};}
const hw=(id,category,specs)=>({id,name:id,category,specs});
const cpu=hw('cpu-old','CPU',{cpuFrequency:10,cpuCores:4,cpuConsuming:40});
const cpu2=hw('cpu-new','CPU',{cpuFrequency:30,cpuCores:8,cpuConsuming:70});
const gpu=hw('gpu-old','GPU',{gpuPower:10,gpuMemory:10,gpuConsuming:60});
const gpu2=hw('gpu-new','GPU',{gpuPower:30,gpuMemory:30,gpuConsuming:20});
const ram=hw('ram','RAM',{ramFrequency:30,ramMemory:30});
const psu=hw('psu-old','PSU',{psuPower:100,psuProtection:5});
const psu2=hw('psu-new','PSU',{psuPower:90,psuProtection:9});
const psu3=hw('psu-large','PSU',{psuPower:200,psuProtection:8});
const sw={id:'decrypt',name:'decrypt',specs:[{type:'DECRYPT',power:[10,50],fileTypes:['EB52X']}],consuming:{cpu_frequency:[0,5,30],gpu_power:[0,5,30]}};
const oldSw={id:'other',name:'other',specs:[{type:'HACK',power:[1,10],serverTypes:['TEST']}],consuming:{}};
function loadout(){return copy({equippedHardware:{cpu,gpu,ram,psu},ownedHardware:[cpu,cpu2,gpu,gpu2,ram,psu,psu2,psu3],ownedSoftware:[sw,oldSw],equippedSoftware:[sw]});}
const target=()=>copy({cpu:cpu2,gpu:gpu2,ram,psu:psu2});
function physicalPorts({allowed=()=>true,commandError=null,unconfirmed=false}={}){
 const data=loadout(),commands=[],sleeps=[];let readCount=0;
 const ports={allowed,sleep:async ms=>sleeps.push(ms),read:async()=>{readCount++;return copy(data);},command:async step=>{
  commands.push(copy(step));if(commandError){const error=commandError(step,commands.length);if(error)return {error};}
  if(unconfirmed)return {};
  if(step.cmd==='loadout.unequip.software')data.equippedSoftware=data.equippedSoftware.filter(x=>x.id!==step.id);
  else if(step.cmd==='loadout.equip.software')data.equippedSoftware.push(data.ownedSoftware.find(x=>x.id===step.id));
  else{
   // Model the game's intermediate PSU validation; the final valid set alone is insufficient.
   assert.equal(data.equippedSoftware.length,0,'software must be removed before swapping hardware');
   const item=data.ownedHardware.find(x=>x.id===step.id);data.equippedHardware[item.category.toLowerCase()]=item;
   const h=data.equippedHardware;
   assert.ok(h.cpu.specs.cpuConsuming+h.gpu.specs.gpuConsuming<=h.psu.specs.psuPower,'intermediate pair must fit the installed PSU');
  }
  return {data:copy(data)};
 }};
 return {data,ports,commands,sleeps,reads:()=>readCount};
}
test('v2.0.4 planner keeps current sufficient hardware and avoids a pointless PSU upgrade',()=>{
 const {a}=algorithms(),d=loadout(),before=JSON.stringify(d);const p=a.plan(d,null,'DECRYPT','.eb52x',15);
 assert.equal(p.hardware.cpu.id,cpu.id);assert.equal(p.hardware.psu.id,psu.id);assert.equal(p.switchCost,0);assert.equal(p.softwareId,sw.id);assert.equal(JSON.stringify(d),before);
});
test('planner upgrades when current power is insufficient and uses the maximum-power PSU policy',()=>{
 const {a}=algorithms(),p=a.plan(loadout(),null,'DECRYPT','.EB52X',45);
 assert.equal(p.hardware.cpu.id,cpu2.id);assert.equal(p.hardware.gpu.id,gpu2.id);assert.equal(p.hardware.psu.id,psu3.id);assert.equal(p.power,50);assert.equal(p.sufficient,true);assert.equal(p.policyId,'max-psu-power');
});
test('software and hardware that are only equipped are still valid owned choices',()=>{
 const {a}=algorithms(),d=loadout();d.ownedHardware=[];d.ownedSoftware=[];const p=a.plan(d,null,'DECRYPT','eb52x',10);assert.equal(p.softwareId,sw.id);assert.equal(p.switchCost,0);
});
test('non-owned, wrong-target and below-requirement plans cannot become successful plans',()=>{
 const {a}=algorithms(),d=loadout();assert.equal(a.plan(d,null,'DECRYPT','.unowned',1),null);
 const p=a.plan(d,null,'DECRYPT','.eb52x',500);assert.equal(p.sufficient,false);assert.ok(p.power<500);
});
test('equal-power replacement PSUs prefer protection and then the installed PSU',()=>{
 const {a}=algorithms(),d=loadout();d.ownedHardware=d.ownedHardware.filter(x=>x.category!=='PSU');d.ownedHardware.push(hw('same-low','PSU',{psuPower:200,psuProtection:1}),hw('same-high','PSU',{psuPower:200,psuProtection:20}));
 const p=a.plan(d,null,'DECRYPT','.eb52x',45);assert.equal(p.hardware.psu.id,'same-high');
});
test('a lower-draw GPU is replaced before a higher-draw CPU and smaller PSU',async()=>{
 const {a}=algorithms(),f=physicalPorts();const result=await a.executeOwned(target(),[sw.id],f.ports);
 assert.deepEqual(f.commands.map(x=>x.cmd==='loadout.equip.hardware'?x.slot:x.cmd),['loadout.unequip.software','gpu','cpu','psu','loadout.equip.software']);
 assert.ok(a.targetMatches(result,target(),[sw.id]));assert.equal(f.reads(),2);
});
test('a stronger PSU is installed first when the old pair fits it',async()=>{
 const {a}=algorithms(),f=physicalPorts(),h=target();h.psu=copy(psu3);await a.executeOwned(h,[sw.id],f.ports);
 assert.equal(f.commands[1].slot,'psu');
});
test('an already matching plan makes no equipment commands',async()=>{
 const {a}=algorithms(),f=physicalPorts();await a.executeOwned(f.data.equippedHardware,[sw.id],f.ports);assert.equal(f.commands.length,0);
});
test('explicit rate limiting gets one paced retry; unknown command outcomes never do',async()=>{
 const {a}=algorithms(),f=physicalPorts({commandError:(_s,n)=>n===1?{message:'rate-limit'}:null});await a.executeOwned(target(),[sw.id],f.ports);assert.equal(f.sleeps.filter(x=>x===3000).length,1);assert.equal(f.commands[0].id,f.commands[1].id);
 const g=physicalPorts({unconfirmed:true});await assert.rejects(a.executeOwned(target(),[sw.id],g.ports),/UNCONFIRMED/);assert.equal(g.commands.length,1);
});
test('game refusal stops the sequence and cannot report verified success',async()=>{
 const {a}=algorithms(),f=physicalPorts({commandError:()=>({message:'not-enough-resources'})});await assert.rejects(a.executeOwned(target(),[sw.id],f.ports),/APPLY_FAILED/);assert.equal(f.commands.length,1);
});
test('scope revoked after an awaited command prevents any subsequent hardware action',async()=>{
 const {a}=algorithms();let valid=true;const f=physicalPorts({allowed:()=>valid});const original=f.ports.command;f.ports.command=async s=>{const r=await original(s);valid=false;return r;};await assert.rejects(a.executeOwned(target(),[sw.id],f.ports),/SCOPE_REVOKED/);assert.equal(f.commands.length,1);
});
test('fresh ownership is checked after queue admission, before a mutation',async()=>{
 const {a}=algorithms(),f=physicalPorts();const h=target();h.cpu={...cpu2,id:'foreign-cpu'};await assert.rejects(a.executeOwned(h,[sw.id],f.ports),/NOT_OWNED/);assert.equal(f.commands.length,0);
});
test('final verification checks hardware too, and never blindly repeats mutations',async()=>{
 const {a}=algorithms(),f=physicalPorts();const original=f.ports.read;let n=0;f.ports.read=async()=>{const d=await original();if(++n>1)d.equippedHardware.cpu=copy(cpu);return d;};await assert.rejects(a.executeOwned(target(),[sw.id],f.ports),/VERIFY_FAILED/);assert.equal(f.commands.length,5);assert.equal(f.reads(),5);
});
test('failed mutation releases the local serialization chain without overlapping the next plan',async()=>{
 const {a}=algorithms(),f=physicalPorts({commandError:()=>({message:'refused'})}),g=physicalPorts();const first=a.executeOwned(target(),[sw.id],f.ports);const second=a.executeOwned(target(),[sw.id],g.ports);await assert.rejects(first);assert.ok(a.targetMatches(await second,target(),[sw.id]));
});
test('decrypt type reads array/legacy conditions, nested file names and modern fileInfo',()=>{
 const {a}=algorithms();for(const conditions of [[{details:{fileExtension:' EB52X '}}],{items:[{fileExtension:'.eb52x'}]},[{details:{files:[{name:'right.eb52x'}]}}]])assert.equal(a.fileType({conditions},'wrong.bin').toLowerCase(),'.eb52x');
 assert.equal(a.fileType({fileInfo:{name:'right.EB52X'}}).toLowerCase(),'.eb52x');assert.equal(a.fileType({fileType:'eb52x'}),'.eb52x');
 assert.equal(a.fileType({fileType:'eb52x'},'unrelated.bin'),'.eb52x');
});
test('download selection prefers the task identity over an unrelated last file-update event',()=>{
 const {a}=algorithms(),right={id:'job-file',name:'right.eb52x',isEncrypted:true},wrong={id:'event-file',name:'wrong.eb52x',isEncrypted:true};assert.equal(a.selectDownloaded([right,wrong],{fileInfo:right},{fileId:wrong.id}),right);
 assert.equal(a.selectDownloaded([right,wrong],{conditions:[{details:{files:[{fileId:right.id}]}}]},{fileId:wrong.id}),right);
});
test('known extension excludes wrong-type IDs, basename matches and last-file fallbacks',()=>{
 const {a}=algorithms(),wrong={id:'wrong',name:'report.bin',isEncrypted:true,isNew:true},job={fileInfo:{id:'wrong'},conditions:[{details:{fileExtension:'eb52x'}}]};assert.equal(a.selectDownloaded([wrong],job,{serverFileName:'report.eb52x'}),null);
 const right={id:'right',name:'report.EB52X',isEncrypted:true};assert.equal(a.selectDownloaded([wrong,right],job,{serverFileName:'report.bin'}),right);
});
function jobContext(extra={}){const {c,a}=algorithms(extra);c.log=()=>{};c.masterAllowed=()=>true;c.__cor3MasterGate={snapshot:()=>({generation:1})};c.state={abortFlag:false};return {c,a};}
test('retained job planner actually delegates to the v2.0.4 algorithm for legacy payloads',()=>{
 const {c}=jobContext();vm.runInContext(jobSource.slice(jobSource.indexOf('  function findBestSoftwareForAbility('),jobSource.indexOf('  function getServerTypeName(')),c);
 const p=c.findBestSoftwareForAbility(loadout(),[{sw,spec:sw.specs[0]}],'DECRYPT',15,'.eb52x');assert.equal(p.switchCost,0);assert.equal(p.softwareId,sw.id);
});
test('retained folder matching uses the task type and never picks an unrelated file',()=>{
 const {c}=jobContext();vm.runInContext(jobSource.slice(jobSource.indexOf('  function findFileInFolder('),jobSource.indexOf('  function createFileUpdateListener(')),c);
 assert.equal(c.findFileInFolder({data:{files:[{id:'x',name:'wrong.bin',isNew:true}]}},{conditions:[{fileExtension:'eb52x'}]},'x','wrong.bin',null),null);
});
test('post-equip analysis waits for propagation and registers the reply before sending',async()=>{
 const replies=[{data:{canDecrypt:false,decryptPower:45}},{data:{canDecrypt:false,decryptPower:45}},{data:{canDecrypt:true}}],delays=[];let pending=null,sends=0;
 const {c}=jobContext({delay:async ms=>delays.push(ms),waitForEvent:()=>new Promise(r=>pending=r),sendCmd:()=>{sends++;assert.ok(pending);const r=pending;pending=null;r(replies.shift());}});
 vm.runInContext(jobSource.slice(jobSource.indexOf('  async function readDecryptAnalysis('),jobSource.indexOf('  async function tryLoadoutSwapForError(')),c);
 assert.equal((await c.readDecryptAnalysis('file',3)).canDecrypt,true);assert.equal(sends,3);assert.deepEqual(delays,[700,700]);
});
test('unknown analysis remains unknown instead of becoming successful',async()=>{
 const {c}=jobContext({delay:async()=>{},waitForEvent:async()=>({error:{message:'offline'}}),sendCmd(){}});vm.runInContext(jobSource.slice(jobSource.indexOf('  async function readDecryptAnalysis('),jobSource.indexOf('  async function tryLoadoutSwapForError(')),c);assert.equal(await c.readDecryptAnalysis('file',3),null);
});
test('an analysis response from a revoked generation cannot trigger a new loadout',async()=>{
 let epoch=1;const {c}=jobContext({delay:async()=>{},waitForEvent:async()=>{epoch++;return {data:{canDecrypt:true}};},sendCmd(){}});c.__cor3MasterGate.snapshot=()=>({generation:epoch});vm.runInContext(jobSource.slice(jobSource.indexOf('  async function readDecryptAnalysis('),jobSource.indexOf('  async function tryLoadoutSwapForError(')),c);await assert.rejects(c.readDecryptAnalysis('file',3),/SCOPE_REVOKED/);
});
function decryptFlow(extra={}){
 const actions=[],{c}=jobContext({delay:async()=>{},humanDelay:()=>1,readDecryptAnalysis:async()=>({canDecrypt:true}),ensureDecryptOnlyLoadout:async()=>actions.push('equip'),ensureDecryptSolverEnabled:()=>{},ensureIceWallSolverEnabled:()=>{},ensureSimpleDecryptSolverEnabled:()=>{},sendCmd:cmd=>actions.push(cmd),waitForMinigameOrError:async()=>({}),waitForHackToBeDone:async()=>actions.push('solver'),stepCompleteJob:async()=>({credits:100}),...extra});
 vm.runInContext(jobSource.slice(jobSource.indexOf('  async function runDecryptFlow('),jobSource.indexOf('  function findFileInFolder(')),c);return {c,actions};
}
test('already decryptable files retain the current gear and run the solver',async()=>{const f=decryptFlow();assert.equal((await f.c.runDecryptFlow('file','file.eb52x',{})).credits,100);assert.ok(!f.actions.includes('equip'));assert.deepEqual(f.actions,['decrypt.file','solver']);});
test('known decoded files complete without gear changes or opening a minigame',async()=>{const f=decryptFlow();await f.c.runDecryptFlow('file','file.eb52x',{},false);assert.deepEqual(f.actions,[]);});
test('insufficient power is re-read after the plan and cannot masquerade as an already decoded file',async()=>{
 let calls=0;const f=decryptFlow({readDecryptAnalysis:async()=>{calls++;return {canDecrypt:false,decryptPower:0};}});await assert.rejects(f.c.runDecryptFlow('file','file.eb52x',{}),/POWER_INSUFFICIENT/);assert.equal(calls,2);assert.deepEqual(f.actions,['equip']);
});
test('decrypt flow cannot continue a previous generation even if a late analysis says ready',async()=>{
 let epoch=1;const f=decryptFlow({readDecryptAnalysis:async()=>{epoch++;return {canDecrypt:true};}});f.c.__cor3MasterGate.snapshot=()=>({generation:epoch});await assert.rejects(f.c.runDecryptFlow('file','file.eb52x',{}),/SCOPE_REVOKED/);assert.equal(f.actions.length,0);
});
test('the actual loadout adapter verifies all four slots and no longer references undefined changed',async()=>{
 const f=physicalPorts(),{c,a}=jobContext({getLoadoutData:f.ports.read,delay:f.ports.sleep,invalidateLoadoutCache(){},waitForEvent:()=>{throw Error('unexpected');}});c.__cor3MasterGate={snapshot:()=>({generation:7})};
 const real=a.executeOwned;let called=0;c.Cor3LoadoutAlgorithms={...a,executeOwned:async(h,ids,p)=>{called++;return real(h,ids,{...p,command:f.ports.command});}};
 vm.runInContext(jobSource.slice(jobSource.indexOf('  async function applyLoadoutChange('),jobSource.indexOf('  async function ensureLoadoutForJob(')),c);assert.ok(a.targetMatches(await c.applyLoadoutChange(f.data,target(),[sw.id]),target(),[sw.id]));assert.equal(called,1);
});
test('all packages load algorithms before the retained runtime, without new browser permissions',()=>{
 const m=JSON.parse(source('manifest.json')),main=m.content_scripts.find(x=>x.js.includes('content-early.js'));assert.ok(main.js.indexOf('loadout-algorithms.js')<main.js.indexOf('content-early.js'));assert.deepEqual(m.permissions,['storage','scripting','activeTab','tabs','alarms',...(m.side_panel?['sidePanel']:[])]);assert.ok(!m.web_accessible_resources.some(x=>x.resources.includes('loadout-algorithms.js')));
});
test('the retained network diagnostic uses the same verified apply service and listens before sending',async()=>{
 const early=source('content-early.js'),f=physicalPorts();let waiting=null;
 const {c,a}=jobContext({cor3AutomationAllowed:()=>true,setTimeout:fn=>fn(),waitForDevTcMsg:(_type,_ms,predicate)=>new Promise(resolve=>waiting={resolve,predicate})});
 const emit=r=>{assert.ok(waiting,'response listener must precede command');assert.ok(waiting.predicate(r));const {resolve}=waiting;waiting=null;resolve(r);};
 c.__cor3AutoJobRequestLoadout=()=>emit({action:'get.options',data:copy(f.data)});
 for(const [name,cmd] of [['UnequipSoftware','loadout.unequip.software'],['EquipHardware','loadout.equip.hardware'],['EquipSoftware','loadout.equip.software']])c['__cor3AutoJob'+name]=id=>{void f.ports.command({cmd,id,slot:f.data.ownedHardware.find(x=>x.id===id)?.category.toLowerCase()}).then(r=>emit({action:cmd.slice(8),...r}));};
 vm.runInContext(early.slice(early.indexOf('          function applyDevTcLoadout('),early.indexOf('          function loginToServer(')),c);
 assert.ok(a.targetMatches(await c.applyDevTcLoadout(f.data,target(),[sw.id]),target(),[sw.id]));assert.equal(f.commands.length,5);
});
test('network diagnostic plans against the observed server power instead of treating zero as sufficient',async()=>{
 const early=source('content-early.js'),d=loadout();d.ownedSoftware=[{...sw,id:'hack',specs:[{type:'HACK',power:[10,50],serverTypes:['TEST']}]}];d.equippedSoftware=d.ownedSoftware;let pending=null,selected=null;
 const {c}=jobContext({cor3AutomationAllowed:()=>true,devTcRequiredPowers:new Map([['server',45]]),getServerTypeName:()=> 'TEST',addLog2(){},waitForDevTcMsg:()=>new Promise(r=>pending=r),applyDevTcLoadout:async(_loadout,h,ids)=>{selected={h,ids};}});
 c.__cor3AutoJobRequestLoadout=()=>{assert.ok(pending);pending({data:d});};
 vm.runInContext(early.slice(early.indexOf('          function ensureDevTcHackLoadout('),early.indexOf('          function applyDevTcLoadout(')),c);assert.equal(await c.ensureDevTcHackLoadout('server','Server'),true);assert.equal(selected.h.cpu.id,cpu2.id);assert.equal(selected.h.gpu.id,gpu2.id);
});
test('completion recovery refreshes the row, waits, and limits reopens to two',async()=>{
 const {a}=algorithms(),events=[];let attempts=0;
 const reward=await a.completeDecrypted({check(){},knownDecoded:false,complete:async()=>{events.push('complete');if(++attempts<4)throw Error('job-conditions-not-met');return {credits:1};},reopen:async()=>events.push('reopen'),refresh:async()=>events.push('refresh'),sleep:async ms=>events.push(ms)});
 assert.equal(reward.credits,1);assert.equal(events.filter(x=>x==='reopen').length,2);assert.equal(events.filter(x=>x==='refresh').length,3);assert.equal(events.filter(x=>x===3000).length,3);assert.equal(attempts,4);
});
test('a known decoded file retries stale completion conditions without reopening the game',async()=>{
 const {a}=algorithms();let n=0,reopens=0,refreshes=0;await a.completeDecrypted({check(){},knownDecoded:true,complete:async()=>{if(n++===0)throw Error('job-conditions-not-met');return {credits:1};},reopen:async()=>reopens++,refresh:async()=>refreshes++,sleep:async()=>{}});assert.equal(reopens,0);assert.equal(refreshes,1);
});
test('lost completion acknowledgements, expired sessions and stale IDs are never blindly retried',async()=>{
 const {a}=algorithms();for(const message of ['Timeout waiting for completed','token expired','job-not-found']){let n=0;await assert.rejects(a.completeDecrypted({check(){},complete:async()=>{n++;throw Error(message);},reopen:async()=>assert.fail('reopen'),refresh:async()=>assert.fail('refresh'),sleep:async()=>assert.fail('sleep')}));assert.equal(n,1);}
});
test('a revoked scope interrupts completion recovery before a new request',async()=>{
 const {a}=algorithms();let valid=true,refreshes=0;await assert.rejects(a.completeDecrypted({check(){if(!valid)throw Error('revoked');},complete:async()=>{throw Error('job-conditions-not-met');},reopen:async()=>{valid=false;},refresh:async()=>refreshes++,sleep:async()=>{}}),/revoked/);assert.equal(refreshes,0);
});
test('the actual decoded-file flow refreshes legacy job conditions before completing again',async()=>{
 const job={jobId:'job-1',marketId:'market-1',conditions:[],canComplete:false};let completions=0;
 const f=decryptFlow({getMarketNameById:()=> 'HOME',waitForEvent:async(type,_ms,predicate)=>{assert.equal(type,'COR3_WS_MARKET');const r={market:{recentJobs:[{id:'job-1',conditions:{items:[{type:'DecryptFile',details:{fileExtension:'eb52x'}}]},canComplete:true}]}};assert.ok(predicate(r));return r;},stepCompleteJob:async()=>{completions++;if(!job.canComplete)throw Error('job-conditions-not-met');return {credits:100};}});
 assert.equal((await f.c.runDecryptFlow('file','file.eb52x',job,false)).credits,100);assert.equal(completions,2);assert.equal(job.conditions[0].type,'DecryptFile');assert.deepEqual(f.actions,['get.jobs']);
});
