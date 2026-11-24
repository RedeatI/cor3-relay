import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../extension/center-identity.js',import.meta.url),'utf8');
function fixture(){let counter=0,listener,mutate;const events={},sent=[],deadlines=new Map(),clock={now:10000};let next=0;const el={isConnected:true,hidden:false,parentElement:null,textContent:'FREEL_FF000008-0008',getClientRects:()=>[{}],getBoundingClientRect:()=>({width:100,height:20,top:1,left:1,bottom:21,right:101}),getAttribute:()=>null,hasAttribute:()=>false};const state={nodes:[el],style:{display:'block',visibility:'visible',opacity:'1'}};const c={URL,Uint8Array,Date:{now:()=>clock.now},setTimeout:(f,ms)=>{deadlines.set(++next,{f,at:clock.now+ms});return next;},clearTimeout:id=>deadlines.delete(id),innerWidth:1000,innerHeight:1000,location:{href:'https://cor3.gg/'},crypto:{getRandomValues(a){a.fill(++counter);return a}},document:{documentElement:{},querySelectorAll(s){assert.equal(s,'[data-component-name="UserIdentityUserNameText"]');return state.nodes}},getComputedStyle:()=>state.style,MutationObserver:class{constructor(f){mutate=f}observe(){}disconnect(){}},addEventListener:(e,f)=>events[e]=f,chrome:{runtime:{id:'fixture',onMessage:{addListener:f=>listener=f},sendMessage:async m=>{sent.push(m);return m.type==='cor3-center-page-ready'&&state.announce?state.announce():{ok:true}}}}};c.window={};c.window.top=c.window;c.top=c.window;vm.runInNewContext(source,c);return {state,el,sent,events,deadlines,clock,identity:c.Cor3CenterIdentity,status:()=>c.Cor3CenterIdentity.status(),mutate:()=>mutate(),poll:()=>{for(const [id,t] of deadlines)if(t.at<=clock.now){deadlines.delete(id);t.f();return true;}return false;},snapshot:()=>c.Cor3CenterIdentity.snapshot(),probe:async(sender={id:'fixture'},extra={})=>{const n='ab'.repeat(16);await listener({type:'cor3-center-probe',nonce:n,...extra},sender);return sent.findLast(m=>m.nonce===n)},raw:()=>listener};}
test('actual source sees zero, one, many fixed selector matches and reports only fixed diagnostics',async()=>{const f=fixture();f.state.nodes=[];assert.equal((await f.probe()).code,'CENTER_IDENTITY_SELECTOR_MISSING');f.state.nodes=[f.el];assert.equal((await f.probe()).account,f.el.textContent);f.state.nodes=[f.el,f.el,f.el];const d=await f.probe();assert.equal(d.code,'CENTER_IDENTITY_SELECTOR_MULTIPLE');assert.equal(d.count,2);assert.deepEqual(Object.keys(d).sort(),['code','count','nonce','type'])});
test('hidden identity revokes old nonce immediately then recovers with new generation',async()=>{const f=fixture(),a=f.snapshot();f.el.hidden=true;f.mutate();assert.equal(f.snapshot(),null);assert.equal(f.sent.find(m=>m.type==='cor3-center-revoked').type,'cor3-center-revoked');assert.equal(f.sent.find(m=>m.type==='cor3-center-revoked').documentId,a.documentId);assert.equal((await f.probe()).code,'CENTER_IDENTITY_HIDDEN');f.el.hidden=false;f.mutate();const b=f.snapshot();assert.equal(b.accountId,a.accountId);assert.notEqual(b.documentId,a.documentId);assert.equal((await f.probe()).documentId,b.documentId)});
test('format, disconnected, offscreen, ancestor visibility are fail closed and recoverable',async()=>{const f=fixture();f.el.textContent='secret arbitrary text';assert.equal((await f.probe()).code,'CENTER_IDENTITY_FORMAT');assert.ok(!JSON.stringify(f.sent).includes('secret'));f.el.textContent='FREEL_FF000008-0008';f.el.isConnected=false;assert.equal((await f.probe()).code,'CENTER_IDENTITY_HIDDEN');f.el.isConnected=true;f.state.style.opacity='0';assert.equal((await f.probe()).code,'CENTER_IDENTITY_HIDDEN');f.state.style.opacity='1';f.el.getBoundingClientRect=()=>({width:1,height:1,top:2000,left:1,bottom:2001,right:2});assert.equal((await f.probe()).code,'CENTER_IDENTITY_HIDDEN')});
test('wrong extension, content sender, malformed challenge never receives diagnostics',async()=>{const f=fixture();f.state.nodes=[];await f.probe({id:'wrong'});await f.probe({id:'fixture',tab:{id:1}});await f.probe({id:'fixture'},{nonce:'bad'});await f.probe({id:'fixture'},{extra:true});assert.equal(f.sent.filter(m=>m.nonce).length,0)});
test('account switch generates fresh identity while navigation hard revocation never recovers',async()=>{const f=fixture(),a=f.snapshot();f.el.textContent='FREEL_FF000007-0007';f.mutate();const b=f.snapshot();assert.notEqual(b.documentId,a.documentId);assert.equal(b.accountId,f.el.textContent);f.events.pagehide();assert.equal(f.snapshot(),null);assert.equal((await f.probe()).code,'CENTER_IDENTITY_REVOKED');f.el.textContent=a.accountId;f.mutate();assert.equal(f.snapshot(),null)});

