import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
function coordinator(){let at=10000,allowed=true,busy=false,scope={accountId:'FREEL_FF000009-0009',documentId:'doc-a'};const c=vm.createContext({});vm.runInContext(src('network-coordinator.js'),c);const starts=[],tasks={},states=[];const q=c.Cor3NetworkCoordinator.create({now:()=>at,scope:()=>scope,allowed:()=>allowed,blocked:()=>busy,onChange:s=>states.push(plain(s)),ttlMs:5000});return {c,q,starts,tasks,states,add:type=>q.enqueue(type,t=>{starts.push(type);tasks[type]=t;}),time:v=>at=v,busy:v=>busy=v,allowed:v=>allowed=v,scope:v=>scope=v};}

test('queue holds the endpoint and runs waiting Daily before market by priority without preemption',()=>{const f=coordinator();f.add('auto-send');f.add('auto-update-markets');f.add('auto-daily');assert.deepEqual(f.starts,['auto-send']);assert.equal(f.q.snapshot().lease.owner,'auto-send');f.tasks['auto-send'].finish();assert.deepEqual(f.starts,['auto-send','auto-daily']);f.tasks['auto-daily'].finish();assert.deepEqual(f.starts,['auto-send','auto-daily','auto-update-markets']);f.tasks['auto-update-markets'].finish();assert.equal(f.q.snapshot().lease,null);});
test('duplicate requests do not acquire another lease; completion must have the owner ticket',()=>{const f=coordinator();assert.equal(f.add('auto-daily'),'started');assert.equal(f.add('auto-daily'),'already-running');f.add('auto-send');assert.equal(f.add('auto-send'),'already-queued');assert.equal(f.q.finish('auto-daily','wrong'),false);assert.equal(f.starts.length,1);f.tasks['auto-daily'].finish();assert.equal(f.q.finish('auto-send',f.tasks['auto-daily'].id),false);assert.equal(f.q.snapshot().lease.owner,'auto-send');});
test('timeout and thrown callback retain the endpoint instead of starting overlapping work',()=>{const f=coordinator();f.add('auto-daily');f.add('auto-send');f.time(16000);f.q.pump();assert.equal(f.q.snapshot().blocked,'lease-expired');assert.equal(f.starts.length,1);assert.equal(f.tasks['auto-daily'].renew(),false);f.tasks['auto-daily'].finish();assert.equal(f.starts.length,2);f.tasks['auto-send'].finish();f.q.enqueue('bad',()=>{throw Error('synthetic');});f.add('auto-daily');assert.equal(f.q.snapshot().blocked,'operation-failed');assert.equal(f.starts.length,2);});
test('game challenge blocks queued endpoint work and releases it when the challenge closes',()=>{const f=coordinator();f.busy(true);assert.equal(f.add('auto-daily'),'queued');assert.equal(f.starts.length,0);assert.equal(f.q.snapshot().blocked,'game-busy');f.busy(false);f.q.pump();assert.equal(f.starts.length,1);});
test('stop invalidates old callbacks and queued actions, including reuse of the same operation type',()=>{const f=coordinator();f.add('auto-daily');const old=f.tasks['auto-daily'];f.add('auto-send');f.q.cancel();assert.equal(old.valid(),false);f.add('auto-daily');assert.equal(old.finish(),false);assert.equal(f.q.snapshot().lease.id,f.tasks['auto-daily'].id);assert.ok(!f.starts.includes('auto-send'));});
test('account/document changes revoke the old queue; separate browser instances share no state',()=>{const f=coordinator(),g=coordinator();f.add('auto-daily');g.add('auto-send');f.scope({accountId:'FREEL_FF00000A-000A',documentId:'doc-b'});f.q.pump();assert.equal(f.q.snapshot().lease,null);assert.equal(f.tasks['auto-daily'].valid(),false);assert.equal(g.q.snapshot().lease.owner,'auto-send');f.allowed(false);assert.equal(f.add('auto-send'),'master-paused');});

