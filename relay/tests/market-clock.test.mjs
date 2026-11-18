import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../extension/market-refresh-clock.js',import.meta.url),'utf8');
function factory(){const c=vm.createContext({});vm.runInContext(src,c);return c.Cor3MarketClockFactory;}
const at=1800000000000,iso=n=>new Date(n).toISOString();
const cached=(deadline=at+100000)=>Object.fromEntries(['marketData','darkMarketData','soyuzMarketData','usolMarketData'].flatMap(k=>[[k,{nextJobsResetAt:iso(deadline)}],[k+'UpdatedAt',at]]));
test('future cached deadlines are checked against wall time, not a decrementing UI counter',()=>{const f=factory(),data=cached();data.marketData.nextJobsResetAt=iso(at+20000);const p=f.plan(data,{},at);assert.equal(p.due,false);assert.equal(p.at,at+22000);assert.equal(f.plan(data,p,at+22000).due,true);});
test('a single expired market makes the refresh due even while the other three are hours away',()=>{const f=factory(),data=cached(at+7200000);data.soyuzMarketData.nextJobsResetAt=iso(at-3000);const p=f.plan(data,{},at);assert.equal(p.due,true);assert.deepEqual(Array.from(p.markets),['soyuz']);});
test('sleep or forward wall-clock jumps catch up in one check without replaying missed ticks',()=>{const f=factory(),data=cached(at+3600000),p=f.plan(data,{},at);assert.equal(p.due,false);assert.equal(f.plan(data,p,at+7200000).due,true);});
test('unknown or failed reset replies retry after a bounded minute, not every heartbeat',()=>{const f=factory(),data=cached(at-3000),state={lastAttemptAt:at};assert.equal(f.plan(data,state,at+59999).due,false);assert.equal(f.plan(data,state,at+60000).due,true);});
test('missing cache probe deadline persists rather than sliding forward on every check',()=>{const f=factory(),p=f.plan({},null,at),q=f.plan({},p,at+30000);assert.equal(p.at,at+600000);assert.equal(q.at,p.at);assert.equal(f.plan({},q,at+600001).due,true);});
test('moving system time backwards resets stale retry timestamps without mutating server deadlines',()=>{const f=factory(),data=cached(at+3600000),p=f.plan(data,{observedAt:at+7200000,lastAttemptAt:at+7200000},at);assert.equal(p.reason,'clock-backward');assert.equal(p.lastAttemptAt,0);assert.equal(p.at,at+3602000);assert.equal(data.marketData.nextJobsResetAt,iso(at+3600000));});
function fixture(){let time=at,allowed=true,busy=false,scope={accountId:'FREEL_FF000009-0009',documentId:'doc'},hook=null;const data=cached(at-3000),writes=[],calls=[],f=factory();
 const runner=f.create({scope:()=>scope,allowed:()=>allowed,busy:()=>busy,read:async()=>structuredClone(data),write:async(state)=>{data.marketRefreshClockV1=structuredClone(state);writes.push(state);if(hook)hook();},enqueue:request=>calls.push(Array.from(request.markets)),now:()=>time});
 return {data,writes,calls,runner,time:n=>time=n,busy:x=>busy=x,deny:()=>allowed=false,change:()=>scope={...scope,documentId:'other'},hook:fn=>hook=fn};
}
test('the real clock persists an attempt before one queue admission; concurrent wake events coalesce',async()=>{const f=fixture();await Promise.all([f.runner.tick(),f.runner.tick(),f.runner.tick()]);assert.equal(f.calls.length,1);assert.equal(f.writes[0].lastAttemptAt,at);await f.runner.tick();assert.equal(f.calls.length,1);});
test('minigames and an occupied endpoint defer clock reads and admission',async()=>{const f=fixture();f.busy(true);await f.runner.tick();assert.equal(f.writes.length,0);assert.equal(f.calls.length,0);f.busy(false);await f.runner.tick();assert.equal(f.calls.length,1);});
test('a revoked document during persistence cannot queue a market refresh',async()=>{const f=fixture();f.hook(()=>f.change());await f.runner.tick();assert.equal(f.calls.length,0);});
test('turning auto refresh off preserves cached state and sends nothing',async()=>{const f=fixture();f.data.autoUpdateMarkets=false;await f.runner.tick();assert.equal(f.writes.length,0);assert.equal(f.calls.length,0);});
test('a verified later reset replaces the old deadline and prevents another refresh',async()=>{const f=fixture();await f.runner.tick();Object.assign(f.data,cached(at+3600000));f.time(at+120000);await f.runner.tick();assert.equal(f.calls.length,1);assert.equal(f.writes.at(-1).nextCheckAt,at+3602000);});

test('each unconfirmed market backs off up to fifteen minutes without delaying a different market',async()=>{
 const f=fixture();Object.assign(f.data,cached(at+3600000));f.data.marketData.nextJobsResetAt=iso(at-3000);f.data.darkMarketData.nextJobsResetAt=iso(at+30000);
 await f.runner.tick();f.time(at+32000);await f.runner.tick();assert.deepEqual(f.calls,[['home'],['dark']]);
 f.data.darkMarketData.nextJobsResetAt=iso(at+3600000);
 let time=at;
 for(const delay of [60000,120000,240000,480000,900000,900000]){
  const count=f.calls.length;time+=delay;
  f.time(time-1);await f.runner.tick();assert.equal(f.calls.length,count);
  f.time(time);await f.runner.tick();assert.deepEqual(f.calls.at(-1),['home']);assert.equal(f.calls.length,count+1);
 }
 f.data.marketData.nextJobsResetAt=iso(time+50000);await f.runner.tick();
 assert.equal(f.data.marketRefreshClockV1.retryByMarket.home,undefined);
 f.time(time+52000);await f.runner.tick();assert.equal(f.data.marketRefreshClockV1.retryByMarket.home.count,1);
});

test('a queue that becomes busy before dispatch does not spend a market retry',async()=>{
 const f=fixture();f.hook(()=>f.busy(true));await f.runner.tick();assert.equal(f.calls.length,0);
 assert.deepEqual(f.data.marketRefreshClockV1.retryByMarket,{});
 f.hook(null);f.busy(false);await f.runner.tick();assert.equal(f.calls.length,1);
});
