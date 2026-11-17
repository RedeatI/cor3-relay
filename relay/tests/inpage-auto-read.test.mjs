import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
function fixture(){
 let scope={accountId:'FREEL_FF000009-0009',documentId:'doc-one'},at=10000,allowed=true,respond=true;
 const data={autoSendMerc:{enabled:false},autoDrone:{enabled:false}},requests=[],writes=[];
 const c=vm.createContext({});for(const name of ['network-coordinator.js','inpage-controls-core.js'])vm.runInContext(src(name),c);
 const network=c.Cor3NetworkCoordinator.create({scope:()=>scope,allowed:()=>allowed,now:()=>at});
 const store={get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]])),set:async x=>writes.push(x),update:async(...x)=>writes.push(x)};
 const dispatch=async r=>{requests.push(r);if(!respond)return {success:true};at++;
  if(r.action==='requestLoadout'){data.loadoutData={equippedHardware:{},ownedHardware:[],equippedSoftware:[],ownedSoftware:[]};data.loadoutUpdatedAt=at;}
  if(r.action==='requestExpeditions'){data.expeditionsData=[];data.expeditionsDataUpdatedAt=at;}
  if(r.action==='requestMercenaries')data.mercenariesData=[];
  if(r.action==='requestUsolMercenaries')data.usolMercenariesData=[];
  if(r.action==='requestExpeditionConfig')data.expeditionConfigData={locations:[]};
  if(r.action==='requestDroneOptions'){data.droneData={drone:null};data.droneDataUpdatedAt=at;}
  if(r.action==='fetchDailyOps'){data.dailyOpsData={claimed:true};data.dailyOpsUpdatedAt=at;}
  if(r.action==='refreshAllMarketsSeq')for(const k of ['marketDataUpdatedAt','darkMarketDataUpdatedAt','soyuzMarketDataUpdatedAt','usolMarketDataUpdatedAt'])data[k]=at;
  return {success:true};};
 const client=c.Cor3InPageControlsFactory.create({identity:{snapshot:()=>scope},admit:async()=>({allowed:true,snapshot:scope}),allowed:()=>allowed,store,dispatch,enqueue:(type,run)=>network.enqueue(type,run),queue:()=>network.snapshot(),now:()=>at});
 return {client,network,data,requests,writes,scope:()=>scope,advance:ms=>at+=ms,pause:()=>allowed=false,change:()=>scope={accountId:'FREEL_FF00000A-000A',documentId:'doc-two'},noResponse:()=>respond=false};
}
async function complete(f,session=1){let status;for(let i=0;i<9;i++){status=await f.client.autoRead(f.scope(),session);if(['complete','partial'].includes(status.phase))return status;}assert.fail('auto read did not settle');}
test('opening automatically requests missing loadout, expeditions, drone, daily and markets without changing any setting',async()=>{
 const f=fixture();assert.equal((await complete(f)).phase,'complete');assert.deepEqual(f.requests.map(x=>x.action),['requestLoadout','requestExpeditions','requestMercenaries','requestUsolMercenaries','requestExpeditionConfig','requestDroneOptions','fetchDailyOps','refreshAllMarketsSeq']);assert.equal(f.writes.length,0);assert.equal(f.data.autoSendMerc.enabled,false);assert.equal(f.data.autoDrone.enabled,false);
});
test('automatic reads wait behind initial fetch and other active or queued work without releasing their leases',async()=>{
 const f=fixture();let first,second;f.network.enqueue('initial-fetch',t=>first=t);f.network.enqueue('auto-daily',t=>second=t);
 assert.equal((await f.client.autoRead(f.scope(),1)).phase,'waiting');assert.equal(f.requests.length,0);assert.ok(first.valid());first.finish();
 assert.equal((await f.client.autoRead(f.scope(),1)).phase,'waiting');assert.equal(f.requests.length,0);assert.ok(second.valid());second.finish();
 assert.equal((await complete(f)).phase,'complete');
});
test('fresh data from initial fetch and rapid reopen are reused without duplicate requests',async()=>{
 const f=fixture();await complete(f);const count=f.requests.length;assert.equal((await complete(f,2)).phase,'complete');assert.equal(f.requests.length,count);
 f.advance(31000);assert.equal((await f.client.autoRead(f.scope(),3)).kind,'loadout');assert.equal(f.requests.length,count+1);
});
test('pending reads are coalesced across polling and reopening and lack of response is reported as partial',async()=>{
 const f=fixture();f.noResponse();await f.client.autoRead(f.scope(),1);
 await Promise.all([f.client.autoRead(f.scope(),1),f.client.autoRead(f.scope(),1)]);await f.client.autoRead(f.scope(),2);
 assert.equal(f.requests.filter(x=>x.action==='requestLoadout').length,1);
 for(let i=0;i<8;i++){f.advance(16000);const r=await f.client.autoRead(f.scope(),2);if(r.phase==='partial'){assert.ok(r.failed.includes('loadout'));return;}}
 assert.fail('missing data was treated as a completed read');
});
test('stale account or paused automation cannot start automatic reads',async()=>{
 for(const mode of ['change','pause']){const f=fixture(),old=f.scope();f[mode]();await assert.rejects(f.client.autoRead(old,1));assert.equal(f.requests.length,0);assert.equal(f.writes.length,0);}
});
test('page loader owns automatic reads independently of the panel and manual refresh stays available',()=>{
 const ui=src('inpage-controls.js'),manifest=JSON.parse(src('manifest.json'));assert.ok(!ui.includes('client().autoRead('));assert.ok(ui.includes('Cor3PageDataLoader?.status()'));assert.ok(ui.includes('>刷新配装</button>'));assert.ok(ui.includes('>刷新远征</button>'));const scripts=manifest.content_scripts.find(x=>x.js.includes('page-data-loader.js')).js;assert.ok(scripts.indexOf('content.js')<scripts.indexOf('page-data-loader.js'));assert.ok(scripts.indexOf('page-data-loader.js')<scripts.indexOf('inpage-controls.js'));
});

