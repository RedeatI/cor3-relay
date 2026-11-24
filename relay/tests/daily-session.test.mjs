import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
const main=src('content-early.js'),content=src('content.js');
const session=main.slice(main.indexOf('  var _capturedBearerToken'),main.indexOf('  var pendingRetryOps'));
const tokenHandler=content.slice(content.indexOf('      // A startup notification'),content.indexOf('      if (event.data && event.data.type === "COR3_WEB_VERSION")'));
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));};
function fixture(){
 let allowed=false,doc='first-document',listener=null;const data={},requests=[],messages=[],logs=[];
 const w={__cor3MasterGate:{onReady(f){this.ready=f}},postMessage(m){messages.push(m);if(listener)queueMicrotask(()=>listener({origin:'https://cor3.gg',data:m}));}};
 const c=vm.createContext({AbortSignal,window:w,location:{origin:'https://cor3.gg'},cor3AutomationAllowed:()=>allowed,
  networkScope:()=>({accountId:'FREEL_FF000001-0001',documentId:doc}),Cor3CenterIdentity:{snapshot:()=>({accountId:'FREEL_FF000001-0001',documentId:doc})},
  Cor3CenterStore:{async get(){return {...data}},async set(v){Object.assign(data,v)},async remove(k){delete data[k]}},
  postDailyHackDiag:(step,message)=>logs.push({step,message}),
  fetch:async(url,opts)=>{requests.push({url,authorized:typeof opts.headers.Authorization==='string'});return{ok:true,json:async()=>({hasClaimedToday:true,currentStreak:2})}},
  trackedSockets:[],OrigWebSocket:{OPEN:1},Date,Error,Promise
 });
 vm.runInContext(content.slice(content.indexOf('  let dailySession'),content.indexOf('  const runtimeLog=')),c);vm.runInContext(session,c);vm.runInContext('function receive(event){'+tokenHandler+'}',c);
 const start=main.indexOf('  window.__cor3MasterGate.onReady(() => {');const end=main.indexOf('  // src/content-early/index.js',start);vm.runInContext(main.slice(start,end),c);
 return{c,w,data,logs,requests,messages,listen:()=>listener=c.receive,allow:()=>allowed=true,deny:()=>allowed=false,changeDoc:()=>doc='next-document'};
}
test('early session event lost before the isolated listener is recovered after verified account ready',async()=>{
 const f=fixture();vm.runInContext('setCapturedBearerToken("Bearer synthetic-fixture-only")',f.c);
 // The listener and account admission are deliberately later than the initial capture.
 assert.equal(f.data.bearerToken,undefined);f.listen();f.allow();f.w.__cor3MasterGate.ready();await flush();
 assert.equal(f.data.sessionAuthDocumentId,'first-document');assert.ok(Number.isFinite(f.data.sessionAuthReadyAt));
 assert.equal(f.data.dailyOpsData.hasClaimedToday,true);assert.equal(f.requests.length,1);
 assert.ok(f.logs.some(e=>e.step==='session.ready'));assert.ok(!JSON.stringify(f.logs).includes('synthetic-fixture'));
});

