import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../extension/center-store.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));};
function fixture(){
 let b={id:7,tabId:7,accountId:'FREEL_FF000009-0009',documentId:'doc-a'},hold=null,fail=false,receive;
 const data={},writes=[];
 const raw={
  get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]])),
  set:async patch=>{writes.push(patch);if(hold)await hold;if(fail){fail=false;throw Error('synthetic failure');}Object.assign(data,patch);},
  remove:async keys=>{for(const k of keys)delete data[k];}
 };
 const binding={
  snapshot:()=>b,isCurrent:x=>x===b,resolve:async()=>b,
  matchesTopFrame:(sender,doc,expected)=>sender?.id==='fixture'&&sender.tab?.id===expected.tabId&&sender.frameId===0&&doc===expected.documentId,
  guard:async(_id,fn,expected)=>{if(b!==expected)throw Error('stale');const result=await fn();if(b!==expected)throw Error('stale');return result;}
 };
 const runtime={id:'fixture',getURL:p=>'ext:///'+p,onMessage:{addListener(fn){receive=fn;}}};
 const c=vm.createContext({chrome:{runtime,storage:{local:raw,onChanged:{addListener(){},removeListener(){}}}},Cor3CenterBinding:binding,URL});
 vm.runInContext(source,c);
 return {
  store:c.Cor3CenterStore,data,writes,key:k=>'center:FREEL_FF000009-0009:'+k,
  hold(){let release;hold=new Promise(r=>release=r);return ()=>{hold=null;release();};},
  fail:()=>fail=true,
  reload:()=>{b={...b,documentId:'doc-reloaded'};},
  revoke:()=>b={id:9,tabId:9,accountId:'FREEL_FF00000A-000A',documentId:'doc-b'},
  reconcile(documentId=b.documentId){
   return new Promise(resolve=>receive({type:'cor3-center-store',op:'reconcileJobs',documentId},
    {id:'fixture',tab:{id:b.tabId,url:'https://cor3.gg/'},url:'https://cor3.gg/',frameId:0},resolve));
  }
 };
}

test('actual store serializes overlapping writes and reads see the final values',async()=>{const f=fixture(),release=f.hold();const first=f.store.set({autoDailyHackEnabled:true}),second=f.store.set({panelOpen:true});await flush();assert.equal(f.writes.length,1);release();await Promise.all([first,second]);const result=await f.store.get(['autoDailyHackEnabled','panelOpen']);assert.equal(result.autoDailyHackEnabled,true);assert.equal(result.panelOpen,true);});
test('atomic nested settings patches preserve fields from concurrent popup/background updates',async()=>{const f=fixture();await f.store.set({autoDrone:{enabled:true,priority:['a']}});await Promise.all([f.store.update('autoDrone',{paused:true}),f.store.update('autoDrone',{repairEnabled:true})]);const cfg=(await f.store.get('autoDrone')).autoDrone;assert.equal(cfg.enabled,true);assert.equal(cfg.paused,true);assert.equal(cfg.repairEnabled,true);assert.equal(cfg.priority[0],'a');});
test('failed writes do not poison the queue, and reserved keys remain rejected',async()=>{const f=fixture();f.fail();await assert.rejects(f.store.set({panelOpen:true}));await f.store.set({autoDailyHackEnabled:false});assert.equal((await f.store.get('autoDailyHackEnabled')).autoDailyHackEnabled,false);for(const key of ['helperMode','center:other:key'])await assert.rejects(f.store.update(key,{enabled:true}));});
test('queued old-document mutations cannot spill into the next account',async()=>{const f=fixture(),release=f.hold();const first=f.store.set({panelOpen:true}),second=f.store.set({autoDailyHackEnabled:false});await flush();f.revoke();release();await assert.rejects(first);await assert.rejects(second);assert.equal(f.writes.length,1);assert.ok(!Object.keys(f.data).some(k=>k.includes('22222222')));});
test('a lost read reply expires the shared flight and allows a fresh read without replaying writes',async()=>{
 const calls=[],timers=new Map();let serial=0;
 const c=vm.createContext({setTimeout:(fn,ms)=>{assert.equal(ms,10000);timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),chrome:{runtime:{sendMessage:m=>new Promise(resolve=>calls.push({m,resolve}))},storage:{local:{},onChanged:{addListener(){}}}}});
 vm.runInContext(source,c);const store=c.Cor3CenterStore;
 const a=assert.rejects(store.get(['one','two']),/CENTER_STORE_TIMEOUT/),b=assert.rejects(store.get(['two','one']),/CENTER_STORE_TIMEOUT/);
 assert.equal(calls.length,1);timers.values().next().value();await Promise.all([a,b]);
 const retry=store.get(['one','two']);assert.equal(calls.length,2);calls[1].resolve({ok:true,value:{one:'latest'}});
 assert.equal((await retry).one,'latest');calls[0].resolve({ok:true,value:{one:'stale'}});await flush();assert.equal(timers.size,0);
 const write=store.set({one:true});assert.equal(timers.size,0);assert.equal(calls.filter(x=>x.m.op==='set').length,1);calls[2].resolve({ok:true,value:{}});await write;
});

test('a confirmed new page clears a legacy market batch flag without deleting results or preferences',async()=>{
 const f=fixture();
 f.data[f.key('autoJobsRunning')]=true;
 f.data[f.key('autoJobsQueue')]=['pending-job'];
 f.data[f.key('autoJobsTracker')]=['previous-result'];
 f.data[f.key('autoMarketJobsSeenV1')]={home:{reset:'already-covered'}};
 f.data[f.key('autoRunMarketJobsEnabled')]=true;
 const result=await f.reconcile();
 assert.equal(result.ok,true);
 assert.equal(result.value.cleared,true);
 assert.equal(f.data[f.key('autoJobsRunning')],false);
 assert.deepEqual(Array.from(f.data[f.key('autoJobsQueue')]),[]);
 assert.deepEqual(f.data[f.key('autoJobsTracker')],['previous-result']);
 assert.equal(f.data[f.key('autoMarketJobsSeenV1')].home.reset,'already-covered');
 assert.equal(f.data[f.key('autoRunMarketJobsEnabled')],true);
 assert.equal((await f.reconcile()).value.cleared,false);
 assert.equal(f.writes.length,1);
});

test('market flag reconciliation cannot discard a current-page admission or write from a revoked document',async()=>{
 const f=fixture(),release=f.hold();
 const reserve=f.store.set({autoJobsRunning:true,autoJobsQueue:['new-job']});
 const reconcile=f.reconcile();
 await flush();
 assert.equal(f.writes.length,1);
 release();
 await reserve;
 assert.equal((await reconcile).value.cleared,false);
 assert.equal(f.data[f.key('autoJobsRunDocumentId')],'doc-a');
 f.reload();
 assert.equal((await f.reconcile('doc-a')).ok,false);
 assert.equal(f.data[f.key('autoJobsRunning')],true);
 assert.equal((await f.reconcile()).value.cleared,true);
 assert.equal(f.data[f.key('autoJobsRunning')],false);
});
