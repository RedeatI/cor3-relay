import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
function fixture(){let epoch=1,allowed=true,at=0,n=0,transport=true;const listeners=new Set(),timers=new Map(),packets=[],events=[],configured=[];
 const c=vm.createContext({setTimeout,clearTimeout});vm.runInContext(src('read-runtime.js'),c);
 const emit=d=>{for(const fn of [...listeners])fn(d);};const runtime=c.Cor3ReadRuntimeFactory.create({epoch:()=>epoch,allowed:()=>allowed,listen:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},send:p=>{packets.push(JSON.parse(p.slice(2))[1]);return transport;},configure:(id,marketId)=>{configured.push({id,marketId});return transport;},pickConfig:()=>({locationConfigId:'location',zoneConfigId:'zone',goalId:'goal'}),notify:x=>events.push(x),setTimer:(fn,ms)=>{const id=++n;timers.set(id,{fn,at:at+ms});return id;},clearTimer:id=>timers.delete(id)});
 function advance(ms){const end=at+ms;for(let i=0;i<1000;i++){const next=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;const[id,t]=next;timers.delete(id);at=t.at;t.fn();}at=end;}
 return {runtime,packets,events,configured,emit,advance,listeners,timers,revoke:()=>{epoch++;allowed=false;runtime.cancelAll();},resume:()=>{epoch++;allowed=true;},transport:x=>transport=x};
}
const home={marketType:'home',marketId:'home'},remote={marketType:'usol',marketId:'usol',serverId:'server-usol',unreachableType:'COR3_WS_USOL_MARKET_UNREACHABLE'};
const merc={...home,mercType:'MERC',configType:'CONFIG'};
test('duplicate mercenary readers share one request and both callbacks settle exactly once',()=>{const f=fixture(),a=[],b=[];f.runtime.mercenaries(merc,x=>a.push(x));f.runtime.mercenaries(merc,x=>b.push(x));assert.equal(f.packets.length,1);f.emit({type:'MERC',data:{mercenaries:[]}});f.advance(500);f.emit({type:'CONFIG',data:{locations:[]}});assert.equal(a.length,1);assert.equal(b.length,1);assert.equal(a[0].status,'ok');assert.equal(f.runtime.active(),0);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);});
test('late data timeout is partial and cannot become a false empty success',()=>{const f=fixture(),r=[];f.runtime.mercenaries(merc,x=>r.push(x));f.advance(30000);assert.equal(r[0].status,'partial');assert.equal(r[0].code,'MERC_DATA_TIMEOUT');assert.equal(f.listeners.size,0);});
test('remote endpoint rejection never starts market reads or path-through',()=>{const f=fixture(),r=[];f.runtime.market(remote,x=>r.push(x));f.emit({type:'COR3_WS_ENDPOINT_RESULT',success:false,error:{message:'no-path'}});assert.equal(r[0].status,'unavailable');assert.equal(f.packets.length,1);assert.equal(f.listeners.size,0);});
test('an unacknowledged endpoint holds the attempt and resumes on its late acknowledgement',()=>{const f=fixture(),r=[];f.runtime.market(remote,x=>r.push(x));f.advance(10000);assert.equal(r.length,0);assert.equal(f.packets.length,1);assert.equal(f.events.at(-1).code,'ENDPOINT_UNCONFIRMED');f.emit({type:'COR3_WS_ENDPOINT_RESULT',success:true,serverId:'server-usol'});assert.equal(f.packets.length,4);f.emit({type:'COR3_MARKET_FETCH_COMPLETE',marketType:'usol',marketId:'usol'});assert.equal(r[0].status,'ok');assert.equal(f.runtime.active(),0);});
test('another endpoint or market cannot settle the current read',()=>{const f=fixture(),r=[];f.runtime.market(remote,x=>r.push(x));f.emit({type:'COR3_WS_ENDPOINT_RESULT',success:true,serverId:'other'});assert.equal(f.packets.length,1);f.emit({type:'COR3_MARKET_FETCH_COMPLETE',marketType:'home',marketId:'home'});assert.equal(r.length,0);});
test('jobs-only refresh omits lots and settles only its matching market',()=>{const f=fixture(),r=[];f.runtime.market({...home,jobsOnly:true},x=>r.push(x));assert.deepEqual(f.packets.map(p=>p.event.action),['get.options','get.jobs']);f.emit({type:'COR3_MARKET_FETCH_COMPLETE',marketType:'home',marketId:'home'});assert.equal(r[0].status,'ok');});
test('a missing socket reports unavailable and stops the read without more packets',()=>{const f=fixture(),r=[];f.transport(false);f.runtime.market(home,x=>r.push(x));f.advance(30000);assert.equal(r[0].status,'unavailable');assert.equal(f.packets.length,1);assert.equal(f.listeners.size,0);});
test('mercenary configure acknowledgements must match the individual mercenary',()=>{const f=fixture(),r=[];f.runtime.mercenaries(merc,x=>r.push(x));f.emit({type:'MERC',data:{mercenaries:[{id:'one'},{id:'two'}]}});f.emit({type:'CONFIG',data:{locations:[]}});assert.equal(f.configured.length,1);f.emit({type:'COR3_WS_MERC_CONFIGURE',mercenaryId:'other',data:{}});f.advance(6000);assert.equal(f.configured.length,1);assert.equal(r.length,0);assert.equal(f.events.at(-1).code,'MERC_CONFIGURE_UNCONFIRMED');f.emit({type:'COR3_WS_MERC_CONFIGURE',mercenaryId:'one',data:{}});f.advance(200);assert.equal(f.configured.length,2);f.emit({type:'COR3_WS_MERC_CONFIGURE',mercenaryId:'two',data:{}});f.advance(200);assert.equal(r[0].status,'ok');});
test('epoch revocation cancels waiters and removes timers; resume cannot revive old reads',()=>{const f=fixture(),r=[];f.runtime.mercenaries(merc,x=>r.push(x));f.revoke();assert.equal(r[0].status,'cancelled');assert.equal(f.listeners.size,0);assert.equal(f.timers.size,0);f.resume();f.advance(60000);f.emit({type:'CONFIG',data:{locations:[]}});assert.equal(f.packets.length,1);assert.equal(f.configured.length,0);});
test('one read instance cannot cancel another browser/account instance',()=>{const a=fixture(),b=fixture(),results=[];a.runtime.market(home,()=>{});b.runtime.market(home,x=>results.push(x));a.revoke();b.emit({type:'COR3_MARKET_FETCH_COMPLETE',marketType:'home',marketId:'home'});assert.equal(results[0].status,'ok');});
test('callback failure does not prevent another waiter or cleanup',()=>{const f=fixture(),results=[];f.runtime.market(home,()=>{throw Error('caller-failed');});f.runtime.market(home,x=>results.push(x));f.emit({type:'COR3_MARKET_FETCH_COMPLETE',marketType:'home',marketId:'home'});assert.equal(results[0].status,'ok');assert.equal(f.runtime.active(),0);});
test('overlapping drone status readers share one packet and a timeout allows a later read',()=>{
 const f=fixture(),replies=[];for(let i=0;i<10;i++)f.runtime.droneOptions(result=>replies.push(result));
 assert.equal(f.packets.length,1);assert.equal(f.packets[0].event.action,'get.options');
 f.emit({type:'COR3_WS_DRONE_ERROR',action:'launch'});assert.equal(replies.length,0);
 f.advance(15000);assert.equal(replies.length,10);assert.ok(replies.every(x=>x.code==='DRONE_OPTIONS_TIMEOUT'));
 f.runtime.droneOptions(result=>replies.push(result));f.emit({type:'COR3_WS_DRONE_OPTIONS',action:'get.options'});
 assert.equal(f.packets.length,2);assert.equal(replies.at(-1).status,'ok');assert.equal(f.runtime.active(),0);
});

