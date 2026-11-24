import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const root=new URL('../extension/',import.meta.url),src=n=>fs.readFileSync(new URL(n,root),'utf8');
function setup(){const data={helperMode:true,marketData:'legacy',autoFinishAllJobsEnabled:true};let b={id:4,tabId:4,accountId:'FREEL_FF000009-0009',documentId:'a',epoch:1},handler;const raw={get:async keys=>keys==null?{...data}:Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]])),set:async v=>Object.assign(data,v),remove:async keys=>{for(const k of keys)delete data[k]}};const api={storage:{local:raw,onChanged:{addListener(){},removeListener(){}}},runtime:{id:'id',getURL:p=>'moz-extension://id/'+p,onMessage:{addListener:f=>handler=f}}};const binding={snapshot:()=>b,isCurrent:x=>x===b,resolve:async()=>b,guard:async(id,fn,expected)=>{assert.equal(id,b.id);return fn()},matchesTopFrame:(s,doc,expected)=>expected===b&&s?.id==='id'&&s.frameId===0&&s.tab?.id===b.tabId&&doc===b.documentId};const ctx={chrome:api,Cor3CenterBinding:binding,URL};vm.runInNewContext(src('center-store.js'),ctx);return {ctx,data,api,change:v=>b=v,invoke:(m,s)=>new Promise(r=>handler(m,s,r))};}
test('actual store uses account local namespace, never legacy prefs',async()=>{const f=setup();assert.deepEqual({...await f.ctx.Cor3CenterStore.get('marketData')},{});await f.ctx.Cor3CenterStore.set({marketData:'current'});assert.equal(f.data['center:FREEL_FF000009-0009:marketData'],'current');assert.equal(f.data.marketData,'legacy');f.change({id:4,tabId:4,accountId:'FREEL_FF00000A-000A'});assert.deepEqual({...await f.ctx.Cor3CenterStore.get('marketData')},{})});
test('old document, foreign tab, raw prefix and helperMode writes refused',async()=>{const f=setup();for(const [sender,doc]of [[{tab:{windowId:9,id:4,tabId:4,accountId:"acct",documentId:"doc",url:"https://cor3.gg/",epoch:1}},'old'],[{tab:{id:5}},'a']]){const r=await f.invoke({type:'cor3-center-store',op:'set',value:{x:1},documentId:doc},sender);assert.equal(r.ok,false)}await assert.rejects(f.ctx.Cor3CenterStore.set({helperMode:false}));await assert.rejects(f.ctx.Cor3CenterStore.get('center:other:secret'));assert.equal(f.data.helperMode,true)});
test('callback adapter and helperMode read preserve guarded preference shape',async()=>{const f=setup();await new Promise(resolve=>f.ctx.Cor3CenterStore.get('helperMode',x=>{assert.equal(x.helperMode,true);resolve()}));});
test('UI sidebars feature-detect without replacing the game tab; no first-tab query',async()=>{for(const mode of ['chrome','gecko','fallback']){const calls=[];const api={windows:{getCurrent:async()=>({id:9,type:'normal'})},runtime:{getURL:p=>'ext:///'+p,sendMessage:async m=>{calls.push(m);return{ok:true,value:1,tab:{windowId:9,id:4,tabId:4,accountId:"acct",documentId:"doc",url:"https://cor3.gg/",epoch:1}}}},tabs:{create:async o=>calls.push(o)}};if(mode==='chrome')api.sidePanel={open:async()=>calls.push('sidePanel')};if(mode==='gecko')api.sidebarAction={open:async()=>calls.push('sidebarAction')};const c={chrome:api};vm.runInNewContext(src('center-ui.js'),c);await c.Cor3CenterUi.send(4,{action:'read'});assert.equal(calls.find(m=>m.type==='centerSend').options.frameId,0);if(mode==="fallback")await assert.rejects(c.Cor3CenterUi.panel({id:4}),/CENTER_SIDEBAR_UNAVAILABLE/);else await c.Cor3CenterUi.panel({id:4});assert.ok(!calls.some(x=>x?.url));assert.ok(calls.length>=2)}});
test('manifest dual entry exact order and all declared resources exist',()=>{const m=JSON.parse(src('manifest.json'));assert.equal(m.manifest_version,3);assert.ok(m.background.service_worker);if(m.background.scripts)assert.ok(m.background.scripts.length);else{assert.ok(m.permissions.includes('sidePanel'));assert.equal(m.side_panel.default_path,'popup.html');assert.equal(m.browser_specific_settings,undefined);assert.equal(m.sidebar_action,undefined);}const worker=src(m.background.service_worker);for(const f of m.background.scripts||[])assert.ok(worker.includes("'"+f+"'"));assert.ok(!src('background.js').includes('importScripts('));assert.ok(!m.permissions.includes('nativeMessaging'));for(const e of m.content_scripts)for(const f of e.js)assert.ok(fs.existsSync(new URL(f,root)),f);for(const e of m.web_accessible_resources)for(const f of e.resources)assert.ok(fs.existsSync(new URL(f,root)),f);assert.ok(!src('background.js').includes('const [tab]'));assert.ok(!src('popup.js').includes('allTabs[0]'));});
test('all original solver modules retained and native remains disabled/unconfigured',()=>{for(const f of ['auto-job-solver.js','auto-valuable-seller.js','daily-hack-solver.js','ice-wall-solver.js','decrypt-solver.js','simple-decrypt-solver.js','popup.js','content.js'])assert.ok(src(f).length>1000,f);const c={};vm.runInNewContext(src('full-bridge/full-config.js'),c);assert.equal(c.Cor3FullDeployment.enabled,false);assert.equal(c.Cor3FullDeployment.installations.length,0);assert.equal(c.Cor3FullDeployment.allowAutoRenew,false)});