test('binding-loss notification bypasses the old success cooldown and sends fresh page-ready',async()=>{const f=fixture();await new Promise(r=>setImmediate(r));assert.equal(f.sent.filter(x=>x.type==='cor3-center-page-ready').length,1);const before=f.snapshot();f.raw()({type:'cor3-center-page-active'},{id:'fixture'});await new Promise(r=>setImmediate(r));assert.equal(f.sent.filter(x=>x.type==='cor3-center-page-ready').length,2);assert.equal(f.snapshot().documentId,before.documentId);});
test('a missing binding response expires, retries the same document and ignores late completion',async()=>{
 const f=fixture(),before=f.snapshot(),flush=()=>new Promise(r=>setImmediate(r));let finishLate;
 f.state.announce=()=>new Promise(resolve=>{finishLate=resolve;});await flush();
 assert.equal(f.deadlines.size,1);f.clock.now+=10000;assert.equal(f.poll(),true);await flush();assert.equal(f.status().code,'CENTER_PROBE_TIMEOUT');
 f.state.announce=()=>({ok:true});f.clock.now+=2000;f.poll();await flush();assert.equal(f.status().code,'CENTER_CONNECTED');
 finishLate({ok:false,code:'CENTER_RECEIVER_UNAVAILABLE'});await flush();assert.equal(f.status().code,'CENTER_CONNECTED');
 assert.equal(f.snapshot().documentId,before.documentId);assert.equal(f.deadlines.size,1);assert.equal([...f.deadlines.values()][0].at,f.clock.now+60000);
});

test('failed binding retries back off while returning to view checks for identity changes immediately',async()=>{
 const f=fixture(),flush=()=>new Promise(r=>setImmediate(r));
 f.state.announce=()=>({ok:false,code:'CENTER_PROBE_TIMEOUT'});await flush();
 for(const delay of [2000,4000,8000,16000,30000,30000]){
  const before=f.sent.length;f.clock.now+=delay-1;assert.equal(f.poll(),false);
  f.clock.now++;assert.equal(f.poll(),true);await flush();assert.equal(f.sent.length,before+1);
 }
 const old=f.snapshot().documentId;f.el.textContent='FREEL_FF00000A-000A';
 f.events.focus();assert.ok(f.sent.some(m=>m.type==='cor3-center-revoked'&&m.documentId===old));
});

test('a panel admission failure repairs only its current acknowledged document and coalesces repeated checks',async()=>{
 const f=fixture(), flush=()=>new Promise(resolve=>setImmediate(resolve));
 await flush();const {documentId}=f.snapshot(),count=()=>f.sent.filter(m=>m.type==='cor3-center-page-ready').length;
 assert.equal(f.status().code,'CENTER_CONNECTED');const initial=count();
 f.identity.recheckBinding('foreign-document');await flush();assert.equal(count(),initial);
 f.identity.recheckBinding(documentId);f.identity.recheckBinding(documentId);await flush();
 assert.equal(count(),initial+1);assert.equal(f.status().code,'CENTER_CONNECTED');assert.equal(f.snapshot().documentId,documentId);
 f.identity.recheckBinding(documentId);await flush();assert.equal(count(),initial+1);
 f.clock.now+=30000;f.state.nodes=[];f.identity.recheckBinding(documentId);await flush();assert.equal(count(),initial+1);
});