test('the real drone polling adapter skips fresh responses and in-flight callbacks from a previous document',()=>{
 const code=src('content.js');let at=100000,scope={accountId:'FREEL_FF000009-0009',documentId:'first'},reply,reads=0;const messages=[];
 const c={networkScope:()=>scope,isContextValid:()=>true,cor3AutomationAllowed:()=>true,Date:{now:()=>at},lastDroneOptionsRead:{...scope,at},Cor3CenterStore:{get(_key,callback){++reads;reply=callback;}},window:{postMessage:m=>messages.push(m)}};
 vm.runInNewContext(code.slice(code.indexOf('  function pollDroneOptions()'),code.indexOf('  setInterval(pollDroneOptions')),c);
 c.pollDroneOptions();assert.equal(reads,0);
 at+=60000;c.pollDroneOptions();assert.equal(reads,1);scope={...scope,documentId:'second'};
 reply({autoDrone:{enabled:true}});assert.equal(messages.length,0);
 c.pollDroneOptions();reply({autoDrone:{enabled:true}});assert.equal(messages.length,1);
});
test('the real configure adapter removes an unsent pending ID instead of waiting forever',()=>{const code=src('content-early.js'),w={__cor3PendingMercConfigures:[]},c={window:w,HOME_MARKET_ID:'home',wsSend:()=>false,console:{log(){}}};vm.runInNewContext(code.slice(code.indexOf('  window.__cor3RequestMercConfigure ='),code.indexOf('  window.__cor3RequestUsolMercenaries =')),c);assert.equal(w.__cor3RequestMercConfigure('merc','home','location','zone','goal'),false);assert.equal(w.__cor3PendingMercConfigures.length,0);});
function transportFixture(){let at=10000,epoch=1,abort=1,socket=true;const sent=[],warnings=[],scheduled=[];const ws={readyState:1,send:m=>sent.push(m)};
 const c=vm.createContext({window:{__cor3MasterGate:{snapshot:()=>({generation:epoch}),permitsPacket:()=>true},postMessage:m=>warnings.push(m)},location:{origin:'https://cor3.gg'},Cor3MasterCore:{isReadOnlyPacket:m=>m==='read'},Date:{now:()=>at},getMarketRefreshAbortId:()=>abort,getActiveSocket:()=>socket?ws:null,setActiveSocket(){},OrigWebSocket:{OPEN:1},trackedSockets:[],socketLastActivity:new Map(),WS_THROTTLE_MS:200,WS_QUEUE_MAX:3,wsSendLastTime:0,wsSendQueue:[],wsSendFlushTimer:null,scheduleFlush:ms=>scheduled.push(ms)});
 const code=src('content-early.js');vm.runInContext(code.slice(code.indexOf('  function packetStamp('),code.indexOf('  function queueRetryOp(')),c);return {c,sent,warnings,advance:ms=>at+=ms,pause:()=>epoch++,change:()=>abort++,disconnect:()=>socket=false,ws};
}
test('old queued packets cannot cross a pause/resume generation',()=>{const f=transportFixture();f.c.wsSendLastTime=10000;f.c.wsSend('mutation');f.pause();f.advance(500);f.c.wsSendFlush();assert.equal(f.sent.length,0);assert.equal(f.warnings.at(-1).code,'PACKET_EXPIRED');});
test('queued packets retain original session generation and finite lifetime',()=>{for(const change of ['change','expire']){const f=transportFixture();f.c.wsSendLastTime=10000;f.c.wsSend('mutation');if(change==='change')f.change();f.advance(change==='expire'?6000:500);f.c.wsSendFlush();assert.equal(f.sent.length,0);}});
test('missing sockets fail rather than replaying commands when another socket appears',()=>{const f=transportFixture();f.disconnect();assert.equal(f.c.wsSend('mutation'),false);assert.equal(f.c.wsSendQueue.length,0);assert.equal(f.sent.length,0);});
test('a thrown send stays unconfirmed and never enters a retry queue',()=>{const f=transportFixture();f.ws.send=()=>{throw Error('unknown-socket-outcome');};assert.equal(f.c.wsSend('mutation'),false);assert.equal(f.c.wsSendQueue.length,0);assert.equal(f.warnings.at(-1).code,'SEND_UNCONFIRMED');assert.ok(!JSON.stringify(f.warnings).includes('mutation'));});
test('queue overflow rejects the new command without silently dropping an earlier step',()=>{const f=transportFixture();f.c.wsSendLastTime=10000;for(const cmd of ['a','b','c'])f.c.wsSend(cmd);assert.equal(f.c.wsSend('d'),false);assert.deepEqual(Array.from(f.c.wsSendQueue,x=>x.msg),['a','b','c']);});

