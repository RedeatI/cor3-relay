/* Expedition selection from 1.10.5n, with cost and destination constraints. */
(() => {
  "use strict";
  const DEFAULT_MAX_MERC_COST = 15000, DEFAULT_REPAIR_DURABILITY = 60, DEFAULT_LOW_BATTERY = 30;
  const DEFAULT_LOOT_WEIGHT = 1, DEFAULT_RISK_WEIGHT = -5;
  const MANUAL_FALLBACK_WARNING = "Pinned mercenary unavailable under current rules; using automatic selection.";
  function bool(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }
  function intInRange(value, fallback, min, max) {
    if (value === void 0 || value === null || value === "") return fallback;
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function idOrNull(value) {
    const s = String(value == null ? "" : value).trim();
    return s || null;
  }
  function normalizeMercPriority(raw) {
    const s = raw || {};
    return {
      autoChooseMerc: bool(s.autoChooseMerc, false),
      // false = existing 4-tier policy
      autoChooseUsolFirst: bool(s.autoChooseUsolFirst, true),
      // true = existing USOL preference
      ignoreEliteMerc: bool(s.ignoreEliteMerc, false),
      applyMercCostLimiter: bool(s.applyMercCostLimiter, false),
      maxMercCost: intInRange(s.maxMercCost, DEFAULT_MAX_MERC_COST, 0, 999999),
      mercenaryId: idOrNull(s.mercenaryId),
      mercenaryName: String(s.mercenaryName == null ? "" : s.mercenaryName).slice(0, 80),
      autoClaim: bool(s.autoClaim, true),
      autoDecide: bool(s.autoDecide, true),
      locationConfigId: idOrNull(s.locationConfigId),
      pauseBelowCredits: bool(s.pauseBelowCredits, false),
      // off by default (progressive)
      minCredits: intInRange(s.minCredits, 0, 0, Number.MAX_SAFE_INTEGER)
    };
  }
  function selectExpeditionLocation(config, rawPriority, defaultNames) {
    const p = normalizeMercPriority(rawPriority);
    if (!config || !Array.isArray(config.locations) || config.locations.length === 0) return null;
    const names = Array.isArray(defaultNames) ? defaultNames : [];
    let loc = p.locationConfigId ? config.locations.find((l) => l && l.id === p.locationConfigId) : null;
    if (p.locationConfigId) return loc || null;
    if (!loc) loc = config.locations.find((l) => l && names.includes(l.name));
    if (!loc) loc = config.locations[0];
    return loc || null;
  }
  function normalizeDronePriority(raw) {
    const s = raw || {};
    return {
      // These two gates are read by the content side as `=== false`, so a
      // missing value MUST normalize to true — otherwise the popup renders
      // them unchecked and writes back false on the next settings change.
      autoClaim: bool(s.autoClaim, true),
      autoDecide: bool(s.autoDecide, true),
      autoChooseLocation: bool(s.autoChooseLocation, true),
      locationConfigId: idOrNull(s.locationConfigId),
      missionId: idOrNull(s.missionId),
      fullChargeOnly: bool(s.fullChargeOnly, false),
      repairDurabilityThreshold: intInRange(s.repairDurabilityThreshold, DEFAULT_REPAIR_DURABILITY, 1, 99),
      lowBatteryThreshold: intInRange(s.lowBatteryThreshold, DEFAULT_LOW_BATTERY, 1, 99),
      repairOnLowBattery: bool(s.repairOnLowBattery, true),
      pauseOnRepairFail: bool(s.pauseOnRepairFail, true)
    };
  }
  function normalizeDecisionPriority(raw) {
    const s = raw || {};
    return {
      decisionWeightsEnabled: bool(s.decisionWeightsEnabled, false),
      lootWeight: intInRange(s.lootWeight, DEFAULT_LOOT_WEIGHT, -99, 99),
      riskWeight: intInRange(s.riskWeight, DEFAULT_RISK_WEIGHT, -99, 99),
      getRidOfVeterans: bool(s.getRidOfVeterans, false)
    };
  }
  function finiteOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function nameOf(merc) {
    return String(merc.callsign || merc.name || "");
  }
  function compareDefault(a, b, configs, p) {
    const eliteA = a._isElite ? 0 : 1;
    const eliteB = b._isElite ? 0 : 1;
    if (eliteA !== eliteB) return eliteA - eliteB;
    if (p.autoChooseUsolFirst) {
      const marketA = a._market === "usol" ? 0 : 1;
      const marketB = b._market === "usol" ? 0 : 1;
      if (marketA !== marketB) return marketA - marketB;
    }
    const costA = finiteOr(globalThis.Cor3ExpeditionCost?.totalCostInfo(configs[a.id]).total??configs[a.id].totalCost, Infinity);
    const costB = finiteOr(globalThis.Cor3ExpeditionCost?.totalCostInfo(configs[b.id]).total??configs[b.id].totalCost, Infinity);
    if (costA !== costB) return costA - costB;
    const riskA = finiteOr(configs[a.id].riskScore, 0);
    const riskB = finiteOr(configs[b.id].riskScore, 0);
    if (riskA !== riskB) return riskA - riskB;
    return nameOf(a).localeCompare(nameOf(b));
  }
  function compareCheapest(a, b, configs, p) {
    if (p.autoChooseUsolFirst) {
      const marketA = a._market === "usol" ? 0 : 1;
      const marketB = b._market === "usol" ? 0 : 1;
      if (marketA !== marketB) return marketA - marketB;
    }
    const costA = finiteOr(globalThis.Cor3ExpeditionCost?.totalCostInfo(configs[a.id]).total??configs[a.id].totalCost, Infinity);
    const costB = finiteOr(globalThis.Cor3ExpeditionCost?.totalCostInfo(configs[b.id]).total??configs[b.id].totalCost, Infinity);
    if (costA !== costB) return costA - costB;
    const riskA = finiteOr(configs[a.id].riskScore, 0);
    const riskB = finiteOr(configs[b.id].riskScore, 0);
    if (riskA !== riskB) return riskA - riskB;
    return nameOf(a).localeCompare(nameOf(b));
  }
  function selectMercenary(allMercs, configs, rawPriority) {
    const p = normalizeMercPriority(rawPriority);
    const quotes = configs || {};
    const list = Array.isArray(allMercs) ? allMercs : [];
    let available = list.filter((m) => m && m.status === "AVAILABLE" && quotes[m.id]);
    if (p.ignoreEliteMerc) available = available.filter((m) => !m._isElite);
    if (p.applyMercCostLimiter) available = available.filter(m => {
      const quote = globalThis.Cor3ExpeditionCost?.totalCostInfo(quotes[m.id])||{total:quotes[m.id].totalCost,explicit:true};
      const cost = quote.explicit?quote.total:null;
      return cost != null && cost !== "" && Number.isFinite(Number(cost)) && Number(cost) <= p.maxMercCost;
    });
    if (p.locationConfigId) available = available.filter(m => !m._locationUnavailable);
    const pinned = p.mercenaryId && available.find(m => m.id === p.mercenaryId);
    if (pinned) return { id: pinned.id, merc: pinned, reason: "manual", warning: "" };
    const warning = p.mercenaryId ? MANUAL_FALLBACK_WARNING : "";
    if (available.length === 0) {
      return { id: null, merc: null, reason: "no-candidate", warning };
    }
    const sorted = available.slice();
    sorted.sort(p.autoChooseMerc ? (a, b) => compareCheapest(a, b, quotes, p) : (a, b) => compareDefault(a, b, quotes, p));
    return {
      id: sorted[0].id,
      merc: sorted[0],
      reason: p.autoChooseMerc ? "cheapest" : "default",
      warning
    };
  }
  function buildDroneCandidate(mission, loc) {
    return Object.assign({}, mission, {
      locationConfigId: loc.id,
      _risk: loc.baseRisk || 0
    });
  }
  function pickDroneMission(options, rawPriority) {
    const p = normalizeDronePriority(rawPriority);
    if (!options || !Array.isArray(options.locations) || options.locations.length === 0) return null;
    if (!p.autoChooseLocation && p.locationConfigId) {
      const loc = options.locations.find(l => l?.id === p.locationConfigId);
      if (!loc || !Array.isArray(loc.missions) || loc.missions.length === 0) return null;
      const mission = p.missionId ? loc.missions.find(m => m?.id === p.missionId) : loc.missions[0];
      return mission ? buildDroneCandidate(mission, loc) : null;
    }
    let best = null;
    for (const loc of options.locations) {
      for (const m of loc.missions || []) {
        const cand = buildDroneCandidate(m, loc);
        if (!best) {
          best = cand;
          continue;
        }
        const cCost = cand.batteryCost || 0;
        const bCost = best.batteryCost || 0;
        if (cCost !== bCost) {
          if (cCost < bCost) best = cand;
          continue;
        }
        if (cand._risk !== best._risk) {
          if (cand._risk < best._risk) best = cand;
          continue;
        }
        if ((cand.durationSeconds || 0) < (best.durationSeconds || 0)) best = cand;
      }
    }
    return best;
  }
  function shouldWaitForFullCharge(battery, rawPriority) {
    const p = normalizeDronePriority(rawPriority);
    if (!p.fullChargeOnly) return false;
    if (!Number.isFinite(battery?.current) || !Number.isFinite(battery?.max)) return true;
    return battery.current < battery.max;
  }
  function droneNeedsRepair(drone, battery, rawPriority) {
    const p = normalizeDronePriority(rawPriority);
    const battCur = Number.isFinite(battery?.current) ? battery.current : 100;
    const needsDurabilityRepair = drone.durability <= p.repairDurabilityThreshold;
    const needsLowBatteryRepair = p.repairOnLowBattery && battCur < p.lowBatteryThreshold && drone.durability < drone.maxDurability;
    return !!(needsDurabilityRepair || needsLowBatteryRepair);
  }
  function resolveDecisionOverrides(rawPriority, expeditionRiskScore, isVeteranExpedition) {
    const p = normalizeDecisionPriority(rawPriority);
    if (p.getRidOfVeterans && isVeteranExpedition) {
      return { enabled: true, lootWeight: 1, riskWeight: 10, expeditionRiskScore };
    }
    if (!p.decisionWeightsEnabled) return null;
    return {
      enabled: true,
      lootWeight: p.lootWeight,
      riskWeight: p.riskWeight,
      expeditionRiskScore
    };
  }
  function shouldPauseForCredits(merc, credits) {
    const p = normalizeMercPriority(merc);
    if (!p.pauseBelowCredits) return false;
    const minC = Number(p.minCredits) || 0;
    if (minC <= 0) return false;
    if (!Number.isFinite(credits)) return true;
    return credits < minC;
  }
  function hasDispatchConstraints(raw) {
    const p = normalizeMercPriority(raw);
    return !!(p.locationConfigId || p.mercenaryId || p.ignoreEliteMerc || p.applyMercCostLimiter || p.pauseBelowCredits);
  }
  globalThis.Cor3ExpeditionPriority = Object.freeze({normalizeMercPriority, normalizeDronePriority, normalizeDecisionPriority, selectExpeditionLocation, selectMercenary, pickDroneMission, shouldWaitForFullCharge, droneNeedsRepair, resolveDecisionOverrides, shouldPauseForCredits, hasDispatchConstraints});
})();
