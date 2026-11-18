/* Bounded expedition events and a read-only status view for the current game document. */
(() => {
  "use strict";
  if (window.top !== window) return;
  const api = globalThis.browser || globalThis.chrome;
  const entries = [];
  const messages = {
    "ready": "Helper 已载入此游戏页",
    "ice-started": "ICE Wall 自动破解已启动",
    "ice-progress": "ICE Wall 自动破解正在匹配",
    "ice-complete": "ICE Wall 自动破解已完成",
    "ice-error": "ICE Wall 自动破解报告错误",
    "expeditions": "收到雇佣兵远征列表",
    "drone-options": "收到无人机状态",
    "credit-floor": "余额低于设定值，暂缓派遣",
    "credit-unknown": "暂未确认余额，暂缓派遣",
    "no-mercenary": "没有符合规则的雇佣兵或报价",
    "mercenary-fallback": "指定雇佣兵不符合规则，尝试自动选择",
    "mercenary-dispatch": "已发出雇佣兵派遣请求",
    "mercenary-launched": "游戏确认雇佣兵远征已出发",
    "mercenary-launch-error": "游戏返回雇佣兵派遣错误",
    "mercenary-claim": "处理雇佣兵远征奖励",
    "mercenary-decision": "已发出雇佣兵远征决策",
    "drone-charge": "等待无人机充满电",
    "drone-destination": "当前没有符合规则的无人机任务",
    "drone-dispatch": "已发出无人机派遣请求",
    "drone-launched": "游戏确认无人机远征已出发",
    "drone-repair": "已发出无人机维修请求",
    "drone-error": "游戏返回无人机操作错误",
    "drone-decision": "已发出无人机远征决策"
  };
  let serial = 0;
  let logDocumentId = null;
  let changed = () => {};
  function currentEntries() {
    const id = globalThis.Cor3CenterIdentity?.snapshot()?.documentId || null;
    if (id !== logDocumentId) {
      entries.length = 0;
      logDocumentId = id;
      if (id) entries.push({ at: Date.now(), code: "ready", text: messages.ready });
    }
    return entries;
  }
  const iceReasons = {
    'round-unconfirmed':'轮次未推进，已停止本次尝试',
    'match-retries':'匹配点击多次未获确认，已停止本轮'
  };
  function iceReason(message) {
    if (typeof message !== 'string') return null;
    if (message === 'Round did not advance; stopping this attempt') return 'round-unconfirmed';
    if (message === 'Max retries reached, skipping round') return 'match-retries';
    return null;
  }
  function log(code, reason) {
    if (!Object.hasOwn(messages, code)) return;
    currentEntries();
    if (!logDocumentId) return;
    const now = Date.now();
    const last = entries.at(-1);
    if (last?.code === code && (last.reason || null) === (reason || null) && now - last.at < 5000) return;
    entries.push({ at: now, code, text: messages[code] + (Object.hasOwn(iceReasons, reason) ? "：" + iceReasons[reason] : ""), ...(Object.hasOwn(iceReasons, reason) ? {reason} : {}) });
    if (entries.length > 40) entries.shift();
    changed();
  }
  globalThis.Cor3ExpeditionDiagnostics = Object.freeze({ log });
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.type !== "COR3_ICE_WALL_STATUS") return;
    const state = event.data.state;
    if (["started", "progress", "complete", "error"].includes(state)) log("ice-" + state, state === "error" ? iceReason(event.data.message) : null);
  });
  api.runtime.onMessage.addListener((message, sender) => {
    if (message?.action !== "cor3ExpeditionReadLog" || sender?.id !== api.runtime.id || sender.tab) return;
    const identity = globalThis.Cor3CenterIdentity?.snapshot();
    if (!identity || identity.documentId !== message.centerIdentityDocumentId) return Promise.resolve(null);
    return Promise.resolve({ documentId: identity.documentId, entries: currentEntries().map(entry => ({ ...entry })) });
  });

  const version = api.runtime.getManifest().version;
  const shell=globalThis.Cor3HelperUi;if(!shell)return;
  const host = document.createElement("div");
  host.id = "cor3-helper-diagnostics";
  host.style.cssText = 'display:block;color:#d7eef2;font:11px/1.5 ui-monospace,Consolas,monospace';
  const details = document.createElement("details");
  const title = document.createElement("summary");
  title.textContent = "Helper 状态";
  title.style.display = "none";
  const output = document.createElement("pre");
  output.id = "cor3-helper-diagnostics-report";
  output.style.cssText = "margin:0;padding:9px;border:1px solid #30515e;border-radius:5px;background:#091822;max-height:45vh;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;scrollbar-width:thin";
  output.textContent = "读取当前页…";
  details.append(title, output);
  host.append(details);
  if (!document.body) return;
  shell.mount('status',host);
  log("ready");

  const cacheKeys = [
    ["HOME", "marketDataUpdatedAt", "marketData"], ["D4RK", "darkMarketDataUpdatedAt", "darkMarketData"],
    ["SOYUZ", "soyuzMarketDataUpdatedAt", "soyuzMarketData"], ["USOL", "usolMarketDataUpdatedAt", "usolMarketData"],
    ["远征", "expeditionsDataUpdatedAt", "expeditionsData"], ["无人机", "droneDataUpdatedAt", "droneData"],
    ["日常", "dailyOpsUpdatedAt"]
  ];
  const time = value => new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const flag = value => value === true ? "开" : value === false ? "关" : "未读取";
  function readStatus(message) {
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 8000);
      Promise.resolve(api.runtime.sendMessage(message)).then(value => {
        clearTimeout(timer); resolve(value);
      }, () => { clearTimeout(timer); resolve(null); });
    });
  }
  async function refresh() {
    if (!details.open) return;
    const current = ++serial;
    const doc = globalThis.Cor3SolverPageDocument?.snapshot();
    if (!doc) { output.textContent = "游戏页面已变化"; return; }
    const identity = globalThis.Cor3CenterIdentity?.snapshot();
    const readPage = readStatus({ type: "cor3SolverStatus", documentId: doc.documentId });
    const readCache = identity ? readStatus({ type: "cor3CenterCacheSummary", documentId: identity.documentId }) : null;
    const [result, cache] = await Promise.all([readPage, readCache]);
    if (current !== serial || !details.open) return;
    if (globalThis.Cor3SolverPageDocument?.snapshot()?.documentId !== doc.documentId ||
        (identity && globalThis.Cor3CenterIdentity?.snapshot()?.documentId !== identity.documentId)) {
      output.textContent = "游戏页面或账号已变化";
      return;
    }
    const prefs = result?.values;
    const cacheLines = cache?.ok ? [
      "自动远征 雇佣兵 " + flag(cache.expeditionSettings.mercenaryEnabled) +
        " · 无人机 " + (cache.expeditionSettings.dronePaused ? "暂停" : flag(cache.expeditionSettings.droneEnabled)),
      "缓存摘要（以更新时间为准）",
      ...cacheKeys.map(([label, key, countKey]) => {
        const count = cache.counts[countKey];
        return label + " " + (Number.isFinite(cache.values[key]) ? time(cache.values[key]) : "无缓存") +
          (Number.isFinite(count) ? " · " + count + " 项" : "");
      })
    ] : ["账号缓存未确认" + (cache?.code ? "（" + cache.code + "）" : "")];
    const lines = [
      "COR3 Helper " + version,
      "解密 " + flag(prefs?.autoDecryptEnabled) + " · ICE Wall " + flag(prefs?.autoIceWallEnabled) + " · 简易解密 " + flag(prefs?.autoSimpleDecryptEnabled),
      "总暂停 " + flag(prefs?.helperMode) + " · 页面许可 " + flag(globalThis.Cor3ThreeAutomation?.allowed()),
      "页面连接 " + (globalThis.Cor3ThreeAutomation?.status?.().code || "SOLVER_STARTING") +
        " · 账号连接 " + (globalThis.Cor3CenterIdentity?.status?.().code || "CENTER_ACCOUNT_NOT_READY"),
      ...cacheLines,
      ...(cache?.ok ? [
        "Daily 自动 " + flag(cache.dailyState?.enabled) + " · 会话交接 " + (cache.dailyState?.sessionReady ? "完成" : "等待") +
          " · 今日 " + (cache.dailyState?.claimed === true ? "已领取" : cache.dailyState?.claimed === false ? "未领取" : "未读取"),
        ...(cache.operationState ? ["执行 " + (cache.operationState.active||"空闲") + " · 排队 " + cache.operationState.queued.length + " · 端点 " + (cache.operationState.endpointOwner||"空闲") + (cache.operationState.blocked?" · 等待 "+cache.operationState.blocked:"")] : ["操作状态未读取"]),
        ...(cache.operationEvents || []).map(entry=>time(entry.at)+" "+entry.code+" "+entry.message),
        ...(cache.dailyEvents || []).map(entry => time(entry.at) + " Daily " + entry.step)
      ] : []),
      ...currentEntries().slice(-12).map(entry => time(entry.at) + " " + entry.text)
    ];
    const text = lines.join("\n");
    if (output.textContent !== text) output.textContent = text;
  }
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    if (details.open) timer = setTimeout(async () => { try { await refresh(); } finally { schedule(); } }, 2500);
  };
  shell.onOpen(tab=>{details.open=tab==='status';if(details.open){void refresh();schedule();}});shell.onClose(()=>{details.open=false;clearTimeout(timer);});
  details.addEventListener("toggle", () => { void refresh(); schedule(); });
  changed = () => { if (details.open) void refresh(); };
  window.addEventListener("pagehide", () => {
    ++serial;
    clearTimeout(timer);
    host.remove();
  }, { once: true });
})();
