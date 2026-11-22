import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../extension/expedition-diagnostics.js',import.meta.url),'utf8');
function fixture(){let identity={documentId:'doc-a'},at=10000,reader;const listeners={};const w={addEventListener:(t,f)=>listeners[t]=f};w.top=w;
 const c=vm.createContext({window:w,location:{origin:'https://cor3.gg'},Date:{now:()=>at},Cor3CenterIdentity:{snapshot:()=>identity},chrome:{runtime:{id:'fixture',onMessage:{addListener:f=>reader=f}}}});
 vm.runInContext(src.slice(0,src.indexOf('  const version ='))+'})();',c);
 return {emit(message,source=w,origin='https://cor3.gg'){listeners.message({source,origin,data:{type:'COR3_ICE_WALL_STATUS',state:'error',message}})},advance:()=>at+=100,change:()=>identity={documentId:'doc-b'},read:()=>reader({action:'cor3ExpeditionReadLog',centerIdentityDocumentId:identity.documentId},{id:'fixture'})};
}
test('ICE errors expose bounded fixed reasons instead of an opaque generic error',async()=>{const f=fixture();f.emit('Max retries reached, skipping round');f.emit('Round did not advance; stopping this attempt');const r=await f.read();assert.deepEqual(Array.from(r.entries.filter(x=>x.reason),x=>x.reason),['match-retries','round-unconfirmed']);assert.match(r.entries.at(-1).text,/轮次未推进/);});
test('untrusted origins and arbitrary message strings cannot enter the read-only log',async()=>{const f=fixture();f.emit('private-token-unrelated');f.emit('Round did not advance; stopping this attempt',{},'https://elsewhere.invalid');const r=await f.read();assert.ok(!JSON.stringify(r).includes('private-token-unrelated'));assert.equal(r.entries.filter(x=>x.reason).length,0);});
test('repeated ICE reasons are coalesced and another document cannot inherit them',async()=>{const f=fixture();f.emit('Round did not advance; stopping this attempt');f.advance();f.emit('Round did not advance; stopping this attempt');assert.equal((await f.read()).entries.filter(x=>x.reason).length,1);f.change();assert.equal((await f.read()).entries.filter(x=>x.reason).length,0);});

test('a missing round target and an ambiguous board produce different fixed reasons', async () => {
 const f=fixture();
 f.emit('Next round target did not become ready');
 f.emit('No reliable glyph match before the deadline');
 const log=await f.read();
 assert.deepEqual(Array.from(log.entries.filter(x=>x.reason), x=>x.reason), ['target-unready','no-match']);
});
