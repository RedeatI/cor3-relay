(() => {
  function cor3AutomationAllowed() { return !!globalThis.Cor3Automation && Cor3Automation.allowed(); }
  function networkScope() { const id=globalThis.Cor3CenterIdentity?.snapshot(); return id ? {accountId:id.accountId,documentId:id.documentId}:null; }
  let dailySession = null;
  function dailyReadOptions(token) {
    return {headers:{Authorization:token}, signal:AbortSignal.timeout(15000)};
  }
  const dailyRetryClock = () => globalThis.performance?.now() ?? Date.now();
  function currentDailySession(session) {
    const scope = networkScope();
    return !!session && session === dailySession && cor3AutomationAllowed() && !!scope &&
      session.accountId === scope.accountId && session.documentId === scope.documentId;
  }
  function withDailyToken(callback) {
    const session = dailySession;
    const valid = () => currentDailySession(session) && session.ready;
    if (!valid()) { callback(null,valid); return; }
    Cor3CenterStore.get("sessionAuthDocumentId", result =>
      callback(valid() && result.sessionAuthDocumentId === session.documentId ? session.token : null, valid));
  }
  async function receiveDailySession(identity, token) {
    let session = dailySession;
    if (!currentDailySession(session) || session.token !== token) {
      session = {accountId:identity.accountId, documentId:identity.documentId, token, ready:false, pending:false, loaded:false, retryAfter:0};
      dailySession = session;
    }
    if (session.pending || session.loaded || dailyRetryClock() < session.retryAfter) return;
    session.pending = true;
    try {
      if (!session.ready) {
        await Cor3CenterStore.get("sessionAuthDocumentId");
        if (!currentDailySession(session)) return;
        await Cor3CenterStore.remove("bearerToken");
        if (!currentDailySession(session)) return;
        await Cor3CenterStore.set({sessionAuthDocumentId:identity.documentId, sessionAuthReadyAt:Date.now()});
        if (!currentDailySession(session)) return;
        session.ready = true;
        postDailyHackDiag("session.ready", "Current page session synchronized");
      }
      const response = await fetch("https://svc-corie.cor3.gg/api/user-daily-claim", dailyReadOptions(token));
      if (!response.ok) throw Error("DAILY_STATE_HTTP_" + response.status);
      const data = await response.json();
      if (!currentDailySession(session)) return;
      if (typeof data?.hasClaimedToday !== "boolean") throw Error("DAILY_STATE_INVALID");
      await Cor3CenterStore.set({dailyOpsData:data, dailyOpsUpdatedAt:Date.now(), dailyOpsError:null});
      session.loaded = true;
    } catch {
      if (currentDailySession(session)) {
        session.retryAfter = dailyRetryClock() + 60000;
        postDailyHackDiag("session.retry", "Session handoff or daily state read did not complete", null, "warn");
      }
    } finally { session.pending = false; }
  }
  const runtimeLog=globalThis.Cor3RunLog?.create({scope:networkScope,sink:payload=>Cor3CenterStore.set({automationRunLogs:payload})});
  globalThis.Cor3RuntimeLog=runtimeLog;
  function timedActivityRunning(){
    const names=['IceWallBreakApplication','ConfigHackApplication','SimpleDecryptApplication','SimpleDecryptionApplication'];
    const selector=[...names.flatMap(n=>['[data-component-name="'+n+'"]','[data-sentry-component="'+n+'"]']),'[data-component-name*="SimpleHack"]','[data-sentry-component*="SimpleHack"]','iframe[src*="/games/"]'].join(',');
    return Array.from(document.querySelectorAll(selector)).some(el=>{const style=getComputedStyle(el);return el.getClientRects().length&&style.visibility!=="hidden"&&style.visibility!=="collapse"&&style.display!=="none";});
  }
  let networkCoordinator,jobBatchReceipt=null;const networkObservers=new Set();
  function network() {
    if(!networkCoordinator)networkCoordinator=Cor3NetworkCoordinator.create({scope:networkScope,allowed:cor3AutomationAllowed,
      blocked:()=>timedActivityRunning(),
      log:(...args)=>runtimeLog?.log(...args),onChange:status=>{
        _automationActive=status.running;_automationQueue=status.waiting;
        if(cor3AutomationAllowed())Cor3CenterStore.set({automationQueueStatus:status,networkRuntimeStatus:status}).catch(()=>{});
        _postAutomationStatus(status);
        for(const fn of networkObservers)try{fn(status);}catch{}
      }});
    return networkCoordinator;
  }
  globalThis.Cor3PageBusy=()=>timedActivityRunning();
  globalThis.Cor3RequestBootstrap=()=>queueMarketRefresh({type:'COR3_INITIAL_FETCH_RUN'},'initial-fetch');
  globalThis.Cor3NetworkRuntime=Object.freeze({snapshot:()=>network().snapshot(),recheckMarkets:()=>checkMarketRefreshClock(),batchReceipt:()=>jobBatchReceipt?structuredClone(jobBatchReceipt):null,subscribe:fn=>{networkObservers.add(fn);return()=>networkObservers.delete(fn);}});
  setInterval(()=>{if(cor3AutomationAllowed())network().pump();},1000);
  const expeditionRules = globalThis.Cor3ExpeditionPriority;
  const expeditionLog = code => globalThis.Cor3ExpeditionDiagnostics?.log(code);
  // Balance observed on this page. Do not use another session's cached balance to authorize dispatch.
  let observedCredits;
  function reconsiderAfterCreditIncrease() {
    if (autoSendInProgress || !cor3AutomationAllowed()) return;
    Cor3CenterStore.get(["autoSendMerc", "expeditionsData"], data => {
      if (data.autoSendMerc?.enabled && data.autoSendMerc.pauseBelowCredits === true) checkAutoSendOnExpeditionData(data.expeditionsData);
    });
  }
  function creditFloorBlocks(rules) {
    if (!expeditionRules.shouldPauseForCredits(rules, observedCredits)) return false;
    expeditionLog(Number.isFinite(observedCredits) ? "credit-floor" : "credit-unknown");
    return true;
  }
  const lifecycleScheduler = globalThis.Cor3ObservableScheduler;
  const solverPreferenceRevision = {decrypt:0,ice:0,simple:0};
  function dailyEpoch() { return lifecycleScheduler.capture('daily'); }
  function dailyValid(epoch) { return lifecycleScheduler.valid('daily', epoch); }
  function dailyLater(fn, ms) { const epoch = dailyEpoch(); return setTimeout(() => { if (dailyValid(epoch)) fn(); }, ms); }
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/content/auto-send.js
  var auto_send_exports = {};
  __export(auto_send_exports, {
    MAX_MERC_RETRIES: () => MAX_MERC_RETRIES,
    _autoSendMercRetryCount: () => _autoSendMercRetryCount,
    _autoSendUsolSkipped: () => _autoSendUsolSkipped,
    _initialFetchDone: () => _initialFetchDone,
    autoSendAwaitingMercenaries: () => autoSendAwaitingMercenaries,
    autoSendAwaitingUsolMercs: () => autoSendAwaitingUsolMercs,
    autoSendDeferredWaiting: () => autoSendDeferredWaiting,
    autoSendExpeditionBlocked: () => autoSendExpeditionBlocked,
    autoSendExpeditionId: () => autoSendExpeditionId,
    autoSendInProgress: () => autoSendInProgress,
    checkAutoSendOnExpeditionData: () => checkAutoSendOnExpeditionData,
    initialMercsReady: () => initialMercsReady,
    isTransientBusyMessage: () => isTransientBusyMessage,
    onExpeditionCollected: () => onExpeditionCollected,
    proceedWithMerc: () => proceedWithMerc,
    setAutoSendAwaitingMercenaries: () => setAutoSendAwaitingMercenaries,
    setAutoSendAwaitingUsolMercs: () => setAutoSendAwaitingUsolMercs,
    setAutoSendDeferredWaiting: () => setAutoSendDeferredWaiting,
    setAutoSendExpeditionBlocked: () => setAutoSendExpeditionBlocked,
    setAutoSendExpeditionId: () => setAutoSendExpeditionId,
    setAutoSendInProgress: () => setAutoSendInProgress,
    setAutoSendMercRetryCount: () => setAutoSendMercRetryCount,
    setAutoSendUsolSkipped: () => setAutoSendUsolSkipped,
    setInitialFetchDone: () => setInitialFetchDone,
    setInitialMercsReady: () => setInitialMercsReady
  });
  function isTransientBusyMessage(msg) {
    const m = String(msg || "").toLowerCase();
    const keys = [
      "already",
      "in progress",
      "in-progress",
      "processing",
      "busy",
      "operation",
      "pending",
      "cooldown",
      "\u6B63\u5728",
      "\u5DF2\u5728",
      "\u64CD\u4F5C\u4E2D",
      "\u8FDB\u884C\u4E2D",
      "\u5904\u7406\u4E2D",
      "\u51B7\u5374"
    ];
    return keys.some((k) => m.indexOf(k) !== -1);
  }
  function onExpeditionCollected(collectedId) {
    if (!cor3AutomationAllowed()) return;
    if (!autoSendInProgress) return;
    if (collectedId) {
      if (autoSendExpeditionId && collectedId !== autoSendExpeditionId) return;
      if (_collectedExpeditionIds.has(collectedId)) return;
      _collectedExpeditionIds.add(collectedId);
      if (_collectedExpeditionIds.size > 100) {
        const first = _collectedExpeditionIds.values().next().value;
        _collectedExpeditionIds.delete(first);
      }
      Cor3CenterStore.get("expeditionsData", (result) => {
        const exps = result.expeditionsData || [];
        const filtered = exps.filter((e) => e.id !== collectedId);
        Cor3CenterStore.set({ expeditionsData: filtered, expeditionsDataUpdatedAt: Date.now() });
      });
    }
    setAutoSendExpeditionId(null);
    Cor3CenterStore.get("autoSendMerc", (settings) => {
      const merc = settings.autoSendMerc || {};
      if (!merc.enabled || creditFloorBlocks(merc)) {
        console.log("[COR3 Helper] Auto-send: rewards collected, auto-dispatch is off \u2014 stopping");
        autoSendInProgress = false;
        _automationFinish("auto-send");
        setTimeout(() => {
          window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
        }, 500);
        return;
      }
      console.log("[COR3 Helper] Auto-send: rewards collected \u2014 refreshing mercenaries (CORE + USOL)...");
      setTimeout(() => {
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
      }, 500);
      const mercDelay = 2500 + Math.floor(Math.random() * 1e3);
      setTimeout(() => {
        if (!autoSendInProgress || getAutomationActive() && getAutomationActive().type !== "auto-send") {
          console.log("[COR3 Helper] Auto-send: merc refresh skipped (no longer active or another automation took over)");
          return;
        }
        window.postMessage({ type: "COR3_REQUEST_MERCENARIES" }, "*");
      }, mercDelay);
      setAutoSendAwaitingMercenaries(false);
      setAutoSendAwaitingUsolMercs(true);
    });
  }
  function setInitialFetchDone(v) {
    _initialFetchDone = v;
  }
  function setAutoSendInProgress(v) {
    autoSendInProgress = v;
  }
  function setAutoSendExpeditionId(v) {
    autoSendExpeditionId = v;
  }
  function setAutoSendAwaitingMercenaries(v) {
    autoSendAwaitingMercenaries = v;
  }
  function setAutoSendAwaitingUsolMercs(v) {
    autoSendAwaitingUsolMercs = v;
  }
  function setInitialMercsReady(v) {
    initialMercsReady = v;
  }
  function setAutoSendDeferredWaiting(v) {
    autoSendDeferredWaiting = v;
  }
  function setAutoSendExpeditionBlocked(v) {
    autoSendExpeditionBlocked = v;
  }
  function setAutoSendUsolSkipped(v) {
    _autoSendUsolSkipped = v;
  }
  function setAutoSendMercRetryCount(v) {
    _autoSendMercRetryCount = v;
  }
  function checkAutoSendOnExpeditionData(expeditions) {
    if(!cor3AutomationAllowed()||!Array.isArray(expeditions)||autoSendInProgress)return;
    _automationEnqueue("auto-send",task=>{
      Cor3CenterStore.get(["autoSendMerc","expeditionsData"],data=>{
        if(!task.valid())return;
        if(!data.autoSendMerc?.enabled||!Array.isArray(data.expeditionsData)){task.finish();return;}
        checkAutoSendExclusive(data.expeditionsData,task);
      });
    });
  }
  function checkAutoSendExclusive(expeditions,task) {
    if (!cor3AutomationAllowed()) return;
    if (!expeditions || !Array.isArray(expeditions) || autoSendInProgress) { _automationFinish("auto-send",task.id);return; }
    if (!_initialFetchDone) {
      console.log("[COR3 Helper] Auto-send: deferred \u2014 initial data fetch still in progress");
      _automationFinish("auto-send",task.id);return;
    }
    if (autoSendExpeditionBlocked) {
      var hasActive = expeditions.some((e) => e.status !== "COMPLETED" && e.status !== "FAILED");
      if (hasActive) {
        console.log("[COR3 Helper] Auto-send: still blocked \u2014 active expedition in progress");
        _automationFinish("auto-send",task.id);return;
      }
      console.log("[COR3 Helper] Auto-send: active expedition finished \u2014 unblocking");
      autoSendExpeditionBlocked = false;
      Cor3CenterStore.remove("autoSendExpeditionBlocked");
    }
    Cor3CenterStore.get("autoSendMerc", (settings) => {
      if(!task.valid())return;
      try {
      const merc = settings.autoSendMerc || {};
      if (!cor3AutomationAllowed() || !merc.enabled) return;
      const hasActiveExpeditions = expeditions.length > 0;
      if (!hasActiveExpeditions) {
        if (creditFloorBlocks(merc)) return;
        if (!initialMercsReady) {
          let onInitialMercsDone = function(evt) {
            if (evt.data && evt.data.type === "COR3_USOL_MERCS_DONE") {
              window.removeEventListener("message", onInitialMercsDone);
              clearTimeout(deferTimeout);
              autoSendDeferredWaiting = false;
              console.log("[COR3 Helper] Auto-send: Initial mercs now ready \u2014 re-checking expeditions");
              initialMercsReady = true;
              Cor3CenterStore.get("expeditionsData", (result) => {
                if (result.expeditionsData) {
                  checkAutoSendOnExpeditionData(result.expeditionsData);
                }
              });
            }
          };
          if (autoSendDeferredWaiting) {
            console.log("[COR3 Helper] Auto-send: Already waiting for initial mercs \u2014 skipping duplicate deferral");
            return;
          }
          autoSendDeferredWaiting = true;
          console.log("[COR3 Helper] Auto-send: No active expeditions but initial mercs not ready \u2014 deferring");
          window.addEventListener("message", onInitialMercsDone);
          var deferTimeout = setTimeout(() => {
            window.removeEventListener("message", onInitialMercsDone);
            autoSendDeferredWaiting = false;
            initialMercsReady = true;
            console.log("[COR3 Helper] Auto-send: Deferred merc wait timed out \u2014 proceeding");
            Cor3CenterStore.get("expeditionsData", (result) => {
              if (result.expeditionsData) {
                checkAutoSendOnExpeditionData(result.expeditionsData);
              }
            });
          }, 6e4);
          return;
        }
        console.log("[COR3 Helper] Auto-send: No active expeditions, refreshing mercs (CORE + USOL) before launch");
        autoSendInProgress = true;
        if (!getAutomationActive()) setAutomationActive({ type: "auto-send", startedAt: Date.now() });
        _broadcastQueueStatus();
        autoSendExpeditionId = null;
        autoSendAwaitingMercenaries = false;
        autoSendAwaitingUsolMercs = true;
        var mercDelay = 2500 + Math.floor(Math.random() * 1e3);
        setTimeout(() => {
          if (!autoSendInProgress || getAutomationActive() && getAutomationActive().type !== "auto-send") {
            console.log("[COR3 Helper] Auto-send: merc refresh skipped (no longer active or another automation took over)");
            return;
          }
          window.postMessage({ type: "COR3_REQUEST_MERCENARIES" }, "*");
        }, mercDelay);
        return;
      }
      if (merc.autoClaim === false) return;
      for (const exp of expeditions) {
        if (exp.status !== "COMPLETED") continue;
        if (_collectedExpeditionIds.has(exp.id)) continue;
        autoSendInProgress = true;
        if (!getAutomationActive()) setAutomationActive({ type: "auto-send", startedAt: Date.now() });
        _broadcastQueueStatus();
        autoSendExpeditionId = exp.id;
        expeditionLog("mercenary-claim");
        if (!exp.containerOpenedAt) {
          console.log("[COR3 Helper] Auto-send: Detected COMPLETED expedition:", exp.id, "- opening container in 10s");
          setTimeout(async () => {
            const { autoSendMerc } = await Cor3CenterStore.get("autoSendMerc").catch(() => ({}));
            if (!cor3AutomationAllowed() || autoSendExpeditionId !== exp.id) return;
            if (!autoSendMerc?.enabled || autoSendMerc.autoClaim === false) {
              setAutoSendInProgress(false);
              setAutoSendExpeditionId(null);
              _automationFinish("auto-send",task.id);
              return;
            }
            window.postMessage({ type: "COR3_OPEN_CONTAINER", expeditionId: exp.id }, "*");
          }, 1e4 + Math.floor(Math.random() * 500));
        } else {
          console.log("[COR3 Helper] Auto-send: expedition", exp.id, "already paid \u2014 claiming mailbox rewards");
          window.postMessage({ type: "COR3_CHECK_MAIL", source: "EXPEDITION", sourceId: exp.id }, "*");
        }
        return;
      }
      } finally { if(!autoSendInProgress)_automationFinish("auto-send",task.id); }
    });
  }
  function proceedWithMerc(mercId, allMercs, settings, localData) {
    if (!cor3AutomationAllowed()) return;
    if (!settings.autoSendMerc?.enabled || creditFloorBlocks(settings.autoSendMerc)) {
      console.log("[COR3 Helper] Auto-send: dispatch disabled before launch, aborting");
      autoSendInProgress = false;
      _automationFinish("auto-send");
      return;
    }
    if (!mercId) {
      console.log("[COR3 Helper] Auto-send: no mercenary selected, aborting");
      Cor3CenterStore.set({ mercWarning: "Auto expedition paused: automatic mercenary selection returned no mercenary." });
      autoSendInProgress = false;
      _automationFinish("auto-send");
      return;
    }
    const selectedMerc = allMercs.find((m) => m.id === mercId);
    if (!selectedMerc || selectedMerc.status !== "AVAILABLE") {
      console.log("[COR3 Helper] Auto-send: selected mercenary not AVAILABLE (status: " + (selectedMerc ? selectedMerc.status : "not found") + "), aborting");
      Cor3CenterStore.set({ mercWarning: "Auto expedition paused: selected mercenary is no longer available (status: " + (selectedMerc ? selectedMerc.status : "not found") + ")." });
      autoSendInProgress = false;
      _automationFinish("auto-send");
      return;
    }
    const isUsol = selectedMerc._market === "usol" || selectedMerc.faction && selectedMerc.faction.key === "usol_employment";
    const configKey = isUsol ? "usolExpeditionConfigData" : "expeditionConfigData";
    const marketId = isUsol ? "019e4065-6ae8-760d-8724-58ab4f2cf7d7" : "019d3ea4-85bd-7389-904d-8f7c85841134";
    const config = localData[configKey];
    if (!config || !config.locations || config.locations.length === 0) {
      console.log("[COR3 Helper] Auto-send: no expedition config available for " + (isUsol ? "USOL" : "CORE") + ", aborting");
      Cor3CenterStore.set({ mercWarning: "Auto expedition paused: no expedition config available for " + (isUsol ? "USOL" : "CORE") + "." });
      autoSendInProgress = false;
      _automationFinish("auto-send");
      return;
    }
    const DEFAULT_LOCATION_NAMES = ["Skylift Remains", "Koute Mining and Reprocessing Outpost"];
    const loc = expeditionRules.selectExpeditionLocation(config, settings.autoSendMerc, DEFAULT_LOCATION_NAMES);
    const zone = loc?.zones?.[0];
    const goal = zone && zone.goals && zone.goals[0] ? zone.goals[0] : null;
    if (!zone || !goal) {
      console.log("[COR3 Helper] Auto-send: missing zone/goal config, aborting");
      Cor3CenterStore.set({ mercWarning: "Auto expedition paused: the selected expedition location is missing zone/goal config." });
      autoSendInProgress = false;
      _automationFinish("auto-send");
      return;
    }
    const launchConfig = {
      mercenaryId: mercId,
      marketId,
      locationConfigId: loc.id,
      zoneConfigId: zone.id,
      goalId: goal.id,
      hasInsurance: !!settings.autoSendMerc.hasInsurance,
      ...(settings.autoSendMerc.applyMercCostLimiter?{maxTotalCost:Number(settings.autoSendMerc.maxMercCost)}:{})
    };
    console.log("[COR3 Helper] Auto-send: launching expedition with mercenary:", selectedMerc.callsign, "(" + (isUsol ? "USOL" : "CORE") + ")");
    setTimeout(async () => {
      if (!cor3AutomationAllowed() || !autoSendInProgress) return;
      const { autoSendMerc } = await Cor3CenterStore.get("autoSendMerc").catch(() => ({}));
      if (!cor3AutomationAllowed() || !autoSendInProgress) return;
      if (!autoSendMerc?.enabled || JSON.stringify(autoSendMerc) !== JSON.stringify(settings.autoSendMerc) || creditFloorBlocks(autoSendMerc)) {
        setAutoSendInProgress(false);
        _automationFinish("auto-send");
        return;
      }
      expeditionLog("mercenary-dispatch");
      Cor3CenterStore.set({ lastExpeditionLaunchData: launchConfig });
      window.postMessage({ type: "COR3_LAUNCH_EXPEDITION", config: launchConfig }, "*");
      autoSendExpeditionBlocked = true;
      Cor3CenterStore.set({ autoSendExpeditionBlocked: true });
      autoSendInProgress = true;
    }, 1500 + Math.floor(Math.random() * 500));
  }
  var _initialFetchDone, autoSendInProgress, autoSendExpeditionId, autoSendAwaitingMercenaries, autoSendAwaitingUsolMercs, initialMercsReady, autoSendDeferredWaiting, autoSendExpeditionBlocked, _autoSendUsolSkipped, _autoSendMercRetryCount, MAX_MERC_RETRIES, _collectedExpeditionIds;
  var init_auto_send = __esm({
    "src/content/auto-send.js"() {
      init_helpers();
      _initialFetchDone = true;
      autoSendInProgress = false;
      autoSendExpeditionId = null;
      autoSendAwaitingMercenaries = false;
      autoSendAwaitingUsolMercs = false;
      initialMercsReady = false;
      autoSendDeferredWaiting = false;
      autoSendExpeditionBlocked = false;
      _autoSendUsolSkipped = false;
      _autoSendMercRetryCount = 0;
      MAX_MERC_RETRIES = 3;
      _collectedExpeditionIds = /* @__PURE__ */ new Set();
    }
  });

  // src/content/helpers.js
  var helpers_exports = {};
  __export(helpers_exports, {
    _automationEnqueue: () => _automationEnqueue,
    _automationFinish: () => _automationFinish,
    _automationProcessNext: () => _automationProcessNext,
    _automationQueueStatus: () => _automationQueueStatus,
    _broadcastQueueStatus: () => _broadcastQueueStatus,
    getAutomationActive: () => getAutomationActive,
    getAutomationQueue: () => getAutomationQueue,
    isContextValid: () => isContextValid,
    setAutomationActive: () => setAutomationActive,
    setAutomationQueue: () => setAutomationQueue
  });
  function isContextValid() {
    try {
      return !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }
  function _automationQueueStatus() { return network().snapshot(); }
  function getAutomationActive() { return network().current(); }
  function setAutomationActive(v) { _automationActive=v; }
  function getAutomationQueue() { return network().snapshot().waiting; }
  function setAutomationQueue(v) { network().keepWaiting(v.map(x=>x.type)); }
  function _postAutomationStatus(status) { try { window.postMessage({type:"COR3_AUTOMATION_STATUS",status},"*"); } catch {} }
  function _broadcastQueueStatus() { const status=network().snapshot(); if(cor3AutomationAllowed())Cor3CenterStore.set({automationQueueStatus:status,networkRuntimeStatus:status}).catch(()=>{});_postAutomationStatus(status); }
  function _automationFinish(type,ticket) { const current=network().current();return network().finish(type,ticket??current?.id); }
  function _automationProcessNext() { network().pump(); }
  function _automationEnqueue(type,runFn) { return network().enqueue(type,runFn); }
  var _automationQueue, _automationActive;
  var init_helpers = __esm({
    "src/content/helpers.js"() {
      _automationQueue = [];
      _automationActive = null;
      _postAutomationStatus(_automationQueueStatus());
    }
  });

  function queueMarketRefresh(message,owner="manual-market:"+message.type,onDone,onStart) {
    return _automationEnqueue(owner,task=>{
      _marketRefreshInProgress=true;
      onStart?.(task);
      const done=event=>{
        if(event.source!==window||event.origin!==location.origin||event.data?.type!=="COR3_NETWORK_DONE"||event.data.networkTicket!==task.id)return;
        window.removeEventListener("message",done);
        if(!task.valid())return;
        _marketRefreshInProgress=false;setSeqRefreshRunning(false);onDone?.(task);task.finish();
      };
      window.addEventListener("message",done);
      window.postMessage({...message,networkTicket:task.id},location.origin);
    });
  }
  // src/content/auto-update-markets.js
  var auto_update_markets_exports = {};
  __export(auto_update_markets_exports, {
    _autoJobsActive: () => _autoJobsActive,
    _autoUpdateMarkets: () => _autoUpdateMarkets,
    _autoUpdateMarketsLastRefresh: () => _autoUpdateMarketsLastRefresh,
    _initAutoUpdateMarketsTimer: () => _initAutoUpdateMarketsTimer,
    _marketRefreshInProgress: () => _marketRefreshInProgress,
    _seqRefreshRunning: () => _seqRefreshRunning,
    setAutoJobsActive: () => setAutoJobsActive,
    setAutoUpdateMarkets: () => setAutoUpdateMarkets,
    setAutoUpdateMarketsLastRefresh: () => setAutoUpdateMarketsLastRefresh,
    setMarketRefreshInProgress: () => setMarketRefreshInProgress,
    setSeqRefreshRunning: () => setSeqRefreshRunning
  });
  function setMarketRefreshInProgress(v) {
    _marketRefreshInProgress = v;
  }
  function setAutoUpdateMarketsLastRefresh(v) {
    _autoUpdateMarketsLastRefresh = v;
  }
  function setSeqRefreshRunning(v) {
    _seqRefreshRunning = v;
  }
  function setAutoJobsActive(v) {
    _autoJobsActive = v;
  }
  function setAutoUpdateMarkets(v) {
    _autoUpdateMarkets = v;
  }
  let marketRefreshClock=null;
  function checkMarketRefreshClock(){
    if(!_autoUpdateMarkets||_autoJobsActive||!cor3AutomationAllowed()||!isContextValid())return;
    if(!marketRefreshClock)marketRefreshClock=Cor3MarketClockFactory.create({
      read:keys=>Cor3CenterStore.get(keys),scope:networkScope,allowed:cor3AutomationAllowed,
      write:async(state,scope)=>{const current=networkScope();if(current?.accountId!==scope.accountId||current?.documentId!==scope.documentId||!cor3AutomationAllowed())return;await Cor3CenterStore.set({marketRefreshClockV1:state});},
      busy:()=>{const q=network().snapshot();return !_initialFetchDone||_marketRefreshInProgress||_seqRefreshRunning||_autoJobsActive||globalThis.Cor3PageBusy()||!!q.active||!!q.blocked||q.queued?.length>0;},
      enqueue:({markets})=>queueMarketRefresh({type:'COR3_REFRESH_ALL_MARKETS_SEQ',order:markets},'auto-update-markets'),
      log:(...args)=>runtimeLog?.log(...args)
    });
    return marketRefreshClock.tick();
  }
  function _initAutoUpdateMarketsTimer(){void checkMarketRefreshClock();}
  for(const event of ['pageshow','focus'])window.addEventListener(event,()=>void checkMarketRefreshClock());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void checkMarketRefreshClock();});
  var _autoUpdateMarkets, _marketRefreshInProgress, _autoUpdateMarketsLastRefresh, _seqRefreshRunning, _autoJobsActive, _AUTO_UPDATE_MARKETS_INTERVAL;
  var init_auto_update_markets = __esm({
    "src/content/auto-update-markets.js"() {
      init_helpers();
      _autoUpdateMarkets = false;
      _marketRefreshInProgress = false;
      _autoUpdateMarketsLastRefresh = 0;
      _seqRefreshRunning = false;
      _autoJobsActive = false;
      _AUTO_UPDATE_MARKETS_INTERVAL = 10 * 60 * 1e3;
      try {
        Cor3CenterStore.get("autoUpdateMarkets", (data) => {
          if (data.autoUpdateMarkets !== void 0) _autoUpdateMarkets = data.autoUpdateMarkets;
          if (_autoUpdateMarkets) _initAutoUpdateMarketsTimer();
        });
      } catch (e) {
      }
      setInterval(() => {void checkMarketRefreshClock();}, 3e4);
    }
  });

  // src/content/index.js
  init_helpers();
  init_auto_update_markets();

  // src/shared/decision-policy.js
  function optionLoot(opt) {
    if (!opt) return 0;
    const v = opt.lootModifier !== void 0 ? opt.lootModifier : opt.effect ? opt.effect.lootDelta : 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function optionRisk(opt) {
    if (!opt) return 0;
    const v = opt.riskModifier !== void 0 ? opt.riskModifier : opt.effect ? opt.effect.riskDelta : 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function scoreOption(opt, overrides) {
    if (!opt) return -Infinity;
    const cfg = overrides || {};
    const lw = Number.isFinite(Number(cfg.lootWeight)) ? Number(cfg.lootWeight) : 1;
    const rw = Number.isFinite(Number(cfg.riskWeight)) ? Number(cfg.riskWeight) : -5;
    const rs = Number.isFinite(Number(cfg.expeditionRiskScore)) ? Number(cfg.expeditionRiskScore) : 0;
    const loot = optionLoot(opt);
    const risk = optionRisk(opt);
    const factor = (rs + Math.abs(risk)) / 10 || 1;
    return Math.round(loot * lw + risk * rw * factor);
  }
  function pickBestOption(options, aggressive, overrides) {
    if (!Array.isArray(options) || options.length === 0) return null;
    if (overrides && overrides.enabled) {
      let weightedBest = null;
      let weightedScore = -Infinity;
      for (const opt of options) {
        if (!opt) continue;
        const score = scoreOption(opt, overrides);
        if (score > weightedScore) {
          weightedScore = score;
          weightedBest = opt;
        }
      }
      return weightedBest;
    }
    let best = null;
    let bestLoot = 0;
    let bestRisk = 0;
    for (const opt of options) {
      if (!opt) continue;
      const loot = optionLoot(opt);
      const risk = optionRisk(opt);
      if (!best) {
        best = opt;
        bestLoot = loot;
        bestRisk = risk;
        continue;
      }
      let better = false;
      if (aggressive) {
        if (loot !== bestLoot) better = loot > bestLoot;
        else if (risk !== bestRisk) better = risk < bestRisk;
      } else {
        if (risk !== bestRisk) better = risk < bestRisk;
        else if (loot !== bestLoot) better = loot > bestLoot;
      }
      if (better) {
        best = opt;
        bestLoot = loot;
        bestRisk = risk;
      }
    }
    return best;
  }

  // src/content/auto-choose.js
  var contentAutoChosenDecisions = /* @__PURE__ */ new Set();
  function checkAutoChooseFromContent(decisions) {
    if (!cor3AutomationAllowed()) return;
    if (!decisions || decisions.length === 0) return;
    Cor3CenterStore.get(["autoSendMerc", "expeditionsData"], (result) => {
      const merc = result.autoSendMerc || {};
      if (!cor3AutomationAllowed() || !merc.enabled || merc.autoDecide === false) return;
      for (const d of decisions) {
        if (!d || d.isResolved || !Array.isArray(d.decisionOptions)) continue;
        if (contentAutoChosenDecisions.has(d.messageId)) continue;
        if (d.decisionDeadline && new Date(d.decisionDeadline).getTime() <= Date.now()) continue;
        const expedition = (result.expeditionsData || []).find(exp => exp?.id === d.expeditionId);
        const veteran = String(expedition?.mercenary?.rank || "").toUpperCase() === "VETERAN";
        const best = pickBestOption(d.decisionOptions, true, expeditionRules.resolveDecisionOverrides(merc, d.riskScore || 0, veteran));
        if (!best) continue;
        contentAutoChosenDecisions.add(d.messageId);
        expeditionLog("mercenary-decision");
        console.log("[COR3 Helper] Auto-resolve decision:", best.label, "(aggressive)");
        window.postMessage({
          type: "COR3_RESPOND_DECISION",
          expeditionId: d.expeditionId,
          messageId: d.messageId,
          selectedOption: best.id
        }, "*");
      }
    });
  }

  // src/content/index.js
  init_auto_send();

  // src/content/mail.js
  init_helpers();
  var CLAIM_TIMEOUT_MS = 15e3;
  var CLAIM_GAP_MS = 650;
  var MAX_CLAIM_RETRIES = 3;
  var WATCH_ASSUME_DONE_MS = 2e4;
  var _mailData = null;
  var _mailUpdatedAt = 0;
  var _active = null;
  var _queue = [];
  var _queuedIds = /* @__PURE__ */ new Set();
  var _claimedIds = /* @__PURE__ */ new Set();
  var _seenSources = /* @__PURE__ */ new Set();
  var _sourceById = /* @__PURE__ */ new Map();
  var _watched = /* @__PURE__ */ new Map();
  var _forcedSources = /* @__PURE__ */ new Set();
  var _sorting = false;
  var _fallbackActive = false;
  var _itemClaimResolver = null;
  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[COR3 Helper] Mail:");
    console.log.apply(console, args);
  }
  function messageAttachments(m) {
    return m && Array.isArray(m.attachments) ? m.attachments : [];
  }
  function messageSourceInfo(m) {
    var atts = messageAttachments(m);
    for (var i = 0; i < atts.length; i++) {
      var a = atts[i];
      if (a && (a.source === "EXPEDITION" || a.source === "DRONE_MISSION")) {
        return { source: a.source, sourceId: a.sourceId || null };
      }
    }
    return null;
  }
  function messageCells(m) {
    var total = 0;
    var atts = messageAttachments(m);
    for (var i = 0; i < atts.length; i++) {
      var a = atts[i] || {};
      var w = a.width || 1;
      var h = a.height || 1;
      total += w * h;
    }
    return Math.max(1, total);
  }
  function buildOccupancy(stash) {
    var gw = Number(stash.gridWidth) || 12;
    var gh = Number(stash.usableRows) || 60;
    var grid = [];
    for (var y = 0; y < gh; y++) {
      var row = [];
      for (var x = 0; x < gw; x++) row.push(false);
      grid.push(row);
    }
    var items = Array.isArray(stash.items) ? stash.items : [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || it.location && it.location !== "stash") continue;
      var iw = Number(it.width) || 1;
      var ih = Number(it.height) || 1;
      var ix = Number(it.x) || 0;
      var iy = Number(it.y) || 0;
      for (var yy = iy; yy < iy + ih; yy++) {
        for (var xx = ix; xx < ix + iw; xx++) {
          if (grid[yy] && grid[yy][xx] !== void 0) grid[yy][xx] = true;
        }
      }
    }
    return { grid, gw, gh };
  }
  function findFreePlacement(grid, gw, gh, w, h, canRotate) {
    function scan(width, height, rotated) {
      for (var y = 0; y <= gh - height; y++) {
        for (var x = 0; x <= gw - width; x++) {
          var free = true;
          for (var yy = y; yy < y + height && free; yy++) {
            for (var xx = x; xx < x + width; xx++) {
              if (grid[yy][xx]) {
                free = false;
                break;
              }
            }
          }
          if (free) return { x, y, rotated };
        }
      }
      return null;
    }
    var p = scan(w, h, false);
    if (p) return p;
    if (canRotate && w !== h) return scan(h, w, true);
    return null;
  }
  function planAttachmentPlacements(msg, stash) {
    var occ = buildOccupancy(stash);
    var placements = [];
    var atts = messageAttachments(msg);
    for (var i = 0; i < atts.length; i++) {
      var a = atts[i] || {};
      var w = Number(a.width) || 1;
      var h = Number(a.height) || 1;
      var p = findFreePlacement(occ.grid, occ.gw, occ.gh, w, h, !!a.canRotate);
      if (!p) return null;
      var pw = p.rotated ? h : w;
      var ph = p.rotated ? w : h;
      for (var yy = p.y; yy < p.y + ph; yy++) {
        for (var xx = p.x; xx < p.x + pw; xx++) occ.grid[yy][xx] = true;
      }
      placements.push({ attachmentId: a.id, x: p.x, y: p.y, rotated: p.rotated });
    }
    return placements;
  }
  function sendClaimItem(attachmentId, x, y, rotated) {
    if (!cor3AutomationAllowed()) return Promise.resolve({ ok: false, error: "Automation paused." });
    return new Promise(function(resolve) {
      var done = false;
      var timer = null;
      function finish(res) {
        if (done) return;
        done = true;
        if (_itemClaimResolver && _itemClaimResolver.finish === finish) _itemClaimResolver = null;
        if (timer) clearTimeout(timer);
        resolve(res);
      }
      _itemClaimResolver = { attachmentId, finish };
      timer = setTimeout(function() {
        finish({ ok: false, error: "claim.item timeout" });
      }, 1e4);
      window.postMessage({
        type: "COR3_MAIL_CLAIM_ITEM",
        attachmentId,
        x,
        y,
        rotated
      }, "*");
    });
  }
  function tryItemFallback(msg) {
    if (_fallbackActive) return Promise.resolve(false);
    return new Promise(function(resolve) {
      Cor3CenterStore.get(["stashData", "stashSorting", "gameplayData"], function(local) {
        if (stashIsBusy(local)) {
          resolve(false);
          return;
        }
        var stash = local ? local.stashData : null;
        if (!stash || !Array.isArray(stash.items)) {
          resolve(false);
          return;
        }
        var placements = planAttachmentPlacements(msg, stash);
        if (!placements || placements.length === 0) {
          resolve(false);
          return;
        }
        _fallbackActive = true;
        markWarning("Mailbox: claim.all could not place the reward \u2014 placing it item by item\u2026");
        log("claim.all placement failed; using claim.item fallback for", placements.length, "attachment(s)");
        (async function() {
          for (var i = 0; i < placements.length; i++) {
            var pl = placements[i];
            var res = await sendClaimItem(pl.attachmentId, pl.x, pl.y, pl.rotated);
            if (!res.ok) {
              _fallbackActive = false;
              markWarning("Mailbox: claim.item fallback failed: " + res.error);
              log("claim.item fallback failed:", res.error);
              resolve(true);
              return;
            }
          }
          _fallbackActive = false;
          _claimedIds.add(msg.id);
          if (_mailData && Array.isArray(_mailData.messages)) {
            for (var j = 0; j < _mailData.messages.length; j++) {
              if (_mailData.messages[j].id === msg.id) _mailData.messages[j].status = "CLAIMED";
            }
          }
          markWarning(null);
          log("claim.item fallback claimed message", msg.id);
          var info = messageSourceInfo(msg);
          setTimeout(function() {
            pump();
            if (info) checkSourceComplete(info.sourceId, false, info.source);
          }, CLAIM_GAP_MS);
          resolve(true);
        })().catch(function(e) {
          _fallbackActive = false;
          markWarning("Mailbox: claim.item fallback error: " + (e && e.message ? e.message : e));
          resolve(true);
        });
      });
    });
  }
  function isCapacityError(msg) {
    var m = String(msg || "").toLowerCase();
    return m.indexOf("insufficient stash") !== -1 || m.indexOf("insufficient_capacity") !== -1 || m.indexOf("stash full") !== -1 || m.indexOf("stash.error.insufficient") !== -1 || m.indexOf("capacity") !== -1;
  }
  function emitClaimed(source, sourceId, assumed) {
    var w = _watched.get(sourceId);
    if (w) {
      if (w.emitted) return;
      w.emitted = true;
      if (w.timer) clearTimeout(w.timer);
    }
    source = source || _sourceById.get(sourceId) || "EXPEDITION";
    _forcedSources.delete(sourceId);
    log("source complete:", source, sourceId, assumed ? "(assumed)" : "");
    window.postMessage({
      type: "COR3_MAIL_CLAIMED",
      source,
      sourceId,
      assumed: !!assumed
    }, "*");
  }
  function sourceHasWork(sourceId) {
    if (!sourceId) return false;
    if (_active && messageSourceInfo(_active.msg) && messageSourceInfo(_active.msg).sourceId === sourceId) return true;
    if (_queue.some(function(m) {
      return messageSourceInfo(m) && messageSourceInfo(m).sourceId === sourceId;
    })) return true;
    var msgs = _mailData && Array.isArray(_mailData.messages) ? _mailData.messages : [];
    return msgs.some(function(m) {
      var info = messageSourceInfo(m);
      return info && info.sourceId === sourceId && m.status === "PENDING" && !_claimedIds.has(m.id);
    });
  }
  function checkSourceComplete(sourceId, force, sourceHint) {
    if (!sourceId) return;
    var seen = false;
    var seenSource = sourceHint || null;
    var msgs = _mailData && Array.isArray(_mailData.messages) ? _mailData.messages : [];
    for (var i = 0; i < msgs.length; i++) {
      var info = messageSourceInfo(msgs[i]);
      if (info && info.sourceId === sourceId) {
        seen = true;
        seenSource = info.source;
        break;
      }
    }
    if (seen && seenSource) _sourceById.set(sourceId, seenSource);
    if (seen) _seenSources.add(sourceId);
    if (!seen) {
      if (force) {
        var w = _watched.get(sourceId);
        emitClaimed(w && w.source || seenSource || _sourceById.get(sourceId) || "EXPEDITION", sourceId, true);
      }
      return;
    }
    if (!sourceHasWork(sourceId)) {
      var w2 = _watched.get(sourceId);
      emitClaimed(w2 && w2.source || seenSource || _sourceById.get(sourceId) || "EXPEDITION", sourceId, false);
    }
  }
  function hasMailSource(sourceId) {
    var msgs = _mailData && Array.isArray(_mailData.messages) ? _mailData.messages : [];
    for (var i = 0; i < msgs.length; i++) {
      var info = messageSourceInfo(msgs[i]);
      if (info && info.sourceId === sourceId) return true;
    }
    return false;
  }
  function watchSource(source, sourceId, timeoutMs) {
    if (!sourceId) return;
    source = source || _sourceById.get(sourceId) || "EXPEDITION";
    if (_watched.has(sourceId)) {
      checkSourceComplete(sourceId, false, source);
      return;
    }
    var entry = { source, timer: null, emitted: false };
    _watched.set(sourceId, entry);
    _sourceById.set(sourceId, entry.source);
    if (!hasMailSource(sourceId)) {
      window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
    }
    checkSourceComplete(sourceId, false);
    entry.timer = setTimeout(function() {
      var w = _watched.get(sourceId);
      if (!w || w.emitted) return;
      if (_seenSources.has(sourceId)) {
        checkSourceComplete(sourceId, true);
      } else {
        log("no mailbox message seen for", sourceId, "- assuming already collected");
        emitClaimed(source || "EXPEDITION", sourceId, true);
      }
    }, timeoutMs || WATCH_ASSUME_DONE_MS);
  }
  function enqueueMessage(m) {
    if (!cor3AutomationAllowed()) return;
    if (!m || !m.id || m.status !== "PENDING") return;
    var info = messageSourceInfo(m);
    if (!info) return;
    _seenSources.add(info.sourceId);
    if (info.sourceId) _sourceById.set(info.sourceId, info.source);
    if (_queuedIds.has(m.id) || _claimedIds.has(m.id)) return;
    if (_active && _active.msg && _active.msg.id === m.id) return;
    _queue.push(m);
    _queuedIds.add(m.id);
  }
  function stashIsBusy(local) {
    if (!local) return false;
    if (local.stashSorting) return true;
    var stash = local.stashData;
    if (stash && stash.sortingTable && Array.isArray(stash.sortingTable.items) && stash.sortingTable.items.length > 0) return true;
    var gameplay = local.gameplayData;
    if (gameplay && gameplay.gameplayBlockReason === "stash-sorting") return true;
    return false;
  }
  function maybeEnqueueAll() {
    if (!cor3AutomationAllowed()) return;
    if (!_mailData || !Array.isArray(_mailData.messages)) return;
    Cor3CenterStore.get(["stashSorting", "stashData", "gameplayData"], function(local) {
      if (stashIsBusy(local)) {
        _sorting = true;
        return;
      }
      _sorting = false;
      Cor3CenterStore.get(["autoSendMerc", "autoDrone"], function(settings) {
        var merc = settings.autoSendMerc || {};
        var drone = settings.autoDrone || {};
        var expEnabled = !!merc.enabled && merc.autoClaim !== false;
        var droneEnabled = !!drone.enabled && !drone.paused && drone.autoClaim !== false;
        if (!expEnabled && !droneEnabled && _forcedSources.size === 0) return;
        var msgs = _mailData.messages || [];
        for (var i = 0; i < msgs.length; i++) {
          var m = msgs[i];
          if (!m || !m.id || m.status !== "PENDING") continue;
          var info = messageSourceInfo(m);
          if (!info) continue;
          _seenSources.add(info.sourceId);
          if (info.sourceId) _sourceById.set(info.sourceId, info.source);
          var forced = _forcedSources.has(info.sourceId);
          if (!forced) {
            if (info.source === "EXPEDITION" && !expEnabled) continue;
            if (info.source === "DRONE_MISSION" && !droneEnabled) continue;
          }
          enqueueMessage(m);
        }
        pump();
        _watched.forEach(function(w, id) {
          if (!w.emitted) checkSourceComplete(id, false);
        });
      });
    });
  }
  function markWarning(text) {
    Cor3CenterStore.set({ mailWarning: text || null });
  }
  function sendActiveClaim() {
    if (!cor3AutomationAllowed()) return;
    if (!_active) return;
    var m = _active.msg;
    log("claiming message", m.id, "(" + (messageSourceInfo(m) || {}).source + ")");
    window.postMessage({ type: "COR3_MAIL_CLAIM_ALL", messageId: m.id }, "*");
    if (_active.timer) clearTimeout(_active.timer);
    _active.timer = setTimeout(function() {
      if (!_active) return;
      log("claim timeout for", m.id);
      handleClaimFailure("claim timeout");
    }, CLAIM_TIMEOUT_MS);
  }
  function pump() {
    if (!cor3AutomationAllowed()) return;
    if (_active || _fallbackActive || _queue.length === 0) return;
    if (_sorting) return;
    var m = _queue.shift();
    _queuedIds.delete(m.id);
    if (_claimedIds.has(m.id)) {
      pump();
      return;
    }
    _active = { msg: m, attempts: 0, timer: null };
    Cor3CenterStore.get(["stashSorting", "stashData", "gameplayData"], function(local) {
      if (stashIsBusy(local)) {
        _sorting = true;
        _queue.unshift(m);
        _queuedIds.add(m.id);
        _active = null;
        return;
      }
      _sorting = false;
      var stash = local ? local.stashData : null;
      var needed = messageCells(m);
      var available = null;
      if (stash && typeof stash.maxCapacity === "number" && typeof stash.currentUsage === "number") {
        available = stash.maxCapacity - stash.currentUsage;
      }
      if (available !== null && available < needed) {
        log("not enough stash space: need", needed, "available", available);
        handleClaimFailure("Insufficient stash capacity", true);
        return;
      }
      sendActiveClaim();
    });
  }
  function handleClaimFailure(errMsg, capacityOnly) {
    var active = _active;
    if (!active) return;
    if (active.timer) clearTimeout(active.timer);
    _active = null;
    var msgText = String(errMsg || "unknown error");
    active.attempts = (active.attempts || 0) + 1;
    if (isCapacityError(msgText)) {
      Cor3CenterStore.get(["stashSorting", "stashData", "gameplayData"], function(busyLocal) {
        if (stashIsBusy(busyLocal)) {
          _sorting = true;
          _queue.unshift(active.msg);
          _queuedIds.add(active.msg.id);
          return;
        }
        tryItemFallback(active.msg).then(function(handled) {
          if (handled) return;
          markWarning("Mailbox: stash full. Clear stash space to claim rewards.");
          log("stash full \u2014 claim queued until space is available");
          _queue.unshift(active.msg);
          _queuedIds.add(active.msg.id);
        });
      });
      return;
    }
    if (!capacityOnly && active.attempts <= MAX_CLAIM_RETRIES) {
      markWarning("Mailbox: claim failed (" + msgText + ") \u2014 retrying\u2026");
      var delay = 1500 * active.attempts;
      log("claim failed, retry", active.attempts, "/", MAX_CLAIM_RETRIES, "in", delay + "ms");
      setTimeout(function() {
        _queue.unshift(active.msg);
        _queuedIds.add(active.msg.id);
        pump();
      }, delay);
      return;
    }
    markWarning("Mailbox: claim failed: " + msgText);
    log("claim abandoned:", msgText);
    var info = messageSourceInfo(active.msg);
    if (info) checkSourceComplete(info.sourceId, true, info.source);
  }
  function onMailUpdate(data) {
    _mailData = data || null;
    _mailUpdatedAt = Date.now();
    Cor3CenterStore.set({ mailData: _mailData, mailDataUpdatedAt: _mailUpdatedAt });
    maybeEnqueueAll();
  }
  function onClaimResult(payload) {
    if (payload && payload.action !== "claim.all") return;
    if (!_active) {
      if (payload && payload.error) markWarning("Mailbox: " + (payload.error.message || payload.error));
      return;
    }
    if (payload && payload.error) {
      var em = payload.error.message || JSON.stringify(payload.error);
      log("claim.all error:", em);
      handleClaimFailure(em);
      return;
    }
    var info = messageSourceInfo(_active.msg);
    var claimed = _active.msg;
    if (_active.timer) clearTimeout(_active.timer);
    _active = null;
    _claimedIds.add(claimed.id);
    if (_mailData && Array.isArray(_mailData.messages)) {
      for (var i = 0; i < _mailData.messages.length; i++) {
        if (_mailData.messages[i].id === claimed.id) _mailData.messages[i].status = "CLAIMED";
      }
    }
    markWarning(null);
    log("claimed message", claimed.id);
    setTimeout(function() {
      pump();
      if (info) checkSourceComplete(info.sourceId, false, info.source);
    }, CLAIM_GAP_MS);
  }
  if (isContextValid()) {
    window.addEventListener("message", function(event) {
      if (event.source !== window) return;
      if (!isContextValid()) return;
      var data = event.data;
      if (!data) return;
      if (data.type === "COR3_WS_MAIL") {
        if (data.action === "update.state") {
          onMailUpdate(data.data);
        } else if (data.action === "claim.all") {
          onClaimResult(data);
        } else if (data.action === "claim.item") {
          if (_itemClaimResolver) {
            var respAttachmentId = data.data && data.data.attachmentId;
            if (!respAttachmentId || !_itemClaimResolver.attachmentId || respAttachmentId === _itemClaimResolver.attachmentId) {
              _itemClaimResolver.finish(data.error ? { ok: false, error: data.error.message || JSON.stringify(data.error) } : { ok: true });
            }
          }
        }
        return;
      }
      if (data.type === "COR3_CHECK_MAIL") {
        if (data.forceManual && data.sourceId) {
          _forcedSources.add(data.sourceId);
          _sourceById.set(data.sourceId, data.source || "DRONE_MISSION");
        }
        watchSource(data.source || "EXPEDITION", data.sourceId, data.timeoutMs);
        maybeEnqueueAll();
        return;
      }
    });
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if(sender?.id!==chrome.runtime.id)return;
      if(request?.centerExpectedDocumentId!==undefined&&request.centerExpectedDocumentId!==Cor3Automation.contentDocumentId)return;
      if(request?.centerIdentityDocumentId!==undefined&&request.centerIdentityDocumentId!==globalThis.Cor3CenterIdentity?.snapshot()?.documentId)return;
      // Route only this listener's action protocol; bridge type messages have their own validator.
      if (!request || Object.prototype.hasOwnProperty.call(request, "type") || !["claimMailbox"].includes(request.action)) return;
      if (request && /^cor3Master/.test(request.action || "")) return;
      const threeRequest=['toggleDecryptSolver','toggleIceWallSolver','toggleSimpleDecryptSolver'].includes(request.action);
      if (!(threeRequest ? (request.solverExpectedDocumentId===Cor3Automation.contentDocumentId && (request.enabled===false || Cor3ThreeAutomation.allowed())) : Cor3Automation.permitsRequest(request))) {
        sendResponse({ success: false, ok: false, error: "Helper-only mode is paused. Enable automation and refresh this game page before changing game state." });
        return;
      }
      if (request && request.action === "claimMailbox") {
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
        maybeEnqueueAll();
        sendResponse({ success: true });
      }
    });
    Cor3CenterStore.onChanged.addListener(function(changes, area) {
      if (area !== "local") return;
      if (changes.stashSorting && changes.stashSorting.newValue === false) {
        setTimeout(maybeEnqueueAll, 1e3);
      } else if (changes.stashData) {
        setTimeout(maybeEnqueueAll, 1200);
      } else if (changes.autoSendMerc || changes.autoDrone) {
        setTimeout(maybeEnqueueAll, 500);
      }
    });
  }
  window.__cor3MailDebug = function() {
    return { pending: _mailData ? _mailData.pendingCount : null, active: _active ? _active.msg.id : null, queue: _queue.length, sorting: _sorting };
  };

  // src/content/drone.js
  init_helpers();
  var autoDroneInProgress = false;
  var autoDroneClaimedMissionId = null;
  var autoDroneResolvedEvents = /* @__PURE__ */ new Set();
  var _dronePendingAction = null;
  var DRONE_PENDING_TIMEOUT_MS = 2e4;
  function _setDronePending(action) {
    _dronePendingAction = { action, at: Date.now() };
  }
  function _clearDronePending() {
    _dronePendingAction = null;
  }
  function _droneActionBlocked() {
    if (!_dronePendingAction) return false;
    if (Date.now() - _dronePendingAction.at > DRONE_PENDING_TIMEOUT_MS) {
      _dronePendingAction = null;
      return false;
    }
    return true;
  }
  function isDroneBusyError(msg) {
    const m = String(msg || "").toLowerCase();
    const keys = [
      "already",
      "in progress",
      "in-progress",
      "processing",
      "busy",
      "operation",
      "pending",
      "cooldown",
      "\u6B63\u5728",
      "\u5DF2\u5728",
      "\u64CD\u4F5C\u4E2D",
      "\u8FDB\u884C\u4E2D",
      "\u5904\u7406\u4E2D",
      "\u51B7\u5374"
    ];
    return keys.some((k) => m.indexOf(k) !== -1);
  }
  var _droneOptionsRefreshTimer = null;
  var lastDroneOptionsRead = null;
  function scheduleDroneOptionsRefresh(delayMs) {
    if (!cor3AutomationAllowed()) return;
    if (_droneOptionsRefreshTimer) clearTimeout(_droneOptionsRefreshTimer);
    _droneOptionsRefreshTimer = setTimeout(() => {
      _droneOptionsRefreshTimer = null;
      if (!isContextValid()) return;
      window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
    }, delayMs || 1e3);
  }
  function checkAutoDrone() {
    if (!cor3AutomationAllowed()) return;
    if (autoDroneInProgress) return;
    autoDroneInProgress = true;
    const finish = () => {
      autoDroneInProgress = false;
    };
    Cor3CenterStore.get("autoDrone", (settings) => {
      const cfg = settings.autoDrone || {};
      if (!cfg.enabled) {
        finish();
        return;
      }
      if (cfg.paused) {
        finish();
        return;
      }
      if (_droneActionBlocked()) {
        finish();
        return;
      }
      Cor3CenterStore.get(["droneData", "droneCompleted"], (local) => {
        const options = local.droneData;
        const completed = local.droneCompleted;
        if (!cor3AutomationAllowed()) { finish(); return; }
        if (options && options.drone && completed && completed.missionId && (Array.isArray(completed.loot) ? completed.loot.some((i) => !i.claimed) : true)) {
          if (cfg.autoClaim !== false && autoDroneClaimedMissionId !== completed.missionId) {
            autoDroneClaimedMissionId = completed.missionId;
            console.log("[COR3 Helper] Auto-drone: claiming completed mission via mailbox", completed.missionId);
            window.postMessage({ type: "COR3_CHECK_MAIL", source: "DRONE_MISSION", sourceId: completed.missionId }, "*");
          }
          finish();
          return;
        }
        if (!options || !options.drone) {
          finish();
          return;
        }
        const drone = options.drone;
        if (options.activeMissionId) {
          _clearDronePending();
          finish();
          return;
        }
        if (drone.isRepairing) {
          _clearDronePending();
          finish();
          return;
        }
        if (drone.isDestroyed) {
          console.log("[COR3 Helper] Auto-drone: drone destroyed \u2014 pausing");
          Cor3CenterStore.set({ autoDrone: Object.assign({}, cfg, { paused: true }) });
          Cor3CenterStore.set({ droneWarning: "Drone is destroyed \u2014 auto-drone paused. Repair or replace the drone." });
          finish();
          return;
        }
        if (cfg.repairEnabled) {
          const battCur = options.battery && typeof options.battery.current === "number" ? options.battery.current : 100;
          if (expeditionRules.droneNeedsRepair(drone, options.battery, cfg)) {
            console.log("[COR3 Helper] Auto-drone: repairing (durability", drone.durability, ", battery", battCur + ")");
            expeditionLog("drone-repair");
            _setDronePending("repair");
            window.postMessage({ type: "COR3_REPAIR_DRONE", targetDurability: 100 }, "*");
            finish();
            return;
          }
        }
        if (expeditionRules.shouldWaitForFullCharge(options.battery, cfg)) {
          expeditionLog("drone-charge");
          finish();
          return;
        }
        const mission = expeditionRules.pickDroneMission(options, cfg);
        if (!mission) {
          expeditionLog("drone-destination");
          console.log("[COR3 Helper] Auto-drone: no mission available");
          finish();
          return;
        }
        const batt = options.battery;
        if (batt && typeof batt.current === "number" && batt.current < (mission.batteryCost || 0)) {
          console.log("[COR3 Helper] Auto-drone: battery", batt.current, "< cost", mission.batteryCost, "\u2014 waiting for recharge");
          finish();
          return;
        }
        console.log("[COR3 Helper] Auto-drone: launching mission", mission.name, "(" + mission.locationConfigId + ")");
        expeditionLog("drone-dispatch");
        _setDronePending("launch");
        window.postMessage({ type: "COR3_LAUNCH_DRONE", locationConfigId: mission.locationConfigId, missionConfigId: mission.id }, "*");
        finish();
      });
    });
  }
  function checkAutoDroneDecide(eventData) {
    if (!cor3AutomationAllowed()) return;
    Cor3CenterStore.get("autoDrone", (settings) => {
      const cfg = settings.autoDrone || {};
      if (!cor3AutomationAllowed() || !cfg.enabled || cfg.paused || cfg.autoDecide === false) return;
      const ev = eventData && eventData.event;
      if (!ev || !ev.isResolvable || ev.isResolved) return;
      if (!Array.isArray(ev.options) || ev.options.length === 0) return;
      if (autoDroneResolvedEvents.has(ev.eventId)) return;
      const usable = ev.options.filter((o) => o && !o.requiredModuleId);
      const pool = usable.length > 0 ? usable : ev.options;
      const best = pickBestOption(pool, true, expeditionRules.resolveDecisionOverrides(cfg, 0, false));
      if (!best) return;
      autoDroneResolvedEvents.add(ev.eventId);
      expeditionLog("drone-decision");
      console.log("[COR3 Helper] Auto-drone: resolving event", ev.type, "->", best.label, "(aggressive)");
      window.postMessage({ type: "COR3_RESOLVE_DRONE_EVENT", missionId: eventData.missionId, eventId: ev.eventId, optionId: best.id }, "*");
    });
  }
  var _droneRateLimitRetries = 0;
  var DRONE_RATE_LIMIT_MAX_RETRIES = 3;
  var DRONE_RATE_LIMIT_DELAYS_MS = [2e4, 4e4, 6e4];
  function isDroneRateLimited(msg) {
    const m = (msg || "").toLowerCase();
    return m.indexOf("too many requests") !== -1 || m.indexOf("rate limit") !== -1 || m.indexOf("rate-limited") !== -1;
  }
  function handleDroneRateLimited(action, msg) {
    if (!cor3AutomationAllowed()) return;
    _droneRateLimitRetries++;
    if (_droneRateLimitRetries <= DRONE_RATE_LIMIT_MAX_RETRIES) {
      const delayMs = DRONE_RATE_LIMIT_DELAYS_MS[Math.min(_droneRateLimitRetries - 1, DRONE_RATE_LIMIT_DELAYS_MS.length - 1)];
      const secs = Math.round(delayMs / 1e3);
      console.log("[COR3 Helper] Auto-drone: rate limited (" + action + ") \u2014 retry " + _droneRateLimitRetries + "/" + DRONE_RATE_LIMIT_MAX_RETRIES + " in " + secs + "s");
      Cor3CenterStore.set({ droneWarning: "Rate limited \u2014 retrying in " + secs + "s (" + _droneRateLimitRetries + "/" + DRONE_RATE_LIMIT_MAX_RETRIES + ")" });
      setTimeout(() => {
        if (!isContextValid()) return;
        window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
      }, delayMs);
    } else {
      _droneRateLimitRetries = 0;
      console.log("[COR3 Helper] Auto-drone: rate limited after " + DRONE_RATE_LIMIT_MAX_RETRIES + " retries \u2014 disabling auto-dispatch");
      Cor3CenterStore.set({ droneWarning: "Rate limited \u2014 auto-dispatch disabled after " + DRONE_RATE_LIMIT_MAX_RETRIES + " retries. Re-enable to resume." });
      Cor3CenterStore.get("autoDrone", (settings) => {
        Cor3CenterStore.set({ autoDrone: Object.assign({}, settings.autoDrone || {}, { enabled: false }) });
      });
    }
  }
  function handleDroneError(action, error) {
    const msg = error && (error.message || JSON.stringify(error)) || "unknown error";
    console.log("[COR3 Helper] Auto-drone error (" + action + "):", msg);
    _clearDronePending();
    expeditionLog("drone-error");
    if (isDroneRateLimited(msg)) {
      handleDroneRateLimited(action, msg);
      return;
    }
    if (action === "get.options") return; // The read loader and periodic check own retries.
    if (isDroneBusyError(msg)) {
      console.log("[COR3 Helper] Auto-drone: transient busy error \u2014 will retry");
      Cor3CenterStore.set({ droneWarning: "Drone " + action + " deferred (" + msg + ") \u2014 retrying\u2026" });
      scheduleDroneOptionsRefresh(2500 + Math.floor(Math.random() * 1500));
      return;
    }
    Cor3CenterStore.get("autoDrone", (settings) => {
      const cfg = settings.autoDrone || {};
      if (action === "repair") {
        Cor3CenterStore.set({ droneWarning: "Drone repair failed: " + msg });
        if (cfg.pauseOnRepairFail !== false) Cor3CenterStore.set({ autoDrone: { ...cfg, paused: true } });
      } else {
        Cor3CenterStore.set({ droneWarning: "Drone " + action + " failed: " + msg });
      }
    });
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!isContextValid()) return;
    const now = Date.now();
    const type = event.data && event.data.type;
    if (type === "COR3_WS_DRONE_OPTIONS") {
      const scope = networkScope();
      if (scope && event.origin === location.origin) lastDroneOptionsRead = { ...scope, at: now };
      _droneRateLimitRetries = 0;
      _clearDronePending();
      expeditionLog("drone-options");
      Cor3CenterStore.set({ droneData: event.data.data, droneDataUpdatedAt: now, droneOptionsReadError: null }).then(checkAutoDrone, () => {});
    } else if (type === "COR3_WS_DRONE_MISSION") {
      _clearDronePending();
      Cor3CenterStore.set({ droneMissionData: event.data.data, droneMissionUpdatedAt: now });
      scheduleDroneOptionsRefresh(2e3);
    } else if (type === "COR3_WS_DRONE_UPDATE") {
      const upd = event.data.data || {};
      Cor3CenterStore.get("droneData", (local) => {
        const options = local.droneData;
        if (options && options.drone) {
          if (typeof upd.durability === "number") options.drone.durability = upd.durability;
          if (upd.repaired) options.drone.isRepairing = false;
          Cor3CenterStore.set({ droneData: options, droneDataUpdatedAt: now });
        }
        _clearDronePending();
        scheduleDroneOptionsRefresh(1500);
      });
    } else if (type === "COR3_WS_DRONE_LAUNCHED") {
      expeditionLog("drone-launched");
      console.log("[COR3 Helper] Auto-drone: mission launched");
      _clearDronePending();
      Cor3CenterStore.remove(["droneCompleted", "droneWarning"]);
      autoDroneClaimedMissionId = null;
    } else if (type === "COR3_WS_DRONE_COMPLETED") {
      const completedData = event.data.data || {};
      Cor3CenterStore.set({ droneCompleted: completedData, droneCompletedUpdatedAt: now }).then(checkAutoDrone, () => {});
    } else if (type === "COR3_MAIL_CLAIMED" && event.data.source === "DRONE_MISSION") {
      console.log("[COR3 Helper] Auto-drone: mailbox rewards claimed for", event.data.sourceId);
      _clearDronePending();
      Cor3CenterStore.get("droneCompleted", (local) => {
        const completed = local.droneCompleted;
        if (!completed || !completed.missionId || completed.missionId === event.data.sourceId) {
          Cor3CenterStore.remove("droneCompleted");
          autoDroneClaimedMissionId = null;
        }
        scheduleDroneOptionsRefresh(1500);
      });
    } else if (type === "COR3_WS_DRONE_EVENT") {
      checkAutoDroneDecide(event.data.data);
    } else if (type === "COR3_WS_DRONE_REPAIR") {
      _clearDronePending();
      scheduleDroneOptionsRefresh(1500);
      console.log("[COR3 Helper] Auto-drone: repair started");
    } else if (type === "COR3_WS_DRONE_ARCHIVED") {
      const arcData = event.data.data || {};
      const items = Array.isArray(arcData.items) ? arcData.items : [];
      Cor3CenterStore.get("droneArchivedData", (prev) => {
        let mergedItems = items;
        if (prev.droneArchivedData && Array.isArray(prev.droneArchivedData.items) && prev.droneArchivedData.items.length > 0) {
          const seen = new Set(prev.droneArchivedData.items.map((i) => i.id));
          mergedItems = prev.droneArchivedData.items.concat(items.filter((i) => !seen.has(i.id)));
        }
        Cor3CenterStore.set({
          droneArchivedData: Object.assign({}, arcData, { items: mergedItems }),
          droneArchivedUpdatedAt: now
        });
      });
    } else if (type === "COR3_WS_DRONE_ERROR") {
      if(event.data.action==='get.options'&&event.origin===location.origin){
        const scope=globalThis.Cor3CenterIdentity?.snapshot(),raw=event.data.error?.code||event.data.error?.message;
        const code=typeof raw==='string'&&/^[A-Za-z][A-Za-z0-9_. -]{0,79}$/.test(raw)?raw:'GAME_ERROR';
        if(scope)Cor3CenterStore.set({droneOptionsReadError:{documentId:scope.documentId,at:now,code}}).catch(()=>{});
      }
      handleDroneError(event.data.action, event.data.error);
    }
  });
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if(sender?.id!==chrome.runtime.id)return;
      if(request?.centerExpectedDocumentId!==undefined&&request.centerExpectedDocumentId!==Cor3Automation.contentDocumentId)return;
      if(request?.centerIdentityDocumentId!==undefined&&request.centerIdentityDocumentId!==globalThis.Cor3CenterIdentity?.snapshot()?.documentId)return;
      // Route only this listener's action protocol; bridge type messages have their own validator.
      if (!request || Object.prototype.hasOwnProperty.call(request, "type") || !["requestDroneOptions","launchDrone","claimDrone","repairDrone","resolveDroneEvent","requestDroneArchived"].includes(request.action)) return;
      if (request && /^cor3Master/.test(request.action || "")) return;
      const threeRequest=['toggleDecryptSolver','toggleIceWallSolver','toggleSimpleDecryptSolver'].includes(request.action);
      if (!(threeRequest ? (request.solverExpectedDocumentId===Cor3Automation.contentDocumentId && (request.enabled===false || Cor3ThreeAutomation.allowed())) : Cor3Automation.permitsRequest(request))) {
        sendResponse({ success: false, ok: false, error: "Helper-only mode is paused. Enable automation and refresh this game page before changing game state." });
        return;
      }
    if (request.action === "requestDroneOptions") {
      window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
      sendResponse({ success: true });
    } else if (request.action === "launchDrone") {
      window.postMessage({ type: "COR3_LAUNCH_DRONE", locationConfigId: request.locationConfigId, missionConfigId: request.missionConfigId }, "*");
      sendResponse({ success: true });
    } else if (request.action === "claimDrone") {
      window.postMessage({ type: "COR3_CHECK_MAIL", source: "DRONE_MISSION", sourceId: request.missionId, forceManual: true }, "*");
      sendResponse({ success: true });
    } else if (request.action === "repairDrone") {
      window.postMessage({ type: "COR3_REPAIR_DRONE", targetDurability: request.targetDurability }, "*");
      sendResponse({ success: true });
    } else if (request.action === "resolveDroneEvent") {
      window.postMessage({ type: "COR3_RESOLVE_DRONE_EVENT", missionId: request.missionId, eventId: request.eventId, optionId: request.optionId }, "*");
      sendResponse({ success: true });
    } else if (request.action === "requestDroneArchived") {
      window.postMessage({ type: "COR3_REQUEST_DRONE_ARCHIVED", cursor: request.cursor || null, limit: request.limit || 20 }, "*");
      sendResponse({ success: true });
    }
  });
  function pollDroneOptions() {
    if (!isContextValid() || !cor3AutomationAllowed()) return;
    const scope = networkScope();
    if (!scope) return;
    const needsOptions = () => {
      const age = Date.now() - (lastDroneOptionsRead?.at || 0);
      return lastDroneOptionsRead?.accountId !== scope.accountId || lastDroneOptionsRead?.documentId !== scope.documentId || age < 0 || age >= 60000;
    };
    if (!needsOptions()) return;
    Cor3CenterStore.get("autoDrone", (settings) => {
      const cfg = settings.autoDrone || {};
      const current = networkScope();
      if (!cfg.enabled || cfg.paused || !cor3AutomationAllowed() || current?.accountId !== scope.accountId || current?.documentId !== scope.documentId || !needsOptions()) return;
      window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
    });
  }
  setInterval(pollDroneOptions, 6e4);
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.autoDrone) return;
    const newVal = changes.autoDrone.newValue;
    if (newVal && newVal.enabled && !newVal.paused) {
      console.log("[COR3 Helper] Auto-drone enabled \u2014 checking drone state");
      window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
    }
  });
  setTimeout(() => {
    Cor3CenterStore.get("autoDrone", (settings) => {
      const cfg = settings.autoDrone || {};
      if (cfg.enabled && !cfg.paused) {
        console.log("[COR3 Helper] Page load: auto-drone enabled \u2014 requesting options");
        window.postMessage({ type: "COR3_REQUEST_DRONE_OPTIONS" }, "*");
      }
    });
  }, 6e3);

  // src/content/stash-sort.js
  init_helpers();
  var RARITY_ORDER = {
    QUEST: 0,
    LEGENDARY: 1,
    EPIC: 2,
    SUPERRARE: 3,
    RARE: 4,
    COMMON: 5
  };
  var MOVE_TIMEOUT_MS = 9e3;
  var MOVE_GAP_MS = 220;
  var PROGRESS_KEY = "stashSortProgress";
  var _sorting2 = false;
  function log2() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[COR3 Helper] StashSort:");
    console.log.apply(console, args);
  }
  function setProgress(p) {
    Cor3CenterStore.set({ [PROGRESS_KEY]: p });
  }
  function finishProgress(p) {
    p.finishedAt = Date.now();
    Cor3CenterStore.set({ [PROGRESS_KEY]: p, stashSorting: false });
  }
  function rarityRank(tier) {
    return RARITY_ORDER[String(tier || "COMMON").toUpperCase()] ?? 6;
  }
  function compareItems(a, b) {
    const ra = rarityRank(a.tier);
    const rb = rarityRank(b.tier);
    if (ra !== rb) return ra - rb;
    const na = String(a.name || a.shortName || "");
    const nb = String(b.name || b.shortName || "");
    const byName = na.localeCompare(nb, void 0, { sensitivity: "base" });
    if (byName !== 0) return byName;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }
  function baseDims(item) {
    let w = Math.max(1, Number(item.width) || 1);
    let h = Math.max(1, Number(item.height) || 1);
    if (item.rotated) {
      const t = w;
      w = h;
      h = t;
    }
    return { w, h };
  }
  function canonicalDims(item, gw) {
    const b = baseDims(item);
    if (b.w <= gw) return { w: b.w, h: b.h, rotated: false };
    if (item.canRotate && b.h <= gw) return { w: b.h, h: b.w, rotated: true };
    return null;
  }
  function makeGrid(w, h) {
    const rows = [];
    for (let y = 0; y < h; y++) rows.push(new Array(w).fill(null));
    return rows;
  }
  function canPlace(grid, x, y, w, h, gw, gh) {
    if (x < 0 || y < 0 || x + w > gw || y + h > gh) return false;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (grid[yy][xx] !== null) return false;
      }
    }
    return true;
  }
  function place(grid, x, y, w, h, id) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) grid[yy][xx] = id;
    }
  }
  function clearRect(grid, x, y, w, h, id) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (grid[yy] && grid[yy][xx] === id) grid[yy][xx] = null;
      }
    }
  }
  function layoutCompact(items, gw, gh) {
    const grid = makeGrid(gw, gh);
    const result = [];
    const sorted = items.slice().sort(compareItems);
    for (const item of sorted) {
      const b = baseDims(item);
      let placement = null;
      for (let y = 0; y <= gh - b.h && !placement; y++) {
        for (let x = 0; x <= gw - b.w; x++) {
          if (canPlace(grid, x, y, b.w, b.h, gw, gh)) {
            placement = { x, y, w: b.w, h: b.h, rotated: false };
            break;
          }
        }
      }
      if (!placement && item.canRotate && b.w !== b.h) {
        const rw = b.h, rh = b.w;
        for (let y = 0; y <= gh - rh && !placement; y++) {
          for (let x = 0; x <= gw - rw; x++) {
            if (canPlace(grid, x, y, rw, rh, gw, gh)) {
              placement = { x, y, w: rw, h: rh, rotated: true };
              break;
            }
          }
        }
      }
      if (!placement) {
        return { ok: false, reason: "Not enough warehouse rows for the compact layout (item: " + (item.name || item.id) + ")." };
      }
      place(grid, placement.x, placement.y, placement.w, placement.h, item.id);
      result.push({ id: item.id, x: placement.x, y: placement.y, w: placement.w, h: placement.h, rotated: placement.rotated });
    }
    return { ok: true, items: result };
  }
  function layoutSmart(items, gw, gh) {
    const byRarity = /* @__PURE__ */ new Map();
    for (const item of items) {
      const d = canonicalDims(item, gw);
      if (!d) {
        return { ok: false, reason: 'Item "' + (item.name || item.id) + '" cannot fit in the warehouse grid.' };
      }
      const tier = String(item.tier || "COMMON").toUpperCase();
      const typeKey = item.itemConfigId || (item.name || "") + "|" + tier;
      const groupKey = typeKey + "|" + d.w + "x" + d.h;
      if (!byRarity.has(tier)) byRarity.set(tier, /* @__PURE__ */ new Map());
      const byHeight = byRarity.get(tier);
      if (!byHeight.has(d.h)) byHeight.set(d.h, /* @__PURE__ */ new Map());
      const byGroup = byHeight.get(d.h);
      let group = byGroup.get(groupKey);
      if (!group) {
        group = {
          items: [],
          w: d.w,
          h: d.h,
          rotated: d.rotated,
          name: item.name || item.shortName || "",
          key: groupKey
        };
        byGroup.set(groupKey, group);
      }
      group.items.push(item);
    }
    const result = [];
    const rarityKeys = Array.from(byRarity.keys()).sort((a, b) => rarityRank(a) - rarityRank(b));
    let y = 0;
    for (const tier of rarityKeys) {
      const byHeight = byRarity.get(tier);
      const heights = Array.from(byHeight.keys()).sort((a, b) => b - a);
      for (const height of heights) {
        const groups = Array.from(byHeight.get(height).values());
        groups.sort((a, b) => compareItems(a.items[0], b.items[0]));
        let x = 0;
        for (const group of groups) {
          group.items.sort(compareItems);
          for (const item of group.items) {
            if (x + group.w > gw) {
              y += height;
              x = 0;
            }
            if (y + height > gh) {
              return {
                ok: false,
                reason: "Not enough warehouse rows for the smart layout. Required more than " + gh + " rows.",
                requiredRows: y + height
              };
            }
            result.push({
              id: item.id,
              x,
              y,
              w: group.w,
              h: group.h,
              rotated: group.rotated
            });
            x += group.w;
          }
        }
        y += height;
      }
    }
    return { ok: true, items: result, usedRows: y };
  }
  function computeMoves(stash, layoutItems) {
    const gw = Number(stash.gridWidth) || 12;
    const gh = Number(stash.usableRows) || 60;
    const stWidth = stash.sortingTable && Number(stash.sortingTable.width) || 15;
    const items = (stash.items || []).filter((it) => it && it.id && (!it.location || it.location === "stash"));
    const itemById = new Map(items.map((it) => [it.id, it]));
    const targetById = new Map(layoutItems.map((t) => [t.id, t]));
    const grid = makeGrid(gw, gh);
    const cur = /* @__PURE__ */ new Map();
    for (const it of items) {
      if (!targetById.has(it.id)) continue;
      const w = Number(it.width) || 1;
      const h = Number(it.height) || 1;
      const x = Number(it.x) || 0;
      const y = Number(it.y) || 0;
      cur.set(it.id, { x, y, w, h, rotated: !!it.rotated, location: "stash" });
      place(grid, x, y, w, h, it.id);
    }
    const placed = /* @__PURE__ */ new Set();
    for (const it of items) {
      const t = targetById.get(it.id);
      if (!t) continue;
      if (it.x === t.x && it.y === t.y && !!it.rotated === !!t.rotated) placed.add(it.id);
    }
    const staged = /* @__PURE__ */ new Map();
    const stagedEver = /* @__PURE__ */ new Map();
    const staging = { x: 0, y: 0, rowH: 0 };
    const moves = [];
    function nextStagingPosition(item) {
      let b = baseDims(item);
      let w = b.w, h = b.h, rotated = false;
      if (w > stWidth && item.canRotate) {
        w = b.h;
        h = b.w;
        rotated = true;
      }
      if (w > stWidth) throw new Error('Item "' + (item.name || item.id) + '" is too wide for the sorting table.');
      if (staging.x + w > stWidth) {
        staging.y += staging.rowH;
        staging.x = 0;
        staging.rowH = 0;
      }
      const pos = { x: staging.x, y: staging.y, rotated };
      staging.x += w;
      if (h > staging.rowH) staging.rowH = h;
      return pos;
    }
    function stageBlockers(t, selfId) {
      const blockers = /* @__PURE__ */ new Set();
      for (let yy = t.y; yy < t.y + t.h; yy++) {
        for (let xx = t.x; xx < t.x + t.w; xx++) {
          const occ = grid[yy] ? grid[yy][xx] : null;
          if (occ && occ !== selfId) blockers.add(occ);
        }
      }
      for (const blockerId of blockers) {
        if (placed.has(blockerId)) {
          const selfItem = itemById.get(selfId);
          return "Layout conflict: a placed item blocks " + (selfItem ? selfItem.name || selfItem.id : selfId) + ".";
        }
        if (staged.has(blockerId)) continue;
        const blocker = itemById.get(blockerId);
        if (!blocker) continue;
        const pos = nextStagingPosition(blocker);
        moves.push({ itemId: blockerId, location: "sorting_table", x: pos.x, y: pos.y, rotated: pos.rotated });
        const c = cur.get(blockerId);
        if (c) {
          clearRect(grid, c.x, c.y, c.w, c.h, blockerId);
          c.location = "sorting_table";
        }
        staged.set(blockerId, {
          target: targetById.get(blockerId),
          original: { x: blocker.x, y: blocker.y, rotated: !!blocker.rotated }
        });
        stagedEver.set(blockerId, {
          id: blockerId,
          original: { x: blocker.x, y: blocker.y, rotated: !!blocker.rotated }
        });
      }
      return null;
    }
    for (const t of layoutItems) {
      const it = itemById.get(t.id);
      if (!it) continue;
      const isStaged = staged.has(it.id);
      if (!isStaged && placed.has(it.id)) continue;
      const stageErr = stageBlockers(t, it.id);
      if (stageErr) return { ok: false, reason: stageErr };
      if (isStaged) staged.delete(it.id);
      const c = cur.get(it.id);
      if (c && c.location === "stash") {
        clearRect(grid, c.x, c.y, c.w, c.h, it.id);
      }
      moves.push({ itemId: it.id, location: "stash", x: t.x, y: t.y, rotated: t.rotated });
      place(grid, t.x, t.y, t.w, t.h, it.id);
      cur.set(it.id, { x: t.x, y: t.y, w: t.w, h: t.h, rotated: !!t.rotated, location: "stash" });
      placed.add(it.id);
    }
    for (const [id, s] of Array.from(staged.entries())) {
      const t = s.target;
      if (!t) continue;
      moves.push({ itemId: id, location: "stash", x: t.x, y: t.y, rotated: t.rotated });
      staged.delete(id);
    }
    return { ok: true, moves, stagedEver: Array.from(stagedEver.values()) };
  }
  function sendMove(move) {
    if (!cor3AutomationAllowed()) return Promise.resolve({ ok: false, error: "Automation paused." });
    return new Promise((resolve) => {
      let done = false;
      function cleanup() {
        window.removeEventListener("message", onMessage);
        clearTimeout(timer);
      }
      function finish(res) {
        if (done) return;
        done = true;
        cleanup();
        resolve(res);
      }
      function onMessage(evt) {
        if (evt.source !== window) return;
        const d = evt.data;
        if (!d || d.type !== "COR3_WS_STASH_MOVE") return;
        if (d.error) {
          finish({ ok: false, error: d.error.message || JSON.stringify(d.error) });
        } else {
          finish({ ok: true, data: d.data });
        }
      }
      window.addEventListener("message", onMessage);
      const timer = setTimeout(() => finish({ ok: false, error: "move.item timeout" }), MOVE_TIMEOUT_MS);
      window.postMessage({
        type: "COR3_STASH_MOVE_ITEM",
        itemId: move.itemId,
        location: move.location,
        x: move.x,
        y: move.y,
        rotated: !!move.rotated
      }, "*");
    });
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function executeMoves(mode, moves, stagedEver) {
    const total = moves.length;
    const inTable = /* @__PURE__ */ new Set();
    const originalById = new Map((stagedEver || []).map((s) => [s.id, s.original]));
    setProgress({ mode, phase: "moving", done: 0, total, text: "Moving 0/" + total, startedAt: Date.now() });
    for (let i = 0; i < total; i++) {
      if (!isContextValid() || !cor3AutomationAllowed()) return { ok: false, error: "Sorting stopped. Check the sorting table before continuing." };
      const move = moves[i];
      setProgress({ mode, phase: "moving", done: i, total, text: "Moving " + (i + 1) + "/" + total, startedAt: Date.now() });
      const res = await sendMove(move);
      if (!res.ok) {
        for (const id of Array.from(inTable)) {
          const orig = originalById.get(id);
          if (!orig) continue;
          await sendMove({
            itemId: id,
            location: "stash",
            x: orig.x,
            y: orig.y,
            rotated: orig.rotated
          }).catch(() => {
          });
        }
        return { ok: false, error: res.error };
      }
      if (move.location === "sorting_table") inTable.add(move.itemId);
      else inTable.delete(move.itemId);
      if (MOVE_GAP_MS > 0) await sleep(MOVE_GAP_MS);
    }
    return { ok: true };
  }
  async function startStashSort(mode) {
    if (!cor3AutomationAllowed()) return { ok: false, error: "Automation paused. Refresh after enabling to resume." };
    const requestedMode = mode === "smart" ? "smart" : "compact";
    if (_sorting2) return { ok: false, error: "A sort is already running." };
    const local = await new Promise((r) => Cor3CenterStore.get(["stashData", "stashSorting"], r));
    if (local && local.stashSorting) return { ok: false, error: "A sort is already running." };
    const stash = local ? local.stashData : null;
    if (!stash || !Array.isArray(stash.items)) {
      return { ok: false, error: "No stash data yet \u2014 refresh the inventory first." };
    }
    if (stash.sortingTable && Array.isArray(stash.sortingTable.items) && stash.sortingTable.items.length > 0) {
      return { ok: false, error: "The sorting table is not empty. Close the warehouse window to return those items first." };
    }
    const gw = Number(stash.gridWidth) || 12;
    const gh = Number(stash.usableRows) || 60;
    const items = stash.items.filter((it) => it && it.id && (!it.location || it.location === "stash"));
    if (items.length === 0) return { ok: false, error: "No items to sort." };
    _sorting2 = true;
    Cor3CenterStore.set({ stashSorting: true });
    Cor3CenterStore.remove("stashSortNotice");
    setProgress({ mode: requestedMode, phase: "planning", done: 0, total: 0, text: "Planning layout\u2026", startedAt: Date.now() });
    try {
      let layout;
      let fallback = false;
      let notice = null;
      if (requestedMode === "smart") {
        layout = layoutSmart(items, gw, gh);
        if (!layout.ok) {
          const smartReason = layout.reason;
          const smartRows = layout.requiredRows;
          const compactLayout = layoutCompact(items, gw, gh);
          if (compactLayout.ok) {
            layout = compactLayout;
            fallback = true;
            notice = smartRows ? "Smart layout needs at least " + smartRows + " rows (max " + gh + ") \u2014 used Compact layout instead." : "Smart layout could not fit (" + smartReason + ") \u2014 used Compact layout instead.";
            log2("smart layout rejected; falling back to compact:", notice);
          } else {
            const msg = smartRows ? "Smart layout needs at least " + smartRows + " rows (max " + gh + "), and the compact fallback also does not fit." : smartReason + " The compact fallback also does not fit.";
            log2("layout rejected:", msg);
            finishProgress({ mode: requestedMode, phase: "error", done: 0, total: 0, text: msg, error: msg, startedAt: Date.now() });
            _sorting2 = false;
            return { ok: false, error: msg };
          }
        }
      } else {
        layout = layoutCompact(items, gw, gh);
        if (!layout.ok) {
          log2("layout rejected:", layout.reason);
          finishProgress({ mode: requestedMode, phase: "error", done: 0, total: 0, text: layout.reason, error: layout.reason, startedAt: Date.now() });
          _sorting2 = false;
          return layout;
        }
      }
      if (notice) {
        Cor3CenterStore.set({ stashSortNotice: notice });
      }
      const plan = computeMoves(stash, layout.items);
      if (!plan.ok) {
        finishProgress({ mode: requestedMode, phase: "error", done: 0, total: 0, text: plan.reason, error: plan.reason, startedAt: Date.now() });
        _sorting2 = false;
        return plan;
      }
      const fallbackSuffix = fallback ? " (Compact fallback)" : "";
      if (plan.moves.length === 0) {
        finishProgress({ mode: requestedMode, phase: "done", done: 0, total: 0, text: "Warehouse is already sorted." + fallbackSuffix, startedAt: Date.now() });
        _sorting2 = false;
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
        return { ok: true, moves: 0, fallback, notice };
      }
      log2("plans", plan.moves.length, "move(s) for", requestedMode, "layout", fallback ? "(compact fallback)" : "");
      executeMoves(requestedMode, plan.moves, plan.stagedEver).then((result) => {
        _sorting2 = false;
        if (!result.ok) {
          finishProgress({ mode: requestedMode, phase: "error", done: 0, total: plan.moves.length, text: "Sorting failed: " + result.error + fallbackSuffix, error: result.error, startedAt: Date.now() });
          log2("sort failed:", result.error);
        } else {
          finishProgress({ mode: requestedMode, phase: "done", done: plan.moves.length, total: plan.moves.length, text: "Sorted " + items.length + " item(s) in " + plan.moves.length + " move(s)." + fallbackSuffix, startedAt: Date.now() });
          log2("sort complete");
        }
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
      }).catch((e) => {
        _sorting2 = false;
        const msg = e && e.message ? e.message : String(e);
        finishProgress({ mode: requestedMode, phase: "error", done: 0, total: plan.moves.length, text: "Sorting failed: " + msg + fallbackSuffix, error: msg, startedAt: Date.now() });
        log2("sort exception:", msg);
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
      });
      return { ok: true, moves: plan.moves.length, fallback, notice };
    } catch (e) {
      _sorting2 = false;
      const msg = e && e.message ? e.message : String(e);
      finishProgress({ mode: requestedMode, phase: "error", done: 0, total: 0, text: "Sorting failed: " + msg, error: msg, startedAt: Date.now() });
      log2("sort exception:", msg);
      window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
      return { ok: false, error: msg };
    }
  }
  if (isContextValid()) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if(sender?.id!==chrome.runtime.id)return;
      if(request?.centerExpectedDocumentId!==undefined&&request.centerExpectedDocumentId!==Cor3Automation.contentDocumentId)return;
      if(request?.centerIdentityDocumentId!==undefined&&request.centerIdentityDocumentId!==globalThis.Cor3CenterIdentity?.snapshot()?.documentId)return;
      // Route only this listener's action protocol; bridge type messages have their own validator.
      if (!request || Object.prototype.hasOwnProperty.call(request, "type") || !["sortStash"].includes(request.action)) return;
      if (request && /^cor3Master/.test(request.action || "")) return;
      const threeRequest=['toggleDecryptSolver','toggleIceWallSolver','toggleSimpleDecryptSolver'].includes(request.action);
      if (!(threeRequest ? (request.solverExpectedDocumentId===Cor3Automation.contentDocumentId && (request.enabled===false || Cor3ThreeAutomation.allowed())) : Cor3Automation.permitsRequest(request))) {
        sendResponse({ success: false, ok: false, error: "Helper-only mode is paused. Enable automation and refresh this game page before changing game state." });
        return;
      }
      if (request && request.action === "sortStash") {
        const mode = request.mode === "smart" ? "smart" : "compact";
        startStashSort(mode).then((res) => {
          try {
            sendResponse(res);
          } catch (e) {
          }
        });
        return true;
      }
    });
  }
  window.__cor3StartStashSort = function(mode) {
    return startStashSort(mode === "smart" ? "smart" : "compact");
  };

  // src/content/auto-refresh.js
  init_helpers();
  init_auto_update_markets();
  init_auto_send();
  var autoRefreshSettings = { home_jobs: false, dark_jobs: false, soyuz_jobs: false, usol_jobs: false };
  var autoRefreshRetryPending = { home_jobs: false, dark_jobs: false, soyuz_jobs: false, usol_jobs: false };
  var autoRefreshExpiredRetryAt = { home_jobs: 0, dark_jobs: 0, soyuz_jobs: 0, usol_jobs: 0 };
  function setAutoRefreshSettings(v) {
    autoRefreshSettings = v;
  }
  try {
    Cor3CenterStore.get("autoRefresh", (data) => {
      if (data.autoRefresh) autoRefreshSettings = data.autoRefresh;
    });
  } catch (e) {
  }
  try {
    Cor3CenterStore.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.autoRefresh && changes.autoRefresh.newValue) {
        autoRefreshSettings = changes.autoRefresh.newValue;
      }
      if (area === "local" && changes.autoUpdateMarkets !== void 0) {
        const wasOff = !_autoUpdateMarkets;
        setAutoUpdateMarkets(changes.autoUpdateMarkets.newValue !== false);
        if (_autoUpdateMarkets && wasOff) _initAutoUpdateMarketsTimer();
      }
      if (area === "local") {
        const marketKeyMap = { marketData: "home_jobs", darkMarketData: "dark_jobs", soyuzMarketData: "soyuz_jobs", usolMarketData: "usol_jobs" };
        for (const [storageKey, refreshKey] of Object.entries(marketKeyMap)) {
          if (changes[storageKey] && changes[storageKey].newValue) {
            const resetAt = changes[storageKey].newValue.nextJobsResetAt;
            if (resetAt && new Date(resetAt).getTime() > Date.now()) {
              autoRefreshExpiredRetryAt[refreshKey] = 0;
            }
          }
        }
        if (changes.cor3_console_logs && changes.cor3_console_logs.newValue) {
          const oldLen = (changes.cor3_console_logs.oldValue || []).length;
          const newEntries = changes.cor3_console_logs.newValue.slice(oldLen);
          const bgPopupEntries = newEntries.filter((e) => e.source !== "content");
          if (bgPopupEntries.length > 0) {
            try {
              for (const e of bgPopupEntries) {
                cor3LogEntry("ext-console", "[" + (e.source || "unknown") + "] " + (e.args || ""), e.level || "log");
              }
            } catch (err) {
            }
          }
        }
      }
    });
  } catch (e) {
  }
  function getMarketTimerSeconds(which) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        resolve(null);
        return;
      }
      try {
        const key = which === "home_jobs" ? "marketData" : which === "usol_jobs" ? "usolMarketData" : which === "soyuz_jobs" ? "soyuzMarketData" : "darkMarketData";
        Cor3CenterStore.get(key, (result) => {
          const data = result[key];
          if (data && data.nextJobsResetAt) {
            const diff = new Date(data.nextJobsResetAt).getTime() - Date.now();
            resolve(diff > 0 ? Math.floor(diff / 1e3) : 0);
          } else {
            resolve(null);
          }
        });
      } catch (e) {
        resolve(null);
      }
    });
  }
  async function checkAutoRefresh() {
    if (!cor3AutomationAllowed()) return;
    if(_autoUpdateMarkets)return; // The cached-deadline clock owns default refreshes; no duplicate pinned loop.
    try {
      if (!isContextValid()) return;
      if (_seqRefreshRunning || _autoJobsActive || !_initialFetchDone) return;
      let needsRefresh = false;
      let expiredMarkets = [];
      const now = Date.now();
      for (const key of ["home_jobs", "dark_jobs", "soyuz_jobs", "usol_jobs"]) {
        if (!autoRefreshSettings[key]) continue;
        if (autoRefreshRetryPending[key]) continue;
        const sec = await getMarketTimerSeconds(key);
        if (sec !== null && sec <= 0) {
          if (autoRefreshExpiredRetryAt[key] && now < autoRefreshExpiredRetryAt[key]) continue;
          needsRefresh = true;
          expiredMarkets.push(key);
        }
      }
      if (needsRefresh) {
        setSeqRefreshRunning(true);
        for (const key of expiredMarkets) {
          autoRefreshRetryPending[key] = true;
          autoRefreshExpiredRetryAt[key] = now + 6e4;
        }
        var order = [];
        if (expiredMarkets.includes("usol_jobs")) order.push("usol");
        if (expiredMarkets.includes("soyuz_jobs")) order.push("soyuz");
        if (expiredMarkets.includes("dark_jobs")) order.push("dark");
        if (expiredMarkets.includes("home_jobs")) order.push("home");
        setMarketRefreshInProgress(true);
        setAutoUpdateMarketsLastRefresh(Date.now());
        var msg = { type: "COR3_REFRESH_ALL_MARKETS_SEQ" };
        if (order.length > 0) msg.order = order;
        queueMarketRefresh(msg,"pinned-market",()=>{
          for(const key of ["home_jobs","dark_jobs","soyuz_jobs","usol_jobs"])autoRefreshRetryPending[key]=false;
        });

      }
    } catch (e) {
      if (e.message && e.message.includes("Extension context invalidated")) return;
    }
  }
  var autoRefreshIntervalId = setInterval(() => checkAutoRefresh(), 1e3);

  // src/content/solvers.js
  var decryptSolverInjected = false;
  function injectDecryptSolver() {
    const epoch = lifecycleScheduler.capture('decrypt');
    if (!lifecycleScheduler.valid('decrypt', epoch) || decryptSolverInjected) return;
    decryptSolverInjected = true;
    lifecycleScheduler.prepare('decrypt').then(ticket => {
      if (!lifecycleScheduler.valid('decrypt', epoch)) return;
      if (!ticket) { decryptSolverInjected = false; return; }
      const script = document.createElement('script');
      script.dataset.cor3LifecycleTicket = ticket;
      script.src = chrome.runtime.getURL('decrypt-solver.js');
      script.onload = () => script.remove();
      script.onerror = () => { script.remove(); if (lifecycleScheduler.valid('decrypt', epoch)) decryptSolverInjected = false; };
      (document.head || document.documentElement).appendChild(script);
    });
  }
  function stopDecryptSolver() {
    lifecycleScheduler.stop('decrypt');
    decryptSolverInjected = false;
  }
  var dailyHackInjected = false;
  var dailyLifecycleTicket = null;
  var dailyLifecycleTicketEpoch = -1;
  var dailyLockGeneration = 0;
  var dailyEnabledEpoch = -1;
  function validDailyLifecycleMessage(data) {
    return !!data && typeof data.lifecycleTicket === "string" && data.lifecycleTicket === dailyLifecycleTicket && dailyValid(dailyLifecycleTicketEpoch);
  }
  function injectDailyHackSolver() {
    const epoch = lifecycleScheduler.capture('daily');
    if (!lifecycleScheduler.valid('daily', epoch) || dailyHackInjected) return;
    dailyHackInjected = true;
    lifecycleScheduler.prepare('daily').then(ticket => {
      if (!lifecycleScheduler.valid('daily', epoch)) return;
      if (!ticket) { dailyHackInjected = false;scheduleDailyHackCheck(Date.now()+300000,"solver_not_ready");return; }
      const script = document.createElement('script');
      script.dataset.cor3LifecycleTicket = ticket;
      script.src = chrome.runtime.getURL('daily-hack-solver.js');
      dailyLifecycleTicket = ticket;
      dailyLifecycleTicketEpoch = epoch;
      script.onload = () => script.remove();
      script.onerror = () => { script.remove(); if (lifecycleScheduler.valid('daily', epoch)){dailyHackInjected=false;scheduleDailyHackCheck(Date.now()+300000,"solver_load_failed");} };
      (document.head || document.documentElement).appendChild(script);
    });
  }
  function stopDailyHackSolver() {
    const task=dailyNetworkTask;
    dailyLifecycleTicket = null;
    _dailyHackStartInProgress = false;
    clearDailyHackTimer();
    lifecycleScheduler.stop('daily');
    dailyHackInjected = false;
    if(task)acknowledgeDailyHackStop(dailyEpoch()).then(result=>{
      if(result.success&&task.valid()){task.finish();if(dailyNetworkTask===task)dailyNetworkTask=null;}
    }).catch(()=>{});
  }
  function enableDailyHackCommand(reason, force) {
    lifecycleScheduler.enable("daily");
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)) return false;
    if (dailyEnabledEpoch === epoch) return true;
    dailyEnabledEpoch = epoch;
    startDailyHackAutomation(reason, force);
    return true;
  }
  async function acknowledgeDailyHackStop(epoch) {
    const observation = await globalThis.Cor3ObservableControls.probe();
    if (epoch !== dailyEpoch()) return { success: false, cor3ObservableError: "AUTOMATION_SUPERSEDED" };
    const daily = observation && observation.daily;
    const confirmed = daily && daily.state === "stopped" && daily.evidence === "observed-local-lifecycle" &&
      daily.guardClosed === true && daily.queuesInvalidated === true && daily.activeRunsAborted === true && daily.isolatedSchedulerClosed === true;
    return { success: !!confirmed, stopConfirmed: !!confirmed };
  }
  var iceWallSolverInjected = false;
  function injectIceWallSolver() {
    const epoch = lifecycleScheduler.capture('ice');
    if (!lifecycleScheduler.valid('ice', epoch) || iceWallSolverInjected) return;
    iceWallSolverInjected = true;
    lifecycleScheduler.prepare('ice').then(ticket => {
      if (!lifecycleScheduler.valid('ice', epoch)) return;
      if (!ticket) { iceWallSolverInjected = false; return; }
      const script = document.createElement('script');
      script.dataset.cor3LifecycleTicket = ticket;
      script.src = chrome.runtime.getURL('ice-wall-solver.js');
      script.onload = () => script.remove();
      script.onerror = () => { script.remove(); if (lifecycleScheduler.valid('ice', epoch)) iceWallSolverInjected = false; };
      (document.head || document.documentElement).appendChild(script);
    });
  }
  function stopIceWallSolver() {
    lifecycleScheduler.stop('ice');
    window.postMessage({ type: "COR3_STOP_ICE_WALL_SOLVER" }, "*");
    iceWallSolverInjected = false;
  }
  var simpleDecryptSolverInjected = false;
  function injectSimpleDecryptSolver() {
    const epoch = lifecycleScheduler.capture('simple');
    if (!lifecycleScheduler.valid('simple', epoch) || simpleDecryptSolverInjected) return;
    simpleDecryptSolverInjected = true;
    lifecycleScheduler.prepare('simple').then(ticket => {
      if (!lifecycleScheduler.valid('simple', epoch)) return;
      if (!ticket) { simpleDecryptSolverInjected = false; return; }
      const script = document.createElement('script');
      script.dataset.cor3LifecycleTicket = ticket;
      script.src = chrome.runtime.getURL('simple-decrypt-solver.js');
      script.onload = () => script.remove();
      script.onerror = () => { script.remove(); if (lifecycleScheduler.valid('simple', epoch)) simpleDecryptSolverInjected = false; };
      (document.head || document.documentElement).appendChild(script);
    });
  }
  function stopSimpleDecryptSolver() {
    lifecycleScheduler.stop('simple');
    simpleDecryptSolverInjected = false;
  }
  var autoJobSolverInjected = false, autoJobSolverPromise=null, autoJobTask=null,autoJobTaskStarted=false;
  function injectAutoJobSolver() {
    if(!cor3AutomationAllowed())return Promise.reject(Error('PAGE_AUTOMATION_PAUSED'));
    if(autoJobSolverPromise)return autoJobSolverPromise;
    autoJobSolverPromise=new Promise((resolve,reject)=>{
      const ticket=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
      let settled=false;const script=document.createElement('script');
      const finish=(ok)=>{if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener('message',ready);script.remove();if(ok){autoJobSolverInjected=true;resolve();}else{autoJobSolverInjected=false;reject(Error('AUTO_JOB_ENGINE_UNAVAILABLE'));}};
      const ready=event=>{if(event.source===window&&event.origin===location.origin&&event.data?.type==='COR3_AUTOJOB_ENGINE_READY'&&event.data.ticket===ticket)finish(cor3AutomationAllowed());};
      const timer=setTimeout(()=>finish(false),10000);window.addEventListener('message',ready);
      script.src=chrome.runtime.getURL('auto-job-solver.js');script.dataset.cor3EngineTicket=ticket;script.onerror=()=>finish(false);(document.head||document.documentElement).appendChild(script);
    });
    autoJobSolverPromise.catch(()=>{autoJobSolverPromise=null;});return autoJobSolverPromise;
  }
  var autoValuableSellerInjected = false;
  function injectAutoValuableSeller() {
    if (!cor3AutomationAllowed()) return;
    if (autoValuableSellerInjected) return;
    autoValuableSellerInjected = true;
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("auto-valuable-seller.js");
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    console.log("[COR3 Helper] Auto Valuable Seller engine injected");
  }
  function ensureAntiAfkEnabled() {
    if (!cor3AutomationAllowed()) return;
    window.postMessage({ type: "COR3_ANTI_AFK_TOGGLE", enabled: true }, "*");
  }
  // Current-generation onReady below owns initial solver scheduling.

  // src/content/dom-tweaks.js
  function deleteBackgroundElements() {
    const backgroundElements = [
      "#app-background",
      "#glitch-background",
      "#video-glitch",
      "#video-waves"
    ];
    backgroundElements.forEach((selector) => {
      try {
        const element = document.querySelector(selector);
        if (element) {
          element.remove();
          console.log("[COR3 Helper] Deleted background element:", selector);
        }
      } catch (e) {
      }
    });
  }
  Cor3CenterStore.get("disableBackground", (result) => {
    if (result.disableBackground) {
      setTimeout(() => {
        deleteBackgroundElements();
      }, 1e3);
    }
  });
  var networkFogObserver = null;
  function isNetworkMapVisible() {
    const divs = document.querySelectorAll("div");
    for (const div of divs) {
      if (div.textContent.trim() === "Network map") return true;
    }
    return false;
  }
  function hideNetworkFogVideos() {
    const videos = document.querySelectorAll("video");
    videos.forEach((v) => {
      const src = v.getAttribute("src") || "";
      if (src.includes("/video/network-map/fog.mp4") || src.includes("/video/network-map/fog_layer_2.mp4")) {
        v.style.display = "none";
        v.pause();
        v.setAttribute("data-cor3-fog-hidden", "true");
      }
    });
  }
  function showNetworkFogVideos() {
    const hiddenVideos = document.querySelectorAll('[data-cor3-fog-hidden="true"]');
    hiddenVideos.forEach((v) => {
      v.style.display = "";
      v.removeAttribute("data-cor3-fog-hidden");
      v.play().catch(() => {
      });
    });
  }
  function startNetworkFogObserver() {
    if (networkFogObserver) return;
    networkFogObserver = new MutationObserver(() => {
      if (isNetworkMapVisible()) {
        hideNetworkFogVideos();
      }
    });
    networkFogObserver.observe(document.body, { childList: true, subtree: true });
  }
  function stopNetworkFogObserver() {
    if (networkFogObserver) {
      networkFogObserver.disconnect();
      networkFogObserver = null;
    }
  }
  Cor3CenterStore.get("disableNetworkFog", (result) => {
    if (result.disableNetworkFog) {
      setTimeout(() => {
        hideNetworkFogVideos();
        startNetworkFogObserver();
      }, 1e3);
    }
  });
  var COR3_NOTIF_LEFT_STYLE_ID = "cor3-notifications-left-style";
  function applyNotificationsLeft() {
    if (document.getElementById(COR3_NOTIF_LEFT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = COR3_NOTIF_LEFT_STYLE_ID;
    style.textContent = `
        .Toastify__toast-container--bottom-right {
            left: 16px !important;
            right: auto !important;
            margin-bottom: 35px;
        }
        [data-component-name="NotificationsHistory"] {
            left: 0 !important;
            right: auto !important;
            align-items: flex-start;
        }
        [data-component-name="NotificationsHistory"] > button:first-of-type {
            transform: scaleX(-1);
            display: flex;
        }
        [data-component-name="NotificationsHistory"] .sticker-content {
            color: transparent;               /* hide original text */
            position: relative;
        }
        [data-component-name="NotificationsHistory"] .sticker-content::before {
            content: "Notifications";         /* duplicate the word */
            position: absolute;
            left: 0;
            transform: scaleX(-1);
            color: #FFFFFF;   /* re\u2011apply the original colour */
            white-space: pre;                 /* keep spacing */
        }
        [data-component-name="NotificationsHistory"] .go3673730358,
        [data-component-name="NotificationsHistory"] > div:last-child {
            border-top-left-radius: 0px;
            border-top-right-radius: 16px;
        }
    `;
    (document.head || document.documentElement).appendChild(style);
  }
  function removeNotificationsLeft() {
    const el = document.getElementById(COR3_NOTIF_LEFT_STYLE_ID);
    if (el) el.remove();
  }
  Cor3CenterStore.get("moveNotificationsLeft", (result) => {
    if (result.moveNotificationsLeft) {
      setTimeout(() => {
        applyNotificationsLeft();
      }, 1e3);
    }
  });

  // src/content/log-writers.js
  init_helpers();
  var _autoJobLogQueue = [];
  var _autoJobLogFlushTimer = null;
  var _autoJobLogFlushing = false;
  function _flushAutoJobLogs() {
    _autoJobLogFlushTimer = null;
    if (_autoJobLogFlushing || _autoJobLogQueue.length === 0 || !isContextValid()) return;
    _autoJobLogFlushing = true;
    const pending = _autoJobLogQueue.splice(0);
    Cor3CenterStore.get("autoJobsDebugLogs", (result) => {
      if (!isContextValid()) {
        _autoJobLogFlushing = false;
        return;
      }
      const logs = Array.isArray(result.autoJobsDebugLogs) ? result.autoJobsDebugLogs : [];
      for (const entry of pending) logs.push(entry);
      if (logs.length > 200) logs.splice(0, logs.length - 200);
      Cor3CenterStore.set({ autoJobsDebugLogs: logs }, () => {
        _autoJobLogFlushing = false;
        if (_autoJobLogQueue.length > 0) {
          _flushAutoJobLogs();
        }
      });
    });
  }
  function queueAutoJobLog(msg, level) {
    _autoJobLogQueue.push({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), msg, level: level || "info" });
    if (!_autoJobLogFlushTimer && !_autoJobLogFlushing) {
      _autoJobLogFlushTimer = setTimeout(_flushAutoJobLogs, 100);
    }
    if (typeof cor3LogEntry === "function") cor3LogEntry("auto-jobs", msg, level || "info");
  }
  var _valuableLogQueue = [];
  var _valuableLogFlushTimer = null;
  var _valuableLogFlushing = false;
  function _flushValuableLogs() {
    _valuableLogFlushTimer = null;
    if (_valuableLogFlushing || _valuableLogQueue.length === 0 || !isContextValid()) return;
    _valuableLogFlushing = true;
    const pending = _valuableLogQueue.splice(0);
    Cor3CenterStore.get("valuableDebugLogs", (result) => {
      if (!isContextValid()) {
        _valuableLogFlushing = false;
        return;
      }
      const logs = Array.isArray(result.valuableDebugLogs) ? result.valuableDebugLogs : [];
      for (const entry of pending) logs.push(entry);
      if (logs.length > 200) logs.splice(0, logs.length - 200);
      Cor3CenterStore.set({ valuableDebugLogs: logs }, () => {
        _valuableLogFlushing = false;
        if (_valuableLogQueue.length > 0) {
          _flushValuableLogs();
        }
      });
    });
  }
  function queueValuableLog(msg, level) {
    _valuableLogQueue.push({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), msg, level: level || "info" });
    if (!_valuableLogFlushTimer && !_valuableLogFlushing) {
      _valuableLogFlushTimer = setTimeout(_flushValuableLogs, 100);
    }
    if (typeof cor3LogEntry === "function") cor3LogEntry("auto-valuable", msg, level || "info");
  }

  // src/content/ws-relay.js
  init_helpers();
  init_auto_send();
  init_auto_update_markets();

  // src/content/message-listener.js
  init_helpers();
  init_auto_update_markets();
  var _dailyHackStartInProgress = false;
  var _dailyHackAutoStarted = false;
  var _dailyHackAutoStartRetries = 0;
  var _dailyHackTimer = null;
  var _dailyHackOwnerId = `daily-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  var DAILY_HACK_LOCK_TTL_MS = 10 * 60 * 1e3;
  var DAILY_HACK_RETRY_DELAY_MS = 5 * 60 * 1e3;
  var DAILY_HACK_NEXT_GRACE_MS = 30 * 1e3;
  var DAILY_HACK_FALLBACK_DELAY_MS = 15 * 60 * 1e3;
  var dailyNetworkTask=null;
  function postDailyHackDiag(step, message, details, level) {
    runtimeLog?.log("daily."+step,message,details,level);
    window.postMessage({
      type: "COR3_DAILY_HACK_LOG",
      timestamp: Date.now(),
      step,
      message,
      level: level || "info",
      details: details || null
    }, "*");
  }
  function clearDailyHackTimer() {
    if (_dailyHackTimer) {
      clearTimeout(_dailyHackTimer);
      _dailyHackTimer = null;
    }
  }
  function getNextDailyCheckAt(data, fallbackDelayMs) {
    return Cor3DailySchedule.plan({now:Date.now(),state:data,intervalMinutes:15}).at;
  }
  function scheduleDailyHackCheck(at, reason) {
    if (!dailyValid(dailyEpoch())) return;
    if (!cor3AutomationAllowed()) return;
    clearDailyHackTimer();
    const now = Date.now();
    const target = Math.max(now + 1e3, Number(at) || now + DAILY_HACK_FALLBACK_DELAY_MS);
    const delay = target - now;
    Cor3CenterStore.set({ dailyHackNextCheckAt: target });
    postDailyHackDiag("schedule.next", "Next daily hack check scheduled", {
      reason,
      at: new Date(target).toISOString(),
      delayMs: delay
    });
    if(dailyNetworkTask){dailyNetworkTask.finish();dailyNetworkTask=null;}
    _dailyHackTimer = dailyLater(() => {
      _dailyHackTimer = null;
      startDailyHackAutomation("scheduled");
    }, Math.min(delay, 2147483647));
  }
  function scheduleDailyHackFromData(data, reason, fallbackDelayMs) {
    scheduleDailyHackCheck(getNextDailyCheckAt(data, fallbackDelayMs), reason);
  }
  function setDailyHackResult(status, reason) {
    Cor3CenterStore.set({
      dailyHackLastRunAt: Date.now(),
      dailyHackLastResult: { status, reason: reason || null, at: Date.now() }
    });
  }
  function releaseDailyHackLock() {
    const closingEpoch = dailyEpoch();
    const closingLock = dailyLockGeneration;
    Cor3CenterStore.get("dailyHackRunLock", ({ dailyHackRunLock }) => {
      if (closingEpoch !== dailyEpoch() || closingLock !== dailyLockGeneration) return;
      if (dailyHackRunLock && dailyHackRunLock.owner === _dailyHackOwnerId) {
        Cor3CenterStore.remove("dailyHackRunLock");
      }
    });
  }
  function acquireDailyHackLock(callback) {
    dailyLockGeneration++;
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)) return;
    Cor3CenterStore.get("dailyHackRunLock", ({ dailyHackRunLock }) => {
      if (!dailyValid(epoch)) return;
      const now = Date.now();
      if (dailyHackRunLock && dailyHackRunLock.owner !== _dailyHackOwnerId && now - (dailyHackRunLock.startedAt || 0) < DAILY_HACK_LOCK_TTL_MS) {
        postDailyHackDiag("lock.busy", "Another tab is already running daily hack", {
          owner: dailyHackRunLock.owner,
          ageMs: now - (dailyHackRunLock.startedAt || 0)
        }, "warn");
        callback(false);
        return;
      }
      Cor3CenterStore.set({
        dailyHackRunLock: { owner: _dailyHackOwnerId, startedAt: now }
      }, () => {
      if (!dailyValid(epoch)) return;
        Cor3CenterStore.get("dailyHackRunLock", ({ dailyHackRunLock: current }) => {
      if (!dailyValid(epoch)) return;
          callback(!!current && current.owner === _dailyHackOwnerId);
        });
      });
    });
  }
  function fetchDailyClaimState(token, callback) {
    fetch("https://svc-corie.cor3.gg/api/user-daily-claim", dailyReadOptions(token)).then((r) => {if(!r.ok)throw Error("DAILY_HTTP_"+r.status);return r.json();}).then((data) => {if(!data||typeof data.hasClaimedToday!=="boolean")throw Error("DAILY_STATE_INVALID");callback(null,data);}).catch((err) => callback(err, null));
  }
  function startDailyHackAutomation(reason,force) {
    const epoch=dailyEpoch();if(!dailyValid(epoch)||!cor3AutomationAllowed())return;
    if(dailyHackInjected||_dailyHackStartInProgress)return;
    Cor3CenterStore.get(["autoDailyHackEnabled","dailyHackNextCheckAt","dailyOpsData"],settings=>{
      if(!dailyValid(epoch)||!settings.autoDailyHackEnabled)return;
      const storedNext=Number(settings.dailyHackNextCheckAt)||0;
      const next=storedNext?Math.min(storedNext,Cor3DailySchedule.plan({now:Date.now(),state:settings.dailyOpsData}).at):0;
      if(!force&&next>Date.now()){scheduleDailyHackCheck(next,"not_due");return;}
      _automationEnqueue("auto-daily",task=>{if(!dailyValid(epoch)||!task.valid()){task.finish();return;}dailyNetworkTask=task;startDailyHackExclusive(reason,force);});
    });
  }
  function startDailyHackExclusive(reason, force) {
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)||!cor3AutomationAllowed()) {dailyNetworkTask?.finish();dailyNetworkTask=null;return;}
    const isAutoStart = reason === "load" || reason === "scheduled";
    if (reason === "load" && _dailyHackAutoStarted) return;
    if (dailyHackInjected || _dailyHackStartInProgress) {
      postDailyHackDiag("auto.start", "Daily hack start already in progress", { reason }, "warn");
      return;
    }
    // Claim the pending start before the first asynchronous read.
    _dailyHackStartInProgress = true;
    Cor3CenterStore.get(["autoDailyHackEnabled", "helperMode"], (settings) => {
      if (!dailyValid(epoch)) return;
      if (!settings.autoDailyHackEnabled) {
        _dailyHackStartInProgress = false;dailyNetworkTask?.finish();dailyNetworkTask=null;
        if (isAutoStart) postDailyHackDiag("auto.start", "Skipped: autoDailyHackEnabled is off", { reason });
        return;
      }
      if (settings.helperMode) {
        _dailyHackStartInProgress = false;dailyNetworkTask?.finish();dailyNetworkTask=null;
        postDailyHackDiag("auto.start", "Skipped: Helper-Only Mode is enabled", { reason }, "warn");
        return;
      }
      dailyEnabledEpoch = epoch;
      Cor3CenterStore.get("dailyHackNextCheckAt", (local) => {
      if (!dailyValid(epoch)) return;
        const nextAt = Number(local.dailyHackNextCheckAt) || 0;
        if (!force && nextAt > Date.now()) {
          postDailyHackDiag("schedule.skip", "Daily hack check is not due yet", {
            reason,
            nextCheckAt: new Date(nextAt).toISOString()
          });
          _dailyHackStartInProgress = false;
          scheduleDailyHackCheck(nextAt, "not_due");
          return;
        }
        _dailyHackStartInProgress = true;
        postDailyHackDiag(isAutoStart ? "auto.start" : "toggle.enable", "Auto Daily Hacking start requested", {
          reason,
          attempt: _dailyHackAutoStartRetries
        });
        withDailyToken((token, sessionValid) => {
          if (!dailyValid(epoch)) return;
          if (!token) {
            _dailyHackStartInProgress = false;
            postDailyHackDiag("auto.token", "No bearer token yet", {
              reason,
              attempt: _dailyHackAutoStartRetries
            }, "warn");
            dailyNetworkTask?.finish();dailyNetworkTask=null;
            if (reason === "load" && _dailyHackAutoStartRetries < 10) {
              _dailyHackAutoStartRetries++;
              dailyLater(() => startDailyHackAutomation("load"), 3e3);
            } else {
              scheduleDailyHackCheck(Date.now() + 60 * 1e3, "waiting_for_token");
            }
            return;
          }
          postDailyHackDiag("auto.token", "Bearer token found \u2014 checking daily claim state", {
            reason,
            tokenLength: token.length
          });
          fetchDailyClaimState(token, (err, data) => {
            if (!dailyValid(epoch)) return;
            if (!sessionValid()) err = Error("DAILY_SESSION_CHANGED");
            if (err) { _dailyHackStartInProgress = false; }
            if (err) {
              postDailyHackDiag("auto.api", "Daily claim API failed \u2014 will retry later", {
                reason,
                error: String(err && err.message || err)
              }, "warn");
              scheduleDailyHackCheck(Date.now() + DAILY_HACK_RETRY_DELAY_MS, "api_failed");
              return;
            }
            if (data) {
              Cor3CenterStore.set({ dailyOpsData: data, dailyOpsUpdatedAt: Date.now() });
              fetchDailyRewards(token);
            }
            postDailyHackDiag("auto.api", "Daily claim state parsed", {
              reason,
              hasClaimedToday: !!(data && data.hasClaimedToday),
              nextTaskTime: data && data.nextTaskTime,
              currentStreak: data && data.currentStreak
            });
            if (data && data.hasClaimedToday) {
              postDailyHackDiag("auto.skip", "Daily already claimed today \u2014 waiting for next reset", { reason }, "warn");
              _dailyHackStartInProgress = false;
              setDailyHackResult("claimed", "already_claimed");
              scheduleDailyHackFromData(data, "claimed", DAILY_HACK_FALLBACK_DELAY_MS);
              _dailyHackAutoStarted = true;
              _dailyHackAutoStartRetries = 0;
              return;
            }
            acquireDailyHackLock((locked) => {
      if (!dailyValid(epoch)) return;
              _dailyHackStartInProgress = false;
              if (!locked) {
                scheduleDailyHackCheck(Date.now() + 2 * 60 * 1e3, "lock_busy");
                return;
              }
              postDailyHackDiag("auto.inject", "Injecting daily hack solver", { reason });
              ensureAntiAfkEnabled();
              injectDailyHackSolver();
              _dailyHackAutoStarted = true;
              _dailyHackAutoStartRetries = 0;
              setDailyHackResult("running", reason);
            });
          });
        });
      });
    });
  }
  function handleDailyHackRunFinished(result) {
    dailyHackInjected = false;
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)) return;
    if (!cor3AutomationAllowed()) return;
    _dailyHackStartInProgress = true;
    releaseDailyHackLock();
    const success = !!(result && result.success);
    const reason = result && result.reason || (success ? "success" : "failed");
    setDailyHackResult(success ? "success" : "failed", reason);
    Cor3CenterStore.get(["autoDailyHackEnabled", "helperMode"], (settings) => {
      if (!dailyValid(epoch)) return;
      if (!settings.autoDailyHackEnabled || settings.helperMode) {
        clearDailyHackTimer();
        _dailyHackStartInProgress = false;
        return;
      }
      if (!success) {
        postDailyHackDiag("schedule.retry", "Daily hack failed \u2014 retrying later", {
          retryInMs: DAILY_HACK_RETRY_DELAY_MS
        }, "warn");
        scheduleDailyHackCheck(Date.now() + DAILY_HACK_RETRY_DELAY_MS, "retry_after_failure");
        _dailyHackStartInProgress = false;
        return;
      }
      withDailyToken((bearerToken, sessionValid) => {
      if (!dailyValid(epoch)) return;
        if (!bearerToken) {
          scheduleDailyHackCheck(Date.now() + DAILY_HACK_FALLBACK_DELAY_MS, "success_no_token");
          _dailyHackStartInProgress = false;
          return;
        }
        fetchDailyClaimState(bearerToken, (err, data) => {
          if (!dailyValid(epoch)) return;
          if (!sessionValid()) err = Error("DAILY_SESSION_CHANGED");
          if (err) {
            scheduleDailyHackCheck(Date.now() + DAILY_HACK_FALLBACK_DELAY_MS, "success_api_failed");
            _dailyHackStartInProgress = false;
            return;
          }
          if (data) {
            Cor3CenterStore.set({ dailyOpsData: data, dailyOpsUpdatedAt: Date.now() });
          }
          scheduleDailyHackFromData(data, "success", DAILY_HACK_FALLBACK_DELAY_MS);
          _dailyHackStartInProgress = false;
        });
      });
    });
  }
  function autoStartDailyHackOnLoad() {
    dailyLater(() => startDailyHackAutomation("load"), 3e3);
  }
  function checkDailyHackIfDue(reason) {
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)) return;
    if (!cor3AutomationAllowed()) return;
    if (_dailyHackStartInProgress) return;
    Cor3CenterStore.get("autoDailyHackEnabled", (settings) => {
      if (!dailyValid(epoch)) return;
      if (!settings.autoDailyHackEnabled) return;
      Cor3CenterStore.get("dailyHackNextCheckAt", ({ dailyHackNextCheckAt }) => {
      if (!dailyValid(epoch)) return;
        const nextAt = Number(dailyHackNextCheckAt) || 0;
        if (!nextAt || nextAt <= Date.now()) {
          startDailyHackAutomation(reason, false);
        }
      });
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDailyHackIfDue("visibility");
  });
  window.addEventListener("focus", () => checkDailyHackIfDue("focus"));
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.autoDailyHackEnabled) return;
    if (!changes.autoDailyHackEnabled.newValue) {
      stopDailyHackSolver();
      _dailyHackStartInProgress = false;
      clearDailyHackTimer();
      releaseDailyHackLock();
      postDailyHackDiag("toggle.disable", "Auto Daily Hacking disabled via storage");
    } else {
      enableDailyHackCommand("storage", false);
    }
  });
  window.addEventListener("beforeunload", () => {
    clearDailyHackTimer();
    releaseDailyHackLock();
  });
  function fetchDailyRewards(token) {
    const session = dailySession;
    const epoch = dailyEpoch();
    if (!dailyValid(epoch)) return;
    fetch("https://svc-corie.cor3.gg/api/user-daily-claim/rewards", dailyReadOptions(token)).then((r) => r.ok ? r.json() : null).then((data) => {
      if (!dailyValid(epoch) || !currentDailySession(session)) return;
      if (data && Array.isArray(data)) {
        Cor3CenterStore.set({ dailyRewardsData: data });
      }
    }).catch(() => {
    });
  }
  function setupMessageListener() {
    const localPermit=Symbol('inpage-controls');
    const receive=(request,sender,sendResponse,permit)=>{
      if(request?.type==='cor3-daily-wake'){
        if(sender?.id===chrome.runtime.id&&!sender.tab&&request.documentId===globalThis.Cor3CenterIdentity?.snapshot()?.documentId&&cor3AutomationAllowed()){
          checkDailyHackIfDue('alarm');sendResponse({ok:true});
        }
        return;
      }
      if(permit!==localPermit&&sender?.id!==chrome.runtime.id)return;
      if(request?.batchId!==undefined&&(permit!==localPermit||typeof request.batchId!=='string'||!/^\d{1,9}$/.test(request.batchId))){sendResponse({success:false});return;}
      if(request?.centerExpectedDocumentId!==undefined&&request.centerExpectedDocumentId!==Cor3Automation.contentDocumentId)return;
      if(request?.centerIdentityDocumentId!==undefined&&request.centerIdentityDocumentId!==globalThis.Cor3CenterIdentity?.snapshot()?.documentId)return;
      // Route only this listener's action protocol; bridge type messages have their own validator.
      if (!request || Object.prototype.hasOwnProperty.call(request, "type") || !["requestExpeditions","requestNetworkMap","devTcTestReachability","requestStash","requestSpecialists","purchaseSpecialist","requestLoadout","equipHardware","equipSoftware","unequipSoftware","requestMarket","refreshMarket","requestDarkMarket","refreshDarkMarket","requestSoyuzMarket","refreshSoyuzMarket","requestUsolMarket","refreshUsolMarket","refreshAllMarketsSeq","leaveStash","sellItem","batchSellItems","keepWorkerAlive","updateAutoRefresh","toggleDecryptSolver","toggleIceWallSolver","toggleSimpleDecryptSolver","toggleDailyHackSolver","respondDecision","requestArchivedExpeditions","requestMercenaries","requestUsolMercenaries","requestExpeditionConfig","launchExpedition","openContainer","fetchDailyOps","disableBackground","enableBackground","disableNetworkFog","enableNetworkFog","moveNotificationsLeft","moveNotificationsRight","getVersionFallbacks","startAutoJobs","stopAutoJobs","cancelJobBatch","enableHackSolvers","dismissFailedJobs","autoCleanupFailedJobs","devtoolsSendWs","startValuableSearch","startValuableSeller","stopValuable","forceMaintenanceBatch","startIpSearch"].includes(request.action)) return;
      if (request && /^cor3Master/.test(request.action || "")) return;
      const threeRequest=['toggleDecryptSolver','toggleIceWallSolver','toggleSimpleDecryptSolver'].includes(request.action);
      if (!(threeRequest ? (request.solverExpectedDocumentId===Cor3Automation.contentDocumentId && (request.enabled===false || Cor3ThreeAutomation.allowed())) : Cor3Automation.permitsRequest(request))) {
        sendResponse({ success: false, ok: false, ...(["toggleDailyHackSolver", "toggleIceWallSolver", "toggleDecryptSolver", "toggleSimpleDecryptSolver"].includes(request.action) ? { cor3ObservableError: "AUTOMATION_GATE_CLOSED" } : {}), error: "Helper-only mode is paused. Enable automation and refresh this game page before changing game state." });
        return;
      }
      if (request.action === "requestExpeditions") {
        window.postMessage({ type: "COR3_REQUEST_EXPEDITIONS" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestNetworkMap") {
        window.postMessage({ type: "COR3_REQUEST_NETWORK_MAP" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "devTcTestReachability") {
        window.postMessage({ type: "COR3_DEV_TC_TEST_REACHABILITY", serverId: request.serverId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestStash") {
        window.postMessage({ type: "COR3_REQUEST_STASH" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestSpecialists") {
        window.postMessage({ type: "COR3_REQUEST_SPECIALISTS" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "purchaseSpecialist") {
        window.postMessage({ type: "COR3_PURCHASE_SPECIALIST", specialistType: request.specialistType, kind: request.kind, level: request.level, priceId: request.priceId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestLoadout") {
        window.postMessage({ type: "COR3_REQUEST_LOADOUT" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "equipHardware") {
        window.postMessage({ type: "COR3_EQUIP_HARDWARE", moduleConfigId: request.moduleConfigId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "equipSoftware") {
        window.postMessage({ type: "COR3_EQUIP_SOFTWARE", moduleConfigId: request.moduleConfigId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "unequipSoftware") {
        window.postMessage({ type: "COR3_UNEQUIP_SOFTWARE", moduleConfigId: request.moduleConfigId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestMarket") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "refreshMarket") {
        const queued=queueMarketRefresh({type:"COR3_REFRESH_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "requestDarkMarket") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_DARK_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "refreshDarkMarket") {
        const queued=queueMarketRefresh({type:"COR3_REFRESH_DARK_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "requestSoyuzMarket") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_SOYUZ_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "refreshSoyuzMarket") {
        const queued=queueMarketRefresh({type:"COR3_REFRESH_SOYUZ_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "requestUsolMarket") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_USOL_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "refreshUsolMarket") {
        const queued=queueMarketRefresh({type:"COR3_REFRESH_USOL_MARKET"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "refreshAllMarketsSeq") {
        const batchId=request.batchId,owner=batchId?'job-batch-refresh':undefined;
        if(batchId&&[network().snapshot().running,...network().snapshot().waiting].some(t=>t?.type==='job-batch-refresh')){sendResponse({success:false});return;}
        const receipt=batchId?{id:batchId,scope:networkScope(),refresh:{}}:null;if(receipt)jobBatchReceipt=receipt;
        const queued=queueMarketRefresh({type:"COR3_REFRESH_ALL_MARKETS_SEQ",skipLots:!!request.skipLots,order:request.order},owner,
          task=>{if(receipt===jobBatchReceipt&&receipt?.refresh.ticket===task.id)receipt.refresh.finishedAt=Date.now();},
          task=>{if(receipt===jobBatchReceipt&&receipt)Object.assign(receipt.refresh,{ticket:task.id,startedAt:Date.now()});});
        const q=network().snapshot(),ticket=[q.running,...q.waiting].find(t=>t?.type===(owner||'manual-market:COR3_REFRESH_ALL_MARKETS_SEQ'))?.id;
        if(receipt)receipt.refresh.ticket=ticket;
        sendResponse({success:queued!=="master-paused",queued,networkTicket:ticket});
      } else if (request.action === "leaveStash") {
        window.postMessage({ type: "COR3_LEAVE_STASH" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "sellItem") {
        window.postMessage({ type: "COR3_SELL_ITEM", itemId: request.itemId, quantity: request.quantity || 1, skipStashRefresh: !!request.skipStashRefresh }, "*");
        sendResponse({ success: true });
      } else if (request.action === "batchSellItems") {
        const items = request.items || [];
        console.log("[COR3 Helper] batchSellItems requested, n=", Array.isArray(items) ? items.length : 0);
        if (!Array.isArray(items) || items.length === 0) {
          sendResponse({ success: true, count: 0 });
          return;
        }
        let bi = 0;
        (function sellNextOne() {
          if (bi >= items.length) {
            sendResponse({ success: true, count: items.length });
            return;
          }
          const it = items[bi++];
          window.postMessage({ type: "COR3_SELL_ITEM", itemId: it.itemId, quantity: it.quantity || 1, skipStashRefresh: true }, "*");
          setTimeout(sellNextOne, 800 + Math.floor(Math.random() * 200));
        })();
        return true;
      } else if (request.action === "keepWorkerAlive") {
        window.postMessage({ type: "COR3_KEEP_ALIVE" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "updateAutoRefresh") {
        if (request.autoRefresh) {
          setAutoRefreshSettings(request.autoRefresh);
        }
        sendResponse({ success: true });
      } else if (request.action === "toggleDecryptSolver") {
        if (request.enabled) lifecycleScheduler.enable("decrypt");
        if (request.enabled) {
          ensureAntiAfkEnabled();
          injectDecryptSolver();
        } else {
          stopDecryptSolver();
        }
        sendResponse({ success: true });
      } else if (request.action === "toggleIceWallSolver") {
        if (request.enabled) lifecycleScheduler.enable("ice");
        if (request.enabled) {
          ensureAntiAfkEnabled();
          injectIceWallSolver();
        } else {
          stopIceWallSolver();
        }
        sendResponse({ success: true });
      } else if (request.action === "toggleSimpleDecryptSolver") {
        if (request.enabled) lifecycleScheduler.enable("simple");
        if (request.enabled) {
          ensureAntiAfkEnabled();
          injectSimpleDecryptSolver();
        } else {
          stopSimpleDecryptSolver();
        }
        sendResponse({ success: true });
      } else if (request.action === "toggleDailyHackSolver") {
        if (typeof request.enabled !== "boolean") {
          sendResponse({ success: false, cor3ObservableError: "AUTOMATION_COMMAND_FAILED" });
        } else if (request.enabled) {
          const accepted = enableDailyHackCommand("toggle", true);
          sendResponse({ success: accepted, ...(accepted ? {} : { cor3ObservableError: "AUTOMATION_GATE_CLOSED" }) });
        } else {
          _dailyHackAutoStarted = false;
          _dailyHackAutoStartRetries = 0;
          stopDailyHackSolver();
          releaseDailyHackLock();
          postDailyHackDiag("toggle.disable", "Auto Daily Hacking disabled");
          acknowledgeDailyHackStop(dailyEpoch()).then(sendResponse, () => sendResponse({ success: false, stopConfirmed: false }));
          return true;
        }
      } else if (request.action === "respondDecision") {
        window.postMessage({
          type: "COR3_RESPOND_DECISION",
          expeditionId: request.expeditionId,
          messageId: request.messageId,
          selectedOption: request.selectedOption
        }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestArchivedExpeditions") {
        window.postMessage({ type: "COR3_REQUEST_ARCHIVED_EXPEDITIONS" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "requestMercenaries") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_MERCENARIES"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "requestUsolMercenaries") {
        const queued=queueMarketRefresh({type:"COR3_REQUEST_USOL_MERCENARIES"});
        sendResponse({success:queued!=="master-paused",queued});
      } else if (request.action === "requestExpeditionConfig") {
        window.postMessage({ type: "COR3_REQUEST_EXPEDITION_CONFIG", mercenaryId: request.mercenaryId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "launchExpedition") {
        Cor3CenterStore.set({ lastExpeditionLaunchData: request.config });
        window.postMessage({ type: "COR3_LAUNCH_EXPEDITION", config: request.config }, "*");
        sendResponse({ success: true });
      } else if (request.action === "openContainer") {
        window.postMessage({ type: "COR3_OPEN_CONTAINER", expeditionId: request.expeditionId }, "*");
        sendResponse({ success: true });
      } else if (request.action === "fetchDailyOps") {
        withDailyToken((token, sessionValid) => {
          if (!token) {
            sendResponse({ error: "no token" });
            return;
          }
          fetch("https://svc-corie.cor3.gg/api/user-daily-claim", dailyReadOptions(token)).then((r) => {
            if (r.ok) return r.json();
            if (r.status === 400 || r.status === 401 || r.status === 403) return r.json().then((d) => {
              throw new Error(d.message || "token_expired");
            }).catch(() => {
              throw new Error("token_expired");
            });
            throw Error("DAILY_HTTP_" + r.status);
          }).then((data) => {
            if (!sessionValid()) { sendResponse({error:"PAGE_CHANGED"}); return; }
            if (typeof data?.hasClaimedToday !== "boolean") throw Error("DAILY_STATE_INVALID");
            return Cor3CenterStore.set({dailyOpsData:data, dailyOpsUpdatedAt:Date.now(), dailyOpsError:null}).then(() => {
              if (!sessionValid()) { sendResponse({error:"PAGE_CHANGED"}); return; }
              fetchDailyRewards(token);
              sendResponse({data});
            });
          }).catch((e) => {
            cor3LogError("content.js", e, { action: "fetchDailyOps" });
            sendResponse({ error: e.message || "fetch failed" });
          });
        });
        return true;
      } else if (request.action === "disableBackground") {
        Cor3CenterStore.set({ disableBackground: true });
        deleteBackgroundElements();
        console.log("[COR3 Helper] Background elements deleted");
        sendResponse({ success: true });
      } else if (request.action === "enableBackground") {
        Cor3CenterStore.set({ disableBackground: false });
        console.log("[COR3 Helper] Background elements will be restored on page reload");
        sendResponse({ success: true });
      } else if (request.action === "disableNetworkFog") {
        Cor3CenterStore.set({ disableNetworkFog: true });
        startNetworkFogObserver();
        hideNetworkFogVideos();
        console.log("[COR3 Helper] Network fog disabled");
        sendResponse({ success: true });
      } else if (request.action === "enableNetworkFog") {
        Cor3CenterStore.set({ disableNetworkFog: false });
        stopNetworkFogObserver();
        showNetworkFogVideos();
        console.log("[COR3 Helper] Network fog re-enabled");
        sendResponse({ success: true });
      } else if (request.action === "moveNotificationsLeft") {
        Cor3CenterStore.set({ moveNotificationsLeft: true });
        applyNotificationsLeft();
        console.log("[COR3 Helper] Notifications moved to left");
        sendResponse({ success: true });
      } else if (request.action === "moveNotificationsRight") {
        Cor3CenterStore.set({ moveNotificationsLeft: false });
        removeNotificationsLeft();
        console.log("[COR3 Helper] Notifications moved back to right");
        sendResponse({ success: true });
      } else if (request.action === "getVersionFallbacks") {
        sendResponse({
          webVersion: window.__cor3WebVersion,
          systemVersion: window.__cor3SystemVersion,
          patchVersion: window.__cor3PatchVersion
        });
      } else if (request.action === "startAutoJobs") {
        if(request.freshMarketRead){
          const fresh=request.freshMarketRead,prior=jobBatchReceipt,s=networkScope();
          if(permit!==localPermit||!request.batchId||!s||autoJobTask?.valid()||!Array.isArray(fresh.markets)||!fresh.markets.length||fresh.markets.some(k=>!Object.hasOwn(Cor3JobBatchFactory.markets,k))||!Number.isFinite(fresh.after)||fresh.after>Date.now()+1000||(prior&&prior.scope.documentId===s.documentId&&prior.execution&&!prior.execution.finishedAt&&!prior.execution.cancelled)){sendResponse({success:false});return;}
          jobBatchReceipt={id:request.batchId,scope:s,refresh:{startedAt:fresh.after,finishedAt:Date.now(),markets:fresh.markets},execution:{},source:'auto-market'};
        }
        const receipt=request.batchId?jobBatchReceipt:null;
        if(request.batchId&&(!receipt||receipt.id!==request.batchId||receipt.cancelled||receipt.scope.documentId!==networkScope()?.documentId)){sendResponse({success:false});return;}
        ensureAntiAfkEnabled();
        const jobs = request.jobs;
        const settings = request.settings || {};
        const result2 = _automationEnqueue("auto-jobs", async task => {
          if(!task.valid())return;autoJobTask=task;autoJobTaskStarted=false;setAutoJobsActive(true);
          if(receipt===jobBatchReceipt&&receipt)Object.assign(receipt.execution||(receipt.execution={}),{ticket:task.id,startedAt:Date.now()});
          try{
            await injectAutoJobSolver();if(!task.valid())return;
            // A timed minigame may have opened while the engine was loading. Do not steal its endpoint.
            let waitingForMinigame=false;
            while(task.valid()&&globalThis.Cor3PageBusy?.()===true){
              if(!waitingForMinigame){waitingForMinigame=true;runtimeLog?.log('jobs.wait.minigame','限时小游戏进行中，市场任务等待');}
              if(receipt===jobBatchReceipt&&receipt)receipt.execution.waitingFor='minigame';
              task.renew?.();await new Promise(resolve=>setTimeout(resolve,500));
            }
            if(!task.valid())return;if(receipt===jobBatchReceipt&&receipt)delete receipt.execution.waitingFor;
            const lockData=await Cor3CenterStore.get("autoJobsLockedJobs");if(!task.valid())return;
            settings.lockedJobs=(lockData.autoJobsLockedJobs||[]).filter(j=>j.lockExpiresAt&&new Date(j.lockExpiresAt).getTime()>Date.now());
            autoJobTaskStarted=true;if(receipt===jobBatchReceipt&&receipt)receipt.execution.dispatchedAt=Date.now();window.postMessage({type:'COR3_AUTOJOB_START',jobs,settings,runTicket:task.id},location.origin);
          }catch(e){if(task.valid()){const reason=['AUTO_JOB_ENGINE_UNAVAILABLE','PAGE_AUTOMATION_PAUSED'].includes(e?.message)?e.message:'PAGE_JOB_START_UNCONFIRMED';if(receipt===jobBatchReceipt&&receipt)Object.assign(receipt.execution,{finishedAt:Date.now(),error:'PAGE_JOB_START_UNCONFIRMED',reason});runtimeLog?.log('jobs.start.failed','任务执行器启动失败：'+reason,null,'warn');setAutoJobsActive(false);autoJobTask=null;Cor3CenterStore.set({autoJobsRunning:false});task.finish();}}
        });
        const q=network().snapshot(),ticket=[q.running,...q.waiting].find(t=>t?.type==='auto-jobs')?.id;
        if(receipt&&['started','queued'].includes(result2))Object.assign(receipt.execution||(receipt.execution={}),{ticket});
        sendResponse({ success: true, queueResult: result2, networkTicket:ticket });
      } else if (request.action === "cancelJobBatch") {
        const receipt=jobBatchReceipt,s=networkScope();
        if(permit!==localPermit||!receipt||request.batchId!==receipt.id||receipt.scope.accountId!==s?.accountId||receipt.scope.documentId!==s?.documentId){sendResponse({success:false});return;}
        receipt.cancelled=true;
        const step=receipt.execution||receipt.refresh,type=receipt.execution?'auto-jobs':'job-batch-refresh';
        if(network().cancelQueued(type,step.ticket))step.cancelled=true;
        else if(receipt.execution&&autoJobTask?.id===step.ticket&&autoJobTask.valid()){
          window.postMessage({type:'COR3_AUTOJOB_STOP'},location.origin);
          if(!autoJobTaskStarted){const task=autoJobTask;autoJobTask=null;setAutoJobsActive(false);Cor3CenterStore.set({autoJobsRunning:false});step.finishedAt=Date.now();task.finish();}
        }
        sendResponse({success:true});
      } else if (request.action === "stopAutoJobs") {
        setAutomationQueue(getAutomationQueue().filter((q) => q.type !== "auto-jobs"));
        window.postMessage({type:"COR3_AUTOJOB_STOP"},location.origin);
        if(autoJobTask?.valid()&&!autoJobTaskStarted){const pending=autoJobTask;autoJobTask=null;setAutoJobsActive(false);Cor3CenterStore.set({autoJobsRunning:false});pending.finish();}
        else if(!autoJobTask?.valid()){setAutoJobsActive(false);autoJobTask=null;}
        sendResponse({ success: true });
      } else if (request.action === "enableHackSolvers") {
        ensureAntiAfkEnabled();
        injectDecryptSolver();
        injectIceWallSolver();
        injectSimpleDecryptSolver();
        sendResponse({ success: true });
      } else if (request.action === "dismissFailedJobs") {
        var dismissJobs = request.jobs || [];
        var dismissMarketKey = request.marketKey || "";
        var dismissStorageKey = { home: "marketData", dark: "darkMarketData", soyuz: "soyuzMarketData", usol: "usolMarketData" }[dismissMarketKey] || "";
        var dismissRefreshType = { home: "COR3_REFRESH_MARKET", dark: "COR3_REFRESH_DARK_MARKET", soyuz: "COR3_REFRESH_SOYUZ_MARKET", usol: "COR3_REFRESH_USOL_MARKET" }[dismissMarketKey] || "";
        var result = _automationEnqueue("clear-failed-jobs", function() {
          (async function() {
            try {
              for (var i = 0; i < dismissJobs.length; i++) {
                window.postMessage({ type: "COR3_AUTOJOB_CMD", cmd: "job.dismiss", data: dismissJobs[i] }, "*");
                if (dismissStorageKey) {
                  var fresh = await Cor3CenterStore.get(dismissStorageKey);
                  var freshMd = fresh[dismissStorageKey];
                  if (freshMd && freshMd.recentJobs) {
                    freshMd.recentJobs = freshMd.recentJobs.filter(function(j) {
                      return j.id !== dismissJobs[i].jobId;
                    });
                    await Cor3CenterStore.set({ [dismissStorageKey]: freshMd });
                  }
                }
                await new Promise(function(r) {
                  setTimeout(r, 500);
                });
              }
              await new Promise(function(r) {
                setTimeout(r, 2e3);
              });
              if (dismissRefreshType) {
                setMarketRefreshInProgress(true);
                setAutoUpdateMarketsLastRefresh(Date.now());
                setTimeout(function() {
                  setMarketRefreshInProgress(false);
                }, 1e4);
                window.postMessage({ type: dismissRefreshType }, "*");
              }
            } catch (e) {
              console.log("[COR3 Helper] dismissFailedJobs error:", e);
            } finally {
              _automationFinish("clear-failed-jobs");
            }
          })();
        });
        sendResponse({ success: true, queueResult: result });
      } else if (request.action === "autoCleanupFailedJobs") {
        var cleanupJobs = Array.isArray(request.jobs) ? request.jobs : [];
        var cleanupStorageKeys = { home: "marketData", dark: "darkMarketData", soyuz: "soyuzMarketData", usol: "usolMarketData" };
        var cleanupRefreshTypes = { home: "COR3_REFRESH_MARKET", dark: "COR3_REFRESH_DARK_MARKET", soyuz: "COR3_REFRESH_SOYUZ_MARKET", usol: "COR3_REFRESH_USOL_MARKET" };
        var cleanupResult = _automationEnqueue("clear-failed-jobs", function() {
          (async function() {
            var touched = {};
            try {
              for (var i = 0; i < cleanupJobs.length; i++) {
                var item = cleanupJobs[i];
                window.postMessage({
                  type: "COR3_AUTOJOB_CMD",
                  cmd: "job.dismiss",
                  data: { marketId: item.marketId, jobId: item.jobId }
                }, "*");
                var storageKey = cleanupStorageKeys[item.marketKey];
                if (storageKey) {
                  var fresh = await Cor3CenterStore.get(storageKey);
                  var freshMd = fresh[storageKey];
                  if (freshMd && Array.isArray(freshMd.recentJobs)) {
                    freshMd.recentJobs = freshMd.recentJobs.filter(function(j) {
                      return j.id !== item.jobId;
                    });
                    await Cor3CenterStore.set({ [storageKey]: freshMd });
                  }
                  touched[item.marketKey] = true;
                }
                await new Promise(function(r) {
                  setTimeout(r, 500);
                });
              }
              await new Promise(function(r) {
                setTimeout(r, 2e3);
              });
              var touchedKeys = Object.keys(touched);
              if (touchedKeys.length > 0) {
                setMarketRefreshInProgress(true);
                setAutoUpdateMarketsLastRefresh(Date.now());
                setTimeout(function() {
                  setMarketRefreshInProgress(false);
                }, 1e4);
                for (var k = 0; k < touchedKeys.length; k++) {
                  var refreshType = cleanupRefreshTypes[touchedKeys[k]];
                  if (refreshType) window.postMessage({ type: refreshType }, "*");
                }
              }
            } catch (e) {
              console.log("[COR3 Helper] autoCleanupFailedJobs error:", e);
            } finally {
              _automationFinish("clear-failed-jobs");
            }
          })();
        });
        sendResponse({ success: true, queueResult: cleanupResult });
      } else if (request.action === "devtoolsSendWs") {
        window.postMessage({ type: "COR3_DEVTOOLS_WS_SEND", message: request.message }, "*");
        sendResponse({ success: true });
      } else if (request.action === "startValuableSearch") {
        ensureAntiAfkEnabled();
        const result2 = _automationEnqueue("auto-valuable", () => {
          injectAutoValuableSeller();
          setTimeout(() => {
            window.postMessage({ type: "COR3_VALUABLE_START_SEARCH" }, "*");
          }, 500);
        });
        sendResponse({ success: true, queueResult: result2 });
      } else if (request.action === "startValuableSeller") {
        ensureAntiAfkEnabled();
        const selServers = request.selectedServers || [];
        const selDownloads = request.selectedDownloads || [];
        const result2 = _automationEnqueue("auto-valuable", () => {
          injectAutoValuableSeller();
          setTimeout(() => {
            window.postMessage({
              type: "COR3_VALUABLE_START_SELLER",
              selectedServers: selServers,
              selectedDownloads: selDownloads
            }, "*");
          }, 500);
        });
        sendResponse({ success: true, queueResult: result2 });
      } else if (request.action === "stopValuable") {
        setAutomationQueue(getAutomationQueue().filter((q) => q.type !== "auto-valuable"));
        window.postMessage({ type: "COR3_VALUABLE_STOP" }, "*");
        _automationFinish("auto-valuable");
        sendResponse({ success: true });
      } else if (request.action === "forceMaintenanceBatch") {
        injectAutoValuableSeller();
        setTimeout(() => {
          window.postMessage({
            type: "COR3_VALUABLE_FORCE_MAINTENANCE_BATCH",
            servers: request.servers
          }, "*");
        }, 500);
        sendResponse({ success: true });
      } else if (request.action === "startIpSearch") {
        window.postMessage({ type: "COR3_IP_SEARCH_START" }, "*");
        sendResponse({ success: true });
      } else if (request.action === "fetchDailyOps") {
        window.postMessage({ type: "COR3_FETCH_DAILY_OPS" }, "*");
        sendResponse({ success: true });
      }
    };
    chrome.runtime.onMessage.addListener(receive);
    if(globalThis.Cor3InPageControlsFactory){
      const dispatch=request=>new Promise((resolve,reject)=>{
        let complete=false;const timer=setTimeout(()=>{if(!complete){complete=true;reject(Error('PAGE_ACTION_TIMEOUT'));}},10000);
        const finish=result=>{if(complete)return;complete=true;clearTimeout(timer);resolve(result);};
        if(request.action==='requestDroneOptions'){
          if(!cor3AutomationAllowed()||request.centerIdentityDocumentId!==globalThis.Cor3CenterIdentity?.snapshot()?.documentId){finish({success:false});return;}
          window.postMessage({type:'COR3_REQUEST_DRONE_OPTIONS'},location.origin);finish({success:true});return;
        }
        try{const pending=receive(request,undefined,finish,localPermit);if(pending!==true&&!complete)finish({success:false});}catch(e){clearTimeout(timer);complete=true;reject(e);}
      });
      const admit=documentId=>{
        let timer;
        const deadline=new Promise(resolve=>{timer=setTimeout(()=>resolve({allowed:false,snapshot:null}),8000);});
        const request=Promise.resolve().then(()=>chrome.runtime.sendMessage({type:'centerAdmission',documentId}));
        return Promise.race([request,deadline]).finally(()=>clearTimeout(timer));
      };
      globalThis.Cor3InPageControls=Cor3InPageControlsFactory.create({
        admit,
        dispatch,enqueue:(type,run)=>network().enqueue(type,run,45),queue:()=>network().snapshot(),
        version:chrome.runtime.getManifest().version
      });
      if(cor3AutomationAllowed())globalThis.Cor3InPageControls.startAutoMarket?.();
    }
  }

  // src/content/ws-relay.js
  var _containerOpenRetries = 0;
  var DAILY_HACK_DIAG_MAX = 200;
  var dailyHackDiagnostics = [];
  Cor3CenterStore.get("dailyHackDiagnostics", (data) => {
    if (dailyHackDiagnostics.length === 0 && Array.isArray(data.dailyHackDiagnostics)) {
      dailyHackDiagnostics = data.dailyHackDiagnostics.slice(-DAILY_HACK_DIAG_MAX);
    }
  });
  function recordDailyHackDiagnostic(entry) {
    entry=globalThis.Cor3RunLog?.redact(entry)||entry;
    dailyHackDiagnostics.push(entry);
    if (dailyHackDiagnostics.length > DAILY_HACK_DIAG_MAX) {
      dailyHackDiagnostics.splice(0, dailyHackDiagnostics.length - DAILY_HACK_DIAG_MAX);
    }
    Cor3CenterStore.set({
      dailyHackDiagnostics,
      dailyHackLog: entry.message || "",
      dailyHackLogUpdatedAt: entry.ts || Date.now()
    });
  }
  function fetchDailyRewards2(token, stillValid = () => true) {
    if (!stillValid()) return;
    fetch("https://svc-corie.cor3.gg/api/user-daily-claim/rewards", dailyReadOptions(token)).then((r) => r.ok ? r.json() : null).then((data) => {
      if (!stillValid()) return;
      if (data && Array.isArray(data)) {
        Cor3CenterStore.set({ dailyRewardsData: data });
      }
    }).catch(() => {
    });
  }
  function setupWsRelay() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (!isContextValid()) return;
      const now = Date.now();
      if(event.origin===location.origin&&event.data?.type==='COR3_READ_STATE'&&cor3AutomationAllowed()){
        const value=event.data,status=['loading','ok','partial','blocked','unavailable','cancelled'].includes(value.status)?value.status:null;
        const codes=['READ_STARTED','READ_COMPLETE','READ_RESUMED','SCOPE_CHANGED','READ_CANCELLED','TRANSPORT_UNAVAILABLE','MARKET_UNREACHABLE','ENDPOINT_UNCONFIRMED','MARKET_DATA_TIMEOUT','MERC_DATA_TIMEOUT','MERC_READ_FAILED','CONFIG_READ_FAILED','MERC_DATA_INVALID','CONFIG_UNAVAILABLE','MERC_CONFIGURE_UNCONFIRMED','MERC_CONFIGURE_FAILED'];
        const match=/^market:(home|dark|soyuz|usol):(all|jobs)$/.exec(value.key||'');
        if(status&&match&&codes.includes(value.code)){const doc=globalThis.Cor3CenterIdentity?.snapshot()?.documentId;if(doc)Cor3CenterStore.update('marketReadProofs',{[match[1]]:{status,at:Date.now(),documentId:doc}}).catch(()=>{});}
        if(status&&codes.includes(value.code)&&/^(market:(home|dark|soyuz|usol):(all|jobs)|merc:(home|usol))$/.test(value.key||''))runtimeLog?.log('read.'+status,value.code,{read:value.key},['partial','blocked','unavailable'].includes(status)?'warn':'info');
      }
      if(event.origin===location.origin&&event.data?.type==='COR3_TRANSPORT_STATE'&&cor3AutomationAllowed()){
        const code=event.data.code;if(['PACKET_EXPIRED','SEND_UNCONFIRMED','SOCKET_UNAVAILABLE','QUEUE_FULL'].includes(code))runtimeLog?.log('transport.warning',code,null,'warn');
      }
      if(event.origin===location.origin&&event.data?.type==='COR3_INITIAL_FETCH_REQUEST'&&cor3AutomationAllowed())queueMarketRefresh({type:'COR3_INITIAL_FETCH_RUN'},'initial-fetch');
      if (event.data && event.data.type === "COR3_WS_LOG") {
        cor3LogWsMessage(event.data.direction, event.data.message);
      }
      if (event.origin === location.origin && event.data?.type === "COR3_USER_CREDITS" && Number.isFinite(event.data.credits)) {
        const wasBlocked = !Number.isFinite(observedCredits) || event.data.credits > observedCredits;
        observedCredits = event.data.credits;
        if (wasBlocked) reconsiderAfterCreditIncrease();
      }
      if (event.origin === location.origin && event.data?.type === "COR3_USER_CREDITS_DELTA" &&
          Number.isFinite(observedCredits) && Number.isFinite(event.data.amount)) {
        observedCredits = Math.max(0, observedCredits + event.data.amount);
        if (event.data.amount > 0) reconsiderAfterCreditIncrease();
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITIONS") {
        expeditionLog("expeditions");
        Cor3CenterStore.set({ expeditionsData: event.data.expeditions, expeditionsDataUpdatedAt: now });
        var exps = event.data.expeditions || [];
        var hasActive = exps.some(function(e) {
          return e.status === "IN_PROGRESS";
        });
        if (!hasActive) {
          Cor3CenterStore.get("expeditionLaunchError", function(result) {
            if (result.expeditionLaunchError && !result.expeditionLaunchError.noRetry) {
              console.log("[COR3 Helper] No active expeditions \u2014 clearing expedition launch error");
              Cor3CenterStore.remove("expeditionLaunchError");
            }
          });
        }
        checkAutoSendOnExpeditionData(event.data.expeditions);
      }
      if (event.data && event.data.type === "COR3_WS_DECISIONS") {
        Cor3CenterStore.set({ expeditionDecisions: event.data.decisions });
        checkAutoChooseFromContent(event.data.decisions);
      }
      if (event.data && event.data.type === "COR3_WS_SPECIALISTS") {
        Cor3CenterStore.set({ specialistsData: event.data.data, specialistsDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_STASH") {
        Cor3CenterStore.set({ stashData: event.data.stash, stashDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_MARKET") {
        Cor3CenterStore.set({ marketData: event.data.market, marketDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_DARK_MARKET") {
        Cor3CenterStore.set({ darkMarketData: event.data.market, darkMarketAvailable: true, darkMarketDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_SOYUZ_MARKET") {
        Cor3CenterStore.set({ soyuzMarketData: event.data.market, soyuzMarketAvailable: true, soyuzMarketDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_USOL_MARKET") {
        Cor3CenterStore.set({ usolMarketData: event.data.market, usolMarketAvailable: true, usolMarketDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_LOADOUT") {
        Cor3CenterStore.set({ loadoutData: event.data.loadout, loadoutAction: event.data.action, loadoutUpdatedAt: now, loadoutError: null });
      }
      if (event.data && event.data.type === "COR3_WS_LOADOUT_ERROR") {
        Cor3CenterStore.set({ loadoutError: event.data.error, loadoutErrorAction: event.data.action, loadoutUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_DARK_MARKET_UNREACHABLE") {
        Cor3CenterStore.set({ darkMarketAvailable: false, darkMarketDataUpdatedAt: now, darkMarketMaintenanceEndsAt: event.data.maintenanceEndsAt || null, darkMarketBlockerServer: event.data.blockerServerName || null });
      }
      if (event.data && event.data.type === "COR3_WS_SOYUZ_MARKET_UNREACHABLE") {
        Cor3CenterStore.set({ soyuzMarketAvailable: false, soyuzMarketDataUpdatedAt: now, soyuzMarketMaintenanceEndsAt: event.data.maintenanceEndsAt || null, soyuzMarketBlockerServer: event.data.blockerServerName || null });
      }
      if (event.data && event.data.type === "COR3_WS_USOL_MARKET_UNREACHABLE") {
        Cor3CenterStore.set({ usolMarketAvailable: false, usolMarketDataUpdatedAt: now, usolMarketMaintenanceEndsAt: event.data.maintenanceEndsAt || null, usolMarketBlockerServer: event.data.blockerServerName || null });
      }
      // A startup notification may precede this listener or account admission.
      // Replay only after this document's normal account gate has opened.
      if (event.origin === location.origin && event.data?.type === "COR3_BEARER_TOKEN") {
        const identity = globalThis.Cor3CenterIdentity?.snapshot();
        const token = event.data.token;
        if (!cor3AutomationAllowed() || !identity || typeof token !== "string" ||
            !token.startsWith("Bearer ") || token.length > 16384) return;
        void receiveDailySession(identity, token);
      }
      if (event.origin === location.origin && event.data?.type === "COR3_SESSION_STATUS" &&
          event.data.available === false && cor3AutomationAllowed()) {
        postDailyHackDiag("session.wait", "Waiting for this page's game session", null, "warn");
      }
      if (event.data && event.data.type === "COR3_WEB_VERSION") {
        Cor3CenterStore.set({ webVersion: event.data.version });
      }
      if (event.data && event.data.type === "COR3_SYSTEM_VERSION") {
        Cor3CenterStore.set({ systemVersion: event.data.version });
      }
      if (event.data && event.data.type === "COR3_PATCH_VERSION") {
        Cor3CenterStore.set({ patchVersion: event.data.version });
      }
      if (event.data && event.data.type === "COR3_DAILY_REWARDS") {
        Cor3CenterStore.set({ dailyRewardsData: event.data.rewards });
      }
      if (event.data && event.data.type === "COR3_WS_ARCHIVED_EXPEDITIONS") {
        Cor3CenterStore.set({ archivedExpeditionsData: event.data.data, archivedExpeditionsUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_MERCENARIES") {
        Cor3CenterStore.set({ mercenariesData: event.data.data, mercenariesUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_CORE_MERCS_DONE") {
        Cor3CenterStore.set({ coreMercsDone: Date.now() });
      }
      if (event.data && event.data.type === "COR3_USOL_MERCS_DONE") {
        Cor3CenterStore.set({ usolMercsDone: Date.now() });
        setInitialMercsReady(true);
      }
      if (event.data && event.data.type === "COR3_WS_USOL_MERCENARIES") {
        Cor3CenterStore.set({ usolMercenariesData: event.data.data, usolMercenariesUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_MERC_CONFIGURE" && event.data.mercenaryId) {
        Cor3CenterStore.get("mercConfigData", (result) => {
          const configs = result.mercConfigData || {};
          configs[event.data.mercenaryId] = event.data.data;
          Cor3CenterStore.set({ mercConfigData: configs, mercConfigUpdatedAt: now });
        });
      }
      if (event.data && event.data.type === "COR3_CORE_MERCS_DONE" && autoSendAwaitingUsolMercs) {
        setAutoSendAwaitingUsolMercs(false);
        if (!autoSendInProgress || getAutomationActive() && getAutomationActive().type !== "auto-send") {
          console.log("[COR3 Helper] Auto-send: USOL merc refresh skipped (no longer active)");
        } else {
          let onUsolMercsDoneForAutoSend = function(evt) {
            if (_usolMercHandled) return;
            if (evt.data && evt.data.type === "COR3_USOL_MERCS_DONE") {
              _usolMercHandled = true;
              window.removeEventListener("message", onUsolMercsDoneForAutoSend);
              clearTimeout(usolMercsTimeout);
              console.log("[COR3 Helper] Auto-send: USOL mercs refreshed, proceeding to select merc");
              setAutoSendAwaitingMercenaries(true);
              window.postMessage({ type: "COR3_CORE_MERCS_DONE" }, "*");
            }
            if (evt.data && evt.data.type === "COR3_WS_USOL_MARKET_UNREACHABLE") {
              _usolMercHandled = true;
              window.removeEventListener("message", onUsolMercsDoneForAutoSend);
              clearTimeout(usolMercsTimeout);
              console.log("[COR3 Helper] Auto-send: USOL market unreachable \u2014 proceeding with CORE mercs only");
              setAutoSendUsolSkipped(true);
              setAutoSendAwaitingMercenaries(true);
              window.postMessage({ type: "COR3_CORE_MERCS_DONE" }, "*");
            }
          };
          console.log("[COR3 Helper] Auto-send: CORE mercs refreshed, now fetching USOL mercs...");
          setTimeout(() => {
            if (!autoSendInProgress) return;
            window.postMessage({ type: "COR3_REQUEST_USOL_MERCENARIES" }, "*");
          }, 500);
          var _usolMercHandled = false;
          window.addEventListener("message", onUsolMercsDoneForAutoSend);
          var usolMercsTimeout = setTimeout(() => {
            if (_usolMercHandled) return;
            _usolMercHandled = true;
            window.removeEventListener("message", onUsolMercsDoneForAutoSend);
            console.log("[COR3 Helper] Auto-send: USOL mercs timeout \u2014 proceeding with CORE mercs only");
            setAutoSendAwaitingMercenaries(true);
            window.postMessage({ type: "COR3_CORE_MERCS_DONE" }, "*");
          }, 3e4);
        }
      }
      if (event.data && event.data.type === "COR3_CORE_MERCS_DONE" && autoSendAwaitingMercenaries) {
        setAutoSendAwaitingMercenaries(false);
        Cor3CenterStore.get("autoSendMerc", (settings) => {
          if (!settings.autoSendMerc || !settings.autoSendMerc.enabled) {
            console.log("[COR3 Helper] Auto-send: disabled, aborting");
            setAutoSendInProgress(false);
            _automationFinish("auto-send");
            return;
          }
          Cor3CenterStore.get(["mercenariesData", "usolMercenariesData", "mercConfigData", "expeditionConfigData", "usolExpeditionConfigData"], (localData) => {
            let coreMercs = [];
            const coreRaw = localData.mercenariesData;
            if (coreRaw) {
              if (coreRaw.mercenaries) coreMercs = coreRaw.mercenaries;
              else if (Array.isArray(coreRaw)) coreMercs = coreRaw;
            }
            coreMercs.forEach((m) => {
              m._market = "core";
            });
            const coreElite = coreRaw && coreRaw.eliteSlots || [];
            coreElite.forEach((es) => {
              if (es.mercenary && !coreMercs.find((m) => m.id === es.mercenary.id)) {
                es.mercenary._market = "core";
                es.mercenary._isElite = true;
                coreMercs.push(es.mercenary);
              }
            });
            let usolMercs = [];
            const usolData = localData.usolMercenariesData;
            if (usolData && !_autoSendUsolSkipped) {
              let raw = usolData;
              if (raw && !Array.isArray(raw) && raw.mercenaries) usolMercs = raw.mercenaries;
              else if (Array.isArray(raw)) usolMercs = raw;
              usolMercs.forEach((m) => {
                m._market = "usol";
              });
              const usolElite = usolData && usolData.eliteSlots || [];
              usolElite.forEach((es) => {
                if (es.mercenary && !usolMercs.find((m) => m.id === es.mercenary.id)) {
                  es.mercenary._market = "usol";
                  es.mercenary._isElite = true;
                  usolMercs.push(es.mercenary);
                }
              });
            } else if (_autoSendUsolSkipped) {
              console.log("[COR3 Helper] Auto-send: USOL mercs skipped (market unreachable)");
            }
            const allMercs = [...coreMercs, ...usolMercs];
            const configs = localData.mercConfigData || {};
            const eliteIds = /* @__PURE__ */ new Set();
            coreElite.forEach((es) => {
              if (es.mercenary) eliteIds.add(es.mercenary.id);
            });
            const usolElite2 = usolData && usolData.eliteSlots || [];
            usolElite2.forEach((es) => {
              if (es.mercenary) eliteIds.add(es.mercenary.id);
            });
            allMercs.forEach((m) => {
              if (!m._isElite) m._isElite = eliteIds.has(m.id);
            });
            const rules = settings.autoSendMerc;
            if (!cor3AutomationAllowed() || !autoSendInProgress) return;
            if (creditFloorBlocks(rules)) {
              setAutoSendInProgress(false);
              _automationFinish("auto-send");
              return;
            }
            if (rules.locationConfigId) for (const mercenary of allMercs) {
              const config = mercenary._market === "usol" ? localData.usolExpeditionConfigData : localData.expeditionConfigData;
              mercenary._locationUnavailable = !expeditionRules.selectExpeditionLocation(config, rules, []);
            }
            const choice = expeditionRules.selectMercenary(allMercs, configs, rules);
            if (choice.warning) expeditionLog("mercenary-fallback");
            if (!choice.id) {
              expeditionLog("no-mercenary");
              Cor3CenterStore.set({ mercWarning: "Auto expedition paused: no mercenary meets the current rules and has a quote." });
              setAutoSendUsolSkipped(false);
              setAutoSendMercRetryCount(0);
              setAutoSendInProgress(false);
              _automationFinish("auto-send");
              return;
            }
            const mercId = choice.id;
            if (choice.warning) Cor3CenterStore.set({ mercWarning: choice.warning });
            else Cor3CenterStore.remove("mercWarning");
            setAutoSendUsolSkipped(false);
            proceedWithMerc(mercId, allMercs, settings, localData);
          });
        });
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_ARCHIVED") {
        const archivedId = event.data.data && event.data.data.id;
        if (archivedId) {
          Cor3CenterStore.get("expeditionsData", (result) => {
            const exps2 = result.expeditionsData || [];
            const filtered = exps2.filter((e) => e.id !== archivedId);
            Cor3CenterStore.set({ expeditionsData: filtered, expeditionsDataUpdatedAt: now });
          });
        }
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_CONFIG") {
        Cor3CenterStore.set({ expeditionConfigData: event.data.data });
      }
      if (event.data && event.data.type === "COR3_WS_USOL_EXPEDITION_CONFIG") {
        Cor3CenterStore.set({ usolExpeditionConfigData: event.data.data });
      }
      if (event.data && event.data.type === "COR3_WS_CONTAINER_OPENED") {
        const expId = autoSendExpeditionId;
        if (event.data.error) {
          const msg = event.data.error.message || JSON.stringify(event.data.error);
          console.log("[COR3 Helper] Auto-send: open.container failed:", msg);
          if (msg === "insufficient-credits") {
            Cor3CenterStore.get("autoSendMerc", (settings) => {
              const merc = settings.autoSendMerc || {};
              Cor3CenterStore.set({
                autoSendMerc: {
                  ...merc,
                  enabled: false,
                  hasInsurance: !!merc.hasInsurance,
                  disabledReason: "insufficient_credits"
                }
              });
            });
            Cor3CenterStore.set({
              expeditionLaunchError: {
                error: "Insufficient credits to open reward container. Auto-send disabled.",
                retryAfter: 0,
                timestamp: Date.now(),
                noRetry: true
              }
            });
            setAutoSendInProgress(false);
            setAutoSendExpeditionId(null);
            _automationFinish("auto-send");
            return;
          }
          if (isTransientBusyMessage(msg) && expId) {
            _containerOpenRetries++;
            if (_containerOpenRetries <= 3) {
              const delay = 4e3 * _containerOpenRetries;
              console.log("[COR3 Helper] Auto-send: container busy \u2014 retrying payment in", delay + "ms");
              setTimeout(async () => {
                const { autoSendMerc } = await Cor3CenterStore.get("autoSendMerc").catch(() => ({}));
                if (cor3AutomationAllowed() && autoSendMerc?.enabled && autoSendMerc.autoClaim !== false && autoSendInProgress && autoSendExpeditionId === expId) {
                  window.postMessage({ type: "COR3_OPEN_CONTAINER", expeditionId: expId }, "*");
                } else if (autoSendExpeditionId === expId) {
                  setAutoSendInProgress(false);
                  setAutoSendExpeditionId(null);
                  _automationFinish("auto-send");
                }
              }, delay);
              return;
            }
          }
          Cor3CenterStore.set({ mercWarning: "Failed to open reward container: " + msg });
          setAutoSendInProgress(false);
          setAutoSendExpeditionId(null);
          _automationFinish("auto-send");
          return;
        }
        if (autoSendInProgress && expId) {
          _containerOpenRetries = 0;
          console.log("[COR3 Helper] Auto-send: container paid \u2014 rewards are in the mailbox, claiming\u2026");
          window.postMessage({ type: "COR3_CHECK_MAIL", source: "EXPEDITION", sourceId: expId }, "*");
        }
      }
      if (event.data && event.data.type === "COR3_WS_INSUFFICIENT_CREDITS") {
        console.log("[COR3 Helper] Insufficient credits for expedition launch, disabling auto-send mercenary");
        Cor3CenterStore.get("autoSendMerc", (settings) => {
          const merc = settings.autoSendMerc || {};
          Cor3CenterStore.set({
            autoSendMerc: {
              ...merc,
              enabled: false,
              hasInsurance: !!merc.hasInsurance,
              disabledReason: "insufficient_credits"
            }
          });
        });
        Cor3CenterStore.set({
          expeditionLaunchError: {
            error: "Insufficient credits to launch expedition",
            retryAfter: 0,
            timestamp: Date.now(),
            noRetry: true
          }
        });
        setAutoSendInProgress(false);
        _automationFinish("auto-send");
        setAutoSendExpeditionId(null);
      }
      if (event.data && event.data.type === "COR3_MAIL_CLAIMED" && event.data.source === "EXPEDITION") {
        if (autoSendExpeditionId && event.data.sourceId === autoSendExpeditionId) {
          onExpeditionCollected(event.data.sourceId);
        } else {
          console.log("[COR3 Helper] Auto-send: ignoring stale expedition mail", event.data.sourceId);
        }
      }
      if (event.data && event.data.type === "COR3_WS_GAMEPLAY") {
        Cor3CenterStore.set({ gameplayData: event.data.data, gameplayDataUpdatedAt: now });
      }
      if (event.data && event.data.type === "COR3_WS_MERC_NOT_AVAILABLE") {
        setAutoSendMercRetryCount(_autoSendMercRetryCount + 1);
        if (_autoSendMercRetryCount <= MAX_MERC_RETRIES) {
          console.log("[COR3 Helper] Auto-send: Mercenary not available \u2014 retry " + _autoSendMercRetryCount + "/" + MAX_MERC_RETRIES + ", refreshing merc data...");
          setAutoSendExpeditionBlocked(false);
          Cor3CenterStore.remove("autoSendExpeditionBlocked");
          setAutoSendInProgress(true);
          if (!getAutomationActive()) setAutomationActive({ type: "auto-send", startedAt: Date.now() });
          _broadcastQueueStatus();
          setAutoSendAwaitingMercenaries(false);
          setAutoSendAwaitingUsolMercs(true);
          setTimeout(() => {
            if (!autoSendInProgress) return;
            window.postMessage({ type: "COR3_REQUEST_MERCENARIES" }, "*");
          }, 2e3 + Math.floor(Math.random() * 1e3));
        } else {
          console.log("[COR3 Helper] Auto-send: Mercenary not available after " + MAX_MERC_RETRIES + " retries \u2014 aborting");
          Cor3CenterStore.set({ mercWarning: "Mercenary not available after " + MAX_MERC_RETRIES + " retries. Merc data may be stale." });
          setAutoSendMercRetryCount(0);
          setAutoSendInProgress(false);
          _automationFinish("auto-send");
        }
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_LAUNCHED") {
        expeditionLog("mercenary-launched");
        console.log("[COR3 Helper] Expedition launched successfully");
        setAutoSendInProgress(false);_automationFinish("auto-send");
        setAutoSendMercRetryCount(0);
        Cor3CenterStore.remove("mercWarning");
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_LAUNCH_ERROR") {
        expeditionLog("mercenary-launch-error");
        console.log("[COR3 Helper] Expedition launch error:", event.data.error);
        if (event.data.error === "Maximum 1 active expedition allowed") {
          console.log("[COR3 Helper] Active expedition detected \u2014 blocking auto-send until it completes");
          setAutoSendExpeditionBlocked(true);
          Cor3CenterStore.set({ autoSendExpeditionBlocked: true });
          setAutoSendInProgress(false);
          _automationFinish("auto-send");
          setAutoSendExpeditionId(null);
        } else if (event.data.transient || isTransientBusyMessage(event.data.error)) {
          console.log("[COR3 Helper] Expedition action still in progress \u2014 will retry after state refresh");
          Cor3CenterStore.set({ mercWarning: "Expedition action still in progress \u2014 retrying shortly\u2026" });
          setAutoSendExpeditionBlocked(true);
          Cor3CenterStore.set({ autoSendExpeditionBlocked: true });
          setAutoSendInProgress(false);
          _automationFinish("auto-send");
          setAutoSendExpeditionId(null);
          setTimeout(() => {
            window.postMessage({ type: "COR3_REQUEST_EXPEDITIONS" }, "*");
          }, 8e3);
        } else {
          Cor3CenterStore.set({
            expeditionLaunchError: {
              error: event.data.error,
              retryAfter: event.data.retryAfter,
              timestamp: Date.now()
            }
          });
          Cor3CenterStore.remove("expeditionLaunched");
          setAutoSendInProgress(false);_automationFinish("auto-send");
        }
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_ELITE_REQUIRED") {
        console.log("[COR3 Helper] Elite merc required \u2014 retrying with default location");
        Cor3CenterStore.get(["lastExpeditionLaunchData", "autoSendMerc"], (result) => {
          if (!cor3AutomationAllowed() || !result.autoSendMerc?.enabled ||
              expeditionRules.hasDispatchConstraints(result.autoSendMerc)) {
            expeditionLog("mercenary-launch-error");
            return;
          }
          const launch = result.lastExpeditionLaunchData;
          if (!launch) return;
          const isUsol = launch.marketId === "019e4065-6ae8-760d-8724-58ab4f2cf7d7";
          const configKey = isUsol ? "usolExpeditionConfigData" : "expeditionConfigData";
          Cor3CenterStore.get(configKey, (cfgResult) => {
            const cfg = cfgResult[configKey];
            if (!cfg || !cfg.locations || cfg.locations.length === 0) return;
            const DEFAULT_LOC_NAMES = ["Skylift Remains", "Koute Mining and Reprocessing Outpost"];
            const loc = cfg.locations.find((l) => DEFAULT_LOC_NAMES.includes(l.name)) || cfg.locations[0];
            const zone = loc.zones && loc.zones[0] ? loc.zones[0] : null;
            const goal = zone && zone.goals && zone.goals[0] ? zone.goals[0] : null;
            if (!zone || !goal) return;
            if (loc.id === launch.locationConfigId) {
              console.log("[COR3 Helper] Already using default location \u2014 no alternative available");
              return;
            }
            const retryConfig = { ...launch, locationConfigId: loc.id, zoneConfigId: zone.id, goalId: goal.id };
            Cor3CenterStore.set({ lastExpeditionLaunchData: retryConfig });
            console.log("[COR3 Helper] Retrying expedition with location:", loc.name || loc.id);
            setTimeout(async () => {
              const { autoSendMerc } = await Cor3CenterStore.get("autoSendMerc").catch(() => ({}));
              if (!cor3AutomationAllowed() || !autoSendMerc?.enabled || expeditionRules.hasDispatchConstraints(autoSendMerc)) return;
              window.postMessage({ type: "COR3_LAUNCH_EXPEDITION", config: retryConfig }, "*");
            }, 2e3 + Math.floor(Math.random() * 1e3));
          });
        });
      }
      if (event.data && event.data.type === "COR3_WS_EXPEDITION_RETRY_LAUNCH") {
        console.log("[COR3 Helper] Retrying expedition launch");
        Cor3CenterStore.get(["lastExpeditionLaunchData", "autoSendMerc"], (result) => {
          if (cor3AutomationAllowed() && result.autoSendMerc?.enabled &&
              !expeditionRules.hasDispatchConstraints(result.autoSendMerc) && result.lastExpeditionLaunchData) {
            window.postMessage({
              type: "COR3_RELAUNCH_EXPEDITION",
              data: result.lastExpeditionLaunchData
            }, "*");
          }
        });
      }
      if (event.data && event.data.type === "COR3_DAILY_HACK_LOG") {
        recordDailyHackDiagnostic({
          ts: event.data.timestamp || Date.now(),
          level: event.data.level || "info",
          step: event.data.step || "log",
          message: event.data.message || "",
          details: event.data.details || null
        });
      }
      if (event.data && event.data.type === "COR3_DAILY_HACK_RUN_FINISHED") {
        if (validDailyLifecycleMessage(event.data)) handleDailyHackRunFinished(event.data);
      }
      if (event.data && ["COR3_FETCH_DAILY_OPS", "COR3_DAILY_HACK_REFRESH"].includes(event.data.type)) {
        const fromSolver = event.data.type === "COR3_DAILY_HACK_REFRESH";
        const messageTicket = event.data.lifecycleTicket;
        const messageEpoch = dailyEpoch();
        const lifecycleValid = () => !fromSolver || (dailyValid(messageEpoch) && validDailyLifecycleMessage({lifecycleTicket:messageTicket}));
        if (!lifecycleValid()) return;
        console.log("[COR3 Helper] Requesting daily ops data");
        withDailyToken((token, sessionValid) => {
          const stillValid = () => lifecycleValid() && sessionValid();
          if (!stillValid()) return;
          if (!token) return;
          fetch("https://svc-corie.cor3.gg/api/user-daily-claim", dailyReadOptions(token)).then((r) => {
            if (!stillValid()) return null;
            if (r.ok) return r.json();
            if (r.status === 400 || r.status === 401 || r.status === 403) {
              Cor3CenterStore.set({ dailyOpsError: "token_expired", dailyOpsErrorUpdatedAt: Date.now() });
              return null;
            }
            return null;
          }).then((data) => {
            if (!stillValid()) return;
            if (typeof data?.hasClaimedToday === "boolean") {
              Cor3CenterStore.set({ dailyOpsData: data, dailyOpsUpdatedAt: Date.now(), dailyOpsError: null });
              fetchDailyRewards2(token, stillValid);
            }
          }).catch(() => {
          });
        });
      }
    });
  }

  // src/content/engine-relay.js
  init_helpers();
  init_auto_update_markets();
  init_auto_send();
  function setupEngineRelay() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (!isContextValid()) return;
      if (event.data && /^COR3_AUTOJOB_ENABLE_/.test(event.data.type) && !cor3AutomationAllowed()) return;
      if (event.data && event.data.type === "COR3_AUTOJOB_ENABLE_DECRYPT_SOLVER") {
        const gameDecryptEpoch = lifecycleScheduler.capture("decrypt");
        if (!lifecycleScheduler.valid("decrypt", gameDecryptEpoch)) return;
        Cor3CenterStore.get("autoDecryptEnabled", (result) => {
          if (!lifecycleScheduler.valid("decrypt", gameDecryptEpoch)) return;
    if (!cor3AutomationAllowed()) return;
          if (!result.autoDecryptEnabled) {
            Cor3CenterStore.set({ autoDecryptEnabled: true });
            console.log("[COR3 Helper] Auto Job: Enabling decrypt solver for minigame");
          }
          injectDecryptSolver();
        });
      }
      if (event.data && event.data.type === "COR3_DECRYPT_STATUS") {
        if(event.origin!==location.origin||!lifecycleScheduler.accepts('decrypt',event.data))return;
        const messages={TERMINAL_WATCHING:'终端解密正在等待挑战',TERMINAL_STARTED:'终端解密已开始',TERMINAL_GUESS_SUBMITTED:'终端参数已核对并提交一次',TERMINAL_FEEDBACK_RECEIVED:'终端收到本次反馈，继续缩小候选',TERMINAL_MATCHED:'终端反馈全部匹配',TERMINAL_ALREADY_MATCHED:'终端已有全部匹配记录',TERMINAL_SESSION_CHANGED:'终端挑战已变化，本次操作结束',TERMINAL_NAVIGATION_UNCONFIRMED:'终端参数切换未确认，未提交答案',TERMINAL_FIELDS_CHANGED:'终端字段已变化，未提交答案',TERMINAL_FIELDS_UNSUPPORTED:'终端参数格式暂不支持，未提交答案',TERMINAL_RESPONSE_UNCONFIRMED:'终端本次提交反馈未确认，不重复提交',TERMINAL_FEEDBACK_INCONSISTENT:'终端反馈不一致，停止本次猜测',TERMINAL_FAILED:'终端解密发生错误'};
        const code=event.data.code;if(!Object.hasOwn(messages,code))return;const level=['TERMINAL_NAVIGATION_UNCONFIRMED','TERMINAL_FIELDS_CHANGED','TERMINAL_FIELDS_UNSUPPORTED','TERMINAL_RESPONSE_UNCONFIRMED','TERMINAL_FEEDBACK_INCONSISTENT','TERMINAL_FAILED'].includes(code)?'warn':'info';
        runtimeLog?.log('terminal.'+(level==='warn'?'warning':'progress'),messages[code],{reason:code},level);
        Cor3CenterStore.set({decryptSolverStatus:{message:messages[code],code,level,timestamp:Date.now()}}).catch(()=>{});
      }
      if (event.data && event.data.type === "COR3_ICE_WALL_STATUS") {
        Cor3CenterStore.set({
          iceWallSolverStatus: {
            message: event.data.message,
            level: event.data.level || "info",
            timestamp: Date.now()
          }
        });
      }
      if (event.data && event.data.type === "COR3_SIMPLE_DECRYPT_STATUS") {
        if (event.origin !== location.origin || !lifecycleScheduler.accepts("simple", event.data)) return;
        Cor3CenterStore.set({
          simpleDecryptSolverStatus: {
            message: event.data.message,
            level: event.data.level || "info",
            timestamp: Date.now()
          }
        });
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_ENABLE_SIMPLE_DECRYPT_SOLVER") {
        const gameSimpleDecryptEpoch = lifecycleScheduler.capture("simple");
        if (!lifecycleScheduler.valid("simple", gameSimpleDecryptEpoch)) return;
        Cor3CenterStore.get("autoSimpleDecryptEnabled", (result) => {
          if (!lifecycleScheduler.valid("simple", gameSimpleDecryptEpoch)) return;
          if (!cor3AutomationAllowed()) return;
          if (!result.autoSimpleDecryptEnabled) {
            Cor3CenterStore.set({ autoSimpleDecryptEnabled: true });
            console.log("[COR3 Helper] Auto Job: Enabling Simple Decrypt solver for minigame");
          }
          injectSimpleDecryptSolver();
        });
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_ENABLE_ICE_WALL_SOLVER") {
        const gameIceEpoch = lifecycleScheduler.capture("ice");
        if (!lifecycleScheduler.valid("ice", gameIceEpoch)) return;
        Cor3CenterStore.get("autoIceWallEnabled", (result) => {
          if (!lifecycleScheduler.valid("ice", gameIceEpoch)) return;
          if (!cor3AutomationAllowed()) return;
          if (!result.autoIceWallEnabled) {
            Cor3CenterStore.set({ autoIceWallEnabled: true });
            console.log("[COR3 Helper] Auto Job: Enabling ICE Wall solver for minigame");
          }
          injectIceWallSolver();
        });
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_LOG") {
        queueAutoJobLog(event.data.msg, event.data.level);
      }
      if (event.data && event.data.type === "COR3_WS_NETWORK_MAP") {
        Cor3CenterStore.set({ serverMaintenanceMap: event.data.servers });
      }
      if (event.data && event.data.type === "COR3_WS_MAP_DATA") {
        Cor3CenterStore.set({
          networkMapData: {
            servers: event.data.servers || [],
            connections: event.data.connections || []
          },
          networkMapUpdatedAt: Date.now()
        });
      }
      if (event.data && event.data.type === "COR3_DEV_TC_REACH_PROGRESS") {
        Cor3CenterStore.set({ _devTcReachProgress: { log: event.data.log || [] } });
      }
      if (event.data && event.data.type === "COR3_DEV_TC_REACH_RESULT") {
        Cor3CenterStore.set({ _devTcReachResult: { reachable: event.data.reachable, reason: event.data.reason || null, log: event.data.log || [] } });
      }
      if (event.data && event.data.type === "COR3_IP_SEARCH_LOG") {
        if (isContextValid()) {
          try {
            Cor3CenterStore.set({ secretFinderLog: event.data.html });
          } catch (e) {
          }
        }
      }
      if (event.data && event.data.type === "COR3_IP_SEARCH_DONE") {
        if (isContextValid()) {
          try {
            Cor3CenterStore.set({ secretFinderLog: event.data.html });
            Cor3CenterStore.set({ secretFinderEnabled: false });
          } catch (e) {
          }
        }
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_ACCEPTED") {
        if(event.origin!==location.origin||!autoJobTask?.valid()||event.data.runTicket!==autoJobTask.id)return;
        autoJobTask.renew?.();
        if(jobBatchReceipt?.execution?.ticket===autoJobTask.id)jobBatchReceipt.execution.acceptedAt=Date.now();
        Cor3CenterStore.set({autoJobsRunning:true});
        runtimeLog?.log('jobs.accepted','执行器已接收本轮任务');
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_TRACKER_UPDATE") {
        if(event.origin!==location.origin||!autoJobTask?.valid()||event.data.runTicket!==autoJobTask.id||!Array.isArray(event.data.tracker))return;
        autoJobTask.renew?.();
        const tracker=event.data.tracker.slice(0,1000);
        if(jobBatchReceipt?.execution?.ticket===autoJobTask.id)jobBatchReceipt.execution.tracker=tracker.map(j=>({jobId:j?.jobId,name:j?.name,type:j?.type,serverName:j?.serverName,status:j?.status,error:globalThis.Cor3RunLog?.text(j?.error||'').slice(0,320)||''}));
        Cor3CenterStore.set({ autoJobsTracker: tracker,autoJobsTrackerUpdatedAt:Date.now() });
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_DONE") {
        if(!autoJobTask?.valid()||event.data.runTicket!==autoJobTask.id)return;
        if(jobBatchReceipt?.execution?.ticket===autoJobTask.id)jobBatchReceipt.execution.finishedAt=Date.now();
        setAutoJobsActive(false);Cor3CenterStore.set({autoJobsRunning:false});const doneTask=autoJobTask;autoJobTask=null;doneTask.finish();globalThis.Cor3NetworkRuntime?.recheckMarkets?.();
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_ICE_WALL_RELOAD") {
        if (!cor3AutomationAllowed()) return;
        var lockedJob = event.data.lockedJob;
        console.log("[COR3 Helper] ICE Wall stuck \u2014 saving locked job and reloading page");
        Cor3CenterStore.get("autoJobsLockedJobs", (prev) => {
          if (!cor3AutomationAllowed()) return;
          var lockedList = prev.autoJobsLockedJobs || [];
          if (lockedJob && lockedJob.jobId) {
            lockedList = lockedList.filter((j) => j.jobId !== lockedJob.jobId);
            lockedList.push(lockedJob);
          }
          Cor3CenterStore.set({ autoJobsLockedJobs: lockedList }, () => {
            if (cor3AutomationAllowed()) window.location.reload();
          });
        });
      }
      if (event.data && event.data.type === "COR3_ALL_MARKETS_REFRESHED") {
        setMarketRefreshInProgress(false);
        Cor3CenterStore.set({ _allMarketsRefreshed: Date.now() });
      }
      if (event.data && event.data.type === "COR3_TOKEN_EXPIRED") {
        dailySession = null;
        setMarketRefreshInProgress(false);
        Promise.resolve().then(() => (init_auto_update_markets(), auto_update_markets_exports)).then((m) => m.setSeqRefreshRunning(false));
        setInitialFetchDone(false);
        Cor3CenterStore.remove(["initialFetchDoneAt", "sessionAuthDocumentId", "sessionAuthReadyAt"]);
        if (autoSendInProgress) {
          console.log("[COR3 Helper] Token expired \u2014 aborting in-progress auto-send");
          setAutoSendInProgress(false);
          setAutoSendExpeditionId(null);
          setAutoSendAwaitingMercenaries(false);
          setAutoSendAwaitingUsolMercs(false);
          setAutoSendDeferredWaiting(false);
          setAutoSendUsolSkipped(false);
          setAutoSendMercRetryCount(0);
          _automationFinish("auto-send");
        }
        console.log("[COR3 Helper] Token expired \u2014 cleared market refresh flags, gating automations until initial fetch done");
      }
      if (event.data && event.data.type === "COR3_INITIAL_FETCH_DONE") {
        setInitialFetchDone(true);
        Cor3CenterStore.set({ initialFetchDoneAt: Date.now() });
        console.log("[COR3 Helper] Initial fetch done \u2014 automations unblocked");
        Cor3CenterStore.get("expeditionsData", (result) => {
          if (result.expeditionsData) {
            checkAutoSendOnExpeditionData(result.expeditionsData);
          }
        });
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_SAVE_COMPLETED") {
        Cor3CenterStore.get("autoJobsCompletedResults", (result) => {
          const existing = result.autoJobsCompletedResults || [];
          const incoming = event.data.jobs || [];
          const merged = [...existing];
          for (const job of incoming) {
            const idx = merged.findIndex((j) => j.jobId === job.jobId);
            if (idx >= 0) merged[idx] = job;
            else merged.push(job);
          }
          Cor3CenterStore.set({ autoJobsCompletedResults: merged });
        });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_LOG") {
        queueValuableLog(event.data.msg, event.data.level);
      }
      if (event.data && event.data.type === "COR3_VALUABLE_SERVERS_UPDATE") {
        Cor3CenterStore.set({ valuableServersData: event.data.data });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_DOWNLOADS_UPDATE") {
        Cor3CenterStore.set({ valuableDownloadsData: event.data.data });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_MAINTENANCE_UPDATE") {
        Cor3CenterStore.set({ valuableMaintenanceData: event.data.data });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_FORCE_MAINT_BATCH_PROGRESS") {
        Cor3CenterStore.get("forceMaintenanceInProgress", function(res) {
          var fm = res.forceMaintenanceInProgress;
          if (fm && fm.batch) {
            fm.currentServerId = event.data.currentServerId;
            fm.serverIds = event.data.serverIds;
            Cor3CenterStore.set({ forceMaintenanceInProgress: fm });
          }
        });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_FORCE_MAINT_SERVER_DONE") {
        Cor3CenterStore.set({ valuableForceMaintenanceServerDone: { serverId: event.data.serverId, serverName: event.data.serverName, ts: Date.now() } });
        Cor3CenterStore.get("valuableMaintenanceData", function(res) {
          var mData = res.valuableMaintenanceData;
          if (mData && mData.servers) {
            for (var si = 0; si < mData.servers.length; si++) {
              if (mData.servers[si].id === event.data.serverId) {
                mData.servers[si].maintenanceEndsAt = mData.servers[si].maintenanceEndsAt || new Date(Date.now() + 36e5).toISOString();
                mData.servers[si].timeUntilMaintenance = null;
                break;
              }
            }
            Cor3CenterStore.set({ valuableMaintenanceData: mData });
          }
        });
      }
      if (event.data && event.data.type === "COR3_VALUABLE_FORCE_MAINT_DONE") {
        var fmDoneData = { done: true };
        if (event.data.error) {
          fmDoneData.error = event.data.error;
          fmDoneData.blockerName = event.data.blockerName || null;
          fmDoneData.remainingMs = event.data.remainingMs || null;
          fmDoneData.targetServer = event.data.targetServer || null;
        }
        Cor3CenterStore.set({ valuableForceMaintenanceDone: fmDoneData });
        Cor3CenterStore.remove("forceMaintenanceInProgress");
      }
      if (event.data && event.data.type === "COR3_VALUABLE_DONE") {
        Cor3CenterStore.set({ valuableSearchRunning: false, valuableSellerRunning: false });
        _automationFinish("auto-valuable");
      }
    });
  }

  // src/content/index.js
  init_auto_send();

  // stub-ns:stub-auto-chat
  function setupAutoChat() {
  }

  // src/content/index.js
  setupWsRelay();
  setupMessageListener();
  setupEngineRelay();
  setupAutoChat();
  setTimeout(() => {
    Cor3CenterStore.get("expeditionsData", (result) => {
      if (result.expeditionsData) {
        console.log("[COR3 Helper] Page load: checking cached expedition data for auto-send");
        checkAutoSendOnExpeditionData(result.expeditionsData);
      }
    });
  }, 5e3);
  function relayMercInsurance() {
    Cor3CenterStore.get("autoSendMerc", (data) => {
      window.postMessage({
        type: "COR3_SET_MERC_INSURANCE",
        hasInsurance: !!(data.autoSendMerc && data.autoSendMerc.hasInsurance)
      }, "*");
    });
  }
  relayMercInsurance();
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.autoSendMerc) return;
    relayMercInsurance();
    const newVal = changes.autoSendMerc.newValue || {};
    if (newVal.enabled) {
      console.log("[COR3 Helper] Auto-send settings changed \u2014 checking expedition data");
      Cor3CenterStore.get("expeditionsData", (result) => {
        if (result.expeditionsData) {
          checkAutoSendOnExpeditionData(result.expeditionsData);
        }
      });
    }
  });
  window.addEventListener("error", (e) => {
    if (typeof cor3LogEntry === "function") {
      cor3LogEntry("error-logs", (e.filename || "") + ":" + (e.lineno || 0) + " " + (e.message || ""), "error");
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (typeof cor3LogEntry === "function") {
      var msg = e.reason ? e.reason.stack || e.reason.message || String(e.reason) : "Unhandled rejection";
      cor3LogEntry("error-logs", msg, "error");
    }
  });
  Cor3CenterStore.remove("initialFetchDoneAt");
  Cor3CenterStore.get("autoJobsRunning", (data) => {
    if (data.autoJobsRunning) {
      console.log("[COR3 Helper] Page reloaded \u2014 clearing stale auto-jobs state");
      Cor3CenterStore.set({ autoJobsRunning: false, autoJobsQueue: [] });
    }
  });
  Cor3Automation.onStop(() => {
    dailySession = null;
    globalThis.Cor3InPageControls?.stopAutoMarket();
    network().cancel();dailyNetworkTask=null;
    observedCredits = undefined;
    _automationQueue = [];
    _automationActive = null;
    _broadcastQueueStatus();
    setAutoJobsActive(false);
    setSeqRefreshRunning(false);
    setMarketRefreshInProgress(false);
    setAutoSendInProgress(false);
    setAutoSendExpeditionId(null);
    setAutoSendAwaitingMercenaries(false);
    setAutoSendAwaitingUsolMercs(false);
    setAutoSendDeferredWaiting(false);
    setAutoSendMercRetryCount(0);
    _clearDronePending();
    autoDroneInProgress = false;
    if (_droneOptionsRefreshTimer) clearTimeout(_droneOptionsRefreshTimer);
    _droneOptionsRefreshTimer = null;
    lastDroneOptionsRead = null;
    if (_active && _active.timer) clearTimeout(_active.timer);
    _active = null;
    _queue = [];
    _queuedIds.clear();
    _forcedSources.clear();
    _watched.forEach(w => { if (w.timer) clearTimeout(w.timer); });
    _watched.clear();
    if (_itemClaimResolver) _itemClaimResolver.finish({ ok: false, error: "Automation paused." });
    _fallbackActive = false;
    clearDailyHackTimer();
    releaseDailyHackLock();
    _dailyHackAutoStarted = false;
    for (const type of ["COR3_AUTOJOB_STOP", "COR3_VALUABLE_STOP", "COR3_STOP_DAILY_HACK"]) window.postMessage({ type }, "*");
    window.postMessage({ type: "COR3_ANTI_AFK_TOGGLE", enabled: false }, "*");
    Cor3CenterStore.set({ autoJobsRunning: false, autoJobsQueue: [], valuableSearchRunning: false, valuableSellerRunning: false, forceMaintenanceInProgress: false, stashSortNotice: "Automation stopped. Already submitted actions cannot be undone; check any unfinished sorting table.", automationMasterPaused: true });
  });
  // CENTER_CURRENT_GENERATION_START: account features remain on the original gate.
  Cor3Automation.onReady(runToken=>{
    if(!Cor3Automation.validRun(runToken))return;
    globalThis.Cor3InPageControls?.startAutoMarket();
    globalThis.Cor3RuntimeLog?.log('page.ready','当前账号页面许可已确认');
    globalThis.Cor3RequestBootstrap?.();
    window.postMessage({type:'COR3_SESSION_REPLAY_REQUEST'},location.origin);
    Cor3CenterStore.get(['autoUpdateMarkets','autoDailyHackEnabled'],data=>{
      if(!Cor3Automation.validRun(runToken))return;
      setAutoUpdateMarkets(data.autoUpdateMarkets===true);
      if(data.autoUpdateMarkets===true)_initAutoUpdateMarketsTimer();
      if(data.autoDailyHackEnabled===true){lifecycleScheduler.enable('daily');autoStartDailyHackOnLoad();}
    });
  });
  Cor3ThreeAutomation.onStop(()=>{stopDecryptSolver();stopIceWallSolver();stopSimpleDecryptSolver();});
  Cor3ThreeAutomation.onReady((runToken,data)=>{
    if(!Cor3ThreeAutomation.validRun(runToken))return;
    for(const [feature,key,start] of [['decrypt','autoDecryptEnabled',injectDecryptSolver],['ice','autoIceWallEnabled',injectIceWallSolver],['simple','autoSimpleDecryptEnabled',injectSimpleDecryptSolver]]){
      if(data[key]!==true)continue;
      lifecycleScheduler.enable(feature);
      if(Cor3ThreeAutomation.validRun(runToken))start();
    }
  });
  // END_CENTER_CURRENT_GENERATION_START

})();




