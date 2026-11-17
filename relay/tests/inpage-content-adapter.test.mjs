import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=n=>readFileSync(new URL('../extension/'+n,import.meta.url),'utf8');
const content=src('content.js');
const start=content.indexOf('  function setupMessageListener() {');
const code=content.slice(start,content.indexOf('  // src/content/ws-relay.js',start));
function setup(){
 let scope={accountId:'FREEL_FF000009-0009',documentId:'identity-document'},allowed=true,listener;
 const messages=[],admissions=[],fetches=[],writes=[];
 const c=vm.createContext({setTimeout,clearTimeout,location:{origin:'https://cor3.gg'},window:{postMessage:m=>messages.push(structuredClone(m))},
  chrome:{runtime:{id:'own-extension',getManifest:()=>({version:'2.1.0'}),onMessage:{addListener:f=>listener=f},sendMessage:async m=>{admissions.push(m);return {allowed:true,snapshot:scope};}}},
  Cor3CenterIdentity:{snapshot:()=>scope},Cor3CenterStore:{get:async(k,cb)=>{const result=k==='bearerToken'?{bearerToken:'synthetic-test-token'}:{};cb?.(result);return result;},set:async x=>writes.push(x)},
  Cor3Automation:{contentDocumentId:'content-document',allowed:()=>allowed,permitsRequest:()=>allowed},
  cor3AutomationAllowed:()=>allowed,network:()=>({enqueue:()=>assert.fail('unexpected mutation'),snapshot:()=>null}),
  queueMarketRefresh:m=>{messages.push(structuredClone(m));return 'queued';},
  fetch:async(url,options)=>{fetches.push({url,options});return {ok:true,json:async()=>({claimed:true})};},fetchDailyRewards:()=>{},cor3LogError:()=>assert.fail('unexpected error')});
 vm.runInContext(src('inpage-controls-core.js'),c);
 vm.runInContext(code+'\nsetupMessageListener();',c);
 return {c,messages,admissions,fetches,writes,scope:()=>scope,change:()=>scope={accountId:'FREEL_FF00000A-000A',documentId:'next-document'},pause:()=>allowed=false,listener:()=>listener};
}
test('actual content adapter admits the real accountId and document and invokes only the fixed read handlers',async()=>{
 const f=setup();
 for(const kind of ['loadout','drone','expeditions','daily'])await f.c.Cor3InPageControls.refresh(kind,f.scope());
 assert.deepEqual(f.messages.map(x=>x.type),['COR3_REQUEST_LOADOUT','COR3_REQUEST_DRONE_OPTIONS','COR3_REQUEST_EXPEDITIONS','COR3_REQUEST_MERCENARIES','COR3_REQUEST_USOL_MERCENARIES','COR3_REQUEST_EXPEDITION_CONFIG']);
 assert.equal(f.fetches.length,1);assert.equal(f.fetches[0].url,'https://svc-corie.cor3.gg/api/user-daily-claim');
 assert.ok(f.writes.some(x=>x.dailyOpsData?.claimed===true));
 assert.ok(f.admissions.length>0&&f.admissions.every(x=>x.type==='centerAdmission'&&x.documentId==='identity-document'));
});
test('actual runtime listener still rejects a foreign sender, old identity and closed full automation gate',()=>{
 const f=setup(),replies=[];
 f.listener()({action:'equipHardware',moduleConfigId:'owned'}, {id:'foreign-extension'},x=>replies.push(x));
 f.listener()({action:'equipHardware',moduleConfigId:'owned',centerIdentityDocumentId:'old'}, {id:'own-extension'},x=>replies.push(x));
 assert.equal(f.messages.length,0);assert.equal(replies.length,0);
 f.pause();f.listener()({action:'equipHardware',moduleConfigId:'owned'}, {id:'own-extension'},x=>replies.push(x));
 assert.equal(f.messages.length,0);assert.equal(replies[0].success,false);
});
test('actual local controls reject stale page scope and arbitrary commands before the adapter dispatches',async()=>{
 const f=setup(),old=f.scope();f.change();
 await assert.rejects(f.c.Cor3InPageControls.refresh('loadout',old),/PAGE_CHANGED/);
 await assert.rejects(f.c.Cor3InPageControls.refresh('purchaseSpecialist',f.scope()),/PAGE_ACTION_UNSUPPORTED/);
 assert.equal(f.messages.length,0);
});
