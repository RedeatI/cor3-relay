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

function puzzle({duplicate=false}={}) {
 const selectors = {
  counter: '[data-sentry-element="SidebarCounterStyled"]',
  preview: '[data-component-name="TargetPreview"]',
  board: '[data-component-name="WallBoard"]'
 };
 let now = 0, serial = 0, active = true;
 const timers = new Map(), clicks = [], statuses = [];
 const counter = { textContent: '0/3' };
 const app = { innerText:"", querySelector(selector) {
  return ({[selectors.counter]:counter,[selectors.preview]:preview,[selectors.board]:board})[selector] ?? null;
 }};
 function region(signature, offset, owner) {
  const shapes = [0,1,2].map((shape,index) => {
   const transform = 'translate(' + ((offset + index) * 31.5) + ', ' + (index === 1 ? 54 : 0) + ')';
   const value = duplicate && index !== 1 ? signature : signature + shape;
   const curve = signature === null ? [] : [{
    tagName: 'path', getAttribute: name => name === 'd' ? 'M ' + value + ' 0' : null
   }];
   return {
    children:curve, isConnected:true,
    getAttribute:name => name === 'transform' ? transform : null,
    querySelector:() => null,
    dispatchEvent:() => clicks.push({ signature, owner, completed:counter.textContent, at:now })
   };
  });
  return { querySelectorAll:() => shapes, getAttribute:() => null };
 }
 let preview = region(10,0,'preview'), board = region(10,10,'first');
 if (duplicate) {
  const first = board.querySelectorAll();
  const second = region(10,20,'second').querySelectorAll();
  board = {querySelectorAll:() => [...first,...second]};
 }
 const schedule = (callback, delay, repeat = 0) => {
  const id = ++serial;
  timers.set(id,{callback, at:now + delay, repeat});
  return id;
 };
 const window = { __iceWallGameEnded:false };
 const ctx = {
  window, masterAllowed:()=>true, findIceWallApp:()=>active ? app : null,
  Date:{now:()=>now}, MouseEvent:class {},
  MutationObserver:class { observe() {} disconnect() {} },
  document:{addEventListener(){},removeEventListener(){}},
  setTimeout:schedule, setInterval:(callback, delay) => schedule(callback,delay,delay),
  clearTimeout:id=>timers.delete(id), clearInterval:id=>timers.delete(id),
  sleep:delay=>new Promise(resolve=>schedule(resolve,delay)),
  postStatus:(message,level,state)=>statuses.push({message,level,state})
 };
 const geometry = src.slice(src.indexOf('const COL_STEP'),src.indexOf('// Post a status'));
 const scope = src.slice(src.indexOf('	// --- Glyph Fingerprinting'),src.indexOf('	// --- Watcher & External API'));
 vm.runInNewContext(geometry+scope,ctx);

 async function advance(ms) {
  const end = now + ms;
  await new Promise(setImmediate);
  for (;;) {
   const due = [...timers].filter(([,timer]) => timer.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
   if (!due) break;
   const [id,timer] = due;
   now = timer.at;
   if (timer.repeat) timer.at += timer.repeat;
   else timers.delete(id);
   timer.callback();
   await new Promise(setImmediate);
  }
  now = end;
 }
 return {
  app, ctx, clicks, statuses, timers, advance,
  start:()=>ctx.runIceWallSolver(),
  setCount:(completed,total=3)=>{counter.textContent=completed+'/'+total},
  setTarget:signature=>{preview=region(signature,0,'preview')},
  setBoard:(signature,owner)=>{board=signature === undefined ? null : region(signature,10,owner)},
  stop:()=>{active=false}
 };
}

test('an advanced counter cannot reuse the old preview while the board is being replaced', async()=>{
 const f=puzzle(), run=f.start();
 await f.advance(100);
 assert.deepEqual(f.clicks.map(x=>x.owner),['first']);

 f.setCount(1);
 await f.advance(300); // Counter advanced but both old SVGs are still visible.
 assert.equal(f.clicks.length,1);
 f.setBoard(undefined);
 await f.advance(300); // The board may briefly disappear.
 f.setTarget(30);
 f.setBoard(40,'revealing');
 await f.advance(300); // Zero possible positions while the board is being initialized.
 assert.equal(f.clicks.length,1);

 f.setBoard(30,'second');
 await f.advance(300);
 assert.deepEqual(f.clicks.map(x=>x.owner),['first','second']);
 f.setCount(2);
 f.setTarget(50);
 f.setBoard(50,'third');
 await f.advance(300);
 f.setCount(3);
 await f.advance(200);
 await run;
 assert.deepEqual(f.clicks.map(x=>x.completed),['0/3','1/3','2/3']);
 assert.equal(f.statuses.at(-1).state,'complete');
 assert.equal(f.timers.size,0);
});

test('a late counter acknowledgement does not cause a retry', async()=>{
 const f=puzzle(),run=f.start();
 await f.advance(2200);
 assert.equal(f.clicks.length,1);
 f.setCount(1);
 f.setTarget(30);
 f.setBoard(30,'second');
 await f.advance(300);
 assert.deepEqual(f.clicks.map(x=>x.owner),['first','second']);
 f.stop();
 await f.advance(250);
 await run;
});

test('no counter acknowledgement stops the puzzle without a second click', async()=>{
 const f=puzzle(),run=f.start();
 await f.advance(5000);
 await run;
 assert.equal(f.clicks.length,1);
 assert.equal(f.statuses.at(-1).message,'Round did not advance; stopping this attempt');
});

test('an ending event by itself never marks a round complete', async()=>{
 const f=puzzle(),run=f.start();
 await f.advance(100);
 f.ctx.window.__iceWallGameEnded=true;
 await f.advance(300);
 await run;
 assert.equal(f.clicks.length,1);
 assert.equal(f.statuses.some(x=>x.state==='complete'),false);
});

test('an explicit final count still confirms completion if the ending event arrives together', async()=>{
 const f=puzzle();
 f.setCount(2);
 const run=f.start();
 await f.advance(100);
 f.setCount(3);
 f.ctx.window.__iceWallGameEnded=true;
 await f.advance(200);
 await run;
 assert.equal(f.statuses.at(-1).state,'complete');
});

test('the next round may deal the same shapes after replacing the preview and board', async()=>{
 const f=puzzle(),run=f.start();
 await f.advance(100);
 f.setCount(1);
 f.setTarget(10);
 f.setBoard(10,'redealt');
 await f.advance(250);
 assert.deepEqual(f.clicks.map(x=>x.owner),['first','redealt']);
 f.stop();
 await f.advance(150);
 await run;
});


test('two fully matching groups no longer stop the first round at zero', async()=>{
 const f=puzzle({duplicate:true});
 const run=f.start();
 await f.advance(100);
 assert.deepEqual(f.clicks.map(click=>click.owner),['first']);
 f.setCount(3);
 await f.advance(250);
 await run;
 assert.equal(f.statuses.at(-1).state,'complete');
});

test('an explicit new mismatch permits one different complete match', async()=>{
 const f=puzzle({duplicate:true});
 const run=f.start();
 await f.advance(100);
 assert.deepEqual(f.clicks.map(click=>click.owner),['first']);
 f.app.innerText='EVENT LOG\n13:25 New glyph revealed\n13:26 Glyph mismatch!';
 await f.advance(200);
 assert.deepEqual(f.clicks.map(click=>click.owner),['first','second']);
 f.app.innerText+='\n13:26 Glyph mismatch!';
 await f.advance(200);
 await run;
 assert.equal(f.clicks.length,2);
 assert.equal(f.statuses.at(-1).message,'The game rejected the matching glyph');
});

test('an existing mismatch and an unconfirmed click do not trigger an alternate match', async()=>{
 const f=puzzle({duplicate:true});
 f.app.innerText='EVENT LOG\n13:24 Glyph mismatch!';
 const run=f.start();
 await f.advance(5000);
 await run;
 assert.deepEqual(f.clicks.map(click=>click.owner),['first']);
 assert.equal(f.statuses.at(-1).message,'Round did not advance; stopping this attempt');
});
