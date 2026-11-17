/* Narrow, read-only effect observations. This is not authenticated server proof.
 * The isolated collector must stamp document/epoch/sequence and revalidate every field.
 * No arbitrary payload, raw WS, credentials, text, account or caller operation IDs leave here.
 */
(function (root) {
  "use strict";
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const id = value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(value);
  function loadout(data) {
    if (!object(data) || !own(data, "equippedHardware") || !own(data, "equippedSoftware") ||
        !object(data.equippedHardware) || !Array.isArray(data.equippedSoftware) || data.equippedSoftware.length > 128) return null;
    const hardware = data.equippedHardware, hardwareIds = [], softwareIds = [];
    for (const slot of ["cpu", "gpu", "ram", "psu"]) {
      if (!own(hardware, slot)) return null;
      const item = hardware[slot];
      if (item === null) continue;
      if (!object(item) || !own(item, "id") || !id(item.id)) return null;
      hardwareIds.push(item.id);
    }
    if (Object.keys(hardware).some(key => !["cpu", "gpu", "ram", "psu"].includes(key))) return null;
    for (const item of data.equippedSoftware) {
      if (!object(item) || !own(item, "id") || !id(item.id)) return null;
      softwareIds.push(item.id);
    }
    if (new Set(hardwareIds).size !== hardwareIds.length || new Set(softwareIds).size !== softwareIds.length) return null;
    return { equippedHardwareIds: hardwareIds, equippedSoftwareIds: softwareIds };
  }
  function decisions(data) {
    const expeditions = Array.isArray(data) ? data : [data];
    if (!expeditions.length || expeditions.length > 1000) return null;
    const rows = [], seen = new Set();
    for (const expedition of expeditions) {
      if (!object(expedition) || !own(expedition, "id") || !id(expedition.id) || !Array.isArray(expedition.messages)) continue;
      if (expedition.messages.length > 1000) return null;
      for (const message of expedition.messages) {
        // isAutoResolved, a missing row, or a selected option alone is not explicit resolution.
        if (!object(message) || !own(message, "id") || !id(message.id) ||
            !own(message, "selectedOption") || !(message.selectedOption === null || id(message.selectedOption)) ||
            !own(message, "isResolved") || typeof message.isResolved !== "boolean") continue;
        const key = JSON.stringify([expedition.id, message.id]);
        if (seen.has(key) || rows.length >= 1000) return null;
        seen.add(key);
        rows.push({ expeditionId: expedition.id, messageId: message.id, selectedOption: message.selectedOption, resolved: message.isResolved });
      }
    }
    return rows.length ? { decisions: rows } : null;
  }
  function project(eventName, payload) {
    if ((eventName !== "loadout" && eventName !== "expeditions") || !object(payload) || payload.error || !own(payload, "data")) return null;
    const data = eventName === "loadout" ? loadout(payload.data) : decisions(payload.data);
    if (!data) return null;
    return { type: "COR3_FULL_EFFECT_V3", version: 3,
      resource: eventName === "loadout" ? "loadoutProof" : "decisionProof", action: eventName,
      requestId: own(payload, "requestId") && id(payload.requestId) ? payload.requestId : null, data };
  }
  const api = Object.freeze({ project });
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Cor3FullEffectProjection = api;
})(globalThis);


