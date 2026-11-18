(() => {
  function cor3AutomationAllowed() { return !!window.__cor3MasterGate && window.__cor3MasterGate.allowed(); }
  // src/content-early/state.js
  var OrigWebSocket = window.WebSocket;
  var trackedSockets = [];
  var socketLastActivity = /* @__PURE__ */ new Map();
  var _activeSocket = null;
  function getActiveSocket() {
    return _activeSocket;
  }
  function setActiveSocket(ws) {
    _activeSocket = ws;
  }
  var _capturedBearerToken = null;
  function getCapturedBearerToken() {
    return _capturedBearerToken;
  }
  function setCapturedBearerToken(token) {
    _capturedBearerToken = token;
  }
  function replayCapturedSession() {
    if (!cor3AutomationAllowed()) return false;
    const token = getCapturedBearerToken();
    const available = typeof token === "string" && token.startsWith("Bearer ");
    window.postMessage({ type: "COR3_SESSION_STATUS", available }, location.origin);
    if (available) window.postMessage({ type: "COR3_BEARER_TOKEN", token }, location.origin);
    return available;
  }
  const expiredSockets = new WeakSet();
  var pendingRetryOps = [];
  var tokenExpiredFlag = false;
  function setTokenExpiredFlag(val) {
    tokenExpiredFlag = val;
  }
  function setPendingRetryOps(val) {
    pendingRetryOps = val;
  }
  var _marketRefreshAbortId = 0;
  function getMarketRefreshAbortId() {
    return _marketRefreshAbortId;
  }
  function bumpMarketRefreshAbortId() {
    wsSendQueue=[];wsSendFlushTimer=null;
    return ++_marketRefreshAbortId;
  }
  var HOME_MARKET_ID = "019d3ea4-85bd-7389-904d-8f7c85841134";
  var DARK_MARKET_ID = "019d3ea4-85bd-7389-904d-908ba9194aa0";
  var DARK_SERVER_ID = "019d29c5-4b37-79bf-b23e-304d8ea03c15";
  var SOYUZ_MARKET_ID = "019da731-2db5-7d76-9447-1ea3b9b78001";
  var SOYUZ_SERVER_ID = "019da6f1-16f7-75a6-b6d3-0b1d5f92a108";
  var USOL_MARKET_ID = "019e4065-6ae8-760d-8724-58ab4f2cf7d7";
  var USOL_SERVER_ID = "019e4052-c317-7388-9d71-883ffb1560cd";
  window.__cor3UnreachableMarkets = {};
  window.__cor3IsMarketUnreachable = function(marketType) {
    var entry = window.__cor3UnreachableMarkets[marketType];
    if (!entry) return null;
    if (entry.maintenanceEndsAt) {
      var endsAt = new Date(entry.maintenanceEndsAt).getTime();
      if (Date.now() >= endsAt) {
        delete window.__cor3UnreachableMarkets[marketType];
        return null;
      }
    }
    return entry;
  };
  window.__cor3InitialFetchInProgress = false;

  // src/content-early/ws-proxy.js
  function decodeBinaryMsg(raw, cb) {
    var codec = window.__cor3MsgpackCodec;
    if (!codec) {
      cb(null);
      return;
    }
    if (raw instanceof Blob) {
      raw.arrayBuffer().then(function(buf) {
        try {
          var pkt2 = codec.decode(new Uint8Array(buf));
          cb(codec.packetToString(pkt2));
        } catch (e) {
          cb(null);
        }
      }).catch(function() {
        cb(null);
      });
      return;
    }
    try {
      var u8 = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
      var pkt = codec.decode(u8);
      cb(codec.packetToString(pkt));
    } catch (e) {
      cb(null);
    }
  }
  function installWebSocketProxy(handleWsMessage2) {
    const WebSocketProxy = new Proxy(OrigWebSocket, {
      construct(target, args) {
        const ws = new target(...args);
        const url = args[0] || "";
        var isMinigameSocket = url.includes("ice-wall-break") || url.includes("minigame") || url.includes("hack") || url.includes("games");
        ws.__cor3IsMinigame = isMinigameSocket;
        if (url.includes("cor3") || url.includes("corie")) {
          console.log("[COR3 Helper] Tracking WebSocket:", url, isMinigameSocket ? "(minigame \u2014 excluded from active tracking)" : "");
          ws.__cor3Url = url;
          if (!isMinigameSocket) {
            trackedSockets.push(ws);
          }
          var origSend = ws.send.bind(ws);
          ws.send = function(data) {
            try {
              if (typeof data === "string") {
                if (data.indexOf("40{") === 0) {
                  try {
                    var connectPayload = JSON.parse(data.substring(2));
                    if (connectPayload.token && connectPayload.token.startsWith("Bearer ")) {
                      setCapturedBearerToken(connectPayload.token);
                      window.postMessage({ type: "COR3_BEARER_TOKEN", token: connectPayload.token }, location.origin);
                    }
                  } catch (e) {
                  }
                }
                window.postMessage({ type: "COR3_WS_LOG", direction: "sent", message: data }, "*");
              } else if (data instanceof ArrayBuffer || typeof Uint8Array !== "undefined" && ArrayBuffer.isView(data)) {
                decodeBinaryMsg(data, function(str) {
                  if (str) {
                    window.postMessage({ type: "COR3_WS_LOG", direction: "sent", message: str }, "*");
                    if (str.indexOf("40{") === 0) {
                      try {
                        var cp = JSON.parse(str.substring(2));
                        if (cp.token && cp.token.startsWith("Bearer ")) {
                          setCapturedBearerToken(cp.token);
                          window.postMessage({ type: "COR3_BEARER_TOKEN", token: cp.token }, location.origin);
                        }
                      } catch (e) {
                      }
                    }
                  }
                });
              } else if (data instanceof Blob) {
                decodeBinaryMsg(data, function(str) {
                  if (str) {
                    window.postMessage({ type: "COR3_WS_LOG", direction: "sent", message: str }, "*");
                    if (str.indexOf("40{") === 0) {
                      try {
                        var cp = JSON.parse(str.substring(2));
                        if (cp.token && cp.token.startsWith("Bearer ")) {
                          setCapturedBearerToken(cp.token);
                          window.postMessage({ type: "COR3_BEARER_TOKEN", token: cp.token }, location.origin);
                        }
                      } catch (e) {
                      }
                    }
                  }
                });
              }
            } catch (e) {
            }
            return origSend(data);
          };
          ws.addEventListener("message", function(event) {
            try {
              if (!isMinigameSocket) {
                if (getActiveSocket() !== ws) {
                  console.log("[COR3 Helper] Active socket changed to:", ws.__cor3Url);
                  setActiveSocket(ws);
                }
                socketLastActivity.set(ws, Date.now());
              }
              var raw = event.data;
              if (raw instanceof ArrayBuffer || raw instanceof Blob || typeof Uint8Array !== "undefined" && ArrayBuffer.isView(raw) && !(raw instanceof DataView)) {
                decodeBinaryMsg(raw, function(str) {
                  if (str) handleWsMessage2(str, ws);
                });
              } else {
                handleWsMessage2(raw, ws);
              }
            } catch (e) {
            }
          });
          ws.addEventListener("open", function() {
            console.log("[COR3 Helper] WS connected \u2014 scheduling initial data fetch");
            setTimeout(function() {
              if (tokenExpiredFlag || pendingRetryOps.length > 0) {
                console.log("[COR3 Helper] Clearing pending retries (initial fetch will cover them):", pendingRetryOps.join(", "));
                setPendingRetryOps([]);
                setTokenExpiredFlag(false);
              }
              window.__cor3InitialFetch && window.__cor3InitialFetch();
            }, 3e3);
          });
          ws.addEventListener("close", function() {
            console.log("[COR3 Helper] WS closed");
            const idx = trackedSockets.indexOf(ws);
            if (idx !== -1) trackedSockets.splice(idx, 1);
            socketLastActivity.delete(ws);
            if (getActiveSocket() === ws) setActiveSocket(null);
            if (ws.__cor3IsMinigame && ws.__cor3Url && ws.__cor3Url.indexOf("ice-wall-break") !== -1) {
              window.postMessage({ type: "COR3_ICE_WALL_GAME_ENDED" }, "*");
            }
          });
        }
        return ws;
      },
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      }
    });
    Object.defineProperty(WebSocketProxy, "prototype", {
      value: OrigWebSocket.prototype,
      writable: false,
      configurable: false
    });
    window.WebSocket = WebSocketProxy;
  }

  // src/content-early/ws-send.js
  var WS_THROTTLE_MS = 250;
  var wsSendLastTime = 0;
  var wsSendQueue = [];
  var wsSendFlushTimer = null;
  var WS_QUEUE_MAX = 50;
  var _ceChannel = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
  var _ceCbs = [];
  if (_ceChannel) {
    _ceChannel.port1.onmessage = function() {
      var cbs = _ceCbs.slice();
      _ceCbs.length = 0;
      for (var i = 0; i < cbs.length; i++) cbs[i]();
    };
  }
  function ceNextTick(fn) {
    if (_ceChannel) {
      _ceCbs.push(fn);
      _ceChannel.port2.postMessage(0);
    } else {
      setTimeout(fn, 0);
    }
  }
  function scheduleFlush(delayMs) {
    if (wsSendFlushTimer) return;
    if (delayMs <= 0) {
      ceNextTick(wsSendFlush);
      wsSendFlushTimer = true;
      return;
    }
    var target = Date.now() + delayMs;
    function tick() {
      if (Date.now() >= target) {
        wsSendFlush();
        return;
      }
      var rem = target - Date.now();
      if (rem > 200) {
        setTimeout(function() {
          ceNextTick(tick);
        }, Math.min(rem - 50, 500));
      } else {
        ceNextTick(tick);
      }
    }
    wsSendFlushTimer = true;
    ceNextTick(tick);
  }
  function packetStamp() { return {generation:window.__cor3MasterGate.snapshot().generation,abort:getMarketRefreshAbortId(),at:Date.now()}; }
  function packetValid(stamp,msg) {
    return stamp&&stamp.generation===window.__cor3MasterGate.snapshot().generation&&stamp.abort===getMarketRefreshAbortId()&&Date.now()>=stamp.at&&Date.now()-stamp.at<=(Cor3MasterCore.isReadOnlyPacket(msg)?15000:5000);
  }
  function transportState(code) { window.postMessage({type:'COR3_TRANSPORT_STATE',code},location.origin); }
  function wsSendRaw(msg,stamp) {
    stamp=stamp||packetStamp();
    if(!packetValid(stamp,msg)){transportState('PACKET_EXPIRED');return false;}
    if(!window.__cor3MasterGate.permitsPacket(msg))return false;
    var toSend=msg,codec=window.__cor3MsgpackCodec;
    if(codec&&codec.isReady()&&typeof msg==='string'){var buf=codec.stringToPacketBuffer(msg);if(buf)toSend=buf;}
    var activeSocket=getActiveSocket();
    if(!activeSocket||activeSocket.readyState!==OrigWebSocket.OPEN){
      var bestTime=-1;activeSocket=null;
      for(const ws of trackedSockets)if(ws.readyState===OrigWebSocket.OPEN&&(socketLastActivity.get(ws)||0)>bestTime){activeSocket=ws;bestTime=socketLastActivity.get(ws)||0;}
      if(activeSocket)setActiveSocket(activeSocket);
    }
    if(activeSocket){
      try{activeSocket.send(toSend);wsSendLastTime=Date.now();return true;}
      catch{transportState('SEND_UNCONFIRMED');return false;}
    }
    // Do not replay any command after a missing socket. The read loader may
    // retry only after a fresh admission; mutation outcomes stay explicit.
    transportState('SOCKET_UNAVAILABLE');return false;
  }
  function wsSendFlush() {
    wsSendFlushTimer=null;if(!wsSendQueue.length)return;
    var elapsed=Date.now()-wsSendLastTime;
    if(elapsed<WS_THROTTLE_MS){scheduleFlush(WS_THROTTLE_MS-elapsed);return;}
    const entry=wsSendQueue.shift();wsSendRaw(entry.msg,entry.stamp);
    if(wsSendQueue.length)scheduleFlush(WS_THROTTLE_MS);
  }
  function wsSend(msg) {
    if(!window.__cor3MasterGate||!window.__cor3MasterGate.permitsPacket(msg))return false;
    const stamp=packetStamp(),elapsed=Date.now()-wsSendLastTime;
    if(elapsed>=WS_THROTTLE_MS&&!wsSendQueue.length)return wsSendRaw(msg,stamp);
    if(wsSendQueue.length>=WS_QUEUE_MAX){transportState('QUEUE_FULL');return false;}
    wsSendQueue.push({msg,stamp});if(!wsSendFlushTimer)scheduleFlush(Math.max(0,WS_THROTTLE_MS-elapsed));return true;
  }
  function queueRetryOp(opName) {
    if (!cor3AutomationAllowed()) return;
    if (!pendingRetryOps.includes(opName)) {
      pendingRetryOps.push(opName);
    }
  }
  function humanDelay() {
    return 400 + Math.floor(Math.random() * 500);
  }
  var joinedRooms = /* @__PURE__ */ new Set();
  function delay(ms) {
    return new Promise(function(resolve) {
      var target = Date.now() + ms;
      function check() {
        if (Date.now() >= target) {
          resolve();
          return;
        }
        var remaining = target - Date.now();
        if (remaining > 200) {
          setTimeout(function() {
            ceNextTick(check);
          }, Math.min(remaining - 50, 500));
        } else {
          ceNextTick(check);
        }
      }
      ceNextTick(check);
    });
  }
  function leaveRoom(room) {
    if (!joinedRooms.has(room)) return false;
    if (!wsSend('42["leave-room",{"room":"' + room + '"}]')) return false;
    joinedRooms.delete(room);
    return true;
  }
  function sendJoin(room) {
    var joinData = { room };
    var capturedBearerToken = getCapturedBearerToken();
    if (capturedBearerToken) {
      var jwt = capturedBearerToken;
      if (jwt.startsWith("Bearer ")) jwt = jwt.substring(7);
      joinData.jwtToken = jwt;
    }
    if (window.__cor3WebVersion) {
      joinData.clientVersion = window.__cor3WebVersion;
    }
    if (!wsSend('42["join-room",' + JSON.stringify(joinData) + "]")) return false;
    joinedRooms.add(room);
  }
  function leaveRoomsInOrder(rooms) {
    var chain = Promise.resolve();
    rooms.forEach(function(room) {
      chain = chain.then(function() {
        if (leaveRoom(room)) {
          return delay(humanDelay());
        }
      });
    });
    return chain;
  }
  function joinRoomsInOrder(rooms) {
    var chain = Promise.resolve();
    rooms.forEach(function(room) {
      chain = chain.then(function() {
        sendJoin(room);
        return delay(humanDelay());
      });
    });
    return chain;
  }
  function enterRooms(rooms) {
    var toLeave = rooms.slice().reverse().filter(function(r) {
      return joinedRooms.has(r);
    });
    return leaveRoomsInOrder(toLeave).then(function() {
      return joinRoomsInOrder(rooms);
    });
  }

  // src/content-early/http-intercept.js
  var webVersion = null;
  function parsePollingForDesktopOptions(responseText) {
    if (!responseText || typeof responseText !== "string") return;
    var startIdx = 0;
    while (startIdx < responseText.length) {
      var msgStart = responseText.indexOf('42["desktop"', startIdx);
      if (msgStart === -1) break;
      var jsonStart = msgStart + 2;
      try {
        var bracketDepth = 0;
        var inString = false;
        var escape = false;
        var end = -1;
        for (var ci = jsonStart; ci < responseText.length; ci++) {
          var ch = responseText[ci];
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === "\\" && inString) {
            escape = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;
          if (ch === "[" || ch === "{") bracketDepth++;
          else if (ch === "]" || ch === "}") {
            bracketDepth--;
            if (bracketDepth === 0) {
              end = ci + 1;
              break;
            }
          }
        }
        if (end > jsonStart) {
          var jsonStr = responseText.substring(jsonStart, end);
          var parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed[0] === "desktop" && parsed[1]) {
            var payload = parsed[1];
            if (payload.event && payload.event.action === "get.options" && payload.data) {
              console.log("[COR3 Helper] Desktop get.options found in polling response \u2014 folders:", payload.data.folders ? payload.data.folders.length : 0);
              if (payload.data.folders) {
                var dlf = payload.data.folders.find(function(f) {
                  return f.name === "Downloads";
                });
                if (dlf) {
                  window.__cor3DownloadFolderId = dlf.id;
                  console.log("[COR3 Helper] Cached Downloads folder ID from polling:", dlf.id);
                }
              }
              window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_OPTIONS", data: payload.data, error: payload.error || null }, "*");
            }
            if (payload.event && (payload.event.action === "update.file" || payload.event.action === "open.file" || payload.event.action === "decrypt.file") && (payload.data || payload.error)) {
              var pollFileError = payload.error || null;
              if (!pollFileError && payload.data && payload.data.kind === "insufficient_power") {
                pollFileError = { message: "insufficient_power", kind: "insufficient_power", ability: payload.data.ability, required: payload.data.required, available: payload.data.available };
              }
              window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_FILE", data: payload.data || null, error: pollFileError }, "*");
              if (payload.event.action === "update.file") {
                window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_UPDATE_FILE", data: payload.data || null, error: payload.error || null }, "*");
              }
            }
          }
        }
      } catch (e) {
      }
      startIdx = msgStart + 1;
    }
  }
  function installHttpIntercept() {
    const OrigFetch = window.fetch;
    window.fetch = function() {
      const args = arguments;
      const input = args[0];
      try {
        const url = typeof input === "string" ? input : input && input.url ? input.url : "";
        if (url.includes("translation.json")) {
          try {
            const parsedUrl = new URL(url, window.location.origin);
            if (!webVersion) {
              webVersion = parsedUrl.searchParams.get("v");
            }
            console.log("[COR3 Helper] Captured web version from translation.json:", webVersion);
            window.__cor3WebVersion = webVersion;
            setTimeout(function() {
              window.postMessage({ type: "COR3_WEB_VERSION", version: webVersion }, "*");
            }, 250);
          } catch (e) {
            console.log("[COR3 Helper] Error parsing version:", e);
          }
        }
      } catch (e) {
      }
      var result = OrigFetch.apply(this, args);
      try {
        var fetchUrl = typeof input === "string" ? input : input && input.url ? input.url : "";
        if (fetchUrl.includes("socket.io") && fetchUrl.includes("transport=polling")) {
          result.then(function(resp) {
            if (resp && resp.ok) {
              resp.clone().text().then(function(text) {
                parsePollingForDesktopOptions(text);
              }).catch(function() {
              });
            }
          }).catch(function() {
          });
        }
        if (fetchUrl.includes("api/users/me")) {
          result.then(function(resp) {
            if (resp && resp.ok) {
              resp.clone().json().then(function(data) {
                if (data && data.systemVersion !== void 0) {
                  console.log("[COR3 Helper] Captured system version from api/users/me:", data.systemVersion);
                  window.__cor3SystemVersion = data.systemVersion;
                  window.postMessage({ type: "COR3_SYSTEM_VERSION", version: data.systemVersion }, "*");
                }
              }).catch(function() {
              });
            }
          }).catch(function() {
          });
        }
        if (fetchUrl.includes("api/user-daily-claim/rewards")) {
          result.then(function(resp) {
            if (resp && resp.ok) {
              resp.clone().json().then(function(data) {
                if (Array.isArray(data)) {
                  window.postMessage({ type: "COR3_DAILY_REWARDS", rewards: data }, "*");
                }
              }).catch(function() {
              });
            }
          }).catch(function() {
          });
        }
      } catch (e) {
      }
      return result;
    };
    const OrigXHROpen = XMLHttpRequest.prototype.open;
    const OrigXHRSend = XMLHttpRequest.prototype.send;
    const OrigXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function() {
      this.__cor3Url = arguments[1] || "";
      return OrigXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      if ((name === "Authorization" || name === "authorization") && value && value.startsWith("Bearer ") && (this.__cor3Url && (this.__cor3Url.includes("cor3") || this.__cor3Url.includes("corie")))) {
        setCapturedBearerToken(value);
        window.postMessage({ type: "COR3_BEARER_TOKEN", token: value }, location.origin);
      }
      return OrigXHRSetHeader.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      var xhr = this;
      if (xhr.__cor3Url && xhr.__cor3Url.includes("socket.io") && xhr.__cor3Url.includes("transport=polling")) {
        xhr.addEventListener("load", function() {
          try {
            if (xhr.responseText) {
              parsePollingForDesktopOptions(xhr.responseText);
            }
          } catch (e) {
          }
        });
      }
      return OrigXHRSend.apply(this, arguments);
    };
  }

  // src/content-early/drone.js
  function handleDroneMessage(eventName, payload) {
    if (eventName !== "drone-missions" || !payload) return false;
    var dmAction = payload.event ? payload.event.action : null;
    if (payload.error) {
      window.postMessage({ type: "COR3_WS_DRONE_ERROR", action: dmAction, error: payload.error }, "*");
      return true;
    }
    if (!payload.data) return true;
    if (dmAction === "get.options") {
      window.postMessage({ type: "COR3_WS_DRONE_OPTIONS", action: dmAction, data: payload.data }, "*");
    } else if (dmAction === "repair") {
      window.postMessage({ type: "COR3_WS_DRONE_REPAIR", data: payload.data }, "*");
    } else if (dmAction === "launch") {
      window.postMessage({ type: "COR3_WS_DRONE_MISSION", data: payload.data }, "*");
      window.postMessage({ type: "COR3_WS_DRONE_LAUNCHED", data: payload.data }, "*");
    } else if (dmAction === "resolve.event") {
      window.postMessage({ type: "COR3_WS_DRONE_MISSION", data: payload.data }, "*");
    } else if (dmAction === "event") {
      window.postMessage({ type: "COR3_WS_DRONE_EVENT", data: payload.data }, "*");
    } else if (dmAction === "completed") {
      window.postMessage({ type: "COR3_WS_DRONE_COMPLETED", data: payload.data }, "*");
    } else if (dmAction === "update") {
      window.postMessage({ type: "COR3_WS_DRONE_UPDATE", data: payload.data }, "*");
    } else if (dmAction === "get.archived") {
      window.postMessage({ type: "COR3_WS_DRONE_ARCHIVED", data: payload.data }, "*");
    }
    return true;
  }
  window.__cor3RequestDroneOptions = function() {
    return stableReads.droneOptions();
  };
  window.__cor3LaunchDrone = function(locationConfigId, missionConfigId) {
    console.log("[COR3 Helper] Launching drone mission:", locationConfigId, missionConfigId);
    var data = { locationConfigId, missionConfigId };
    var msg = '42["event",{"event":{"name":"drone-missions","action":"launch"},"data":' + JSON.stringify(data) + "}]";
    wsSend(msg);
    return true;
  };
  window.__cor3ResolveDroneEvent = function(missionId, eventId, optionId) {
    console.log("[COR3 Helper] Resolving drone event:", eventId, "->", optionId);
    var data = { missionId, eventId, optionId };
    var msg = '42["event",{"event":{"name":"drone-missions","action":"resolve.event"},"data":' + JSON.stringify(data) + "}]";
    wsSend(msg);
    return true;
  };
  window.__cor3RepairDrone = function(targetDurability) {
    targetDurability = targetDurability || 100;
    console.log("[COR3 Helper] Repairing drone to durability:", targetDurability);
    var msg = '42["event",{"event":{"name":"drone-missions","action":"repair"},"data":{"targetDurability":' + targetDurability + "}}]";
    wsSend(msg);
    return true;
  };
  window.__cor3RequestDroneArchived = function(cursor, limit) {
    console.log("[COR3 Helper] Requesting drone archived missions");
    var data = { cursor: cursor || null, limit: limit || 20 };
    var msg = '42["event",{"event":{"name":"drone-missions","action":"get.archived"},"data":' + JSON.stringify(data) + "}]";
    wsSend(msg);
    return true;
  };
  window.addEventListener("message", function(event) {
    if (event.source !== window) return;
    if (!event.data) return;
    var t = event.data.type;
    if (t === "COR3_REQUEST_DRONE_OPTIONS") window.__cor3RequestDroneOptions();
    else if (t === "COR3_LAUNCH_DRONE") window.__cor3LaunchDrone(event.data.locationConfigId, event.data.missionConfigId);
    else if (t === "COR3_RESOLVE_DRONE_EVENT") window.__cor3ResolveDroneEvent(event.data.missionId, event.data.eventId, event.data.optionId);
    else if (t === "COR3_REPAIR_DRONE") window.__cor3RepairDrone(event.data.targetDurability);
    else if (t === "COR3_REQUEST_DRONE_ARCHIVED") window.__cor3RequestDroneArchived(event.data.cursor, event.data.limit);
  });

  // src/content-early/ws-message-handler.js
  var __cor3PostUnreachable = null;
  function setPostUnreachable(fn) {
    __cor3PostUnreachable = fn;
  }
  function isTransientBusyMessage(msg) {
    var m = String(msg || "").toLowerCase();
    var keys = [
      "already",
      "in progress",
      "in-progress",
      "processing",
      "busy",
      "operation",
      "pending",
      "cooldown",
      "rate limit",
      "too many requests",
      "\u6B63\u5728",
      "\u5DF2\u5728",
      "\u64CD\u4F5C\u4E2D",
      "\u8FDB\u884C\u4E2D",
      "\u5904\u7406\u4E2D",
      "\u51B7\u5374"
    ];
    for (var i = 0; i < keys.length; i++) {
      if (m.indexOf(keys[i]) !== -1) return true;
    }
    return false;
  }
  function handleWsMessage(rawData, socket) {
    if (typeof rawData !== "string") return;
    window.postMessage({ type: "COR3_WS_LOG", direction: "received", message: rawData }, "*");
    if (!rawData.startsWith("42")) return;
    const jsonStr = rawData.substring(2);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return;
    }
    if (!Array.isArray(parsed) || parsed.length < 2) return;
    const eventName = parsed[0];
    const payload = parsed[1];
    // Fixed, read-only projection only. No raw message, credential, caller ID or generic forwarding.
    try {
      const projectEffect = globalThis.Cor3FullEffectProjection;
      const effect = projectEffect && projectEffect.project(eventName, payload);
      if (effect) window.postMessage(effect, location.origin);
    } catch (_) { /* Proof absence never interrupts the original helper or implies success. */ }
    if (handleDroneMessage(eventName, payload)) return;
    if (eventName === "error" && payload && payload.message === "token-expired") {
      if (!socket || socket.__cor3IsMinigame || !trackedSockets.includes(socket) || expiredSockets.has(socket)) return;
      expiredSockets.add(socket);
      if (!cor3AutomationAllowed()) return;
      setCapturedBearerToken(null);
      setTokenExpiredFlag(true);
      var newAbortId = bumpMarketRefreshAbortId();
      console.log("[COR3 Helper] Bumped market refresh abort ID to", newAbortId);
      if (window.__cor3ResetInitialFetch) window.__cor3ResetInitialFetch();
      queueRetryOp("expeditions");
      queueRetryOp("stash");
      queueRetryOp("dailyOps");
      window.postMessage({ type: "COR3_TOKEN_EXPIRED" }, "*");
      if (socket.readyState === OrigWebSocket.OPEN) socket.close();
      return;
    }
    if (eventName === "specialists" && payload && payload.data) {
      window.postMessage({
        type: "COR3_WS_SPECIALISTS",
        data: payload.data
      }, "*");
    }
    if (eventName === "stash" && payload && payload.data) {
      window.postMessage({
        type: "COR3_WS_STASH",
        stash: payload.data
      }, "*");
    }
    if (eventName === "stash" && payload && payload.event && payload.event.action === "move.item") {
      window.postMessage({
        type: "COR3_WS_STASH_MOVE",
        data: payload.data || null,
        error: payload.error || null,
        requestId: payload.requestId || null
      }, "*");
    }
    if (eventName === "mail" && payload) {
      window.postMessage({
        type: "COR3_WS_MAIL",
        action: payload.event ? payload.event.action : null,
        data: payload.data || null,
        error: payload.error || null,
        requestId: payload.requestId || null
      }, "*");
      return;
    }
    if (eventName === "chat" && payload) {
      window.postMessage({
        type: "COR3_WS_CHAT",
        action: payload.event ? payload.event.action : null,
        data: payload.data || null,
        error: payload.error || null,
        requestId: payload.requestId || null
      }, "*");
      return;
    }
    if (eventName === "gameplay" && payload && payload.event && payload.event.action === "update.state") {
      window.postMessage({
        type: "COR3_WS_GAMEPLAY",
        data: payload.data || null
      }, "*");
      return;
    }
    if (eventName === "loadout" && payload) {
      var loadoutAction = payload.event ? payload.event.action : null;
      if (payload.error) {
        window.postMessage({
          type: "COR3_WS_LOADOUT_ERROR",
          action: loadoutAction,
          error: payload.error
        }, "*");
      }
      if (payload.data) {
        window.postMessage({
          type: "COR3_WS_LOADOUT",
          action: loadoutAction,
          loadout: payload.data
        }, "*");
        window.__cor3LoadoutData = payload.data;
        window.postMessage({
          type: "COR3_AUTOJOB_LOADOUT",
          action: loadoutAction,
          data: payload.data,
          error: null
        }, "*");
      }
      if (payload.error) {
        window.postMessage({
          type: "COR3_AUTOJOB_LOADOUT",
          action: loadoutAction,
          data: null,
          error: payload.error
        }, "*");
      }
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "get.mercenaries") {
      var mercFactionKey = null;
      if (payload.data && payload.data.mercenaries && payload.data.mercenaries.length > 0) {
        var firstMerc = payload.data.mercenaries[0];
        if (firstMerc.faction && firstMerc.faction.key) mercFactionKey = firstMerc.faction.key;
      }
      if (!mercFactionKey && payload.data && payload.data.eliteSlots && payload.data.eliteSlots.length > 0) {
        var firstElite = payload.data.eliteSlots[0];
        if (firstElite.mercenary && firstElite.mercenary.faction && firstElite.mercenary.faction.key) mercFactionKey = firstElite.mercenary.faction.key;
        if (!mercFactionKey && firstElite.marketId === USOL_MARKET_ID) mercFactionKey = "usol_employment";
      }
      if (mercFactionKey === "usol_employment") {
        window.postMessage({ type: "COR3_WS_USOL_MERCENARIES", data: payload.data }, "*");
      } else {
        if (payload.data && payload.data.mercenaries) {
          window.__cor3CachedMercIds = payload.data.mercenaries.map(function(m) {
            return m.id;
          });
        }
        window.postMessage({ type: "COR3_WS_MERCENARIES", data: payload.data }, "*");
      }
      return;
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "get.config") {
      var isUsolConfig = !!window.__cor3UsolMercFetchInProgress;
      if (payload.data && payload.data.locations && payload.data.locations.length > 0) {
        var picked = window.__cor3PickLocationConfig(payload.data.locations);
        if (isUsolConfig) {
          window.__cor3UsolExpConfigIds = picked;
        } else {
          window.__cor3ExpConfigIds = picked;
        }
      }
      if (isUsolConfig) {
        window.postMessage({ type: "COR3_WS_USOL_EXPEDITION_CONFIG", data: payload.data }, "*");
      } else {
        window.postMessage({ type: "COR3_WS_EXPEDITION_CONFIG", data: payload.data }, "*");
      }
      return;
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "open.container") {
      if (payload.error) {
        var openErrMsg = payload.error.message || JSON.stringify(payload.error);
        console.log("[COR3 Helper] open.container failed:", openErrMsg);
        window.postMessage({
          type: "COR3_WS_CONTAINER_OPENED",
          data: null,
          error: payload.error,
          requestId: payload.requestId || null
        }, "*");
        return;
      }
      window.postMessage({
        type: "COR3_WS_CONTAINER_OPENED",
        data: payload.data
      }, "*");
      if (payload.data && payload.data.id) {
        window.postMessage({
          type: "COR3_WS_EXPEDITIONS",
          expeditions: [payload.data]
        }, "*");
      }
      return;
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "insert.archive") {
      window.postMessage({
        type: "COR3_WS_EXPEDITION_ARCHIVED",
        data: payload.data
      }, "*");
      return;
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "launch") {
      if (payload.error && payload.error.message === "Maximum 1 active expedition allowed") {
        console.log("[COR3 Helper] Expedition launch failed: Maximum 1 active expedition allowed");
        window.postMessage({
          type: "COR3_WS_EXPEDITION_LAUNCH_ERROR",
          error: payload.error.message
        }, "*");
        return;
      }
      if (payload.error && payload.error.message === "This location requires an elite mercenary") {
        console.log("[COR3 Helper] Expedition launch failed: quest location requires elite mercenary \u2014 will retry with default location");
        window.postMessage({
          type: "COR3_WS_EXPEDITION_ELITE_REQUIRED",
          error: payload.error.message
        }, "*");
        return;
      }
      if (payload.error && payload.error.message === "Mercenary is not available") {
        console.log("[COR3 Helper] Expedition launch failed: Mercenary is not available");
        window.postMessage({
          type: "COR3_WS_MERC_NOT_AVAILABLE",
          error: payload.error.message
        }, "*");
        return;
      }
      if (payload.error && payload.error.message === "insufficient-credits") {
        console.log("[COR3 Helper] Expedition launch failed: insufficient credits");
        window.postMessage({
          type: "COR3_WS_INSUFFICIENT_CREDITS",
          error: payload.error.message
        }, "*");
        return;
      }
      if (payload.error) {
        var genericErrMsg = payload.error.message || JSON.stringify(payload.error);
        var transient = isTransientBusyMessage(genericErrMsg);
        console.log("[COR3 Helper] Expedition launch failed:", genericErrMsg, "(transient:", transient + ")");
        window.postMessage({
          type: "COR3_WS_EXPEDITION_LAUNCH_ERROR",
          error: genericErrMsg,
          transient,
          requestId: payload.requestId || null
        }, "*");
        return;
      }
      window.postMessage({
        type: "COR3_WS_EXPEDITION_LAUNCHED",
        data: payload.data
      }, "*");
      window.postMessage({
        type: "COR3_WS_DECISIONS",
        decisions: []
        // Clear decisions by sending empty array
      }, "*");
      window.postMessage({
        type: "COR3_WS_EXPEDITIONS",
        expeditions: [payload.data]
      }, "*");
      return;
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "configure") {
      var pendingMerc = window.__cor3PendingMercConfigures && window.__cor3PendingMercConfigures.length > 0 ? window.__cor3PendingMercConfigures.shift() : null;
      var mercId = typeof pendingMerc==='object'&&pendingMerc?pendingMerc.mercenaryId:pendingMerc;
      window.postMessage({
        type: "COR3_WS_MERC_CONFIGURE",
        launchTicket: pendingMerc?.launchTicket||null,
        mercenaryId: mercId,
        error: payload.error || null,
        data: payload.data
      }, "*");
      return;
    }
    if (eventName === "market" && payload && payload.data) {
      let resolveMarketType = function(id) {
        if (id === "019d3ea4-85bd-7389-904d-908ba9194aa0") return "dark";
        if (id === "019da731-2db5-7d76-9447-1ea3b9b78001") return "soyuz";
        if (id === "019e4065-6ae8-760d-8724-58ab4f2cf7d7") return "usol";
        return "home";
      }, marketCacheKey = function(type) {
        return type === "dark" ? "__cor3DarkMarketCache" : type === "soyuz" ? "__cor3SoyuzMarketCache" : type === "usol" ? "__cor3UsolMarketCache" : "__cor3HomeMarketCache";
      }, marketMsgType = function(type) {
        return type === "dark" ? "COR3_WS_DARK_MARKET" : type === "soyuz" ? "COR3_WS_SOYUZ_MARKET" : type === "usol" ? "COR3_WS_USOL_MARKET" : "COR3_WS_MARKET";
      }, postMarketUpdate = function(type, cache) {
        window.postMessage({ type: marketMsgType(type), market: cache }, "*");
      };
      var mktAction = payload.event ? payload.event.action : null;
      var mkt = payload.data.market;
      if (mktAction === "get.options" && Number.isFinite(payload.data.userCredits)) {
        window.postMessage({ type: "COR3_USER_CREDITS", credits: payload.data.userCredits }, location.origin);
      }
      if (mktAction === "get.options" && mkt && mkt.marketName) {
        var marketType = resolveMarketType(mkt.id);
        var cacheKey = marketCacheKey(marketType);
        window.__cor3CurrentMarketFetch = mkt.id;
        var prevJobs = window[cacheKey] ? window[cacheKey].jobs : void 0;
        var prevRecentJobs = window[cacheKey] ? window[cacheKey].recentJobs : void 0;
        var prevNextJobsResetAt = window[cacheKey] ? window[cacheKey].nextJobsResetAt : void 0;
        var prevLots = window[cacheKey] ? window[cacheKey].lots : void 0;
        window[cacheKey] = Object.assign({}, payload.data);
        if (prevJobs !== void 0) window[cacheKey].jobs = prevJobs;
        if (prevRecentJobs !== void 0) window[cacheKey].recentJobs = prevRecentJobs;
        if (prevNextJobsResetAt !== void 0) window[cacheKey].nextJobsResetAt = prevNextJobsResetAt;
        if (prevLots !== void 0) window[cacheKey].lots = prevLots;
        postMarketUpdate(marketType, window[cacheKey]);
        if (marketType === "home") window.__cor3LastMarketId = mkt.id;
      }
      if (mktAction === "get.lots" && payload.data.lots) {
        var lotsMarketId = window.__cor3CurrentMarketFetch;
        var lotsType = resolveMarketType(lotsMarketId);
        var lotsCacheKey = marketCacheKey(lotsType);
        if (window[lotsCacheKey]) {
          window[lotsCacheKey].lots = payload.data.lots;
          postMarketUpdate(lotsType, window[lotsCacheKey]);
        }
      }
      if (mktAction === "get.jobs") {
        var jobsMarketId = window.__cor3CurrentMarketFetch;
        var jobsType = resolveMarketType(jobsMarketId);
        var jobsCacheKey = marketCacheKey(jobsType);
        if (window[jobsCacheKey]) {
          window[jobsCacheKey].jobs = payload.data.jobs || [];
          window[jobsCacheKey].recentJobs = payload.data.recentJobs || [];
          window[jobsCacheKey].nextJobsResetAt = payload.data.nextJobsResetAt || window[jobsCacheKey].nextJobsResetAt;
          postMarketUpdate(jobsType, window[jobsCacheKey]);
          window.postMessage({ type: "COR3_MARKET_FETCH_COMPLETE", marketId: jobsMarketId, marketType: jobsType }, "*");
        }
      }
      if (!mktAction && mkt && mkt.marketName) {
        var legacyType = resolveMarketType(mkt.id);
        postMarketUpdate(legacyType, payload.data);
        if (legacyType === "home") window.__cor3LastMarketId = mkt.id;
      }
    }
    if (eventName === "updater" && payload && payload.data) {
      var sv = payload.data.selectedVersion;
      if (sv) {
        console.log("[COR3 Helper] Captured patch version from updater:", sv);
        window.__cor3PatchVersion = sv;
        window.postMessage({ type: "COR3_PATCH_VERSION", version: sv }, "*");
      }
    }
    if (eventName === "network-map" && payload && payload.event) {
      if (payload.event.action === "set.endpoint") {
        var errMsg = payload.error && payload.error.message;
        var isUnreachableErr = errMsg === "no-path-to-server" || errMsg === "server-in-maintenance" || errMsg === "market-not-reachable";
        if (payload.error && isUnreachableErr) {
          console.log("[COR3 Helper] Server unreachable: " + errMsg + " (dark-pt: " + !!window.__cor3DarkMarketPathThrough + ", dark-pend: " + !!window.__cor3DarkMarketPending + ", soyuz-pt: " + !!window.__cor3SoyuzMarketPathThrough + ", soyuz-pend: " + !!window.__cor3SoyuzMarketPending + ", usol-pt: " + !!window.__cor3UsolMarketPathThrough + ", usol-pend: " + !!window.__cor3UsolMarketPending + ", devTc: " + !!window.__cor3DevTcReachActive + ")");
          if (window.__cor3DevTcReachActive || window.__cor3DarkMarketPathThrough || window.__cor3SoyuzMarketPathThrough || window.__cor3UsolMarketPathThrough) {
            window.postMessage({
              type: "COR3_WS_ENDPOINT_RESULT",
              success: false,
              error: payload.error,
              serverId: payload.error.serverId || null
            }, "*");
          } else if (window.__cor3UsolMarketPending) {
            __cor3PostUnreachable("usol", null);
          } else if (window.__cor3SoyuzMarketPending) {
            __cor3PostUnreachable("soyuz", null);
          } else if (window.__cor3DarkMarketPending) {
            __cor3PostUnreachable("dark", null);
          } else {
            window.postMessage({
              type: "COR3_WS_ENDPOINT_RESULT",
              success: false,
              error: payload.error,
              serverId: payload.error.serverId || null
            }, "*");
          }
        } else {
          var success = !payload.error;
          var epServerId = payload.error && payload.error.serverId || null;
          window.postMessage({
            type: "COR3_WS_ENDPOINT_RESULT",
            success,
            data: payload.data,
            error: payload.error || null,
            serverId: epServerId
          }, "*");
        }
      }
      if (payload.event.action === "get.map" && payload.data && payload.data.servers) {
        var servers = payload.data.servers;
        var maintenanceInfo = {};
        var serverTypeMap = {};
        for (var si = 0; si < servers.length; si++) {
          var srv = servers[si];
          maintenanceInfo[srv.id] = {
            serverName: srv.serverName,
            isInMaintenance: !!srv.isInMaintenance,
            maintenanceEndsAt: srv.maintenanceEndsAt || null,
            timeUntilMaintenance: srv.timeUntilMaintenance || null
          };
          serverTypeMap[srv.id] = {
            serverName: srv.serverName,
            serverTypeName: srv.serverTypeName || null,
            serverDefenceRate: srv.serverDefenceRate || 0
          };
        }
        window.__cor3ServerTypeMap = serverTypeMap;
        window.postMessage({ type: "COR3_WS_NETWORK_MAP", servers: maintenanceInfo }, "*");
        window.postMessage({ type: "COR3_WS_MAP_DATA", servers: payload.data.servers, connections: payload.data.connections || [] }, "*");
      }
      if (payload.event.action === "maintenance" && payload.data) {
        window.postMessage({ type: "COR3_WS_MAINTENANCE_STARTED", data: payload.data }, "*");
      }
    }
    if (eventName === "sai" && payload && payload.event) {
      var action = payload.event.action;
      if (action === "get.login.status") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_LOGIN_STATUS", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "login.with-access") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_LOGIN_RESULT", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "hack.start") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_HACK_START", data: payload.data || null, error: payload.error || null }, "*");
        return;
      }
      if (action === "update") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_UPDATE", data: payload.data }, "*");
        return;
      }
      if (action === "get.files") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_FILES", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "file.download") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_FILE_DOWNLOAD", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "get.logs") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_LOGS", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "log.delete") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_LOG_DELETE", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "log.download") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_LOG_DOWNLOAD", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "get.transit") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_TRANSIT", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "transit.add") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_TRANSIT_ADD", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "transit.remove") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_TRANSIT_REMOVE", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "file.delete") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_FILE_DELETE", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "file.upload") {
        window.postMessage({ type: "COR3_AUTOJOB_SAI_FILE_UPLOAD", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "file.search-valuable") {
        window.postMessage({ type: "COR3_VALUABLE_FILE_SEARCH", data: payload.data, error: payload.error || null }, "*");
        return;
      }
      if (action === "log.search-valuable") {
        window.postMessage({ type: "COR3_VALUABLE_LOG_SEARCH", data: payload.data, error: payload.error || null }, "*");
        return;
      }
    }
    if (eventName === "desktop" && payload && payload.event) {
      var dAction = payload.event.action;
      console.log("[COR3 Helper] Desktop event:", dAction);
      if (dAction === "open.folder") {
        window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_FOLDER", data: payload.data, error: payload.error || null }, "*");
      }
      if (dAction === "update.file" || dAction === "open.file" || dAction === "decrypt.file") {
        var fileError = payload.error || null;
        if (!fileError && payload.data && payload.data.kind === "insufficient_power") {
          fileError = { message: "insufficient_power", kind: "insufficient_power", ability: payload.data.ability, required: payload.data.required, available: payload.data.available };
        }
        window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_FILE", data: payload.data, error: fileError }, "*");
        if (dAction === "update.file") {
          window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_UPDATE_FILE", data: payload.data, error: payload.error || null }, "*");
        }
      }
      if (dAction === "get.file.analysis") {
        window.postMessage({ type: "COR3_AUTOJOB_FILE_ANALYSIS", data: payload.data, error: payload.error || null }, "*");
      }
      if (dAction === "get.options") {
        console.log("[COR3 Helper] Desktop get.options received \u2014 folders:", payload.data && payload.data.folders ? payload.data.folders.length : 0);
        if (payload.data && payload.data.folders) {
          var dlf = payload.data.folders.find(function(f) {
            return f.name === "Downloads";
          });
          if (dlf) {
            window.__cor3DownloadFolderId = dlf.id;
            console.log("[COR3 Helper] Cached Downloads folder ID:", dlf.id);
          }
        }
        window.postMessage({ type: "COR3_AUTOJOB_DESKTOP_OPTIONS", data: payload.data, error: payload.error || null }, "*");
      }
    }
    if (eventName === "minigames" && payload && payload.event && payload.event.action === "start.minigame") {
      if (payload.data && payload.data.lockExpiresAt && !payload.data.token) {
        window.postMessage({ type: "COR3_AUTOJOB_MINIGAME_LOCKED", data: payload.data }, "*");
      } else {
        window.postMessage({ type: "COR3_AUTOJOB_MINIGAME_START", data: payload.data }, "*");
        if (payload.data && payload.data.type === "EXTERNAL" && payload.data.url && payload.data.url.indexOf("ice-wall-break") !== -1) {
          window.postMessage({ type: "COR3_ICE_WALL_MINIGAME_START", data: payload.data }, "*");
        }
        if (payload.data && payload.data.type === "EXTERNAL" && payload.data.url && payload.data.url.indexOf("simple-hack") !== -1) {
          window.postMessage({ type: "COR3_SIMPLE_DECRYPT_MINIGAME_START", data: payload.data }, "*");
        }
      }
    }
    if (eventName === "profile" && payload && payload.event && payload.event.action === "receive.progress") {
      window.postMessage({ type: "COR3_AUTOJOB_PROFILE_PROGRESS", data: payload.data }, "*");
    }
    if (eventName === "profile" && payload && payload.event && payload.event.action === "receive.credits") {
      if (Number.isFinite(payload.data?.amount)) window.postMessage({ type: "COR3_USER_CREDITS_DELTA", amount: payload.data.amount }, location.origin);
      window.postMessage({ type: "COR3_AUTOJOB_PROFILE_CREDITS", data: payload.data }, "*");
    }
    if (eventName === "market" && payload && payload.event) {
      if (payload.event.action === "job.take") {
        window.postMessage({ type: "COR3_AUTOJOB_JOB_TAKEN", data: payload.data, error: payload.error || null }, "*");
      }
      if (payload.event.action === "job.complete") {
        console.log("[COR3 Helper] AutoJob: job.complete intercepted", JSON.stringify(payload.data));
        window.postMessage({ type: "COR3_AUTOJOB_JOB_COMPLETED", data: payload.data, error: payload.error || null }, "*");
      }
      if (payload.event.action === "job.can-complete") {
        window.postMessage({ type: "COR3_AUTOJOB_JOB_CAN_COMPLETE", data: payload.data, error: payload.error || null }, "*");
      }
      if (payload.event.action === "get.sellable-items") {
        window.postMessage({ type: "COR3_VALUABLE_SELLABLE_ITEMS", data: payload.data, error: payload.error || null }, "*");
      }
      if (payload.event.action === "sell.items") {
        window.postMessage({ type: "COR3_VALUABLE_SELL_RESULT", data: payload.data, error: payload.error || null }, "*");
      }
    }
    if (eventName === "expeditions" && payload && payload.event && payload.event.action === "update") {
      console.log("[COR3 Helper] Expedition update event detected - data will flow through existing handlers");
      return;
    }
    if (eventName === "expeditions" && payload && payload.data) {
      if (payload.event && payload.event.action === "get.archived") {
        window.postMessage({
          type: "COR3_WS_ARCHIVED_EXPEDITIONS",
          data: payload.data
        }, "*");
        return;
      }
      var expAction = payload.event && payload.event.action;
      if (expAction === "get.mercenaries" || expAction === "get.config" || expAction === "configure") {
        return;
      }
      const expeditions = Array.isArray(payload.data) ? payload.data : [payload.data];
      window.postMessage({
        type: "COR3_WS_EXPEDITIONS",
        expeditions
      }, "*");
      const decisionsFound = [];
      for (const expedition of expeditions) {
        if (!expedition.messages) continue;
        for (const msg of expedition.messages) {
          if (msg.decisionOptions && msg.decisionOptions !== null) {
            decisionsFound.push({
              expeditionId: expedition.id,
              mercenaryCallsign: expedition.mercenary ? expedition.mercenary.callsign : "Unknown",
              locationName: expedition.locationName || "",
              zoneName: expedition.zoneName || "",
              riskScore: expedition.riskScore || 0,
              messageId: msg.id,
              content: msg.content,
              decisionOptions: msg.decisionOptions,
              selectedOption: msg.selectedOption,
              decisionDeadline: msg.decisionDeadline,
              isResolved: msg.isResolved,
              isAutoResolved: msg.isAutoResolved || false,
              createdAt: msg.createdAt
            });
          }
        }
      }
      if (decisionsFound.length > 0) {
        window.postMessage({
          type: "COR3_WS_DECISIONS",
          decisions: decisionsFound
        }, "*");
      }
    }
  }

  // src/content-early/ws-commands.js
  window.__cor3RequestStash = function() {
    console.log("[COR3 Helper] Requesting stash data");
    enterRooms(["stash"]);
    return true;
  };
  window.__cor3SellItem = function(itemId, quantity, skipStashRefresh) {
    quantity = quantity || 1;
    console.log("[COR3 Helper] Selling item:", itemId, "qty:", quantity);
    var msg = '42["event",{"event":{"name":"stash","action":"sell.item"},"data":{"itemId":"' + itemId + '","quantity":' + quantity + "}}]";
    wsSend(msg);
    if (!skipStashRefresh) {
      setTimeout(function() {
        window.__cor3RequestStash();
      }, 1500);
    }
    return true;
  };
  window.__cor3StashMoveItem = function(itemId, location, x, y, rotated) {
    var data = {
      itemId,
      location: location || "stash",
      x: x || 0,
      y: y || 0,
      rotated: !!rotated
    };
    console.log("[COR3 Helper] Moving stash item:", data);
    wsSend('42["event",{"event":{"name":"stash","action":"move.item"},"data":' + JSON.stringify(data) + "}]");
    return true;
  };
  window.__cor3MailClaimAll = function(messageId) {
    console.log("[COR3 Helper] Mail claim.all:", messageId);
    wsSend('42["event",{"event":{"name":"mail","action":"claim.all"},"data":{"messageId":"' + messageId + '"}}]');
    return true;
  };
  window.__cor3MailClaimItem = function(attachmentId, x, y, rotated) {
    var placement = { x: x || 0, y: y || 0, rotated: !!rotated };
    console.log("[COR3 Helper] Mail claim.item:", attachmentId, placement);
    wsSend('42["event",{"event":{"name":"mail","action":"claim.item"},"data":{"attachmentId":"' + attachmentId + '","placement":' + JSON.stringify(placement) + "}}]");
    return true;
  };
  window.__cor3RequestSpecialists = function() {
    console.log("[COR3 Helper] Requesting specialists data");
    var msg = '42["event",{"event":{"name":"specialists","action":"get.state"},"data":{}}]';
    wsSend(msg);
    return true;
  };
  window.__cor3PurchaseSpecialist = function(specialistType, kind, level, priceId) {
    console.log("[COR3 Helper] Purchasing specialist service:", specialistType, kind, level, priceId);
    var msg = '42["event",{"event":{"name":"specialists","action":"purchase"},"data":{"specialistType":"' + specialistType + '","kind":"' + kind + '","level":' + level + ',"priceId":"' + priceId + '"}}]';
    wsSend(msg);
    return true;
  };
  window.__cor3RequestLoadout = function() {
    console.log("[COR3 Helper] Requesting loadout data");
    var msg = '42["event",{"event":{"name":"loadout","action":"get.options"}}]';
    wsSend(msg);
    return true;
  };
  window.__cor3EquipHardware = function(moduleConfigId) {
    console.log("[COR3 Helper] Equipping hardware:", moduleConfigId);
    var msg = '42["event",{"event":{"name":"loadout","action":"equip.hardware"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3EquipSoftware = function(moduleConfigId) {
    console.log("[COR3 Helper] Equipping software:", moduleConfigId);
    var msg = '42["event",{"event":{"name":"loadout","action":"equip.software"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3UnequipSoftware = function(moduleConfigId) {
    console.log("[COR3 Helper] Unequipping software:", moduleConfigId);
    var msg = '42["event",{"event":{"name":"loadout","action":"unequip.software"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobTake = function(marketId, jobId) {
    var msg = '42["event",{"event":{"name":"market","action":"job.take"},"data":{"marketId":"' + marketId + '","jobId":"' + jobId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobComplete = function(marketId, jobId) {
    var msg = '42["event",{"event":{"name":"market","action":"job.complete"},"data":{"marketId":"' + marketId + '","jobId":"' + jobId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobDismiss = function(marketId, jobId) {
    var msg = '42["event",{"event":{"name":"market","action":"job.dismiss"},"data":{"marketId":"' + marketId + '","jobId":"' + jobId + '"}}]';
    wsSend(msg);
  };
  window.__cor3ChatCreateMessage = function(variantId, chatId) {
    var data = JSON.stringify({ variantId, chatId });
    wsSend('42["event",{"event":{"name":"chat","action":"create.message"},"data":' + data + "}]");
    return true;
  };
  window.__cor3ChatReadMessages = function(messageIds, chatId) {
    var data = JSON.stringify({ messageIds, chatId });
    wsSend('42["event",{"event":{"name":"chat","action":"read.messages"},"data":' + data + "}]");
    return true;
  };
  window.__cor3AutoJobGetMarketOptions = function(marketId) {
    window.__cor3CurrentMarketFetch = marketId;
    var msg = '42["event",{"event":{"name":"market","action":"get.jobs"},"data":{"marketId":"' + marketId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobSetEndpoint = function(serverId) {
    var msg = '42["event",{"event":{"name":"network-map","action":"set.endpoint"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetLoginStatus = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"get.login.status"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobLoginWithAccess = function(serverId, accessGrantId) {
    var msg = '42["event",{"event":{"name":"sai","action":"login.with-access"},"data":{"serverId":"' + serverId + '","accessGrantId":"' + accessGrantId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobHackStart = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"hack.start"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetFiles = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"get.files"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobFileDownload = function(serverId, fileId) {
    var msg = '42["event",{"event":{"name":"sai","action":"file.download"},"data":{"serverId":"' + serverId + '","fileId":"' + fileId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetLogs = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"get.logs"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobLogDelete = function(serverId, seq) {
    var msg = '42["event",{"event":{"name":"sai","action":"log.delete"},"data":{"serverId":"' + serverId + '","seq":' + seq + "}}]";
    wsSend(msg);
  };
  window.__cor3AutoJobLogDownload = function(serverId, seq) {
    var msg = '42["event",{"event":{"name":"sai","action":"log.download"},"data":{"serverId":"' + serverId + '","seq":' + seq + "}}]";
    wsSend(msg);
  };
  window.__cor3AutoJobGetTransit = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"get.transit"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobTransitAdd = function(serverId, ip, description) {
    description = description || "";
    var msg = '42["event",{"event":{"name":"sai","action":"transit.add"},"data":{"serverId":"' + serverId + '","ip":"' + ip + '","description":"' + description + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobOpenFolder = function(folderId) {
    var msg = '42["event",{"event":{"name":"desktop","action":"open.folder"},"data":{"folderId":"' + folderId + '","source":"desktop"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetDesktopOptions = function() {
    var msg = '42["event",{"event":{"name":"desktop","action":"get.options"},"data":{}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobDecryptFile = function(fileId) {
    var msg = '42["event",{"event":{"name":"desktop","action":"decrypt.file"},"data":{"fileId":"' + fileId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetNetworkMap = function() {
    var msg = '42["event",{"event":{"name":"network-map","action":"get.map"},"data":{}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobFileDelete = function(serverId, fileId) {
    var msg = '42["event",{"event":{"name":"sai","action":"file.delete"},"data":{"serverId":"' + serverId + '","fileId":"' + fileId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobFileUpload = function(serverId, name, sizeMb) {
    var msg = '42["event",{"event":{"name":"sai","action":"file.upload"},"data":{"serverId":"' + serverId + '","name":"' + name + '","sizeMb":' + (sizeMb || 0) + "}}]";
    wsSend(msg);
  };
  window.__cor3AutoJobTransitRemove = function(serverId, ip) {
    var msg = '42["event",{"event":{"name":"sai","action":"transit.remove"},"data":{"serverId":"' + serverId + '","ip":"' + ip + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobGetFileAnalysis = function(fileId) {
    var msg = '42["event",{"event":{"name":"desktop","action":"get.file.analysis"},"data":{"fileId":"' + fileId + '","source":"desktop"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobRequestLoadout = function() {
    var msg = '42["event",{"event":{"name":"loadout","action":"get.options"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobEquipHardware = function(moduleConfigId) {
    var msg = '42["event",{"event":{"name":"loadout","action":"equip.hardware"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobEquipSoftware = function(moduleConfigId) {
    var msg = '42["event",{"event":{"name":"loadout","action":"equip.software"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3AutoJobUnequipSoftware = function(moduleConfigId) {
    var msg = '42["event",{"event":{"name":"loadout","action":"unequip.software"},"data":{"moduleConfigId":"' + moduleConfigId + '"}}]';
    wsSend(msg);
  };
  window.__cor3ValuableFileSearch = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"file.search-valuable"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3ValuableLogSearch = function(serverId) {
    var msg = '42["event",{"event":{"name":"sai","action":"log.search-valuable"},"data":{"serverId":"' + serverId + '"}}]';
    wsSend(msg);
  };
  window.__cor3ValuableGetSellableItems = function(marketId) {
    var msg = '42["event",{"event":{"name":"market","action":"get.sellable-items"},"data":{"marketId":"' + marketId + '"}}]';
    wsSend(msg);
  };
  window.__cor3ValuableSellItems = function(marketId, items) {
    var msg = '42["event",{"event":{"name":"market","action":"sell.items"},"data":{"marketId":"' + marketId + '","items":' + JSON.stringify(items) + "}}]";
    wsSend(msg);
  };
  window.__cor3RequestUpdater = function() {
    console.log("[COR3 Helper] Requesting updater data");
    var msg = '42["event",{"event":{"name":"updater","action":"get.patches"},"data":{}}]';
    wsSend(msg);
  };

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
  var MARKET_SELL_ORDER = [
    { name: "USOL", id: MARKET_IDS.usol, serverId: MARKET_SERVER_IDS.usol },
    { name: "SOYUZ", id: MARKET_IDS.soyuz, serverId: MARKET_SERVER_IDS.soyuz },
    { name: "D4RK", id: MARKET_IDS.dark, serverId: MARKET_SERVER_IDS.dark },
    { name: "HOME", id: MARKET_IDS.home, serverId: null }
  ];
  var MARKET_RESET_DURATIONS_MS = {
    home: 6 * 60 * 60 * 1e3,
    dark: 12 * 60 * 60 * 1e3,
    soyuz: 10 * 60 * 60 * 1e3,
    usol: 8 * 60 * 60 * 1e3
  };

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

  // src/content-early/market-requests.js
  function trackMarketRequest(marketId) {
    window.__cor3CurrentMarketFetch = marketId;
  }
  function __cor3WaitForMsg(eventType, timeoutMs) {
    return new Promise(function(resolve, reject) {
      var timer;
      function handler(evt) {
        if (evt.data && evt.data.type === eventType) {
          window.removeEventListener("message", handler);
          clearTimeout(timer);
          resolve(evt.data);
        }
      }
      window.addEventListener("message", handler);
      timer = setTimeout(function() {
        window.removeEventListener("message", handler);
        reject(new Error("Timeout waiting for " + eventType));
      }, timeoutMs || 1e4);
    });
  }
  function __cor3EnsureServerAccess(serverId, serverName) {
    return new Promise(function(resolve, reject) {
      console.log("[COR3 Helper] Path-through: checking access to " + serverName);
      var getLoginStatus = '42["event",{"event":{"name":"sai","action":"get.login.status"},"data":{"serverId":"' + serverId + '"}}]';
      wsSend(getLoginStatus);
      __cor3WaitForMsg("COR3_AUTOJOB_SAI_LOGIN_STATUS", 1e4).then(function(loginData) {
        if (loginData.data && loginData.data.activeAccesses && loginData.data.activeAccesses.length > 0) {
          console.log("[COR3 Helper] Path-through: " + serverName + " already has access");
          resolve();
          return;
        }
        console.log("[COR3 Helper] Path-through: " + serverName + " no access \u2014 hacking...");
        window.postMessage({ type: "COR3_AUTOJOB_ENABLE_DECRYPT_SOLVER" }, "*");
        var hackStart = '42["event",{"event":{"name":"sai","action":"hack.start"},"data":{"serverId":"' + serverId + '"}}]';
        wsSend(hackStart);
        __cor3WaitForMsg("COR3_AUTOJOB_SAI_HACK_START", 3e4).then(function(hackData) {
          if (hackData.error) {
            reject(new Error(serverName + " hack failed: " + (hackData.error.message || JSON.stringify(hackData.error))));
            return;
          }
          console.log("[COR3 Helper] Path-through: " + serverName + " hack started, waiting for solver...");
          __cor3WaitForMsg("COR3_AUTOJOB_SAI_UPDATE", 5e3).catch(function() {
          }).then(function() {
            var retries = 3;
            function checkAccess(attempt) {
              console.log("[COR3 Helper] Path-through: " + serverName + " checking access (attempt " + attempt + "/" + retries + ")");
              wsSend(getLoginStatus);
              __cor3WaitForMsg("COR3_AUTOJOB_SAI_LOGIN_STATUS", 5e3).then(function(data) {
                if (data.data && data.data.activeAccesses && data.data.activeAccesses.length > 0) {
                  console.log("[COR3 Helper] Path-through: " + serverName + " access confirmed");
                  resolve();
                } else if (attempt < retries) {
                  setTimeout(function() {
                    checkAccess(attempt + 1);
                  }, 3e3);
                } else {
                  reject(new Error(serverName + " no access after hack"));
                }
              }).catch(function() {
                if (attempt < retries) {
                  setTimeout(function() {
                    checkAccess(attempt + 1);
                  }, 3e3);
                } else {
                  reject(new Error(serverName + " login status timeout"));
                }
              });
            }
            setTimeout(function() {
              checkAccess(1);
            }, 1500);
          });
        }).catch(function(e) {
          reject(new Error(serverName + " hack start timeout"));
        });
      }).catch(function() {
        reject(new Error(serverName + " login status timeout"));
      });
    });
  }
  var MARKET_CONFIG = {
    dark: { serverId: DARK_SERVER_ID, marketId: DARK_MARKET_ID, flag: "__cor3DarkMarketPathThrough", unreachableMsg: "COR3_WS_DARK_MARKET_UNREACHABLE" },
    soyuz: { serverId: SOYUZ_SERVER_ID, marketId: SOYUZ_MARKET_ID, flag: "__cor3SoyuzMarketPathThrough", unreachableMsg: "COR3_WS_SOYUZ_MARKET_UNREACHABLE" },
    usol: { serverId: USOL_SERVER_ID, marketId: USOL_MARKET_ID, flag: "__cor3UsolMarketPathThrough", unreachableMsg: "COR3_WS_USOL_MARKET_UNREACHABLE" }
  };
  function __cor3FetchMapData() {
    return new Promise(function(resolve) {
      var getMap = '42["event",{"event":{"name":"network-map","action":"get.map"},"data":{}}]';
      wsSend(getMap);
      var done = false;
      function onMap(evt) {
        if (done) return;
        if (evt.data && evt.data.type === "COR3_WS_MAP_DATA" && evt.data.servers) {
          done = true;
          window.removeEventListener("message", onMap);
          clearTimeout(mapTimer);
          resolve({ servers: evt.data.servers, connections: evt.data.connections || [] });
        }
      }
      window.addEventListener("message", onMap);
      var mapTimer = setTimeout(function() {
        if (!done) {
          done = true;
          window.removeEventListener("message", onMap);
          resolve(null);
        }
      }, 1e4);
    });
  }
  function __cor3FindPathsToServer(servers, connections, targetServerId) {
    var graph = new ServerMap();
    graph.update({ servers: servers || [], connections: connections || [] });
    if (!graph.isReady() || !graph.getHomeId()) return [];
    return graph.findAllPaths(targetServerId);
  }
  function __cor3FindMaintenanceBlocker(servers, connections, targetServerId) {
    var graph = new ServerMap();
    graph.update({ servers: servers || [], connections: connections || [] });
    if (!graph.isReady() || !graph.getHomeId()) return null;
    var check = graph.checkPathMaintenance(targetServerId);
    if (!check.blocked) return null;
    return {
      blockerName: check.blockerName || "no-path",
      maintenanceEndsAt: check.endsAt || null
    };
  }
  function __cor3PostUnreachable2(marketType, serverName) {
    var cfg = MARKET_CONFIG[marketType];
    var msgType = cfg ? cfg.unreachableMsg : "COR3_WS_DARK_MARKET_UNREACHABLE";
    var targetServerId = cfg ? cfg.serverId : null;
    __cor3FetchMapData().then(function(mapData) {
      var blocker = null;
      if (mapData && targetServerId) {
        blocker = __cor3FindMaintenanceBlocker(mapData.servers, mapData.connections, targetServerId);
      }
      if (blocker) {
        window.__cor3UnreachableMarkets[marketType] = {
          blockerName: blocker.blockerName,
          maintenanceEndsAt: blocker.maintenanceEndsAt,
          detectedAt: Date.now()
        };
        console.log("[COR3 Helper] Cached unreachable " + marketType + ": " + blocker.blockerName + " maintenance until " + (blocker.maintenanceEndsAt || "unknown"));
      }
      window.postMessage({
        type: msgType,
        error: "no-path-to-server",
        blockerServerName: blocker ? blocker.blockerName : serverName || null,
        maintenanceEndsAt: blocker ? blocker.maintenanceEndsAt : null
      }, "*");
    });
  }
  window.__cor3DarkMarketPathThrough = false;
  window.__cor3SoyuzMarketPathThrough = false;
  window.__cor3UsolMarketPathThrough = false;
  function __cor3MarketPathThroughRetry(marketType) {
    var cfg = MARKET_CONFIG[marketType];
    if (!cfg) return;
    var label = marketType.toUpperCase();
    window[cfg.flag] = true;
    console.log("[COR3 Helper] Path-through: fetching network map for " + label + " dynamic pathing");
    __cor3FetchMapData().then(function(mapData) {
      if (!mapData) {
        window[cfg.flag] = false;
        console.log("[COR3 Helper] Path-through: map data timeout \u2014 aborting " + label);
        __cor3PostUnreachable2(marketType, null);
        return;
      }
      var paths = __cor3FindPathsToServer(mapData.servers, mapData.connections, cfg.serverId);
      if (paths.length === 0) {
        if (window.__cor3NetworkDiscovery && window.__cor3NetworkDiscovery.discoverIfIdle) {
          console.log("[COR3 Helper] Path-through: no known path to " + label + " \u2014 trying idle discovery");
          window.__cor3NetworkDiscovery.discoverIfIdle({
            reason: "market-no-path",
            maxDurationMs: 18e4
          }).then(function(result) {
            if (result && result.ok && result.newConnections && result.newConnections.length > 0) {
              console.log("[COR3 Helper] Path-through: discovery found new connections \u2014 retrying " + label);
              __cor3MarketPathThroughRetry(marketType);
              return;
            }
            window[cfg.flag] = false;
            console.log("[COR3 Helper] Path-through: no viable paths to " + label + " after discovery");
            __cor3PostUnreachable2(marketType, null);
          }).catch(function() {
            window[cfg.flag] = false;
            __cor3PostUnreachable2(marketType, null);
          });
          return;
        }
        window[cfg.flag] = false;
        console.log("[COR3 Helper] Path-through: no viable paths to " + label + " (all blocked by maintenance)");
        __cor3PostUnreachable2(marketType, null);
        return;
      }
      console.log("[COR3 Helper] Path-through: found " + paths.length + " viable path(s) to " + label);
      var pathIdx = 0;
      function tryNextPath() {
        if (pathIdx >= paths.length) {
          window[cfg.flag] = false;
          console.log("[COR3 Helper] Path-through: all " + paths.length + " path(s) exhausted for " + label);
          __cor3PostUnreachable2(marketType, null);
          return;
        }
        var currentPath = paths[pathIdx];
        pathIdx++;
        var intermediates = currentPath.length > 1 ? currentPath.slice(0, currentPath.length - 1) : [];
        if (intermediates.length === 0) {
          retryTargetEndpoint();
          return;
        }
        var pathNames = currentPath.map(function(s) {
          return s.name;
        }).join(" \u2192 ");
        console.log("[COR3 Helper] Path-through: trying path " + pathIdx + "/" + paths.length + ": " + pathNames);
        var stepIdx = 0;
        function nextStep() {
          if (stepIdx >= intermediates.length) {
            retryTargetEndpoint();
            return;
          }
          var server = intermediates[stepIdx];
          stepIdx++;
          console.log("[COR3 Helper] Path-through: step " + stepIdx + "/" + intermediates.length + ": setting endpoint to " + server.name);
          var setEp = '42["event",{"event":{"name":"network-map","action":"set.endpoint"},"data":{"serverId":"' + server.id + '"}}]';
          wsSend(setEp);
          var epDone = false;
          function onEndpoint(evt) {
            if (epDone) return;
            if (evt.data && evt.data.type === "COR3_WS_ENDPOINT_RESULT") {
              epDone = true;
              window.removeEventListener("message", onEndpoint);
              clearTimeout(epTimer);
              if (evt.data.success === false) {
                var errMsg = evt.data.error && evt.data.error.message ? evt.data.error.message : "unknown";
                if (errMsg === "server-in-maintenance") {
                  console.log("[COR3 Helper] Path-through: " + server.name + " in maintenance \u2014 trying next path");
                  tryNextPath();
                } else {
                  console.log("[COR3 Helper] Path-through: " + server.name + " unreachable (" + errMsg + ") \u2014 trying next path");
                  tryNextPath();
                }
                return;
              }
              __cor3EnsureServerAccess(server.id, server.name).then(function() {
                setTimeout(nextStep, 500);
              }).catch(function(e) {
                console.log("[COR3 Helper] Path-through: " + server.name + " access failed \u2014 " + e.message + " \u2014 trying next path");
                tryNextPath();
              });
            }
          }
          window.addEventListener("message", onEndpoint);
          var epTimer = setTimeout(function() {
            if (!epDone) {
              epDone = true;
              window.removeEventListener("message", onEndpoint);
              __cor3EnsureServerAccess(server.id, server.name).then(function() {
                setTimeout(nextStep, 500);
              }).catch(function() {
                tryNextPath();
              });
            }
          }, 1e4);
        }
        nextStep();
      }
      function retryTargetEndpoint() {
        window[cfg.flag] = false;
        console.log("[COR3 Helper] Path-through: all intermediates done, retrying " + label + " endpoint");
        var setEndpoint = '42["event",{"event":{"name":"network-map","action":"set.endpoint"},"data":{"serverId":"' + cfg.serverId + '"}}]';
        wsSend(setEndpoint);
        var retryDone = false;
        function onRetryResult(evt) {
          if (retryDone) return;
          if (evt.data && evt.data.type === "COR3_WS_ENDPOINT_RESULT") {
            retryDone = true;
            window.removeEventListener("message", onRetryResult);
            clearTimeout(retryTimer);
            if (evt.data.success === false) {
              var retryErr = evt.data.error && evt.data.error.message ? evt.data.error.message : "unknown";
              console.log("[COR3 Helper] Path-through: " + label + " endpoint retry failed (" + retryErr + ")");
              __cor3PostUnreachable2(marketType, null);
              return;
            }
            console.log("[COR3 Helper] Path-through: " + label + " endpoint set successfully");
            var getOptions = '42["event",{"event":{"name":"market","action":"get.options"},"data":{"marketId":"' + cfg.marketId + '"}}]';
            wsSend(getOptions);
          }
          if (evt.data && evt.data.type === cfg.unreachableMsg) {
            retryDone = true;
            window.removeEventListener("message", onRetryResult);
            clearTimeout(retryTimer);
            console.log("[COR3 Helper] Path-through: " + label + " endpoint still unreachable after path-through");
          }
        }
        window.addEventListener("message", onRetryResult);
        var retryTimer = setTimeout(function() {
          if (!retryDone) {
            retryDone = true;
            window.removeEventListener("message", onRetryResult);
          }
        }, 1e4);
      }
      tryNextPath();
    });
  }
  var stableReads = Cor3ReadRuntimeFactory.create({
    allowed:cor3AutomationAllowed,epoch:()=>window.__cor3MasterGate.snapshot().generation+":"+getMarketRefreshAbortId(),send:wsSend,
    listen:fn=>{const handler=event=>{if(event.source===window&&event.origin===location.origin&&event.data)fn(event.data);};window.addEventListener("message",handler);return ()=>window.removeEventListener("message",handler);},
    configure:(...args)=>window.__cor3RequestMercConfigure(...args),
    pickConfig:(locations,type)=>{const config=window.__cor3PickLocationConfig(locations);window[type==='usol'?'__cor3UsolExpConfigIds':'__cor3ExpConfigIds']=config;return config;},
    trackMarket:trackMarketRequest,unreachable:type=>window.__cor3IsMarketUnreachable(type),
    setPending:(type,value)=>{if(type!=='home')window['__cor3'+type[0].toUpperCase()+type.slice(1)+'MarketPending']=value;},
    notify:state=>{if(state.key==='merc:home')window.__cor3CoreMercFetchInProgress=['loading','blocked'].includes(state.status);if(state.key==='merc:usol')window.__cor3UsolMercFetchInProgress=['loading','blocked'].includes(state.status);window.postMessage({type:'COR3_READ_STATE',...state},location.origin);}
  });
  var stableMarketSpecs = {
    home:{marketType:'home',marketId:HOME_MARKET_ID},
    dark:{marketType:'dark',marketId:DARK_MARKET_ID,serverId:DARK_SERVER_ID,unreachableType:'COR3_WS_DARK_MARKET_UNREACHABLE'},
    soyuz:{marketType:'soyuz',marketId:SOYUZ_MARKET_ID,serverId:SOYUZ_SERVER_ID,unreachableType:'COR3_WS_SOYUZ_MARKET_UNREACHABLE'},
    usol:{marketType:'usol',marketId:USOL_MARKET_ID,serverId:USOL_SERVER_ID,unreachableType:'COR3_WS_USOL_MARKET_UNREACHABLE'}
  };
  window.__cor3RequestMarket = callback=>stableReads.market(stableMarketSpecs.home,callback);
  window.__cor3RequestMarketJobsOnly = callback=>stableReads.market({...stableMarketSpecs.home,jobsOnly:true},callback);
  window.__cor3RefreshMarket = window.__cor3RequestMarket;
  window.__cor3RequestDarkMarket = callback=>stableReads.market(stableMarketSpecs.dark,callback);
  window.__cor3RequestDarkMarketJobsOnly = callback=>stableReads.market({...stableMarketSpecs.dark,jobsOnly:true},callback);
  window.__cor3RefreshDarkMarket = window.__cor3RequestDarkMarket;
  window.__cor3RequestSoyuzMarket = callback=>stableReads.market(stableMarketSpecs.soyuz,callback);
  window.__cor3RequestSoyuzMarketJobsOnly = callback=>stableReads.market({...stableMarketSpecs.soyuz,jobsOnly:true},callback);
  window.__cor3RefreshSoyuzMarket = window.__cor3RequestSoyuzMarket;
  window.__cor3RequestUsolMarket = callback=>stableReads.market(stableMarketSpecs.usol,callback);
  window.__cor3RequestUsolMarketJobsOnly = callback=>stableReads.market({...stableMarketSpecs.usol,jobsOnly:true},callback);
  window.__cor3RefreshUsolMarket = window.__cor3RequestUsolMarket;
  window.__cor3RefreshAllMarketsSequential = function(callback,opts) {
    opts=opts||{};const order=(opts.order||['usol','soyuz','dark','home']).filter(x=>Object.hasOwn(stableMarketSpecs,x)),failed=[];
    const epoch=window.__cor3MasterGate.snapshot().generation,abort=getMarketRefreshAbortId();let index=0,closed=false;
    const finish=status=>{if(closed)return;closed=true;window.postMessage({type:'COR3_ALL_MARKETS_REFRESHED',status},location.origin);callback?.({status,failed});};
    const next=()=>{if(!cor3AutomationAllowed()||epoch!==window.__cor3MasterGate.snapshot().generation||abort!==getMarketRefreshAbortId()){finish('cancelled');return;}if(index>=order.length){finish(failed.length?'partial':'ok');return;}const type=order[index++];stableReads.market({...stableMarketSpecs[type],jobsOnly:!!opts.skipLots},result=>{if(result.status==='cancelled'){finish('cancelled');return;}if(result.status!=='ok')failed.push(type);next();});};
    next();return true;
  };

  // src/content-early/expeditions.js
  var DEFAULT_LOCATION_NAMES = ["Skylift Remains", "Koute Mining and Reprocessing Outpost"];
  window.__cor3PickDefaultLocation = function(locations) {
    if (!locations || locations.length === 0) return null;
    if (locations.length === 1) return locations[0];
    var def = null;
    for (var i = 0; i < locations.length; i++) {
      if (DEFAULT_LOCATION_NAMES.indexOf(locations[i].name) !== -1) {
        def = locations[i];
        break;
      }
    }
    return def || locations[0];
  };
  window.__cor3PickLocationConfig = function(locations) {
    var loc = window.__cor3PickDefaultLocation(locations);
    if (!loc) return { locationConfigId: null, zoneConfigId: null, goalId: null };
    var zone0 = loc.zones && loc.zones[0] ? loc.zones[0] : null;
    var goal0 = zone0 && zone0.goals && zone0.goals[0] ? zone0.goals[0] : null;
    return { locationConfigId: loc.id, zoneConfigId: zone0 ? zone0.id : null, goalId: goal0 ? goal0.id : null };
  };
  window.__cor3WebVersion = null;
  window.__cor3SystemVersion = null;
  window.__cor3PatchVersion = null;
  window.__cor3DownloadFolderId = null;
  window.__cor3RequestExpeditions = function() {
    console.log("[COR3 Helper] Requesting expedition data");
    var gotData = false;
    var onExpData = function(evt) {
      if (evt.data && evt.data.type === "COR3_WS_EXPEDITIONS") {
        gotData = true;
        window.removeEventListener("message", onExpData);
      }
    };
    window.addEventListener("message", onExpData);
    enterRooms(["expeditions"]).then(function() {
      setTimeout(function() {
        window.removeEventListener("message", onExpData);
        if (!gotData) {
          var msg = '42["event",{"event":{"name":"expeditions","action":"get.active"}}]';
          wsSend(msg);
        }
      }, 2e3);
    });
    return true;
  };
  window.__cor3RespondDecision = function(expeditionId, messageId, selectedOption) {
    var payload = JSON.stringify({
      expeditionId,
      messageId,
      selectedOption
    });
    var msg = '42["event",{"event":{"name":"expeditions","action":"respond.event"},"data":' + payload + "}]";
    console.log("[COR3 Helper] Sending decision response:", selectedOption);
    var sent = wsSend(msg);
    if (!sent) {
      queueRetryOp("decision:" + payload);
    }
    return sent;
  };
  window.__cor3RequestArchivedExpeditions = function() {
    console.log("[COR3 Helper] Requesting archived expeditions");
    var msg = '42["event",{"event":{"name":"expeditions","action":"get.archived"},"data":{"cursor":null,"limit":20}}]';
    wsSend(msg);
    return true;
  };
  window.__cor3RequestMercenaries = function(marketId,callback) {
    return stableReads.mercenaries({marketType:'home',marketId:marketId||HOME_MARKET_ID,mercType:'COR3_WS_MERCENARIES',configType:'COR3_WS_EXPEDITION_CONFIG'},callback);
  };
  window.__cor3RequestExpeditionConfig = function(marketId) {
    var mid = marketId || HOME_MARKET_ID;
    console.log("[COR3 Helper] Requesting expedition config for market:", mid);
    var msg = '42["event",{"event":{"name":"expeditions","action":"get.config"},"data":{"marketId":"' + mid + '"}}]';
    wsSend(msg);
    return true;
  };
  window.__cor3PendingMercConfigures = [];
  window.__cor3RequestMercConfigure = function(mercenaryId, marketId, locationConfigId, zoneConfigId, goalId, hasInsurance) {
    var mid = marketId || HOME_MARKET_ID;
    console.log("[COR3 Helper] Requesting configure for mercenary:", mercenaryId);
    window.__cor3PendingMercConfigures.push(mercenaryId);
    var data = {
      mercenaryId,
      marketId: mid,
      locationConfigId,
      zoneConfigId,
      goalId,
      hasInsurance: hasInsurance !== void 0 ? !!hasInsurance : !!window.__cor3MercHasInsurance
    };
    var msg = '42["event",{"event":{"name":"expeditions","action":"configure"},"data":' + JSON.stringify(data) + "}]";
    const sent=wsSend(msg);
    if(!sent){const index=window.__cor3PendingMercConfigures.lastIndexOf(mercenaryId);if(index>=0)window.__cor3PendingMercConfigures.splice(index,1);return false;}
    return true;
  };
  window.__cor3RequestUsolMercenaries = callback=>stableReads.mercenaries({...stableMarketSpecs.usol,mercType:'COR3_WS_USOL_MERCENARIES',configType:'COR3_WS_USOL_EXPEDITION_CONFIG'},callback);
  var expeditionLaunchPending=false,expeditionLaunchSerial=0;
  window.__cor3LaunchExpedition = function(input) {
    if(expeditionLaunchPending||!cor3AutomationAllowed())return;
    const {maxTotalCost,...configData}=input||{},launchEpoch=window.__cor3MasterGate.snapshot().generation;
    if(!configData.mercenaryId)return;
    expeditionLaunchPending=true;
    const valid=()=>cor3AutomationAllowed()&&window.__cor3MasterGate.snapshot().generation===launchEpoch;
    const refused=error=>{expeditionLaunchPending=false;window.postMessage({type:'COR3_WS_EXPEDITION_LAUNCH_ERROR',error},location.origin);};
    console.log("[COR3 Helper] Launching expedition with config:", configData);
    var marketId = configData.marketId;
    var needsEndpoint = marketId && marketId !== "019d3ea4-85bd-7389-904d-8f7c85841134";
    var serverId = null;
    if (marketId === USOL_MARKET_ID) serverId = USOL_SERVER_ID;
    function doConfigureAndLaunch() {
      if(!valid()){expeditionLaunchPending=false;return;}
      if(window.__cor3PendingMercConfigures.length){refused('EXPEDITION_CONFIGURE_PENDING');return;}
      const ticket='launch-'+(++expeditionLaunchSerial);let timer=null,finished=false;
      const cleanup=()=>{if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',configured);};
      const configured=evt=>{
        if(evt.source!==window||evt.origin!==location.origin||evt.data?.type!=='COR3_WS_MERC_CONFIGURE'||evt.data.launchTicket!==ticket||evt.data.mercenaryId!==configData.mercenaryId)return;
        cleanup();if(!valid()){expeditionLaunchPending=false;return;}
        if(evt.data.error){refused('EXPEDITION_CONFIGURE_FAILED');return;}
        const cost=window.Cor3ExpeditionCost.totalCostInfo(evt.data.data);
        if(maxTotalCost!==undefined&&!window.Cor3ExpeditionCost.withinLimit(evt.data.data,maxTotalCost)){refused(cost.explicit?'EXPEDITION_TOTAL_OVER_LIMIT':'EXPEDITION_TOTAL_UNCONFIRMED');return;}
        setTimeout(()=>{if(!valid()){expeditionLaunchPending=false;return;}
          const launchMsg='42["event",{"event":{"name":"expeditions","action":"launch"},"data":'+JSON.stringify(configData)+'}]';
          if(!wsSend(launchMsg)){refused('EXPEDITION_LAUNCH_UNCONFIRMED');return;}
          expeditionLaunchPending=false;console.log('[COR3 Helper] Expedition configured total verified:',cost.total);
        },humanDelay()+500);
      };
      window.addEventListener('message',configured);
      timer=setTimeout(()=>{cleanup();refused('EXPEDITION_CONFIGURE_UNCONFIRMED');},10000);
      window.__cor3PendingMercConfigures.push({mercenaryId:configData.mercenaryId,launchTicket:ticket});
      const configureMsg='42["event",{"event":{"name":"expeditions","action":"configure"},"data":'+JSON.stringify(configData)+'}]';
      if(!wsSend(configureMsg)){window.__cor3PendingMercConfigures.pop();cleanup();refused('EXPEDITION_CONFIGURE_UNCONFIRMED');}
    }
    if (needsEndpoint && serverId) {
      let onEpResult = function(evt) {
        if (epHandled || evt.source!==window || evt.origin!==location.origin || ((evt.data?.serverId||evt.data?.data?.serverId)&&(evt.data.serverId||evt.data.data.serverId)!==serverId)) return;
        if (evt.data && evt.data.type === "COR3_WS_ENDPOINT_RESULT") {
          epHandled = true;
          window.removeEventListener("message", onEpResult);
          clearTimeout(epTimeout);
          if (evt.data.success === false) {
            refused('EXPEDITION_ENDPOINT_UNAVAILABLE');return;
          }
          setTimeout(doConfigureAndLaunch, humanDelay());
        }
      };
      console.log("[COR3 Helper] Setting endpoint to market server before launch:", serverId);
      var setEp = '42["event",{"event":{"name":"network-map","action":"set.endpoint"},"data":{"serverId":"' + serverId + '"}}]';
      var epHandled = false;
      window.addEventListener("message", onEpResult);
      var epTimeout = setTimeout(function() {
        if (!epHandled) {
          epHandled = true;
          window.removeEventListener("message", onEpResult);
          refused('EXPEDITION_ENDPOINT_UNCONFIRMED');
        }
      }, 8e3);
      if(!valid()||!wsSend(setEp)){epHandled=true;clearTimeout(epTimeout);window.removeEventListener("message",onEpResult);refused("EXPEDITION_ENDPOINT_UNCONFIRMED");}
    } else {
      doConfigureAndLaunch();
    }
    return true;
  };
  window.__cor3OpenContainer = function(expeditionId) {
    console.log("[COR3 Helper] Opening container for expedition:", expeditionId);
    var msg = '42["event",{"event":{"name":"expeditions","action":"open.container"},"data":{"expeditionId":"' + expeditionId + '"}}]';
    wsSend(msg);
    return true;
  };

  // src/content-early/network-diagnostics.js
  var MAX_LOGS = 100;
  var MAX_SNAPSHOTS = 20;
  var state = {
    lastMap: null,
    logs: [],
    snapshots: []
  };
  function pad2(value) {
    return String(value).padStart(2, "0");
  }
  function localIsoString(date) {
    var d = date || /* @__PURE__ */ new Date();
    var offset = -d.getTimezoneOffset();
    var sign = offset >= 0 ? "+" : "-";
    var abs = Math.abs(offset);
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "T" + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds()) + sign + pad2(Math.floor(abs / 60)) + ":" + pad2(abs % 60);
  }
  function localStamp(date) {
    var d = date || /* @__PURE__ */ new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "T" + pad2(d.getHours()) + "-" + pad2(d.getMinutes()) + "-" + pad2(d.getSeconds());
  }
  function timeZoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
    } catch (e) {
      return "unknown";
    }
  }
  function nameOf(map, id) {
    if (!map || !map.servers) return String(id || "");
    for (var i = 0; i < map.servers.length; i++) {
      if (map.servers[i].id === id) return map.servers[i].serverName || id;
    }
    return String(id || "");
  }
  function connectionKey(c) {
    if (!c) return "";
    if (c.id) return String(c.id);
    var a = String(c.serverA || "");
    var b = String(c.serverB || "");
    return a < b ? a + "|" + b : b + "|" + a;
  }
  function summarize(map) {
    if (!map || !Array.isArray(map.servers)) return null;
    var connections = Array.isArray(map.connections) ? map.connections : [];
    var hidden = connections.filter(function(c) {
      return !!c.isHidden;
    });
    var maintenance = map.servers.filter(function(s) {
      return !!s.isInMaintenance;
    });
    var endpoints = map.servers.filter(function(s) {
      return !!s.isEndpoint;
    });
    return {
      serverCount: map.servers.length,
      connectionCount: connections.length,
      hiddenConnectionCount: hidden.length,
      maintenanceServers: maintenance.map(function(s) {
        return { id: s.id, name: s.serverName, endsAt: s.maintenanceEndsAt || null };
      }),
      endpoints: endpoints.map(function(s) {
        return { id: s.id, name: s.serverName };
      }),
      hiddenConnections: hidden.map(function(c) {
        return {
          id: c.id || null,
          name: nameOf(map, c.serverA) + " \u2194 " + nameOf(map, c.serverB),
          serverA: c.serverA,
          serverB: c.serverB
        };
      })
    };
  }
  function endpointKey(map) {
    if (!map || !Array.isArray(map.servers)) return "";
    return map.servers.filter(function(s) {
      return !!s.isEndpoint;
    }).map(function(s) {
      return String(s.id);
    }).sort().join(",");
  }
  function diffMaps(prev, next) {
    if (!prev || !next) return { hasChanges: false, reason: "missing-map" };
    var prevServers = {};
    var nextServers = {};
    var prevConnections = {};
    var nextConnections = {};
    (prev.servers || []).forEach(function(s) {
      prevServers[s.id] = s;
    });
    (next.servers || []).forEach(function(s) {
      nextServers[s.id] = s;
    });
    (prev.connections || []).forEach(function(c) {
      prevConnections[connectionKey(c)] = c;
    });
    (next.connections || []).forEach(function(c) {
      nextConnections[connectionKey(c)] = c;
    });
    var addedServers = (next.servers || []).filter(function(s) {
      return !prevServers[s.id];
    });
    var removedServers = (prev.servers || []).filter(function(s) {
      return !nextServers[s.id];
    });
    var addedConnections = (next.connections || []).filter(function(c) {
      return !prevConnections[connectionKey(c)];
    });
    var removedConnections = (prev.connections || []).filter(function(c) {
      return !nextConnections[connectionKey(c)];
    });
    var addedHidden = addedConnections.filter(function(c) {
      return !!c.isHidden;
    });
    var endpointChanged = endpointKey(prev) !== endpointKey(next);
    function decorateConnection(c) {
      return {
        id: c.id || null,
        serverA: c.serverA,
        serverB: c.serverB,
        name: nameOf(next, c.serverA) + " \u2194 " + nameOf(next, c.serverB),
        isHidden: !!c.isHidden
      };
    }
    var hasChanges = addedServers.length > 0 || removedServers.length > 0 || addedConnections.length > 0 || removedConnections.length > 0 || endpointChanged;
    return {
      hasChanges,
      addedServers: addedServers.map(function(s) {
        return { id: s.id, name: s.serverName, ip: s.serverIp || null };
      }),
      removedServers: removedServers.map(function(s) {
        return { id: s.id, name: s.serverName };
      }),
      addedConnections: addedConnections.map(decorateConnection),
      removedConnections: removedConnections.map(decorateConnection),
      addedHiddenConnections: addedHidden.map(decorateConnection),
      endpointsBefore: endpointKey(prev),
      endpointsAfter: endpointKey(next),
      endpointChanged
    };
  }
  function addLog(type, message, data) {
    var now = /* @__PURE__ */ new Date();
    var entry = {
      ts: now.toISOString(),
      localTs: localIsoString(now),
      type,
      message,
      data: data || null
    };
    state.logs.push(entry);
    if (state.logs.length > MAX_LOGS) state.logs.splice(0, state.logs.length - MAX_LOGS);
    console.log("[COR3 NetworkDiag] " + message, data || "");
    return entry;
  }
  function handleMapData(data) {
    if (!data || !Array.isArray(data.servers)) return;
    var map = {
      servers: data.servers,
      connections: Array.isArray(data.connections) ? data.connections : []
    };
    var summary = summarize(map);
    if (!state.lastMap) {
      state.lastMap = map;
      addLog("initial-map", "Initial network map captured", summary);
      return;
    }
    var diff = diffMaps(state.lastMap, map);
    state.lastMap = map;
    if (diff.hasChanges) {
      addLog("map-change", "Network map changed", diff);
    }
  }
  function htmlToText(html) {
    if (!html) return "";
    var div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  }
  window.addEventListener("message", function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === "COR3_WS_MAP_DATA") {
      handleMapData(event.data);
    }
    if (event.data && event.data.type === "COR3_IP_SEARCH_LOG") {
      addLog("secret-finder", htmlToText(event.data.html));
    }
    if (event.data && event.data.type === "COR3_IP_SEARCH_DONE") {
      addLog("secret-finder-done", htmlToText(event.data.html));
    }
  });
  async function snapshot(label, opts) {
    var map = await __cor3FetchMapData();
    if (!map) {
      return addLog("snapshot", "Snapshot failed: map data timeout", { label: label || null });
    }
    var now = /* @__PURE__ */ new Date();
    var entry = {
      label: label || "snapshot-" + (state.snapshots.length + 1),
      ts: now.toISOString(),
      localTs: localIsoString(now),
      summary: summarize(map),
      map: opts && opts.full === false ? null : map
    };
    state.snapshots.push(entry);
    if (state.snapshots.length > MAX_SNAPSHOTS) {
      state.snapshots.splice(0, state.snapshots.length - MAX_SNAPSHOTS);
    }
    addLog("snapshot", "Snapshot captured: " + entry.label, entry.summary);
    return entry;
  }
  function diffSnapshots(a, b) {
    var prev = typeof a === "number" ? state.snapshots[a] : null;
    var next = typeof b === "number" ? state.snapshots[b] : null;
    if (!prev || !next) {
      return { error: "snapshot index not found", count: state.snapshots.length };
    }
    return {
      from: prev.label,
      to: next.label,
      diff: diffMaps(prev.map, next.map)
    };
  }
  function dump() {
    return {
      logs: state.logs.slice(),
      snapshots: state.snapshots.map(function(s, i) {
        return { index: i, label: s.label, ts: s.ts, summary: s.summary };
      }),
      lastMapSummary: summarize(state.lastMap)
    };
  }
  function exportData() {
    var now = /* @__PURE__ */ new Date();
    return {
      generatedAt: now.toISOString(),
      generatedAtLocal: localIsoString(now),
      timeZone: timeZoneName(),
      timezoneOffsetMinutes: -now.getTimezoneOffset(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      logs: state.logs.slice(),
      snapshots: state.snapshots.map(function(s, i) {
        return {
          index: i,
          label: s.label,
          ts: s.ts,
          localTs: s.localTs,
          summary: s.summary,
          map: s.map
        };
      }),
      lastMap: state.lastMap
    };
  }
  function download(label) {
    var data = exportData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var stamp = localStamp(/* @__PURE__ */ new Date());
    var safeLabel = String(label || "network-diagnostics").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "network-diagnostics";
    var filename = "cor3-" + safeLabel + "-" + stamp + ".json";
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 5e3);
    console.log("[COR3 NetworkDiag] downloaded " + filename + " (" + data.logs.length + " log entries, " + data.snapshots.length + " snapshots)");
    return {
      filename,
      bytes: blob.size,
      logs: data.logs.length,
      snapshots: data.snapshots.length
    };
  }
  function help() {
    console.log([
      "[COR3 NetworkDiag]",
      '  __cor3NetworkDebug.snapshot("label")  capture get.map',
      "  __cor3NetworkDebug.diff(0, 1)         diff two snapshots",
      '  __cor3NetworkDebug.download("label")  download full JSON log + maps',
      "  __cor3NetworkDebug.dump()             small summary only",
      "  __cor3NetworkDebug.clear()            clear logs and snapshots",
      "  __cor3NetworkDebug.help()             show this help",
      "",
      "The debugger only calls get.map; it does not change endpoints."
    ].join("\n"));
  }
  window.__cor3NetworkDebug = {
    snapshot,
    diff: diffSnapshots,
    download,
    exportData,
    dump,
    clear: function() {
      state.logs.length = 0;
      state.snapshots.length = 0;
      state.lastMap = null;
      console.log("[COR3 NetworkDiag] cleared");
    },
    summarize: function() {
      return summarize(state.lastMap);
    },
    help
  };
  console.log("[COR3 NetworkDiag] ready \u2014 run __cor3NetworkDebug.help()");

  // src/content-early/network-discovery.js
  var DELAY_MS = 2500;
  var LOCK_TTL_MS = 10 * 60 * 1e3;
  var DEFAULT_MAX_MS = 5 * 60 * 1e3;
  var PROGRESS_KEY = "cor3NetworkDiscoveryProgress";
  var LOCK_KEY = "cor3NetworkDiscoveryLock";
  var LAST_RESULT_KEY = "cor3NetworkDiscoveryLastResult";
  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
    }
  }
  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
    }
  }
  function fingerprint(map) {
    return (map && map.servers ? map.servers : []).map(function(s) {
      return s.serverIp || s.id;
    }).filter(Boolean).sort().join("|");
  }
  function connectionKey2(c) {
    if (!c) return "";
    if (c.id) return String(c.id);
    var a = String(c.serverA || "");
    var b = String(c.serverB || "");
    return a < b ? a + "|" + b : b + "|" + a;
  }
  function postLog(html) {
    window.postMessage({ type: "COR3_IP_SEARCH_LOG", html }, "*");
  }
  function postDone(html) {
    window.postMessage({ type: "COR3_IP_SEARCH_DONE", html }, "*");
  }
  function getLock() {
    var lock = readJson(LOCK_KEY);
    if (!lock) return null;
    if (!lock.expiresAt || lock.expiresAt <= Date.now()) {
      removeKey(LOCK_KEY);
      return null;
    }
    return lock;
  }
  function acquireLock(owner) {
    var lock = getLock();
    if (lock) return false;
    writeJson(LOCK_KEY, {
      owner,
      startedAt: Date.now(),
      expiresAt: Date.now() + LOCK_TTL_MS
    });
    return true;
  }
  function releaseLock(owner) {
    var lock = getLock();
    if (lock && lock.owner === owner) removeKey(LOCK_KEY);
  }
  function sleep(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }
  function connectIp(ip) {
    wsSend('42["event",{"event":{"name":"network-map","action":"connect.ip"},"data":{"ipAddress":"' + ip + '"}}]');
  }
  function summarizeDiff(before, after) {
    var beforeConnections = {};
    var afterConnections = {};
    var beforeServers = {};
    var afterServers = {};
    (before.connections || []).forEach(function(c) {
      beforeConnections[connectionKey2(c)] = c;
    });
    (after.connections || []).forEach(function(c) {
      afterConnections[connectionKey2(c)] = c;
    });
    (before.servers || []).forEach(function(s) {
      beforeServers[s.id] = s;
    });
    (after.servers || []).forEach(function(s) {
      afterServers[s.id] = s;
    });
    return {
      newConnections: (after.connections || []).filter(function(c) {
        return !beforeConnections[connectionKey2(c)];
      }),
      removedConnections: (before.connections || []).filter(function(c) {
        return !afterConnections[connectionKey2(c)];
      }),
      newServers: (after.servers || []).filter(function(s) {
        return !beforeServers[s.id];
      }),
      removedServers: (before.servers || []).filter(function(s) {
        return !afterServers[s.id];
      })
    };
  }
  function diffHtml(diff, names) {
    var parts = [];
    if (diff.newConnections.length > 0) {
      parts.push('<div style="color:var(--accent-green);font-weight:bold;">Found ' + diff.newConnections.length + " new connection(s):</div>");
      diff.newConnections.forEach(function(c) {
        var a = names[c.serverA] || c.serverA;
        var b = names[c.serverB] || c.serverB;
        parts.push('<div style="padding:1px 0;margin-left:8px;color:var(--accent-cyan);">' + a + " \u2194 " + b + (c.isHidden ? ' <span style="color:var(--accent-orange);">(hidden)</span>' : "") + "</div>");
      });
    }
    if (diff.newServers.length > 0) {
      parts.push('<div style="color:var(--accent-green);font-weight:bold;margin-top:4px;">Found ' + diff.newServers.length + " new server(s):</div>");
      diff.newServers.forEach(function(s) {
        parts.push('<div style="padding:1px 0;margin-left:8px;color:var(--accent-cyan);">\u{1F5A5}\uFE0F ' + (s.serverName || s.id) + "</div>");
      });
    }
    if (parts.length === 0) {
      parts.push(`<span style="color:var(--accent-orange);">Couldn't find anything new...</span>`);
    }
    return parts.join("");
  }
  async function discoverHiddenConnections(options) {
    if (!cor3AutomationAllowed()) return { ok: false, reason: "master-paused" };
    var opts = options || {};
    var owner = "discovery-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    if (!acquireLock(owner)) {
      postLog('<span style="color:var(--accent-orange);">Another hidden-connection scan is already running.</span>');
      return { skipped: true, reason: "locked" };
    }
    var startAt = Date.now();
    var maxDurationMs = opts.maxDurationMs || DEFAULT_MAX_MS;
    try {
      postLog('<span style="color:var(--accent-cyan);">Fetching network map...</span>');
      var before = await __cor3FetchMapData();
      if (!before || !before.servers || !before.connections) {
        postDone('<span style="color:var(--accent-red);">Failed to fetch initial map data</span>');
        return { ok: false, reason: "initial-map-failed" };
      }
      var fp = fingerprint(before);
      var progress = readJson(PROGRESS_KEY);
      if (!progress || progress.fingerprint !== fp || opts.restart) {
        progress = { fingerprint: fp, scannedIps: [], startedAt: Date.now() };
      }
      var ips = before.servers.map(function(s) {
        return s.serverIp;
      }).filter(Boolean);
      var scanned = {};
      (progress.scannedIps || []).forEach(function(ip2) {
        scanned[ip2] = true;
      });
      var remaining = ips.filter(function(ip2) {
        return !scanned[ip2];
      });
      if (opts.maxIps && opts.maxIps > 0) remaining = remaining.slice(0, opts.maxIps);
      postLog('<span style="color:var(--accent-cyan);">Found ' + ips.length + " IPs; " + remaining.length + " remaining in this run.</span>");
      for (var i = 0; i < remaining.length; i++) {
        if (!cor3AutomationAllowed() || (opts.signal && opts.signal.aborted)) {
          writeJson(PROGRESS_KEY, progress);
          postLog('<span style="color:var(--accent-orange);">Scan paused \u2014 progress saved.</span>');
          return { ok: false, partial: true, reason: "aborted" };
        }
        if (Date.now() - startAt > maxDurationMs) {
          writeJson(PROGRESS_KEY, progress);
          postLog('<span style="color:var(--accent-orange);">Scan time limit reached \u2014 progress saved. Run again to resume.</span>');
          return { ok: false, partial: true, reason: "timeout", scanned: progress.scannedIps.length, total: ips.length };
        }
        var ip = remaining[i];
        postLog('<span style="color:var(--accent-cyan);">Connecting ' + (scannedCount(progress) + 1) + "/" + ips.length + ": " + ip + "</span>");
        connectIp(ip);
        progress.scannedIps.push(ip);
        writeJson(PROGRESS_KEY, progress);
        await sleep(DELAY_MS);
      }
      postLog('<span style="color:var(--accent-cyan);">Scanning complete. Fetching updated map...</span>');
      await sleep(3e3);
      var after = await __cor3FetchMapData();
      if (!after || !after.connections) {
        postDone('<span style="color:var(--accent-red);">Failed to fetch updated map data</span>');
        return { ok: false, reason: "final-map-failed" };
      }
      var names = {};
      (after.servers || []).forEach(function(s) {
        names[s.id] = s.serverName;
      });
      var diff = summarizeDiff(before, after);
      var html = diffHtml(diff, names);
      writeJson(LAST_RESULT_KEY, {
        ts: Date.now(),
        scanned: ips.length,
        newConnections: diff.newConnections.length,
        newServers: diff.newServers.length
      });
      removeKey(PROGRESS_KEY);
      postDone(html + '<div style="margin-top:4px;color:var(--text-dim);">Scanned ' + ips.length + " IPs</div>");
      return {
        ok: true,
        scanned: ips.length,
        newConnections: diff.newConnections,
        newServers: diff.newServers
      };
    } catch (e) {
      postDone('<span style="color:var(--accent-red);">Discovery error: ' + (e && e.message ? e.message : e) + "</span>");
      return { ok: false, reason: "error", error: e && e.message ? e.message : String(e) };
    } finally {
      releaseLock(owner);
    }
  }
  function scannedCount(progress) {
    return (progress.scannedIps || []).length;
  }
  window.__cor3AutomationStatus = window.__cor3AutomationStatus || { active: null, queued: [] };
  function isAutomationBusy() {
    var status = window.__cor3AutomationStatus;
    return !!(status && (status.active || status.queued && status.queued.length > 0));
  }
  async function discoverIfIdle(options) {
    if (isAutomationBusy()) {
      postLog('<span style="color:var(--accent-orange);">Auto discovery skipped: another automation is changing the endpoint.</span>');
      return { skipped: true, reason: "automation-busy" };
    }
    return discoverHiddenConnections(options);
  }
  function refreshMapAfterAutomation(reason) {
    setTimeout(function() {
      if (isAutomationBusy()) return;
      __cor3FetchMapData().then(function(map) {
        if (map) console.log("[COR3 NetworkDiscovery] map refreshed after " + reason);
      }).catch(function() {
      });
    }, 2e3);
  }
  window.addEventListener("message", function(event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === "COR3_AUTOMATION_STATUS") {
      window.__cor3AutomationStatus = event.data.status || { active: null, queued: [] };
    }
    if (event.data && event.data.type === "COR3_AUTOJOB_DONE") {
      refreshMapAfterAutomation("Auto Job");
    }
    if (event.data && event.data.type === "COR3_VALUABLE_DONE") {
      refreshMapAfterAutomation("Valuable Seller");
    }
  });
  window.__cor3NetworkDiscovery = {
    discover: discoverHiddenConnections,
    discoverIfIdle,
    isAutomationBusy,
    getProgress: function() {
      return readJson(PROGRESS_KEY);
    },
    getLastResult: function() {
      return readJson(LAST_RESULT_KEY);
    },
    clearProgress: function() {
      removeKey(PROGRESS_KEY);
    }
  };
  console.log("[COR3 NetworkDiscovery] ready");

  // src/content-early/initial-fetch.js
  var initialFetchDone = false;
  var initialFetchRun = null;
  window.__cor3ResetInitialFetch = function() {
    initialFetchDone = false;
    if (initialFetchRun) initialFetchRun.finish('cancelled');
    stableReads.cancelAll();
  };
  window.__cor3InitialMercsFetchDone = false;
  window.__cor3InitialFetch = function() {
    if(cor3AutomationAllowed()&&!initialFetchDone)window.postMessage({type:'COR3_INITIAL_FETCH_REQUEST'},location.origin);
  };
  window.__cor3InitialFetchExclusive = function(networkTicket) {
    if (!cor3AutomationAllowed()) return;
    if (initialFetchRun) { initialFetchRun.tickets.add(networkTicket); return; }
    if (initialFetchDone) { window.postMessage({type:'COR3_NETWORK_DONE',networkTicket},location.origin);return; }
    const epoch = window.__cor3MasterGate.snapshot().generation, abort = getMarketRefreshAbortId(), timers = new Set(), tickets = new Set([networkTicket]), failed=[];
    let closed=false,index=0;
    const valid=()=>!closed&&cor3AutomationAllowed()&&epoch===window.__cor3MasterGate.snapshot().generation&&abort===getMarketRefreshAbortId();
    const finish=status=>{
      if(closed)return;closed=true;for(const timer of timers)clearTimeout(timer);timers.clear();
      if(initialFetchRun?.finish===finish)initialFetchRun=null;
      window.__cor3InitialFetchInProgress=false;
      if(status!=='cancelled'){initialFetchDone=true;window.postMessage({type:'COR3_INITIAL_FETCH_DONE',status,failed:[...failed]},location.origin);}
      for(const ticket of tickets)window.postMessage({type:'COR3_NETWORK_DONE',networkTicket:ticket,status},location.origin);
    };
    const later=(fn,ms)=>{let timer;timer=setTimeout(()=>{timers.delete(timer);if(!valid()){finish('cancelled');return;}fn();},ms);timers.add(timer);};
    initialFetchRun={finish,tickets};window.__cor3InitialFetchInProgress=true;window.__cor3InitialMercsFetchDone=false;
    const steps=[
      ['home',cb=>window.__cor3RequestMarket(cb)],['dark',cb=>window.__cor3RequestDarkMarket(cb)],
      ['soyuz',cb=>window.__cor3RequestSoyuzMarket(cb)],['usol',cb=>window.__cor3RequestUsolMarket(cb)],
      ['core-merc',cb=>window.__cor3RequestMercenaries(null,cb)],['usol-merc',cb=>window.__cor3RequestUsolMercenaries(cb)]
    ];
    const next=()=>{
      if(!valid()){finish('cancelled');return;}
      if(index>=steps.length){
        window.__cor3RequestArchivedExpeditions();window.__cor3RequestStash();window.__cor3RequestSpecialists();window.__cor3RequestLoadout();window.__cor3RequestUpdater();
        later(()=>finish(failed.length?'partial':'ok'),3500);return;
      }
      const [name,start]=steps[index++];let answered=false;
      try{start(result=>{
        if(answered)return;answered=true;
        if(!valid()||result?.status==='cancelled'){finish('cancelled');return;}
        if(result&&result.status!=='ok')failed.push(name);
        if(name==='core-merc'&&(!result||result.status==='ok'))window.postMessage({type:'COR3_CORE_MERCS_DONE'},location.origin);
        if(name==='usol-merc'&&(!result||result.status==='ok')){window.__cor3InitialMercsFetchDone=true;window.postMessage({type:'COR3_USOL_MERCS_DONE'},location.origin);}
        later(next,250);
      });}catch{window.postMessage({type:'COR3_TRANSPORT_STATE',code:'SEND_UNCONFIRMED'},location.origin);}
    };
    window.postMessage({type:'COR3_FETCH_DAILY_OPS'},location.origin);next();
  };

  window.__cor3KeepAlive = function() {
    console.log("[COR3 Helper] Keeping service worker alive!");
  };

  function getServerTypeName(serverId) {
    var map = typeof window !== "undefined" && window.__cor3ServerTypeMap;
    if (map && map[serverId]) return map[serverId].serverTypeName;
    return null;
  }

  // src/content-early/message-listener.js
  function installSocketHealthCheck() {
    setInterval(function() {
      const now = Date.now();
      var activeSocket = getActiveSocket();
      for (var i = trackedSockets.length - 1; i >= 0; i--) {
        var ws = trackedSockets[i];
        if (ws.readyState === OrigWebSocket.CLOSED || ws.readyState === OrigWebSocket.CLOSING) {
          console.log("[COR3 Helper] Cleaning up dead socket");
          trackedSockets.splice(i, 1);
          socketLastActivity.delete(ws);
          if (activeSocket === ws) setActiveSocket(null);
        }
      }
      activeSocket = getActiveSocket();
      if (activeSocket) {
        var lastActivity = socketLastActivity.get(activeSocket) || 0;
        if (now - lastActivity > 9e4) {
          console.log("[COR3 Helper] Active socket stale (no messages for 90s) \u2014 may need reconnect");
        }
      }
    }, 6e4);
  }
  function installMessageListener() {
    window.addEventListener("message", function(event) {
      if (event.source !== window) return;
      if (event.origin === location.origin && event.data?.type === "COR3_SESSION_REPLAY_REQUEST") {
        replayCapturedSession();
        return;
      }
      if(event.origin===location.origin&&event.data?.type==='COR3_INITIAL_FETCH_RUN'){
        window.__cor3InitialFetchExclusive(event.data.networkTicket);return;
      }
      if (event.data && event.data.type === "COR3_REQUEST_EXPEDITIONS") {
        window.__cor3RequestExpeditions();
      }
      if (event.data && event.data.type === "COR3_REQUEST_NETWORK_MAP") {
        window.__cor3AutoJobGetNetworkMap();
      }
      if (event.data && event.data.type === "COR3_DEV_TC_TEST_REACHABILITY") {
        (function(serverId) {
          var logLines = [];
          function addLog2(msg2, color) {
            logLines.push({ msg: msg2, color: color || null });
            window.postMessage({ type: "COR3_DEV_TC_REACH_PROGRESS", log: logLines.slice() }, "*");
          }
          function sendResult(reachable, reason) {
            window.__cor3DevTcReachActive = false;
            window.postMessage({ type: "COR3_DEV_TC_REACH_RESULT", reachable, reason: reason || null, log: logLines }, "*");
          }
          window.__cor3DevTcReachActive = true;
          var serverName = serverId;
          if (window.__cor3ServerTypeMap && window.__cor3ServerTypeMap[serverId]) {
            serverName = window.__cor3ServerTypeMap[serverId].serverName || serverId;
          }
          function sendSetEndpoint(targetId) {
            return new Promise(function(resolve) {
              var handled = false;
              function onEpResult(evt) {
                if (handled) return;
                if (evt.data && evt.data.type === "COR3_WS_ENDPOINT_RESULT") {
                  handled = true;
                  clearTimeout(epTimer);
                  window.removeEventListener("message", onEpResult);
                  if (evt.data.success === false && evt.data.error) {
                    var errMsg = evt.data.error.message || "";
                    if (errMsg === "no-path-to-server") {
                      resolve({ ok: false, noPath: true, errorMsg: errMsg });
                    } else if (errMsg === "server-in-maintenance") {
                      resolve({ ok: false, maintenance: true, errorMsg: errMsg });
                    } else {
                      resolve({ ok: false, errorMsg: errMsg || JSON.stringify(evt.data.error) });
                    }
                  } else {
                    resolve({ ok: true });
                  }
                }
              }
              window.addEventListener("message", onEpResult);
              var epTimer = setTimeout(function() {
                if (!handled) {
                  handled = true;
                  window.removeEventListener("message", onEpResult);
                  resolve({ ok: true, timeout: true });
                }
              }, 1e4);
              window.__cor3AutoJobSetEndpoint(targetId);
            });
          }
          function waitForDevTcMsg(eventType, timeoutMs, predicate) {
            return new Promise(function(resolve, reject) {
              var done = false;
              var timer = setTimeout(function() {
                if (!done) {
                  done = true;
                  window.removeEventListener("message", handler);
                  reject(new Error("Timeout waiting for " + eventType));
                }
              }, timeoutMs || 1e4);
              function handler(evt) {
                if (done) return;
                if (evt.data && evt.data.type === eventType && (!predicate || predicate(evt.data))) {
                  done = true;
                  clearTimeout(timer);
                  window.removeEventListener("message", handler);
                  resolve(evt.data);
                }
              }
              window.addEventListener("message", handler);
            });
          }
          var devTcRequiredPowers = new Map();
          function ensureDevTcHackLoadout(targetId, targetName) {
            var epoch = window.__cor3MasterGate.snapshot().generation;
            var valid = function() { return cor3AutomationAllowed() && window.__cor3MasterGate.snapshot().generation === epoch; };
            return new Promise(function(resolve) {
              var serverTypeName = getServerTypeName(targetId);
              if (!serverTypeName) {
                addLog2("\u26A1 Loadout: cannot determine server type \u2014 skipping loadout");
                resolve(true);
                return;
              }
              addLog2("\u26A1 Loadout: fetching data for " + serverTypeName + "...");
              var waiting = waitForDevTcMsg("COR3_AUTOJOB_LOADOUT", 1e4, function(r) { return r.action === "get.options"; });
              window.__cor3AutoJobRequestLoadout();
              waiting.then(function(resp) {
                if (!valid()) { resolve(false); return; }
                if (!resp || !resp.data) {
                  addLog2("\u26A1 Loadout: no data \u2014 proceeding without loadout");
                  resolve(true);
                  return;
                }
                var loadout = resp.data;
                var allSw = loadout.ownedSoftware || [];
                var equippedSwIds = (loadout.equippedSoftware || []).map(function(s) {
                  return s.id;
                });
                var hackCandidates = allSw.flatMap(function(sw) {
                  return window.Cor3LoadoutAlgorithms.abilityList(sw).filter(function(spec) {
                    return spec.type === "HACK" && (!spec.serverTypes?.length || spec.serverTypes.some(function(t) { return window.Cor3LoadoutAlgorithms.matchesTargetValue(t, serverTypeName); }));
                  }).map(function(spec) { return {sw:sw,spec:spec}; });
                });
                addLog2("\u26A1 Loadout: found " + hackCandidates.length + " hack candidate(s) for " + serverTypeName + (hackCandidates.length > 0 ? " \u2014 best: " + hackCandidates[0].sw.name : ""));
                if (hackCandidates.length === 0) {
                  addLog2("\u26A1 Loadout: no hack software for " + serverTypeName + " \u2014 proceeding anyway");
                  resolve(true);
                  return;
                }
                var plan = window.Cor3LoadoutAlgorithms.plan(loadout, hackCandidates, "HACK", serverTypeName, devTcRequiredPowers.get(targetId) || 0);
                if (!plan || !plan.sufficient) { resolve(false); return; }
                var targetSwIds = [plan.softwareId], targetHw = plan.hardware;
                addLog2("Loadout: selected " + plan.software.name + " (power " + plan.power + ")");
                applyDevTcLoadout(loadout, targetHw, targetSwIds).then(function() {
                  resolve(true);
                }).catch(function() { resolve(false); });
              }).catch(function() {
                addLog2("\u26A1 Loadout: fetch timed out \u2014 proceeding without loadout");
                resolve(true);
              });
            });
          }
          function applyDevTcLoadout(loadout, targetHw, targetSwIds) {
            var epoch = window.__cor3MasterGate.snapshot().generation;
            var allowed = function() { return cor3AutomationAllowed() && window.__cor3MasterGate.snapshot().generation === epoch; };
            var read = async function() {
              if (!allowed()) throw Error("LOADOUT_SCOPE_REVOKED");
              var waiting = waitForDevTcMsg("COR3_AUTOJOB_LOADOUT", 10000, function(r) { return r.action === "get.options"; });
              window.__cor3AutoJobRequestLoadout();
              var result = await waiting; return result.error ? null : result.data;
            };
            return window.Cor3LoadoutAlgorithms.executeOwned(targetHw, targetSwIds, {read:read,allowed:allowed,
              sleep:function(ms) { return new Promise(function(r) { setTimeout(r,ms); }); },
              command:async function(step) {
                if (!allowed()) throw Error("LOADOUT_SCOPE_REVOKED");
                var waiting = waitForDevTcMsg("COR3_AUTOJOB_LOADOUT", 8000, function(r) { return r.action === step.cmd.slice(8); });
                if (step.cmd === "loadout.unequip.software") window.__cor3AutoJobUnequipSoftware(step.id);
                else if (step.cmd === "loadout.equip.hardware") window.__cor3AutoJobEquipHardware(step.id);
                else window.__cor3AutoJobEquipSoftware(step.id);
                return await waiting;
              }
            });
          }
          function loginToServer(targetId, targetName) {
            return new Promise(function(resolve) {
              addLog2("\u26A1 Checking login status for " + targetName);
              var loginHandled = false;
              function onLoginStatus(evt) {
                if (loginHandled) return;
                if (evt.data && evt.data.type === "COR3_AUTOJOB_SAI_LOGIN_STATUS") {
                  loginHandled = true;
                  clearTimeout(loginTimer);
                  window.removeEventListener("message", onLoginStatus);
                  if (evt.data.error) {
                    resolve({ ok: false, error: "Login status error: " + (evt.data.error.message || JSON.stringify(evt.data.error)) });
                    return;
                  }
                  var data = evt.data.data;
                  if (Number.isFinite(Number(data?.serverDefenceRate))) devTcRequiredPowers.set(targetId, Number(data.serverDefenceRate));
                  if (data && data.activeAccesses && data.activeAccesses.length > 0) {
                    let onLoginResult = function(evt2) {
                      if (loginResultHandled) return;
                      if (evt2.data && evt2.data.type === "COR3_AUTOJOB_SAI_LOGIN_RESULT") {
                        loginResultHandled = true;
                        clearTimeout(loginResultTimer);
                        window.removeEventListener("message", onLoginResult);
                        if (evt2.data.error || !(evt2.data.data && evt2.data.data.success)) {
                          resolve({ ok: false, error: "Login with access failed on " + targetName });
                        } else {
                          addLog2("\u26A1 Logged in to " + targetName + " (" + accessType + ")");
                          resolve({ ok: true });
                        }
                      }
                    };
                    var access = data.activeAccesses[0];
                    var accessType = access.accessType || access.type || "unknown";
                    addLog2("\u26A1 Using existing " + accessType + " access on " + targetName);
                    window.__cor3AutoJobLoginWithAccess(targetId, access.id);
                    var loginResultHandled = false;
                    window.addEventListener("message", onLoginResult);
                    var loginResultTimer = setTimeout(function() {
                      if (!loginResultHandled) {
                        loginResultHandled = true;
                        window.removeEventListener("message", onLoginResult);
                        resolve({ ok: false, error: "Login with access timed out on " + targetName });
                      }
                    }, 1e4);
                  } else {
                    addLog2("\u26A1 No active access on " + targetName + " \u2014 equipping hack loadout");
                    ensureDevTcHackLoadout(targetId, targetName).then(function(ready) {
                      if (!ready) { resolve({ok:false,error:"LOADOUT_UNCONFIRMED"}); return; }
                      addLog2("\u26A1 Starting hack on " + targetName);
                      window.postMessage({ type: "COR3_AUTOJOB_ENABLE_DECRYPT_SOLVER" }, "*");
                      window.postMessage({ type: "COR3_AUTOJOB_ENABLE_ICE_WALL_SOLVER" }, "*");
                      window.postMessage({ type: "COR3_AUTOJOB_ENABLE_SIMPLE_DECRYPT_SOLVER" }, "*");
                      setTimeout(function() {
                        startHackWithRetry(targetId, targetName, resolve, 0);
                      }, 300);
                    });
                  }
                }
              }
              window.addEventListener("message", onLoginStatus);
              var loginTimer = setTimeout(function() {
                if (!loginHandled) {
                  loginHandled = true;
                  window.removeEventListener("message", onLoginStatus);
                  resolve({ ok: false, error: "Login status timed out on " + targetName });
                }
              }, 1e4);
              window.__cor3AutoJobGetLoginStatus(targetId);
            });
          }
          function startHackWithRetry(targetId, targetName, resolve, attempt) {
            var MAX_HACK_ATTEMPTS = 3;
            window.__cor3AutoJobHackStart(targetId);
            var hackHandled = false;
            function onHackEvent(evt3) {
              if (hackHandled) return;
              if (evt3.data && evt3.data.type === "COR3_AUTOJOB_SAI_HACK_START") {
                hackHandled = true;
                clearTimeout(hackTimer);
                window.removeEventListener("message", onHackEvent);
                if (evt3.data.error) {
                  var errMsg = evt3.data.error.message || JSON.stringify(evt3.data.error);
                  if ((errMsg.indexOf("sai-no-hack-software") >= 0 || errMsg.indexOf("sai-hack-impossible") >= 0) && attempt < MAX_HACK_ATTEMPTS) {
                    addLog2("\u26A1 Hack error: " + errMsg + " \u2014 retrying with loadout swap (attempt " + (attempt + 1) + "/" + MAX_HACK_ATTEMPTS + ")");
                    ensureDevTcHackLoadout(targetId, targetName).then(function(ready) {
                      if (!ready) { resolve({ok:false,error:"LOADOUT_UNCONFIRMED"}); return; }
                      setTimeout(function() {
                        startHackWithRetry(targetId, targetName, resolve, attempt + 1);
                      }, 1e3);
                    });
                    return;
                  }
                  resolve({ ok: false, error: "Hack error on " + targetName + ": " + errMsg });
                  return;
                }
                if (evt3.data.data && evt3.data.data.autoHacked) {
                  addLog2("\u26A1 Auto-hacked " + targetName + " (no minigame)");
                  pollAccessAfterHack(targetId, targetName, resolve);
                } else {
                  addLog2("\u26A1 Hack minigame started on " + targetName + " \u2014 waiting for solver...");
                  waitForHackComplete(targetId, targetName, resolve);
                }
              }
              if (evt3.data && evt3.data.type === "COR3_AUTOJOB_MINIGAME_START") {
                hackHandled = true;
                clearTimeout(hackTimer);
                window.removeEventListener("message", onHackEvent);
                addLog2("\u26A1 Hack minigame started on " + targetName + " \u2014 waiting for solver...");
                waitForHackComplete(targetId, targetName, resolve);
              }
              if (evt3.data && evt3.data.type === "COR3_AUTOJOB_MINIGAME_LOCKED") {
                hackHandled = true;
                clearTimeout(hackTimer);
                window.removeEventListener("message", onHackEvent);
                resolve({ ok: false, error: "Hack minigame locked on " + targetName });
              }
            }
            window.addEventListener("message", onHackEvent);
            var hackTimer = setTimeout(function() {
              if (!hackHandled) {
                hackHandled = true;
                window.removeEventListener("message", onHackEvent);
                resolve({ ok: false, error: "Hack start timed out on " + targetName });
              }
            }, 3e4);
          }
          function waitForHackComplete(targetId, targetName, resolve) {
            var saiHandled = false;
            function onSaiUpdate(evt) {
              if (saiHandled) return;
              if (evt.data && evt.data.type === "COR3_AUTOJOB_SAI_UPDATE") {
                saiHandled = true;
                clearTimeout(saiTimer);
                window.removeEventListener("message", onSaiUpdate);
                addLog2("\u26A1 Hack completed on " + targetName);
                pollAccessAfterHack(targetId, targetName, resolve);
              }
            }
            window.addEventListener("message", onSaiUpdate);
            var saiTimer = setTimeout(function() {
              if (!saiHandled) {
                saiHandled = true;
                window.removeEventListener("message", onSaiUpdate);
                addLog2("\u26A1 Hack solver timeout on " + targetName + " \u2014 checking access anyway");
                pollAccessAfterHack(targetId, targetName, resolve);
              }
            }, 12e4);
          }
          function pollAccessAfterHack(targetId, targetName, resolve) {
            var pollCount = 0;
            var MAX_POLLS = 5;
            function doPoll() {
              pollCount++;
              var pollHandled = false;
              function onPollStatus(evt) {
                if (pollHandled) return;
                if (evt.data && evt.data.type === "COR3_AUTOJOB_SAI_LOGIN_STATUS") {
                  pollHandled = true;
                  clearTimeout(pollTimer);
                  window.removeEventListener("message", onPollStatus);
                  if (evt.data.data && evt.data.data.activeAccesses && evt.data.data.activeAccesses.length > 0) {
                    let onLR = function(evt2) {
                      if (lrHandled) return;
                      if (evt2.data && evt2.data.type === "COR3_AUTOJOB_SAI_LOGIN_RESULT") {
                        lrHandled = true;
                        clearTimeout(lrTimer);
                        window.removeEventListener("message", onLR);
                        resolve({ ok: true });
                      }
                    };
                    var acc = evt.data.data.activeAccesses[0];
                    var accType = acc.accessType || acc.type || "unknown";
                    addLog2("\u26A1 Got " + accType + " access on " + targetName + " \u2014 logging in");
                    window.__cor3AutoJobLoginWithAccess(targetId, acc.id);
                    var lrHandled = false;
                    window.addEventListener("message", onLR);
                    var lrTimer = setTimeout(function() {
                      if (!lrHandled) {
                        lrHandled = true;
                        window.removeEventListener("message", onLR);
                        resolve({ ok: true });
                      }
                    }, 1e4);
                  } else {
                    if (pollCount < MAX_POLLS) {
                      addLog2("\u26A1 No access yet after hack on " + targetName + " (poll " + pollCount + "/" + MAX_POLLS + ")");
                      setTimeout(doPoll, 3e3);
                    } else {
                      resolve({ ok: false, error: "No access granted after hack on " + targetName });
                    }
                  }
                }
              }
              window.addEventListener("message", onPollStatus);
              var pollTimer = setTimeout(function() {
                if (!pollHandled) {
                  pollHandled = true;
                  window.removeEventListener("message", onPollStatus);
                  resolve({ ok: false, error: "Poll login status timed out on " + targetName });
                }
              }, 8e3);
              window.__cor3AutoJobGetLoginStatus(targetId);
            }
            setTimeout(doPoll, 1500);
          }
          addLog2("Setting endpoint to " + serverName + " (" + serverId.substring(0, 8) + ")...");
          sendSetEndpoint(serverId).then(function(result) {
            if (result.ok) {
              if (result.timeout) {
                addLog2("Endpoint set (timeout \u2014 may already be set)");
              } else {
                addLog2("Endpoint set successfully");
              }
              sendResult(true);
              return;
            }
            if (result.maintenance) {
              addLog2("Server " + serverName + " is in maintenance", "var(--accent-orange)");
              sendResult(false, "server-in-maintenance");
              return;
            }
            if (result.noPath) {
              let onMapData = function(evt) {
                if (mapHandled) return;
                if (evt.data && evt.data.type === "COR3_WS_MAP_DATA" && evt.data.servers) {
                  mapHandled = true;
                  clearTimeout(mapTimer);
                  window.removeEventListener("message", onMapData);
                  try {
                    let tryNextPath = function() {
                      if (pathIdx >= allPaths.length) {
                        addLog2("All " + allPaths.length + " path(s) exhausted \u2014 server unreachable", "var(--accent-red)");
                        sendResult(false, "all-paths-failed");
                        return;
                      }
                      var currentPath = allPaths[pathIdx];
                      pathIdx++;
                      if (currentPath.length <= 1) {
                        tryNextPath();
                        return;
                      }
                      var intermediates = currentPath.slice(0, currentPath.length - 1);
                      var pathNames = currentPath.map(function(s) {
                        return s.name;
                      }).join(" \u2192 ");
                      addLog2("\u26A1 Trying path " + pathIdx + "/" + allPaths.length + ": " + pathNames);
                      var stepIdx = 0;
                      function nextStep() {
                        if (stepIdx >= intermediates.length) {
                          addLog2("\u26A1 Path-through complete \u2014 retrying endpoint to " + serverName + "...");
                          sendSetEndpoint(serverId).then(function(retryResult) {
                            if (retryResult.ok) {
                              addLog2("Endpoint set successfully after path-through");
                              sendResult(true);
                            } else if (retryResult.maintenance) {
                              addLog2("Server " + serverName + " is in maintenance", "var(--accent-orange)");
                              sendResult(false, "server-in-maintenance");
                            } else {
                              addLog2("\u26A1 Still unreachable after path " + pathIdx + " \u2014 trying next path", "var(--accent-orange)");
                              tryNextPath();
                            }
                          });
                          return;
                        }
                        var intermediate = intermediates[stepIdx];
                        stepIdx++;
                        addLog2("\u26A1 Path step " + stepIdx + "/" + intermediates.length + ": setting endpoint to " + intermediate.name);
                        sendSetEndpoint(intermediate.id).then(function(intResult) {
                          if (intResult.ok || intResult.timeout) {
                            setTimeout(function() {
                              loginToServer(intermediate.id, intermediate.name).then(function(loginResult) {
                                if (loginResult.ok) {
                                  setTimeout(nextStep, 1e3);
                                } else {
                                  addLog2("\u26A1 Login/hack failed on " + intermediate.name + ": " + loginResult.error + " \u2014 trying next path", "var(--accent-orange)");
                                  tryNextPath();
                                }
                              });
                            }, 1e3);
                          } else if (intResult.maintenance) {
                            addLog2("\u26A1 " + intermediate.name + " is in maintenance \u2014 trying next path", "var(--accent-orange)");
                            tryNextPath();
                          } else {
                            addLog2("\u26A1 " + intermediate.name + " unreachable \u2014 trying next path", "var(--accent-orange)");
                            tryNextPath();
                          }
                        });
                      }
                      nextStep();
                    };
                    var graph = new ServerMap();
                    graph.update({
                      servers: evt.data.servers || [],
                      connections: evt.data.connections || []
                    });
                    if (!graph.isReady() || !graph.getHomeId()) {
                      addLog2("Could not find Home Server in map data", "var(--accent-red)");
                      sendResult(false, "no-home-server-in-map");
                      return;
                    }
                    var allPaths = graph.findAllPaths(serverId);
                    if (allPaths.length === 0) {
                      addLog2("No viable paths from Home to " + serverName + " (all paths blocked by maintenance)", "var(--accent-red)");
                      sendResult(false, "all-paths-blocked-by-maintenance");
                      return;
                    }
                    addLog2("Found " + allPaths.length + " viable path(s) to " + serverName + " (maintenance servers excluded)");
                    var pathIdx = 0;
                    tryNextPath();
                  } catch (ex) {
                    addLog2("Path resolution error: " + ex.message, "var(--accent-red)");
                    sendResult(false, "path-resolution-error");
                  }
                }
              };
              addLog2("No direct path to " + serverName + " \u2014 attempting path-through hack...");
              addLog2("Fetching network map for path resolution...");
              window.__cor3AutoJobGetNetworkMap();
              var mapHandled = false;
              window.addEventListener("message", onMapData);
              var mapTimer = setTimeout(function() {
                if (!mapHandled) {
                  mapHandled = true;
                  window.removeEventListener("message", onMapData);
                  addLog2("Timeout waiting for map data (12s)", "var(--accent-red)");
                  sendResult(false, "map-timeout");
                }
              }, 12e3);
              return;
            }
            addLog2("Endpoint error: " + result.errorMsg);
            sendResult(false, result.errorMsg);
          });
        })(event.data.serverId);
      }
      if (event.data && event.data.type === "COR3_REQUEST_STASH") {
        window.__cor3RequestStash();
      }
      if (event.data && event.data.type === "COR3_REQUEST_SPECIALISTS") {
        window.__cor3RequestSpecialists();
      }
      if (event.data && event.data.type === "COR3_PURCHASE_SPECIALIST") {
        window.__cor3PurchaseSpecialist(event.data.specialistType, event.data.kind, event.data.level, event.data.priceId);
      }
      if (event.data && event.data.type === "COR3_REQUEST_LOADOUT") {
        window.__cor3RequestLoadout();
      }
      if (event.data && event.data.type === "COR3_EQUIP_HARDWARE") {
        window.__cor3EquipHardware(event.data.moduleConfigId);
      }
      if (event.data && event.data.type === "COR3_EQUIP_SOFTWARE") {
        window.__cor3EquipSoftware(event.data.moduleConfigId);
      }
      if (event.data && event.data.type === "COR3_UNEQUIP_SOFTWARE") {
        window.__cor3UnequipSoftware(event.data.moduleConfigId);
      }
      if (event.data && event.data.type === "COR3_REQUEST_MARKET") {
        window.__cor3RequestMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REQUEST_DARK_MARKET") {
        window.__cor3RequestDarkMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REQUEST_SOYUZ_MARKET") {
        window.__cor3RequestSoyuzMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REQUEST_USOL_MARKET") {
        window.__cor3RequestUsolMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REFRESH_MARKET") {
        window.__cor3RefreshMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REFRESH_DARK_MARKET") {
        window.__cor3RefreshDarkMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REFRESH_SOYUZ_MARKET") {
        window.__cor3RefreshSoyuzMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REFRESH_USOL_MARKET") {
        window.__cor3RefreshUsolMarket(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);});
      }
      if (event.data && event.data.type === "COR3_REFRESH_ALL_MARKETS_SEQ") {
        var opts = {};
        if (event.data.skipLots) opts.skipLots = true;
        if (event.data.order) opts.order = event.data.order;
        window.__cor3RefreshAllMarketsSequential(function(){if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);}, opts);
      }
      if (event.data && event.data.type === "COR3_LEAVE_STASH") {
        leaveRoom("stash");
      }
      if (event.data && event.data.type === "COR3_SELL_ITEM") {
        window.__cor3SellItem(event.data.itemId, event.data.quantity || 1, event.data.skipStashRefresh);
      }
      if (event.data && event.data.type === "COR3_MAIL_CLAIM_ALL") {
        window.__cor3MailClaimAll(event.data.messageId);
      }
      if (event.data && event.data.type === "COR3_MAIL_CLAIM_ITEM") {
        window.__cor3MailClaimItem(event.data.attachmentId, event.data.x, event.data.y, event.data.rotated);
      }
      if (event.data && event.data.type === "COR3_STASH_MOVE_ITEM") {
        window.__cor3StashMoveItem(event.data.itemId, event.data.location, event.data.x, event.data.y, event.data.rotated);
      }
      if (event.data && event.data.type === "COR3_RESPOND_DECISION") {
        window.__cor3RespondDecision(event.data.expeditionId, event.data.messageId, event.data.selectedOption);
      }
      if (event.data && event.data.type === "COR3_REQUEST_ARCHIVED_EXPEDITIONS") {
        window.__cor3RequestArchivedExpeditions();
      }
      if (event.data && event.data.type === "COR3_SET_MERC_INSURANCE") {
        window.__cor3MercHasInsurance = !!event.data.hasInsurance;
      }
      if (event.data && event.data.type === "COR3_REQUEST_MERCENARIES") {
        window.__cor3RequestMercenaries(null, function() {
          window.postMessage({ type: "COR3_CORE_MERCS_DONE" }, "*");
          if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);
        });
      }
      if (event.data && event.data.type === "COR3_REQUEST_USOL_MERCENARIES") {
        window.__cor3RequestUsolMercenaries(function() {
          window.postMessage({ type: "COR3_USOL_MERCS_DONE" }, "*");
          if(event.data.networkTicket)window.postMessage({type:"COR3_NETWORK_DONE",networkTicket:event.data.networkTicket},location.origin);
        });
      }
      if (event.data && event.data.type === "COR3_REQUEST_EXPEDITION_CONFIG") {
        window.__cor3RequestExpeditionConfig();
      }
      if (event.data && event.data.type === "COR3_LAUNCH_EXPEDITION") {
        window.__cor3LaunchExpedition(event.data.config);
      }
      if (event.data && event.data.type === "COR3_RELAUNCH_EXPEDITION") {
        console.log("[COR3 Helper] Relaunching expedition with stored data");
        window.__cor3LaunchExpedition(event.data.data);
      }
      if (event.data && event.data.type === "COR3_OPEN_CONTAINER") {
        window.__cor3OpenContainer(event.data.expeditionId);
      }
      if (event.data && event.data.type === "COR3_STOP_DECRYPT_SOLVER") {
        window.__solverAbort = true;
      }
      if (event.data && event.data.type === "COR3_STOP_DAILY_HACK") {
        window.__dailyHackAbort = true;
        window.__dailyHackActive = false;
      }
      if (event.data && event.data.type === "COR3_START_DECRYPT_SOLVER") {
        if (!cor3AutomationAllowed()) return;
        if (window.__solverActive && !window.__solverAbort) return;
        window.__solverAbort = false;
        window.__solverActive = false;
      }
      if (event.data && event.data.type === "COR3_STOP_ICE_WALL_SOLVER") {
        window.__iceWallSolverAbort = true;
      }
      if (event.data && event.data.type === "COR3_START_ICE_WALL_SOLVER") {
        if (!cor3AutomationAllowed()) return;
        if (window.__iceWallSolverActive && !window.__iceWallSolverAbort) return;
        window.__iceWallSolverAbort = false;
        window.__iceWallSolverActive = false;
      }
      if (event.data && event.data.type === "COR3_KEEP_ALIVE") {
        window.__cor3KeepAlive();
      }
      if (event.data && event.data.type === "COR3_CHAT_CMD") {
        var chatCmd = event.data.cmd;
        var chatData = event.data.data || {};
        if (chatCmd === "create.message") window.__cor3ChatCreateMessage(chatData.variantId, chatData.chatId);
        else if (chatCmd === "read.messages") window.__cor3ChatReadMessages(chatData.messageIds, chatData.chatId);
      }
      if (event.data && event.data.type === "COR3_AUTOJOB_CMD") {
        var cmd = event.data.cmd;
        var d = event.data.data || {};
        if (cmd === "job.take") window.__cor3AutoJobTake(d.marketId, d.jobId);
        else if (cmd === "job.complete") window.__cor3AutoJobComplete(d.marketId, d.jobId);
        else if (cmd === "job.dismiss") window.__cor3AutoJobDismiss(d.marketId, d.jobId);
        else if (cmd === "get.jobs") window.__cor3AutoJobGetMarketOptions(d.marketId);
        else if (cmd === "get.options") window.__cor3AutoJobGetMarketOptions(d.marketId);
        else if (cmd === "set.endpoint") window.__cor3AutoJobSetEndpoint(d.serverId);
        else if (cmd === "get.login.status") window.__cor3AutoJobGetLoginStatus(d.serverId);
        else if (cmd === "login.with-access") window.__cor3AutoJobLoginWithAccess(d.serverId, d.accessGrantId);
        else if (cmd === "hack.start") window.__cor3AutoJobHackStart(d.serverId);
        else if (cmd === "get.files") window.__cor3AutoJobGetFiles(d.serverId);
        else if (cmd === "file.download") window.__cor3AutoJobFileDownload(d.serverId, d.fileId);
        else if (cmd === "get.logs") window.__cor3AutoJobGetLogs(d.serverId);
        else if (cmd === "log.delete") window.__cor3AutoJobLogDelete(d.serverId, d.seq);
        else if (cmd === "log.download") window.__cor3AutoJobLogDownload(d.serverId, d.seq);
        else if (cmd === "get.transit") window.__cor3AutoJobGetTransit(d.serverId);
        else if (cmd === "transit.add") window.__cor3AutoJobTransitAdd(d.serverId, d.ip, d.description);
        else if (cmd === "open.folder") window.__cor3AutoJobOpenFolder(d.folderId);
        else if (cmd === "decrypt.file") window.__cor3AutoJobDecryptFile(d.fileId);
        else if (cmd === "get.map") window.__cor3AutoJobGetNetworkMap();
        else if (cmd === "desktop.get.options") window.__cor3AutoJobGetDesktopOptions();
        else if (cmd === "file.delete") window.__cor3AutoJobFileDelete(d.serverId, d.fileId);
        else if (cmd === "file.upload") window.__cor3AutoJobFileUpload(d.serverId, d.name, d.sizeMb);
        else if (cmd === "transit.remove") window.__cor3AutoJobTransitRemove(d.serverId, d.ip);
        else if (cmd === "get.file.analysis") window.__cor3AutoJobGetFileAnalysis(d.fileId);
        else if (cmd === "loadout.get") window.__cor3AutoJobRequestLoadout();
        else if (cmd === "loadout.equip.hardware") window.__cor3AutoJobEquipHardware(d.moduleConfigId);
        else if (cmd === "loadout.equip.software") window.__cor3AutoJobEquipSoftware(d.moduleConfigId);
        else if (cmd === "loadout.unequip.software") window.__cor3AutoJobUnequipSoftware(d.moduleConfigId);
        else if (cmd === "file.search-valuable") window.__cor3ValuableFileSearch(d.serverId);
        else if (cmd === "log.search-valuable") window.__cor3ValuableLogSearch(d.serverId);
        else if (cmd === "get.sellable-items") window.__cor3ValuableGetSellableItems(d.marketId);
        else if (cmd === "sell.items") window.__cor3ValuableSellItems(d.marketId, d.items);
      }
      if (event.data && event.data.type === "COR3_IP_SEARCH_START") {
        if (window.__cor3NetworkDiscovery) {
          window.__cor3NetworkDiscovery.discover({ reason: "secret-finder" });
        }
      }
      if (event.data && event.data.type === "COR3_ANTI_AFK_TOGGLE") {
        if (event.data.enabled && !cor3AutomationAllowed()) return;
        if (event.data.enabled) {
          if (!window.__cor3AntiAfkTimer) {
            let antiAfkClick = function() {
              if (!cor3AutomationAllowed()) return;
              var target = document.querySelector('div[data-component-name="DesktopWrapperBorder"]');
              if (!target) return;
              var rect = target.getBoundingClientRect();
              var cx = Math.floor(rect.left + rect.width / 2);
              var cy = Math.floor(rect.top + rect.height / 2);
              var opts2 = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window };
              target.dispatchEvent(new MouseEvent("mouseenter", opts2));
              target.dispatchEvent(new MouseEvent("mousemove", opts2));
              target.dispatchEvent(new MouseEvent("click", opts2));
              target.dispatchEvent(new MouseEvent("mouseleave", opts2));
            };
            var ANTI_AFK_INTERVAL = 3 * 60 * 1e3;
            antiAfkClick();
            window.__cor3AntiAfkTimer = setInterval(antiAfkClick, ANTI_AFK_INTERVAL);
            console.log("[COR3 Helper] Anti-AFK Clicker enabled (3 min interval)");
          }
        } else {
          if (window.__cor3AntiAfkTimer) {
            clearInterval(window.__cor3AntiAfkTimer);
            window.__cor3AntiAfkTimer = null;
            console.log("[COR3 Helper] Anti-AFK Clicker disabled");
          }
        }
      }
      if (event.data && event.data.type === "COR3_DEVTOOLS_WS_SEND") {
        var msg = event.data.message;
        if (msg && typeof msg === "string") {
          wsSendRaw(msg);
        }
      }
    });
  }
  function scheduleVersionRepost() {
    function repostVersions() {
      if (window.__cor3WebVersion) {
        window.postMessage({ type: "COR3_WEB_VERSION", version: window.__cor3WebVersion }, "*");
      }
      if (window.__cor3SystemVersion) {
        window.postMessage({ type: "COR3_SYSTEM_VERSION", version: window.__cor3SystemVersion }, "*");
      }
      if (window.__cor3PatchVersion) {
        window.postMessage({ type: "COR3_PATCH_VERSION", version: window.__cor3PatchVersion }, "*");
      }
    }
    setTimeout(repostVersions, 3e3);
    setTimeout(repostVersions, 8e3);
  }

  window.__cor3MasterGate.onStop(() => {
    window.__cor3ResetInitialFetch();
    wsSendQueue = [];
    wsSendFlushTimer = null;
    pendingRetryOps = [];
    _ceCbs.length = 0;
    bumpMarketRefreshAbortId();
  });

  window.__cor3MasterGate.onReady(() => {
    replayCapturedSession();
    if (trackedSockets.some(ws => ws.readyState === OrigWebSocket.OPEN)) window.__cor3InitialFetch();
  });

  // src/content-early/index.js
  if (window.__cor3WsInterceptorActive) throw new Error("COR3 already active");
  window.__cor3WsInterceptorActive = true;
  (function() {
    setPostUnreachable(__cor3PostUnreachable2);
    installWebSocketProxy(handleWsMessage);
    installHttpIntercept();
    installSocketHealthCheck();
    installMessageListener();
    scheduleVersionRepost();
    console.log("[COR3 Helper] WebSocket interceptor installed");
  })();
})();