test('actual dual background boot + restored alarm never sends game action before binding',async()=>{const m=JSON.parse(src('manifest.json'));for(const mode of (m.background.scripts?['worker','document']:['worker'])){const changed=[],alarmListeners=[],sends=[],state={helperMode:false,autoFinishAllJobsEnabled:true,cor3FullCandidateStartupVersion:'full-test-v1'};const event=()=>({addListener(){},removeListener(){}});const area={get(k,cb){const keys=typeof k==='string'?[k]:Array.isArray(k)?k:k?Object.keys(k):Object.keys(state);const result=Object.fromEntries(keys.filter(x=>Object.hasOwn(state,x)).map(x=>[x,state[x]]));cb?.(result);return Promise.resolve(result)},set(v,cb){Object.assign(state,v);for(const fn of changed)fn(Object.fromEntries(Object.entries(v).map(([k,newValue])=>[k,{newValue}])),'local');cb?.();return Promise.resolve()},remove(){return Promise.resolve()}};const api={windows:{onRemoved:event(),get:async id=>({id,type:'normal'})},storage:{local:area,sync:{get(){assert.fail('sync')},set(){assert.fail('sync')}},onChanged:{addListener:f=>changed.push(f),removeListener(){}}},runtime:{id:'test',getURL:p=>'moz-extension://id/'+p,onMessage:event()},tabs:{onUpdated:event(),onRemoved:event(),query:async()=>[{id:1,url:'https://cor3.gg/'}],sendMessage:async(...a)=>sends.push(a)},alarms:{clear:async()=>true,create:async()=>assert.fail('alarm before binding'),onAlarm:{addListener:f=>alarmListeners.push(f)}}};const c=vm.createContext({chrome:api,setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},URL,console:{log(){},warn(){},error(){}},crypto:{getRandomValues:a=>a.fill(1)}});c.importScripts=(...files)=>files.forEach(f=>vm.runInContext(src(f),c,{filename:f}));if(mode==='worker')vm.runInContext(src(m.background.service_worker),c);else{delete c.importScripts;for(const f of m.background.scripts)vm.runInContext(src(f),c,{filename:f});}await c.Cor3Automation.ready;for(const fn of alarmListeners)fn({name:'autoFinishAllJobs'});await new Promise(r=>setImmediate(r));assert.equal(state.helperMode,false);assert.equal(c.Cor3Automation.allowed(),false);assert.equal(sends.length,0)}});

test('bound minigame frame gets only its two preference/status keys with real frame nonce',async()=>{const f=setup();const doc='ab'.repeat(16);f.api.scripting={executeScript:async()=>[{frameId:3,result:doc}]};const sender={id:'id',tab:{id:4},frameId:3,url:'https://svc-corie.cor3.gg/games/simple-hack/'};const send=(op,value,documentId=doc)=>f.invoke({type:'cor3-center-store',op,value,documentId},sender);assert.equal((await send('set',{simpleDecryptSolverStatus:{state:'fixture'}})).ok,true);assert.equal((await send('get','marketData')).ok,false);assert.equal((await send('get','autoSimpleDecryptEnabled','ff'.repeat(16))).ok,false);f.api.scripting.executeScript=async()=>[{frameId:3,result:'cd'.repeat(16)}];assert.equal((await send('set',{simpleDecryptSolverStatus:{state:'stale'}})).ok,false)});



test('only three requested missing preferences default true with no persistence',async()=>{const f=setup(),keys=['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled','autoUpdateMarkets','autoDailyHackEnabled'];const before=JSON.stringify(f.data);for(const key of keys)assert.equal((await f.ctx.Cor3CenterStore.get(key))[key],true);const all=await f.ctx.Cor3CenterStore.get(null);for(const key of keys)assert.equal(all[key],true);const obj=await f.ctx.Cor3CenterStore.get(Object.fromEntries(keys.map(k=>[k,false])));for(const key of keys)assert.equal(obj[key],true);assert.equal(JSON.stringify(f.data),before);assert.equal(f.data.helperMode,true);});
test('all explicit values including false null zero remain authoritative per account',async()=>{const f=setup();for(const value of [false,null,0,true]){await f.ctx.Cor3CenterStore.set({autoDecryptEnabled:value,autoIceWallEnabled:value,autoSimpleDecryptEnabled:value});const data=await f.ctx.Cor3CenterStore.get(null);for(const key of ['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled'])assert.equal(data[key],value);}await f.ctx.Cor3CenterStore.set({autoDecryptEnabled:false});f.change({id:4,tabId:4,accountId:'FREEL_FF00000A-000A'});assert.equal((await f.ctx.Cor3CenterStore.get('autoDecryptEnabled')).autoDecryptEnabled,true);assert.equal(f.data['center:FREEL_FF000009-0009:autoDecryptEnabled'],false)});
test('other defaults unchanged and unbound reads cannot activate or initialize preferences',async()=>{const f=setup();const defaults={autoJobSolverEnabled:false,autoValuableSellerEnabled:false,otherDefault:'unchanged'};assert.deepEqual({...await f.ctx.Cor3CenterStore.get(defaults)},defaults);assert.deepEqual({...await f.ctx.Cor3CenterStore.get(['autoJobSolverEnabled','autoValuableSellerEnabled'])},{});f.change(null);await assert.rejects(f.ctx.Cor3CenterStore.get('autoDecryptEnabled'));assert.equal(f.data.helperMode,true);assert.ok(!Object.keys(f.data).some(k=>k.startsWith('center:')))});