test('repair acknowledges only repair while a joined status read waits for actual options',()=>{
 const f=fixture(), received=[];
 const c={window:{postMessage:m=>f.emit(m)}};
 const main=src('content-early.js');
 vm.runInNewContext(main.slice(main.indexOf('  function handleDroneMessage('),main.indexOf('  window.__cor3RequestDroneOptions')),c);
 f.runtime.droneOptions(result=>received.push(result));
 c.handleDroneMessage('drone-missions',{event:{action:'repair'},data:{durability:10}});
 f.emit({type:'COR3_WS_DRONE_OPTIONS'});
 assert.equal(received.length,0);
 c.handleDroneMessage('drone-missions',{event:{action:'get.options'},data:{drone:null}});
 assert.equal(received[0].status,'ok');assert.equal(f.packets.length,1);
});

test('session expiry affects only the reporting game socket and repeated or puzzle events do not reset the page',()=>{
 let allowed=true, resets=0,notices=0;
 const socket=()=>({readyState:1,closed:0,close(){this.closed++;}});
 const a=socket(),b=socket(),puzzle=socket();puzzle.__cor3IsMinigame=true;
 const c={trackedSockets:[a,b],expiredSockets:new WeakSet(),cor3AutomationAllowed:()=>allowed,setCapturedBearerToken(){},
  setTokenExpiredFlag(){},bumpMarketRefreshAbortId:()=>++resets,console:{log(){}},OrigWebSocket:{OPEN:1},queueRetryOp(){},
  window:{postMessage(){notices++;}}};
 const main=src('content-early.js'),start=main.indexOf('    if (eventName === "error" && payload && payload.message === "token-expired")');
 vm.runInNewContext('function receive(socket,eventName,payload){'+main.slice(start,main.indexOf('    if (eventName === "specialists"',start))+'}',c);
 for(const ws of [puzzle,socket(),a,a])c.receive(ws,'error',{message:'token-expired'});
 assert.deepEqual([a.closed,b.closed,puzzle.closed,resets,notices],[1,0,0,1,1]);
 allowed=false;c.receive(b,'error',{message:'token-expired'});assert.equal(b.closed,0);assert.equal(resets,1);
});
