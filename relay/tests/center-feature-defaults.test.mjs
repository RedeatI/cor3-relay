import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../extension/center-feature-defaults.js',import.meta.url),'utf8');
const account='FREEL_FF000009-0009',other='FREEL_FF00000A-000A',prefix='center:'+account+':';
function fixture(){const data={},writes=[];const storage={async get(keys){return Object.fromEntries((typeof keys==='string'?[keys]:keys).filter(k=>k in data).map(k=>[k,data[k]]))},async set(values){writes.push({...values});Object.assign(data,values)}};const c={};vm.runInNewContext(src,c);return{data,writes,create:()=>c.Cor3CenterFeatureDefaultsFactory.create(storage)}}
test('upgrade enables only Daily and Markets for this verified account and preserves every other setting',async()=>{
 const f=fixture();Object.assign(f.data,{[prefix+'autoUpdateMarkets']:false,[prefix+'autoDailyHackEnabled']:false,[prefix+'autoJobSolverEnabled']:false,[prefix+'autoIceWallEnabled']:false,['center:'+other+':autoDailyHackEnabled']:false,helperMode:true});
 await f.create().apply(account,async()=>{});assert.equal(f.data[prefix+'autoUpdateMarkets'],true);assert.equal(f.data[prefix+'autoDailyHackEnabled'],true);
 assert.equal(f.data[prefix+'autoJobSolverEnabled'],false);assert.equal(f.data[prefix+'autoIceWallEnabled'],false);assert.equal(f.data.helperMode,true);assert.equal(f.data['center:'+other+':autoDailyHackEnabled'],false);assert.equal(f.writes.length,1);
});
test('page/background recreation preserves enabled values and does not rewrite a later manual off',async()=>{
 const f=fixture();await f.create().apply(account,async()=>{});await f.create().apply(account,async()=>{});assert.equal(f.writes.length,1);
 f.data[prefix+'autoDailyHackEnabled']=false;await f.create().apply(account,async()=>{});assert.equal(f.data[prefix+'autoDailyHackEnabled'],false);assert.equal(f.data[prefix+'autoUpdateMarkets'],true);assert.equal(f.writes.length,1);
});
test('unverified or changed page cannot initialize any settings',async()=>{
 const f=fixture();let checks=0;await assert.rejects(f.create().apply(account,async()=>{if(++checks===2)throw Error('page changed')}));assert.deepEqual(f.data,{});
 await assert.rejects(f.create().apply('not-an-account',async()=>{}));assert.deepEqual(f.data,{});
});
test('concurrent startup calls commit defaults once',async()=>{
 const f=fixture(),defaults=f.create();await Promise.all([defaults.apply(account,async()=>{}),defaults.apply(account,async()=>{})]);assert.equal(f.writes.length,1);
});
