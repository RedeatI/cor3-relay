import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{bridge,src,flush,seedLarge}from'./optimization-fixture.mjs';
test('eight store subscribers share one raw listener and one scoped query per change',async()=>{const f=bridge(),seen=[];for(let i=0;i<8;i++)f.store.onChanged.addListener(c=>seen.push(c));assert.equal(f.stats.pageListeners,1);await f.emit({[f.key('panelOpen')]:{newValue:true}});assert.equal(f.stats.messages.filter(m=>m.op==='scope').length,1);assert.equal(seen.length,8);});
test('subscriber failures and mutations cannot affect the next subscriber or another account',async()=>{const f=bridge(),seen=[];f.store.onChanged.addListener(c=>{c.panelOpen.newValue.value=99;throw Error('listener');});f.store.onChanged.addListener(c=>seen.push(c.panelOpen.newValue.value));await f.emit({[f.key('panelOpen')]:{newValue:{value:1}}});assert.deepEqual(seen,[1]);await f.emit({'center:FREEL_FF00000C-000C:panelOpen':{newValue:true}});assert.equal(seen.length,1);});
test('scope changes during event lookup cannot deliver a former account change',async()=>{const f=bridge(),seen=[];f.store.onChanged.addListener(c=>seen.push(c));const p=f.emit({[f.key('panelOpen')]:{newValue:true}});f.change();await p;assert.equal(seen.length,0);});
test('concurrent identical reads coalesce but each caller receives an independent copy',async()=>{const f=bridge();f.seed({owned:{ids:['one']}});const reads=await Promise.all(Array.from({length:10},()=>f.store.get('owned')));assert.equal(f.stats.messages.filter(m=>m.op==='get').length,1);reads[0].owned.ids.push('mutation');assert.equal(reads[1].owned.ids.length,1);await f.store.get('owned');assert.equal(f.stats.messages.filter(m=>m.op==='get').length,2);});
test('coalescing cannot merge the unbound global helper preference read with a scoped array read',async()=>{const f=bridge();f.data.helperMode=false;f.unbind();const result=await Promise.allSettled([f.background.Cor3CenterStore.get('helperMode'),f.background.Cor3CenterStore.get(['helperMode'])]);assert.equal(result[0].status,'fulfilled');assert.equal(result[0].value.helperMode,false);assert.equal(result[1].status,'rejected');});
test('a submitted write is a read-coalescing barrier',async()=>{const f=bridge();f.seed({count:1});const release=f.holdNextRead(),a=f.store.get('count');await flush();await f.store.set({count:2});const b=f.store.get('count');release();assert.equal((await a).count,1);assert.equal((await b).count,2);assert.equal(f.stats.messages.filter(m=>m.op==='get').length,2);});
test('a failed shared read is evicted so a recovered binding can read again',async()=>{const f=bridge();const release=f.holdNextRead(),a=f.store.get('count');await flush();f.change();release();await assert.rejects(a);f.seed({count:7});assert.equal((await f.store.get('count')).count,7);});
test('market cache and compact summary are saved atomically in the same account write',async()=>{const f=bridge();await f.store.set({marketData:{jobs:[{id:'a'}],recentJobs:[],nextJobsResetAt:'future'}});assert.equal(f.stats.rawSets,1);assert.equal(f.data[f.key('marketDataSummaryV1')].jobsCount,1);assert.equal((await f.store.get('marketDataSummaryV1')).marketDataSummaryV1.nextJobsResetAt,'future');});
test('older profile caches derive compact summaries without a migration write or transferring job rows',async()=>{const f=bridge();seedLarge(f);const before=f.stats.rawSets,r=await f.store.get('marketDataSummaryV1');assert.equal(r.marketDataSummaryV1.jobsCount,200);assert.ok(!JSON.stringify(r).includes('description'));assert.equal(f.stats.rawSets,before);assert.ok(f.stats.replyBytes<300);});
test('removing a market cache removes its derived summary without removing account preferences',async()=>{const f=bridge();await f.store.set({marketData:{jobs:[]},autoSendMerc:{enabled:true,maxMercCost:1234}});await f.store.remove('marketData');assert.equal(f.data[f.key('marketData')],undefined);assert.equal(f.data[f.key('marketDataSummaryV1')],undefined);assert.equal(f.data[f.key('autoSendMerc')].maxMercCost,1234);});
test('warm view reads reuse large inventories and transfer no complete market job list',async()=>{const f=bridge();seedLarge(f);const client=f.makeClient();await client.read();assert.equal(f.stats.messages.filter(m=>m.op==='get').length,1);assert.equal(f.stats.rawGets,2);f.resetStats();const views=await Promise.all([client.read().catch(e=>e),client.read()]);assert.equal(views[1].loadout.software.length,100);assert.ok(f.stats.messages.filter(m=>m.op==='get').every(m=>!m.value.includes('marketData')&&!m.value.includes('loadoutData')));assert.ok(f.stats.replyBytes<4000);});
test('inventory storage events invalidate the warm view immediately and settings are always read fresh',async()=>{const f=bridge();seedLarge(f);const client=f.makeClient();await client.read();await f.store.set({loadoutData:{ownedSoftware:[{id:'new',name:'New software'}]},loadoutUpdatedAt:2,autoSendMerc:{enabled:false,maxMercCost:9000}});await flush();const view=await client.read();assert.equal(view.loadout.software[0].id,'new');assert.equal(view.merc.maxMercCost,9000);});
test('a new document never reuses a previous account inventory or logs',async()=>{const f=bridge();seedLarge(f);const client=f.makeClient();await client.read();f.change();f.seed({loadoutData:{ownedSoftware:[{id:'other',name:'Other account'}]},loadoutUpdatedAt:1});const view=await client.read();assert.equal(view.scope.documentId,'doc-b');assert.equal(view.loadout.software.length,1);assert.equal(view.loadout.software[0].id,'other');});
test('a long task renews only on its valid ticket and cannot revive an expired lease',()=>{let at=0;const c=vm.createContext({});vm.runInContext(src('network-coordinator.js'),c);const states=[],q=c.Cor3NetworkCoordinator.create({scope:()=>({accountId:'a',documentId:'d'}),allowed:()=>true,now:()=>at,ttlMs:5000,onChange:s=>states.push(s)});let task;q.enqueue('auto-jobs',t=>task=t);for(at=100;at<=20000;at+=100){assert.equal(task.renew(),true);q.pump();assert.equal(q.snapshot().blocked,null);}assert.ok(states.length<12);at=30000;q.pump();assert.equal(task.renew(),false);assert.equal(q.snapshot().blocked,'lease-expired');});
test('burst logs persist the latest complete redacted ring rather than every growing snapshot',async()=>{const c=vm.createContext({});vm.runInContext(src('run-log.js'),c);let at=0;const saved=[],log=c.Cor3RunLog.create({scope:()=>({accountId:'a',documentId:'d'}),now:()=>at,sink:p=>saved.push(p)});for(let i=0;i<150;i++){at+=2000;log.log('queue.started','start',{token:'synthetic-secret',step:i});}await log.flush();assert.equal(saved.length,1);assert.equal(saved[0].entries.length,120);assert.ok(!JSON.stringify(saved).includes('synthetic-secret'));assert.equal(log.stats().coalesced,149);});
test('same-code diagnostics from different markets remain visible within one second',async()=>{const c=vm.createContext({});vm.runInContext(src('run-log.js'),c);const log=c.Cor3RunLog.create({scope:()=>({accountId:'a',documentId:'d'})});log.log('read.partial','failed',{market:'home'});log.log('read.partial','failed',{market:'dark'});assert.equal(log.snapshot().length,2);await log.flush();});
test('log persistence recovers from a rejected sink and discards old-document pending work',async()=>{const c=vm.createContext({});vm.runInContext(src('run-log.js'),c);let fail=true,scope={accountId:'a',documentId:'d'};const saved=[],log=c.Cor3RunLog.create({scope:()=>scope,sink:p=>{if(fail){fail=false;throw Error('quota');}saved.push(p);}});log.log('read.partial','first');await log.flush();log.log('read.partial','second');await log.flush();assert.equal(saved.length,1);log.log('read.partial','third');scope={accountId:'b',documentId:'e'};await log.flush();assert.equal(saved.length,1);assert.equal(log.stats().discarded,2);});
test('a slow log sink has bounded pending work and flush observes the latest snapshot',async()=>{const c=vm.createContext({});vm.runInContext(src('run-log.js'),c);let release,at=0;const saved=[],log=c.Cor3RunLog.create({scope:()=>({accountId:'a',documentId:'d'}),now:()=>++at,sink:async p=>{saved.push(p);if(saved.length===1)await new Promise(r=>release=r);}});log.log('page.ready','initial');await flush();for(let i=0;i<100;i++)log.log('read.partial','step '+i);assert.equal(saved.length,1);release();await log.flush();assert.equal(saved.length,2);assert.equal(saved[1].entries.at(-1).message,'step 99');});
test('an early renewal extends the actual expiry even when its redundant publication is suppressed',()=>{const c=vm.createContext({});vm.runInContext(src('network-coordinator.js'),c);let at=0,task;const q=c.Cor3NetworkCoordinator.create({scope:()=>({accountId:'a',documentId:'d'}),allowed:()=>true,now:()=>at,ttlMs:5000});q.enqueue('auto-jobs',t=>task=t);at=1000;assert.equal(task.renew(),true);assert.equal(q.snapshot().lease.expiresAt,6000);at=5500;q.pump();assert.equal(q.snapshot().blocked,null);});
test('idle market clock checks keep accurate deadlines without writing each heartbeat',async()=>{const c=vm.createContext({});vm.runInContext(src('market-refresh-clock.js'),c);let at=1800000000000;const data={autoUpdateMarkets:true},writes=[];for(const k of ['marketData','darkMarketData','soyuzMarketData','usolMarketData']){data[k+'SummaryV1']={nextJobsResetAt:new Date(at+7200000).toISOString()};data[k+'UpdatedAt']=at;}const clock=c.Cor3MarketClockFactory.create({scope:()=>({accountId:'a',documentId:'d'}),allowed:()=>true,busy:()=>false,read:async()=>structuredClone(data),write:async s=>{data.marketRefreshClockV1=s;writes.push(s);},enqueue:()=>assert.fail('not due'),now:()=>at});for(let i=0;i<20;i++){await clock.tick();at+=30000;}assert.equal(writes.length,1);});
test('the clock detects a backward jump between sparse checkpoints',async()=>{const c=vm.createContext({});vm.runInContext(src('market-refresh-clock.js'),c);let at=1800000000000;const data={},writes=[];for(const k of ['marketData','darkMarketData','soyuzMarketData','usolMarketData'])data[k+'SummaryV1']={nextJobsResetAt:new Date(at+7200000).toISOString()};const clock=c.Cor3MarketClockFactory.create({scope:()=>({accountId:'a',documentId:'d'}),allowed:()=>true,busy:()=>false,read:async()=>data,write:async s=>{data.marketRefreshClockV1=s;writes.push(s);},enqueue(){},now:()=>at});await clock.tick();at+=300000;await clock.tick();at-=180000;await clock.tick();assert.equal(writes.at(-1).reason,'clock-backward');});

