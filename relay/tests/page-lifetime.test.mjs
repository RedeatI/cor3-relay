import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = name => readFileSync(new URL('../extension/' + name, import.meta.url), 'utf8');
function runtime(extras = {}) {
    const context = vm.createContext(extras);
    vm.runInContext(source('page-lifetime.js'), context);
    return context;
}
const baseline = {
    account:'a', documentId:'d', now:0, age:0, quiet:300000, hidden:false, online:true,
    permitted:true, busy:false, emptyIce:null, active:null, ticket:null, expired:false,
    fault:null, queued:false, batchBusy:false, equipmentChecks:0,
};
function series(observe, props, from, to) {
    let result;
    for (let now=from;now<=to;now+=30000) result=observe({...baseline, ...props, now});
    return result;
}
test('recovery requires the same empty window continuously; sleep, account or window replacement resets evidence',()=>{
    const observe=runtime().Cor3PageLifetime.monitor(), props={emptyIce:{}};
    assert.equal(series(observe,props,0,150000),null);
    assert.equal(series(observe,props,180000,180000),'ice-empty');
    assert.equal(series(observe,props,600000,600000),null);
    assert.equal(series(observe,{...props,documentId:'next'},630000,780000),null);
    assert.equal(series(observe,{emptyIce:{},documentId:'next'},810000,810000),null);
});
test('offline, active minigame or unsaved edit, and missing permission protect the page',()=>{
    for(const guard of [{online:false},{busy:true},{permitted:false}]){
        const observe=runtime().Cor3PageLifetime.monitor(),props={emptyIce:{}};
        assert.equal(series(observe,{...props,...guard},0,360000),null);
    }
});
test('read lease, uncertain mutation and periodically idle hidden page have distinct eligibility',()=>{
    const read={active:'initial-fetch',ticket:'r',expired:true};
    for (const [props,end,expected] of [
        [read,600000,null],[{...read,fault:'lease-expired'},180000,'startup-read'],
        [{...read,fault:'lease-expired',emptyIce:{}},180000,'ice-empty'],
        [{active:'page-equip',fault:'equipment-unconfirmed',equipmentChecks:1},600000,null],
        [{active:'page-equip',fault:'equipment-unconfirmed',equipmentChecks:2},570000,null],
        [{active:'page-equip',fault:'equipment-unconfirmed',equipmentChecks:2},600000,'equipment-unconfirmed'],
        [{hidden:true,age:21600000},120000,'idle'],[{hidden:false,age:21600000},120000,null],
    ])assert.equal(series(runtime().Cor3PageLifetime.monitor(),props,0,end),expected);
});
test('connection-only windows reload at three minutes even with a stuck task or queue',()=>{
    for(const [kind,reason] of [['terminal','terminal-connect'],['emptyIce','ice-empty']]){
        const observe=runtime().Cor3PageLifetime.monitor();
        const waiting={[kind]:{},active:'auto-jobs',ticket:'batch',queued:true,batchBusy:true,quiet:0,batchProgress:'0'};
        assert.equal(series(observe,waiting,0,150000),null);
        assert.equal(observe({...baseline,...waiting,now:179999}),null);
        assert.equal(observe({...baseline,...waiting,now:180000}),reason);
        const advanced={...waiting,batchProgress:'1'};
        assert.equal(series(observe,advanced,210000,360000),null);
        assert.equal(series(observe,advanced,390000,390000),reason);
        assert.equal(series(observe,{...advanced,[kind]:{}},420000,420000),null);
    }
});
test('only an expired read-only roster lease can recover, with a stable ticket and no foreign work',()=>{
    const policy=runtime().Cor3PageLifetime;
    for(const market of ['home','usol']){
        const read={active:'manual-market:roster-'+market,ticket:'one',expired:true,fault:'lease-expired'};
        for(const extra of [{expired:false},{ticket:null},{fault:null},{queued:true},{batchBusy:true},{busy:true},{online:false}]){
            assert.equal(series(policy.monitor(),{...read,...extra},0,360000),null);
        }
        const observe=policy.monitor();
        assert.equal(series(observe,read,0,150000),null);
        assert.equal(series(observe,{...read,ticket:'two'},180000,330000),null);
        assert.equal(series(observe,{...read,ticket:'two'},360000,360000),'roster-read');
        for(const active of ['manual-market:price','auto-send','page-equip','manual-market:roster-other']){
            assert.equal(series(policy.monitor(),{...read,active},0,600000),null);
        }
    }
});
test('stalled batch reloads only its own document after final proof; receipt survives and a single probe cannot reload twice',async()=>{
    const src=source('content.js'), start=src.indexOf('  const pageOpenedAt='), end=src.indexOf('  setInterval(()=>void checkPageRecovery()',start);
    for(const change of ['none','advance','scope','off']){
        let clock=0,doc='tab',done=0,reloads=0,checks=0;
        const scope=()=>({accountId:'fixture',documentId:doc}),marker={};
        const win={addEventListener(){},location:{reload(){reloads++;}}};win.top=win;
        const key='cor3.relay.reload.fixture',saved=new Map([[key,JSON.stringify([Date.now()-2000,Date.now()-1000])]]);
        const ctx=runtime({window:win,navigator:{onLine:true},document:{},dailyRetryClock:()=>clock,
            networkScope:scope,cor3AutomationAllowed:()=>true,network:()=>({snapshot:()=>({active:'auto-jobs',lease:{id:'job'},queued:['auto-send']})}),
            timedWindows:()=>[marker],sessionStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},
            Cor3CenterStore:{get:async()=>({pageAutoReloadEnabled:change!=='off',autoJobsRunning:true})},
            Cor3InPageControls:{readStatus:()=>({allowed:true,queue:{},batch:{id:'current',phase:'running',processed:done}}),
                verifyPage:async()=>{checks++;if(change==='scope')doc='new';if(change==='advance')done++;}}});
        ctx.Cor3PageLifetime={...ctx.Cor3PageLifetime,emptyIce:()=>false,terminalWait:el=>el};
        vm.runInContext(src.slice(start,end),ctx);
        for(clock=0;clock<180000;clock+=30000)await ctx.checkPageRecovery();
        assert.equal(reloads,0);
        assert.equal(ctx.Cor3PageWaitFor(scope()),'terminal-observing');
        assert.equal(ctx.Cor3PageWaitFor({...scope(),documentId:'elsewhere'}),null);
        await ctx.checkPageRecovery();await ctx.checkPageRecovery();
        assert.equal(checks,change==='off'?0:1);
        assert.equal(reloads,change==='none'?1:0);
        assert.equal(JSON.parse(saved.get(key+'.last')||'null')?.reason,change==='none'?'terminal-connect':undefined);
        clock+=96000;assert.equal(ctx.Cor3PageWaitFor(scope()),null);
    }
});
function recoveryPage({hidden = false, openedAt = 0, saved = new Map()} = {}) {
    const content = source('content.js');
    const start = content.indexOf('  const pageOpenedAt=');
    const end = content.indexOf('  setInterval(()=>void checkPageRecovery()', start);
    let account = 'one', elapsed = openedAt, reads = 0, changed, beforeVerify, equipmentCheck;
    const reloads = [], preferences = new Map();
    const win = {addEventListener(){}, location:{reload(){ reloads.push({account, elapsed}); }}};
    win.top = win;
    const scope = () => ({accountId:account, documentId:account + '-doc'});
    const marker = {}, protectedWork = {};
    const context = runtime({
        window:win, navigator:{onLine:true}, document:{hidden}, Date:{now:()=>1800000000000+elapsed},
        dailyRetryClock:()=>elapsed, networkScope:scope, cor3AutomationAllowed:()=>true,
        network:()=>({snapshot:()=>({active:null, queued:[]})}),
        timedWindows:()=>hidden ? [] : [marker],
        Cor3InPageControls:{readStatus:()=>({allowed:true, queue:{}}),
            verifyPage:async()=>beforeVerify?.(), recheckEquipment:async()=>equipmentCheck?.()},
        Cor3CenterStore:{onChanged:{addListener(fn){changed=fn;}},
            get:async()=>{reads++;return {pageAutoReloadEnabled:preferences.get(account) ?? true,...protectedWork};}},
        sessionStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},
    });
    context.Cor3PageLifetime={...context.Cor3PageLifetime,emptyIce:()=>false,terminalWait:()=>marker};
    vm.runInContext(content.slice(start,end),context);
    return {reloads, preferences, protectedWork, reads:()=>reads, switchTo(name){account=name;},
        notify(value){preferences.set(account,value);changed({pageAutoReloadEnabled:{newValue:value}});},
        onVerify(callback){beforeVerify=callback;}, onEquipment(callback){equipmentCheck=callback;},
        async run(from,to){for(let n=from;n<=to;n+=30000){elapsed=n;await context.checkPageRecovery();}}};
}
test('a disabled reload is scoped to its account and document across an in-place account change',async()=>{
    const page=recoveryPage();
    page.preferences.set('one',false);
    await page.run(0,210000);
    assert.equal(page.reloads.length,0);
    page.switchTo('two'); await page.run(240000,420000);
    assert.deepEqual(page.reloads,[{account:'two',elapsed:420000}]);
    page.switchTo('one'); await page.run(450000,660000);
    assert.equal(page.reloads.length,1);
    page.notify(true); await page.run(690000,870000);
    assert.equal(page.reloads.length,2);
});
test('routine reload checks activity again after verification, including after an overnight sampling gap',async()=>{
    const page=recoveryPage({hidden:true}), wake=12*3600000;
    await page.run(0,30000);
    page.onVerify(()=>{page.protectedWork.forceMaintenanceInProgress=true;});
    await page.run(wake,wake+90000);
    assert.equal(page.reloads.length,0);
    await page.run(wake+120000,wake+120000);
    assert.equal(page.reloads.length,0);
    page.onVerify(null);page.protectedWork.forceMaintenanceInProgress=false;
    await page.run(wake+150000,wake+300000);
    assert.equal(page.reloads.length,1);
});
test('a rejected equipment read does not silence independent connection recovery',async()=>{
    const page=recoveryPage();
    page.onEquipment(()=>{throw Error('read unavailable');});
    await page.run(0,180000);
    assert.equal(page.reloads.length,1);
});
test('an explicit opt-out during page verification is honored before a connection reload',async()=>{
    const page=recoveryPage();
    page.onVerify(()=>page.preferences.set('one',false)); // Local change notification has not arrived yet.
    await page.run(0,360000);
    assert.deepEqual(page.reloads,[]);
});
test('a connection recovery leaves an independent Daily or maintenance operation alone',async()=>{
    for (const [key,value] of [['dailyHackRunLock',{startedAt:1800000000000}],['forceMaintenanceInProgress',true]]) {
        const page=recoveryPage();
        page.onVerify(()=>{page.protectedWork[key]=value;});
        await page.run(0,180000);
        assert.deepEqual(page.reloads,[]);
        delete page.protectedWork[key];
        page.onVerify(null);
        await page.run(210000,210000);
        assert.equal(page.reloads.length,1);
    }
});
test('a connection outage cannot trigger another refresh as soon as a new document waits three minutes',async()=>{
    const saved=new Map();
    let page=recoveryPage({saved});
    await page.run(0,180000);
    assert.equal(page.reloads.length,1);
    page=recoveryPage({openedAt:180000,saved});
    await page.run(180000,750000);
    assert.deepEqual(page.reloads,[]);
    await page.run(780000,780000);
    assert.equal(page.reloads.length,1);
});
test('an unsettled equipment read does not block the next watchdog sample',async()=>{
    const page=recoveryPage();
    page.onEquipment(()=>new Promise(()=>{}));
    await page.run(0,180000);
    assert.equal(page.reloads.length,1);
});
test('a day of background sampling reloads idle documents only at the six-hour deadline',async()=>{
    const hour=3600000, saved=new Map(), reloadTimes=[];
    let page=recoveryPage({hidden:true,saved}), totalReads=0;
    for(let now=0;now<=24*hour;now+=60000){
        await page.run(now,now);
        if(!page.reloads.length)continue;
        assert.equal(JSON.parse(saved.get('cor3.relay.reload.one.last')).reason,'idle');
        reloadTimes.push(now);
        totalReads+=page.reads();
        page=recoveryPage({hidden:true,openedAt:now,saved});
    }
    assert.deepEqual(reloadTimes,[6,12,18,24].map(n=>n*hour));
    assert.equal(totalReads,8); // No periodic settings I/O between eligible refreshes.
});
test('awaiting a panel action does not mask a stuck connection; actual unsaved edits still count',()=>{
    const code=source('inpage-controls.js').split('\n').find(line=>line.includes('globalThis.Cor3ControlDraftOpen='));
    const ctx=vm.createContext({busy:true,dirtyMerc:false,dirtyDrone:false});
    vm.runInContext(code,ctx);
    assert.equal(ctx.Cor3ControlDraftOpen(true),false);assert.equal(ctx.Cor3ControlDraftOpen(),true);
    for(const edit of ['dirtyMerc','dirtyDrone']){
        ctx[edit]=true;assert.equal(ctx.Cor3ControlDraftOpen(true),true);ctx[edit]=false;
    }
});
test('tab budget enforces both cooldown and rolling ceiling, including clock regression',()=>{
    const {canReload}=runtime().Cor3PageLifetime, now=50000000;
    assert.equal(canReload([],now),true);
    assert.equal(canReload([now-1000],now),false);
    assert.equal(canReload([now-1900000,now-5100000],now),false);
    assert.equal(canReload([now-21900000,now-5100000],now),true);
    assert.equal(canReload([now+1000],now),false);
    for(const reason of ['ice-empty','terminal-connect']){
        assert.equal(canReload([now-1000,now-500],now,reason),true);
        assert.equal(canReload([now-300000],now,reason,{reason:'ice-empty',at:now-300000}),false);
        assert.equal(canReload([now-600000],now,reason,{reason:'terminal-connect',at:now-600000}),true);
        assert.equal(canReload(['invalid'],now,reason),false);
    }
});
test('Wings projections are bounded, repeatable across worlds and preserve unknown inventory',()=>{
    const {wings,wingsMaterials}=runtime().Cor3PageLifetime;
    const page=wings('get.page',{currentStep:7,status:'ACTIVE',privateValue:'ignore',
      currentStepSubtasks:[{title:'Cable',status:'PENDING',buyCost:17000,barterItems:[
        {title:'Cable',requiredQuantity:1},{title:'Slab',availableQuantity:0,requiredQuantity:1}]}]});
    assert.deepEqual(wings('get.page',page),page);
    assert.equal(page.currentStepSubtasks[0].barterItems[0].availableQuantity,null);
    assert.equal(page.currentStepSubtasks[0].barterItems[1].availableQuantity,0);
    assert.equal(JSON.stringify(page).includes('privateValue'),false);
    assert.equal(wings('list.history',{items:Array(49).fill({step:1})}).items.length,32);
    assert.equal(wings('get.page',{}),null);
    assert.equal(wingsMaterials.length,15);
    assert.ok(wingsMaterials.find(row=>row.step===7).items.some(row=>row.name==='Californium-252 slab' && row.quantity===1));
});
test('both worlds load recovery policy before their entrypoint',()=>{
    const entries=JSON.parse(source('manifest.json')).content_scripts;
    for(const entrypoint of ['content-early.js','content.js']){
        const files=entries.find(entry=>entry.js.includes(entrypoint)).js;
        assert.ok(files.indexOf('page-lifetime.js')>=0 && files.indexOf('page-lifetime.js')<files.indexOf(entrypoint));
    }
});
test('early socket projection accepts only a current tracked game transport',()=>{
    const text=source('content-early.js'),start=text.indexOf("    if (eventName==='drone-build'"),end=text.indexOf('    if (handleDroneMessage',start);
    const socket={},other={},sent=[],expiredSockets=new WeakSet();
    const c=runtime({trackedSockets:[socket],expiredSockets,location:{origin:'game'},cor3AutomationAllowed:()=>true,window:{postMessage:m=>sent.push(m)}});
    vm.runInContext('function capture(eventName,payload,socket){'+text.slice(start,end)+'}',c);
    const payload={event:{action:'list.history'},data:{items:[{step:7,title:'Cable',status:'ACTIVE'}]}};
    c.capture('drone-build',payload,other);c.capture('drone-build',payload,socket);
    expiredSockets.add(socket);c.capture('drone-build',payload,socket);
    assert.equal(sent.length,1);assert.equal(sent[0].snapshot.items[0].step,7);
});
test('expedition retry deadline survives unrelated fresh reads and explicit off suppresses fallback',async()=>{
    const text=source('content.js'),a=text.indexOf('  let mercCreditHold'),b=text.indexOf('  setInterval(()=>void checkMercDeadline',a);
    let now=10000000;const posted=[],state={autoSendMerc:{enabled:true,checkIntervalMinutes:5},expeditionsDataUpdatedAt:now};
    const ctx=vm.createContext({Date:{now:()=>now},networkScope:()=>({accountId:'fixture',documentId:'doc'}),cor3AutomationAllowed:()=>true,
        Cor3CenterStore:{get:async()=>state,set:async p=>Object.assign(state,p)},network:()=>({snapshot:()=>({active:null,queued:[]})}),
        timedActivityRunning:()=>false,window:{postMessage:e=>posted.push(e)},location:{origin:'fixture'}});
    vm.runInContext(text.slice(a,b),ctx);
    await ctx.checkMercDeadline();await ctx.deferMercCredits('insufficient');now+=299999;
    await ctx.checkMercDeadline();assert.equal(posted.length,0);
    now++;state.expeditionsDataUpdatedAt=now;await ctx.checkMercDeadline();assert.equal(posted.length,1);
    now+=300000;state.autoSendMerc.enabled=false;await ctx.checkMercDeadline();assert.equal(posted.length,1);
    assert.equal(posted[0].type,'COR3_REQUEST_EXPEDITIONS');
});
test('maintenance select-all excludes ineligible targets and a selection change requires fresh confirmation',()=>{
    const text=source('popup.js'),start=text.indexOf('      let reviewed=null;'),end=text.indexOf('      bottomRow.append(allLabel',start);
    const control=(name,id)=>({checked:false,dataset:{serverName:name,serverId:id},on:{},addEventListener(k,fn){this.on[k]=fn;}});
    const all=control(),review={},batchBtn=control(),boxes=[control('Alpha','a'),control('Beta','b'),control('Done','c')];boxes[2].disabled=true;
    let runs=0;
    const ctx=vm.createContext({all,review,batchBtn,t:(en)=>en,handleForceMaintenanceBatch:()=>runs++,valuableContentMaintenance:{
        querySelectorAll:selector=>{assert.equal(selector,'.maint-checkbox:not(:disabled)');return boxes.filter(x=>!x.disabled);}
    }});
    vm.runInContext(text.slice(start,end),ctx);
    all.checked=true;all.on.change();assert.equal(boxes[2].checked,false);batchBtn.on.click();
    assert.equal(runs,0);assert.equal(review.textContent,'Alpha · Beta');
    boxes[0].checked=false;boxes[0].on.change();batchBtn.on.click();assert.equal(review.textContent,'Beta');
    batchBtn.on.click();assert.equal(runs,1);
});

