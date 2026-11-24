(() => {
  function masterAllowed() { return !!window.__cor3MasterGate && window.__cor3MasterGate.allowed(); }
  const engineTicket=document.currentScript?.dataset?.cor3EngineTicket;
  const ready=()=>window.postMessage({type:'COR3_AUTOJOB_ENGINE_READY',ticket:engineTicket},location.origin);
  if (!masterAllowed()) return;
  if(window.__cor3AutoJobEngineInstalled){ready();return;}
  // src/shared/server-constants.js
  var HOME_SERVER_ID = "019c0a5b-eeeb-7d3e-b9c9-fd5c2ba7d399";
  var MARKET_IDS = {
    home: "019d3ea4-85bd-7389-904d-8f7c85841134",
    dark: "019d3ea4-85bd-7389-904d-908ba9194aa0",
    soyuz: "019da731-2db5-7d76-9447-1ea3b9b78001",
    usol: "019e4065-6ae8-760d-8724-58ab4f2cf7d7"
  };
  var MARKET_SERVER_IDS = {
    dark: "019d29c5-4b37-79bf-b23e-304d8ea03c15",
    soyuz: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108",
    usol: "019e4052-c317-7388-9d71-883ffb1560cd"
  };
  var MARKET_DISPLAY_NAMES = { home: "HOME", dark: "D4RK", soyuz: "SOYUZ", usol: "USOL" };
  var MARKET_SERVER_NAMES = { dark: "D4RK RM7CE", soyuz: "SRM7-M", usol: "URM7-M" };
  var MARKET_ID_TO_NAME = {
    "019d3ea4-85bd-7389-904d-8f7c85841134": "HOME",
    "019d3ea4-85bd-7389-904d-908ba9194aa0": "D4RK",
    "019da731-2db5-7d76-9447-1ea3b9b78001": "SOYUZ",
    "019e4065-6ae8-760d-8724-58ab4f2cf7d7": "USOL"
  };
  var MARKET_SELL_ORDER = [
    { name: "USOL", id: MARKET_IDS.usol, serverId: MARKET_SERVER_IDS.usol },
    { name: "SOYUZ", id: MARKET_IDS.soyuz, serverId: MARKET_SERVER_IDS.soyuz },
    { name: "D4RK", id: MARKET_IDS.dark, serverId: MARKET_SERVER_IDS.dark },
    { name: "HOME", id: MARKET_IDS.home, serverId: null }
  ];
  var JOB_TYPE_PRIORITY = [
    "File Decryption",
    "Log Deletion",
    "File Elimination",
    "Log Download",
    "Data Download",
    "Decrypt & Extract",
    "IP Injection",
    "IP Cleanup",
    "Data Upload"
  ];
  var MARKET_RESET_DURATIONS_MS = {
    home: 6 * 60 * 60 * 1e3,
    dark: 12 * 60 * 60 * 1e3,
    soyuz: 10 * 60 * 60 * 1e3,
    usol: 8 * 60 * 60 * 1e3
  };
  var LOG_JOB_TYPES = ["Log Deletion", "Log Download"];
  function getMarketNameById(marketId) {
    return MARKET_ID_TO_NAME[marketId] || marketId;
  }

  // src/shared/ws-utils.js
  function humanDelay() {
    return 800 + Math.floor(Math.random() * 700);
  }
  function createSendCmd(messageType) {
    messageType = messageType || "COR3_AUTOJOB_CMD";
    return function sendCmd2(cmd, data) {
      window.postMessage({ type: messageType, cmd, data: data || {} }, "*");
    };
  }

  function safeTimeout(fn, ms) {
    return setTimeout(fn, ms);
  }
  function safeClearTimeout(id) {
    clearTimeout(id);
  }
  function createDelay(abortFlagFn) {
    return function delay2(ms) {
      return new Promise((resolve, reject) => {
        const deadline = Date.now() + ms;
        function check() {
          if (abortFlagFn?.()) { reject(new Error("Aborted")); return; }
          const remaining = deadline - Date.now();
          if (remaining <= 0) { resolve(); return; }
          setTimeout(check, Math.min(remaining, 1000));
        }
        check();
      });
    };
  }
  function createWaitForEvent(abortFlagFn) {
    return function waitForEvent2(eventType, timeoutMs, predicate) {
      return new Promise((resolve, reject) => {
        const deadline = Date.now() + (timeoutMs || 15000);
        let timer;
        function cleanup() {
          clearTimeout(timer);
          window.removeEventListener("message", handler);
        }
        function handler(evt) {
          if (evt.data?.type !== eventType || (predicate && !predicate(evt.data))) return;
          cleanup();
          if (abortFlagFn?.()) reject(new Error("Aborted"));
          else resolve(evt.data);
        }
        function check() {
          const remaining = deadline - Date.now();
          const aborted = abortFlagFn?.();
          if (aborted || remaining <= 0) {
            cleanup();
            reject(new Error(aborted ? "Aborted" : "Timeout waiting for " + eventType));
            return;
          }
          timer = setTimeout(check, Math.min(remaining, 1000));
        }
        window.addEventListener("message", handler);
        check();
      });
    };
  }
  function createLogger(prefix, messageType) {
    return function log2(msg, level) {
      level = level || "info";
      console.log(prefix, msg);
      window.postMessage({ type: messageType, msg, level }, "*");
    };
  }

  // src/shared/hack-utils.js
  function detectHackType(pollMs) {
    pollMs = pollMs || 5e3;
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = 200;
      function check() {
        if (document.querySelector('[data-component-name="WallBoard"]') || document.querySelector('[data-component-name="IceWallBreakApplication"]') || document.querySelector('[data-sentry-component="IceWallBreakApplication"]')) return resolve("ice-wall");
        if (document.querySelector('[data-sentry-component="ConfigHackApplication"]')) return resolve("decrypt");
        if (document.querySelector('[data-component-name="SimpleDecryptApplication"]') || document.querySelector('[data-sentry-component="SimpleDecryptApplication"]')) return resolve("simple-decrypt");
        elapsed += interval;
        if (elapsed >= pollMs) return resolve(null);
        safeTimeout(check, interval);
      }
      check();
    });
  }
  function isHackMinigameOpen() {
    return globalThis.Cor3PageLifetime.timedWindows().length>0;
  }
  function waitForHackMinigameClose(waitMs) {
    waitMs = waitMs || 12e4;
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = 300;
      function check() {
        if (!isHackMinigameOpen()) return resolve(true);
        elapsed += interval;
        if (elapsed >= waitMs) return resolve(false);
        safeTimeout(check, interval);
      }
      check();
    });
  }
  function formatMinigameLockError(lockData) {
    var expiresAt = lockData && lockData.lockExpiresAt;
    if (!expiresAt) return null;
    var remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return null;
    var mins = Math.ceil(remaining / 6e4);
    return { message: "Minigame locked (~" + mins + "m remaining)", lockExpiresAt: expiresAt, remainingMs: remaining };
  }
  function createWaitForHackToBeDone(logFn, abortFlagFn) {
    return async function waitForHackToBeDone2() {
      logFn("Hack minigame started, waiting for solver to complete...");
      var hackSolverTimeout = 6e4;
      var hackType = await detectHackType(5e3);
      if (hackType === "ice-wall") {
        hackSolverTimeout = 12e4;
        logFn("ICE Wall hack detected \u2014 waiting up to 2 minutes");
      } else if (hackType) {
        logFn(hackType + " hack detected \u2014 waiting up to 60s");
      } else {
        logFn("Could not detect hack type \u2014 using default 60s timeout", "warn");
      }
      var saiUpdateReceived = false;
      var canPollClose = !!hackType;
      try {
        await new Promise(function(resolve, reject) {
          var done = false;
          function onEvent(evt) {
            if (evt.data && evt.data.type === "COR3_AUTOJOB_SAI_UPDATE") {
              if (!done) {
                done = true;
                window.removeEventListener("message", onEvent);
                safeClearTimeout(pollTimerId);
                safeClearTimeout(timeoutTimerId);
                saiUpdateReceived = true;
                resolve();
              }
            }
          }
          window.addEventListener("message", onEvent);
          var pollTimerId = 0;
          function pollClose() {
            if (done) return;
            if (abortFlagFn && abortFlagFn()) {
              if (!done) {
                done = true;
                window.removeEventListener("message", onEvent);
                safeClearTimeout(timeoutTimerId);
                reject(new Error("Aborted"));
              }
              return;
            }
            if (canPollClose && !isHackMinigameOpen()) {
              if (!done) {
                done = true;
                window.removeEventListener("message", onEvent);
                safeClearTimeout(timeoutTimerId);
                resolve();
              }
            } else {
              pollTimerId = safeTimeout(pollClose, 500);
            }
          }
          pollTimerId = safeTimeout(pollClose, 500);
          var timeoutTimerId = safeTimeout(function() {
            if (!done) {
              done = true;
              window.removeEventListener("message", onEvent);
              safeClearTimeout(pollTimerId);
              reject(new Error("timeout"));
            }
          }, hackSolverTimeout);
        });
      } catch (e) {
        if (abortFlagFn && abortFlagFn()) {
          logFn("Hack wait aborted by user", "warn");
          return;
        }
        logFn("Hack solver did not complete in " + hackSolverTimeout / 1e3 + "s \u2014 checking login status directly", "warn");
      }
      if (saiUpdateReceived) {
        logFn("Hack completed (SAI update)", "success");
      } else if (canPollClose && !isHackMinigameOpen()) {
        logFn("Hack completed (minigame closed)", "success");
      }
      if (isHackMinigameOpen()) {
        logFn("Waiting for hack minigame dialog to close...");
        await waitForHackMinigameClose(3e4);
      }
    };
  }
  function ensureDecryptSolverEnabled() {
    window.postMessage({ type: "COR3_AUTOJOB_ENABLE_DECRYPT_SOLVER" }, "*");
  }
  function ensureIceWallSolverEnabled() {
    window.postMessage({ type: "COR3_AUTOJOB_ENABLE_ICE_WALL_SOLVER" }, "*");
  }
  function ensureSimpleDecryptSolverEnabled() {
    window.postMessage({ type: "COR3_AUTOJOB_ENABLE_SIMPLE_DECRYPT_SOLVER" }, "*");
  }
  function waitForMinigameWindow(graceMs) {
    graceMs = graceMs || 5e3;
    return new Promise(function(resolve) {
      var elapsed = 0;
      var interval = 500;
      function poll() {
        const open = globalThis.Cor3PageLifetime.timedWindows();
        if (open.length) {
          const name = node => node.getAttribute('data-component-name') || node.getAttribute('data-sentry-component') || '';
          if (open.some(node => name(node)==='IceWallBreakApplication')) resolve('icewall');
          else if (open.some(node => /Simple/.test(name(node)))) resolve('simple-decrypt');
          else resolve('timed-game');
          return;
        }
        elapsed += interval;
        if (elapsed >= graceMs) {
          resolve(null);
          return;
        }
        safeTimeout(poll, interval);
      }
      poll();
    });
  }
  function waitingIceShell() {
    const policy = globalThis.Cor3PageLifetime;
    const open = policy.timedWindows();
    return open.length === 1 && policy.emptyIce(open[0]) ? open[0] : null;
  }
  function waitForIceWallStuckClear(logFn, maxWaitMs = 180000) {
    const shell = waitingIceShell();
    if (!shell) return Promise.resolve({ held: false });
    logFn('ICE Wall is waiting for its secure channel');
    return new Promise((resolve, reject) => {
      let since = performance.now(), last = since;
      function poll() {
        if (state.abortFlag || !masterAllowed()) { reject(new Error('Aborted')); return; }
        if (waitingIceShell() !== shell) { resolve({ held: false }); return; }
        const now = performance.now();
        if (now - last > 95000) since = now;
        last = now;
        if (now - since >= maxWaitMs) { resolve({ held: true }); return; }
        safeTimeout(poll, 2000);
      }
      poll();
    });
  }

  // src/shared/server-map.js
  function ServerMap() {
    this._servers = {};
    this._adjacency = {};
    this._homeId = null;
    this._ready = false;
    this._pathCache = {};
    this._serverPriority = null;
  }
  ServerMap.prototype.update = function(mapData) {
    if (!mapData || !mapData.servers || !mapData.connections) return;
    this._servers = {};
    this._adjacency = {};
    this._pathCache = {};
    this._serverPriority = null;
    this._homeId = null;
    var servers = Array.isArray(mapData.servers) ? mapData.servers : [];
    var connections = Array.isArray(mapData.connections) ? mapData.connections : [];
    for (var i = 0; i < servers.length; i++) {
      var s = servers[i];
      this._servers[s.id] = {
        id: s.id,
        name: s.serverName,
        ip: s.serverIp,
        typeName: s.serverTypeName || null,
        cluster: s.serverCluster || null,
        faction: s.faction || null,
        defenceRate: s.serverDefenceRate || 0,
        isInMaintenance: !!s.isInMaintenance,
        maintenanceEndsAt: s.maintenanceEndsAt || null,
        timeUntilMaintenance: s.timeUntilMaintenance || null,
        isDiscovered: s.isDiscovered !== false,
        isAccessible: !!s.isAccessible,
        isReachable: !!s.isReachable,
        accessType: s.accessType || "none",
        hasAdminAccess: !!s.hasAdminAccess,
        isEndpoint: !!s.isEndpoint,
        canSetEndpoint: s.canSetEndpoint !== false,
        marketId: s.marketId || null,
        transitType: s.transitType || null
      };
      this._adjacency[s.id] = [];
      if (s.serverTypeName === "Home" || s.serverName === "Home Server" || s.id === HOME_SERVER_ID) {
        this._homeId = s.id;
      }
    }
    for (var j = 0; j < connections.length; j++) {
      var c = connections[j];
      if (this._adjacency[c.serverA] && this._adjacency[c.serverB]) {
        this._adjacency[c.serverA].push({ targetId: c.serverB, connectionId: c.id, isHidden: !!c.isHidden });
        this._adjacency[c.serverB].push({ targetId: c.serverA, connectionId: c.id, isHidden: !!c.isHidden });
      }
    }
    this._ready = true;
  };
  ServerMap.prototype.isReady = function() {
    return this._ready;
  };
  ServerMap.prototype.getServer = function(serverId) {
    return this._servers[serverId] || null;
  };
  ServerMap.prototype.getServerByName = function(name) {
    for (var id in this._servers) {
      if (this._servers[id].name === name) return this._servers[id];
    }
    return null;
  };
  ServerMap.prototype.getServerIdByName = function(name) {
    var s = this.getServerByName(name);
    return s ? s.id : null;
  };
  ServerMap.prototype.getAllServers = function() {
    return this._servers;
  };
  ServerMap.prototype.getHomeId = function() {
    return this._homeId;
  };
  ServerMap.prototype.findAllPaths = function(targetId, opts) {
    if (!this._ready || !this._homeId) return [];
    if (targetId === this._homeId) return [[]];
    var skipMaintenance = !opts || opts.skipMaintenance !== false;
    var maintFp = skipMaintenance ? this.getMaintenanceFingerprint() : "";
    var cacheKey = targetId + "|" + (skipMaintenance ? "sm:" + maintFp : "all");
    if (this._pathCache[cacheKey]) return this._pathCache[cacheKey];
    var allPaths = [];
    var visited = {};
    var self = this;
    function dfs(currentId, path) {
      if (currentId === targetId) {
        allPaths.push(path.slice());
        return;
      }
      var neighbors = self._adjacency[currentId];
      if (!neighbors) return;
      for (var i = 0; i < neighbors.length; i++) {
        var nb = neighbors[i];
        if (!visited[nb.targetId]) {
          if (skipMaintenance && nb.targetId !== targetId) {
            var srv = self._servers[nb.targetId];
            if (srv && srv.isInMaintenance) {
              var remaining = srv.maintenanceEndsAt ? new Date(srv.maintenanceEndsAt).getTime() - Date.now() : 0;
              if (remaining > 0) continue;
            }
          }
          visited[nb.targetId] = true;
          path.push({ id: nb.targetId, name: (self._servers[nb.targetId] || {}).name || nb.targetId, isHidden: nb.isHidden });
          dfs(nb.targetId, path);
          path.pop();
          visited[nb.targetId] = false;
        }
      }
    }
    visited[this._homeId] = true;
    dfs(this._homeId, []);
    allPaths.sort(function(a, b) {
      return a.length - b.length;
    });
    this._pathCache[cacheKey] = allPaths;
    return allPaths;
  };
  ServerMap.prototype.getShortestPath = function(targetId) {
    var paths = this.findAllPaths(targetId);
    return paths.length > 0 ? paths[0] : null;
  };
  ServerMap.prototype.getShortestPathByName = function(serverName) {
    var id = this.getServerIdByName(serverName);
    if (!id) return null;
    return this.getShortestPath(id);
  };
  ServerMap.prototype.findAllPathsByName = function(serverName) {
    var id = this.getServerIdByName(serverName);
    if (!id) return [];
    return this.findAllPaths(id);
  };
  ServerMap.prototype.checkPathMaintenance = function(targetServerNameOrId) {
    if (!this._ready) return { blocked: false };
    var targetId = this._servers[targetServerNameOrId] ? targetServerNameOrId : this.getServerIdByName(targetServerNameOrId);
    if (!targetId) return { blocked: false };
    var reachablePaths = this.findAllPaths(targetId);
    if (reachablePaths.length > 0) return { blocked: false, usedPath: reachablePaths[0] };
    var allPaths = this.findAllPaths(targetId, { skipMaintenance: false });
    if (allPaths.length === 0) return { blocked: true, blockerName: "no-path", endsAt: null, remainingMs: 0 };
    var firstBlocker = null;
    var firstPath = allPaths[0];
    for (var bi = 0; bi < firstPath.length; bi++) {
      var bsrv = this._servers[firstPath[bi].id];
      if (bsrv && bsrv.isInMaintenance) {
        var bRemaining = bsrv.maintenanceEndsAt ? new Date(bsrv.maintenanceEndsAt).getTime() - Date.now() : 0;
        if (bRemaining > 0) {
          firstBlocker = { blocked: true, blockerName: bsrv.name, endsAt: bsrv.maintenanceEndsAt, remainingMs: bRemaining };
          break;
        }
      }
    }
    return firstBlocker || { blocked: true, blockerName: "unknown", endsAt: null, remainingMs: 0 };
  };
  ServerMap.prototype.findBestReachablePath = function(targetServerNameOrId) {
    if (!this._ready) return null;
    var targetId = this._servers[targetServerNameOrId] ? targetServerNameOrId : this.getServerIdByName(targetServerNameOrId);
    if (!targetId) return null;
    var allPaths = this.findAllPaths(targetId);
    return allPaths.length > 0 ? allPaths[0] : null;
  };
  ServerMap.prototype.getMaintenanceFingerprint = function() {
    var parts = [];
    for (var id in this._servers) {
      var s = this._servers[id];
      if (s.isInMaintenance) {
        parts.push(id + ":M:" + (s.maintenanceEndsAt || ""));
      } else if (s.timeUntilMaintenance) {
        parts.push(id + ":U:" + s.timeUntilMaintenance);
      }
    }
    parts.sort();
    return parts.join("|");
  };
  ServerMap.prototype.getServerPriority = function() {
    if (this._serverPriority) return this._serverPriority;
    if (!this._ready || !this._homeId) return [];
    var result = [];
    for (var id in this._servers) {
      if (id === this._homeId) continue;
      var s = this._servers[id];
      var path = this.getShortestPath(id);
      if (path) {
        result.push({ id, name: s.name, pathLength: path.length });
      }
    }
    result.sort(function(a, b) {
      return b.pathLength - a.pathLength;
    });
    this._serverPriority = result.map(function(r) {
      return r.name;
    });
    return this._serverPriority;
  };
  ServerMap.prototype.getServerPriorityIndex = function(serverName) {
    if (!serverName || serverName === "None") return -1;
    var priority = this.getServerPriority();
    var idx = priority.indexOf(serverName);
    return idx >= 0 ? idx : priority.length;
  };
  ServerMap.prototype.getMaintenanceInfo = function() {
    var info = {};
    for (var id in this._servers) {
      var s = this._servers[id];
      info[id] = {
        serverName: s.name,
        isInMaintenance: s.isInMaintenance,
        maintenanceEndsAt: s.maintenanceEndsAt,
        timeUntilMaintenance: s.timeUntilMaintenance
      };
    }
    return info;
  };
  ServerMap.prototype.getServerTypeMap = function() {
    var map = {};
    for (var id in this._servers) {
      var s = this._servers[id];
      map[id] = {
        serverName: s.name,
        serverTypeName: s.typeName,
        serverDefenceRate: s.defenceRate
      };
    }
    return map;
  };
  ServerMap.prototype.toJSON = function() {
    return {
      servers: this._servers,
      adjacency: this._adjacency,
      homeId: this._homeId,
      ready: this._ready
    };
  };
  ServerMap.prototype.fromJSON = function(json) {
    if (!json) return;
    this._servers = json.servers || {};
    this._adjacency = json.adjacency || {};
    this._homeId = json.homeId || null;
    this._ready = !!json.ready;
    this._pathCache = {};
    this._serverPriority = null;
  };
  ServerMap.prototype.getPathForServer = function(serverName) {
    if (this._ready) {
      var id = this.getServerIdByName(serverName);
      if (id) {
        var path = this.getShortestPath(id);
        if (path) return path;
      }
    }
    return FALLBACK_PATH_MAP[serverName] || null;
  };
  ServerMap.prototype.getServerNameById = function(serverId) {
    if (this._ready) {
      var s = this._servers[serverId];
      if (s) return s.name;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      for (var i = 0; i < path.length; i++) {
        if (path[i].id === serverId) return path[i].name;
      }
    }
    return null;
  };
  ServerMap.prototype.getPathForServerId = function(serverId) {
    if (this._ready) {
      var path = this.getShortestPath(serverId);
      if (path) return path;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      if (path.length > 0 && path[path.length - 1].id === serverId) {
        return path;
      }
    }
    return null;
  };
  ServerMap.prototype.getServerIdByNameOrFallback = function(serverName) {
    if (this._ready) {
      var id = this.getServerIdByName(serverName);
      if (id) return id;
    }
    var fb = FALLBACK_PATH_MAP[serverName];
    if (fb && fb.length > 0) return fb[fb.length - 1].id;
    return null;
  };
  ServerMap.prototype.getAllServerIds = function() {
    if (this._ready) {
      var result = {};
      for (var id in this._servers) {
        result[id] = this._servers[id].name;
      }
      return result;
    }
    var result = {};
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      var last = path[path.length - 1];
      result[last.id] = name;
    }
    return result;
  };
  ServerMap.prototype.getPathLength = function(serverId) {
    if (this._ready) {
      var path = this.getShortestPath(serverId);
      if (path) return path.length;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var p = FALLBACK_PATH_MAP[name];
      var last = p[p.length - 1];
      if (last.id === serverId) return p.length;
    }
    return 0;
  };
  var FALLBACK_SERVER_PRIORITY = [
    "URM7-H",
    "URM7-M",
    "URM7-S5L2",
    "B43274N",
    "B43272N",
    "B43271N",
    "D4RK RM7EG",
    "SRM7-N3L2",
    "SRM7-M",
    "SRM7-N4L2",
    "SRM7-N3L1",
    "RM7-N1L1",
    "RM7-W3NCP",
    "RM7-N2L3",
    "RM7-N2L2",
    "RM7-N2ECP",
    "D4RK RM7CE",
    "RM7-S4WCP",
    "RM7-S4L3",
    "RM7-S4L1",
    "RM7-S4L4",
    "RM7-S4L2",
    "RM7-E1SCP",
    "RM7-E1L2CT",
    "RM7-E1L5",
    "RM7-E1L3"
  ];
  var FALLBACK_PATH_MAP = {
    "RM7-E1L3": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" }
    ],
    "RM7-E1L5": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" }
    ],
    "RM7-E1L2CT": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" }
    ],
    "RM7-E1SCP": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" }
    ],
    "RM7-S4L4": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" }
    ],
    "D4RK RM7CE": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" }
    ],
    "D4RK RM7MI": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" }
    ],
    "D4RK 2IV2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK 2IV2", id: "019d29c5-4b37-7de9-b46c-022179bcb5eb" }
    ],
    "RM7-N2ECP": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" }
    ],
    "RM7-N2L2": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" }
    ],
    "RM7-N2L3": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" }
    ],
    "RM7-W3NCP": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" }
    ],
    "RM7-N1L1": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" }
    ],
    "RM7-S4L2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" }
    ],
    "RM7-S4L3": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" }
    ],
    "RM7-S4L1": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" },
      { name: "RM7-S4L1", id: "019e4052-c315-71df-80da-4e334b96c9e6" }
    ],
    "RM7-S4WCP": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4WCP", id: "019e4052-c316-73aa-81f6-448645a38c9e" }
    ],
    "D4RK RM7EG": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" },
      { name: "D4RK RM7EG", id: "019e4052-c316-73aa-81f6-483e50247e61" }
    ],
    "B43271N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" },
      { name: "B43271N", id: "019e4052-c316-73aa-81f6-567c9a8f5738" }
    ],
    "B43272N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" },
      { name: "B43271N", id: "019e4052-c316-73aa-81f6-567c9a8f5738" },
      { name: "B43272N", id: "019e4052-c316-73aa-81f6-5aa82fc72bdd" }
    ],
    "B43274N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" },
      { name: "D4RK RM7EG", id: "019e4052-c316-73aa-81f6-483e50247e61" },
      { name: "B43274N", id: "019e4052-c316-73aa-81f6-60ec61b61f0a" }
    ],
    "URM7-S5L2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" },
      { name: "URM7-S5L2", id: "019e4052-c317-7388-9d71-85b98a02d5fb" }
    ],
    "URM7-M": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" },
      { name: "URM7-S5L2", id: "019e4052-c317-7388-9d71-85b98a02d5fb" },
      { name: "URM7-M", id: "019e4052-c317-7388-9d71-883ffb1560cd" }
    ],
    "URM7-H": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" },
      { name: "RM7-S4L1", id: "019e4052-c315-71df-80da-4e334b96c9e6" },
      { name: "URM7-H", id: "019e4052-c317-7388-9d71-8fed6faaaf99" }
    ],
    "SRM7-M": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" },
      { name: "RM7-N3L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a107" },
      { name: "SRM7-M", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108" }
    ],
    "SRM7-N3L2": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" },
      { name: "RM7-N3L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a107" },
      { name: "SRM7-M", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108" },
      { name: "SRM7-N3L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a109" }
    ]
  };

  // src/auto-job-solver/state.js
  var state = {
    jobQueue: [],
    running: false,
    abortFlag: false,
    tokenExpired: false,
    solverSettings: {},
    _currentJobRef: null,
    currentJobIndex: 0,
    downloadFolderId: null,
    _lastEndpointServerId: null,
    _cachedMapData: null,
    _cachedLoadout: null,
    _cachedLoadoutAt: 0,
    _lastLoadoutFetchAt: 0,
    _lastLoadoutServerType: null,
    LOADOUT_COOLDOWN_MS: 2e3
  };
  var DARK_MARKET_SERVER_ID = MARKET_SERVER_IDS.dark;
  var SOYUZ_MARKET_SERVER_ID = MARKET_SERVER_IDS.soyuz;
  var USOL_MARKET_SERVER_ID = MARKET_SERVER_IDS.usol;
  var serverMap = new ServerMap();
  var sendCmd = createSendCmd("COR3_AUTOJOB_CMD");
  var delay = createDelay(function() {
    return state.abortFlag;
  });
  var waitForEvent = createWaitForEvent(function() {
    return state.abortFlag;
  });
  var log = createLogger("[COR3 Auto-Jobs]", "COR3_AUTOJOB_LOG");
  var waitForHackToBeDone = createWaitForHackToBeDone(log, function() {
    return state.abortFlag;
  });
  var SERVER_PRIORITY = FALLBACK_SERVER_PRIORITY;
  var SERVER_PATH_MAP = FALLBACK_PATH_MAP;
  window.addEventListener("message", function(evt) {
    if (evt.data && evt.data.type === "COR3_WS_MAP_DATA" && evt.data.servers) {
      serverMap.update({ servers: evt.data.servers, connections: evt.data.connections || [] });
    }
  });

  // src/shared/error-map.js
  var ERROR_MAP = {
    "sai-transit-ip-duplicate": "IP already exists on server",
    "sai-transit-ip-limit": "Server IP limit reached",
    "no-path-to-server": "No path to server (unreachable)",
    "server-in-maintenance": "Server is in maintenance",
    "sai-missing-software": "Missing required software",
    "missing-software": "Missing required software",
    "sai-hack-impossible": "Not enough hack power",
    "sai-no-hack-software": "No hacking software",
    "cannot-read-sai-file": "Cannot read SAI file",
    "invalid-access-token": "Access token expired or invalid",
    "token-expired": "Session token expired",
    "job-already-taken": "Job already taken previously",
    "job-not-found": "Job no longer available",
    "job-expired": "Job has expired",
    "job-conditions-not-met": "Job conditions not met",
    "sai-file-not-found": "File not found on server",
    "sai-log-not-found": "Log not found on server",
    "sai-access-denied": "Access denied to server",
    "rate-limited": "Rate limited \u2014 too many requests",
    "file-not-found": "File not found on server/folder",
    "market-not-reachable": "Market not reachable",
    "Error: File is encrypted": "Unable to decrypt that file extension. Please install the appropriate decryption software",
    "insufficient_power": "Insufficient decrypt power for this file",
    "file-already-decrypted": "File is already decrypted",
    "job-is-not-available": "Job is not available (stale data)"
  };
  function friendlyError(errMsg, failedConditions) {
    if (!errMsg) return "Unknown error";
    var friendly = "";
    if (ERROR_MAP[errMsg]) {
      friendly = ERROR_MAP[errMsg];
    } else {
      var keys = Object.keys(ERROR_MAP);
      for (var i = 0; i < keys.length; i++) {
        if (errMsg.indexOf(keys[i]) >= 0) {
          friendly = ERROR_MAP[keys[i]];
          break;
        }
      }
    }
    if (!friendly) friendly = errMsg;
    if (failedConditions && Array.isArray(failedConditions) && failedConditions.length > 0) {
      friendly += " (" + failedConditions.join(", ") + ")";
    }
    return friendly;
  }

  // src/shared/loadout-resolver.js
  var RESOURCE_KEYS = ["cpu_frequency", "cpu_cores", "gpu_power", "gpu_memory", "ram_frequency", "ram_memory"];
  function parseConsuming(vals) {
    if (!vals || !Array.isArray(vals) || vals.length < 2) return null;
    if (vals.length === 2) return { base: 0, min: vals[0], max: vals[1] };
    return { base: vals[0], min: vals[1], max: vals[2] };
  }
  function normSpecs(sw) {
    return window.Cor3LoadoutAlgorithms.abilityList(sw || {}).map(function(x) { return {...x,power:[x.minPower,x.maxPower]}; });
  }
  function calculateAnalysis(loadout, softwareIds) {
    var hw = loadout.equippedHardware || {};
    var allSoftware = [...(loadout.ownedSoftware || []),...(loadout.equippedSoftware || [])].filter(function(x,i,a) { return a.findIndex(function(y) { return y.id === x.id; }) === i; });
    var installed = allSoftware.filter(function(sw2) {
      return softwareIds.indexOf(sw2.id) >= 0;
    });
    var supply = {};
    if (hw.cpu) {
      supply.cpu_frequency = hw.cpu.specs.cpuFrequency || 0;
      supply.cpu_cores = hw.cpu.specs.cpuCores || 0;
    }
    if (hw.gpu) {
      supply.gpu_power = hw.gpu.specs.gpuPower || 0;
      supply.gpu_memory = hw.gpu.specs.gpuMemory || 0;
    }
    if (hw.ram) {
      supply.ram_frequency = hw.ram.specs.ramFrequency || 0;
      supply.ram_memory = hw.ram.specs.ramMemory || 0;
    }
    if (hw.psu) {
      supply.psu_power = hw.psu.specs.psuPower || 0;
    }
    var parsed = {};
    for (var si = 0; si < installed.length; si++) {
      var sw = installed[si];
      parsed[sw.id] = {};
      for (var ri = 0; ri < RESOURCE_KEYS.length; ri++) {
        var rk = RESOURCE_KEYS[ri];
        var p = parseConsuming(sw.consuming && sw.consuming[rk]);
        if (p) parsed[sw.id][rk] = p;
      }
    }
    var demand = {};
    for (var ri2 = 0; ri2 < RESOURCE_KEYS.length; ri2++) {
      var rk2 = RESOURCE_KEYS[ri2];
      var totalBase = 0, highestMinUplift = 0;
      for (var si2 = 0; si2 < installed.length; si2++) {
        var pc = parsed[installed[si2].id][rk2];
        if (pc) {
          totalBase += pc.base;
          highestMinUplift = Math.max(highestMinUplift, pc.min - pc.base);
        }
      }
      demand[rk2] = totalBase + highestMinUplift;
    }
    var psuDemand = 0;
    if (hw.cpu) psuDemand += hw.cpu.specs.cpuConsuming || 0;
    if (hw.gpu) psuDemand += hw.gpu.specs.gpuConsuming || 0;
    demand.psu_total = psuDemand;
    var hasAllHw = !!(hw.cpu && hw.gpu && hw.ram && hw.psu);
    var canBoot = hasAllHw;
    if (canBoot) {
      for (var ri3 = 0; ri3 < RESOURCE_KEYS.length; ri3++) {
        if ((supply[RESOURCE_KEYS[ri3]] || 0) < demand[RESOURCE_KEYS[ri3]]) {
          canBoot = false;
          break;
        }
      }
      if (canBoot && (supply.psu_power || 0) < demand.psu_total) canBoot = false;
    }
    var swAnalysis = {};
    for (var si3 = 0; si3 < installed.length; si3++) {
      var sw3 = installed[si3];
      var lowestRatio = 1, bottleneck = null;
      for (var ri4 = 0; ri4 < RESOURCE_KEYS.length; ri4++) {
        var rk4 = RESOURCE_KEYS[ri4];
        var pc4 = parsed[sw3.id][rk4];
        if (!pc4) continue;
        var otherBase = 0;
        for (var oi = 0; oi < installed.length; oi++) {
          if (installed[oi].id !== sw3.id) {
            var opc = parsed[installed[oi].id][rk4];
            if (opc) otherBase += opc.base;
          }
        }
        var avail = (supply[rk4] || 0) - otherBase;
        var ratio;
        if (pc4.max > pc4.min) {
          ratio = (avail - pc4.min) / (pc4.max - pc4.min);
          ratio = Math.max(0, Math.min(1, ratio));
        } else {
          ratio = avail >= pc4.min ? 1 : 0;
        }
        if (ratio < lowestRatio || ratio === lowestRatio && bottleneck === null) {
          lowestRatio = ratio;
          bottleneck = rk4;
        }
      }
      var specs = normSpecs(sw3);
      var abilities = specs.map(function(sp) {
        return {
          type: sp.type,
          computedPower: Math.floor(sp.power[0] + lowestRatio * (sp.power[1] - sp.power[0])),
          pMin: sp.power[0],
          pMax: sp.power[1],
          serverTypes: sp.serverTypes || null,
          fileTypes: sp.fileTypes || null
        };
      });
      swAnalysis[sw3.id] = { name: sw3.name, ratio: lowestRatio, bottleneck, abilities };
    }
    return { supply, demand, canBoot, swAnalysis, installed };
  }
  function findHackSoftwareForServerType(allSoftware, serverTypeName) {
    return abilityCandidates(allSoftware, "HACK", serverTypeName);
  }
  function findDecryptSoftwareForFileType(allSoftware, fileType) {
    return abilityCandidates(allSoftware, "DECRYPT", fileType);
  }
  function abilityCandidates(allSoftware, ability, target) {
    var algorithms = window.Cor3LoadoutAlgorithms;
    if (!algorithms) throw new Error("LOADOUT_ALGORITHMS_UNAVAILABLE");
    return (allSoftware || []).flatMap(function(sw) {
      return algorithms.abilityList(sw).filter(function(spec) {
        if (spec.type !== ability) return false;
        var types = ability === "DECRYPT" ? spec.fileTypes : spec.serverTypes;
        return !types || !types.length || types.some(function(value) { return algorithms.matchesTargetValue(value, target); });
      }).map(function(spec) { return {sw:sw, spec:spec}; });
    });
  }
  function abilityPower(analysis, softwareId, abilityType, target) {
    var sw = analysis && analysis.swAnalysis ? analysis.swAnalysis[softwareId] : null;
    if (!sw || !sw.abilities) return 0;
    var best = 0;
    for (var i = 0; i < sw.abilities.length; i++) {
      var ab = sw.abilities[i];
      if (ab.type !== abilityType) continue;
      if (target) {
        var hasServer = Array.isArray(ab.serverTypes) && ab.serverTypes.length > 0;
        var hasFile = Array.isArray(ab.fileTypes) && ab.fileTypes.length > 0;
        var matches = !hasServer && !hasFile || hasServer && ab.serverTypes.some(function(value) { return window.Cor3LoadoutAlgorithms.matchesTargetValue(value, target); }) || hasFile && ab.fileTypes.some(function(value) { return window.Cor3LoadoutAlgorithms.matchesTargetValue(value, target); });
        if (!matches) continue;
      }
      if (ab.computedPower > best) best = ab.computedPower;
    }
    return best;
  }
  function sameHardware(a, b) {
    var slots = ["cpu", "gpu", "ram", "psu"];
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var aId = a && a[slot] ? a[slot].id : null;
      var bId = b && b[slot] ? b[slot].id : null;
      if (aId !== bId) return false;
    }
    return true;
  }
  function findBestSoftwareForAbility(loadout, candidates, abilityType, requiredPower, target) {
    if (!window.Cor3LoadoutAlgorithms) throw new Error("LOADOUT_ALGORITHMS_UNAVAILABLE");
    return window.Cor3LoadoutAlgorithms.plan(loadout, candidates, abilityType, target, Number(requiredPower) || 0);
  }
  function getServerTypeName(serverId) {
    var map = typeof window !== "undefined" && window.__cor3ServerTypeMap;
    if (map && map[serverId]) return map[serverId].serverTypeName;
    return null;
  }

  // src/auto-job-solver/helpers.js
  function isJobBugged(job) {
    return job.serverName === "D4RK RM7CE" && LOG_JOB_TYPES.indexOf(job.type || job.name) >= 0;
  }
  function getServerPriority(serverName) {
    if (!serverName || serverName === "None") return -1;
    if (serverMap.isReady()) {
      return serverMap.getServerPriorityIndex(serverName);
    }
    var idx = SERVER_PRIORITY.indexOf(serverName);
    return idx >= 0 ? idx : SERVER_PRIORITY.length;
  }
  function getJobTypePriority(typeName) {
    var idx = JOB_TYPE_PRIORITY.indexOf(typeName);
    return idx >= 0 ? idx : JOB_TYPE_PRIORITY.length;
  }
  function updateTracker() {
    window.postMessage({ type: "COR3_AUTOJOB_TRACKER_UPDATE", tracker: state.jobQueue,runTicket:state.runTicket }, location.origin);
  }
  function saveCompletedResultsIncremental() {
    var results = state.jobQueue.filter(function(j) {
      return j.status === "done" || j.status === "failed" || j.status === "skipped" || j.status === "bugged";
    }).map(function(j) {
      return {
        jobId: j.jobId,
        name: j.name,
        type: j.type,
        serverName: j.serverName,
        marketKey: j.marketKey,
        status: j.status,
        reward: j.reward || null,
        error: j.error || null,
        completedAt: Date.now(),
        maintenanceEndsAt: j.maintenanceEndsAt || null,
        lockExpiresAt: j.lockExpiresAt || null
      };
    });
    window.postMessage({ type: "COR3_AUTOJOB_SAVE_COMPLETED", jobs: results }, "*");
  }
  function signalDone() {
    state.running = false;
    state._currentJobRef = null;
    window.postMessage({ type: "COR3_AUTOJOB_DONE", tokenExpired: state.tokenExpired,runTicket:state.runTicket }, location.origin);
  }
  async function fetchMapData(forceRefresh) {
    if (!forceRefresh && state._cachedMapData) return state._cachedMapData;
    var oldFingerprint = serverMap.isReady() ? serverMap.getMaintenanceFingerprint() : null;
    var fullDataPromise = new Promise(function(resolve) {
      var t;
      function onFullMap(evt) {
        if (evt.data && evt.data.type === "COR3_WS_MAP_DATA" && evt.data.servers) {
          window.removeEventListener("message", onFullMap);
          clearTimeout(t);
          resolve({ servers: evt.data.servers, connections: evt.data.connections || [] });
        }
      }
      window.addEventListener("message", onFullMap);
      t = setTimeout(function() {
        window.removeEventListener("message", onFullMap);
        resolve(null);
      }, 12e3);
    });
    sendCmd("get.map", {});
    var mapData = await waitForEvent("COR3_WS_NETWORK_MAP", 1e4);
    if (mapData && mapData.servers) {
      state._cachedMapData = mapData;
      var fullData = await fullDataPromise;
      if (fullData) {
        serverMap.update(fullData);
        var newFingerprint = serverMap.getMaintenanceFingerprint();
        if (oldFingerprint !== null && oldFingerprint !== newFingerprint) {
          log("Server state changed \u2014 path cache refreshed");
        }
      }
    }
    return mapData;
  }
  async function checkPathMaintenance(serverName) {
    if (serverMap.isReady()) {
      return serverMap.checkPathMaintenance(serverName);
    }
    var path = SERVER_PATH_MAP[serverName];
    if (!path) return { blocked: false };
    var mapData = await fetchMapData();
    if (!mapData || !mapData.servers) return { blocked: false };
    for (var i = 0; i < path.length; i++) {
      var srv = path[i];
      var srvInfo = mapData.servers[srv.id];
      if (srvInfo && srvInfo.isInMaintenance) {
        var remaining = srvInfo.maintenanceEndsAt ? new Date(srvInfo.maintenanceEndsAt).getTime() - Date.now() : 0;
        if (remaining > 0) {
          return { blocked: true, blockerName: srv.name, endsAt: srvInfo.maintenanceEndsAt, remainingMs: remaining };
        }
      }
    }
    return { blocked: false };
  }
  function getServerNameById(serverId) {
    if (serverMap.isReady()) {
      var s = serverMap.getServer(serverId);
      if (s) return s.name;
    }
    for (var name in SERVER_PATH_MAP) {
      var path = SERVER_PATH_MAP[name];
      for (var i = 0; i < path.length; i++) {
        if (path[i].id === serverId) return path[i].name;
      }
    }
    return null;
  }
  function getPathForServerId(serverId) {
    if (serverMap.isReady()) {
      var path = serverMap.getShortestPath(serverId);
      if (path) return path;
    }
    for (var name in SERVER_PATH_MAP) {
      var path = SERVER_PATH_MAP[name];
      if (path.length > 0 && path[path.length - 1].id === serverId) {
        return path;
      }
    }
    return null;
  }
  function invalidateLoadoutCache() {
    state._cachedLoadout = null;
    state._cachedLoadoutAt = 0;
  }
  function hardwareLabel(hw) {
    if (!hw) return "none";
    return ["cpu", "gpu", "ram", "psu"].map(function(slot) {
      return hw[slot] ? hw[slot].name : "none";
    }).join(" / ");
  }
  async function getLoadoutData(forceRefresh) {
    if (!forceRefresh && state._cachedLoadout && Date.now() - state._cachedLoadoutAt < 6e4) {
      log("Loadout: using cached data (age: " + Math.round((Date.now() - state._cachedLoadoutAt) / 1e3) + "s)");
      return state._cachedLoadout;
    }
    var now = Date.now();
    if (!forceRefresh && now - state._lastLoadoutFetchAt < state.LOADOUT_COOLDOWN_MS) {
      log("Loadout: fetch cooldown active (" + Math.round(state.LOADOUT_COOLDOWN_MS - (now - state._lastLoadoutFetchAt)) + "ms remaining) \u2014 using cached", "warn");
      return state._cachedLoadout;
    }
    state._lastLoadoutFetchAt = now;
    log("Loadout: fetching fresh data...");
    var waiting = waitForEvent("COR3_AUTOJOB_LOADOUT", 35000, function(reply) { return reply.action === "get.options"; });
    sendCmd("loadout.get", {});
    try {
      var data = await waiting;
      if (data && data.data) {
        state._cachedLoadout = data.data;
        state._cachedLoadoutAt = Date.now();
        var eqSw = state._cachedLoadout.equippedSoftware || [];
        log("Loadout: got " + (state._cachedLoadout.ownedSoftware || []).length + " owned, " + eqSw.length + " equipped software");
        return state._cachedLoadout;
      }
    } catch (e) {
      log("Loadout: fetch timed out \u2014 " + e.message, "warn");
    }
    log("Loadout: no data available", "warn");
    return null;
  }
  async function applyLoadoutChange(loadout, targetHw, targetSwIds) {
    var algorithms = window.Cor3LoadoutAlgorithms;
    if (!algorithms) throw new Error("LOADOUT_ALGORITHMS_UNAVAILABLE");
    var epoch = window.__cor3MasterGate.snapshot().generation;
    try {
      return await algorithms.executeOwned(targetHw, targetSwIds, {
        allowed: function() { return masterAllowed() && !state.abortFlag && window.__cor3MasterGate.snapshot().generation === epoch; },
        read: function() { return getLoadoutData(true); }, sleep: delay,
        command: async function(step) {
          if (!masterAllowed() || state.abortFlag) throw new Error("Aborted");
          var action = step.cmd.slice("loadout.".length);
          var waiting = waitForEvent("COR3_AUTOJOB_LOADOUT", 8e3, function(reply) { return reply.action === action; });
          log("Loadout: " + step.cmd + " " + step.id);
          sendCmd(step.cmd, {moduleConfigId:step.id});
          return await waiting;
        }
      });
    } finally { invalidateLoadoutCache(); }
  }
  async function ensureLoadoutForJob(job) {
    var serverId = job.serverId;
    if (!serverId) {
      log("Loadout: job has no target server \u2014 skipping loadout check");
      return true;
    }
    var serverTypeName = getServerTypeName(serverId);
    state._lastLoadoutServerType = serverTypeName || state._lastLoadoutServerType;
    log('Loadout: pre-check for job "' + (job.type || job.name || "?") + '" on server ' + (serverTypeName || serverId));
    var serverDefenceRate = 0;
    var needsHack = true;
    try {
      sendCmd("get.login.status", { serverId });
      var preLoginData = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 5e3);
      if (preLoginData && preLoginData.data) {
        if (preLoginData.data.serverDefenceRate) {
          serverDefenceRate = preLoginData.data.serverDefenceRate;
        }
        if (preLoginData.data.activeAccesses && preLoginData.data.activeAccesses.length > 0) {
          var existingAccess = preLoginData.data.activeAccesses[0];
          var existingType = existingAccess.accessType || existingAccess.type || "unknown";
          log("Loadout: already have " + existingType + " access on target server \u2014 skipping hack loadout");
          needsHack = false;
        }
      }
    } catch (e) {
      log("Loadout: could not check login status \u2014 assuming hack needed", "warn");
    }
    if (!needsHack) {
      log('Loadout: pre-check complete \u2014 no hack needed for "' + (job.type || job.name || "?") + '"');
      return true;
    }
    if (!serverTypeName) {
      log("Loadout: cannot determine server type \u2014 skipping hack loadout");
      return true;
    }
    invalidateLoadoutCache();
    var loadout = await getLoadoutData(true);
    if (!loadout) {
      log("Loadout: could not fetch loadout data \u2014 proceeding without loadout check", "warn");
      return true;
    }
    var allSw = [...(loadout.ownedSoftware || []),...(loadout.equippedSoftware || [])];
    var hackCandidates = findHackSoftwareForServerType(allSw, serverTypeName);
    log("Loadout: found " + hackCandidates.length + " hack candidate(s) for " + serverTypeName);
    if (hackCandidates.length === 0) {
      log("Loadout: no hack software available for " + serverTypeName + " \u2014 proceeding (may use existing access)", "warn");
      return true;
    }
    var plan = findBestSoftwareForAbility(loadout, hackCandidates, "HACK", serverDefenceRate, serverTypeName);
    if (!plan) {
      log("Loadout: no bootable HACK plan found for " + serverTypeName, "warn");
      return true;
    }
    log('Loadout: best HACK plan "' + plan.software.name + '" \u2014 power: ' + plan.power + (serverDefenceRate > 0 ? " / required: " + serverDefenceRate : "") + (plan.sufficient ? " \u2713" : " \u2717") + " \u2014 hardware: " + hardwareLabel(plan.hardware));
    if (serverDefenceRate > 0 && !plan.sufficient) {
      log("Loadout: best achievable HACK power is below serverDefenceRate (" + serverDefenceRate + ")", "error");
    }
    var currentSwIds = (loadout.equippedSoftware || []).map(function(s) {
      return s.id;
    });
    var currentHw = loadout.equippedHardware || {};
    var sameSw = currentSwIds.length === 1 && currentSwIds[0] === plan.softwareId;
    var sameHw = sameHardware(currentHw, plan.hardware);
    if (sameSw && sameHw) {
      log("Loadout: best HACK software and hardware already equipped");
    } else {
      log('Loadout: equipping HACK software "' + plan.software.name + '" (computed power: ' + plan.power + ") for " + serverTypeName);
      await applyLoadoutChange(loadout, plan.hardware, [plan.softwareId]);
    }
    log('Loadout: pre-check complete for "' + (job.type || job.name || "?") + '"');
    return true;
  }
  async function ensureDecryptOnlyLoadout(job, fileName, requiredPower) {
    var fileType = window.Cor3LoadoutAlgorithms.decryptionType(job, fileName);
    if (!fileType) throw new Error("DECRYPT_FILE_TYPE_UNKNOWN");
    invalidateLoadoutCache();
    var loadout = await getLoadoutData(true);
    if (!loadout) throw new Error("LOADOUT_READ_FAILED");
    var candidates = findDecryptSoftwareForFileType([...(loadout.ownedSoftware || []),...(loadout.equippedSoftware || [])], fileType);
    var plan = findBestSoftwareForAbility(loadout, candidates, "DECRYPT", Number(requiredPower) || 0, fileType);
    if (!plan || !plan.sufficient) throw new Error("DECRYPT_POWER_INSUFFICIENT: " + fileType);
    await applyLoadoutChange(loadout, plan.hardware, [plan.softwareId]);
  }
  async function readDecryptAnalysis(fileId, attempts) {
    var epoch = window.__cor3MasterGate.snapshot().generation;
    var valid = function() { return masterAllowed() && !state.abortFlag && window.__cor3MasterGate.snapshot().generation === epoch; };
    var last = null;
    for (var attempt = 0; attempt < attempts; attempt++) {
      if (!valid()) throw new Error("LOADOUT_SCOPE_REVOKED");
      var waiting = waitForEvent("COR3_AUTOJOB_FILE_ANALYSIS", 8e3);
      sendCmd("get.file.analysis", {fileId:fileId});
      try { var reply = await waiting; last = !reply.error && reply.data || null; }
      catch (e) { if (!valid()) throw e; last = null; }
      if (!valid()) throw new Error("LOADOUT_SCOPE_REVOKED");
      if (last && last.canDecrypt === true) return last;
      if (attempt < attempts - 1) await delay(700);
    }
    return last;
  }
  async function tryLoadoutSwapForError(errorMsg, job, errorObj) {
    if (!errorMsg) return false;
    log('Loadout: tryLoadoutSwapForError \u2014 error="' + errorMsg + '"');
    invalidateLoadoutCache();
    var loadout = await getLoadoutData(true);
    if (!loadout) {
      log("Loadout: cannot retry \u2014 no loadout data available", "warn");
      return false;
    }
    var allSw = [...(loadout.ownedSoftware || []),...(loadout.equippedSoftware || [])];
    var currentSwIds = (loadout.equippedSoftware || []).map(function(s) {
      return s.id;
    });
    var currentHw = loadout.equippedHardware || {};
    function targetPower(abilityType, target) {
      var analysis = calculateAnalysis(loadout, currentSwIds);
      var best = 0;
      for (var i = 0; i < currentSwIds.length; i++) {
        var power = abilityPower(analysis, currentSwIds[i], abilityType, target);
        if (power > best) best = power;
      }
      return best;
    }
    async function applyPlan(plan, abilityType, target, requiredPower2) {
      if (!plan) {
        log("Loadout: no bootable " + abilityType + " plan found", "warn");
        return false;
      }
      var currentPower = targetPower(abilityType, target);
      var sameSw = currentSwIds.length === 1 && currentSwIds[0] === plan.softwareId;
      var sameHw = sameHardware(currentHw, plan.hardware);
      log("Loadout: best " + abilityType + ' plan "' + plan.software.name + '" \u2014 power: ' + plan.power + (requiredPower2 > 0 ? " / required: " + requiredPower2 : "") + " / current: " + currentPower + (plan.sufficient ? " \u2713" : " \u2717"));
      if (sameSw && sameHw) {
        log("Loadout: best " + abilityType + " plan is already equipped");
        return false;
      }
      if (requiredPower2 > 0 && !plan.sufficient) {
        log("Loadout: no " + abilityType + " plan can meet the required power (" + requiredPower2 + ")", "error");
        return false;
      }
      if (plan.power <= currentPower && sameSw) {
        log("Loadout: no " + abilityType + " improvement available without changing software", "warn");
        return false;
      }
      log("Loadout: applying " + abilityType + ' plan "' + plan.software.name + '" (power: ' + plan.power + ", hardware: " + hardwareLabel(plan.hardware) + ")");
      await applyLoadoutChange(loadout, plan.hardware, [plan.softwareId]);
      return true;
    }
    if (errorMsg.indexOf("sai-no-hack-software") >= 0 || errorMsg.indexOf("sai-hack-impossible") >= 0) {
      var serverId = job.serverId;
      var serverTypeName = getServerTypeName(serverId);
      if (!serverTypeName) {
        log("Loadout: cannot determine server type for " + serverId, "warn");
        return false;
      }
      var hackCandidates = findHackSoftwareForServerType(allSw, serverTypeName);
      if (hackCandidates.length === 0) {
        if (!Array.isArray(loadout.ownedSoftware) || !Array.isArray(loadout.equippedSoftware)) return false;
        throw Object.assign(new Error("No compatible game software is available."), { code: "JOB_LOADOUT_UNAVAILABLE" });
      }
      var serverDefenceRate = 0;
      try {
        sendCmd("get.login.status", { serverId });
        var loginStatus = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 5e3);
        if (loginStatus && loginStatus.data && loginStatus.data.serverDefenceRate) {
          serverDefenceRate = loginStatus.data.serverDefenceRate;
        }
      } catch (e) {
      }
      var hackPlan = findBestSoftwareForAbility(loadout, hackCandidates, "HACK", serverDefenceRate, serverTypeName);
      return await applyPlan(hackPlan, "HACK", serverTypeName, serverDefenceRate);
    }
    if (errorMsg.indexOf("missing-software") >= 0 || errorMsg.indexOf("File is encrypted") >= 0 || errorMsg.indexOf("insufficient_power") >= 0 || errorMsg.indexOf("insufficient-power") >= 0) {
      var fileType = window.Cor3LoadoutAlgorithms.decryptionType(job);
      if (!fileType) {
        var extMatch = errorMsg.match(/decrypt\s+(\.\w+)\s+extension/i);
        if (extMatch) fileType = extMatch[1];
      }
      if (!fileType) {
        log("Loadout: decrypt failed but file type unknown \u2014 cannot swap software", "warn");
        return false;
      }
      var requiredPower = errorObj && errorObj.required || 0;
      var decryptCandidates = findDecryptSoftwareForFileType(allSw, fileType);
      if (decryptCandidates.length === 0) {
        log("Loadout: no decrypt software available for " + fileType, "warn");
        return false;
      }
      var decryptPlan = findBestSoftwareForAbility(loadout, decryptCandidates, "DECRYPT", requiredPower, fileType);
      return await applyPlan(decryptPlan, "DECRYPT", fileType, requiredPower);
    }
    return false;
  }
  function jobLabel(job) {
    var parts = [job.name || job.type];
    if (job.serverName && job.serverName !== "None") parts.push("on " + job.serverName);
    var mkt = MARKET_DISPLAY_NAMES[job.marketKey] || "";
    if (mkt) parts.push("[" + mkt + "]");
    return parts.join(" ");
  }
  function jobConditionsRequireDecrypt(job) {
    return window.Cor3LoadoutAlgorithms.conditionItems(job).some(function(cond) {
      return cond.type === "DecryptFile" || cond.type === "DecryptDownloadedFile";
    });
  }
  function extractFileInfoFromConditions(job) {
    if (!job.conditions) return null;
    var conditions = window.Cor3LoadoutAlgorithms.conditionItems(job);
    for (var i = 0; i < conditions.length; i++) {
      var cond = conditions[i];
      if ((cond.type === "DecryptFile" || cond.type === "DecryptDownloadedFile") && cond.details && cond.details.files && cond.details.files.length > 0) {
        return cond.details.files[0];
      }
    }
    return null;
  }
  function waitForMinigameOrError(timeoutMs) {
    return new Promise(function(resolve) {
      var done = false;
      var timer = safeTimeout(function() {
        if (!done) {
          done = true;
          cleanup();
          resolve({ timeout: true });
        }
      }, timeoutMs);
      function onDesktopFile(evt) {
        if (!evt.data || done) return;
        if (evt.data.type === "COR3_AUTOJOB_DESKTOP_FILE" && evt.data.error) {
          done = true;
          cleanup();
          resolve({ error: evt.data.error });
        }
      }
      function onMinigame(evt) {
        if (!evt.data || done) return;
        if (evt.data.type === "COR3_AUTOJOB_MINIGAME_LOCKED") {
          done = true;
          cleanup();
          resolve({ locked: evt.data.data });
        } else if (evt.data.type === "COR3_AUTOJOB_MINIGAME_START") {
          done = true;
          cleanup();
          resolve({ minigame: evt.data });
        }
      }
      function cleanup() {
        safeClearTimeout(timer);
        window.removeEventListener("message", onDesktopFile);
        window.removeEventListener("message", onMinigame);
      }
      window.addEventListener("message", onDesktopFile);
      window.addEventListener("message", onMinigame);
    });
  }
  function throwMinigameLockError(lockData) {
    var lockInfo = formatMinigameLockError(lockData);
    if (lockInfo) {
      log("\u{1F512} Minigame locked \u2014 " + lockInfo.message, "warn");
      var lockErr = new Error("minigame-locked: " + lockInfo.message);
      lockErr.lockExpiresAt = lockInfo.lockExpiresAt;
      lockErr.remainingMs = lockInfo.remainingMs;
      throw lockErr;
    }
  }

  // src/auto-job-solver/steps.js
  async function _sendSetEndpoint(serverId) {
    sendCmd("set.endpoint", { serverId });
    return await new Promise(function(resolve) {
      var timer;
      function endpointHandler(evt) {
        if (evt.data && evt.data.type === "COR3_WS_ENDPOINT_RESULT") {
          cleanup();
          if (evt.data.success === false && evt.data.error && (evt.data.error.message === "no-path-to-server" || evt.data.error.message === "server-in-maintenance")) {
            resolve({ ok: false, unreachable: true, errorMsg: evt.data.error.message });
          } else {
            resolve({ ok: true, data: evt.data });
          }
        }
        if (evt.data && (evt.data.type === "COR3_WS_DARK_MARKET_UNREACHABLE" || evt.data.type === "COR3_WS_SOYUZ_MARKET_UNREACHABLE" || evt.data.type === "COR3_WS_USOL_MARKET_UNREACHABLE")) {
          cleanup();
          resolve({ ok: false, unreachable: true });
        }
      }
      function cleanup() {
        window.removeEventListener("message", endpointHandler);
        safeClearTimeout(timer);
      }
      window.addEventListener("message", endpointHandler);
      timer = safeTimeout(function() {
        window.removeEventListener("message", endpointHandler);
        resolve({ ok: true, timeout: true });
      }, 1e4);
    });
  }
  async function stepSetEndpoint(serverId) {
    var endpointLabel = getServerNameById(serverId) || serverId;
    if (state._lastEndpointServerId === serverId) {
      log("Endpoint already set to " + endpointLabel + " \u2014 skipping duplicate set.endpoint");
      return;
    }
    await fetchMapData(true);
    log("Setting endpoint to " + endpointLabel);
    var raceResult = await _sendSetEndpoint(serverId);
    if (raceResult.unreachable) {
      if (raceResult.errorMsg === "server-in-maintenance") {
        var initMaint = serverMap.isReady() ? serverMap.getServer(serverId) : null;
        var initRemaining = initMaint && initMaint.maintenanceEndsAt ? new Date(initMaint.maintenanceEndsAt).getTime() - Date.now() : 0;
        var initMins = initRemaining > 0 ? Math.ceil(initRemaining / 6e4) : 0;
        var initSuffix = initMins > 0 ? " (~" + initMins + "m remaining)" : "";
        throw new Error(endpointLabel + " is in maintenance" + initSuffix);
      }
      var allPaths = serverMap.isReady() ? serverMap.findAllPaths(serverId) : [];
      var path = serverMap.isReady() ? serverMap.findBestReachablePath(serverId) : null;
      if (!path) path = getPathForServerId(serverId);
      if (!path || path.length <= 1) {
        var noPathCheck = await checkPathMaintenance(endpointLabel);
        if (noPathCheck.blocked) {
          var nMins = Math.ceil(noPathCheck.remainingMs / 6e4);
          throw new Error(endpointLabel + " unreachable (" + noPathCheck.blockerName + " in maintenance, ~" + nMins + "m remaining)");
        }
        throw new Error(endpointLabel + " unreachable (no path to server)");
      }
      var pathThroughSuccess = false;
      var triedPathCount = 0;
      var pathsToTry = allPaths.length > 0 ? allPaths : [path];
      const unavailableNodes = new Set();
      let loadoutError = null, otherPathFailure = false;
      for (var pathIdx = 0; pathIdx < pathsToTry.length; pathIdx++) {
        var currentPath = pathsToTry[pathIdx];
        if (currentPath.length <= 1) continue;
        if (currentPath.slice(0, -1).some(node => unavailableNodes.has(node.id))) continue;
        if (triedPathCount > 0) await fetchMapData(true);
        if (serverMap.isReady()) {
          var targetSrv = serverMap.getServer(serverId);
          if (targetSrv && targetSrv.isInMaintenance) {
            var mRemaining = targetSrv.maintenanceEndsAt ? new Date(targetSrv.maintenanceEndsAt).getTime() - Date.now() : 0;
            if (mRemaining > 0) {
              var mMins = Math.ceil(mRemaining / 6e4);
              throw new Error(endpointLabel + " is in maintenance (~" + mMins + "m remaining) \u2014 skipping path-through");
            }
          }
        }
        triedPathCount++;
        var pathNames = currentPath.map(function(s) {
          return s.name;
        }).join(" \u2192 ");
        log("\u26A1 Server unreachable \u2014 attempting path-through hack (path " + triedPathCount + "/" + pathsToTry.length + ": " + pathNames + ")");
        var pathFailed = false;
        for (var pi = 0; pi < currentPath.length - 1; pi++) {
          var intermediate = currentPath[pi];
          log("\u26A1 Path-through: setting endpoint to " + intermediate.name + " (" + (pi + 1) + "/" + (currentPath.length - 1) + ")");
          var intResult = await _sendSetEndpoint(intermediate.id);
          if (intResult.unreachable) {
            otherPathFailure = true;
            var intMsg = intermediate.name + " unreachable on this path";
            log("\u26A1 Path-through: " + intMsg + " \u2014 will try next path", "warn");
            pathFailed = true;
            break;
          }
          await delay(humanDelay());
          try {
            await stepLogin(intermediate.id);
          } catch (e) {
            if (state.abortFlag || e.message === "Aborted") throw e;
            if (e.code === "JOB_LOADOUT_UNAVAILABLE") {
              unavailableNodes.add(intermediate.id);
              loadoutError = e;
            } else {
              otherPathFailure = true;
            }
            log("\u26A1 Path-through: login/hack failed on " + intermediate.name + ": " + e.message + " \u2014 will try next path", "warn");
            pathFailed = true;
            break;
          }
          await delay(humanDelay());
        }
        if (pathFailed) continue;
        log("\u26A1 Path-through complete \u2014 retrying endpoint to target server");
        raceResult = await _sendSetEndpoint(serverId);
        if (!raceResult.unreachable) {
          pathThroughSuccess = true;
          break;
        }
        otherPathFailure = true;
        if (raceResult.errorMsg === "server-in-maintenance") {
          var maintCheck = serverMap.isReady() ? serverMap.getServer(serverId) : null;
          var maintRemaining = maintCheck && maintCheck.maintenanceEndsAt ? new Date(maintCheck.maintenanceEndsAt).getTime() - Date.now() : 0;
          var maintMins = maintRemaining > 0 ? Math.ceil(maintRemaining / 6e4) : 0;
          var maintSuffix = maintMins > 0 ? " (~" + maintMins + "m remaining)" : "";
          throw new Error(endpointLabel + " is in maintenance" + maintSuffix + " \u2014 aborting path-through");
        }
        log("\u26A1 Endpoint still unreachable after path " + triedPathCount + " \u2014 trying next", "warn");
      }
      if (!pathThroughSuccess && raceResult.unreachable) {
        var finalCheck = await checkPathMaintenance(endpointLabel);
        if (finalCheck.blocked) {
          var fMins = Math.ceil(finalCheck.remainingMs / 6e4);
          throw new Error(endpointLabel + " still unreachable after " + triedPathCount + " path(s) (" + finalCheck.blockerName + " in maintenance, ~" + fMins + "m remaining)");
        }
        if (loadoutError && !otherPathFailure) throw loadoutError;
        throw new Error(endpointLabel + " still unreachable after " + triedPathCount + " path attempt(s)");
      }
    }
    if (raceResult.timeout) {
      log("Endpoint set timeout (may already be set)", "warn");
    }
    state._lastEndpointServerId = serverId;
    await delay(humanDelay());
  }
  async function stepLogin(serverId) {
    var serverLabel = getServerNameById(serverId) || serverId;
    log("Checking login status for " + serverLabel);
    sendCmd("get.login.status", { serverId });
    var loginData;
    try {
      loginData = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 1e4);
    } catch (e) {
      throw new Error("Failed to get login status: " + e.message);
    }
    if (loginData.error) {
      throw new Error("Login status error: " + friendlyError(loginData.error.message || JSON.stringify(loginData.error)));
    }
    var data = loginData.data;
    if (data && data.activeAccesses && data.activeAccesses.length > 0) {
      var accessObj = data.activeAccesses[0];
      var accessId = accessObj.id;
      var accessType = accessObj.accessType || accessObj.type || "unknown";
      log("Using existing access on " + serverLabel + " (" + accessType + ")");
      sendCmd("login.with-access", { serverId, accessGrantId: accessId });
      var loginResult;
      try {
        loginResult = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_RESULT", 1e4);
      } catch (e) {
        throw new Error("Login with access timed out");
      }
      if (loginResult.error || !(loginResult.data && loginResult.data.success)) {
        throw new Error("Login with access failed");
      }
      log("Logged in via existing access to " + serverLabel, "success");
    } else {
      var loginDefenceRate = data && data.serverDefenceRate ? data.serverDefenceRate : 0;
      var loginHackPower = 0;
      if (data && data.hackTools && data.hackTools.length > 0) {
        loginHackPower = data.hackTools[0].hackPower || 0;
        log("Hack info \u2014 serverDefenceRate: " + loginDefenceRate + ", equipped hackPower: " + loginHackPower + " (" + (data.hackTools[0].name || "unknown") + ")" + (loginDefenceRate > 0 ? loginHackPower >= loginDefenceRate ? " \u2713" : " \u2717 INSUFFICIENT" : ""));
      } else if (loginDefenceRate > 0) {
        log("Hack info \u2014 serverDefenceRate: " + loginDefenceRate + ", no hack tools equipped", "warn");
      }
      var MAX_HACK_ATTEMPTS = 6;
      var hackAttempt = 0;
      var loggedIn = false;
      while (hackAttempt < MAX_HACK_ATTEMPTS && !loggedIn) {
        hackAttempt++;
        if (hackAttempt > 1) {
          log("Hack attempt " + hackAttempt + "/" + MAX_HACK_ATTEMPTS + " on " + serverLabel, "warn");
        } else {
          log("No active access to " + serverLabel + " \u2014 starting hack");
        }
        ensureDecryptSolverEnabled();
        ensureIceWallSolverEnabled();
        ensureSimpleDecryptSolverEnabled();
        await delay(300);
        sendCmd("hack.start", { serverId });
        var hackResult;
        try {
          hackResult = await new Promise(function(resolve, reject) {
            var done = false;
            var timer = safeTimeout(function() {
              if (!done) {
                done = true;
                window.removeEventListener("message", onMsg);
                reject(new Error("Timeout"));
              }
            }, 3e4);
            function onMsg(evt) {
              if (!evt.data) return;
              if (evt.data.type === "COR3_AUTOJOB_SAI_HACK_START") {
                if (!done) {
                  done = true;
                  safeClearTimeout(timer);
                  window.removeEventListener("message", onMsg);
                  resolve(evt.data);
                }
              } else if (evt.data.type === "COR3_AUTOJOB_MINIGAME_LOCKED") {
                if (!done) {
                  done = true;
                  safeClearTimeout(timer);
                  window.removeEventListener("message", onMsg);
                  resolve({ data: { minigameLocked: true, lockData: evt.data.data }, error: null });
                }
              } else if (evt.data.type === "COR3_AUTOJOB_MINIGAME_START") {
                if (!done) {
                  done = true;
                  safeClearTimeout(timer);
                  window.removeEventListener("message", onMsg);
                  resolve({ data: { minigameStarted: true }, error: null });
                }
              }
            }
            window.addEventListener("message", onMsg);
          });
        } catch (e) {
          log("Hack start event timed out \u2014 checking if hack already completed...", "warn");
          sendCmd("get.login.status", { serverId });
          try {
            var fallbackLogin = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 1e4);
            if (fallbackLogin.data && fallbackLogin.data.activeAccesses && fallbackLogin.data.activeAccesses.length > 0) {
              var fbAccess = fallbackLogin.data.activeAccesses[0];
              var fbAccessId = fbAccess.id;
              var fbType = fbAccess.accessType || fbAccess.type || "unknown";
              log("Hack already completed (found " + fbType + " access after timeout) \u2014 logging in", "success");
              sendCmd("login.with-access", { serverId, accessGrantId: fbAccessId });
              try {
                await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_RESULT", 1e4);
              } catch (e2) {
              }
              await delay(humanDelay());
              return;
            }
          } catch (e2) {
          }
          if (hackAttempt < MAX_HACK_ATTEMPTS) {
            log("Hack timed out \u2014 will retry", "warn");
            await delay(2e3);
            continue;
          }
          throw new Error("Hack start timed out after " + MAX_HACK_ATTEMPTS + " attempts");
        }
        if (hackResult.error) {
          log("Hack returned error: " + friendlyError(hackResult.error.message || JSON.stringify(hackResult.error)) + " \u2014 checking access...", "warn");
          sendCmd("get.login.status", { serverId });
          try {
            var errLogin = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 1e4);
            if (errLogin.data && errLogin.data.activeAccesses && errLogin.data.activeAccesses.length > 0) {
              var errAccess = errLogin.data.activeAccesses[0];
              var errAccessId = errAccess.id;
              var errType = errAccess.accessType || errAccess.type || "unknown";
              log("Already have " + errType + " access despite hack error \u2014 logging in", "success");
              sendCmd("login.with-access", { serverId, accessGrantId: errAccessId });
              try {
                await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_RESULT", 1e4);
              } catch (e2) {
              }
              await delay(humanDelay());
              return;
            }
          } catch (e2) {
          }
          var hackErrMsg = hackResult.error.message || JSON.stringify(hackResult.error);
          if (hackErrMsg.indexOf("sai-no-hack-software") >= 0 || hackErrMsg.indexOf("sai-hack-impossible") >= 0) {
            log("Loadout: attempting software swap for hack retry...");
            var loadoutSwapped = await tryLoadoutSwapForError(hackErrMsg, { serverId, type: state._currentJobRef ? state._currentJobRef.type : "" });
            if (loadoutSwapped) {
              log("Loadout: swap successful \u2014 will retry hack");
              await delay(1e3);
              continue;
            }
          }
          if (hackAttempt < MAX_HACK_ATTEMPTS) {
            log("Hack failed \u2014 will retry", "warn");
            await delay(2e3);
            continue;
          }
          throw new Error("Hack failed after " + MAX_HACK_ATTEMPTS + " attempts: " + friendlyError(hackErrMsg));
        }
        if (hackResult.data && hackResult.data.minigameLocked) {
          var lockInfo = formatMinigameLockError(hackResult.data.lockData);
          if (lockInfo) {
            log("\u{1F512} Hack minigame locked \u2014 " + lockInfo.message, "warn");
            var lockErr = new Error("minigame-locked: " + lockInfo.message);
            lockErr.lockExpiresAt = lockInfo.lockExpiresAt;
            lockErr.remainingMs = lockInfo.remainingMs;
            throw lockErr;
          }
        }
        if (hackResult.data && hackResult.data.autoHacked) {
          log("Server auto-hacked (no minigame) \u2014 skipping solver wait", "success");
        } else if (hackResult.data && hackResult.data.minigameStarted) {
          log("Hack minigame detected via minigame event");
          await waitForHackToBeDone();
        } else {
          await waitForHackToBeDone();
        }
        await delay(humanDelay());
        var maxPolls = 5;
        for (var attempt = 0; attempt < maxPolls; attempt++) {
          sendCmd("get.login.status", { serverId });
          try {
            loginData = await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_STATUS", 5e3);
          } catch (e) {
            log("Login status not received after hack (poll " + (attempt + 1) + "/" + maxPolls + "), retrying...", "warn");
            continue;
          }
          if (loginData.data && loginData.data.activeAccesses && loginData.data.activeAccesses.length > 0) {
            var postHackAccess = loginData.data.activeAccesses[0];
            var aid = postHackAccess.id;
            var postHackType = postHackAccess.accessType || postHackAccess.type || "unknown";
            sendCmd("login.with-access", { serverId, accessGrantId: aid });
            try {
              await waitForEvent("COR3_AUTOJOB_SAI_LOGIN_RESULT", 1e4);
            } catch (e) {
            }
            loggedIn = true;
            log("Logged in to " + serverLabel + " (" + postHackType + ")", "success");
            break;
          } else {
            log("No active access after hack (poll " + (attempt + 1) + "/" + maxPolls + "), retrying...", "warn");
            await delay(5e3);
          }
        }
        if (!loggedIn) {
          if (hackAttempt < MAX_HACK_ATTEMPTS) {
            log("Hack completed but no access granted \u2014 hack likely failed, retrying (" + hackAttempt + "/" + MAX_HACK_ATTEMPTS + ")", "warn");
            await delay(2e3);
            continue;
          }
          throw new Error("Hack failed after " + MAX_HACK_ATTEMPTS + " attempts \u2014 no access granted");
        }
      }
    }
    await delay(humanDelay());
  }
  async function stepTakeJob(job) {
    if (job.alreadyTaken) {
      log("Job already taken \u2014 skipping take step");
      return;
    }
    log("Taking job: " + jobLabel(job));
    var depositPaid = 0;
    var depositHandler = function(evt) {
      if (evt.data && evt.data.type === "COR3_AUTOJOB_PROFILE_CREDITS" && evt.data.data) {
        if (evt.data.data.amount < 0) {
          depositPaid = Math.abs(evt.data.data.amount);
        }
      }
    };
    window.addEventListener("message", depositHandler);
    var capturedFileInfo = null;
    var fileHandler = function(evt) {
      if (evt.data && evt.data.type === "COR3_AUTOJOB_DESKTOP_FILE" && evt.data.data && evt.data.data.file) {
        var fileData = evt.data.data.file;
        capturedFileInfo = fileData;
        log("Captured file info: " + fileData.name + " (id: " + fileData.id + ")");
        // A file event may belong to another folder; discover Downloads by its own options.
      }
    };
    window.addEventListener("message", fileHandler);
    sendCmd("job.take", { marketId: job.marketId, jobId: job.jobId });
    try {
      var result = await waitForEvent("COR3_AUTOJOB_JOB_TAKEN", 1e4);
      if (result.error) {
        window.removeEventListener("message", depositHandler);
        window.removeEventListener("message", fileHandler);
        throw new Error("Job take error: " + friendlyError(result.error.message || JSON.stringify(result.error)));
      }
    } catch (e) {
      window.removeEventListener("message", depositHandler);
      window.removeEventListener("message", fileHandler);
      throw new Error("Failed to take job: " + e.message);
    }
    window.removeEventListener("message", depositHandler);
    if (depositPaid > 0) {
      job.depositPaid = depositPaid;
      log("Job taken (deposit: " + depositPaid + " credits)", "success");
    } else {
      log("Job taken successfully", "success");
    }
    await delay(humanDelay());
    log("Refreshing market data for job conditions...");
    sendCmd("get.jobs", { marketId: job.marketId });
    var updatedConditions = await new Promise(function(resolve) {
      var timer;
      function handler(evt) {
        if (evt.data && (evt.data.type === "COR3_WS_MARKET" || evt.data.type === "COR3_WS_DARK_MARKET" || evt.data.type === "COR3_WS_SOYUZ_MARKET" || evt.data.type === "COR3_WS_USOL_MARKET")) {
          var md = evt.data.market;
          if (md && md.recentJobs) {
            var rj = md.recentJobs.find(function(j) {
              return j.id === job.jobId;
            });
            if (rj) {
              cleanup();
              resolve(rj);
              return;
            }
          }
        }
      }
      function cleanup() {
        window.removeEventListener("message", handler);
        safeClearTimeout(timer);
      }
      window.addEventListener("message", handler);
      timer = safeTimeout(function() {
        window.removeEventListener("message", handler);
        resolve(null);
      }, 5e3);
    });
    window.removeEventListener("message", fileHandler);
    if (capturedFileInfo) {
      job.fileInfo = capturedFileInfo;
    }
    if (updatedConditions) {
      if (Array.isArray(updatedConditions.conditions) || Array.isArray(updatedConditions.conditions?.items)) {
        job.conditions = window.Cor3LoadoutAlgorithms.conditionItems(updatedConditions);
        log("Updated job conditions from server");
      }
      if (updatedConditions.canComplete !== void 0) {
        job.canComplete = updatedConditions.canComplete;
      }
    }
  }
  async function stepCompleteJob(job) {
    log("Completing job and claiming reward");
    var earnedCredits = 0;
    var earnedRenown = 0;
    var profileHandler = function(evt) {
      if (!evt.data) return;
      if (evt.data.type === "COR3_AUTOJOB_PROFILE_PROGRESS" && evt.data.data) {
        earnedRenown = evt.data.data.amount || 0;
      }
      if (evt.data.type === "COR3_AUTOJOB_PROFILE_CREDITS" && evt.data.data) {
        earnedCredits = evt.data.data.amount || 0;
      }
    };
    window.addEventListener("message", profileHandler);
    if (getMarketNameById(job.marketId) === "D4RK") {
      await stepSetEndpoint(DARK_MARKET_SERVER_ID);
    } else if (getMarketNameById(job.marketId) === "SOYUZ") {
      await stepSetEndpoint(SOYUZ_MARKET_SERVER_ID);
    } else if (getMarketNameById(job.marketId) === "USOL") {
      await stepSetEndpoint(USOL_MARKET_SERVER_ID);
    }
    var completeRetries = 0;
    var MAX_COMPLETE_RETRIES = 2;
    while (true) {
      sendCmd("job.complete", { marketId: job.marketId, jobId: job.jobId });
      try {
        var result = await waitForEvent("COR3_AUTOJOB_JOB_COMPLETED", 2e4);
        if (result.error) {
          var errMsg = result.error.message || "";
          if (errMsg.indexOf("not found") >= 0) {
            window.removeEventListener("message", profileHandler);
            log("Job not found (stale ID) \u2014 skipping this job", "error");
            throw new Error("job-not-found");
          }
          if (errMsg.indexOf("market-not-reachable") >= 0 && completeRetries < MAX_COMPLETE_RETRIES) {
            completeRetries++;
            log("Market not reachable during job.complete \u2014 re-setting endpoint and retrying (" + completeRetries + "/" + MAX_COMPLETE_RETRIES + ")", "warn");
            await delay(1500);
            var marketName = getMarketNameById(job.marketId);
            if (marketName === "D4RK") await stepSetEndpoint(DARK_MARKET_SERVER_ID);
            else if (marketName === "SOYUZ") await stepSetEndpoint(SOYUZ_MARKET_SERVER_ID);
            else if (marketName === "USOL") await stepSetEndpoint(USOL_MARKET_SERVER_ID);
            await delay(500);
            continue;
          }
          window.removeEventListener("message", profileHandler);
          var friendlyMsg = friendlyError(errMsg, result.error.failedConditions) || "Unknown completion error";
          log("Job completion error: " + friendlyMsg, "error");
          throw new Error(errMsg);
        }
        window.removeEventListener("message", profileHandler);
        var grossCredits = earnedCredits || job.rewardCredits || 0;
        var deposit = job.depositPaid || 0;
        var netCredits = grossCredits - deposit;
        var reputation = job.rewardReputation || 0;
        var renown = earnedRenown || 0;
        log("Job completed!", "success");
        return {
          credits: netCredits,
          reputation,
          renown,
          grossCredits,
          deposit
        };
      } catch (e) {
        window.removeEventListener("message", profileHandler);
        log("Job completion timed out: " + e.message, "error");
        throw e;
      }
    }
  }
  async function stepDiscoverDownloadFolder() {
    if (window.__cor3DownloadFolderId) {
      state.downloadFolderId = window.__cor3DownloadFolderId;
      log("Using cached Downloads folder ID: " + state.downloadFolderId);
      return state.downloadFolderId;
    }
    if(state.downloadFolderId)return state.downloadFolderId;
    log("Waiting for Downloads folder ID from polling/WS...");
    for (var attempt = 0; attempt < 10; attempt++) {
      await delay(500);
      if (window.__cor3DownloadFolderId) {
        state.downloadFolderId = window.__cor3DownloadFolderId;
        log("Got Downloads folder ID from polling: " + state.downloadFolderId);
        return state.downloadFolderId;
      }
    }
    log("Sending explicit desktop.get.options command...");
    var optionsWait = new Promise(function(resolve) {
      var timer;
      function handler(evt) {
        if (evt.source === window && evt.origin === location.origin && evt.data && evt.data.type === "COR3_AUTOJOB_DESKTOP_OPTIONS") {
          cleanup();
          resolve(evt.data.data || null);
        }
      }
      function cleanup() {
        window.removeEventListener("message", handler);
        safeClearTimeout(timer);
      }
      window.addEventListener("message", handler);
      timer = safeTimeout(function() {
        window.removeEventListener("message", handler);
        log("desktop.get.options WS command timed out after 8s", "warn");
        resolve(null);
      }, 8e3);
    });
    sendCmd("desktop.get.options", {});
    var result = await optionsWait;
    if (!result && window.__cor3DownloadFolderId) {
      state.downloadFolderId = window.__cor3DownloadFolderId;
      log("Got Downloads folder ID from global after WS attempt: " + state.downloadFolderId);
      return state.downloadFolderId;
    }
    if (result) {
      log("desktop.get.options response \u2014 folders: " + (result.folders ? result.folders.length : 0) + ", files: " + (result.files ? result.files.length : 0));
      if (result.folders) {
        var dlFolder = result.folders.find(function(f) {
          return f.name === "Downloads";
        });
        if (dlFolder) {
          state.downloadFolderId = dlFolder.id;
          log("Discovered Downloads folder ID: " + dlFolder.id);
          return dlFolder.id;
        }
        log('No "Downloads" folder found in: ' + result.folders.map(function(f) {
          return f.name;
        }).join(", "), "warn");
      }
    } else {
      log("desktop.get.options returned null/empty", "warn");
    }
    log("Could not discover Downloads folder ID", "warn");
    return null;
  }

  // src/auto-job-solver/solvers.js
  async function runDecryptFlow(fileId, fileName, job, isEncrypted) {
    var epoch = window.__cor3MasterGate.snapshot().generation;
    var check = function() { if (!masterAllowed() || state.abortFlag || window.__cor3MasterGate.snapshot().generation !== epoch) throw new Error("LOADOUT_SCOPE_REVOKED"); };
    check();
    if (isEncrypted === false) {
      return await completeDecryptJob(job, fileId, check, true);
    }
    var analysis = await readDecryptAnalysis(fileId, 1);
    check();
    if (!analysis || analysis.canDecrypt !== true) {
      await ensureDecryptOnlyLoadout(job, fileName, analysis && analysis.decryptPower);
      check();
      analysis = await readDecryptAnalysis(fileId, 3);
    }
    check();
    log("Decrypt analysis after verified loadout: canDecrypt=" + (analysis ? analysis.canDecrypt : "unavailable") + ", power=" + (analysis && analysis.decryptPower != null ? analysis.decryptPower : "unknown"));
    var zeroPower = analysis && analysis.canDecrypt === false && (analysis.decryptPower === 0 || analysis.decryptPower === null);
    if (!analysis || analysis.canDecrypt !== true && !zeroPower) throw new Error(analysis ? "DECRYPT_POWER_INSUFFICIENT" : "DECRYPT_ANALYSIS_UNAVAILABLE");
    if (zeroPower) log("Zero decrypt power may be stale; opening this verified file once for the game's authoritative result", "warn");
    ensureDecryptSolverEnabled();
    ensureIceWallSolverEnabled();
    ensureSimpleDecryptSolverEnabled();
    log("Opening file for decryption: " + fileName);
    sendCmd("decrypt.file", { fileId });
    var openResult = await waitForMinigameOrError(12e3);
    if (openResult.locked) {
      throwMinigameLockError(openResult.locked);
    }
    var isAlreadyDecrypted = false;
    if (openResult.error) {
      var errMsg = openResult.error.message || openResult.error.kind || JSON.stringify(openResult.error);
      var isLoadoutError = errMsg.indexOf("missing-software") >= 0 || errMsg.indexOf("insufficient_power") >= 0 || errMsg.indexOf("insufficient-power") >= 0 || errMsg.indexOf("File is encrypted") >= 0;
      isAlreadyDecrypted = errMsg.indexOf("cannot-read-sai-file") >= 0 || errMsg.indexOf("Cannot read SAI file") >= 0 || errMsg.indexOf("file-already-decrypted") >= 0;
      if (isAlreadyDecrypted) {
        log("File already decrypted \u2014 attempting job completion directly", "success");
      } else if (isLoadoutError) {
        log("Loadout: file open failed (" + errMsg + ") \u2014 attempting software swap");
        var swapOk2 = await tryLoadoutSwapForError(errMsg, job, openResult.error);
        if (swapOk2) {
          log("Loadout: swap successful \u2014 retrying file open");
          await delay(1e3);
          ensureDecryptSolverEnabled();
          ensureIceWallSolverEnabled();
          ensureSimpleDecryptSolverEnabled();
          sendCmd("decrypt.file", { fileId });
          var retryResult = await waitForMinigameOrError(12e3);
          if (retryResult.locked) throwMinigameLockError(retryResult.locked);
          if (retryResult.error) {
            var retryErrMsg = retryResult.error.message || retryResult.error.kind || JSON.stringify(retryResult.error);
            throw new Error(friendlyError(retryErrMsg));
          } else if (retryResult.timeout) {
            log("Minigame start not detected on retry", "warn");
          }
        } else {
          throw new Error(friendlyError(errMsg));
        }
      } else {
        throw new Error(friendlyError(errMsg));
      }
    } else if (openResult.timeout) {
      log("Minigame start not detected (solver may handle it directly)", "warn");
    }
    if (!isAlreadyDecrypted) {
      await waitForHackToBeDone();
    }
    await delay(1500);
    return await completeDecryptJob(job, fileId, check, isAlreadyDecrypted);
  }
  async function refreshDecryptJob(job, check) {
    check();
    var marketName = getMarketNameById(job.marketId);
    var type = {HOME:"COR3_WS_MARKET",D4RK:"COR3_WS_DARK_MARKET",SOYUZ:"COR3_WS_SOYUZ_MARKET",USOL:"COR3_WS_USOL_MARKET"}[marketName];
    if (!type) return;
    var waiting = waitForEvent(type, 5000, function(reply) {
      return reply.market && (reply.market.recentJobs || []).some(function(row) { return row.id === job.jobId; });
    });
    sendCmd("get.jobs", {marketId:job.marketId});
    try {
      var reply = await waiting;check();
      var row = reply.market.recentJobs.find(function(x) { return x.id === job.jobId; });
      if (Array.isArray(row.conditions) || Array.isArray(row.conditions?.items)) job.conditions = window.Cor3LoadoutAlgorithms.conditionItems(row);
      if (typeof row.canComplete === "boolean") job.canComplete = row.canComplete;
    } catch (e) { check();log("Decrypt completion: current job row was not refreshed", "warn"); }
  }
  async function completeDecryptJob(job, fileId, check, knownDecoded) {
    return await window.Cor3LoadoutAlgorithms.completeDecrypted({check:check,knownDecoded:knownDecoded,
      complete:function() { return stepCompleteJob(job); },refresh:function() { return refreshDecryptJob(job,check); },sleep:delay,
      reopen:async function() {
        check();ensureDecryptSolverEnabled();ensureIceWallSolverEnabled();ensureSimpleDecryptSolverEnabled();
        var waiting = waitForMinigameOrError(12000);
        sendCmd("decrypt.file", {fileId:fileId});
        var result = await waiting;check();
        if (result.locked) throwMinigameLockError(result.locked);
        if (result.error) {
          var message = result.error.message || result.error.kind || "";
          if (/file-already-decrypted|cannot-read-sai-file/i.test(message)) return;
          throw new Error(message || "DECRYPT_REOPEN_FAILED");
        }
        await waitForHackToBeDone();check();
      }
    });
  }
  function findFileInFolder(folderData, job, latestFileId, latestFileName, serverFileName) {
    return window.Cor3LoadoutAlgorithms.selectDownloaded(window.Cor3LoadoutAlgorithms.folderContents(folderData).files, job,
      {fileId:latestFileId,fileName:latestFileName,serverFileName:serverFileName});
  }
  function createFileUpdateListener() {
    var latestFileId = null;
    var latestFileName = null;
    var handler = function(evt) {
      if (evt.source===window && evt.origin===location.origin && masterAllowed() && !state.abortFlag && evt.data && evt.data.type === "COR3_AUTOJOB_DESKTOP_FILE" && evt.data.data && evt.data.data.file) {
        latestFileId = evt.data.data.file.id;
        latestFileName = evt.data.data.file.name;
        log("File updated: " + evt.data.data.file.name + " (new id: " + latestFileId + ")");
      }
    };
    window.addEventListener("message", handler);
    return {
      get fileId() {
        return latestFileId;
      },
      get fileName() {
        return latestFileName;
      },
      remove: function() {
        window.removeEventListener("message", handler);
      }
    };
  }
  function extractFileType(fileName) {
    if (!fileName) return null;
    var dotIdx = fileName.lastIndexOf(".");
    return dotIdx >= 0 ? fileName.substring(dotIdx) : null;
  }
  async function openFolderAndFindFile(job, latestFileId, latestFileName, serverFileName, readRefs) {
    var epoch=window.__cor3MasterGate.snapshot().generation;
    var check=function(){if(!masterAllowed()||state.abortFlag||window.__cor3MasterGate.snapshot().generation!==epoch)throw new Error('DOWNLOAD_SCOPE_REVOKED');};
    check();await stepDiscoverDownloadFolder();check();
    if(!state.downloadFolderId)throw new Error('DOWNLOAD_FOLDER_UNKNOWN: 未确认下载目录');
    var reason='unconfirmed',count=0;
    for(var attempt=0;attempt<4;attempt++){
      check();if(attempt)await delay(750*attempt);check();
      // Register first; ignore other folders and malformed replies.
      var waiting=waitForEvent('COR3_AUTOJOB_DESKTOP_FOLDER',10000,function(reply){var folder=window.Cor3LoadoutAlgorithms.folderContents(reply);return (!folder.id||folder.id===state.downloadFolderId)&&(folder.error||Array.isArray(folder.files));});
      sendCmd('open.folder',{folderId:state.downloadFolderId});
      var folderData;try{folderData=await waiting;}catch(e){check();throw new Error('DOWNLOAD_FOLDER_RESPONSE_UNCONFIRMED: 下载目录响应未确认');}
      check();var folder=window.Cor3LoadoutAlgorithms.folderContents(folderData);
      if(folder.error)throw new Error('DOWNLOAD_FOLDER_READ_FAILED: '+friendlyError(folder.error.message||folder.error.kind||'目录读取被拒绝'));
      var refs=typeof readRefs==='function'?readRefs():{fileId:latestFileId,fileName:latestFileName};
      var selected=window.Cor3LoadoutAlgorithms.inspectDownloaded(folder.files,job,{...refs,serverFileName:serverFileName});reason=selected.reason;count=selected.count;
      log('Download folder lookup: attempt '+(attempt+1)+', files '+count+', result '+reason);
      if(selected.file){var target=selected.file;job.fileType=window.Cor3LoadoutAlgorithms.decryptionType(job,target.name);job.downloadOutcome='observed';return target;}
      if(reason==='unconfirmed')throw new Error('DOWNLOAD_FOLDER_FORMAT_UNCONFIRMED: 下载目录文件格式未确认');
    }
    if(reason==='ambiguous')throw new Error('DOWNLOAD_TARGET_AMBIGUOUS: 同名候选不唯一，未选择其他文件');
    if(job.downloadOutcome==='unconfirmed')throw new Error('DOWNLOAD_RECEIPT_UNCONFIRMED: 下载回执未确认，目录内尚未找到任务文件');
    throw new Error((reason==='empty'?'DOWNLOAD_FOLDER_EMPTY':'DOWNLOAD_TARGET_NOT_FOUND')+': 目录已读取，但未找到与当前任务身份匹配的文件');
  }
  async function tryEarlyCompletion(job, continueMsg) {
    if (job.alreadyTaken && job.canComplete) {
      log("Job already taken and completable \u2014 completing now");
      try {
        var earlyReward = await stepCompleteJob(job);
        if (earlyReward) return earlyReward;
      } catch (earlyErr) {
        if (earlyErr.message && earlyErr.message.indexOf("job-conditions-not-met") >= 0) {
          log("Early completion failed (conditions not met) \u2014 continuing with " + (continueMsg || "remaining steps"), "warn");
        } else {
          throw earlyErr;
        }
      }
      log("Completion failed \u2014 continuing with remaining steps");
    } else if (job.alreadyTaken) {
      log("Job already taken but not yet completable \u2014 continuing with remaining steps");
    }
    return null;
  }
  async function solveFileDecryption(job) {
    log("=== File Decryption: " + jobLabel(job) + " ===");
    var fileListener = createFileUpdateListener();
    try {
      await stepTakeJob(job);
      var earlyReward = await tryEarlyCompletion(job, "decrypt steps");
      if (earlyReward) return earlyReward;
      var fileInfo = job.fileInfo || null;
      if (fileListener.fileId && fileInfo) {
        fileInfo.id = fileListener.fileId;
      }
      if (!fileInfo) {
        var condFile = extractFileInfoFromConditions(job);
        if (condFile) {
          fileInfo = condFile;
          if (fileListener.fileId) fileInfo.id = fileListener.fileId;
          log("Got file info from conditions: " + condFile.name + " (id: " + condFile.id + ")");
        }
      }
      var targetFile = await openFolderAndFindFile(job, fileListener.fileId, fileListener.fileName, null, function(){return {fileId:fileListener.fileId,fileName:fileListener.fileName};});
      return await runDecryptFlow(targetFile.id, targetFile.name, job, targetFile.isEncrypted);
    } finally {
      fileListener.remove();
    }
  }
  async function solveIPInjection(job) {
    log("=== IP Injection: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for IP Injection job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting transit data");
    sendCmd("get.transit", { serverId: job.serverId });
    var transitData;
    try {
      transitData = await waitForEvent("COR3_AUTOJOB_SAI_TRANSIT", 1e4);
    } catch (e) {
      throw new Error("Failed to get transit data");
    }
    if (transitData.error) {
      throw new Error("Transit error: " + friendlyError(transitData.error.message || JSON.stringify(transitData.error)));
    }
    var ipsToInject = [];
    if (job.conditions) {
      for (var c of job.conditions) {
        if (c.details && c.details.ips && c.details.ips.length > 0) {
          ipsToInject = c.details.ips;
          break;
        }
        if (c.ip) {
          ipsToInject.push(c.ip);
          break;
        }
        if (c.targetIp) {
          ipsToInject.push(c.targetIp);
          break;
        }
      }
    }
    if (ipsToInject.length === 0) {
      throw new Error("Could not determine IPs to inject from job conditions");
    }
    for (var ipIdx = 0; ipIdx < ipsToInject.length; ipIdx++) {
      var ip = ipsToInject[ipIdx];
      log("Injecting IP (" + (ipIdx + 1) + "/" + ipsToInject.length + "): " + ip);
      sendCmd("transit.add", { serverId: job.serverId, ip, description: "" });
      try {
        var addResult = await waitForEvent("COR3_AUTOJOB_SAI_TRANSIT_ADD", 1e4);
        if (addResult.error) {
          var errMsg = addResult.error.message || "";
          if (errMsg === "sai-transit-ip-duplicate") {
            log("IP " + ip + " already exists on server \u2014 skipping", "warn");
            if (ipIdx < ipsToInject.length - 1) await delay(humanDelay());
            continue;
          }
          if (errMsg === "sai-transit-ip-limit") {
            var limit = addResult.error.limit || 20;
            throw new Error("Server IP limit reached (" + limit + " IPs max). Clear old IPs via Auto Clear IPs toggle.");
          }
          throw new Error("IP injection failed for " + ip + ": " + friendlyError(addResult.error.message));
        }
      } catch (e) {
        if (e.message.indexOf("Server IP limit reached") === 0) throw e;
        throw new Error("IP injection timed out for " + ip + ": " + e.message);
      }
      if (ipIdx < ipsToInject.length - 1) await delay(humanDelay());
    }
    log("All IPs injected successfully", "success");
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveDataDownload(job) {
    log("=== Data Download: " + jobLabel(job) + " ===");
    var fileListener = createFileUpdateListener();
    try {
      await stepTakeJob(job);
      if (!job.serverId) {
        throw new Error("No target server for Data Download job");
      }
      var earlyReward = await tryEarlyCompletion(job, "download/decrypt steps");
      if (earlyReward) return earlyReward;
      await stepSetEndpoint(job.serverId);
      await stepLogin(job.serverId);
      log("Getting server files");
      var filesWait=waitForEvent("COR3_AUTOJOB_SAI_FILES", 1e4);
      sendCmd("get.files", { serverId: job.serverId });
      var filesData;
      try {
        filesData = await filesWait;
      } catch (e) {
        throw new Error("Failed to get server files");
      }
      if (filesData.error) {
        throw new Error("Files error: " + friendlyError(filesData.error.message || JSON.stringify(filesData.error)));
      }
      var jobFile = null;
      var serverFileName = null;
      if (filesData.data && filesData.data.files) {
        jobFile = filesData.data.files.find(function(f) {
          return f.jobId === job.jobId;
        });
      }
      if (!jobFile) {
        log("Job file not found on server (may already be downloaded)", "warn");
      } else {
        serverFileName = jobFile.name;
        log("Downloading file: " + jobFile.name);
        var downloadWait=waitForEvent("COR3_AUTOJOB_SAI_FILE_DOWNLOAD",10000),dlResult=null;
        sendCmd("file.download", { serverId: job.serverId, fileId: jobFile.fileId });
        try {dlResult=await downloadWait;}catch(e){job.downloadOutcome='unconfirmed';log('Download reply unconfirmed; checking the current task file without resending download','warn');}
        if(dlResult&&dlResult.error){var detail=friendlyError(dlResult.error.message||dlResult.error.kind||'下载被拒绝');if(!/already.*download|already-downloaded/i.test(detail))throw new Error('DOWNLOAD_REJECTED: '+detail);job.downloadOutcome='existing';}
        else if(dlResult)job.downloadOutcome='acknowledged';
        log(job.downloadOutcome==='unconfirmed'?'Download pending; checking folder':'Download reply received; checking task file');
      }
      await delay(humanDelay());
      var needsDecrypt = jobConditionsRequireDecrypt(job);
      if (!needsDecrypt) {
        var reward = null;
        try {
          reward = await stepCompleteJob(job);
        } catch (e) {
          if (e.message && e.message.indexOf("job-conditions-not-met") >= 0) {
            log("Job conditions not met \u2014 file likely needs decryption", "warn");
            needsDecrypt = true;
          } else {
            throw e;
          }
        }
        if (reward) return reward;
        if (!needsDecrypt) {
          log("Job not yet complete \u2014 checking if decryption needed");
          needsDecrypt = true;
        }
      } else {
        log("Job conditions require file decryption \u2014 proceeding to decrypt flow");
      }
      var condFile = extractFileInfoFromConditions(job);
      if (condFile) {
        log("Job conditions file: " + (condFile.name || "unknown") + " (id: " + (condFile.id || "unknown") + ")");
      }
      var targetFile = await openFolderAndFindFile(job, fileListener.fileId, fileListener.fileName, serverFileName, function(){return {fileId:fileListener.fileId,fileName:fileListener.fileName};});
      return await runDecryptFlow(targetFile.id, targetFile.name, job, targetFile.isEncrypted);
    } finally {
      fileListener.remove();
    }
  }
  async function solveLogDeletion(job) {
    log("=== Log Deletion: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for Log Deletion job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting server logs");
    sendCmd("get.logs", { serverId: job.serverId });
    var logsData;
    try {
      logsData = await waitForEvent("COR3_AUTOJOB_SAI_LOGS", 1e4);
    } catch (e) {
      throw new Error("Failed to get server logs");
    }
    if (logsData.error) {
      throw new Error("Logs error: " + friendlyError(logsData.error.message || JSON.stringify(logsData.error)));
    }
    var jobLog = null;
    if (logsData.data && logsData.data.logs) {
      jobLog = logsData.data.logs.find(function(l) {
        return l.jobId === job.jobId;
      });
    }
    if (!jobLog) {
      log("Job log not found on server (may already be deleted)", "warn");
      return await stepCompleteJob(job);
    }
    log("Deleting log seq " + jobLog.seq + ": " + jobLog.message);
    sendCmd("log.delete", { serverId: job.serverId, seq: jobLog.seq });
    try {
      var delResult = await waitForEvent("COR3_AUTOJOB_SAI_LOG_DELETE", 1e4);
      if (delResult.error) {
        throw new Error("Log delete failed: " + friendlyError(delResult.error.message || JSON.stringify(delResult.error)));
      }
    } catch (e) {
      throw new Error("Log delete timed out: " + e.message);
    }
    log("Log deleted", "success");
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveLogDownload(job) {
    log("=== Log Download: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for Log Download job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting server logs");
    sendCmd("get.logs", { serverId: job.serverId });
    var logsData;
    try {
      logsData = await waitForEvent("COR3_AUTOJOB_SAI_LOGS", 1e4);
    } catch (e) {
      throw new Error("Failed to get server logs");
    }
    if (logsData.error) {
      throw new Error("Logs error: " + friendlyError(logsData.error.message || JSON.stringify(logsData.error)));
    }
    var jobLog = null;
    if (logsData.data && logsData.data.logs) {
      jobLog = logsData.data.logs.find(function(l) {
        return l.jobId === job.jobId;
      });
    }
    if (!jobLog) {
      log("Job log not found on server (may already be downloaded)", "warn");
      return await stepCompleteJob(job);
    }
    log("Downloading log seq " + jobLog.seq + ": " + jobLog.message);
    sendCmd("log.download", { serverId: job.serverId, seq: jobLog.seq });
    try {
      var dlResult = await waitForEvent("COR3_AUTOJOB_SAI_LOG_DOWNLOAD", 1e4);
      if (dlResult.error) {
        log("Log download response: " + friendlyError(dlResult.error.message || JSON.stringify(dlResult.error)), "warn");
      }
    } catch (e) {
      log("Log download timed out (may already be downloaded)", "warn");
    }
    log("Log downloaded", "success");
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveDecryptExtract(job) {
    log("=== Decrypt & Extract: " + jobLabel(job) + " ===");
    var fileListener = createFileUpdateListener();
    try {
      await stepTakeJob(job);
      if (!job.serverId) {
        throw new Error("No target server for Decrypt & Extract job");
      }
      var earlyReward = await tryEarlyCompletion(job, "download/decrypt steps");
      if (earlyReward) return earlyReward;
      await stepSetEndpoint(job.serverId);
      await stepLogin(job.serverId);
      log("Getting server files");
      var filesWait=waitForEvent("COR3_AUTOJOB_SAI_FILES", 1e4);
      sendCmd("get.files", { serverId: job.serverId });
      var filesData;
      try {
        filesData = await filesWait;
      } catch (e) {
        throw new Error("Failed to get server files");
      }
      if (filesData.error) {
        var filesErr = filesData.error.message || JSON.stringify(filesData.error);
        if (filesErr.indexOf("missing-software") >= 0 || filesErr.indexOf("software") >= 0) {
          throw new Error("Missing required software on server \u2014 cannot access files");
        }
        throw new Error("Files error: " + filesErr);
      }
      var jobFile = null;
      var serverFileName = null;
      if (filesData.data && filesData.data.files) {
        jobFile = filesData.data.files.find(function(f) {
          return f.jobId === job.jobId;
        });
      }
      if (!jobFile) {
        log("Job file not found on server (may already be downloaded)", "warn");
      } else {
        serverFileName = jobFile.name;
        log("Downloading file: " + jobFile.name);
        var downloadWait=waitForEvent("COR3_AUTOJOB_SAI_FILE_DOWNLOAD",10000),dlResult=null;
        sendCmd("file.download", { serverId: job.serverId, fileId: jobFile.fileId });
        try {dlResult=await downloadWait;}catch(e){job.downloadOutcome='unconfirmed';log('Download reply unconfirmed; checking the current task file without resending download','warn');}
        if(dlResult&&dlResult.error){var detail=friendlyError(dlResult.error.message||dlResult.error.kind||'下载被拒绝');if(!/already.*download|already-downloaded/i.test(detail))throw new Error('DOWNLOAD_REJECTED: '+detail);job.downloadOutcome='existing';}
        else if(dlResult)job.downloadOutcome='acknowledged';
        log(job.downloadOutcome==='unconfirmed'?'Download pending; checking folder':'Download reply received; checking task file');
      }
      await delay(humanDelay());
      var targetFile = await openFolderAndFindFile(job, fileListener.fileId, fileListener.fileName, serverFileName, function(){return {fileId:fileListener.fileId,fileName:fileListener.fileName};});
      return await runDecryptFlow(targetFile.id, targetFile.name, job, targetFile.isEncrypted);
    } finally {
      fileListener.remove();
    }
  }
  async function solveFileElimination(job) {
    log("=== File Elimination: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for File Elimination job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting server files");
    sendCmd("get.files", { serverId: job.serverId });
    var filesData;
    try {
      filesData = await waitForEvent("COR3_AUTOJOB_SAI_FILES", 1e4);
    } catch (e) {
      throw new Error("Failed to get server files");
    }
    if (filesData.error) {
      throw new Error("Files error: " + friendlyError(filesData.error.message || JSON.stringify(filesData.error)));
    }
    var jobFile = null;
    var targetFileIds = [];
    if (job.conditions) {
      for (var c = 0; c < job.conditions.length; c++) {
        if (job.conditions[c].type === "DeleteFile" && job.conditions[c].details && job.conditions[c].details.fileIds) {
          targetFileIds = job.conditions[c].details.fileIds;
          break;
        }
      }
    }
    if (filesData.data && filesData.data.files) {
      jobFile = filesData.data.files.find(function(f) {
        return f.jobId === job.jobId;
      });
      if (!jobFile && targetFileIds.length > 0) {
        jobFile = filesData.data.files.find(function(f) {
          return targetFileIds.indexOf(f.fileId) >= 0;
        });
      }
      if (!jobFile) {
        jobFile = filesData.data.files.find(function(f) {
          return f.source === "job";
        });
      }
    }
    if (!jobFile) {
      log("Job file not found on server (may already be deleted)", "warn");
      return await stepCompleteJob(job);
    }
    log("Deleting file: " + jobFile.name + " (fileId: " + jobFile.fileId + ")");
    sendCmd("file.delete", { serverId: job.serverId, fileId: jobFile.fileId });
    try {
      var delResult = await waitForEvent("COR3_AUTOJOB_SAI_FILE_DELETE", 1e4);
      if (delResult.error) {
        throw new Error("File delete failed: " + friendlyError(delResult.error.message || JSON.stringify(delResult.error)));
      }
    } catch (e) {
      throw new Error("File delete timed out: " + e.message);
    }
    log("File deleted", "success");
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveDataUpload(job) {
    log("=== Data Upload: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for Data Upload job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    var uploadFile = job.fileInfo || null;
    if (!uploadFile && job.conditions) {
      for (var c = 0; c < job.conditions.length; c++) {
        if (job.conditions[c].type === "UploadFile" && job.conditions[c].details && job.conditions[c].details.files && job.conditions[c].details.files.length > 0) {
          uploadFile = job.conditions[c].details.files[0];
          break;
        }
      }
    }
    if (!uploadFile) {
      throw new Error("Could not determine file to upload from job conditions");
    }
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting server files");
    sendCmd("get.files", { serverId: job.serverId });
    try {
      await waitForEvent("COR3_AUTOJOB_SAI_FILES", 1e4);
    } catch (e) {
      log("Failed to get server files (non-fatal)", "warn");
    }
    await delay(humanDelay());
    log("Uploading file: " + uploadFile.name);
    sendCmd("file.upload", { serverId: job.serverId, name: uploadFile.name, sizeMb: 0 });
    try {
      await waitForEvent("COR3_AUTOJOB_SAI_FILE_UPLOAD", 1e4);
      log("File upload confirmed by server", "success");
    } catch (e) {
      log("File upload response not received (trying to complete anyway)", "warn");
    }
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveIPCleanup(job) {
    log("=== IP Cleanup: " + jobLabel(job) + " ===");
    await stepTakeJob(job);
    if (!job.serverId) {
      throw new Error("No target server for IP Cleanup job");
    }
    var earlyReward = await tryEarlyCompletion(job);
    if (earlyReward) return earlyReward;
    await stepSetEndpoint(job.serverId);
    await stepLogin(job.serverId);
    log("Getting transit data");
    sendCmd("get.transit", { serverId: job.serverId });
    var transitData;
    try {
      transitData = await waitForEvent("COR3_AUTOJOB_SAI_TRANSIT", 1e4);
    } catch (e) {
      throw new Error("Failed to get transit data");
    }
    if (transitData.error) {
      throw new Error("Transit error: " + friendlyError(transitData.error.message || JSON.stringify(transitData.error)));
    }
    var ipsToRemove = [];
    if (job.conditions) {
      for (var c = 0; c < job.conditions.length; c++) {
        if (job.conditions[c].type === "DeleteIps" && job.conditions[c].details && job.conditions[c].details.ips) {
          ipsToRemove = job.conditions[c].details.ips;
          break;
        }
      }
    }
    if (ipsToRemove.length === 0 && transitData.data && transitData.data.ips) {
      var jobIps = transitData.data.ips.filter(function(entry) {
        return entry.source === "job" && entry.jobId === job.jobId;
      });
      ipsToRemove = jobIps.map(function(entry) {
        return entry.ip;
      });
      if (ipsToRemove.length > 0) {
        log("Found " + ipsToRemove.length + " IP(s) to remove from transit data (source=job)");
      }
    }
    if (ipsToRemove.length === 0) {
      throw new Error("Could not determine IPs to remove from job conditions or transit data");
    }
    for (var ipIdx = 0; ipIdx < ipsToRemove.length; ipIdx++) {
      var ip = ipsToRemove[ipIdx];
      log("Removing IP (" + (ipIdx + 1) + "/" + ipsToRemove.length + "): " + ip);
      sendCmd("transit.remove", { serverId: job.serverId, ip });
      try {
        var rmResult = await waitForEvent("COR3_AUTOJOB_SAI_TRANSIT_REMOVE", 1e4);
        if (rmResult.error) {
          throw new Error("IP removal failed for " + ip + ": " + friendlyError(rmResult.error.message || JSON.stringify(rmResult.error)));
        }
      } catch (e) {
        throw new Error("IP removal timed out for " + ip + ": " + e.message);
      }
      if (ipIdx < ipsToRemove.length - 1) await delay(humanDelay());
    }
    log("All IPs removed successfully", "success");
    await delay(humanDelay());
    return await stepCompleteJob(job);
  }
  async function solveJob(job) {
    var type = job.type || job.name;
    switch (type) {
      case "File Decryption":
        return await solveFileDecryption(job);
      case "IP Injection":
        return await solveIPInjection(job);
      case "Data Download":
        return await solveDataDownload(job);
      case "Log Deletion":
        return await solveLogDeletion(job);
      case "Log Download":
        return await solveLogDownload(job);
      case "Decrypt & Extract":
        return await solveDecryptExtract(job);
      case "File Elimination":
        return await solveFileElimination(job);
      case "Data Upload":
        return await solveDataUpload(job);
      case "IP Cleanup":
        return await solveIPCleanup(job);
      default:
        throw new Error("Unsupported job type: " + type);
    }
  }

  // src/auto-job-solver/main-loop.js
  async function processQueue() {
    if (state.running) {
      log("Auto Job Solver already running \u2014 ignoring duplicate start", "warn");
      return;
    }
    if (state.abortFlag) {
      log("Stop signal received before start \u2014 aborting", "warn");
      signalDone();
      return;
    }
    state.running = true;
    state.abortFlag = false;
    try {
      var waitAttempts = 0;
      while (window.__cor3InitialFetchInProgress && waitAttempts < 10 && !state.abortFlag) {
        waitAttempts++;
        log("Initial page load in progress \u2014 delaying auto-jobs start (attempt " + waitAttempts + "/10, waiting 10s)...", "warn");
        await new Promise(function(r) {
          setTimeout(r, 1e4);
        });
      }
      if (state.abortFlag) {
        signalDone();
        return;
      }
      if (window.__cor3InitialFetchInProgress) {
        log("\u26A0\uFE0F Initial page load still in progress after 100s \u2014 proceeding anyway", "warn");
      }
      state.tokenExpired = false;
      state._lastLoadoutServerType = null;
      state._lastEndpointServerId = null;
      invalidateLoadoutCache();
      state.jobQueue.sort(function(a, b) {
        var pa = getServerPriority(a.serverName || "");
        var pb = getServerPriority(b.serverName || "");
        if (pa !== pb) return pa - pb;
        var sta = (a.serverId ? getServerTypeName(a.serverId) : "") || "";
        var stb = (b.serverId ? getServerTypeName(b.serverId) : "") || "";
        if (sta !== stb) return sta < stb ? -1 : 1;
        var ta = getJobTypePriority(a.type || a.name || "");
        var tb = getJobTypePriority(b.type || b.name || "");
        return ta - tb;
      });
      log("Auto Job Solver started \u2014 processing " + state.jobQueue.length + " job(s)");
      var lockedJobs = state.solverSettings && state.solverSettings.lockedJobs;
      if (lockedJobs && lockedJobs.length > 0) {
        var now = Date.now();
        var appliedCount = 0;
        for (var lk = 0; lk < lockedJobs.length; lk++) {
          var locked = lockedJobs[lk];
          var matchingJob = state.jobQueue.find(function(j) {
            return j.jobId === locked.jobId;
          });
          if (!matchingJob) {
            log("Locked job " + locked.jobId + " no longer in queue \u2014 ignoring", "warn");
            continue;
          }
          if (locked.lockExpiresAt && new Date(locked.lockExpiresAt).getTime() > now) {
            var lockMins = Math.ceil((new Date(locked.lockExpiresAt).getTime() - now) / 6e4);
            matchingJob.status = "skipped";
            matchingJob.error = "Minigame locked (~" + lockMins + "m remaining)";
            matchingJob.lockExpiresAt = locked.lockExpiresAt;
            log("\u26A0\uFE0F Marked job as skipped (minigame locked): " + matchingJob.name + " \u2014 lock expires in ~" + lockMins + "m", "warn");
            appliedCount++;
          } else {
            log("Lock expired for job: " + (matchingJob.name || locked.jobId) + " \u2014 keeping as pending");
          }
        }
        if (appliedCount > 0) log(appliedCount + " job(s) marked as skipped from previous ICE Wall lockout");
      }
      updateTracker();
      log("Checking server maintenance status...");
      state._cachedMapData = null;
      try {
        await fetchMapData(true);
        if (serverMap.isReady()) {
          var skippedCount = 0;
          for (var m = 0; m < state.jobQueue.length; m++) {
            var mj = state.jobQueue[m];
            if (mj.status !== "pending" || mj.type === "File Decryption") continue;
            var mCheck = serverMap.checkPathMaintenance(mj.serverName);
            if (mCheck.blocked && mCheck.blockerName !== "no-path") {
              var mMins = Math.ceil((mCheck.remainingMs || 0) / 6e4);
              var mMsg = mCheck.blockerName === mj.serverName ? mj.serverName + " in maintenance" : mj.serverName + " unreachable (" + mCheck.blockerName + " in maintenance)";
              mj.status = "skipped";
              mj.error = mMsg + " (~" + mMins + "m remaining)";
              mj.maintenanceEndsAt = mCheck.endsAt || null;
              log("\u26A0\uFE0F Skipping job: " + mj.name + " \u2014 " + mMsg + " (~" + mMins + "m left)", "warn");
              skippedCount++;
            }
          }
          if (skippedCount > 0) {
            updateTracker();
            saveCompletedResultsIncremental();
            log(skippedCount + " job(s) skipped due to server maintenance");
          } else {
            log("All servers reachable \u2014 no maintenance detected");
          }
        }
      } catch (e) {
        log("\u26A0\uFE0F Could not fetch network map for pre-start maintenance check: " + e.message + " \u2014 continuing anyway", "warn");
      }
      var completedJobs = state.jobQueue.filter(function(j) {
        return j.canComplete;
      });
      if (completedJobs.length > 0) {
        log("Found " + completedJobs.length + " completable job(s) \u2014 claiming rewards first");
        for (var c = 0; c < completedJobs.length; c++) {
          if (state.abortFlag) break;
          var cj = completedJobs[c];
          cj.status = "running";
          updateTracker();
          try {
            if (cj.marketKey === "dark") {
              await stepSetEndpoint(DARK_MARKET_SERVER_ID);
            } else if (cj.marketKey === "soyuz") {
              await stepSetEndpoint(SOYUZ_MARKET_SERVER_ID);
            } else if (cj.marketKey === "usol") {
              await stepSetEndpoint(USOL_MARKET_SERVER_ID);
            }
            var cReward = await stepCompleteJob(cj);
            if (cReward) {
              cj.status = "done";
              cj.reward = cReward;
              log("\u2705 Claimed reward for completed job: " + cj.name + " \u2014 \u{1F4B0}" + cReward.credits, "success");
            } else {
              cj.status = "failed";
              cj.error = "Job completion returned no reward";
              log("Job completion returned no reward: " + cj.name, "warn");
            }
          } catch (e) {
            cj.status = "failed";
            cj.error = e.message;
            log("\u274C Failed to claim reward: " + cj.name + " \u2014 " + e.message, "error");
          }
          updateTracker();
          saveCompletedResultsIncremental();
          await delay(humanDelay());
          sendCmd("get.jobs", { marketId: cj.marketId });
          await delay(1e3);
        }
      }
      for (var i = 0; i < state.jobQueue.length; i++) {
        if (state.abortFlag) {
          log("Auto Jobs aborted by user", "warn");
          break;
        }
        state.currentJobIndex = i;
        var job = state.jobQueue[i];
        if (job.status === "done" || job.status === "failed" || job.status === "skipped" || job.status === "bugged") {
          continue;
        }
        if (isJobBugged(job)) {
          job.status = "bugged";
          job.error = "Bugged: " + (job.type || job.name) + " on D4RK RM7CE (logs tab unavailable)";
          log("\u26A0\uFE0F Skipping bugged job: " + job.name + " on D4RK RM7CE \u2014 logs tab not available", "warn");
          updateTracker();
          continue;
        }
        if (job.type !== "File Decryption" && job.serverName && job.serverName !== "None") {
          var pathCheck = await checkPathMaintenance(job.serverName);
          if (pathCheck.blocked) {
            var mins = Math.ceil(pathCheck.remainingMs / 6e4);
            var blockerMsg = pathCheck.blockerName === job.serverName ? job.serverName + " in maintenance" : job.serverName + " unreachable (" + pathCheck.blockerName + " in maintenance)";
            job.status = "skipped";
            job.error = blockerMsg + " (~" + mins + "m remaining)";
            job.maintenanceEndsAt = pathCheck.endsAt || null;
            log("\u26A0\uFE0F Skipping job: " + job.name + " \u2014 " + blockerMsg + " (~" + mins + "m left)", "warn");
            updateTracker();
            continue;
          }
        }
        job.status = "running";
        state._currentJobRef = job;
        updateTracker();
        try {
          if (job.type !== "File Decryption") await ensureLoadoutForJob(job);
        } catch (loadoutErr) {
          log("Loadout pre-check warning: " + loadoutErr.message + " \u2014 proceeding anyway", "warn");
        }
        try {
          if (job.marketKey === "dark") {
            await stepSetEndpoint(DARK_MARKET_SERVER_ID);
          } else if (job.marketKey === "soyuz") {
            await stepSetEndpoint(SOYUZ_MARKET_SERVER_ID);
          } else if (job.marketKey === "usol") {
            await stepSetEndpoint(USOL_MARKET_SERVER_ID);
          }
          log("Processing job " + (i + 1) + "/" + state.jobQueue.length + ": " + (job.name || job.type));
          var reward = await solveJob(job);
          if (reward) {
            job.status = "done";
            job.reward = reward;
            log("\u2705 Job completed: " + job.name + " \u2014 \u{1F4B0}" + reward.credits + " \u2B50" + reward.reputation + " \u{1F3C5}" + reward.renown, "success");
          } else {
            job.status = "failed";
            job.error = "Job completion returned no reward";
            log("Job completion returned no reward: " + job.name, "warn");
          }
        } catch (e) {
          var errText = friendlyError(e.message);
          if (e.message && (e.message.includes("job-not-found-refresh") || e.message.includes("job-not-found") || e.message.includes("Job is not available"))) {
            job.status = "skipped";
            job.error = "Job no longer available (stale data)";
            log("\u26A0\uFE0F Job skipped (stale): " + job.name + " \u2014 refreshing all market data", "warn");
            updateTracker();
            saveCompletedResultsIncremental();
            log("Refreshing all market data after stale job detected...");
            window.postMessage({ type: "COR3_REFRESH_ALL_MARKETS_SEQ", skipLots: true }, "*");
            await new Promise(function(resolve) {
              var refreshTimer = setTimeout(resolve, 3e4);
              function onRefreshDone(evt) {
                if (evt.data && evt.data.type === "COR3_ALL_MARKETS_REFRESHED") {
                  window.removeEventListener("message", onRefreshDone);
                  clearTimeout(refreshTimer);
                  resolve();
                }
              }
              window.addEventListener("message", onRefreshDone);
            });
            log("All market data refreshed \u2014 continuing with remaining jobs");
            state._currentJobRef = null;
            continue;
          }
          if (e.message === "Aborted" || state.abortFlag) {
            job.status = "skipped";
            job.error = "Aborted by user";
            log("\u26A0\uFE0F Job aborted: " + job.name, "warn");
            state._currentJobRef = null;
            updateTracker();
            break;
          }
          if (e.code === "JOB_LOADOUT_UNAVAILABLE") {
            job.status = "skipped";
            job.error = errText;
            log("Job skipped: " + job.name + " \u2014 " + errText, "warn");
          } else if (e.message && (e.message.includes("token-expired") || e.message.includes("invalid-access-token"))) {
            job.status = "skipped";
            job.error = errText;
            state.abortFlag = true;
            state.tokenExpired = true;
            log("\u26A0\uFE0F Job skipped (token expired): " + job.name + " \u2014 " + errText, "warn");
          } else if (e.message && e.message.includes("minigame-locked")) {
            job.lockExpiresAt = e.lockExpiresAt || null;
            log("\u{1F512} Minigame locked \u2014 waiting up to 5s for minigame window to appear...", "warn");
            var minigameType = await waitForMinigameWindow(5e3);
            if (minigameType === "icewall") {
              log("ICE Wall minigame detected \u2014 checking for stuck state...", "warn");
              var iceWallResult = await waitForIceWallStuckClear(log);
              if (iceWallResult.held) {
                job.status = "skipped";
                job.error = errText;
                updateTracker();
                saveCompletedResultsIncremental();
                state._currentJobRef = null;
                log("Waiting for the page health check \u2014 locked job: " + job.name, "warn");
                window.postMessage({
                  type: "COR3_AUTOJOB_ICE_WALL_RELOAD",runTicket:state.runTicket,
                  lockedJob: { jobId: job.jobId, lockExpiresAt: job.lockExpiresAt || null }
                }, location.origin);
                state.running = false;
                return;
              }
              job.status = "skipped";
              job.error = errText;
              log("\u26A0\uFE0F Job skipped (ICE Wall minigame locked, cleared): " + job.name + " \u2014 " + errText, "warn");
            } else {
              job.status = "skipped";
              job.error = errText;
              if (minigameType) {
                log("\u26A0\uFE0F Job skipped (minigame locked, type: " + minigameType + "): " + job.name + " \u2014 " + errText, "warn");
              } else {
                log("\u26A0\uFE0F Job skipped (minigame locked, no window detected): " + job.name + " \u2014 " + errText, "warn");
              }
            }
          } else if (e.message && e.message.includes("Market not reachable")) {
            job.status = "skipped";
            var marketServerName = MARKET_SERVER_NAMES[job.marketKey] || null;
            if (marketServerName) {
              var mktCheck = await checkPathMaintenance(marketServerName);
              if (mktCheck.blocked) {
                var mktMins = Math.ceil(mktCheck.remainingMs / 6e4);
                job.error = "Market unreachable (" + mktCheck.blockerName + " in maintenance, ~" + mktMins + "m remaining)";
                job.maintenanceEndsAt = mktCheck.endsAt || null;
                log("\u26A0\uFE0F Job skipped (market unreachable): " + job.name + " \u2014 " + mktCheck.blockerName + " in maintenance (~" + mktMins + "m left)", "warn");
              } else {
                job.error = errText;
                job.maintenanceEndsAt = null;
                log("\u26A0\uFE0F Job skipped (market unreachable): " + job.name + " \u2014 " + errText, "warn");
              }
            } else {
              job.error = errText;
              job.maintenanceEndsAt = null;
              log("\u26A0\uFE0F Job skipped (market unreachable): " + job.name + " \u2014 " + errText, "warn");
            }
          } else if (e.message && (e.message.includes("maintenance") || e.message.includes("unreachable"))) {
            job.status = "skipped";
            job.error = errText;
            job.maintenanceEndsAt = null;
            log("\u26A0\uFE0F Job skipped (unreachable): " + job.name + " \u2014 " + errText, "warn");
          } else if (e.message && (e.message.includes("internal-error") || e.message.includes("Internal server error"))) {
            job.status = "pending";
            job.error = null;
            log("\u26A0\uFE0F Internal server error on job: " + job.name + " \u2014 delaying entire process for 5 minutes before retrying...", "warn");
            updateTracker();
            for (var waitMin = 5; waitMin > 0 && !state.abortFlag; waitMin--) {
              log("\u23F3 Waiting " + waitMin + " minute(s) before resuming...", "info");
              await delay(6e4);
            }
            if (!state.abortFlag) {
              log("Resuming after internal server error delay \u2014 retrying job: " + job.name);
              i--;
            }
            state._currentJobRef = null;
            continue;
          } else if (e.message && (e.message.includes("Timeout") || e.message.includes("timed out") || e.message.includes("timeout"))) {
            job.status = "skipped";
            job.error = errText + " (will retry next run)";
            log("\u26A0\uFE0F Job skipped (timeout): " + job.name + " \u2014 " + errText, "warn");
          } else if (e.message && e.message.includes("rate-limited")) {
            job.status = "skipped";
            job.error = errText + " (will retry next run)";
            log("\u26A0\uFE0F Job skipped (rate limited): " + job.name + " \u2014 " + errText, "warn");
          } else {
            job.status = "failed";
            job.error = errText;
            log("\u274C Job failed: " + job.name + " \u2014 " + errText, "error");
          }
        }
        state._currentJobRef = null;
        updateTracker();
        saveCompletedResultsIncremental();
        if (state.abortFlag) break;
        try {
          await delay(humanDelay());
          sendCmd("get.jobs", { marketId: job.marketId });
          await delay(1e3);
          if (i < state.jobQueue.length - 1 && !state.abortFlag) {
            var interJobDelay = 2e3 + Math.floor(Math.random() * 1500);
            log("Waiting " + Math.round(interJobDelay / 1e3) + "s before next job...");
            await delay(interJobDelay);
          }
        } catch (delayErr) {
          if (state.abortFlag) break;
        }
      }
      var doneCount = state.jobQueue.filter(function(j) {
        return j.status === "done";
      }).length;
      var failedCount = state.jobQueue.filter(function(j) {
        return j.status === "failed";
      }).length;
      var buggedCount = state.jobQueue.filter(function(j) {
        return j.status === "bugged";
      }).length;
      var skippedCount = state.jobQueue.filter(function(j) {
        return j.status === "skipped";
      }).length;
      var totalCredits = state.jobQueue.reduce(function(sum, j) {
        return sum + (j.reward ? j.reward.credits : 0);
      }, 0);
      var totalDeposit = state.jobQueue.reduce(function(sum, j) {
        return sum + (j.reward ? j.reward.deposit || 0 : j.depositPaid || 0);
      }, 0);
      var totalRep = state.jobQueue.reduce(function(sum, j) {
        return sum + (j.reward ? j.reward.reputation : 0);
      }, 0);
      var totalRenown = state.jobQueue.reduce(function(sum, j) {
        return sum + (j.reward ? j.reward.renown : 0);
      }, 0);
      var depositStr = totalDeposit > 0 ? " (deposits: -" + totalDeposit + ")" : "";
      var buggedStr = buggedCount > 0 ? ", " + buggedCount + " bugged" : "";
      var skippedStr = skippedCount > 0 ? ", " + skippedCount + " skipped (maintenance)" : "";
      log("=== Auto Jobs Complete: " + doneCount + " done, " + failedCount + " failed" + buggedStr + skippedStr + ". Net: \u{1F4B0}" + totalCredits + depositStr + " \u2B50" + totalRep + " \u{1F3C5}" + totalRenown + " ===", "success");
      var completedResults = state.jobQueue.map(function(j) {
        return {
          jobId: j.jobId,
          name: j.name,
          type: j.type,
          serverName: j.serverName,
          marketKey: j.marketKey,
          status: j.status,
          reward: j.reward || null,
          error: j.error || null,
          completedAt: Date.now(),
          maintenanceEndsAt: j.maintenanceEndsAt || null,
          lockExpiresAt: j.lockExpiresAt || null
        };
      });
      window.postMessage({ type: "COR3_AUTOJOB_SAVE_COMPLETED", jobs: completedResults }, "*");
      if (!state.abortFlag && !state.solverSettings.skipFinalRefresh) {
        await new Promise(function(r) {
          setTimeout(r, 500);
        });
        log("Refreshing all markets sequentially...");
        window.postMessage({ type: "COR3_REFRESH_ALL_MARKETS_SEQ", skipLots: true }, "*");
        await new Promise(function(resolve) {
          var timer = setTimeout(resolve, 3e4);
          function onDone(evt) {
            if (evt.data && evt.data.type === "COR3_ALL_MARKETS_REFRESHED") {
              window.removeEventListener("message", onDone);
              clearTimeout(timer);
              resolve();
            }
          }
          window.addEventListener("message", onDone);
        });
        log("Market refresh complete.");
      }
    } catch (queueErr) {
      if (queueErr && queueErr.message !== "Aborted") {
        log("Unexpected error in processQueue: " + queueErr.message, "error");
      }
    } finally {
      signalDone();
    }
  }

  // src/auto-job-solver/index.js
  (function() {
    window.addEventListener("message", function(event) {
      if (event.source !== window) return;
      if (event.data && event.data.type === "COR3_AUTOJOB_START") {
        if (!masterAllowed() || state.running) return;
        state.abortFlag=false;state.runTicket=event.data.runTicket;
        state.jobQueue = event.data.jobs || [];
        state.solverSettings = event.data.settings || {};
        window.postMessage({type:'COR3_AUTOJOB_ACCEPTED',runTicket:state.runTicket},location.origin);
        updateTracker();
        processQueue();
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_STOP") {
        state.abortFlag = true;
        log("Stop signal received \u2014 aborting after current step", "warn");
      }
    });
    window.__cor3AutoJobEngineInstalled=true;ready();
    console.log("[COR3 Helper] Auto Job Solver engine loaded");
  })();
})();


