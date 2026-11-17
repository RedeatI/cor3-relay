/* Local, dependency-free master-switch state. No network or browser side effects. */
(function (root) {
  "use strict";
  function createGate(latchUntilReload) {
    let ready = false, paused = true, latched = false, generation = 0;
    const listeners = new Set();
    function allowed() { return ready && !paused && !latched; }
    function snapshot() { return { ready, paused, reloadRequired: latched, generation, allowed: allowed() }; }
    function apply(nextPaused) {
      nextPaused = nextPaused !== false;
      const wasAllowed = allowed();
      if (!ready || paused !== nextPaused || nextPaused) generation++;
      ready = true;
      paused = nextPaused;
            // No artificial reload latch. Every stop invalidates old run generations.
      latched = false;
      if (!allowed() && (wasAllowed || paused)) {
        for (const listener of listeners) listener(snapshot());
      }
      return snapshot();
    }
    return {
      allowed, apply, snapshot,
      token: () => generation,
      valid: (token) => allowed() && token === generation,
      onStop(fn) { listeners.add(fn); if (ready && !allowed()) fn(snapshot()); return () => listeners.delete(fn); }
    };
  }
  // Only passive game queries are allowed through an already stopped page.
  // Room changes, endpoint changes, generic DevTools packets and unknown messages fail closed.
  const readPackets = new Set([
    "desktop/get.file.analysis", "desktop/get.options", "drone-missions/get.archived", "drone-missions/get.options",
    "expeditions/get.active", "expeditions/get.archived", "expeditions/get.config", "expeditions/get.mercenaries",
    "loadout/get.options", "market/get.jobs", "market/get.lots", "market/get.options", "market/get.sellable-items",
    "network-map/get.map", "sai/get.files", "sai/get.login.status", "sai/get.logs", "sai/get.transit",
    "specialists/get.state", "updater/get.patches"
  ]);
  function isReadOnlyPacket(packet) {
    try {
      if (typeof packet !== "string" || !packet.startsWith("42")) return false;
      const decoded = JSON.parse(packet.slice(2));
      const event = decoded[1] && decoded[1].event;
      return !!(decoded[0] === "event" && event && readPackets.has(event.name + "/" + event.action));
    } catch (_) { return false; }
  }
  const readActions = new Set([
    "requestExpeditions", "requestNetworkMap", "requestStash", "requestSpecialists", "requestLoadout",
    "requestMarket", "requestDarkMarket", "requestSoyuzMarket", "requestUsolMarket", "requestArchivedExpeditions",
    "requestMercenaries", "requestUsolMercenaries", "requestExpeditionConfig", "fetchDailyOps", "getVersionFallbacks",
    "requestDroneOptions", "requestDroneArchived", "requestMail", "keepWorkerAlive",
    "stopAutoJobs", "stopValuable", "disableBackground", "enableBackground", "disableNetworkFog", "enableNetworkFog",
    "moveNotificationsLeft", "moveNotificationsRight", "stopStashSort"
  ]);
  function isAllowedRequest(request) {
    return !!request && (readActions.has(request.action) ||
      (/^toggle(?:Decrypt|IceWall|SimpleDecrypt|DailyHack)Solver$/.test(request.action || "") && request.enabled === false));
  }
  const api = { createGate, isReadOnlyPacket, isAllowedRequest };
  root.Cor3MasterCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);