test('ICE observer ignores hidden remnants and starts once per visible window and game generation',async()=>{
 const code=source('ice-wall-solver.js');
 const part=(a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)));
 const nodes=[{getClientRects:()=>[]},{getClientRects:()=>[{}]}],old=nodes[1],next={getClientRects:()=>[{}]};
 let ticks=0;const calls=[];
 const c=vm.createContext({window:{},console:{log(){}},gameGeneration:1,pendingMinigameData:null,solverListeners:[],
  getComputedStyle:()=>({visibility:'visible'}),document:{querySelectorAll:()=>nodes},masterAllowed:()=>ticks<7,
  runIceWallSolver:async()=>{calls.push([c.findIceWallApp(),c.gameGeneration]);c.window.__iceWallGameEnded=true;},
  sleep:async()=>{ticks++;if(ticks===2)nodes[1]=next;if(ticks===4)c.gameGeneration++;}
 });
 vm.runInContext(part('function findIceWallApp()', '// --- Glyph')+part('async function watchForIceWall()', '    watchForIceWall().catch'),c);
 await c.watchForIceWall();
 assert.equal(calls.length,3);assert.deepEqual(calls,[[old,1],[next,1],[next,2]]);
});

test('a locked batch waits through a transient ICE shell; only the same empty window can expire',async()=>{
 const code=source('auto-job-solver.js'),a=code.indexOf('  function waitingIceShell()'),b=code.indexOf('  // src/shared/server-map',a);
 for(const scenario of ['normal','duplicate','replaced','expired']){
  let at=0,next=null;const shell={},newShell={};
  const c=vm.createContext({Cor3PageLifetime:{timedWindows:()=>scenario==='duplicate'?[shell,newShell]:scenario==='replaced'&&at>10000?[newShell]:[shell],emptyIce:()=>scenario!=='normal'||at<30000},
   performance:{now:()=>at},state:{abortFlag:false},masterAllowed:()=>true,safeTimeout:fn=>{next=fn;}});
  vm.runInContext(code.slice(a,b),c);const outcome=c.waitForIceWallStuckClear(()=>{});
  while(next){const fn=next;next=null;at+=2000;fn();assert.ok(at<=180000);}
  assert.equal((await outcome).held,scenario==='expired');
 }
});
