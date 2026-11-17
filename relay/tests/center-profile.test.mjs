import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../extension/center-profile.js',import.meta.url),'utf8');
const a='FREEL_FF000009-0009',b='FREEL_FF00000A-000A';
test('browser account persists across background recreation and refuses another account without overwriting it',async()=>{
 const data={},storage={async get(key){return {[key]:data[key]}},async set(v){Object.assign(data,v)}};const c={};vm.runInNewContext(src,c);
 const first=c.Cor3CenterProfileFactory.create(storage);let checks=0;const check=async()=>{checks++};
 await first.remember(a,check);assert.ok(checks>=5);
 const second=c.Cor3CenterProfileFactory.create(storage);assert.equal((await second.verify(a,check)).accountId,a);
 await assert.rejects(second.remember(b,check),{code:'CENTER_SAVED_ACCOUNT_MISMATCH'});
 assert.equal(data.cor3CenterBrowserAccount.accountId,a);
});
test('page revocation prevents persisting an unverified account',async()=>{
 const data={},storage={async get(){return {}},async set(v){Object.assign(data,v)}};const c={};vm.runInNewContext(src,c);
 await assert.rejects(c.Cor3CenterProfileFactory.create(storage).remember(a,async()=>{throw Error('stale page')}));assert.deepEqual(data,{});
});
