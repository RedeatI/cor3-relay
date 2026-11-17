/* Isolated-world bridge. Never changes game preferences or exposes session data. */
(function () {
  "use strict";
  const gate = Cor3MasterCore.createGate(true);
  const stopHooks = new Set(), readyHooks = new Set();
  let notifiedGeneration = null;
  const errors = [];
  let readSerial = 0, counter = 0, applySequence = 0, mainConfirmed = false;
  const pending = new Map();
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  function stopLocal() {
    for (const fn of stopHooks) { try { fn(); } catch (e) { errors.push(String(e && e.message || e)); } }
  }
  gate.onStop(stopLocal);
  function relay() {
    const requestId = "master-" + (++counter) + "-" + Date.now();
    const expectedPaused = !gate.allowed();
    return new Promise(resolve => {
      const timeout = setTimeout(() => { pending.delete(requestId); resolve({ ok: false, error: "Game page did not acknowledge the master switch." }); }, 1800);
      pending.set(requestId, data => {
        clearTimeout(timeout);
        const valid = data.state && data.state.ready === true && Array.isArray(data.errors) &&
          (expectedPaused ? data.state.allowed === false : (data.state.allowed === true || data.state.reloadRequired === true));
        if (!valid) { resolve({ ok: false, error: "Game page returned an invalid master-switch acknowledgement." }); return; }
        resolve({ ok: !data.errors.length && !errors.length, state: data.state, errors: errors.concat(data.errors) });
      });
      window.postMessage({ type: "COR3_MASTER_STATE", requestId, paused: expectedPaused }, location.origin);
    });
  }
  async function apply(paused) {
    const application = ++applySequence;
    let allowedBinding=null;
    if (globalThis.Cor3CandidateStartup && !Cor3CandidateStartup.isInitialized()) paused = true;
    mainConfirmed = false;
    if(paused===false){
      try{
                const ownTop=window.top===window;
        const identity=ownTop?globalThis.Cor3CenterIdentity?.snapshot():null;
        const bound=await Promise.race([chrome.runtime.sendMessage({action:'cor3CenterBoundPermission',...(identity?{documentId:identity.documentId}:{})}),new Promise(resolve=>setTimeout(()=>resolve({bound:false}),1000))]);
        if(bound?.bound!==true||!bound.snapshot)paused=true; else allowedBinding=bound.snapshot;
      }catch{paused=true}
      if(application!==applySequence)return {ok:false,error:'Superseded binding check.'};
    }
    // A new minigame iframe may not bypass a stopped parent document after global resume.
    if (paused === false && window.top && window.top !== window) {
      const deadline = Date.now() + 5000;
      let parent = null;
      while (Date.now() < deadline && application === applySequence) {
        try {
          parent = await new Promise(resolve => {
            const timer = setTimeout(() => resolve({ ready: false, allowed: false }), 1000);
            chrome.runtime.sendMessage({ action: "cor3MasterParentAllowed" }).then(value => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve({ ready: false, allowed: false }); });
          });
        } catch (_) { parent = { ready: false, allowed: false }; }
        if (parent && (parent.allowed === true || parent.ready === true)) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      if (!parent || parent.allowed !== true) paused = true;
      if (application !== applySequence) return { ok: false, error: "Superseded parent permission check." };
    }
    gate.apply(paused);
    const result = await relay();
    if (application !== applySequence) return { ok: false, error: "Superseded master-switch acknowledgement." };
    if(paused===false&&result.ok){
      try{
        const identity=window.top===window?globalThis.Cor3CenterIdentity?.snapshot():null;
        const again=await Promise.race([chrome.runtime.sendMessage({action:'cor3CenterBoundPermission',...(identity?{documentId:identity.documentId}:{})}),new Promise(resolve=>setTimeout(()=>resolve({bound:false}),1000))]);
        if(application!==applySequence)return {ok:false,error:'Superseded binding confirmation.'};
        if(!again?.bound||!again.snapshot||!allowedBinding||!['tabId','accountId','documentId','url','epoch','windowId'].every(k=>again.snapshot[k]===allowedBinding[k]))throw Error('CENTER_BINDING_CHANGED');
      }catch{
        if(application!==applySequence)return {ok:false,error:'Superseded binding confirmation.'};
        gate.apply(true);mainConfirmed=false;await relay();resolveReady();return {ok:false,error:'CENTER_BINDING_CHANGED'};
      }
    }
    mainConfirmed = !!(result.ok && result.state && result.state.allowed);
    if (!result.ok) {
      // A lost ACK is not evidence that MAIN stayed closed. Explicitly close it again.
      gate.apply(true);
      const stopped = await relay();
      if (application !== applySequence) return { ok: false, error: "Superseded stop recovery." };
      resolveReady();
      return { ...result, stopConfirmed: !!(stopped.state && stopped.state.ready && stopped.state.allowed === false) };
    }
    resolveReady();
    if(mainConfirmed&&gate.allowed()&&notifiedGeneration!==gate.token()){
      notifiedGeneration=gate.token();
      for(const fn of readyHooks){try{fn(notifiedGeneration)}catch{errors.push('CURRENT_GENERATION_START_FAILED');mainConfirmed=false;gate.apply(true);void relay();break;}}
    }
    return result;
  }
  async function reloadState() {
    const serial = ++readSerial;
    try {
      const data = await (globalThis.Cor3CandidateStartup ? Cor3CandidateStartup.readState(chrome) : chrome.storage.local.get("helperMode"));
      if (serial !== readSerial) return { ok: false, error: "Superseded state read." };
      // Desired preferences are honored only after this document obtains current binding permission.
      return apply(data.helperMode !== false);
    } catch (e) {
      if (serial === readSerial) { mainConfirmed = false; gate.apply(true); await relay(); resolveReady(); }
      return { ok: false, error: "Could not read the saved master switch." };
    }
  }
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin || !event.data || event.data.type !== "COR3_MASTER_ACK") return;
    const finish = pending.get(event.data.requestId);
    if (finish) { pending.delete(event.data.requestId); finish(event.data); }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if(area==='local'&&globalThis.Cor3CandidateStartup?.runtimeKey&&changes[Cor3CandidateStartup.runtimeKey]){
      // A new background owner has no inherited binding. Invalidate old work on
      // event delivery, independently of the user's desired pause preference.
      ++readSerial;++applySequence;mainConfirmed=false;gate.apply(true);void relay();resolveReady();return;
    }
    if (globalThis.Cor3CandidateStartup) {
      if ((area === "local" && changes.helperMode) || (area === "local" && changes[Cor3CandidateStartup.key])) reloadState();
      return;
    }
    if (area !== "local" || !changes.helperMode) return;
    ++readSerial;
    apply(changes.helperMode.newValue !== false);
  });
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request&&['cor3MasterProbe','cor3MasterApply'].includes(request.action)){
      if(sender?.id!==chrome.runtime.id||request.expectedContentDocumentId!==documentId){sendResponse({ok:false,error:'CONTENT_DOCUMENT_MISMATCH'});return;}
    }
    if (request && request.action === "cor3MasterProbe") { ready.then(() => sendResponse({ ...gate.snapshot(), allowed: gate.allowed() && mainConfirmed })); return true; }
    if (!request || request.action !== 'cor3MasterApply') return;
    if(sender?.id!==chrome.runtime.id){sendResponse({ok:false,error:'Wrong extension sender.'});return;}
    ++readSerial;
    apply(request.paused !== false).then(result => sendResponse({ ...result, frameUrl: location.origin + location.pathname, reloadRequired: gate.snapshot().reloadRequired }));
    return true;
  });
  globalThis.Cor3Automation = {
    get contentDocumentId(){return documentId;},
    allowed: () => gate.allowed() && mainConfirmed, snapshot: gate.snapshot, ready,
    onStop(fn) { stopHooks.add(fn); if (gate.snapshot().ready && !gate.allowed()) fn(); },
    onReady(fn){readyHooks.add(fn);if(gate.allowed()&&mainConfirmed)fn(gate.token());return()=>readyHooks.delete(fn)},
    validRun:token=>gate.valid(token)&&mainConfirmed,
    permitsRequest: request => (gate.allowed() && mainConfirmed) || Cor3MasterCore.isAllowedRequest(request)
  };
  // Closure-owned scheduler fence. MAIN observations cannot certify cancellation.
  const features = Object.fromEntries(['daily','ice','decrypt','simple'].map(name => [name, {epoch:0,aborts:0,closed:false,ticket:null}]));
  const nonce = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2,'0')).join('');
  const documentId = nonce();
  // Separate page-only permission: never opens the full automation gate.
  const threeGate=Cor3MasterCore.createGate(true), threeReady=new Set(),threeStops=new Set();
  let threeSequence=0,threeScope=null,threeConfirmed=false,threeNotified=null;
  let threeFlight = null, threeDirty = false, threeRetry = null, retryCount = 0, pageClosed = false;
  let threeStatus = { state: 'waiting', code: 'SOLVER_STARTING' };
  const threePending=new Map();
  const threeSame=(a,b)=>!!a&&!!b&&['windowId','tabId','url','documentId','epoch'].every(k=>a[k]===b[k]);
  function threeRelay(paused){const requestId=nonce();return new Promise(resolve=>{const timer=setTimeout(()=>{threePending.delete(requestId);resolve(false)},1000);threePending.set(requestId,{paused,finish:value=>{clearTimeout(timer);resolve(value)}});window.postMessage({type:'COR3_THREE_STATE',requestId,paused},location.origin)});}
  window.addEventListener('message',event=>{if(event.source!==window||event.origin!==location.origin||event.data?.type!=='COR3_THREE_ACK')return;const e=threePending.get(event.data.requestId);if(!e)return;threePending.delete(event.data.requestId);e.finish(event.data.allowed===!e.paused)});
  function threeClose(code = 'SOLVER_SCOPE_STALE'){
    ++threeSequence;threeConfirmed=false;threeScope=null;threeGate.apply(true);void threeRelay(true);
    threeStatus = { state: code === 'SOLVER_PAUSED' ? 'paused' : 'waiting', code };
  }
  function scheduleThreeRetry() {
    if (pageClosed || threeRetry || retryCount >= 8) return;
    const delay = Math.min(5000, 250 * 2 ** retryCount++);
    threeRetry = setTimeout(() => {
      threeRetry = null;
      void threeRefresh();
    }, delay);
    threeRetry?.unref?.();
  }
  function askThree(documentId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('SOLVER_ADMISSION_TIMEOUT')), 6000);
      Promise.resolve(chrome.runtime.sendMessage({type:'cor3SolverAdmission',documentId})).then(
        value => { clearTimeout(timer); resolve(value); },
        () => { clearTimeout(timer); reject(Error('SOLVER_RECEIVER_UNAVAILABLE')); }
      );
    });
  }
  async function threeRefresh(){
    if (pageClosed) return;
    if (threeFlight) { threeDirty = true; return threeFlight; }
    const task = refreshThreePermission();
    threeFlight = task;
    try { return await task; }
    finally {
      if (threeFlight === task) threeFlight = null;
      if (threeDirty && !pageClosed) { threeDirty = false; void threeRefresh(); }
    }
  }
  async function refreshThreePermission(){
    const seq=++threeSequence;
    const ownDocument=window.top===window?globalThis.Cor3SolverPageDocument?.snapshot()?.documentId:documentId;
    if(!ownDocument){threeClose('SOLVER_DOCUMENT_UNAVAILABLE');return;}
    try{
      const ask=()=>askThree(ownDocument);
      const first=await ask();if(seq!==threeSequence)return;
      if(first?.allowed!==true||!first.scope){
        threeClose(first?.code || 'SOLVER_ADMISSION_DENIED');scheduleThreeRetry();return;
      }
      if(first.values?.helperMode!==false){threeClose('SOLVER_PAUSED');return;}
      if(threeConfirmed&&threeSame(threeScope,first.scope))return;
      threeConfirmed=false;threeGate.apply(true);await threeRelay(true);if(seq!==threeSequence)return;
      const ack=await threeRelay(false);if(seq!==threeSequence)return;
      const second=await ask();if(seq!==threeSequence)return;
      if(!ack||second?.allowed!==true||second.values?.helperMode!==false||!threeSame(first.scope,second.scope)){
        threeClose(second?.code || 'SOLVER_CONFIRMATION_FAILED');scheduleThreeRetry();return;
      }
      threeScope=second.scope;threeGate.apply(false);threeConfirmed=true;
      threeStatus = { state: 'allowed', code: 'SOLVER_CONNECTED' };
      retryCount = 0;
      clearTimeout(threeRetry);threeRetry = null;
      const token=threeGate.token();if(token!==threeNotified){threeNotified=token;for(const fn of threeReady)fn(token,second.values);}
    }catch(e){if(seq===threeSequence){threeClose(e?.message==='SOLVER_ADMISSION_TIMEOUT'?e.message:'SOLVER_RECEIVER_UNAVAILABLE');scheduleThreeRetry();}}
  }
  globalThis.Cor3ThreeAutomation=Object.freeze({allowed:()=>threeConfirmed&&threeGate.allowed(),status:()=>({...threeStatus}),validRun:t=>threeConfirmed&&threeGate.valid(t),onReady(fn){threeReady.add(fn);return()=>threeReady.delete(fn)},onStop(fn){threeStops.add(fn);return()=>threeStops.delete(fn)},refresh:threeRefresh});
  threeGate.onStop(()=>{for(const name of ['decrypt','ice','simple'])scheduler.stop(name);for(const fn of threeStops)fn()});
  chrome.runtime.onMessage.addListener((m,s,reply)=>{
    if(s?.id!==chrome.runtime.id)return;
    if(m?.action==='cor3SolverDocumentProbe'){reply(m.expectedContentDocumentId===documentId?{documentId,url:location.href}:null);return;}
    if(m?.type==='cor3SolverPageReady'){retryCount=0;void threeRefresh();reply({ok:true});return;}
    if(m?.type==='cor3SolverScopeChanged'){if(!threeScope||threeSame(m.scope,threeScope)){threeClose();void threeRefresh();}reply({ok:true});}
    if(m?.type==='cor3SolverScopeRevoked'){if(!threeScope||threeSame(m.scope,threeScope)){threeClose();retryCount=0;scheduleThreeRetry();}reply({ok:true});}
  });
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.cor3CenterRuntimeEpoch||changes.helperMode)){threeClose();void threeRefresh();}});
  window.addEventListener('load',()=>{retryCount=0;void threeRefresh();});
  window.addEventListener('pagehide',()=>{pageClosed=true;clearTimeout(threeRetry);threeClose('SOLVER_DOCUMENT_CLOSED');},{once:true});
  for(const name of ['popstate','hashchange'])window.addEventListener(name,()=>{clearTimeout(threeRetry);threeClose('SOLVER_DOCUMENT_UNAVAILABLE');});
  const lifecyclePending = new Map();
  function requestLifecycle(type, feature, id = nonce()) {
    return new Promise(resolve => {
      const timer = setTimeout(() => { lifecyclePending.delete(id); resolve(null); }, 700);
      lifecyclePending.set(id, {type:type === 'COR3_LIFECYCLE_PROBE' ? 'COR3_LIFECYCLE_SNAPSHOT' : 'COR3_LIFECYCLE_PREPARED', finish(data) { clearTimeout(timer); resolve(data); }});
      window.postMessage({type, nonce:id, ...(feature ? {feature} : {})}, location.origin);
    });
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || !event.data) return;
    const entry = lifecyclePending.get(event.data.nonce);
    if (!entry || entry.type !== event.data.type) return;
    lifecyclePending.delete(event.data.nonce); entry.finish(event.data);
  });
  const scheduler = {
    capture: name => features[name].epoch,
    valid: (name, epoch) => epoch === features[name].epoch && !features[name].closed && (name==='daily'?Cor3Automation.allowed():Cor3ThreeAutomation.allowed()),
    enable(name) { if (features[name].closed) features[name].epoch++; features[name].closed = false; },
    stop(name) {
      const state = features[name], ticket = state.ticket;
      state.epoch++; state.aborts++; state.closed = true; state.ticket = null;
      if (['daily','decrypt','simple'].includes(name)) {
        if (ticket) window.postMessage({type:'COR3_LIFECYCLE_CLOSE',feature:name,lifecycleTicket:ticket}, location.origin);
        // Master-close already fences every MAIN feature; idle-only closure is for a live-gate explicit stop.
        else if (name==='daily'?Cor3Automation.allowed():Cor3ThreeAutomation.allowed()) window.postMessage({type:'COR3_LIFECYCLE_CLOSE_IDLE',feature:name}, location.origin);
      }
    },
    accepts(name, data) { return !!data && !!features[name].ticket && data.lifecycleTicket === features[name].ticket && scheduler.valid(name, features[name].epoch); },
    async prepare(name) {
      const epoch = features[name].epoch;
      if (!scheduler.valid(name, epoch)) return null;
      const ticket = nonce();
      features[name].ticket = ticket;
      const result = await requestLifecycle('COR3_LIFECYCLE_PREPARE', name, ticket);
      return scheduler.valid(name, epoch) && features[name].ticket === ticket && result?.allowed === true ? result.nonce : null;
    }
  };
  gate.onStop(() => scheduler.stop("daily"));
  globalThis.Cor3ObservableScheduler = Object.freeze(scheduler);
  globalThis.Cor3ObservableControls = Object.freeze({async probe() {
    const epochs = Object.fromEntries(Object.entries(features).map(([name,state]) => [name,state.epoch]));
    const advisory = await requestLifecycle('COR3_LIFECYCLE_PROBE');
    const result = {version:1,gate:{ready:gate.snapshot().ready,allowed:Cor3Automation.allowed(),reloadRequired:gate.snapshot().reloadRequired}};
    for (const name of ['daily','ice','decrypt','simple']) {
      const observed = epochs[name] === features[name].epoch ? advisory?.snapshot?.[name]?.state : null;
      const main = advisory?.snapshot?.[name];
      // Page-origin evidence is anti-misrouting, not authentication. This is scoped local
      // effect fencing, never server rollback, all-frame shutdown or physical async drain.
      const closed = epochs[name] === features[name].epoch && features[name].closed &&
        observed === 'stopped' && main?.guardClosed === true && main?.queuesInvalidated === true && main?.activeRunsAborted === true;
      result[name] = {
        state:closed ? 'stopped' : 'unknown', observedState:['running','stopped','unknown'].includes(observed) ? observed : 'unknown',
        evidence:closed ? 'observed-local-lifecycle' : advisory ? 'advisory-main' : 'unavailable', runId:documentId + '-' + name,
        abortGeneration:features[name].aborts, guardClosed:closed, queuesInvalidated:closed, activeRunsAborted:closed,
        isolatedSchedulerClosed:features[name].closed
      };
    }
    return result;
  }});
  const revokeLocal=()=>{++readSerial;++applySequence;mainConfirmed=false;gate.apply(true);void relay();};
  window.addEventListener('pagehide',revokeLocal,{once:true});
  window.addEventListener('popstate',revokeLocal);
  window.addEventListener('hashchange',revokeLocal);
  reloadState();
  void threeRefresh();
})();