const dailySolver=src('daily-hack-solver.js');
test('Daily selector waits count time spent with the browser minimized',async()=>{
 const code=dailySolver.slice(dailySolver.indexOf('    async function waitForEl('),dailySolver.indexOf('    // --- Click helper'));
 let now=0,wakes=0;
 const ctx=vm.createContext({Date:{now:()=>now},assertActive(){},document:{querySelector:()=>null},
   sleep:async()=>{now+=60000;wakes++;}});
 assert.equal(await vm.runInContext(code+';waitForEl("button",5000)',ctx),null);
 assert.equal(wakes,1);
});
function logPuzzleFixture(rows, limit=2, succeed=true) {
  let now=0,confirmations=0,scans=0,closed=0;
  const entries=rows.map(text=>{
    const line={textContent:text},box={checked:false,disabled:false,click(){this.checked=!this.checked;}};
    return {box,querySelector(sel){return sel==='.log-line'?line:box;},contains(el){return el===box;}};
  });
  const result=succeed===null ? null : {classList:{contains:()=>succeed},textContent:succeed?'Success':'Failed'};
  const button={disabled:false},analysis={querySelectorAll(){return rows.slice(2).map(text=>({
    querySelector:sel=>sel==='.log-line-display'?{textContent:text}:{}
  }));}};
  const panel={textContent:'Select '+limit+' log entries that contain format violations.',isConnected:true,
    querySelector(sel){return ({'.log-entries':{},'.confirm-button':button,'.result-title':result})[sel]||null;},
    querySelectorAll(sel){if(sel.includes('input:checked'))return [];return now<14000?entries.slice(0,2):entries;}
  };
  const ctx=vm.createContext({Date:{now:()=>now},panel,document:{querySelectorAll:()=>[{...panel,querySelector:s=>s.includes('ApplicationTitleText')?{textContent:'System Log Integrity'}:panel.querySelector(s)}]},
    masterAllowed:()=>true,assertActive(){},sleep:async ms=>{now+=ms;},diag(){},hlog(){},selectorInfo:()=>({}),findErrorTypeButton:()=>({}),console:{log(){}},
    click(el){if(el===button)confirmations++;else if(el?.scan)scans++;},
    waitForEl:async selector=>selector==='.analysis-container'?analysis:selector==='.scan-button'?{scan:true}:result,
    closeAppWindows:async()=>{closed++;}});
  const part=(start,end)=>dailySolver.slice(dailySolver.indexOf(start),dailySolver.indexOf(end,dailySolver.indexOf(start)));
  vm.runInContext(part('    const VALID_TYPES','    function findErrorTypeButton')+part('    function logTaskWindow','    // Detect puzzle type'),ctx);
  return {run:()=>vm.runInContext('solveSystemLogIntegrityFull()',ctx),state:()=>({now,confirmations,scans,closed,checked:entries.filter(x=>x.box.checked).length})};
}
const earlyValid=['[00:01:00] SCAN /sector=12 /status=OK','[10:11:12] PING /sector=19 /status=WARN'];
const lateInvalid=['[01:20:40] PING /status=OK','[02:00:02] ROUTE-CHCEK /sector=289 /status=ERROR'];
test('Daily resumes an open log list and waits for both late errors',async()=>{
 const f=logPuzzleFixture([...earlyValid,...lateInvalid]);assert.equal(await f.run(),true);
 assert.equal(f.state().checked,2);assert.equal(f.state().scans,1);assert.ok(f.state().now>=14000);
});
test('Daily never submits incomplete or ambiguous log selections',async()=>{
 for(const tail of [[lateInvalid[0]],[...lateInvalid,...lateInvalid]]){
   const f=logPuzzleFixture([...earlyValid,...tail]);assert.equal(await f.run(),false);
   assert.equal(f.state().checked,0);assert.equal(f.state().confirmations,0);
 }
});
test('Daily requires a confirmed successful game result',async()=>{
 const f=logPuzzleFixture([...earlyValid,...lateInvalid],2,false);assert.equal(await f.run(),false);assert.equal(f.state().closed,0);
});
test('A submitted Daily with no result leaves its windows alone and asks for claim verification',async()=>{
 const f=logPuzzleFixture([...earlyValid,...lateInvalid],2,null);assert.equal(await f.run(),'verify-claim');assert.equal(f.state().scans,1);assert.equal(f.state().closed,0);
});
test('The scheduler confirms a missing Daily result from the account claim before marking success',()=>{
 const block=content.slice(content.indexOf('  function handleDailyHackRunFinished'),content.indexOf('  function autoStartDailyHackOnLoad'));
 for (const claimed of [true,false]) {
  const statuses=[],reasons=[];
  const ctx=vm.createContext({dailyEpoch:()=>1,dailyValid:()=>true,cor3AutomationAllowed:()=>true,releaseDailyHackLock(){},
   setDailyHackResult:(s)=>statuses.push(s),Cor3CenterStore:{get:(keys,cb)=>cb({autoDailyHackEnabled:true}),set(){}},
   withDailyToken:cb=>cb('synthetic',()=>true),fetchDailyClaimState:(_,cb)=>cb(null,{hasClaimedToday:claimed}),
   scheduleDailyHackFromData:(d,r)=>reasons.push(r),scheduleDailyHackCheck:(_,r)=>reasons.push(r),DAILY_HACK_FALLBACK_DELAY_MS:1000,DAILY_HACK_RETRY_DELAY_MS:500});
  vm.runInContext(block+';handleDailyHackRunFinished({success:false,reason:"verify_claim"})',ctx);
  assert.deepEqual(statuses,claimed?['pending','success']:['pending']);assert.deepEqual(reasons,claimed?['success']:['claim_unconfirmed']);
 }
});
test('paused session replay publishes no credential and cannot write account state',async()=>{
 const f=fixture();f.listen();vm.runInContext('setCapturedBearerToken("Bearer synthetic-fixture-only")',f.c);
 f.w.__cor3MasterGate.ready();await flush();assert.equal(f.messages.length,0);assert.deepEqual(f.data,{});
});
test('foreign origins and document changes cannot fetch or update the new account',async()=>{
 const f=fixture();f.allow();f.c.receive({origin:'https://example.invalid',data:{type:'COR3_BEARER_TOKEN',token:'Bearer synthetic-fixture-only'}});await flush();assert.equal(f.requests.length,0);
 let release;f.c.Cor3CenterStore.get=()=>new Promise(r=>release=r);
 f.c.receive({origin:'https://cor3.gg',data:{type:'COR3_BEARER_TOKEN',token:'Bearer synthetic-fixture-only'}});f.changeDoc();release({});await flush();assert.deepEqual(f.data,{});assert.equal(f.requests.length,0);
});
test('same session replay refreshes missing data once per document instead of once per browser lifetime',async()=>{
 const f=fixture();f.listen();f.allow();vm.runInContext('setCapturedBearerToken("Bearer synthetic-fixture-only")',f.c);
 f.w.__cor3MasterGate.ready();await flush();f.w.__cor3MasterGate.ready();await flush();assert.equal(f.requests.length,1);
 f.changeDoc();f.w.__cor3MasterGate.ready();await flush();assert.equal(f.requests.length,2);
});

