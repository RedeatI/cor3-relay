import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../extension/ice-wall-solver.js',import.meta.url),'utf8');
const selection=src.slice(src.indexOf('\tfunction findCandidates('),src.indexOf('\t// --- Click Simulation'));
test('a single partly revealed candidate cannot exclude an entirely unrevealed position',()=>{
 const c={};vm.runInNewContext(selection,c);const map=new Map();
 const add=(col,fp,orient='up')=>map.set(col+',0,'+orient,{col,row:0,orientation:orient,fingerprint:fp});
 const pattern={anchorFingerprint:'A',offsets:[{dc:1,dr:0,orient:'down',fingerprint:'B'},{dc:2,dr:0,orient:'up',fingerprint:'C'}]};
 add(0,'A');add(1,'B','down');add(2,null);add(10,null);add(11,null,'down');add(12,null);
 assert.equal(c.findCandidates(map,pattern,new Set()).length,1);
 assert.equal(c.confidentCandidate(map,pattern,new Set()),null);
 add(10,'wrong');assert.equal(c.confidentCandidate(map,pattern,new Set()).col,0);
 add(10,null);add(2,'C');assert.equal(c.confidentCandidate(map,pattern,new Set()).col,0);
});
test('preview animations and ending events do not count as a successful round',async()=>{
 const fn=src.slice(src.indexOf('\tasync function waitForAdvance('),src.indexOf('\t// --- Solve one round'));
 let completed=0,ended=false,iterations=0;const c={masterAllowed:()=>true,getRoundCounts:()=>({completed,total:3}),findIceWallApp:()=>true,window:{},Date:{now:()=>iterations*100},sleep:async()=>{iterations++;if(iterations===2)ended=true; c.window.__iceWallGameEnded=ended}};vm.runInNewContext(fn,c);
 assert.equal(await c.waitForAdvance(0,1000),false);
 c.window.__iceWallGameEnded=false;completed=1;assert.equal(await c.waitForAdvance(0,1000),true);
});
