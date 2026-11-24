import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
function fixture(){
 let serial=0,allowed=true;const messages=[],writes=[],listeners=new Set();
 const el={isConnected:true,hidden:false,parentElement:null,textContent:'FREEL_FF000009-0009',getClientRects:()=>[{}],getBoundingClientRect:()=>({width:100,height:20,top:1,left:1,bottom:21,right:101}),getAttribute:()=>null,hasAttribute:()=>false};
 const w={postMessage:m=>messages.push(m),addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)};w.top=w;
 const c=vm.createContext({window:w,URL,Uint8Array,setTimeout,clearTimeout,innerWidth:1000,innerHeight:1000,location:{href:'https://cor3.gg/',origin:'https://cor3.gg'},crypto:{getRandomValues:a=>a.fill(++serial)},document:{documentElement:{},querySelectorAll:selector=>selector==='[data-component-name="UserIdentityUserNameText"]'?[el]:[]},getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1'}),MutationObserver:class{observe(){}disconnect(){}},setInterval:()=>1,clearInterval(){},addEventListener(){},Cor3Automation:{allowed:()=>allowed},Cor3CenterStore:{async set(value){writes.push(value);}},chrome:{runtime:{id:'fixture',onMessage:{addListener(){}},sendMessage:async()=>({ok:true})}},setSeqRefreshRunning(){},_automationActive:null,_automationQueue:[]});
 for(const name of ['page-lifetime.js','center-identity.js','run-log.js','network-coordinator.js'])vm.runInContext(src(name),c,{filename:name});
 const content=src('content.js');vm.runInContext(content.slice(content.indexOf('  function cor3AutomationAllowed()'),content.indexOf('  const expeditionRules')),c,{filename:'actual-content-header.js'});
 vm.runInContext(content.slice(content.indexOf('  function _automationQueueStatus()'),content.indexOf('  var _automationQueue, _automationActive;')),c);
 vm.runInContext(content.slice(content.indexOf('  function queueMarketRefresh('),content.indexOf('  // src/content/auto-update-markets.js')),c);
 return{c,el,messages,writes,deny:()=>allowed=false,listeners};
}
test('actual identity observer return shape admits actual content bootstrap into the endpoint queue',()=>{
 const f=fixture(),identity=f.c.Cor3CenterIdentity.snapshot();assert.equal(identity.accountId,'FREEL_FF000009-0009');assert.equal(Object.hasOwn(identity,'account'),false);
 const outcome=f.c.Cor3RequestBootstrap();assert.equal(outcome,'started');const status=f.c.Cor3NetworkRuntime.snapshot();assert.equal(status.accountId,identity.accountId);assert.equal(status.documentId,identity.documentId);assert.equal(status.active,'initial-fetch');assert.equal(f.messages.filter(x=>x.type==='COR3_INITIAL_FETCH_RUN').length,1);
});
test('actual panel market requests with actual identity use one account-scoped endpoint lease',()=>{
 const f=fixture();assert.equal(f.c.queueMarketRefresh({type:'COR3_REQUEST_MARKET'}),'started');assert.equal(f.c.queueMarketRefresh({type:'COR3_REQUEST_DARK_MARKET'}),'queued');const status=f.c.Cor3NetworkRuntime.snapshot();assert.equal(status.accountId,'FREEL_FF000009-0009');assert.equal(status.queued.length,1);assert.equal(f.messages.filter(x=>x.networkTicket).length,1);assert.ok(f.writes.some(x=>x.networkRuntimeStatus?.accountId==='FREEL_FF000009-0009'));
});
test('hidden or revoked real identity cannot start requests or inherit an old lease',()=>{
 const f=fixture();f.el.hidden=true;assert.equal(f.c.Cor3RequestBootstrap(),'master-paused');assert.equal(f.messages.filter(x=>x.networkTicket).length,0);f.el.hidden=false;assert.equal(f.c.Cor3RequestBootstrap(),'started');f.deny();f.el.hidden=true;vm.runInContext('network().pump()',f.c);assert.equal(f.c.Cor3NetworkRuntime.snapshot().active,null);assert.equal(f.c.queueMarketRefresh({type:'COR3_REQUEST_MARKET'}),'master-paused');
});