test('unrelated account and browser preference changes do not start a scope probe',async()=>{
 const f=bridge();const seen=[];f.store.onChanged.addListener(event=>seen.push(event));
 await f.emit({'center:FREEL_FF00000C-000C:panelOpen':{newValue:true},cor3RelayUiLanguage:{newValue:'en'}});
 assert.equal(f.stats.messages.length,0);assert.equal(seen.length,0);
 await f.emit({[f.key('panelOpen')]:{newValue:true}});
 assert.equal(f.stats.messages.filter(m=>m.op==='scope').length,1);assert.equal(seen.length,1);
});

test('concurrent log writers open one database and an obsolete close cannot evict its replacement',async()=>{
 const opens=[];
 const c={indexedDB:{open(){const request={};opens.push(request);return request;}},console:{log(){}}};
 vm.runInNewContext(src('ws-messages.js'),c);
 const burst=Array.from({length:20},()=>c._wsOpenDb());assert.equal(opens.length,1);
 const fake=()=>({objectStoreNames:{contains:()=>true},close(){}});
 const a=fake();opens[0].onsuccess({target:{result:a}});assert.ok((await Promise.all(burst)).every(db=>db===a));
 a.onversionchange();const failed=c._wsOpenDb();opens[1].onerror({target:{error:Error('database busy')}});await assert.rejects(failed);
 const next=c._wsOpenDb(),b=fake();opens[2].onsuccess({target:{result:b}});await next;
 a.onclose();assert.equal(await c._wsOpenDb(),b);assert.equal(opens.length,3);
});

