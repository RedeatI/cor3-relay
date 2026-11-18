import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../extension/center-binding.js',import.meta.url),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
function event(){const listeners=new Set();return {addListener:f=>listeners.add(f),removeListener:f=>listeners.delete(f),emit(...a){for(const f of listeners)f(...a)},listeners}}
function fixture(persistAccount=false,recovery=undefined){let n=0,delay=null;const context={URL,setTimeout,clearTimeout,Cor3ExpeditionSaveRecovery:recovery};vm.runInNewContext(source,context);vm.runInNewContext(readFileSync(new URL('../extension/center-migration.js',import.meta.url),'utf8'),context);const data={helperMode:true},writes=[];let writeHook=null;const storage={async get(keys){const list=typeof keys==='string'?[keys]:keys;return Object.fromEntries(list.filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]]))},async set(values){writes.push({...values});Object.assign(data,values);if(writeHook)await writeHook(values)}};const migration=context.Cor3CenterMigrationFactory.create({storage,accounts:["FREEL_FF000005-0005", "FREEL_FF000006-0006", "FREEL_FF000003-0003", "FREEL_FF000008-0008", "FREEL_FF000007-0007", "FREEL_FF000002-0002"]});const records=new Map([[1,{id:1,windowId:10,url:'https://cor3.gg/',status:'complete',account:'FREEL_FF000008-0008',documentId:'11'.repeat(16)}],[2,{id:2,windowId:20,url:'https://cor3.gg/',status:'complete',account:'FREEL_FF000004-0004',documentId:'22'.repeat(16)}]]);const calls=[],timers=new Map();let timer=0;
 const api={storage:{local:storage},runtime:{id:'fixture',getURL:p=>'moz-extension://fixture/'+p,onMessage:event()},windows:{get:async id=>({id,type:'normal'}),onRemoved:event()},tabs:{onActivated:event(),onUpdated:event(),onRemoved:event(),onCreated:event(),onAttached:event(),onDetached:event(),get:async id=>({...records.get(id)}),query:async q=>[...records.values()].filter(t=>t.windowId===q.windowId).map(t=>({...t})),sendMessage:async(id,m,options)=>{calls.push({id,m,options});if(m.type!=='cor3-center-probe')return {sent:true};const r=records.get(id);const reply=()=>api.runtime.onMessage.emit({type:'cor3-center-observation',nonce:m.nonce,account:r.account,documentId:r.documentId,url:r.url},{id:'fixture',tab:{id,windowId:r.windowId},frameId:0,url:r.url},()=>{});if(delay)delay(reply);else reply();}}};
 vm.runInNewContext(readFileSync(new URL('../extension/center-profile.js',import.meta.url),'utf8'),context);
 const profile=persistAccount?context.Cor3CenterProfileFactory.create(storage):undefined;
 const binding=context.Cor3CenterBindingFactory.create({api,migration,profile,nonce:()=> (++n).toString(16).padStart(32,'0'),setTimer:(f,ms)=>{timers.set(++timer,{f,ms});return timer},clearTimer:id=>timers.delete(id)});
 const popup={id:'fixture',url:api.runtime.getURL('popup.html')};
 const call=(m,s=popup)=>new Promise(resolve=>{let handled=false,responded=false;const respond=v=>{responded=true;resolve(v)};for(const f of api.runtime.onMessage.listeners){if(f(m,s,respond)===true)handled=true}if(!handled&&!responded)resolve(undefined)});
 const bind=(windowId=10)=>call({type:'cor3-center-auto-bind',windowId});return {api,binding,records,calls,timers,popup,call,bind,data,writes,F:context.Cor3CenterMigrationFactory,onWrite:f=>writeHook=f,delay:f=>delay=f,loadStore(){api.storage.onChanged=event();Object.assign(context,{chrome:api,Cor3CenterBinding:binding});vm.runInNewContext(readFileSync(new URL('../extension/center-store.js',import.meta.url),'utf8'),context);}};}
