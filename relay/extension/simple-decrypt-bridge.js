/* Simple Hack iframe: preference changes never start a run. */
(() => {
  'use strict';
  const scheduler = Cor3ObservableScheduler;
  let injected = false, preferenceRevision = 0;
  // Isolated observation collector. Epochs correlate; never authenticate MAIN.
  let rootOwner = null, collectorRevision = 0, configuredEpoch = null;
  let collectionEpoch = null, collectionExpiry = 0, collectionSequence = 0;
  let frameErrors = [], frameDropped = false, dirtyHintOutstanding = false;
  function notifyFrame(type) {
    if(window===window.top)return;
    try {chrome.runtime.sendMessage?.({type})?.catch?.(()=>{});}catch{}
  }
  const epochOK = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
  const armed = () => collectionEpoch && Date.now() < collectionExpiry;
  const announceCollection = () => window.postMessage({type:'COR3_SIMPLE_FRAME_ARM', collectionEpoch:armed() ? collectionEpoch : null}, location.origin);
  Object.defineProperty(globalThis, 'Cor3SimpleFrameCollector', {value:Object.freeze({
    revision() { return collectorRevision; },
    configure(epoch, expiresAt, owner, collect, expectedRevision) {
      if (expectedRevision !== collectorRevision || collectorRevision >= 1000000) return false;
      if (typeof owner !== 'string' || !/^[a-f0-9]{64}$/.test(owner) || rootOwner && rootOwner !== owner) return false;
      rootOwner = owner;
      if (!epochOK(epoch) || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now()+600000) return false;
      collectorRevision++; configuredEpoch = epoch;
      if (collectionEpoch !== epoch) { dirtyHintOutstanding=false; frameErrors = []; frameDropped = false; collectionSequence = 0; }
      else if (!armed()) { dirtyHintOutstanding=false; frameErrors = []; frameDropped = true; }
      if (collect !== true) { dirtyHintOutstanding=false; collectionEpoch=null; collectionExpiry=0; frameErrors=[]; return true; }
      collectionEpoch = epoch; collectionExpiry = expiresAt; announceCollection(); return true;
    },
    read(epoch, collect) {
      if (collect !== true) return {errors:[],dropped:false};
      if (!armed() || epoch !== collectionEpoch) return null;
      dirtyHintOutstanding=false;
      return {errors:frameErrors.map(row => ({...row})), dropped:frameDropped};
    },
    clear(epoch) { if (configuredEpoch !== null && epoch !== configuredEpoch) return; collectorRevision++; configuredEpoch = epoch; dirtyHintOutstanding=false; collectionEpoch = null; collectionExpiry = 0; frameErrors = []; frameDropped = false; collectionSequence = 0; announceCollection(); }
  }), configurable:false, writable:false});
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (data?.type === 'COR3_SIMPLE_FRAME_COLLECTOR_READY' && Object.keys(data).length === 1) { announceCollection(); return; }
    if (!armed() || !data || Object.keys(data).length !== 6 || !['type','source','code','phase','lifecycleTicket','collectionEpoch'].every(key => Object.hasOwn(data,key)) || data.type !== 'COR3_SIMPLE_FRAME_ERROR' || data.source !== 'simpleLifecycle' || !['SOLVER_FAILED','TIMEOUT'].includes(data.code) || data.phase !== 'run' || data.collectionEpoch !== collectionEpoch || !scheduler.accepts('simple',data)) return;
    if (collectionSequence >= 1000000) { frameDropped = true; return; }
    frameErrors.push({sequence:++collectionSequence, code:data.code});
    if (frameErrors.length > 16) { frameErrors.shift(); frameDropped = true; }
    if(!dirtyHintOutstanding) {dirtyHintOutstanding=true;notifyFrame('cor3-simple-frame-dirty/v1');}
  });

  notifyFrame('cor3-simple-frame-ready/v1');
  function inject() {
    const epoch = scheduler.capture('simple');
    if (!scheduler.valid('simple', epoch) || injected) return;
    injected = true;
    scheduler.prepare('simple').then(ticket => {
      if (!scheduler.valid('simple', epoch)) return;
      if (!ticket) { injected = false; return; }
      const script = document.createElement('script');
      script.dataset.cor3LifecycleTicket = ticket;
      script.src = chrome.runtime.getURL('simple-decrypt-solver.js');
      script.onload = () => script.remove();
      script.onerror = () => { script.remove(); if (scheduler.valid('simple', epoch)) injected = false; };
      (document.head || document.documentElement).appendChild(script);
    });
  }
  function stop() { scheduler.stop('simple'); injected = false; }
  Cor3ThreeAutomation.onStop(stop);
  Cor3ThreeAutomation.onReady((token,data)=>{if(Cor3ThreeAutomation.validRun(token)&&data.autoSimpleDecryptEnabled===true){scheduler.enable('simple');inject();}});
  chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (request?.action !== 'toggleSimpleDecryptSolver') return;
    if(sender?.id!==chrome.runtime.id||request.solverExpectedDocumentId!==Cor3Automation.contentDocumentId){reply({success:false});return;}
    if (request.enabled !== false && !Cor3ThreeAutomation.allowed()) {
      reply({success:false,ok:false,cor3ObservableError:'AUTOMATION_GATE_CLOSED'}); return;
    }
    if (request.enabled === true) { scheduler.enable('simple'); inject(); }
    else if (request.enabled === false) stop();
    else { reply({success:false,ok:false}); return; }
    reply({success:true});
  });
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'COR3_SIMPLE_DECRYPT_STATUS') return;
    if (!scheduler.accepts('simple', event.data)) return;
    Cor3CenterStore.set({simpleDecryptSolverStatus:{message:event.data.message,level:event.data.level || 'info',timestamp:Date.now()}});
  });
})();


