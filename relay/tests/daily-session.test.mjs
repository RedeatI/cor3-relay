import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
const main=src('content-early.js'),content=src('content.js');
const session=main.slice(main.indexOf('  var _capturedBearerToken'),main.indexOf('  var pendingRetryOps'));
const tokenHandler=content.slice(content.indexOf('      // A startup notification'),content.indexOf('      if (event.data && event.data.type === "COR3_WEB_VERSION")'));
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));};
function fixture(){
 let allowed=false,doc='first-document',listener=null;const data={},requests=[],messages=[],logs=[];
 const w={__cor3MasterGate:{onReady(f){this.ready=f}},postMessage(m){messages.push(m);if(listener)queueMicrotask(()=>listener({origin:'https://cor3.gg',data:m}));}};
 const c=vm.createContext({window:w,location:{origin:'https://cor3.gg'},cor3AutomationAllowed:()=>allowed,
  Cor3CenterIdentity:{snapshot:()=>({documentId:doc})},
  Cor3CenterStore:{async get(){return {...data}},async set(v){Object.assign(data,v)}},
  postDailyHackDiag:(step,message)=>logs.push({step,message}),
  fetch:async(url,opts)=>{requests.push({url,authorized:typeof opts.headers.Authorization==='string'});return{ok:true,json:async()=>({hasClaimedToday:true,currentStreak:2})}},
  trackedSockets:[],OrigWebSocket:{OPEN:1},Date,Error,Promise
 });
 vm.runInContext(session,c);vm.runInContext('function receive(event){'+tokenHandler+'}',c);
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