test('a burst of session notifications shares one Daily read and replaces old credentials with a page-only session',async()=>{
 const f=fixture();f.data.bearerToken='Bearer synthetic-old';f.allow();f.listen();
 for(let i=0;i<12;i++)f.c.receive({origin:'https://cor3.gg',data:{type:'COR3_BEARER_TOKEN',token:'Bearer synthetic-current'}});
 await flush();assert.equal(f.requests.length,1);assert.equal(f.data.bearerToken,undefined);
 assert.ok(!JSON.stringify(f.data).includes('Bearer'));assert.equal(f.logs.filter(x=>x.step==='session.ready').length,1);
 f.changeDoc();let token;f.c.withDailyToken(value=>token=value);assert.equal(token,null);
});
test('a late Daily response from a replaced session cannot overwrite the new one',async()=>{
 const f=fixture();f.allow();let release;
 f.c.fetch=(_url,options)=>options.headers.Authorization.endsWith('old')?new Promise(resolve=>release=resolve):
  Promise.resolve({ok:true,json:async()=>({hasClaimedToday:true,currentStreak:9})});
 const notify=label=>f.c.receive({origin:'https://cor3.gg',data:{type:'COR3_BEARER_TOKEN',token:'Bearer synthetic-'+label}});
 notify('old');await flush();notify('new');await flush();
 release({ok:true,json:async()=>({hasClaimedToday:false,currentStreak:1})});await flush();
 assert.equal(f.data.dailyOpsData.currentStreak,9);
});

test('a failed Daily read observes its retry deadline; the next admitted notification can recover',async()=>{
 const f=fixture();f.allow();let clock=0,reads=0;
 f.c.performance={now:()=>clock};
 f.c.AbortSignal={timeout:ms=>{assert.equal(ms,15000);return AbortSignal.abort();}};
 f.c.fetch=async(_url,options)=>{reads++;assert.ok(options.signal.aborted);if(reads===1)throw Error('timeout');return {ok:true,json:async()=>({hasClaimedToday:false})};};
 const notify=()=>f.c.receive({origin:'https://cor3.gg',data:{type:'COR3_BEARER_TOKEN',token:'Bearer synthetic-current'}});
 notify();await flush();clock=59999;notify();await flush();assert.equal(reads,1);assert.equal(f.data.dailyOpsData,undefined);
 clock=60000;notify();await flush();assert.equal(reads,2);assert.equal(f.data.dailyOpsData.hasClaimedToday,false);
});