test('default background stays unbound and never selects a first tab',async()=>{const f=fixture();assert.equal(await f.binding.resolve(),null);assert.equal(f.calls.length,0);f.binding.close()});
test('scoped store gets two fresh proofs and rejects foreign senders without probing',async()=>{
 const f=fixture(true);await f.bind();f.loadStore();const tab=f.records.get(1);
 const sender={id:'fixture',tab,frameId:0,url:tab.url};
 const message={type:'cor3-center-store',op:'get',value:'autoDailyHackEnabled',documentId:tab.documentId};
 f.calls.length=0;
 const result=await f.call(message,sender);
 assert.equal(result.value.autoDailyHackEnabled,true);
 assert.equal(f.calls.filter(x=>x.m.type==='cor3-center-probe').length,2);
 f.calls.length=0;
 assert.equal((await f.call({...message,documentId:'99'.repeat(16)},sender)).ok,false);
 assert.equal((await f.call(message,{...sender,tab:f.records.get(2)})).ok,false);
 assert.equal(f.calls.length,0);f.binding.close();
});
test('account verification recovers expedition settings before the page is bound', async () => {
 const account='FREEL_FF000008-0008', key=`center:${account}:autoSendMerc`;
 let restoreCalls=0;
 const f=fixture(true,{async restore(observed,check){
  restoreCalls++;
  assert.equal(observed,account);
  assert.equal(f.data.cor3CenterBrowserAccount.accountId,account);
  assert.equal(f.binding.snapshot(),null);
  await check();
  await f.api.storage.local.set({[key]:{enabled:false,maxMercCost:5000}});
 }});
 f.binding.onBound(()=>assert.deepEqual(f.data[key],{enabled:false,maxMercCost:5000}));
 assert.equal((await f.bind()).ok,true);
 assert.equal((await f.bind()).ok,true);
 assert.equal(restoreCalls,1);
 assert.deepEqual(f.data[key],{enabled:false,maxMercCost:5000});
 f.binding.close();
});
test('first verified active game auto-binds and remembers only this browser account',async()=>{
 const f=fixture(true),tab=f.records.get(2);tab.active=true;
 const send=()=>f.call({type:'cor3-center-page-ready',documentId:tab.documentId},{id:'fixture',frameId:0,tab:{...tab},url:tab.url});
 assert.equal((await send()).ok,true);assert.equal(f.data.cor3CenterBrowserAccount.accountId,tab.account);
 f.binding.revoke();tab.account='FREEL_FF00000B-000B';tab.documentId='33'.repeat(16);
 assert.equal((await send()).code,'CENTER_SAVED_ACCOUNT_MISMATCH');assert.equal(f.binding.snapshot(),null);
 assert.equal(f.data.cor3CenterBrowserAccount.accountId,'FREEL_FF000004-0004');f.binding.close();
});
test('trusted popup auto binds only unique same-window account after two probes',async()=>{const f=fixture();let bound=0;f.binding.onBound(()=>bound++);const r=await f.bind(20);assert.equal(r.ok,true);assert.equal(r.tab.windowId,20);assert.equal(r.tab.tabId,2);assert.equal(r.tab.accountId,'FREEL_FF000004-0004');assert.ok(f.calls.length>=2);assert.ok(f.calls.every(c=>c.id===2));await f.binding.resolve();assert.equal(bound,1);f.binding.close()});
test('content and deprecated manual binding cannot select a window',async()=>{const f=fixture();const r=await f.bind();assert.equal(r.ok,true);f.binding.revoke();assert.equal((await f.call({type:'cor3-center-auto-bind',windowId:20},{id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'})).ok,false);for(const type of ['cor3-center-list','cor3-center-prepare','cor3-center-confirm'])assert.equal((await f.call({type,tabId:1,token:'x'})).code,'CENTER_MANUAL_BINDING_DISABLED');assert.equal(f.binding.snapshot(),null);f.binding.close()});
test('two same-account tabs are ambiguous; loading candidates are not skipped',async()=>{const f=fixture();f.records.set(3,{...f.records.get(1),id:3,status:'loading'});assert.equal((await f.bind()).code,'CENTER_ACCOUNT_AMBIGUOUS');assert.equal(f.calls.length,0);f.records.delete(3);f.records.get(1).status='loading';assert.equal((await f.bind()).code,'CENTER_ACCOUNT_NOT_READY');f.binding.close()});
test('window errors, mismatched windowId and missing URL fail closed',async()=>{for(const kind of ['window','membership','unknown']){const f=fixture();if(kind==='window')f.api.windows.get=async id=>({id,type:'popup'});if(kind==='membership')f.api.tabs.query=async()=>[{...f.records.get(2)}];if(kind==='unknown')f.records.set(3,{id:3,windowId:10,status:'loading'});assert.equal((await f.bind()).code,'CENTER_WINDOW_UNAVAILABLE');assert.equal(f.binding.snapshot(),null);f.binding.close()}});
test('existing other-window binding is never stolen',async()=>{const f=fixture();await f.bind();const before=f.binding.snapshot();assert.equal((await f.bind(20)).code,'CENTER_OTHER_WINDOW_BOUND');assert.equal(f.binding.isCurrent(before),true);f.binding.close()});
test('new same-window COR3 tab revokes bound account; other-window addition does not',async()=>{const f=fixture();await f.bind();f.records.set(4,{...f.records.get(2),id:4});f.api.tabs.onCreated.emit(f.records.get(4));await tick();assert.ok(f.binding.snapshot());f.records.set(3,{...f.records.get(1),id:3});f.api.tabs.onCreated.emit(f.records.get(3));await tick();assert.equal(f.binding.snapshot(),null);f.binding.close()});
test('every resolve rechecks complete candidate set even without browser event',async()=>{const f=fixture();await f.bind();f.records.set(3,{...f.records.get(1),id:3});assert.equal(await f.binding.resolve(),null);assert.equal(f.binding.snapshot(),null);f.binding.close()});
for(const kind of ['loading','removed','detached'])test(kind+' invalidates old tokens and binding',async()=>{const f=fixture();await f.bind();const b=f.binding.snapshot();if(kind==='loading')f.api.tabs.onUpdated.emit(1,{status:'loading'},f.records.get(1));if(kind==='removed')f.api.tabs.onRemoved.emit(1,{windowId:10});if(kind==='detached')f.api.tabs.onDetached.emit(1,{oldWindowId:10});assert.equal(f.binding.isCurrent(b),false);assert.equal(await f.binding.resolve(),null);f.binding.close()});
test('identity change during guarded operation rejects late result',async()=>{const f=fixture();await f.bind();await assert.rejects(()=>f.binding.guard(1,async()=>{f.records.get(1).documentId='ff'.repeat(16);return 'late'}),/CENTER_BINDING_REVOKED/);assert.equal(f.binding.snapshot(),null);f.binding.close()});
test('same-window concurrent auto requests singleflight; different-window request refuses',async()=>{const f=fixture();let reply;f.delay(r=>reply=r);const a=f.bind();await tick();const b=f.bind();assert.equal((await f.bind(20)).code,'CENTER_AUTO_BUSY');f.delay(null);reply();const result=await a;assert.equal(result.ok,true);assert.equal((await b).tab.epoch,result.tab.epoch);assert.ok(f.calls.length>=2);f.binding.close()});
test('navigation during pending auto prevents late A overwriting later B',async()=>{const f=fixture();let reply;f.delay(r=>reply=r);const a=f.bind();await tick();f.api.tabs.onUpdated.emit(1,{status:'loading'},f.records.get(1));reply();assert.equal((await a).ok,false);f.delay(null);const b=await f.bind(20);assert.equal(b.ok,true);reply();assert.equal(f.binding.snapshot().windowId,20);f.binding.close()});
test('admission requires exact tab/window/topframe/current doc',async()=>{const f=fixture();await f.bind();const b=f.binding.snapshot(),s={id:'fixture',tab:{id:1,windowId:10},frameId:0,url:b.url};assert.equal((await f.binding.admission(s,b.documentId)).allowed,true);for(const x of [{...s,frameId:1},{...s,tab:{id:1,windowId:20}},{...s,id:'other'}])assert.equal((await f.binding.admission(x,b.documentId)).allowed,false);assert.equal((await f.binding.admission(s,'ff'.repeat(16))).allowed,false);f.binding.close()});
test('popup send pins expected binding and denies alternate tab/frame',async()=>{const f=fixture();await f.bind();const expectedBinding=f.binding.snapshot();assert.equal((await f.call({type:'centerSend',tabId:1,message:{action:'fixture'},expectedBinding})).ok,true);assert.equal((await f.call({type:'centerSend',tabId:2,message:{action:'fixture'},expectedBinding})).ok,false);assert.equal((await f.call({type:'centerSend',tabId:1,message:{action:'fixture'},options:{frameId:1},expectedBinding})).ok,false);f.binding.close()});
test('restart has no remembered binding or saved account fallback',async()=>{const a=fixture();await a.bind();const b=fixture();assert.equal(b.binding.snapshot(),null);a.binding.close();b.binding.close()});
test('popup sender window when supplied must match API-selected window',async()=>{const f=fixture();const r=await f.call({type:'cor3-center-auto-bind',windowId:10},{...f.popup,tab:{id:90,windowId:20}});assert.equal(r.code,'CENTER_WINDOW_UNAVAILABLE');assert.equal(f.calls.length,0);assert.equal(f.binding.snapshot(),null);f.binding.close()});

test('actual auto-bind migration completes all persisted values before binding/onBound',async()=>{const f=fixture(),A='FREEL_FF000008-0008';for(const k of f.F.keys)f.data['center:'+A+':'+k]=false;let events=0,prepublish=0;f.onWrite(async values=>{assert.equal(f.binding.snapshot(),null);if(Object.hasOwn(values,'helperMode')){prepublish++;const admitted=await f.binding.admission({id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'},'11'.repeat(16));assert.equal(admitted.allowed,false);for(const k of f.F.keys)assert.equal(f.data['center:'+A+':'+k],true);assert.equal(f.data[f.F.marker('account',A)],f.F.version);}});f.binding.onBound(()=>{events++;assert.equal(f.data.helperMode,false);for(const k of f.F.keys)assert.equal(f.data['center:'+A+':'+k],true);assert.equal(f.data[f.F.marker('profile',null)],f.F.version)});const result=await f.bind();assert.equal(result.ok,true);assert.equal(events,1);assert.equal(prepublish,1);assert.equal(f.writes.length,6);f.binding.close()});
test('actual binding remains unpublished on uncertain global write and no onBound',async()=>{const f=fixture();let events=0;f.binding.onBound(()=>events++);f.onWrite(v=>{if(Object.hasOwn(v,'helperMode'))throw Error('uncertain storage')});const r=await f.bind();assert.equal(r.ok,false);assert.equal(r.code,'CENTER_MIGRATION_INCOMPLETE');assert.equal(f.binding.snapshot(),null);assert.equal(events,0);assert.equal(f.data.helperMode,false);assert.equal(f.data[f.F.marker('profile',null)],undefined);f.binding.close()});
test('identity switches during actual migration fence prevent cross-account writes',async()=>{const f=fixture();f.onWrite(v=>{if(Object.keys(v).some(k=>k.endsWith(':attempt')))f.records.get(1).account='FREEL_FF000007-0007'});const r=await f.bind();assert.equal(r.ok,false);assert.equal(f.binding.snapshot(),null);assert.equal(f.data.helperMode,true);assert.ok(!Object.keys(f.data).some(k=>k.startsWith('center:')));f.binding.close()});
test('probe transport rejection and timeout are distinct fixed codes',async()=>{const f=fixture();f.api.tabs.sendMessage=()=>Promise.reject(Error('raw private error'));assert.equal((await f.bind()).code,'CENTER_RECEIVER_UNAVAILABLE');f.api.tabs.sendMessage=()=>Promise.resolve();const pending=f.bind();await tick();for(const t of [...f.timers.values()])t.f();assert.equal((await pending).code,'CENTER_PROBE_TIMEOUT');f.binding.close()});
test('diagnostic requires exact nonce, sender and fixed payload before returning fixed code',async()=>{const f=fixture();f.delay(()=>{});const flight=f.bind();await tick();const n=f.calls.at(-1).m.nonce;const sender={id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'};const diag={type:'cor3-center-diagnostic',nonce:n,code:'CENTER_IDENTITY_SELECTOR_MISSING',count:0};await f.call({...diag,nonce:'00'.repeat(16)},sender);await f.call(diag,{...sender,frameId:1});await f.call({...diag,code:'RAW_SECRET'},sender);assert.equal(f.timers.size,1);await f.call(diag,sender);assert.equal((await flight).code,'CENTER_IDENTITY_SELECTOR_MISSING');assert.equal(f.binding.snapshot(),null);f.binding.close()});
test('loading does not send probe and has separate readiness reason',async()=>{const f=fixture();f.records.get(1).status='loading';assert.equal((await f.bind()).code,'CENTER_ACCOUNT_NOT_READY');assert.equal(f.calls.length,0);f.binding.close()});
test('revocation while pending kills old probe and fresh doc must form new binding',async()=>{const f=fixture();f.delay(()=>{});const flight=f.bind();await tick();const old=f.records.get(1).documentId;await f.call({type:'cor3-center-revoked',documentId:old},{id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'});assert.equal((await flight).code,'CENTER_BINDING_REVOKED');f.delay(null);f.records.get(1).documentId='77'.repeat(16);assert.equal((await f.bind()).tab.documentId,'77'.repeat(16));assert.equal((await f.binding.admission({id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'},old)).allowed,false);f.binding.close()});
test('synchronous send throw is unavailable; transport ack without observation never counts success',async()=>{const f=fixture();f.api.tabs.sendMessage=()=>{throw Error('private text')};assert.equal((await f.bind()).code,'CENTER_RECEIVER_UNAVAILABLE');f.api.tabs.sendMessage=async()=>({ok:false,error:'do not trust ack'});const pending=f.bind();await tick();assert.equal(f.binding.snapshot(),null);for(const t of [...f.timers.values()])t.f();assert.equal((await pending).code,'CENTER_PROBE_TIMEOUT');f.binding.close()});
test('late prior observation cannot revive cancelled probe or overwrite recovered generation',async()=>{const f=fixture();let late;f.delay(cb=>late=cb);const flight=f.bind();await tick();await f.call({type:'cor3-center-revoked',documentId:f.records.get(1).documentId},{id:'fixture',tab:{id:1,windowId:10},frameId:0,url:'https://cor3.gg/'});assert.equal((await flight).ok,false);late();assert.equal(f.binding.snapshot(),null);f.delay(null);f.records.get(1).documentId='88'.repeat(16);const fresh=await f.bind();late();assert.equal(f.binding.snapshot().documentId,fresh.tab.documentId);f.binding.close()});
test('cache summary reads only safe timestamps for its verified document, including background tabs, without binding',async()=>{
 const f=fixture(), tab=f.records.get(1); tab.active=true;
 const other=f.records.get(2);
 f.data['center:'+tab.account+':marketDataUpdatedAt']=123;
 f.data['center:'+tab.account+':marketData']={secret:'do not expose'};
 f.data['center:'+other.account+':marketDataUpdatedAt']=456;
 const send=(documentId=tab.documentId)=>f.call({type:'cor3CenterCacheSummary',documentId},{id:'fixture',frameId:0,tab:{...tab},url:tab.url});
 assert.deepEqual({...((await send()).values)},{marketDataUpdatedAt:123});
 assert.equal(f.binding.snapshot(),null);
 assert.equal(f.writes.length,0);
 assert.equal((await send(other.documentId)).ok,false);
 tab.active=false;
 assert.equal((await send()).ok,true);
 f.binding.close();
});

test('a unique background page auto-binds through page-ready and preserves the remembered browser account',async()=>{
 const f=fixture(true),tab=f.records.get(2);tab.active=false;f.records.set(3,{id:3,windowId:20,active:true,status:'complete',url:'https://example.com/'});
 const sender={id:'fixture',frameId:0,tab:{...tab},url:tab.url};assert.equal((await f.call({type:'cor3-center-page-ready',documentId:tab.documentId},sender)).ok,true);assert.equal(f.data.cor3CenterBrowserAccount.accountId,tab.account);assert.equal(f.binding.snapshot().tabId,tab.id);assert.ok(f.calls.every(x=>x.id===tab.id));f.binding.close();
});
test('activation of an ordinary tab preserves account binding and own-document cache summary',async()=>{
 const f=fixture(true);f.records.get(1).active=true;await f.bind();const b=f.binding.snapshot(),tab=f.records.get(1);f.records.set(3,{id:3,windowId:10,active:true,status:'complete',url:'https://example.com/'});tab.active=false;f.api.tabs.onActivated.emit({tabId:3,windowId:10});await tick();assert.ok(f.binding.isCurrent(b));assert.ok(await f.binding.resolve());f.data['center:'+tab.account+':marketDataUpdatedAt']=123;
 const result=await f.call({type:'cor3CenterCacheSummary',documentId:tab.documentId},{id:'fixture',frameId:0,tab:{...tab},url:tab.url});assert.equal(result.ok,true);assert.equal(result.values.marketDataUpdatedAt,123);assert.equal((await f.bind(20)).code,'CENTER_OTHER_WINDOW_BOUND');f.binding.close();
});

test('background cache reads cannot replace the remembered account or return another account data',async()=>{
 const f=fixture(true),tab=f.records.get(1);tab.active=false;await f.bind();const remembered=f.data.cor3CenterBrowserAccount.accountId;tab.account='FREEL_FF00000B-000B';tab.documentId='33'.repeat(16);const result=await f.call({type:'cor3CenterCacheSummary',documentId:tab.documentId},{id:'fixture',frameId:0,tab:{...tab},url:tab.url});assert.equal(result.ok,false);assert.equal(result.code,'CENTER_SAVED_ACCOUNT_MISMATCH');assert.equal(f.data.cor3CenterBrowserAccount.accountId,remembered);f.binding.close();
});


test('concurrent admissions share one live probe without reusing a completed proof',async()=>{const f=fixture();await f.bind();const before=f.calls.length,held=[];f.delay(cb=>held.push(cb));const jobs=Array.from({length:20},()=>f.binding.resolve());await tick();assert.equal(held.length,1);held[0]();const results=await Promise.all(jobs);assert.ok(results.every(x=>x?.documentId==='11'.repeat(16)));assert.equal(f.calls.length,before+1);f.delay(null);await f.binding.resolve();assert.equal(f.calls.length,before+2);f.binding.close();});
test('a single probe timeout retries transport without revoking or stopping the active binding',async()=>{const f=fixture();await f.bind();const b=f.binding.snapshot();let revocations=0;f.binding.onRevoke(()=>revocations++);f.delay(()=>{});const pending=f.binding.resolve();await tick();assert.equal(f.timers.size,1);f.delay(null);[...f.timers.values()][0].f();const result=await pending;assert.equal(result.documentId,b.documentId);assert.equal(result.epoch,b.epoch);assert.equal(revocations,0);f.binding.close();});
test('two failed transports still close admission and prompt only the former tab to reconnect',async()=>{const f=fixture();await f.bind();f.delay(()=>{});const pending=f.binding.resolve();await tick();for(let i=0;i<2;i++){const [id,timer]=[...f.timers.entries()][0];f.timers.delete(id);timer.f();await tick();}assert.equal(await pending,null);assert.equal(f.binding.snapshot(),null);const requests=f.calls.filter(x=>x.m.type==='cor3-center-page-active');assert.equal(requests.length,1);assert.equal(requests[0].id,1);assert.equal(requests[0].options.frameId,0);f.binding.close();});
test('account/document changes never use the transport retry path',async()=>{const f=fixture();await f.bind();f.records.get(1).account='FREEL_FF00000C-000C';const before=f.calls.filter(x=>x.m.type==='cor3-center-probe').length;assert.equal(await f.binding.resolve(),null);assert.equal(f.calls.filter(x=>x.m.type==='cor3-center-probe').length,before+1);assert.equal(f.binding.snapshot(),null);f.binding.close();});

test('market summary includes taken work and deduplicates its open row instead of reporting zero',async()=>{const f=fixture(true);const tab=f.records.get(1),prefix='center:'+tab.account+':';await f.bind();f.data[prefix+'marketData']={jobs:[{id:'a'},{id:'b',isCompleted:true}],recentJobs:[{id:'a',status:'TAKEN'},{id:'c',status:'TAKEN'},{id:'old',status:'FAILED'}]};const result=await f.call({type:'cor3CenterCacheSummary',documentId:tab.documentId},{id:'fixture',tab:{...tab},frameId:0,url:tab.url});assert.equal(result.ok,true);assert.equal(result.counts.marketData,2);f.binding.close();});

test('status reads compact counts for modern caches and fetches only the legacy market rows',async()=>{
 const f=fixture(true), tab=f.records.get(1), prefix='center:'+tab.account+':';
 await f.bind();f.loadStore();
 const sender={id:'fixture',tab:{...tab},frameId:0,url:tab.url};
 const markets=['marketData','darkMarketData','soyuzMarketData','usolMarketData'];
 const write=(op,value)=>f.call({type:'cor3-center-store',op,value,documentId:tab.documentId},sender);
 const options={jobs:[{id:'a'},{id:'b',isCompleted:true}],recentJobs:[{id:'a',status:'TAKEN'}]};
 await write('set',Object.fromEntries(markets.map(key=>[key,options])));
 await write('update',{key:'darkMarketData',patch:{jobs:[{id:'new'}]}});
 assert.equal(f.data[prefix+'darkMarketDataSummaryV1'].activeJobsCount,2);
 const requested=[],get=f.api.storage.local.get;
 f.api.storage.local.get=keys=>{requested.push(...[keys].flat());return get(keys);};
 const read=()=>f.call({type:'cor3CenterCacheSummary',documentId:tab.documentId},sender);
 const modern=await read();assert.equal(modern.counts.marketData,1);
 assert.equal(modern.counts.darkMarketData,2);assert.ok(markets.every(key=>!requested.includes(prefix+key)));
 delete f.data[prefix+'marketDataSummaryV1'].activeJobsCount;
 requested.length=0;const legacy=await read();assert.equal(legacy.counts.marketData,1);
 assert.deepEqual(markets.filter(key=>requested.includes(prefix+key)),['marketData']);
 f.binding.close();
});
