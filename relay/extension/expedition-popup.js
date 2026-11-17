/* Expedition priorities for the native popup and sidebar. */
(() => {
  "use strict";
  const rules = Cor3ExpeditionPriority;
  const byId = id => document.getElementById(id);
  const fields = (prefix, pairs) => Object.fromEntries(Object.entries(pairs).map(([key, suffix]) => [key, byId(prefix + suffix)]));
  const merc = fields("mercPriority", {
    autoClaim:"AutoClaimToggle", autoDecide:"AutoDecideToggle", autoChooseUsolFirst:"UsolFirstToggle",
    ignoreEliteMerc:"IgnoreEliteToggle", autoChooseMerc:"CheapestToggle", mercenaryId:"MercenarySelect",
    locationConfigId:"LocationSelect", applyMercCostLimiter:"CostLimiterToggle", maxMercCost:"MaxCostInput",
    decisionWeightsEnabled:"WeightsToggle", lootWeight:"LootWeightInput", riskWeight:"RiskWeightInput",
    getRidOfVeterans:"VeteransToggle", pauseBelowCredits:"PauseBelowCreditsToggle", minCredits:"MinCreditsInput"
  });
  const drone = fields("dronePriority", {
    autoClaim:"AutoClaimToggle", autoDecide:"AutoDecideToggle", autoChooseLocation:"AutoChooseToggle",
    locationConfigId:"LocationSelect", missionId:"MissionSelect", fullChargeOnly:"FullChargeToggle",
    repairDurabilityThreshold:"DurabilityInput", lowBatteryThreshold:"LowBatteryInput",
    repairOnLowBattery:"RepairOnLowBatteryToggle", pauseOnRepairFail:"PauseOnFailToggle",
    decisionWeightsEnabled:"WeightsToggle", lootWeight:"LootWeightInput", riskWeight:"RiskWeightInput"
  });
  for (const prefix of ["mercPriority", "dronePriority"]) {
    byId(prefix + "Toggle").addEventListener("click", () => {
      byId(prefix + "Toggle").classList.toggle("open");
      byId(prefix + "Body").classList.toggle("open");
    });
  }

  function setOptions(control, values, selected) {
    const rows = new Map();
    for (const value of values) if (value?.id) rows.set(value.id, value.name || value.id);
    if (selected && !rows.has(selected)) rows.set(selected, selected);
    control.replaceChildren(new Option("自动", ""));
    for (const [id, name] of rows) control.append(new Option(name, id));
    control.value = selected || "";
  }
  const configKeys = ["autoSendMerc", "autoDrone", "mercenariesData", "usolMercenariesData", "expeditionConfigData", "usolExpeditionConfigData", "droneData"];
  let cache = {};
  let loaded = false;
  let request = 0;
  function render() {
    const mercRules = { ...rules.normalizeMercPriority(cache.autoSendMerc), ...rules.normalizeDecisionPriority(cache.autoSendMerc) };
    const droneRules = { ...rules.normalizeDronePriority(cache.autoDrone), ...rules.normalizeDecisionPriority(cache.autoDrone) };
    for (const [form, values] of [[merc, mercRules], [drone, droneRules]]) {
      for (const [key, el] of Object.entries(form)) {
        if (el.type === "checkbox") el.checked = values[key];
        if (el.type === "number") el.value = values[key];
        el.disabled = !loaded;
      }
      form.lootWeight.disabled ||= !values.decisionWeightsEnabled;
      form.riskWeight.disabled ||= !values.decisionWeightsEnabled;
    }
    const mercenaries = [cache.mercenariesData, cache.usolMercenariesData].flatMap(data =>
      Array.isArray(data) ? data : [...(data?.mercenaries || []), ...(data?.eliteSlots || []).map(slot => slot.mercenary)]);
    setOptions(merc.mercenaryId, mercenaries.filter(Boolean).map(m => ({ id: m.id, name: m.callsign || m.name })), mercRules.mercenaryId);
    setOptions(merc.locationConfigId, [cache.expeditionConfigData, cache.usolExpeditionConfigData].flatMap(data => data?.locations || []), mercRules.locationConfigId);
    const locations = cache.droneData?.locations || [];
    setOptions(drone.locationConfigId, locations, droneRules.locationConfigId);
    setOptions(drone.missionId, locations.find(loc => loc.id === droneRules.locationConfigId)?.missions || [], droneRules.missionId);
    byId("dronePriorityDestinationRow").style.display = droneRules.autoChooseLocation ? "none" : "";
    merc.maxMercCost.disabled ||= !mercRules.applyMercCostLimiter;
    merc.minCredits.disabled ||= !mercRules.pauseBelowCredits;
  }
  async function read() {
    const generation = ++request;
    try {
      const data = await Cor3CenterStore.get(configKeys);
      if (generation !== request) return;
      cache = data;
      loaded = true;
    } catch {
      if (generation !== request) return;
      loaded = false;
      cache = {};
    }
    render();
  }
  let writes = Promise.resolve();
  for (const [storageKey, form] of [["autoSendMerc", merc], ["autoDrone", drone]]) {
    for (const [key, element] of Object.entries(form)) {
      element.addEventListener("change", () => {
        if (!loaded) return;
        const value = element.type === "checkbox" ? element.checked : element.type === "number"
          ? Math.min(Number(element.max), Math.max(Number(element.min), Math.round(element.valueAsNumber)))
          : element.value;
        if (typeof value === "number" && !Number.isFinite(value)) { render(); return; }
        writes = writes.then(async () => {
          const data = await Cor3CenterStore.get(storageKey);
          const patch = { [key]: value };
          if (storageKey === "autoDrone" && key === "locationConfigId") patch.missionId = "";
          await Cor3CenterStore.update(storageKey,patch);
        }).catch(() => {}).then(read);
      });
    }
  }
  Cor3CenterStore.onChanged.addListener(changes => {
    if (configKeys.some(key => Object.hasOwn(changes, key))) void read();
  });
  render();
  void read();

  const toggle = byId("autoExpDebugToggle");
  const consoleBox = byId("autoExpDebugConsole");
  const body = byId("expDebugLogsBody");
  let timer, logRequest = 0;
  async function readLog() {
    const generation = ++logRequest;
    let text;
    try {
      const binding = await Cor3CenterUi.binding();
      const response = await Cor3CenterUi.send(binding.tabId, { action: "cor3ExpeditionReadLog" });
      if (response?.documentId !== binding.documentId) throw Error("STALE_DOCUMENT");
      text = response.entries.map(entry => new Date(entry.at).toLocaleTimeString("zh-CN", { hour12: false }) + " " + entry.text).join("\n") || "当前页暂无远征事件";
    } catch {
      text = "当前游戏页日志不可用";
    }
    if (generation === logRequest && toggle.checked) {
      body.style.whiteSpace = "pre-wrap";
      body.textContent = text;
    }
  }
  toggle.addEventListener("change", () => {
    clearInterval(timer);
    ++logRequest;
    consoleBox.style.display = toggle.checked ? "" : "none";
    if (toggle.checked) {
      void readLog();
      timer = setInterval(readLog, 2000);
    }
  });
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
})();
