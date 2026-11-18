import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../extension/page-data-loader.js',import.meta.url),'utf8');
async function flush(){for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));}
function fixture({allowedInitially=true,bootstrap=false}={}){
 let at=10000,n=0,allowed=allowedInitially,scope={accountId:'FREEL_FF000009-0009',documentId:'one'},reply=()=>({phase:'complete'});const timers=new Map(),calls=[],hooks={};
 const setTimer=(fn,ms)=>{const id=++n;timers.set(id,{fn,at:at+ms});return id;},clearTimer=id=>timers.delete(id);
 const automation={allowed:()=>allowed,onReady:f=>hooks.ready=f,onStop:f=>hooks.stop=f};const win={addEventListener:(e,f)=>hooks[e]=f};win.top=win;
 const client={autoRead:async(s,session,kinds)=>{calls.push({scope:s,session,kinds});return reply();}};
 const c=vm.createContext({setTimeout:setTimer,clearTimeout:clearTimer,Date:class extends Date{static now(){return at;}},Cor3CenterIdentity:{snapshot:()=>scope},Cor3Automation:automation,...(bootstrap?{window:win,Cor3InPageControls:client}:{})});vm.runInContext(src,c);
 const loader=bootstrap?c.Cor3PageDataLoader:c.Cor3PageDataLoaderFactory.create({client:()=>client,identity:{snapshot:()=>scope},allowed:()=>allowed,now:()=>at,setTimer,clearTimer});
 async function next(){const entries=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at);if(!entries.length)return false;const [id,t]=entries[0];timers.delete(id);at=Math.max(at,t.at);t.fn();await flush();return true;}
 return {loader,timers,calls,hooks,next,reply:f=>reply=f,allow:x=>allowed=x,change:()=>scope={accountId:'FREEL_FF00000A-000A',documentId:'two'},advance:ms=>at+=ms};
}
test('actual module bootstraps automatic reads with no popup, panel or document click',async()=>{const f=fixture({bootstrap:true});assert.equal(f.calls.length,0);await f.next();assert.equal(f.calls.length,1);assert.equal(f.loader.status().phase,'complete');});
test('startup waits for page permission and resumes through the actual onReady hook',async()=>{const f=fixture({bootstrap:true,allowedInitially:false});await f.next();assert.equal(f.calls.length,0);assert.equal(f.loader.status().phase,'waiting-permission');f.allow(true);f.hooks.ready();await f.next();assert.equal(f.calls.length,1);});
test('loading continues on a closed panel and completion does not repeatedly reissue a batch',async()=>{const f=fixture();let reads=0;f.reply(()=>({phase:++reads===1?'loading':'complete',kind:'loadout'}));f.loader.start();await f.next();await f.next();for(let i=0;i<4;i++)await f.next();assert.equal(f.calls.length,2);assert.equal(f.loader.status().phase,'complete');});
test('reopening trusts successful data for five minutes and expires on the next open',async()=>{const f=fixture();f.loader.start();await f.next();f.loader.ensure();await f.next();assert.equal(f.calls.length,1);f.advance(31000);f.loader.ensure();await f.next();assert.equal(f.calls.length,1);f.advance(269000);f.loader.ensure();await f.next();assert.equal(f.calls.length,2);assert.notEqual(f.calls[0].session,f.calls[1].session);});

test('the earliest actual data expiry is retained instead of extending it at batch completion',async()=>{const f=fixture();f.reply(()=>({phase:'complete',freshUntil:15000}));f.loader.start();await f.next();f.advance(4999);f.loader.ensure();await f.next();assert.equal(f.calls.length,1);f.advance(1);f.loader.ensure();await f.next();assert.equal(f.calls.length,2);});

test('rapid repeated opens share a pending read and cannot reset its session or duplicate dispatch',async()=>{const f=fixture();let finish;f.reply(()=>new Promise(resolve=>finish=resolve));f.loader.start();await f.next();for(let i=0;i<8;i++){f.loader.ensure();await f.next();}assert.equal(f.calls.length,1);finish({phase:'complete'});await flush();f.loader.ensure();await f.next();assert.equal(f.calls.length,1);});

