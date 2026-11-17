/* Service-worker coordinator. State writes are serialized; preferences are not rewritten. */
(function () {
  "use strict";
  const gate = Cor3MasterCore.createGate(false);
  let serial = 0, chain = Promise.resolve(), pauseEpoch = 0, modeBusy = false, failedClosed = false;
    const hooks = new Set();
  let observedDocuments=[];
  const documentOptions=f=>({frameId:f.frameId,...(f.browserDocumentId?{documentId:f.browserDocumentId}:{})});
  const contentNonce=value=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);
  // A timeout does not cancel a Chrome write. Keep tracking its actual settlement.
  const pendingModeWrites = new Set();
  function writeMode(paused) {
    const pending = Promise.resolve().then(() => chrome.storage.local.set({ helperMode: paused }));
    pendingModeWrites.add(pending);
    pending.then(() => pendingModeWrites.delete(pending), () => pendingModeWrites.delete(pending));
    return pending;
  }
  // Errors belong to one explicit pause attempt. Actual unsettled hook promises
  // remain fenced globally even after a command has timed out.
  const pendingCleanup = new Set();
  const newCleanupAttempt = () => ({ errors: [], pending: [] });
  let cleanupAttempt = newCleanupAttempt(), suppressCleanup = false;
  function runHook(hook, attempt = cleanupAttempt) {
    try {
      const pending = Promise.resolve(hook()).catch(() => attempt.errors.push("MASTER_CLEANUP_UNCONFIRMED"));
      attempt.pending.push(pending);
      pendingCleanup.add(pending);
      pending.then(() => pendingCleanup.delete(pending));
    } catch (_) { attempt.errors.push("MASTER_CLEANUP_UNCONFIRMED"); }
  }
  function closeGateWithoutCleanup() {
    suppressCleanup = true;
    try { gate.apply(true); } finally { suppressCleanup = false; }
  }
  gate.onStop(() => { if (!suppressCleanup) for (const hook of hooks) runHook(hook); });
  const initSerial = serial;
  const ready = (globalThis.Cor3CandidateStartup ? Cor3CandidateStartup.initializeBackground(chrome) : chrome.storage.local.get("helperMode")).then(data => {
    if (serial === initSerial) gate.apply(true);
  }).catch(() => { if (serial === initSerial) gate.apply(true); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.helperMode) return;
    ++serial;
    const paused = globalThis.Cor3CandidateStartup ? Cor3CandidateStartup.effectivePaused(changes.helperMode.newValue) : changes.helperMode.newValue !== false;
    if (paused) ++pauseEpoch;
    // Storage notifications can close a gate, never reopen a closed gate.
    gate.apply(paused || modeBusy || failedClosed || !gate.allowed());
  });
  function timeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for browser context.")), ms);
      Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
  }
  async function masterDocuments(check, targetTabId) {
    await check();
    const tabs = await timeout(chrome.tabs.query({ url: ["https://cor3.gg/*", "https://os.cor3.gg/*", "https://svc-corie.cor3.gg/games/simple-hack*"] }), 2500);
    await check();
    if (!Array.isArray(tabs) || !tabs.length || tabs.length > 16) throw new Error("MASTER_FRAME_UNCONFIRMED");
        const binding = globalThis.Cor3CenterBinding?.snapshot();
    if(!binding || !Number.isSafeInteger(targetTabId) || binding.tabId!==targetTabId || !Cor3CenterBinding.isCurrent(binding)) throw Error('MASTER_TARGET_UNCONFIRMED');
    const selectedTabs=tabs.filter(tab=>tab.id===targetTabId);
    if(selectedTabs.length!==1)throw Error('MASTER_TARGET_UNCONFIRMED');
    const documents = [], ids = new Set();
    for (const tab of selectedTabs) {
      if (!Number.isSafeInteger(tab.id) || tab.id < 0 || ids.has(tab.id)) throw new Error("MASTER_FRAME_UNCONFIRMED");
      ids.add(tab.id);
      const frames = await timeout(chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: () => {
        const relevant = location.hostname === "cor3.gg" || location.hostname === "os.cor3.gg" ||
          (location.hostname === "svc-corie.cor3.gg" && location.pathname.startsWith("/games/simple-hack"));
        return { relevant, ready: typeof globalThis.Cor3Automation !== "undefined", contentDocumentId: globalThis.Cor3Automation?.contentDocumentId };
      } }), 2500);
      await check();
      if (!Array.isArray(frames) || !frames.length || frames.length > 32) throw new Error("MASTER_FRAME_UNCONFIRMED");
      const frameIds = new Set(); let relevant = 0;
      for (const f of frames) {
        if (!Number.isSafeInteger(f.frameId) || f.frameId < 0 || frameIds.has(f.frameId) || f.error ||
            !f.result || typeof f.result.relevant !== "boolean" || typeof f.result.ready !== "boolean" ||
            (f.result.relevant&&!contentNonce(f.result.contentDocumentId)) || (f.documentId!==undefined&&(typeof f.documentId!=='string'||!/^[A-Za-z0-9_.:-]{1,80}$/.test(f.documentId)))) throw new Error("MASTER_FRAME_UNCONFIRMED");
        frameIds.add(f.frameId);
        documents.push({ tabId: tab.id, frameId: f.frameId, contentDocumentId: f.result.contentDocumentId || null, browserDocumentId: f.documentId || null, relevant: f.result.relevant });
        if (f.result.relevant) { relevant++; if (!f.result.ready) throw new Error("MASTER_FRAME_UNCONFIRMED"); }
      }
      if (!relevant || !frameIds.has(0)) throw new Error("MASTER_FRAME_UNCONFIRMED");
    }
    if (documents.length > 32 || (targetTabId !== undefined && !documents.some(f => f.tabId === targetTabId && f.frameId === 0 && f.relevant))) throw new Error("MASTER_FRAME_UNCONFIRMED");
    observedDocuments=documents.sort((a,b) => a.tabId-b.tabId || a.frameId-b.frameId); return observedDocuments;
  }
  async function setPaused(paused, context, epoch, pauseAttempt) {
    await ready;
    const native = context !== undefined;
        const assertCurrent = native ? context.assertCurrent : async () => { throw Error('MASTER_TARGET_UNCONFIRMED'); };
    const closureOperationId = native && typeof context.operationId === "string" && /^[A-Za-z0-9_-]{16,80}$/.test(context.operationId) ? context.operationId : null;
    let persisted = false, attempted = false, stopped = [], knownDocuments = [];
    const observedNoop = !paused && gate.allowed() && !failedClosed;
    modeBusy = true;
    ++serial;
    const operationSerial = serial;
    if (!observedNoop) closeGateWithoutCleanup();
    let currentCleanup = cleanupAttempt;
    const check = async () => {
      if (typeof assertCurrent !== "function" || (native && (!Number.isSafeInteger(context.tabId) || context.tabId < 0))) throw new Error("MASTER_TARGET_UNCONFIRMED");
      await assertCurrent();
      if (!paused && pauseEpoch !== epoch) throw new Error("MASTER_RESUME_SUPERSEDED");
      if (observedNoop && (serial !== operationSerial || !gate.allowed())) throw new Error("MASTER_STATE_CHANGED");
    };
    try {
      if (globalThis.Cor3CandidateStartup && !Cor3CandidateStartup.isInitialized()) throw new Error("MASTER_INITIALIZATION_FAILED");
      await check();
      // Do not certify a later pause while a timed-out earlier write can still
      // overwrite it. Waiting is bounded; only a later explicit command retries.
      if (pendingModeWrites.size) {
        try { await timeout(Promise.allSettled([...pendingModeWrites]), 2500); }
        catch (_) { throw new Error("MASTER_WRITE_PENDING"); }
        await check();
        if (pendingModeWrites.size) throw new Error("MASTER_WRITE_PENDING");
      }
      if (paused) {
        // Include any hooks added while waiting; never overlap a fresh cleanup
        // attempt with genuinely unresolved work from an earlier attempt.
        const own = new Set(pauseAttempt.pending);
        const prior = [...pendingCleanup].filter(p => !own.has(p));
        if (prior.length) {
          try { await timeout(Promise.all(prior), 2500); }
          catch (_) { throw new Error("MASTER_CLEANUP_PENDING"); }
          await check();
        }
        if ([...pendingCleanup].some(p => !own.has(p))) throw new Error("MASTER_CLEANUP_PENDING");
        cleanupAttempt = currentCleanup = pauseAttempt;
      }
      if (!observedNoop) gate.apply(true);
      let before = paused ? null : await masterDocuments(check, context?.tabId);
      knownDocuments = before || [];
      const previous = await timeout(chrome.storage.local.get("helperMode"), 2500);
      await check();
      if (observedNoop && previous.helperMode !== false) throw new Error("MASTER_STORAGE_UNCONFIRMED");
      if(!context?.automatic){
        await timeout(chrome.storage.local.set({cor3CenterPauseChoice:{value:paused,source:'explicit-master-command',at:new Date().toISOString()}}),2500);
        await check();
      }
      if(context?.automatic && previous.helperMode!==false)throw Error('MASTER_DESIRED_PAUSE_CHANGED');
      if (previous.helperMode !== paused) {
        attempted = true;
        await timeout(writeMode(paused), 2500);
        await check();
      }
      const readback = await timeout(chrome.storage.local.get("helperMode"), 2500);
      await check();
      if (readback.helperMode !== paused) throw new Error("MASTER_STORAGE_UNCONFIRMED");
      persisted = true;
      if (paused) before = await masterDocuments(check, context?.tabId);
      if (!observedNoop) for (const f of before.filter(f => f.relevant)) {
        await check();
        const result = await timeout(chrome.tabs.sendMessage(f.tabId, { action: "cor3MasterApply", paused, expectedContentDocumentId:f.contentDocumentId }, documentOptions(f)), 2500);
        await check();
        const errorsValid = Array.isArray(result?.errors) ? result.errors.length === 0 : !paused && result?.errors === undefined;
        const valid = errorsValid && result?.ok === true && result.state?.ready === true &&
          (paused ? result.state.allowed === false : result.state.allowed === true || result.reloadRequired === true);
        stopped.push({ ...f, ok: valid, state: { ready: result?.state?.ready === true, allowed: result?.state?.allowed === true },
          reloadRequired: result?.reloadRequired === true, errors: valid ? [] : ["MASTER_ACK_UNCONFIRMED"] });
        if (!valid) throw new Error("MASTER_ACK_UNCONFIRMED");
      }
      for (let i = 0; i < currentCleanup.pending.length; i++) await timeout(currentCleanup.pending[i], 2500);
      if (currentCleanup.errors.length) throw new Error("MASTER_CLEANUP_UNCONFIRMED");
      if (paused || observedNoop) for (const f of before.filter(f => f.relevant)) {
        await check();
        const probe = await timeout(chrome.tabs.sendMessage(f.tabId, { action: "cor3MasterProbe", expectedContentDocumentId:f.contentDocumentId }, documentOptions(f)), 2500);
        await check();
        const valid = probe?.ready === true && (paused ? probe.allowed === false :
          probe.allowed === true || (probe.allowed === false && probe.reloadRequired === true));
        if (!valid) throw new Error("MASTER_PROBE_UNCONFIRMED");
        if (observedNoop) stopped.push({ ...f, ok: true, state: { ready: true, allowed: probe.allowed === true },
          reloadRequired: probe.reloadRequired === true, errors: [] });
      }
      const after = await masterDocuments(check, context?.tabId);
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("MASTER_DOCUMENTS_CHANGED");
      const finalSerial = serial;
      const finalRead = await timeout(chrome.storage.local.get("helperMode"), 2500);
      await check();
      if (finalRead.helperMode !== paused) throw new Error("MASTER_STORAGE_UNCONFIRMED");
      for (let i = 0; i < currentCleanup.pending.length; i++) await timeout(currentCleanup.pending[i], 2500);
      const drained = currentCleanup.pending.length;
      await check();
      if (pendingModeWrites.size) throw new Error("MASTER_WRITE_PENDING");
      if (serial !== finalSerial) throw new Error("MASTER_STATE_CHANGED");
      if (currentCleanup.errors.length || currentCleanup.pending.length !== drained) throw new Error("MASTER_CLEANUP_UNCONFIRMED");
      failedClosed = false;
      if (!paused && !observedNoop) gate.apply(false);
      // Keep the settled attempt as evidence until a later explicit pause.
      // Resume/no-op commands do not erase a failed cleanup attempt.
      return { ok: true, persisted: true, paused: !gate.allowed(), frames: stopped, unconfirmed: [], issues: [],
        localMasterClosed: paused && !gate.allowed() && closureOperationId !== null,
        ...(paused && !gate.allowed() && closureOperationId !== null ? { masterClosureOperationId: closureOperationId } : {}),
        reloadRequired: !paused && stopped.some(item => item.reloadRequired),
        note: paused ? "Future helper actions stopped. Already submitted game actions cannot be undone." : "Preferences retained. Refresh previously stopped game pages to resume; old queues are not replayed." };
    } catch (error) {
      failedClosed = true;
      closeGateWithoutCleanup();
      // Preserve the requested stored preference and honest unknown outcome. Only
      // locally fence already observed documents; this is not rollback or proof.
      if (!paused && (attempted || persisted)) {
        for (const f of knownDocuments.filter(f => f.relevant)) {
          // The original identity/session may have been revoked while awaiting an ACK.
          // Never send controls to a document after that authority is lost.
          try { await assertCurrent(); } catch (_) { break; }
          try { await timeout(chrome.tabs.sendMessage(f.tabId, { action: "cor3MasterApply", paused: true, expectedContentDocumentId:f.contentDocumentId }, documentOptions(f)), 2500); } catch (_) {}
        }
      }
      const issue = /^MASTER_[A-Z_]+$/.test(error?.message || "") ? error.message : "MASTER_STATE_UNCONFIRMED";
      return { ok: false, persisted: attempted || pendingModeWrites.size ? null : persisted, paused: true, localMasterClosed: false,
        frames: stopped, unconfirmed: stopped.filter(item => !item.ok), issues: [issue], reloadRequired: true };
    } finally { modeBusy = false; }
  }
  function queueMode(paused, context) {
    paused = paused !== false;
    const pauseAttempt = paused ? newCleanupAttempt() : null;
    if (paused) {
      ++pauseEpoch; ++serial;
      // Attribute synchronous enqueue-time failures to THIS command. If an
      // earlier attempt is still running, close tokens now and defer hook retry.
      if (!modeBusy && pendingCleanup.size === 0) {
        const previous = cleanupAttempt;
        cleanupAttempt = pauseAttempt;
        try { gate.apply(true); } finally { cleanupAttempt = previous; }
      } else closeGateWithoutCleanup();
    }
    const epoch = pauseEpoch;
    chain = chain.catch(() => {}).then(() => setPaused(paused, context, epoch, pauseAttempt));
    return chain;
  }
  // Fixed preference-only operation. It never pauses, resumes or starts a solver.
  // This is same-user source-labelled evidence, not independent authentication.
  async function closedPreferenceDocuments(targetTabId, assertCurrent) {
    await assertCurrent();
    const tabs = await timeout(chrome.tabs.query({ url: ["https://cor3.gg/*", "https://os.cor3.gg/*", "https://svc-corie.cor3.gg/games/simple-hack*"] }), 2500);
    if (!Array.isArray(tabs) || !tabs.length || tabs.length > 16 || !tabs.some(tab => tab.id === targetTabId)) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
    await assertCurrent();
    const seen = new Set(), documents = [];
    for (const tab of tabs.filter(item => item.id === targetTabId)) {
      if (!Number.isSafeInteger(tab.id) || tab.id < 0 || seen.has(tab.id)) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
      seen.add(tab.id);
      const frames = await timeout(chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: async () => {
        const main = location.hostname === "cor3.gg" || location.hostname === "os.cor3.gg";
        const simple = location.hostname === "svc-corie.cor3.gg" && location.pathname.startsWith("/games/simple-hack");
        if (!main && !simple) return { relevant: false };
        const api = globalThis.Cor3Automation, observer = globalThis.Cor3ObservableControls;
        if (!api || !observer || typeof observer.probe !== "function") return { relevant: true, closed: false };
        const p = await observer.probe(), names = main ? ["decrypt","ice","simple"] : ["simple"];
        const closed = p && p.gate && p.gate.ready === true && p.gate.allowed === false && names.every(name => {
          const f = p[name]; return f && f.state === "stopped" && f.evidence === "observed-local-lifecycle" && f.isolatedSchedulerClosed === true && f.guardClosed === true && f.queuesInvalidated === true && f.activeRunsAborted === true;
        });
        return { relevant: true, closed: !!closed, contentDocumentId:api.contentDocumentId };
      } }), 2500);
      if (!Array.isArray(frames) || !frames.length || frames.length > 32) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
      await assertCurrent();
      let relevant = 0; const frameIds = new Set();
      for (const frame of frames) {
        if (!Number.isSafeInteger(frame.frameId) || frame.frameId < 0 || frameIds.has(frame.frameId) || frame.error || !frame.result || typeof frame.result !== "object" || Array.isArray(frame.result)) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
        frameIds.add(frame.frameId);
        if (frame.result.relevant === false && Object.keys(frame.result).length === 1) continue;
        if (frame.result.relevant !== true || Object.keys(frame.result).sort().join(",") !== "closed,contentDocumentId,relevant") throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
        relevant++;
        if (frame.result.closed !== true || !Number.isSafeInteger(frame.frameId) || frame.frameId < 0 || !contentNonce(frame.result.contentDocumentId) || (frame.documentId!==undefined&&(typeof frame.documentId!=="string"||!/^[A-Za-z0-9_.:-]{1,80}$/.test(frame.documentId)))) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
        documents.push(tab.id + ":" + frame.frameId + ":" + frame.result.contentDocumentId + ":" + (frame.documentId||""));
      }
      if (!relevant) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
    }
    if (documents.length > 32 || new Set(documents).size !== documents.length || !documents.some(value => value.startsWith(targetTabId + ":0:"))) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
    return documents.sort().join("|");
  }
  async function saveThreeSolverDefaults(targetTabId, assertCurrent) {
    await ready;
    let persisted = false, writeAttempted = false;
    const keys = ["autoDecryptEnabled", "autoIceWallEnabled", "autoSimpleDecryptEnabled"];
    try {
      if (typeof assertCurrent !== "function") throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
      await assertCurrent();
      if (!Number.isSafeInteger(targetTabId) || targetTabId < 0) throw new Error("PREFERENCE_SAVE_FRAME_UNCONFIRMED");
      const modeSerial = serial;
      const checkPause = async () => {
        await assertCurrent();
        const value = await chrome.storage.local.get("helperMode");
        await assertCurrent();
        if (value.helperMode !== true || serial !== modeSerial || gate.allowed()) throw new Error("PREFERENCE_SAVE_REQUIRES_PAUSE");
      };
      await checkPause();
      const before = await closedPreferenceDocuments(targetTabId, assertCurrent);
      await checkPause();
      // No writes to helperMode, Daily, anti-AFK or unrelated preferences.
      await assertCurrent();
      writeAttempted = true;
      await Cor3CenterStore.set(Object.fromEntries(keys.map(key => [key, true])));
      persisted = true;
      await assertCurrent();
      await checkPause();
      const readback = await Cor3CenterStore.get(keys);
      if (!keys.every(key => readback[key] === true)) throw new Error("PREFERENCE_SAVE_STATE_CHANGED");
      const after = await closedPreferenceDocuments(targetTabId, assertCurrent);
      await checkPause();
      if (after !== before) throw new Error("PREFERENCE_SAVE_STATE_CHANGED");
      return { ok: true, persisted: true, started: false, code: "THREE_SOLVER_DEFAULTS_SAVED" };
    } catch (error) {
      const known = ["PREFERENCE_SAVE_REQUIRES_PAUSE", "PREFERENCE_SAVE_FRAME_UNCONFIRMED", "PREFERENCE_SAVE_STATE_CHANGED"];
      return { ok: false, persisted: writeAttempted ? null : false, started: false, code: writeAttempted ? "PREFERENCE_SAVE_STATE_CHANGED" : known.includes(error?.message) ? error.message : "PREFERENCE_SAVE_FRAME_UNCONFIRMED" };
    }
  }
  // Same-worker bridge commands. No general runtime or WS forwarding is provided.
  globalThis.Cor3FullRuntimeCommands = Object.freeze({
    dispatch(request, context) {
      if (!request || typeof request !== "object" || Array.isArray(request)) return Promise.resolve({ ok: false, error: "INVALID_FIXED_COMMAND" });
      const keys = Object.keys(request).sort().join(",");
      if (request.action === "setThreeSolverDefaults" && keys === "action") {
                const expected=globalThis.Cor3CenterBinding?.snapshot();
        if(!expected || expected.tabId!==context?.tabId) return Promise.resolve({ok:false,error:'CENTER_BINDING_REQUIRED'});
        const targetTabId=expected.tabId, originalCheck=context?.assertCurrent;
        const assertCurrent=async()=>{await Cor3CenterBinding.guard(expected.tabId,async()=>{if(typeof originalCheck!=='function')throw Error('CENTER_BINDING_REQUIRED');await originalCheck()},expected)};
        chain = chain.catch(() => {}).then(() => saveThreeSolverDefaults(targetTabId, assertCurrent));
        return chain;
      }
            if(request.action==='cor3SetHelperMode'&&keys==='action,paused'&&typeof request.paused==='boolean'){
       const expected=globalThis.Cor3CenterBinding?.snapshot();
       if(!expected||expected.tabId!==context?.tabId)return Promise.resolve({ok:false,error:'CENTER_BINDING_REQUIRED'});
       return queueMode(request.paused,{tabId:expected.tabId,operationId:context.operationId,assertCurrent:()=>Cor3CenterBinding.guard(expected.tabId,async()=>{if(typeof context.assertCurrent!=='function')throw Error('CENTER_BINDING_REQUIRED');await context.assertCurrent()},expected)});
      }
      if (request.action === "scheduleAutoFinishAll" && keys === "action" && typeof globalThis.Cor3FullScheduleAutoFinishAll === "function") return Promise.resolve().then(() => globalThis.Cor3FullScheduleAutoFinishAll());
      return Promise.resolve({ ok: false, error: "INVALID_FIXED_COMMAND" });
    }
  });
  const bindingApi=globalThis.Cor3CenterBinding;
  if(!bindingApi) gate.apply(true);
  bindingApi?.onRevoke(old=>{
    ++pauseEpoch;++serial;gate.apply(true);
    // Revocation blocks the effective gate, never changes the desired pause preference.
    // Stop controls only, never game commands; old target cannot keep running.
    for(const f of observedDocuments.filter(f=>f.tabId===old?.tabId))chrome.tabs.sendMessage(f.tabId,{action:'cor3MasterApply',paused:true,expectedContentDocumentId:f.contentDocumentId},documentOptions(f)).catch(()=>{});observedDocuments=[];
  });
  let automaticSequence=0;
  function reconcileBinding(expected){
    const generation=++automaticSequence,epoch=pauseEpoch;
    chain=chain.catch(()=>{}).then(async()=>{
      await ready;
      if(generation!==automaticSequence||!expected||!bindingApi?.isCurrent(expected))return;
      const context={automatic:true,tabId:expected.tabId,assertCurrent:()=>bindingApi.guard(expected.tabId,async()=>{
        if(generation!==automaticSequence||pauseEpoch!==epoch)throw Error('MASTER_RESUME_SUPERSEDED');
        const desired=await chrome.storage.local.get('helperMode');
        if(desired.helperMode!==false)throw Error('MASTER_DESIRED_PAUSE_CHANGED');
      },expected)};
      try{await context.assertCurrent();}catch{gate.apply(true);return;}
      await setPaused(false,context,epoch,null);
    });
  }
  bindingApi?.onBound?.(reconcileBinding);
  if(bindingApi?.snapshot())reconcileBinding(bindingApi.snapshot());
  async function topDocument(expected){
   return bindingApi.guard(expected.tabId,async()=>{
    const frames=await timeout(chrome.scripting.executeScript({target:{tabId:expected.tabId,frameIds:[0]},func:()=>({contentDocumentId:globalThis.Cor3Automation?.contentDocumentId})}),2000);
    if(!Array.isArray(frames)||frames.length!==1||frames[0].frameId!==0||!contentNonce(frames[0].result?.contentDocumentId))throw Error('MASTER_DOCUMENT_UNCONFIRMED');
    const f=frames[0];return {tabId:expected.tabId,frameId:0,contentDocumentId:f.result.contentDocumentId,browserDocumentId:typeof f.documentId==='string'?f.documentId:null};
   },expected);
  }
  chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request?.action==='cor3CenterBoundPermission'){
      if(sender?.id!==chrome.runtime.id||!Number.isSafeInteger(sender.tab?.id)){sendResponse({bound:false});return;}
            if(sender.frameId===0){
       bindingApi?.admission(sender,request.documentId).then(result=>sendResponse({bound:result?.allowed===true,snapshot:result?.allowed?result.snapshot:null}),()=>sendResponse({bound:false}));
      }else if(Number.isSafeInteger(sender.frameId)&&sender.frameId>0){
       // Child frames never inherit a different tab; the existing parent MAIN gate
       // probe below additionally requires its bound parent to be actively allowed.
       bindingApi?.resolve().then(tab=>sendResponse({bound:!!tab&&tab.id===sender.tab.id,snapshot:tab&&tab.id===sender.tab.id?bindingApi.snapshot():null}),()=>sendResponse({bound:false}));
      }else{sendResponse({bound:false});return;}
      if(!bindingApi){sendResponse({bound:false});return;}return true;
    }
    if(request?.action==='cor3MasterParentAllowed'){
      if(sender?.id!==chrome.runtime.id||!Number.isSafeInteger(sender.tab?.id)||!sender.frameId){sendResponse({ready:true,allowed:false});return;}
      const expected=bindingApi?.snapshot();
      if(!expected||expected.tabId!==sender.tab.id){sendResponse({ready:true,allowed:false});return;}
      topDocument(expected).then(f=>bindingApi.guard(expected.tabId,()=>timeout(chrome.tabs.sendMessage(expected.tabId,{action:'cor3MasterProbe',expectedContentDocumentId:f.contentDocumentId},documentOptions(f)),2500),expected))
       .then(state=>sendResponse({ready:!!state?.ready,allowed:!!state?.allowed}),()=>sendResponse({ready:false,allowed:false}));return true;
    }
    if(request?.action!=='cor3SetHelperMode')return;
    const ownUi=sender?.id===chrome.runtime.id&&!sender.tab&&[chrome.runtime.getURL('popup.html'),chrome.runtime.getURL('popup.html')+'?mode=popout',chrome.runtime.getURL('popup.html')+'?mode=sidepanel',chrome.runtime.getURL('center-bind.html')].includes(sender.url);
    // Popup can also be opened as an extension tab; exact privileged URL still required.
    const ownPage=sender?.id===chrome.runtime.id&&[chrome.runtime.getURL('popup.html'),chrome.runtime.getURL('popup.html')+'?mode=popout',chrome.runtime.getURL('popup.html')+'?mode=sidepanel',chrome.runtime.getURL('center-bind.html')].includes(sender.url);
    if(!ownUi&&!ownPage){sendResponse({ok:false,error:'CENTER_PRIVILEGED_UI_REQUIRED'});return;}
    const supplied=Object.prototype.hasOwnProperty.call(request,'centerExpectedBinding');
    const expected=supplied?request.centerExpectedBinding:bindingApi?.snapshot();
    if(!expected){sendResponse({ok:false,error:'CENTER_BINDING_REQUIRED'});return;}
    if(supplied&&(!expected||typeof expected!=='object'||Array.isArray(expected)||Object.keys(expected).sort().join(',')!=='accountId,documentId,epoch,tabId,url,windowId'||!bindingApi?.isCurrent(expected))){sendResponse({ok:false,error:'CENTER_BINDING_CHANGED'});return;}
    queueMode(request.paused,{tabId:expected.tabId,assertCurrent:()=>bindingApi.guard(expected.tabId,async()=>{},expected)})
     .then(sendResponse,()=>sendResponse({ok:false,paused:true,issues:['MASTER_TARGET_UNCONFIRMED']}));return true;
  });
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local'&&changes.helperMode&&changes.helperMode.newValue===false&&bindingApi?.snapshot())reconcileBinding(bindingApi.snapshot());
  });
  const tokenCurrent=token=>!!token&&gate.valid(token.gateToken)&&bindingApi?.isCurrent(token.binding);
  globalThis.Cor3Automation={
    ready,allowed:()=>gate.allowed()&&!!bindingApi?.snapshot(),
    async begin(){const binding=bindingApi?.snapshot();await ready;if(!binding||!bindingApi.isCurrent(binding))return null;const tab=await bindingApi?.resolve();if(!gate.allowed()||!tab||!bindingApi.isCurrent(binding))return null;try{const document=await topDocument(binding);return gate.allowed()&&bindingApi.isCurrent(binding)?Object.freeze({gateToken:gate.token(),binding,document}):null}catch{return null}},
    valid:tokenCurrent,
    onStop(fn){hooks.add(fn);if(gate.snapshot().ready&&!gate.allowed())runHook(fn)},
    async alarm(token,name,options){
      if(!tokenCurrent(token))return false;
      try{await bindingApi.guard(token.binding.tabId,()=>chrome.alarms.create(name,options),token.binding)}catch{await chrome.alarms.clear(name);return false}
      if(!tokenCurrent(token)){await chrome.alarms.clear(name);return false}return true;
    },
    async send(token,tabId,message){
      if(!tokenCurrent(token)||tabId!==token.binding.tabId)throw Error('Automation paused or target revoked.');
      return bindingApi.guard(tabId,async()=>{
       const state=await timeout(chrome.tabs.sendMessage(tabId,{action:'cor3MasterProbe',expectedContentDocumentId:token.document.contentDocumentId},documentOptions(token.document)),2000);
       if(!state?.allowed||!tokenCurrent(token))throw Error('Game page is paused or target revoked.');
       return bindingApi.guard(tabId,()=>chrome.tabs.sendMessage(tabId,{...message,centerExpectedDocumentId:token.document.contentDocumentId},documentOptions(token.document)),token.binding);
      },token.binding);
    }
  };
})();