const scheduleCtx=vm.createContext({});vm.runInContext(src('daily-schedule.js'),scheduleCtx);const plan=scheduleCtx.Cor3DailySchedule.plan;
test('Daily missing, malformed and unclaimed states retry in five minutes',()=>{for(const state of [null,{}, {hasClaimedToday:false}])assert.equal(plan({now:1000,state}).at,301000);});
test('Daily uses a genuine reset plus grace, not the old full-day fallback',()=>{const next=Date.parse('2026-11-16T00:00:00Z');const p=plan({now:next-3600000,state:{hasClaimedToday:true,nextTaskTime:new Date(next).toISOString()}});assert.equal(p.at,next+30000);assert.equal(p.reason,'next-task');});
test('Daily invalid, past and near resets retry within fifteen minutes and handle invalid intervals',()=>{for(const nextTaskTime of ['invalid',new Date(500).toISOString(),new Date(2000).toISOString()]){for(const intervalMinutes of [240,NaN,-1])assert.equal(plan({now:1000,state:{hasClaimedToday:true,nextTaskTime},intervalMinutes}).at,901000);}assert.equal(plan({now:1000,state:{hasClaimedToday:true},intervalMinutes:2}).at,121000);});

test('redaction covers nested credentials, circular data, error text and JSON/URL strings',()=>{const c=vm.createContext({});vm.runInContext(src('run-log.js'),c);const value={Authorization:'Bearer synthetic-only',cookie:'synthetic-cookie',sessionId:'synthetic-session',password:'synthetic-password',access_token:'synthetic-access',safe:'okay',inner:{bearerToken:'synthetic-bearer'}};value.loop=value;const output=JSON.stringify(c.Cor3RunLog.redact(value));for(const secret of ['synthetic-only','synthetic-cookie','synthetic-session','synthetic-password','synthetic-access','synthetic-bearer'])assert.ok(!output.includes(secret));assert.match(output,/okay/);const text=c.Cor3RunLog.text('Bearer synthetic-bearer {"access_token":"synthetic-access"} ?token=synthetic-query');assert.ok(!text.includes('synthetic-'));});
test('run logs are bounded, deduplicated and scoped to the current document',async()=>{let now=0,scope={accountId:'a',documentId:'one'};const saved=[],c=vm.createContext({});vm.runInContext(src('run-log.js'),c);const log=c.Cor3RunLog.create({now:()=>now,scope:()=>scope,sink:p=>saved.push(plain(p))});log.log('queue.started','start',{Authorization:'synthetic-secret'});log.log('queue.started','start',{Authorization:'synthetic-secret'});assert.equal(log.snapshot().length,1);for(let i=0;i<150;i++){now+=2000;log.log('queue.started','start');}await log.flush();assert.equal(log.snapshot().length,120);assert.ok(!JSON.stringify(saved).includes('synthetic-secret'));scope={accountId:'b',documentId:'two'};log.log('page.ready','ready');await log.flush();assert.equal(log.snapshot().length,1);assert.equal(saved.at(-1).documentId,'two');});
test('queued log persistence is abandoned when its document is revoked',async()=>{let scope={accountId:'a',documentId:'one'};const c=vm.createContext({}),saved=[];vm.runInContext(src('run-log.js'),c);const log=c.Cor3RunLog.create({scope:()=>scope,sink:p=>saved.push(p)});log.log('page.ready','ready');scope=null;await log.flush();assert.equal(saved.length,0);});

test('actual market bridge queues four panel reads and rejects unrelated/late completion messages',async()=>{
 const f=coordinator(),listeners=new Set(),callbacks={},sent=[],wakes=[];const w={addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn),postMessage(m){sent.push(m);queueMicrotask(()=>{const event={data:m,source:w,origin:'https://cor3.gg'};f.c.mainReceive(event);for(const fn of [...listeners])fn(event);});}};
 for(const name of ['Market','DarkMarket','SoyuzMarket','UsolMarket'])w['__cor3Request'+name]=cb=>callbacks[name]=cb;
 Object.assign(f.c,{window:w,location:{origin:'https://cor3.gg'},_automationEnqueue:(type,run)=>f.q.enqueue(type,run),setSeqRefreshRunning(){},_marketRefreshInProgress:false,Cor3InPageControls:{wakeAutoMarket:()=>wakes.push(f.q.current()?.id??null)}});
 const content=src('content.js'),start=content.indexOf('  function queueMarketRefresh('),end=content.indexOf('  // src/content/auto-update-markets.js',start);vm.runInContext(content.slice(start,end),f.c);
 const main=src('content-early.js'),a=main.indexOf('      if (event.data && event.data.type === "COR3_REQUEST_MARKET")'),b=main.indexOf('      if (event.data && event.data.type === "COR3_LEAVE_STASH")',a);vm.runInContext('function mainReceive(event){'+main.slice(a,b)+'}',f.c);
 f.add('auto-daily');for(const type of ['MARKET','DARK_MARKET','SOYUZ_MARKET','USOL_MARKET'])f.c.queueMarketRefresh({type:'COR3_REQUEST_'+type});assert.equal(sent.length,0);assert.equal(f.q.snapshot().queued.length,4);f.tasks['auto-daily'].finish();await flush();assert.equal(typeof callbacks.Market,'function');
 for(const fn of listeners)fn({source:w,origin:'https://example.invalid',data:{type:'COR3_NETWORK_DONE',networkTicket:f.q.current().id}});assert.match(f.q.current().type,/REQUEST_MARKET$/);
 callbacks.Market();await flush();assert.match(f.q.current().type,/DARK_MARKET$/);callbacks.Market();await flush();assert.match(f.q.current().type,/DARK_MARKET$/);callbacks.DarkMarket();await flush();callbacks.SoyuzMarket();await flush();callbacks.UsolMarket();await flush();assert.equal(f.q.current(),null);assert.equal(wakes.length,4);assert.equal(wakes.at(-1),null);
});