test('queued time is excluded from the response timeout and cannot cause duplicate reads after a long task',async()=>{
 const f=fixture();f.noResponse();await f.client.autoRead(f.scope(),1);let task;f.network.enqueue('auto-daily',t=>task=t);f.advance(120000);assert.equal((await f.client.autoRead(f.scope(),1)).phase,'waiting');task.finish();assert.equal((await f.client.autoRead(f.scope(),1)).phase,'loading');assert.equal(f.requests.filter(x=>x.action==='requestLoadout').length,1);
});

test('actual wrapped mercenary response is complete and does not cause a false partial result',async()=>{
 const f=fixture();await complete(f);f.data.mercenariesData={mercenaries:[],eliteSlots:[]};f.data.usolMercenariesData={mercenaries:[]};assert.equal((await complete(f,2)).phase,'complete');
});

test('late successful responses clear partial status without sending the failed batch again',async()=>{
 const f=fixture();f.noResponse();let result;for(let i=0;i<10;i++){result=await f.client.autoRead(f.scope(),1);if(result.phase==='partial')break;f.advance(16000);}assert.equal(result.phase,'partial');const count=f.requests.length;
 Object.assign(f.data,{loadoutData:{},loadoutUpdatedAt:100000,expeditionsData:[],expeditionsDataUpdatedAt:100000,mercenariesData:{mercenaries:[]},usolMercenariesData:{mercenaries:[]},expeditionConfigData:{},droneData:{drone:null},droneDataUpdatedAt:100000,dailyOpsData:{},dailyOpsUpdatedAt:100000,marketDataUpdatedAt:100000,darkMarketDataUpdatedAt:100000,soyuzMarketDataUpdatedAt:100000,usolMarketDataUpdatedAt:100000});
 // The fixture clock is 90000 after five timed-out sections.
 f.advance(10000);assert.equal((await f.client.autoRead(f.scope(),1)).phase,'complete');assert.equal(f.requests.length,count);
});