test('expedition numeric version and visible package label identify the actual center update',()=>{const m=JSON.parse(src('manifest.json'));assert.equal(m.version,'2.3.8');assert.match(m.version_name,/^2\.3\.8-relay-(chrome|edge)$/);assert.equal(m.name,'COR3 Relay');assert.match(src('popup.html'),/COR3 Relay · (Chrome|Edge) 2\.3\.8/);assert.ok(!m.permissions.includes('nativeMessaging'));});


test('Daily lock acquisition is atomic and a replacement document makes the previous same-tab lock obsolete', async () => {
 const f=setup();
 f.data.helperMode=false;
 const key='center:FREEL_FF000009-0009:dailyHackRunLock';
 const sender={id:'id',frameId:0,tab:{id:4}};
 const send=(action,owner,documentId='a') =>
  f.invoke({type:'cor3-center-store',op:'daily',value:{action,owner},documentId},sender);
 const a='daily-100-1-aaa', b='daily-100-2-bbb';
 const [first,second]=await Promise.all([send('acquire',a),send('acquire',b)]);
 assert.equal(first.value.acquired,true);
 assert.equal(second.value.acquired,false);
 assert.equal(f.data[key].documentId,'a');
 f.change({id:4,tabId:4,accountId:'FREEL_FF000009-0009',documentId:'b',epoch:2});
 assert.equal((await send('acquire',b,'b')).value.acquired,true);
 assert.equal((await send('release',a)).ok,false);
 assert.equal((await send('release',a,'b')).value.released,false);
 assert.equal(f.data[key].owner,b);
 assert.equal((await send('release',b,'b')).value.released,true);
 assert.equal(f.data[key],undefined);
});

test('a legacy Daily lock remains protected for its remaining lease, and an explicit off blocks writes', async () => {
 const f=setup();
 const prefix='center:FREEL_FF000009-0009:';
 f.data.helperMode=false;
 const startedAt=Date.now()-411693;
 f.data[prefix+'dailyHackRunLock']={owner:'previous-version',startedAt};
 const sender={id:'id',frameId:0,tab:{id:4}};
 const send=value => f.invoke({type:'cor3-center-store',op:'daily',value,documentId:'a'},sender);
 const attempt={action:'acquire',owner:'daily-100-1-aaa'};
 assert.equal((await send(attempt)).value.acquired,false);
 assert.equal((await send({action:'schedule',at:Date.now()+120000})).value.scheduled,true);
 await f.ctx.Cor3CenterStore.set({autoDailyHackEnabled:false});
 assert.equal(f.data[prefix+'dailyHackNextCheckAt'],null);
 assert.equal((await send(attempt)).value.disabled,true);
 assert.equal((await send({action:'schedule',at:Date.now()+120000})).value.scheduled,false);
 assert.equal(f.data[prefix+'dailyHackNextCheckAt'],null);
 f.data[prefix+'dailyHackRunLock'].startedAt=Date.now()-601000;
 await f.ctx.Cor3CenterStore.remove('autoDailyHackEnabled');
 assert.equal((await send(attempt)).value.acquired,true);
});


test('Daily uses a verified closed-tab result to recover and preserves locks when the owner tab is open or unreadable', async () => {
 const f=setup();
 f.data.helperMode=false;
 const key='center:FREEL_FF000009-0009:dailyHackRunLock';
 f.data[key]={owner:'daily-100-1-old',startedAt:Date.now(),tabId:7,documentId:'other'};
 const sender={id:'id',frameId:0,tab:{id:4}};
 const message={type:'cor3-center-store',op:'daily',value:{action:'acquire',owner:'daily-100-2-new'},documentId:'a'};
 f.api.tabs={query:async()=>[{id:4},{id:7}]};
 assert.equal((await f.invoke(message,sender)).value.acquired,false);
 f.api.tabs.query=async()=>{throw Error('not available');};
 assert.equal((await f.invoke(message,sender)).value.acquired,false);
 f.api.tabs.query=async()=>[{id:4}];
 assert.equal((await f.invoke(message,sender)).value.acquired,true);
 assert.equal(f.data[key].tabId,4);
});