function alarmFixture(){let b={accountId:'FREEL_FF000009-0009',tabId:7,documentId:'doc-a'},at=10000;const data={autoDailyHackEnabled:true,dailyHackNextCheckAt:9000,helperMode:false},events={},calls=[];const event=name=>({addListener:fn=>events[name]=fn});const api={alarms:{onAlarm:event('alarm'),create:async(...a)=>calls.push(['create',...a]),clear:async(...a)=>calls.push(['clear',...a])},storage:{onChanged:event('storage')},tabs:{query(){assert.fail('tab fallback');},sendMessage:async(...a)=>calls.push(['send',...a])}};const binding={snapshot:()=>b,isCurrent:x=>x===b,guard:async(id,fn,x)=>{assert.equal(x,b);assert.equal(id,b.tabId);return fn();},onBound:fn=>events.bound=fn,onRevoke:fn=>events.revoke=fn};const c=vm.createContext({Cor3Automation:{allowed:()=>true}});vm.runInContext(src('daily-background.js'),c);const instance=c.Cor3DailyBackgroundFactory.create({api,binding,store:{get:async()=>({...data})},now:()=>at});return {c,instance,data,calls,events,change:x=>b=x};}
test('background alarm wakes only the already bound game tab and document',async()=>{const f=alarmFixture();await f.instance.sync();assert.equal(f.calls[0][0],'create');await f.instance.wake({name:'cor3DailyCheck:FREEL_FF000009-0009:doc-a'});const send=f.calls.find(x=>x[0]==='send');assert.equal(send[1],7);assert.equal(send[2].documentId,'doc-a');assert.equal(send[3].frameId,0);});
test('background alarm never binds another account, runs paused/off, or executes before due',async()=>{for(const mode of ['off','paused','unbound','future']){const f=alarmFixture();if(mode==='off')f.data.autoDailyHackEnabled=false;if(mode==='paused')f.data.helperMode=true;if(mode==='unbound')f.change(null);if(mode==='future')f.data.dailyHackNextCheckAt=999999;await f.instance.wake({name:'cor3DailyCheck:FREEL_FF000009-0009:doc-a'});assert.ok(!f.calls.some(x=>x[0]==='send'),mode);}});

test('unchanged account profile, defaults and Simple bridge are retained byte for byte',()=>{for(const name of ['center-profile.js','center-feature-defaults.js','solver-profile.js','simple-decrypt-bridge.js']){const hashes=JSON.parse(readFileSync(new URL('retained-hashes.json',import.meta.url),'utf8'));assert.equal(createHash('sha256').update(src(name)).digest('hex'),hashes[name],name);}});