test('an idle background queue needs no DOM busy checks on the heartbeat',()=>{
 const c=vm.createContext({});vm.runInContext(src('network-coordinator.js'),c);
 let scans=0,started=false,busy=true;
 const q=c.Cor3NetworkCoordinator.create({scope:()=>({accountId:'a',documentId:'d'}),allowed:()=>true,blocked:()=>{scans++;return busy;}});
 for(let i=0;i<86400;i++)q.pump();
 assert.equal(scans,0);
 q.enqueue('initial-fetch',()=>{started=true});assert.equal(started,false);
 busy=false;q.pump();assert.equal(started,true);
});
for(const script of ['auto-job-solver.js','auto-valuable-seller.js']){
 test(script+' waits without spinning and cancels the timer on a matching event',async()=>{
  let time=0,id=0;const timers=new Map(),listeners=new Set();
  const c=vm.createContext({Date:{now:()=>time},window:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)},
   setTimeout:(fn,ms)=>{assert.ok(ms>0);timers.set(++id,{fn,ms});return id;},clearTimeout:key=>timers.delete(key)});
  const body=src(script);vm.runInContext(body.slice(body.indexOf('  function safeTimeout('),body.indexOf('  function createLogger(')),c);
  const result=c.createWaitForEvent(()=>false)('ack',120);
  assert.equal([...timers.values()][0].ms,120);assert.equal(timers.size,1);
  for(const fn of listeners)fn({data:{type:'ack'}});
  assert.equal((await result).type,'ack');assert.equal(timers.size,0);assert.equal(listeners.size,0);
  let stopped=false;
  const waiting=c.createDelay(()=>stopped)(8000);const timer=[...timers.values()][0];
  assert.equal(timer.ms,1000);stopped=true;time=3600000;timer.fn();
  await assert.rejects(waiting,/Aborted/);
 });
}

