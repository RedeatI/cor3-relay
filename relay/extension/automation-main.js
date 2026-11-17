/* Runs before game-facing helpers, including the external Simple Hack frame. */
(function () {
  "use strict";
  if (window.__cor3MasterGate) return;
  const gate = Cor3MasterCore.createGate(true);
  const threeGate = Cor3MasterCore.createGate(true);
  const featureAllowed = name => name === "daily" ? gate.allowed() : threeGate.allowed();
  const errors = [];
  const stopHooks = new Set();
  const readyHooks = new Set();
  let announcedReady = false;
  gate.onStop(() => {

    window.__dailyHackAbort = true;


    if (window.__cor3AntiAfkTimer) clearInterval(window.__cor3AntiAfkTimer);
    window.__cor3AntiAfkTimer = null;
    for (const hook of stopHooks) {
      try { hook(); } catch (error) { errors.push(String(error && error.message || error)); }
    }
    for (const type of ["COR3_AUTOJOB_STOP", "COR3_VALUABLE_STOP", "COR3_STOP_DAILY_HACK"]) {
      window.postMessage({ type }, location.origin);
    }
  });
  // MAIN observations are advisory: the page can modify this realm.
  const lifecycle = Object.fromEntries(['daily', 'ice', 'decrypt', 'simple'].map(name => [name, {
    generation: 0, closed: true, observed: false, ticket: null, runTicket: null, active: new Set()
  }]));
  function closeFeature(name) {
    const state = lifecycle[name];
    state.generation++;
    state.closed = true;
    state.ticket = null;
    state.runTicket = null;
    for (const run of state.active) run.cancel();
    if (['decrypt','simple'].includes(name)) state.active.clear();
  }
  gate.onStop(() => closeFeature("daily"));
  threeGate.onStop(() => { for(const name of ["decrypt","ice","simple"])closeFeature(name);window.__solverAbort=true;window.__iceWallSolverAbort=true;window.__simpleDecryptSolverAbort=true; });
  window.__cor3SolverLifecycle = {
    begin(name, ticket) {
      const state = lifecycle[name];
      if (!state || !featureAllowed(name) || state.closed || !ticket || state.ticket !== ticket || state.active.size) return null;
      state.ticket = null;
      state.runTicket = ticket;
      state.observed = true;
      const generation = state.generation;
      let cancelled = false;
      const waiters = new Set();
      const run = {
        valid: () => !cancelled && generation === state.generation && !state.closed && featureAllowed(name),
        cancel() { cancelled = true; for (const finish of [...waiters]) finish(); },
        sleep(ms) { return new Promise(resolve => {
          let timer;
          const finish = () => { clearTimeout(timer); waiters.delete(finish); resolve(); };
          waiters.add(finish); timer = setTimeout(finish, ms);
          if (!run.valid()) finish();
        }); },
        finish() { run.cancel(); state.active.delete(run); if (state.runTicket === ticket) state.runTicket = null; }
      };
      state.active.add(run);
      return run;
    }
  };
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || !event.data) return;
    const data = event.data;
    if (data.type === 'COR3_LIFECYCLE_CLOSE_IDLE' && ['daily','decrypt','simple'].includes(data.feature)) {
      const state = lifecycle[data.feature];
      // A delayed idle close cannot invalidate a later prepared or active run.
      if (state.active.size === 0 && state.ticket === null && state.runTicket === null) closeFeature(data.feature);
    }
    if (data.type === 'COR3_LIFECYCLE_CLOSE' && ['daily','decrypt','simple'].includes(data.feature)) {
      const state = lifecycle[data.feature];
      if (data.lifecycleTicket && (data.lifecycleTicket === state.ticket || data.lifecycleTicket === state.runTicket)) closeFeature(data.feature);
    }
    if (data.type === 'COR3_STOP_DAILY_HACK') {
      const state = lifecycle.daily;
      // Legacy/master stops are unscoped. A supplied ticket may close only its
      // own prepared/active run, never a replacement after a delayed delivery.
      if (!Object.prototype.hasOwnProperty.call(data, 'lifecycleTicket') ||
          (typeof data.lifecycleTicket === 'string' && data.lifecycleTicket &&
           (data.lifecycleTicket === state.ticket || data.lifecycleTicket === state.runTicket))) closeFeature('daily');
    }
    if (data.type === 'COR3_STOP_ICE_WALL_SOLVER') closeFeature('ice');
    if (data.type === 'COR3_LIFECYCLE_PREPARE' && ['daily','ice','decrypt','simple'].includes(data.feature) &&
        typeof data.nonce === 'string' && /^[a-f0-9]{32}$/.test(data.nonce)) {
      const state = lifecycle[data.feature];
      const allowed = featureAllowed(data.feature) && state.active.size === 0;
      if (allowed) { state.closed = false; state.runTicket = null; state.ticket = data.nonce; }
      window.postMessage({type:'COR3_LIFECYCLE_PREPARED', nonce:data.nonce, allowed}, location.origin);
    }
    if (data.type === 'COR3_LIFECYCLE_PROBE' && typeof data.nonce === 'string' && /^[a-f0-9]{32}$/.test(data.nonce)) {
      const snapshot = {};
      for (const name of ['daily','ice','decrypt','simple']) {
        const state = lifecycle[name];
        const closed = state.closed && state.generation > 0;
        const fenced = [...state.active].every(run => !run.valid());
        // Scope: no future feature DOM effects, not physical Promise/storage/server settlement.
        snapshot[name] = {state:closed && fenced ? 'stopped' : state.active.size ? 'running' : 'unknown',
          guardClosed:closed,queuesInvalidated:closed && state.ticket === null,activeRunsAborted:closed && fenced};
      }
      window.postMessage({type:'COR3_LIFECYCLE_SNAPSHOT', nonce:data.nonce, snapshot}, location.origin);
    }
  });
  window.__cor3MasterGate = {
    allowed: gate.allowed, snapshot: gate.snapshot,
    permitsPacket: (packet) => gate.allowed() || Cor3MasterCore.isReadOnlyPacket(packet),
    onStop(fn) { stopHooks.add(fn); if (gate.snapshot().ready && !gate.allowed()) fn(); },
    onReady(fn) { readyHooks.add(fn); if (gate.allowed()) fn(); }
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin || !event.data) return;
    if(event.data.type==='COR3_THREE_STATE'){
      threeGate.apply(event.data.paused);
      window.postMessage({type:'COR3_THREE_ACK',requestId:event.data.requestId,allowed:threeGate.allowed()},location.origin);return;
    }
    if (event.data.type !== "COR3_MASTER_STATE") return;
    gate.apply(event.data.paused);
    if (gate.allowed() && !announcedReady) {
      announcedReady = true;
      for (const fn of readyHooks) { try { fn(); } catch (error) { errors.push(String(error && error.message || error)); } }
    }
    window.postMessage({ type: "COR3_MASTER_ACK", requestId: event.data.requestId, state: gate.snapshot(), errors: errors.slice() }, location.origin);
  });
})();