function dailyFixture({state={hasClaimedToday:true},status=200,token=true,enabled=true,lock=null}={}){
 const f=coordinator(),data={autoDailyHackEnabled:enabled,helperMode:false,...(token?{bearerToken:'Bearer synthetic-only'}:{})},timers=[],injections=[],requests=[];
 const logs=[], dailyCalls=[];
 let epoch=1, stopped=0, listen;
 const store={
  get(keys,cb){
   const source={autoDailyHackEnabled:true,...data};
   const result=Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>Object.hasOwn(source,k)).map(k=>[k,source[k]]));
   const p=Promise.resolve(result);
   if(cb)p.then(cb);
   return p;
  },
  set(patch,cb){Object.assign(data,patch);const p=Promise.resolve();if(cb)p.then(cb);return p;},
  daily:async value=>{
   dailyCalls.push(value);
   if(value.action==='release'){delete data.dailyHackRunLock;return {released:true};}
   if(data.autoDailyHackEnabled===false)return {scheduled:false,acquired:false,disabled:true};
   if(value.action==='schedule'){data.dailyHackNextCheckAt=value.at;return {scheduled:true};}
   if(lock)return lock;
   data.dailyHackRunLock={owner:value.owner};
   return {acquired:true};
  },
  onChanged:{addListener(fn){listen=fn;}}
 };
 class ClockDate extends Date {static now(){return 10000;}}
 Object.assign(f.c,{Date:ClockDate,runtimeLog:{log:(code,message)=>logs.push({code,message})},window:{postMessage(){},addEventListener(){}},document:{addEventListener(){}},dailyEpoch:()=>epoch,dailyValid:e=>e===epoch,cor3AutomationAllowed:()=>true,dailyLater:(fn,ms)=>{timers.push({fn,ms});return 1;},clearTimeout(){},dailyHackInjected:false,dailyLockOwner:null,dailyEnabledEpoch:1,stopDailyHackSolver(){stopped++;epoch++;f.c.clearDailyHackTimer();},enableDailyHackCommand(){},Cor3CenterStore:store,withDailyToken:cb=>cb(data.bearerToken,()=>true),injectDailyHackSolver(){injections.push(1);f.c.dailyHackInjected=true;},ensureAntiAfkEnabled(){},fetchDailyRewards(){},_automationEnqueue:(type,run)=>f.q.enqueue(type,run),fetch:async(url,options)=>{requests.push({url,authorized:!!options.headers.Authorization});return {ok:status===200,status,json:async()=>state};}});
 vm.runInContext(src('daily-schedule.js'),f.c);const code=src('content.js'),a=code.indexOf('  var _dailyHackStartInProgress = false;'),b=code.indexOf('  function fetchDailyRewards(',a);Object.assign(f.c,{AbortSignal});vm.runInContext(code.slice(code.indexOf('  function dailyReadOptions'),code.indexOf('  const dailyRetryClock')),f.c);vm.runInContext(code.slice(a,b),f.c);
 return {...f,data,timers,injections,requests,logs,dailyCalls,store,stopped:()=>stopped,notify:change=>listen({autoDailyHackEnabled:change},'local'),start:()=>f.c.startDailyHackAutomation('scheduled',false)};
}
test('actual Daily engine skips an already claimed day, releases lease and saves the reset wakeup',async()=>{const next=Date.parse('2026-11-16T00:00:00Z'),f=dailyFixture({state:{hasClaimedToday:true,nextTaskTime:new Date(next).toISOString()}});f.start();await flush();assert.equal(f.injections.length,0);assert.equal(f.data.dailyHackNextCheckAt,next+30000);assert.equal(f.q.current(),null);assert.equal(f.requests.length,1);});
test('actual Daily HTTP failure and malformed state do not inject a solver and retry after five minutes',async()=>{for(const cfg of [{status:401},{state:null},{state:{}}]){const f=dailyFixture(cfg);f.start();await flush();assert.equal(f.injections.length,0);assert.equal(f.data.dailyHackNextCheckAt,310000);assert.equal(f.q.current(),null);}});
test('actual unclaimed Daily holds its endpoint through the solver and releases after its result',async()=>{const f=dailyFixture({state:{hasClaimedToday:false}});f.start();await flush();assert.equal(f.injections.length,1);assert.equal(f.q.snapshot().lease.owner,'auto-daily');f.c.handleDailyHackRunFinished({success:false,reason:'synthetic-failure'});await flush();assert.equal(f.q.current(),null);assert.equal(f.data.dailyHackNextCheckAt,310000);});
test('missing session or disabled Daily does not inject or retain the endpoint',async()=>{const missing=dailyFixture({token:false});missing.start();await flush();assert.equal(missing.q.current(),null);assert.equal(missing.injections.length,0);assert.equal(missing.data.dailyHackNextCheckAt,70000);const off=dailyFixture({enabled:false});off.start();await flush();assert.equal(off.q.current(),null);assert.equal(off.requests.length,0);});

test('a missing preference is enabled by default and never emits a disable event', async () => {
 const f=dailyFixture();
 delete f.data.autoDailyHackEnabled;
 f.notify({oldValue:true});
 await flush();
 assert.equal(f.stopped(),0);
 assert.ok(!f.logs.some(entry=>entry.code==='daily.toggle.disable'));
});