test('concurrent console writers append atomically and keep a usable delta after history rolls over', async () => {
 const f=bridge(), timestamp=new Date().toISOString();
 const row=(args,source='content')=>({level:'log',source,timestamp,args});
 f.seed({cor3_console_logs:Array.from({length:5000},()=>row('old'))});
 await Promise.all([
  f.store.appendConsole([row('first','background')]),
  f.store.appendConsole([row('second','popup'),row('third','popup')])
 ]);
 const all=await f.store.get('cor3_console_logs');
 const rows=all.cor3_console_logs;
 assert.equal(rows.length,5000);
 assert.deepEqual(Array.from(rows.slice(-3),r=>r.args),['first','second','third']);
 assert.equal(rows.at(-1).batchSize,2);
 await assert.rejects(f.store.appendConsole([row('x'.repeat(2049))]));
});
test('a stalled console sink retains a bounded tail and cannot flush it into a different account', async () => {
 const timers=new Map(), batches=[]; let seq=0, account='a', release;
 const c=vm.createContext({chrome:{storage:{local:{}}},location:{protocol:'chrome-extension:'},console:{log(){},warn(){},error(){}},
  Cor3CenterIdentity:{snapshot:()=>({accountId:account,documentId:'doc'})},
  Cor3CenterStore:{appendConsole(batch){batches.push(batch);return new Promise(r=>{release=r});}},
  setTimeout(fn){timers.set(++seq,fn);return seq;}});
 vm.runInContext(src('console-logger.js'),c);
 const tick=async()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}await flush();};
 c.console.log('first');await tick();
 for(let i=0;i<4000;i++)c.console.log(i);
 assert.equal(timers.size,0);
 release();await flush();await tick();
 assert.equal(batches.length,2);
 assert.equal(batches[1].length,128);
 assert.ok(Number(batches[1][0].args)>=3488);
 account='b';c.console.log('new account');
 release();await flush();await tick();
 assert.deepEqual(Array.from(batches[2],r=>r.args),['new account']);
 release();await flush();
});