test('a closed panel does not start a new read just because cached data ages beyond five minutes',async()=>{const f=fixture();f.loader.start();await f.next();f.advance(301000);for(let i=0;i<3;i++)await f.next();assert.equal(f.calls.length,1);f.loader.ensure();await f.next();assert.equal(f.calls.length,2);});
test('paused or changed account cannot accept a late completion from the previous scope',async()=>{const f=fixture();let finish;f.reply(()=>new Promise(r=>finish=r));f.loader.start();await f.next();f.change();f.loader.suspend();finish({phase:'complete'});await flush();assert.equal(f.loader.status().phase,'waiting-permission');f.reply(()=>({phase:'complete'}));await f.next();assert.equal(f.calls[1].scope.accountId,'FREEL_FF00000A-000A');assert.equal(f.loader.status().scope.accountId,'FREEL_FF00000A-000A');});
test('suspend respects saved pause without opening a gate or requesting data',async()=>{const f=fixture();f.loader.start();await f.next();f.allow(false);f.loader.suspend();await f.next();assert.equal(f.calls.length,1);assert.equal(f.loader.status().phase,'waiting-permission');});
test('actual pagehide hook cancels later work and cannot be restarted by panel ensure',async()=>{const f=fixture({bootstrap:true});f.hooks.pagehide();f.loader.ensure();assert.equal(f.timers.size,0);assert.equal(f.calls.length,0);assert.equal(f.loader.status().phase,'closed');});

test('a partial result is rechecked so late data can settle without a panel click',async()=>{const f=fixture();let read=0;f.reply(()=>++read===1?{phase:'partial',failed:['drone']}:{phase:'complete'});f.loader.start();await f.next();assert.equal(f.loader.status().phase,'partial');await f.next();assert.equal(f.loader.status().phase,'complete');});

test('partial startup retries failed kinds with one late check per attempt and a cap',async()=>{const f=fixture();f.reply(()=>({phase:'partial',failed:['drone']}));f.loader.start();for(let i=0;i<70;i++)await f.next();const sessions=[...new Set(f.calls.map(x=>x.session))];assert.equal(sessions.length,4);assert.equal(f.calls.length,8);const firstRetry=f.calls.find(x=>x.session===sessions[1]);assert.deepEqual(firstRetry.kinds,['drone']);assert.equal(f.loader.status().retries,3);assert.equal(f.loader.status().nextRetryAt,null);});
test('late data recovery cancels pending partial retries without opening a panel',async()=>{const f=fixture();let count=0;f.reply(()=>++count===1?{phase:'partial',failed:['loadout']}:{phase:'complete'});f.loader.start();for(let i=0;i<15;i++)await f.next();assert.equal(new Set(f.calls.map(x=>x.session)).size,1);assert.equal(f.loader.status().phase,'complete');});
test('a transport failure retains the current read cycle and reopening cannot skip its backoff',async()=>{
 const f=fixture();f.reply(()=>{throw Error('CENTER_STORE_TIMEOUT');});f.loader.start();await f.next();
 assert.equal(f.loader.status().phase,'retrying');assert.equal(f.loader.status().nextRetryAt,12000);
 for(let i=0;i<5;i++){f.loader.ensure();await f.next();}
 assert.equal(f.calls.length,1);await f.next();assert.equal(f.calls.length,2);
 assert.equal(f.loader.status().nextRetryAt,16000);assert.equal(f.calls[0].session,f.calls[1].session);
 f.reply(()=>({phase:'complete'}));await f.next();assert.equal(f.loader.status().phase,'complete');
});

test('settled or unavailable pages have at most one fallback wake per minute, and readiness wakes immediately',async()=>{
 const f=fixture({bootstrap:true,allowedInitially:false});
 await f.next();assert.equal([...f.timers.values()][0].at,70000);
 f.allow(true);f.hooks.ready();await f.next();
 assert.equal(f.calls.length,1);assert.equal([...f.timers.values()][0].at,70000);
 await f.next();assert.equal([...f.timers.values()][0].at,130000);assert.equal(f.calls.length,1);
});
test('ready during a revoked in-flight read takes precedence over the idle fallback',async()=>{
 const f=fixture({bootstrap:true});let finish;f.reply(()=>new Promise(r=>finish=r));await f.next();
 f.change();f.hooks.stop();f.hooks.ready();f.reply(()=>({phase:'complete'}));
 finish({phase:'complete'});await flush();assert.equal([...f.timers.values()][0].at,10000);
 await f.next();assert.equal(f.loader.status().scope.documentId,'two');assert.equal(f.calls.length,2);
});
