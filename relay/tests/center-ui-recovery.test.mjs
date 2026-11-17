import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const source=readFileSync(new URL('../extension/center-ui.js',import.meta.url),'utf8');
async function flush(){for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));}
function fixture(codes=[]){
 let at=10000,n=0,windowId=10,current={windowId:10,tabId:4,accountId:'FREEL_FF000009-0009',documentId:'11'.repeat(16),url:'https://cor3.gg/',epoch:1},responses=[...codes];const calls=[],timers=new Map(),events={},status={textContent:''};
 const c={Date:class extends Date{static now(){return at;}},setTimeout:(fn,ms)=>{timers.set(++n,{fn,at:at+ms});return n;},clearTimeout:id=>timers.delete(id),addEventListener:(e,fn)=>events[e]=fn,document:{getElementById:()=>status},chrome:{windows:{getCurrent:async()=>({id:windowId,type:'normal'})},runtime:{getURL:p=>'ext://fixture/'+p,async sendMessage(m){calls.push(m);if(m.type==='cor3-center-auto-bind'){const code=responses.length>1?responses.shift():responses[0];return code?{ok:false,code}:{ok:true,tab:{...current}};}if(m.type==='centerResolve')return {ok:true,tab:{...current}};return {ok:true,value:{}};}}}};
 vm.runInNewContext(source,c);
 async function next(){await flush();const [id,t]=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0]||[];if(!t)return false;timers.delete(id);at=t.at;t.fn();await flush();return true;}
 return {ui:c.Cor3CenterUi,api:c.chrome,calls,timers,events,status,next,setCodes:xs=>responses=[...xs],advance:ms=>at+=ms,window:id=>windowId=id,replace:()=>current={...current,documentId:'22'.repeat(16),epoch:2}};
}
test('temporarily missing selector recovers in the same popup and all startup readers share one initialization',async()=>{
 const f=fixture(['CENTER_IDENTITY_SELECTOR_MISSING',null]);const pending=Promise.all([f.ui.binding(),f.ui.binding()]);await f.next();assert.ok(await f.ui.ready);const [a,b]=await pending;assert.equal(a.documentId,b.documentId);assert.equal(f.calls.filter(x=>x.type==='cor3-center-auto-bind').length,2);assert.ok(f.calls.every(x=>x.type==='cor3-center-auto-bind'||x.type==='centerResolve'));assert.equal(f.timers.size,0);
});
test('identity ambiguity, migration uncertainty and other-window binding are never retried or overwritten',async()=>{
 for(const code of ['CENTER_IDENTITY_SELECTOR_MULTIPLE','CENTER_MIGRATION_REVIEW_REQUIRED','CENTER_OTHER_WINDOW_BOUND','CENTER_SAVED_ACCOUNT_MISMATCH']){const f=fixture([code]);assert.equal(await f.ui.ready,null);await assert.rejects(f.ui.binding());assert.equal(f.calls.length,1);assert.equal(f.timers.size,0);}
});
test('bounded startup retries stop and a later verified read can recover after the cooldown',async()=>{
 const f=fixture(['CENTER_IDENTITY_SELECTOR_MISSING']);for(let i=0;i<3;i++)await f.next();assert.equal(await f.ui.ready,null);assert.equal(f.calls.length,4);assert.equal(f.timers.size,0);f.setCodes([]);await assert.rejects(f.ui.binding(),/SELECTOR_MISSING/);assert.equal(f.calls.length,4);f.advance(2001);assert.equal((await f.ui.binding()).accountId,'FREEL_FF000009-0009');assert.equal(f.calls.filter(x=>x.type==='cor3-center-auto-bind').length,5);
});
test('a retry cannot switch to the current window after the original owner window changes',async()=>{
 const f=fixture(['CENTER_IDENTITY_SELECTOR_MISSING',null]);await flush();f.window(20);await f.next();assert.equal(await f.ui.ready,null);assert.equal(f.calls.length,1);assert.equal(f.calls[0].windowId,10);
});
test('closing the popup cancels pending retry and later commands cannot issue game or storage operations',async()=>{
 const f=fixture(['CENTER_IDENTITY_SELECTOR_MISSING']);await flush();assert.equal(f.timers.size,1);f.events.pagehide();assert.equal(await f.ui.ready,null);await assert.rejects(f.ui.master(false),/CENTER_UI_CLOSED/);assert.equal(f.calls.length,1);assert.equal(f.timers.size,0);
});
test('after recovery pins a binding, a replacement document permanently rejects the old popup',async()=>{
 const f=fixture(['CENTER_IDENTITY_SELECTOR_MISSING',null]);await f.next();await f.ui.ready;f.replace();await assert.rejects(f.ui.binding(),/CENTER_UI_REOPEN_REQUIRED/);const count=f.calls.length;await assert.rejects(f.ui.binding(),/CENTER_UI_REOPEN_REQUIRED/);assert.equal(f.calls.length,count);
});

test('closing during an awaited binding proof prevents its late result from issuing a master command',async()=>{
 const f=fixture();await f.ui.ready;let release;const wait=new Promise(r=>release=r),original=f.api.runtime.sendMessage;f.api.runtime.sendMessage=async m=>{if(m.type==='centerResolve')await wait;return original(m);};const rejected=assert.rejects(f.ui.master(false),/CENTER_UI_CLOSED/);await flush();f.events.pagehide();release();await rejected;assert.ok(!f.calls.some(m=>m.action));
});
test('unawaited cached-read errors are observed without turning a failed read into successful empty data',async()=>{
 const popup=readFileSync(new URL('../extension/popup.js',import.meta.url),'utf8'),start=popup.indexOf('  function observeCenterRead('),end=popup.indexOf('  // src/popup/i18n.js',start),warnings=[];const c={console:{warn:x=>warnings.push(x)}};vm.runInNewContext(popup.slice(start,end),c);const rejected=Promise.reject(Error('CENTER_IDENTITY_SELECTOR_MISSING'));assert.equal(c.observeCenterRead(rejected),rejected);await assert.rejects(rejected,/SELECTOR_MISSING/);await flush();assert.equal(warnings.length,1);assert.ok(popup.includes('observeCenterRead(loadDrone());'));assert.ok(popup.includes('observeCenterRead(loadExpeditions());'));assert.ok(popup.includes('observeCenterRead(loadLoadout());'));
});