test('a contended Daily schedules one retry, then a delayed schedule reply cannot rearm after off', async () => {
 const f=dailyFixture({state:{hasClaimedToday:false},lock:{acquired:false,ageMs:411693,retryInMs:120000}});
 const runDaily=f.store.daily;
 let reply;
 f.store.daily=value=>value.action==='schedule'?new Promise(resolve=>reply=resolve):runDaily(value);
 f.start();
 await flush();
 assert.equal(typeof reply,'function');
 assert.equal(f.injections.length,0);
 f.data.autoDailyHackEnabled=false;
 f.notify({newValue:false});
 await flush();
 reply({scheduled:true});
 await flush();
 assert.equal(f.stopped(),1);
 assert.equal(f.timers.length,0);
 assert.equal(f.q.current(),null);
 assert.deepEqual(f.logs.filter(entry=>entry.code==='daily.schedule.next'),[]);
});

test('a prior document alarm cannot wake a newly bound account',async()=>{const f=alarmFixture();f.change({accountId:'FREEL_FF00000A-000A',tabId:9,documentId:'doc-b'});await f.instance.wake({name:'cor3DailyCheck:FREEL_FF000009-0009:doc-a'});assert.equal(f.calls.length,0);});

test('actual startup fetch requests queue admission and acknowledges only its own completed ticket',()=>{
 const messages=[],steps=[],w={postMessage:m=>messages.push(m)},c=vm.createContext({window:w,location:{origin:'https://cor3.gg'},cor3AutomationAllowed:()=>true,console:{log(){}},humanDelay:()=>1,setTimeout:fn=>fn(),clearTimeout(){},getMarketRefreshAbortId:()=>0,stableReads:{cancelAll(){}}});w.__cor3MasterGate={snapshot:()=>({generation:1})};
 for(const name of ['Market','DarkMarket','SoyuzMarket','UsolMarket','UsolMercenaries'])w['__cor3Request'+name]=(callback,rosterOnly)=>{if(name==='UsolMercenaries')assert.equal(rosterOnly,true);steps.push(name);callback();};
 w.__cor3RequestMercenaries=(_arg,callback,rosterOnly)=>{assert.equal(rosterOnly,true);steps.push('Mercenaries');callback();};for(const name of ['Stash','Specialists','ArchivedExpeditions','Loadout','Updater'])w['__cor3Request'+name]=()=>steps.push(name);
 const code=src('content-early.js'),a=code.indexOf('  var initialFetchDone = false;'),b=code.indexOf('  window.__cor3KeepAlive',a);vm.runInContext(code.slice(a,b),c);
 w.__cor3InitialFetch();assert.equal(steps.length,0);assert.equal(messages[0].type,'COR3_INITIAL_FETCH_REQUEST');w.__cor3InitialFetchExclusive('ticket-one');assert.ok(steps.includes('UsolMercenaries'));assert.equal(messages.filter(m=>m.type==='COR3_NETWORK_DONE').at(-1).networkTicket,'ticket-one');assert.equal(w.__cor3InitialFetchInProgress,false);const before=steps.length;w.__cor3InitialFetchExclusive('ticket-two');assert.equal(steps.length,before);assert.equal(messages.at(-1).networkTicket,'ticket-two');
});

test('status panel distinguishes unread/stale state and excludes another account log',async()=>{
 const callbacks={},output={textContent:''},details={open:true,addEventListener:(name,fn)=>callbacks[name]=fn},binding={accountId:'current',documentId:'current-doc'};let fail=false,data={networkRuntimeStatus:{accountId:'previous',documentId:'previous-doc'}};
 const c=vm.createContext({document:{getElementById:id=>id==='runtimeStatus'?details:output},Cor3CenterUi:{ready:Promise.resolve(),binding:async()=>binding},Cor3CenterStore:{get:async()=>{if(fail)throw Error('synthetic');return data;},onChanged:{addListener(){}}}});vm.runInContext(src('runtime-status-ui.js'),c);await flush();assert.match(output.textContent,/尚未读取/);
 data={networkRuntimeStatus:{accountId:'current',documentId:'current-doc',active:'auto-daily',queued:['auto-send'],lease:{owner:'auto-daily'}},automationRunLogs:{accountId:'previous',documentId:'current-doc',entries:[{at:1,code:'foreign',message:'foreign-account-entry'}]}};callbacks.toggle();await flush();assert.match(output.textContent,/auto-daily/);assert.match(output.textContent,/auto-send/);assert.ok(!output.textContent.includes('foreign-account-entry'));fail=true;callbacks.toggle();await flush();assert.match(output.textContent,/许可或账号未确认/);
});
