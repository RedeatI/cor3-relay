/* COR3 full candidate: classic isolated bundle; disabled by default. */
(() => {
'use strict';
const __m2 = (() => {
// Offline-only strict JSON schema subset. No I/O and no dynamic code evaluation.
function fail(code) { const e = new Error(code); e.code = code; throw e; }
const object = (properties = {}, optional = []) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties).filter(k => !optional.includes(k)), properties });
const bool = { type: 'boolean' };
const integer = (minimum = 0, maximum = 1000000) => ({ type: 'integer', minimum, maximum });
const enumeration = values => ({ type: 'string', enum: values });
const identifier = { type: 'string', minLength: 1, maxLength: 80, pattern: '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$' };
const operationId = { type: 'string', minLength: 16, maxLength: 80, pattern: '^[A-Za-z0-9_-]{16,80}$' };
const tokenSchema = { type: 'string', minLength: 32, maxLength: 32, pattern: '^[a-f0-9]{32}$' };
const targetSchema = object({ accountId: identifier, profileInstallationId: identifier });
const array = (items, maxItems = 64, minItems = 0) => ({ type: 'array', items, maxItems, minItems, uniqueItems: true });
const literal = value => ({ const: value });
function deepFreeze(value) { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); } return value; }
// Reject non-JSON values, getters, symbols, inherited data and prototype pollution.
function jsonData(value, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 12000 || depth > 16) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return typeof value !== 'string' || value.length <= 8192;
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'object' || Object.getOwnPropertySymbols(value).length) return false;
  if (Array.isArray(value)) {
    if (value.length > 2048 || Object.keys(value).length !== value.length) return false;
    for (let i = 0; i < value.length; i++) { const d = Object.getOwnPropertyDescriptor(value, String(i)); if (!d || !('value' in d) || !jsonData(d.value, depth + 1, budget)) return false; }
    return true;
  }
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  for (const key of Object.getOwnPropertyNames(value)) { const d = Object.getOwnPropertyDescriptor(value, key); if (['__proto__', 'prototype', 'constructor'].includes(key) || !d.enumerable || !('value' in d) || !jsonData(d.value, depth + 1, budget)) return false; }
  return true;
}
// JSON Schema equality ignores object-member order. jsonData has already
// excluded getters, inherited data, cycles and other non-JSON values here.
function structuralIdentity(value) {
  if (Array.isArray(value)) return '[' + value.map(structuralIdentity).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + structuralIdentity(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function matches(schema, value) {
  if (schema.oneOf) return schema.oneOf.filter(s => matches(s, value)).length === 1;
  if (Object.hasOwn(schema, 'const')) return value === schema.const;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === 'boolean') return typeof value === 'boolean';
  if (schema.type === 'integer') return Number.isSafeInteger(value) && value >= schema.minimum && value <= schema.maximum;
  if (schema.type === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= schema.minimum && value <= schema.maximum;
  if (schema.type === 'string') return typeof value === 'string' && value.length >= (schema.minLength ?? 0) && value.length <= (schema.maxLength ?? 8192) && (!schema.pattern || new RegExp(schema.pattern, 'u').test(value));
  if (schema.type === 'array') return Array.isArray(value) && value.length >= schema.minItems && value.length <= schema.maxItems && (!schema.uniqueItems || new Set(value.map(structuralIdentity)).size === value.length) && value.every(v => matches(schema.items, v));
  if (schema.type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value) && schema.additionalProperties === false && schema.required.every(k => Object.hasOwn(value, k)) && Object.keys(value).every(k => Object.hasOwn(schema.properties, k) && matches(schema.properties[k], value[k]));
  return false;
}
function valid(schema, value) { try { return jsonData(value) && matches(schema, value); } catch { return false; } }
function validate(schema, value, code = 'INVALID_ARGUMENTS') { if (!valid(schema, value)) fail(code); return structuredClone(value); }
const targetKey = target => `${target.accountId}/${target.profileInstallationId}`;
const operationKey = (target, id) => `${targetKey(target)}/${id}`;
const sameTarget = (a, b) => a.accountId === b.accountId && a.profileInstallationId === b.profileInstallationId;

return Object.freeze({ fail, object, bool, integer, enumeration, identifier, operationId, tokenSchema, targetSchema, array, literal, deepFreeze, valid, validate, targetKey, operationKey, sameTarget });
})();
const __m4 = (() => {
// Candidate v3: fixed typed API coverage, NOT a claim of live implementation.
// Source: original v1.7.0 content.js:1769-2156 and popup.js setting handlers.
// Bounds are conservative protocol limits, not asserted game-side limits.
const { object, bool, integer, enumeration, identifier, array, literal, deepFreeze } = __m2;
const MARKETS = deepFreeze(['home', 'dark', 'soyuz', 'usol']);
const TIMERS = deepFreeze(['daily', 'home_jobs', 'dark_jobs', 'soyuz_jobs', 'usol_jobs']);
const JOB_TYPES = deepFreeze(['File Decryption', 'IP Injection', 'Data Download', 'Log Deletion', 'Log Download', 'Decrypt & Extract', 'File Elimination', 'Data Upload', 'IP Cleanup']);
const READ_SCOPES = deepFreeze(['overview', 'settings', 'daily', 'markets', 'expeditions', 'decisions', 'stash', 'specialists', 'loadout', 'mercenaries', 'archivedExpeditions', 'network', 'jobs', 'valuables', 'timers', 'alarms', 'logs', 'versions', 'automationQueue', 'drone', 'mailbox', 'automationStatus', 'threeSolverStatus']);
const actions = [];
const add = (id, properties = {}, group = id, effect = 'one-shot', note = '', optional = []) => actions.push({ id, group, effect, inputSchema: object(properties, optional), defaultAllowed: false, sourceMapped: true, offlineImplemented: 'protocol-and-adapter-candidate', nativeWired: 'candidate-interface', liveVerified: false, sourceVersion: 'original-1.7.0', note });
const market = enumeration(MARKETS);
const ids = array(identifier, 100);
const money = integer(0, 1000000000);
const jobRef = object({ jobId: identifier, marketKey: market });
const timerRef = { oneOf: [object({ kind: literal('builtIn'), timer: enumeration(TIMERS) }), object({ kind: literal('expedition'), expeditionId: identifier })] };
const ALARM_SCHEMA = object({ id: identifier, timer: timerRef, thresholdSeconds: integer(1, 3599), continuous: bool, volume: integer(0, 100), enabled: bool });
for (const id of ['requestExpeditions', 'requestNetworkMap', 'requestStash', 'requestSpecialists', 'requestLoadout', 'requestMarket', 'requestDarkMarket', 'requestSoyuzMarket', 'requestUsolMarket', 'requestArchivedExpeditions', 'requestMercenaries', 'requestUsolMercenaries', 'fetchDailyOps']) add(id, {}, 'refresh', 'one-shot', 'Fixed game-data request, not a cached read. Requires explicit scope and prepare/commit.');
for (const id of ['refreshMarket', 'refreshDarkMarket', 'refreshSoyuzMarket', 'refreshUsolMarket']) add(id, {}, 'markets');
add('refreshAllMarketsSeq', { skipLots: bool, order: array(market, 4, 1) }, 'markets');
add('devTcTestReachability', { serverId: identifier }, 'network', 'one-shot', 'Game server ID only. No host, address, URL, port, or shell.');
add('requestExpeditionConfig', { mercenaryId: identifier }, 'refresh', 'one-shot', 'Noarg core config fetch. Legacy mercenaryId is optional and ignored downstream; adapter must not pretend it filters by mercenary.', ['mercenaryId']);
add('purchaseSpecialist', { specialistType: identifier, kind: identifier, level: integer(1, 1000), priceId: identifier, maxCostCredits: money }, 'specialists', 'one-shot', 'In-game credits only; hydrate and verify current offer, exact cost and currency. Real-currency purchase is unsupported.');
for (const id of ['equipHardware', 'equipSoftware', 'unequipSoftware']) add(id, { moduleConfigId: identifier }, 'loadout');
add('sellItem', { itemId: identifier, quantity: integer(1, 1000) }, 'stash', 'one-shot', 'In-game inventory sale. Irreversible game mutation.');
add('leaveStash', {}, 'stash');
add('keepWorkerAlive', {}, 'session', 'one-shot', 'Fixed game keep-alive only, never background system control.');
for (const [id, group] of [['toggleDecryptSolver', 'decrypt'], ['toggleIceWallSolver', 'ice'], ['toggleSimpleDecryptSolver', 'simpleDecrypt'], ['toggleDailyHackSolver', 'daily']]) add(id, { enabled: bool }, group, 'toggle');
add('respondDecision', { expeditionId: identifier, messageId: identifier, selectedOption: identifier }, 'decisions', 'one-shot', 'selectedOption is a current option ID, not an index.');
add('launchExpedition', { config: object({ mercenaryId: identifier, marketId: identifier, locationConfigId: identifier, zoneConfigId: identifier, goalId: identifier, hasInsurance: bool }), maxCostCredits: money }, 'expeditions', 'one-shot', 'Exact generated fields; all IDs, currency and total cost INCLUDING selected insurance must match current trusted cache. Original1.7 generates insurance=false. Unsupported insurance must fail closed; never silently change the request.');
add('openContainer', { expeditionId: identifier, maxCostCredits: money }, 'expeditions', 'one-shot', 'In-game credits only. Original route may consume credits.');
add('collectAll', { expeditionId: identifier }, 'expeditions');
for (const id of ['disableBackground', 'enableBackground', 'disableNetworkFog', 'enableNetworkFog', 'moveNotificationsLeft', 'moveNotificationsRight']) add(id, {}, 'appearance');
add('getVersionFallbacks', {}, 'versions');
add('startAutoJobs', { jobs: array(jobRef, 100, 1), maxDepositCredits: money }, 'jobs', 'start', 'Resolve current jobs and solver settings internally. No caller conditions, raw settings or commands.');
add('stopAutoJobs', {}, 'jobs', 'stop');
add('enableHackSolvers', {}, 'hackSolvers', 'start', 'Starts multiple solvers; requires three component stop proofs or verified master pause. An upstream ACK does not prove completion.');
add('dismissFailedJobs', { jobs: array(object({ marketId: identifier, jobId: identifier }), 100, 1), marketKey: market }, 'jobs');
add('startValuableSearch', {}, 'valuables', 'start');
add('startValuableSeller', { selectedServers: ids, selectedDownloads: ids }, 'valuables', 'start');
add('stopValuable', {}, 'valuables', 'stop');
add('forceMaintenanceBatch', { serverIds: array(identifier, 100, 1) }, 'valuables', 'one-shot', 'Resolve current server records by ID. Caller cannot supply server objects or addresses.');
add('startIpSearch', {}, 'ipSearch', 'start', 'No original definitive stop exists. Completed/unknown start stays guarded.');
add('updateAlarms', { alarms: array(ALARM_SCHEMA, 32) }, 'alarms');
add('testAlarm', { volume: integer(0, 100), continuous: bool }, 'alarms', 'start');
add('stopAlarm', {}, 'alarms', 'stop');
add('updateAutoRefresh', { autoRefresh: object(Object.fromEntries(MARKETS.map(m => [`${m}_jobs`, bool]))) }, 'autoRefresh');
// Fixed settings operations, NOT a storage API. Runtime-owned fields are absent.
add('setTheme', { theme: enumeration(['default', 'abyss', 'void', 'nebula', 'tactical', 'cyberpunk', 'ocean', 'ember', 'arctic', 'original']) }, 'appearance');
add('setHelperMode', { enabled: bool }, 'helperMode', 'one-shot', 'Original helper mode changes many settings; requires a validated complete side-effect plan.');
add('cor3SetHelperMode', { paused: bool }, 'helperMode', 'pause', 'fixed1.9 coordinator only. Requires persistence plus all-frame ACK. Restore requires manual reload and never replays actions.');
actions.at(-1).sourceVersion = 'fixed-1.9';
for (const [id, group] of [['setAutoJobSolverPanel', 'jobsUi'], ['setAutoValuableSellerPanel', 'valuablesUi'], ['setAutoJobsDebugConsole', 'logsUi'], ['setValuableDebugConsole', 'logsUi']]) add(id, { enabled: bool }, group, 'preference', 'UI visibility only; never represents a verified automation stop.');
for (const [id, group] of [['setAutoUpdateMarkets', 'autoMarkets'], ['setSecretFinder', 'ipSearch'], ['setAutoFinishAllJobs', 'jobs'], ['setAutoSellCheapest', 'autoSell']]) add(id, { enabled: bool }, group, 'toggle', 'Setting false alone is NOT stop proof. Adapter must return unconfirmed unless independently verified.');
add('setAutoJobTypes', { selectedTypes: object(Object.fromEntries(MARKETS.map(m => [m, array(enumeration(JOB_TYPES), JOB_TYPES.length)]))) }, 'jobsSettings');
add('setDecisionModifiers', { loot: integer(0, 9), risk: integer(-9, 0), enabled: bool, autoChoose: bool, noWaitAutoChoose: bool, getRidOfVeterans: bool }, 'decisionsSettings', 'one-shot', 'Automation strategy can submit decisions. Saving settings is not proof of a decision effect. Original-source version only.');
add('setAutoSendMerc', { enabled: bool, autoChooseMerc: bool, autoChooseUsolFirst: bool, ignoreEliteMerc: bool, applyMercCostLimiter: bool, maxMercCost: integer(0, 999999), mercenaryId: identifier }, 'autoSend', 'toggle', 'In-game spending strategy only. Names/reasons are cache-derived; runtime disabledReason is not caller-writable.');
{ const p = actions.at(-1).inputSchema.properties, nullableMercenary = { oneOf: [identifier, literal(null)] }; actions.at(-1).inputSchema = { oneOf: [object({ ...p, enabled: literal(false), mercenaryId: nullableMercenary }), object({ ...p, enabled: literal(true), autoChooseMerc: literal(false) }), object({ ...p, enabled: literal(true), autoChooseMerc: literal(true), mercenaryId: nullableMercenary })] }; }
add('setPinnedTimers', { timers: array(object({ timer: timerRef, pinned: bool }), 64) }, 'timers');
add('setValuableSelection', { selectedServers: ids, selectedDownloads: ids }, 'valuablesSettings');
const fixed = (id, properties = {}, group = id, optional = []) => { add(id, properties, group, 'one-shot', 'fixed1.9 only; original1.7 has no corresponding handler.', optional); actions.at(-1).sourceVersion = 'fixed-1.9'; };
fixed('setThreeSolverDefaults', {}, 'threeSolverPreferences'); actions.at(-1).effect = 'preference'; actions.at(-1).note = 'Save exactly Decrypt, ICE and Simple true. Existing stored master pause and all relevant document gates must already be closed. Never starts solvers or changes Daily/master. Future resume/reload may use these preferences.';
fixed('claimMailbox', {}, 'mailbox');
fixed('requestDroneOptions', {}, 'refresh');
fixed('launchDrone', { locationConfigId: identifier, missionConfigId: identifier, maxCostCredits: money }, 'drone');
fixed('claimDrone', { missionId: identifier }, 'drone');
fixed('repairDrone', { targetDurability: integer(1, 100), maxCostCredits: money }, 'drone');
fixed('resolveDroneEvent', { missionId: identifier, eventId: identifier, optionId: identifier }, 'drone');
fixed('requestDroneArchived', { cursor: { oneOf: [literal(null), identifier] }, limit: integer(1, 100) }, 'refresh');
fixed('sortStash', { mode: enumeration(['smart', 'compact']) }, 'stash');
fixed('batchSellItems', { items: array(object({ itemId: identifier, quantity: integer(1, 1000) }), 100, 1) }, 'stash');
fixed('autoCleanupFailedJobs', { jobs: array(object({ marketId: identifier, jobId: identifier, marketKey: market }), 100, 1) }, 'jobs');
fixed('runAutoCleanupFailedJobs', {}, 'jobs');
fixed('setAutoCleanupFailedJobsEnabled', { enabled: bool }, 'jobs'); actions.at(-1).effect = 'toggle';
fixed('setMarketsPanelEnabled', { enabled: bool }, 'marketsUi'); actions.at(-1).effect = 'preference';
fixed('setAutoDrone', { enabled: bool, repairEnabled: bool, paused: bool }, 'autoDrone'); actions.at(-1).effect = 'toggle';
fixed('setAutoSendMercV19', { enabled: bool, hasInsurance: bool }, 'autoSend'); actions.at(-1).effect = 'toggle';
fixed('setAutoFinishAllJobTypes', { types: array(enumeration(JOB_TYPES), JOB_TYPES.length) }, 'jobsSettings');
actions.at(-1).note = 'fixed1.9 only. Empty types selects all nine supported job types; every type change can reschedule enabled work. Requires reviewed recurring game-resource policy. Saving types is never a stop.';
fixed('setUiLanguage', { language: enumeration(['en', 'zh']) }, 'appearance');
for (const a of actions) {
  a.sourceVersions = a.sourceVersion === 'fixed-1.9' ? ['fixed-1.9'] : ['collectAll', 'updateAlarms', 'testAlarm', 'stopAlarm', 'setHelperMode', 'setAutoSellCheapest', 'setDecisionModifiers', 'setAutoSendMerc'].includes(a.id) ? ['original-1.7.0'] : ['original-1.7.0', 'fixed-1.9'];
  if (a.id === 'setHelperMode') { a.offlineImplemented = 'typed-protocol-only'; a.nativeWired = 'unsupported-original-master'; }
  a.requiresStopScopes = a.id === 'startAutoJobs' ? ['stopAutoJobs'] : ['startValuableSearch', 'startValuableSeller'].includes(a.id) ? ['stopValuable'] : a.id === 'enableHackSolvers' ? ['toggleDecryptSolver', 'toggleIceWallSolver', 'toggleSimpleDecryptSolver'] : ['startIpSearch', 'setSecretFinder', 'setAutoFinishAllJobs', 'setAutoUpdateMarkets', 'setAutoSellCheapest', 'setAutoSendMerc', 'setAutoSendMercV19', 'setAutoDrone', 'setAutoCleanupFailedJobsEnabled', 'updateAutoRefresh', 'setDecisionModifiers', 'setAutoFinishAllJobTypes'].includes(a.id) ? ['cor3SetHelperMode'] : [];
  if (['setSecretFinder', 'setAutoFinishAllJobs', 'setAutoUpdateMarkets', 'setAutoSellCheapest', 'setAutoSendMerc', 'setAutoSendMercV19', 'setAutoDrone', 'setAutoCleanupFailedJobsEnabled', 'updateAutoRefresh', 'setDecisionModifiers', 'setAutoFinishAllJobTypes'].includes(a.id)) a.effect = 'automation-preference';
  a.canTriggerAutomation = ['start', 'toggle', 'automation-preference'].includes(a.effect);
  a.isRunControl = ['start', 'stop', 'toggle', 'pause'].includes(a.effect);
}
const ACTIONS = deepFreeze(actions);
const ACTION_IDS = deepFreeze(ACTIONS.map(a => a.id));
const actionMap = new Map(ACTIONS.map(a => [a.id, a]));
const getAction = id => actionMap.get(id);
const ACTION_SCHEMA = deepFreeze({ oneOf: ACTIONS.map(a => object({ operation: literal(a.id), parameters: a.inputSchema })) });
const UNSUPPORTED = deepFreeze([
  { id: 'devtoolsSendWs', reason: 'Arbitrary WebSocket messages bypass the fixed capability boundary.' },
  { id: 'rawStorageReadWrite', reason: 'No arbitrary keys, credentials, browser/profile reads or storage payloads.' },
  { id: 'rawLogsExportOrDelete', reason: 'Only bounded projected logs; no raw credential-bearing logs or deletion.' },
  { id: 'arbitraryJavaScriptShellURL', reason: 'No eval, scripts, shell, navigation, arbitrary URLs or dynamic commands.' },
  { id: 'realCurrencyPayment', reason: 'Not an executable capability. Hand off using the approved payment flow.' },
  { id: 'accountResetCredentialsSecurity', reason: 'Not an executable capability. Requires separate authorization or handoff.' }
  ,{ id: 'setAutoChatEnabled', reason: 'fixed1.9 source setting is a stub with no implemented chat feature. Not advertised as executable.' }
]);
function isStop(action) { const d = getAction(action.operation); return d.effect === 'stop' || d.effect === 'toggle' && action.parameters.enabled === false || d.effect === 'pause' && action.parameters.paused === true; }
function isStart(action) {
  if (action.operation === 'updateAutoRefresh') return Object.values(action.parameters.autoRefresh).some(Boolean);
  // Original UI's enabled flag gates score modifiers, not every automatic-choice
  // path. An automatic flag cannot be neutralized by setting enabled:false.
  if (action.operation === 'setDecisionModifiers') return action.parameters.autoChoose || action.parameters.noWaitAutoChoose || action.parameters.getRidOfVeterans;
  // fixed1.9 treats [] as all supported job types, not disabled. Every type
  // update reschedules the worker and may activate/expand already-enabled work.
  if (action.operation === 'setAutoFinishAllJobTypes') return true;
  const d = getAction(action.operation); return d.effect === 'start' || ['toggle', 'automation-preference'].includes(d.effect) && action.parameters.enabled === true;
}
function isMitigation(action) {
  if (action.operation === 'updateAutoRefresh') return Object.values(action.parameters.autoRefresh).every(value => value === false);
  if (action.operation === 'setDecisionModifiers') return !isStart(action);
  if (action.operation === 'setAutoFinishAllJobTypes') return false;
  return isStop(action) || getAction(action.operation).effect === 'automation-preference' && action.parameters.enabled === false;
}
// This one controller owns both the saved type selection and its enable flag.
// Permit disabling it across these groups, without treating the write as stop
// proof or broadening stopAutoJobs to cover the independent scheduler lifetime.
function isControllerMitigation(action, guardedGroup) {
  return action.operation === 'setAutoFinishAllJobs' && action.parameters.enabled === false && guardedGroup === 'jobsSettings';
}

return Object.freeze({ MARKETS, TIMERS, JOB_TYPES, READ_SCOPES, ALARM_SCHEMA, ACTIONS, ACTION_IDS, getAction, ACTION_SCHEMA, UNSUPPORTED, isStop, isStart, isMitigation, isControllerMitigation });
})();
const __m5 = (() => {
const { object, enumeration, literal, bool, array, deepFreeze } = __m2;
const COST_OPERATIONS = deepFreeze(['purchaseSpecialist', 'launchExpedition', 'openContainer', 'startAutoJobs', 'launchDrone', 'repairDrone', 'setAutoSendMerc', 'setAutoSendMercV19', 'setAutoDrone', 'setAutoFinishAllJobs', 'setAutoFinishAllJobTypes']);
const COST_MODES = deepFreeze(['bounded', 'unquoted-game-resources', 'unbounded-recurring-game-resources']);
const unquoted = ['launchDrone', 'repairDrone', 'launchExpedition'];
const recurring = ['setAutoSendMerc', 'setAutoSendMercV19', 'setAutoDrone', 'setAutoFinishAllJobs', 'setAutoFinishAllJobTypes'];
const GAME_COST_POLICIES_SCHEMA = deepFreeze(array({ oneOf: COST_OPERATIONS.map(operation => object({ operation: literal(operation), mode: enumeration(['bounded', ...(unquoted.includes(operation) ? ['unquoted-game-resources'] : []), ...(recurring.includes(operation) ? ['unbounded-recurring-game-resources'] : [])]) })) }, COST_OPERATIONS.length));
const GAME_COST_RESPONSE_SCHEMA = deepFreeze(object({ mode: enumeration(COST_MODES), limitEnforced: bool }));
const costModeFor = (installation, operation) => installation.gameCosts?.find(g => g.operation === operation)?.mode ?? 'bounded';

return Object.freeze({ COST_OPERATIONS, COST_MODES, GAME_COST_POLICIES_SCHEMA, GAME_COST_RESPONSE_SCHEMA, costModeFor });
})();
const __m6 = (() => {
// Shared closed vocabulary. No upstream error messages, stack traces or URLs.
const SAFE_CODES = Object.freeze([
  'MASTER_CLEANUP_PENDING',
  'MASTER_WRITE_PENDING', 'MASTER_STORAGE_UNCONFIRMED', 'MASTER_DOCUMENTS_CHANGED', 'MASTER_RESUME_SUPERSEDED', 'MASTER_TARGET_UNCONFIRMED', 'MASTER_CLEANUP_UNCONFIRMED', 'MASTER_FRAME_UNCONFIRMED', 'MASTER_STATE_CHANGED', 'MASTER_INITIALIZATION_FAILED', 'MASTER_PROBE_UNCONFIRMED', 'MASTER_ACK_UNCONFIRMED', 'MASTER_STATE_UNCONFIRMED',
  'OK', 'INVALID_ARGUMENTS', 'TOOL_NOT_FOUND', 'SCOPE_DENIED', 'ACCOUNT_UNKNOWN', 'PROFILE_MISMATCH', 'TARGET_CHANGED', 'ACCOUNT_OFFLINE', 'SESSION_CLOSED', 'WRITE_BUSY', 'RESULT_UNKNOWN', 'STOP_UNCONFIRMED', 'GUARD_ACTIVE', 'STALE_REVISION', 'OPERATION_CONFLICT', 'OPERATION_NOT_FOUND', 'OPERATION_CANCELLED', 'TICKET_INVALID', 'TICKET_EXPIRED', 'TICKET_CONNECTION_MISMATCH', 'CAPACITY_REACHED', 'JOURNAL_UNAVAILABLE', 'INVALID_RESPONSE', 'UNSUPPORTED', 'ADAPTER_ERROR', 'RELOAD_REQUIRED',
  'ADAPTER_DISABLED', 'INVALID_RUNTIME', 'TARGET_AMBIGUOUS', 'IDENTITY_UNKNOWN', 'IDENTITY_CHANGED', 'STALE_GENERATION', 'ADAPTER_IO_FAILED', 'INVALID_STATE', 'DOCUMENT_RELOAD_REQUIRED', 'ACCOUNT_OPERATION_UNCONFIRMED', 'UNSUPPORTED_SOURCE_VERSION',
  'CONTEXT_AMBIGUOUS', 'DATA_NOT_READY', 'COST_UNIT_UNVERIFIED', 'BUDGET_EXCEEDED', 'NO_VERIFIED_MAPPING', 'ITEM_PAYMENT_UNSUPPORTED', 'QUOTE_NOT_VERIFIED', 'DECISION_NOT_CURRENT', 'INSUFFICIENT_BATTERY', 'INVALID_CONTEXT',
  'DATA_OBSERVED', 'PREFERENCE_SAVED', 'PREFERENCE_ONLY_NOT_STOP', 'SETTING_SAVED_AUTOMATION_UNCONFIRMED', 'UPSTREAM_ERROR_REPORTED', 'UPSTREAM_EVENT_RECORDED', 'ACK_UNCONFIRMED', 'STOP_ACK_REQUIRED', 'MASTER_ACK_INCOMPLETE', 'MASTER_PERSISTENCE_FAILED', 'FRAME_ACK_MISSING', 'OBSERVATION_TIMEOUT', 'OBSERVATION_UNSUPPORTED', 'GAME_COST_POLICY_REQUIRED', 'GAME_COST_UNQUOTED', 'GAME_COST_RECURRING_UNBOUNDED',
  'ORIGINAL_MASTER_STOP_UNSUPPORTED', 'ORIGINAL_MERCENARY_ARGUMENT_IGNORED', 'TRUSTED_PRICE_HYDRATION_REQUIRED', 'TRUSTED_CONFIG_AND_PRICE_HYDRATION_REQUIRED', 'TRUSTED_JOB_AND_DEPOSIT_HYDRATION_REQUIRED', 'TRUSTED_SERVER_HYDRATION_REQUIRED', 'TRUSTED_MERCENARY_AND_PRICE_HYDRATION_REQUIRED', 'OFFLINE_VALIDATED_ONLY',
  'STALE_CONTEXT', 'DATA_TRUNCATED', 'COST_QUOTE_UNAVAILABLE', 'MASTER_PAUSED_DOCUMENT_LATCHED', 'MANUAL_RELOAD_REQUIRED', 'READ_COMPLETE', 'ALARM_STOPPED', 'STOP_ACK_UNAVAILABLE', 'ACCEPTED_NOT_COMPLETED', 'COMMAND_OUTCOME_UNCONFIRMED', 'EFFECT_UNVERIFIED', 'RECONCILIATION_UNAVAILABLE', 'RECONCILIATION_PENDING', 'CURRENT_STATE_CONFIRMED', 'ADAPTER_RESTART_UNCONFIRMED', 'NO_FAILED_JOBS', 'LOCAL_WRITE_GUARD_CLOSED', 'RECONCILIATION_UNSUPPORTED', 'STATE_NOT_CONFIRMED', 'STATE_VERIFIED_AFTER_DISPATCH', 'PREFERENCE_UNCHANGED_NOOP', 'AUTOMATION_GATE_CLOSED', 'AUTOMATION_STATUS_UNAVAILABLE', 'AUTOMATION_COMMAND_FAILED', 'AUTOMATION_SUPERSEDED', 'STOP_LIFECYCLE_UNCONFIRMED', 'OBSERVED_LOCAL_LIFECYCLE_STOPPED', 'LOCAL_LIFECYCLE_ALREADY_STOPPED', 'THREE_SOLVER_DEFAULTS_SAVED', 'PREFERENCE_SAVE_REQUIRES_PAUSE', 'PREFERENCE_SAVE_FRAME_UNCONFIRMED', 'PREFERENCE_SAVE_STATE_CHANGED'
]);
const safeCode = code => SAFE_CODES.includes(code) ? code : 'ADAPTER_ERROR';
const STAGES = Object.freeze(['read', 'prepare', 'commit', 'dispatch', 'observe', 'recover']);
const safeStage = value => STAGES.includes(value) ? value : 'dispatch';

return Object.freeze({ SAFE_CODES, safeCode, STAGES, safeStage });
})();
const __m7 = (() => {
// Read-only, fixed current-resource reconciliation. These receipts come only
// from the bound adapter, never from MCP/model-provided confirmation fields.
const { object, enumeration, identifier, tokenSchema, targetSchema, operationId, integer, bool, literal, deepFreeze, valid } = __m2;
const { ACTIONS, ACTION_IDS } = __m4;
const { SAFE_CODES, STAGES } = __m6;
const RECONCILABLE_OPERATIONS = deepFreeze(['equipHardware', 'equipSoftware', 'unequipSoftware', 'respondDecision']);
const RECONCILE_ACTION_SCHEMA = deepFreeze({ oneOf: ACTIONS.filter(a => RECONCILABLE_OPERATIONS.includes(a.id)).map(a => object({ operation: literal(a.id), parameters: a.inputSchema })) });
const RECONCILE_REQUEST_SCHEMA = deepFreeze(object({ target: targetSchema, operationId, action: RECONCILE_ACTION_SCHEMA, expectedGeneration: tokenSchema, expectedRevision: identifier }));
const observed = { documentId: identifier, generation: tokenSchema, observedAt: integer(1, Number.MAX_SAFE_INTEGER), revision: identifier };
const RECONCILIATION_EVIDENCE_SCHEMA = deepFreeze({ oneOf: [
  object({ kind: literal('loadout-current-state'), ...observed, moduleConfigId: identifier, position: enumeration(['hardware', 'software']), present: bool, complete: literal(true) }),
  object({ kind: literal('decision-current-state'), ...observed, expeditionId: identifier, messageId: identifier, selectedOption: identifier, resolved: literal(true) })
] });
const binding = { target: targetSchema, generation: tokenSchema, operationId, stage: enumeration(STAGES), nextCapability: enumeration(ACTION_IDS) };
const RECONCILE_RESPONSE_SCHEMA = deepFreeze({ oneOf: [
  object({ ...binding, status: literal('reconciled'), code: literal('CURRENT_STATE_CONFIRMED'), evidence: RECONCILIATION_EVIDENCE_SCHEMA }, ['stage', 'nextCapability']),
  object({ ...binding, status: enumeration(['unconfirmed', 'unsupported']), code: enumeration(SAFE_CODES) }, ['stage', 'nextCapability'])
] });
function evidenceMatches(action, evidence) {
  if (!valid(RECONCILIATION_EVIDENCE_SCHEMA, evidence)) return false;
  const p = action.parameters;
  if (action.operation === 'respondDecision') return evidence.kind === 'decision-current-state' && evidence.expeditionId === p.expeditionId && evidence.messageId === p.messageId && evidence.selectedOption === p.selectedOption && evidence.resolved === true;
  if (!['equipHardware', 'equipSoftware', 'unequipSoftware'].includes(action.operation)) return false;
  return evidence.kind === 'loadout-current-state' && evidence.moduleConfigId === p.moduleConfigId && evidence.position === (action.operation === 'equipHardware' ? 'hardware' : 'software') && evidence.present === (action.operation !== 'unequipSoftware') && evidence.complete === true;
}
const RECONCILIATION_EVENT_SCHEMA = deepFreeze(object({ v: literal(3), kind: literal('reconciliation'), target: targetSchema, operationId, action: RECONCILE_ACTION_SCHEMA, generation: tokenSchema, originalRevision: identifier, dispatchStartedAt: integer(0, Number.MAX_SAFE_INTEGER), connectionId: identifier, at: integer(0, Number.MAX_SAFE_INTEGER), evidence: RECONCILIATION_EVIDENCE_SCHEMA }));

return Object.freeze({ RECONCILABLE_OPERATIONS, RECONCILE_ACTION_SCHEMA, RECONCILE_REQUEST_SCHEMA, RECONCILIATION_EVIDENCE_SCHEMA, RECONCILE_RESPONSE_SCHEMA, evidenceMatches, RECONCILIATION_EVENT_SCHEMA });
})();
const __m3 = (() => {
// Browser-safe, fixed v3 envelopes. No caller-provided channel, script or storage key.
const { object, literal, integer, identifier, tokenSchema, targetSchema, operationId, enumeration, array, bool, validate, valid, fail } = __m2;
const { ACTION_SCHEMA, ACTION_IDS, READ_SCOPES } = __m4;
const { GAME_COST_POLICIES_SCHEMA, GAME_COST_RESPONSE_SCHEMA } = __m5;
const { SAFE_CODES, STAGES } = __m6;
const { RECONCILE_REQUEST_SCHEMA, RECONCILE_RESPONSE_SCHEMA } = __m7;
const VERSION = 3;
const LIMIT = 65536;
const originSchema = { type: 'string', pattern: '^chrome-extension://[a-p]{32}/$', minLength: 52, maxLength: 52 };
const bindingSchema = object({ target: targetSchema, tabId: integer(0, 2147483647), documentId: tokenSchema, generation: tokenSchema });
const inspectOptionsSchema = { oneOf: [object({ mode: literal('binding') }), object({ mode: literal('view'), view: enumeration(READ_SCOPES), offset: integer(0, 10000), limit: integer(1, 40) })] };
const inspectArgsSchema = object({ target: targetSchema, options: inspectOptionsSchema });
const dispatchArgsSchema = object({ target: targetSchema, operationId, action: ACTION_SCHEMA, expectedGeneration: tokenSchema, expectedRevision: identifier });
const helloSchema = object({ v: literal(3), type: literal('hello'), ...bindingSchema.properties, clientNonce: tokenSchema });
const grantSchema = object({ v: literal(3), type: literal('grant'), ...bindingSchema.properties, clientNonce: tokenSchema, sessionId: tokenSchema, expiresAt: integer(0, Number.MAX_SAFE_INTEGER), readScopes: array(enumeration(READ_SCOPES), READ_SCOPES.length), writeScopes: array(enumeration(ACTION_IDS), ACTION_IDS.length), gameCosts: GAME_COST_POLICIES_SCHEMA, allowAutoRenew: bool });
const requestId = { type: 'string', pattern: '^r[1-9][0-9]{0,15}$', maxLength: 17 };
const head = { v: literal(3), type: literal('request'), sessionId: tokenSchema, seq: integer(1, Number.MAX_SAFE_INTEGER), requestId };
const requestSchema = { oneOf: [object({ ...head, op: literal('inspect'), args: inspectArgsSchema }), object({ ...head, op: literal('dispatch'), args: dispatchArgsSchema }), object({ ...head, op: literal('reconcile'), args: RECONCILE_REQUEST_SCHEMA })] };
const dispatchResultSchema = object({ target: targetSchema, generation: tokenSchema, operationId, status: enumeration(['completed', 'rejected', 'unconfirmed', 'accepted', 'unsupported']), code: enumeration(SAFE_CODES), stopped: bool, reloadRequired: bool, localMasterClosed: bool, gameCost: GAME_COST_RESPONSE_SCHEMA, stage: enumeration(STAGES), nextCapability: enumeration(ACTION_IDS) }, ['code', 'stopped', 'reloadRequired', 'gameCost', 'stage', 'nextCapability', 'localMasterClosed']);
const policyInstall = object({ target: targetSchema, extensionOrigin: originSchema, readScopes: array(enumeration(READ_SCOPES), READ_SCOPES.length), writeScopes: array(enumeration(ACTION_IDS), ACTION_IDS.length), gameCosts: GAME_COST_POLICIES_SCHEMA }, ['gameCosts']);
const transportPolicySchema = object({ version: literal(3), enabled: bool, allowAutoRenew: bool, sessionTtlMs: integer(1000, 600000), nativeHost: literal('com.cor3.helper_full_candidate'), installations: array(policyInstall, 64) }, ['allowAutoRenew']);
function validateTransportPolicy(value, { requireEnabled = false } = {}) {
  const result = validate(transportPolicySchema, value, 'POLICY_INVALID');
  const ids = result.installations.map(i => `${i.target.accountId}/${i.target.profileInstallationId}`);
  if (new Set(ids).size !== ids.length || requireEnabled && (!result.enabled || !ids.length)) fail('POLICY_DISABLED');
  // An installation means exactly one reviewed extension origin, not enrollment.
  const origins = new Map();
  for (const i of result.installations) { const old = origins.get(i.target.profileInstallationId); if (old && old !== i.extensionOrigin || new Set((i.gameCosts || []).map(c => c.operation)).size !== (i.gameCosts || []).length || i.gameCosts?.some(c => !i.writeScopes.includes(c.operation))) fail('POLICY_INVALID'); origins.set(i.target.profileInstallationId, i.extensionOrigin); }
  return result;
}
function brokerPolicy(policy) { return { version: 3, installations: policy.installations.map(({ target, readScopes, writeScopes, gameCosts }) => ({ target, readScopes, writeScopes, ...(gameCosts ? { gameCosts } : {}) })) }; }
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
function bounded(value) {
  let text; try { text = JSON.stringify(value); } catch { fail('INVALID_RESPONSE'); }
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > LIMIT) fail('FRAME_TOO_LARGE');
  return value;
}
function validateInspect(value) {
  if (!(exact(value, ['target', 'generation', 'revision', 'data']) || exact(value, ['target', 'generation', 'revision', 'data', 'bindingDocumentId', 'recoveryEpoch']) && valid(identifier, value.bindingDocumentId) && valid(identifier, value.recoveryEpoch)) || !valid(targetSchema, value.target) || !valid(tokenSchema, value.generation) || !valid(identifier, value.revision) || !value.data || Array.isArray(value.data) || typeof value.data !== 'object' || Object.keys(value.data).some(k => !READ_SCOPES.includes(k))) fail('INVALID_RESPONSE');
  bounded(value); return structuredClone(value);
}
function validateResponse(value, op) {
  if (!exact(value, ['v', 'type', 'sessionId', 'seq', 'requestId', 'result']) || value.v !== 3 || value.type !== 'response' || !valid(tokenSchema, value.sessionId) || !valid(integer(1, Number.MAX_SAFE_INTEGER), value.seq) || !valid(requestId, value.requestId)) fail('INVALID_RESPONSE');
  bounded(value);
  const r = value.result;
  if (exact(r, ['ok', 'code']) && r.ok === false && ['ACCOUNT_OFFLINE', 'INVALID_RESPONSE', 'SCOPE_DENIED', 'TARGET_CHANGED', 'ADAPTER_ERROR', 'UNSUPPORTED'].includes(r.code)) return value;
  if (!exact(r, ['ok', 'value']) || r.ok !== true) fail('INVALID_RESPONSE');
  if (op === 'inspect') validateInspect(r.value); else validate(op === 'reconcile' ? RECONCILE_RESPONSE_SCHEMA : dispatchResultSchema, r.value, 'INVALID_RESPONSE');
  return value;
}

return Object.freeze({ VERSION, LIMIT, originSchema, bindingSchema, inspectOptionsSchema, inspectArgsSchema, dispatchArgsSchema, helloSchema, grantSchema, requestSchema, dispatchResultSchema, transportPolicySchema, validateTransportPolicy, brokerPolicy, exact, bounded, validateInspect, validateResponse });
})();
const __m10 = (() => {
// Fixed, read-only automation interface. Qualified closure combines isolated
// scheduler ownership with a fresh MAIN observation, not authentication.
// No raw preferences, page text, physical-drain or server-rollback claim escapes.
const { object, literal, enumeration, integer, identifier, bool, validate } = __m2;
const AUTOMATION_CHANNEL = 'cor3-full-automation-status/v1';
const AUTOMATION_OPERATIONS = Object.freeze({ toggleDailyHackSolver: 'daily', toggleIceWallSolver: 'ice', toggleDecryptSolver: 'decrypt', toggleSimpleDecryptSolver: 'simple' });
const state = enumeration(['running', 'stopped', 'unknown']);
const feature = object({ state, observedState: state, evidence: enumeration(['observed-local-lifecycle', 'advisory-main', 'unavailable']), runId: identifier, abortGeneration: integer(0, Number.MAX_SAFE_INTEGER), guardClosed: bool, queuesInvalidated: bool, activeRunsAborted: bool, isolatedSchedulerClosed: bool });
const AUTOMATION_PROBE_SCHEMA = object({ version: literal(1), gate: object({ ready: bool, allowed: bool, reloadRequired: bool }), daily: feature, ice: feature, decrypt: feature, simple: feature }, ['decrypt', 'simple']);
function safeAutomationProbe(value) {
  const p = validate(AUTOMATION_PROBE_SCHEMA, value, 'INVALID_RESPONSE');
  // This is observed local effect closure, NOT independent authentication,
  // physical Promise drain, all-frame state, or reversal of prior server work.
  return { version: 1, gate: { ...p.gate }, ...Object.fromEntries(['daily', 'ice', 'decrypt', 'simple'].filter(name => p[name]).map(name => {
    const f = p[name], closed = f.evidence === 'observed-local-lifecycle' && f.isolatedSchedulerClosed && f.guardClosed && f.queuesInvalidated && f.activeRunsAborted && f.state === 'stopped';
    return [name, { ...f, state: closed ? 'stopped' : 'unknown', guardClosed: closed, queuesInvalidated: closed, activeRunsAborted: closed }];
  })) };

}
function unavailableAutomationProbe() {
  const f = { state: 'unknown', observedState: 'unknown', evidence: 'unavailable', runId: 'unobserved', abortGeneration: 0, guardClosed: false, queuesInvalidated: false, activeRunsAborted: false, isolatedSchedulerClosed: false };
  return { version: 1, gate: { ready: false, allowed: false, reloadRequired: false }, daily: { ...f }, ice: { ...f } };
}
function automationRows(prefs, probe, observedAt, gateKnown = true) {
  return ['daily', 'ice'].map(feature => ({ feature,
    requestedEnabled: typeof prefs[feature === 'daily' ? 'autoDailyHackEnabled' : 'autoIceWallEnabled'] === 'boolean' ? prefs[feature === 'daily' ? 'autoDailyHackEnabled' : 'autoIceWallEnabled'] : null,
    preferenceScope: 'profile', actualState: probe[feature].state, observedState: probe[feature].observedState,
    evidence: probe[feature].evidence, isolatedSchedulerClosed: probe[feature].isolatedSchedulerClosed,
    gateReady: gateKnown ? probe.gate.ready : null, gateAllowed: gateKnown ? probe.gate.allowed : null, reloadRequired: gateKnown ? probe.gate.reloadRequired : null,
    at: observedAt, scope: 'top-frame-document', textOmitted: true
  }));
}

// Deliberately a separate view: existing automationStatus remains unchanged.
function threeSolverRows(prefs, probe, observedAt, gateKnown = true) {
  return [['decrypt','autoDecryptEnabled'],['ice','autoIceWallEnabled'],['simple','autoSimpleDecryptEnabled']].map(([feature,key]) => {
    const f = probe[feature] || unavailableAutomationProbe().daily;
    return {feature, requestedEnabled: typeof prefs[key] === 'boolean' ? prefs[key] : null, preferenceScope:'profile', actualState:f.state, observedState:f.observedState, evidence:f.evidence, isolatedSchedulerClosed:f.isolatedSchedulerClosed, gateReady:gateKnown ? probe.gate.ready : null, gateAllowed:gateKnown ? probe.gate.allowed : null, reloadRequired:gateKnown ? probe.gate.reloadRequired : null, at:observedAt, scope:'top-frame-document', textOmitted:true};
  });
}

return Object.freeze({ AUTOMATION_CHANNEL, AUTOMATION_OPERATIONS, AUTOMATION_PROBE_SCHEMA, safeAutomationProbe, unavailableAutomationProbe, automationRows, threeSolverRows });
})();
const __m9 = (() => {
// Fixed isolated-world probes. Browser-owned frame/document IDs are never page claims.
const { safeAutomationProbe } = __m10;
const { valid, identifier } = __m2;
const { exact, bounded } = __m3;
const SIMPLE_FRAME_READY = 'cor3-simple-frame-ready/v1';
const SIMPLE_FRAME_DIRTY = 'cor3-simple-frame-dirty/v1';
function validSimpleFrameHint(value) { return exact(value,['type']) && [SIMPLE_FRAME_READY,SIMPLE_FRAME_DIRTY].includes(value.type); }
const simpleRoute = value => { try {const u=new URL(value);return typeof value==='string' && value.length<=2048 && u.protocol==='https:' && u.hostname==='svc-corie.cor3.gg' && !u.port && !u.username && !u.password && ['/games/simple-hack','/games/simple-hack/'].includes(u.pathname);}catch{return false;} };
function validSimpleFrameContext(value) { return exact(value,['tabId','frameId','chromeDocumentId','url','topUrl']) && Number.isSafeInteger(value.tabId) && value.tabId>=0 && Number.isSafeInteger(value.frameId) && value.frameId>0 && valid(identifier,value.chromeDocumentId) && simpleRoute(value.url) && typeof value.topUrl==='string' && value.topUrl.length<=8192; }
function simpleFrameSenderContext(sender, extensionId) {
  if(sender?.id!==extensionId || sender.documentLifecycle!=='active' || !simpleRoute(sender.url) || sender.origin!=='https://svc-corie.cor3.gg')return null;
  const context={tabId:sender.tab?.id,frameId:sender.frameId,chromeDocumentId:sender.documentId,url:sender.url,topUrl:sender.tab?.url};
  return validSimpleFrameContext(context)?context:null;
}
async function simpleFrameCensus() {
  const root = window === window.top;
  let simple = false, unsupported = false;
  try { const u = new URL(location.href); unsupported = !root && u.protocol === 'https:' && u.hostname === 'svc-corie.cor3.gg' && !u.port && !u.username && !u.password && u.pathname.startsWith('/games/simple-hack'); simple = !root && u.protocol === 'https:' && u.hostname === 'svc-corie.cor3.gg' && !u.port && !u.username && !u.password && (u.pathname === '/games/simple-hack' || u.pathname === '/games/simple-hack/'); } catch {}
  if (root) return {kind:'root'};
  if (!simple) return {kind:unsupported ? 'unsupported' : 'other'};
  let probe = null;
  try { probe = await globalThis.Cor3ObservableControls?.probe(); } catch {}
  let collectorRevision = null;
  try { const revision = globalThis.Cor3SimpleFrameCollector?.revision(); if(Number.isSafeInteger(revision) && revision>=0 && revision<=1000000)collectorRevision=revision; } catch {}
  return {kind:'simple', probe, collectorRevision};
}
function simpleFrameCollection(epoch, expiresAt, clear = false, owner = null, collect = false, expectedRevision = null) {
  const c = globalThis.Cor3SimpleFrameCollector;
  if (!c) return {ready:false};
  if (clear) { c.clear(epoch); return {ready:false}; }
  if (!c.configure(epoch, expiresAt, owner, collect, expectedRevision)) return {ready:false};
  const result = c.read(epoch, collect);
  return result ? {ready:true, errors:result.errors, dropped:result.dropped} : {ready:false};
}
const rootKey = d => JSON.stringify([d.tabId,d.accountId,d.profileInstallationId,d.documentId,d.generation]);
const unknown = () => ({childHintCoverage:'bounded-best-effort',childHintCoverageLimited:false,childHistoryScope:'exact-root-in-memory',childHistoryPersistence:'worker-lifetime-only',childCaptureScope:'current-grant-only',childPrebindErrorsAvailable:false,childOfflineCaptureAvailable:false,childCoverage:'unavailable',childAggregateState:'unknown',childErrorsCoverage:'unavailable',childHistoryTruncated:false,rows:[],logs:[]});
function createSimpleFrameTelemetry({chromeApi, checked, now, nonce, deadline, cryptoApi}) {
  let lease = null, busy = false, acceptedHistory = null, pendingFrameHint = null, hintScheduled = false, hintRunning = false;
  function pruneHistory() { if(acceptedHistory) acceptedHistory.rows=acceptedHistory.rows.filter(row=>now()>=row.at && now()-row.at<=600000); }
  // Tombstones must not evict into reattribution. Exhaustion fails closed.
  const owners = new Map();
  const check = s => { if (!s || s !== lease || !s.live() || now() < s.createdAt || now() >= s.expiresAt) throw new Error('SESSION_CLOSED'); };
  async function fence(s, guard) { guard?.(); check(s); try { await checked(s.document); } catch(error) { if(lease===s && error?.code==='IDENTITY_CHANGED')acceptedHistory=null; throw error; } check(s); guard?.(); }
  const execute = async request => deadline(chromeApi.scripting.executeScript(request), 4000);
  function release() {
    const old = lease; lease = null; pendingFrameHint=null;
    if (!old) return;
    const ids = [...old.documents]; old.seen.clear(); pruneHistory();
    if (ids.length && chromeApi.scripting?.executeScript) void execute({target:{tabId:old.document.tabId,documentIds:ids},world:'ISOLATED',func:simpleFrameCollection,args:[old.epoch,0,true]}).catch(()=>{});
  }
  function bind(document, {live,expiresAt,readScopes}) {
    release();
    if(acceptedHistory && acceptedHistory.logicalRoot !== rootKey(document)) acceptedHistory=null;
    if (!readScopes.some(scope => ['logs','threeSolverStatus'].includes(scope))) return;
    lease = {document:structuredClone(document),live,expiresAt,createdAt:now(),epoch:nonce(),collect:readScopes.includes('logs'),seen:new Map(),documents:new Set(),hintStarts:0,hintWindowStart:now(),hintWindowStarts:0,hintLimited:false};
  }
  async function census(s, guard) {
    await fence(s,guard);
    const result = await execute({target:{tabId:s.document.tabId,allFrames:true},world:'ISOLATED',func:simpleFrameCensus});
    await fence(s,guard); bounded(result);
    if (!Array.isArray(result) || !result.length || result.length > 32) throw new Error('CENSUS_UNAVAILABLE');
    const ids = new Set(), frames = new Set(); let roots = 0;
    for (const row of result) {
      if (row.error || !Number.isSafeInteger(row.frameId) || row.frameId < 0 || !valid(identifier,row.documentId) || frames.has(row.frameId) || ids.has(row.documentId)) throw new Error('CENSUS_UNAVAILABLE');
      frames.add(row.frameId); ids.add(row.documentId);
      if (row.frameId === 0) { if (!exact(row.result,['kind']) || row.result.kind !== 'root') throw new Error('CENSUS_UNAVAILABLE'); roots++; }
      else if (['other','unsupported'].includes(row.result?.kind)) { if (!exact(row.result,['kind'])) throw new Error('CENSUS_UNAVAILABLE'); }
      else if (row.result?.kind !== 'simple' || !exact(row.result,['kind','probe','collectorRevision']) || row.result.kind === 'simple' && row.result.collectorRevision !== null && (!Number.isSafeInteger(row.result.collectorRevision) || row.result.collectorRevision < 0 || row.result.collectorRevision > 1000000)) throw new Error('CENSUS_UNAVAILABLE');
    }
    if (roots !== 1) throw new Error('CENSUS_UNAVAILABLE');
    return result;
  }
  async function readInternal(document, guard, hintContext) {
    const s = lease, result = unknown();
    if (busy || !chromeApi.scripting?.executeScript || !s || rootKey(s.document) !== rootKey(document)) return result;
    result.childHintCoverageLimited=s.hintLimited;
    busy = true;
    try {
      guard?.(); await fence(s,guard);
      const before = await census(s,guard); guard?.();
      if(hintContext && !before.some(row=>row.frameId===hintContext.frameId && row.documentId===hintContext.chromeDocumentId && row.result.kind==='simple'))throw new Error('HINT_DOCUMENT_CHANGED');
      const root = before.find(row=>row.frameId===0).documentId, key = rootKey(document)+'/'+root;
      if(acceptedHistory && acceptedHistory.key !== key) acceptedHistory=null;
      const children = before.filter(row=>row.result.kind==='simple');
      const owner = Array.from(new Uint8Array(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(key))),b=>b.toString(16).padStart(2,'0')).join('');
      await fence(s,guard); guard?.();
      for (const child of children) {
        const childKey = document.tabId+'/'+child.documentId;
        if (owners.has(childKey) && owners.get(childKey) !== key || !owners.has(childKey) && owners.size >= 256) throw new Error('CHILD_OWNER_CHANGED');
        owners.set(childKey,key);
      }
      let collected = [], complete = true;
      if (children.length) {
        for(const child of children) s.documents.add(child.documentId);
        if(s.documents.size>32) {release();return unknown();}
        await fence(s,guard); guard?.();
        for (let offset=0;offset<children.length;offset+=4) {
          await fence(s,guard);
          const batch = await Promise.all(children.slice(offset,offset+4).map(child=>execute({target:{tabId:document.tabId,documentIds:[child.documentId]},world:'ISOLATED',func:simpleFrameCollection,args:[s.epoch,Math.min(s.expiresAt,now()+600000),false,owner,s.collect,child.result.collectorRevision]})));
          await fence(s,guard);
          for (const rows of batch) { if(!Array.isArray(rows) || rows.length!==1)throw new Error('COLLECTION_UNAVAILABLE');collected.push(...rows); }
        }
        await fence(s,guard); guard?.(); bounded(collected);
        if (!Array.isArray(collected) || collected.length !== children.length) throw new Error('COLLECTION_UNAVAILABLE');
        const seen = new Set();
        for (const row of collected) {
          if (row.error || !children.some(child=>child.frameId===row.frameId && child.documentId===row.documentId) || seen.has(row.documentId)) throw new Error('COLLECTION_UNAVAILABLE');
          seen.add(row.documentId);
          if (row.result?.ready === false && exact(row.result,['ready'])) { complete=false; continue; }
          const r = row.result;
          if (!exact(r,['ready','errors','dropped']) || r.ready !== true || typeof r.dropped !== 'boolean' || !Array.isArray(r.errors) || r.errors.length > 16) throw new Error('COLLECTION_UNAVAILABLE');
          let previous = 0;
          for (const e of r.errors) { if (!exact(e,['sequence','code']) || !['SOLVER_FAILED','TIMEOUT'].includes(e.code) || !Number.isSafeInteger(e.sequence) || e.sequence <= previous || e.sequence > 1000000) throw new Error('COLLECTION_UNAVAILABLE'); previous=e.sequence; }
        }
      }
      const after = await census(s,guard); guard?.();
      if(hintContext && !after.some(row=>row.frameId===hintContext.frameId && row.documentId===hintContext.chromeDocumentId && row.result.kind==='simple'))throw new Error('HINT_DOCUMENT_CHANGED');
      const afterRoot=after.find(row=>row.frameId===0).documentId;
      if(acceptedHistory && acceptedHistory.key !== rootKey(document)+'/'+afterRoot)acceptedHistory=null;
      const signature = values => JSON.stringify(values.map(row=>[row.frameId,row.documentId,row.result.kind]).sort((a,b)=>a[0]-b[0]));
      if (signature(before) !== signature(after)) throw new Error('CENSUS_CHANGED');
      await fence(s,guard); guard?.();
      // Never equate this observed subset to a complete browser frame topology.
      result.childCoverage=after.some(row=>row.result.kind==='unsupported') ? 'incomplete' : 'observed-documents-only';
      result.childErrorsCoverage=after.some(row=>row.result.kind==='unsupported') ? 'unavailable' : !children.length ? 'none-observed' : s.collect && complete ? 'collector-configured-only' : 'unavailable';
      result.rows=after.filter(row=>row.result.kind==='simple').map(row=> {
        let p; try { p=safeAutomationProbe(row.result.probe); } catch {}
        const f=p?.simple, ready=p?.gate.ready===true && !!f && collected.find(c=>c.documentId===row.documentId)?.result?.ready===true;
        if (!ready) result.childCoverage='incomplete';
        return {feature:'simple',frameId:row.frameId,browserDocumentId:row.documentId,scope:'bound-child-document',actualState:ready?f.state:'unknown',observedState:ready?f.observedState:'unknown',evidence:ready?f.evidence:'unavailable',isolatedSchedulerClosed:ready?f.isolatedSchedulerClosed:false,gateReady:p?.gate.ready??false,gateAllowed:p?.gate.allowed??null,reloadRequired:p?.gate.reloadRequired??null,at:now(),textOmitted:true};
      });
      pruneHistory();
      if(s.collect && !acceptedHistory)acceptedHistory={key,logicalRoot:rootKey(document),rows:[],truncated:false};
      for (const row of s.collect ? collected : []) {
        s.documents.add(row.documentId);
        if (!row.result.ready) continue;
        if (row.result.dropped) acceptedHistory.truncated=true;
        for (const e of row.result.errors) {
          if (e.sequence <= (s.seen.get(row.documentId)||0)) continue;
          s.seen.set(row.documentId,e.sequence);
          if(acceptedHistory.rows.length>=100) {acceptedHistory.rows.shift();acceptedHistory.truncated=true;}
          acceptedHistory.rows.push(Object.freeze({source:'simpleLifecycle',feature:'simple',code:e.code,phase:'run',stage:'observe',at:now(),timestampKind:'background-receipt',frameId:row.frameId,browserDocumentId:row.documentId,rootBrowserDocumentId:root,scope:'bound-child-history',historical:true,textOmitted:true,correlatedToOperation:false,attribution:'unattributed-observation'}));
        }
      }
      if(acceptedHistory?.rows.length>100) {acceptedHistory.rows=acceptedHistory.rows.slice(-100);acceptedHistory.truncated=true;}
      // Bound identity/sequence tables too. Do not evict and accept duplicates.
      if (s.documents.size>32 || s.seen.size>32) { release(); return unknown(); }
      pruneHistory();
      result.logs=s.collect ? structuredClone(acceptedHistory?.rows||[]) : []; result.childHistoryTruncated=s.collect && acceptedHistory?.truncated===true;
      return result;
    } catch {
      // A failed identity fence invalidates the entire collection lease. Partial
      // census failures expose no new state or errors, even if scripts completed.
      try { await fence(s); } catch { if(lease===s) release(); }
      return unknown();
    } finally {busy=false;scheduleFrameHint();}
  }
  async function read(document, guard, hintContext) {
    let open=true;
    const workGuard=()=>{if(!open)throw new Error('COLLECTION_TIMEOUT');guard?.();};
    try { return await deadline(readInternal(document,workGuard,hintContext),3500); }
    catch { return unknown(); }
    finally {open=false;}
  }
  function hintBudget(s) {
    if(now()-s.hintWindowStart>=1000) {s.hintWindowStart=now();s.hintWindowStarts=0;}
    if(s.hintStarts>=16 || s.hintWindowStarts>=2 || now()<s.hintWindowStart) {s.hintLimited=true;return false;}
    return true;
  }
  function scheduleFrameHint() {
    if(hintScheduled || hintRunning || busy || !pendingFrameHint)return;
    hintScheduled=true;
    void Promise.resolve().then(async()=>{
      hintScheduled=false;
      if(hintRunning || busy || !pendingFrameHint)return;
      const item=pendingFrameHint;pendingFrameHint=null;
      try {check(item.lease);}catch{return;}
      if(!item.lease.collect || !hintBudget(item.lease))return;
      item.lease.hintStarts++;item.lease.hintWindowStarts++;hintRunning=true;
      try {await read(item.lease.document,()=>check(item.lease),item.context);}
      finally {hintRunning=false;scheduleFrameHint();}
    }).catch(()=>{});
  }
  function notifyFrame(context, hint) {
    const s=lease;
    if(!validSimpleFrameHint(hint) || !validSimpleFrameContext(context) || !s?.collect || context.tabId!==s.document.tabId || context.topUrl!==s.document.url)return false;
    try {check(s);}catch{return false;}
    if(!hintBudget(s))return false;
    // Latest pending hint is bounded and belongs to this exact private lease.
    // The one-field hint never supplies evidence, credentials or authority.
    pendingFrameHint={lease:s,context:structuredClone(context)};scheduleFrameHint();return true;
  }
  return Object.freeze({bind,release,read,notifyFrame});
}

return Object.freeze({ SIMPLE_FRAME_READY, SIMPLE_FRAME_DIRTY, validSimpleFrameHint, validSimpleFrameContext, simpleFrameSenderContext, simpleFrameCensus, simpleFrameCollection, createSimpleFrameTelemetry });
})();
const __m13 = (() => {
// Closed classifications only: never return upstream free text, context or stack.
function classifyUpstreamLog(value) {
  const raw = typeof value === 'string' ? value : [value?.message, value?.msg, value?.error].filter(x => typeof x === 'string').join(' ');
  if (/(?:token[_ -]?expired|unauthori[sz]ed|\b401\b|session.*expired)/iu.test(raw)) return 'SESSION_EXPIRED';
  if (/(?:insufficient[- _]|not enough|stash[_ -]full|battery.*low)/iu.test(raw)) return 'INSUFFICIENT_GAME_RESOURCES';
  if (/(?:timeout|timed out)/iu.test(raw)) return 'TIMEOUT';
  if (/(?:connection.*(?:lost|closed)|disconnected|websocket.*closed|network.*error)/iu.test(raw)) return 'CONNECTION_LOST';
  if (/(?:not found|missing.*(?:element|target|button)|no.*(?:tab|target))/iu.test(raw)) return 'UI_TARGET_MISSING';
  if (/(?:reload.*required|refresh.*required)/iu.test(raw)) return 'DOCUMENT_RELOAD_REQUIRED';
  if (/(?:abort|cancelled|canceled|stopped)/iu.test(raw)) return 'UPSTREAM_STOP_REPORTED';
  return value?.level === 'error' ? 'UPSTREAM_ERROR_REPORTED' : 'UPSTREAM_EVENT_RECORDED';
}

return Object.freeze({ classifyUpstreamLog });
})();
const __m12 = (() => {
// Strict, document/epoch-owned NORMALIZED context. Not a raw storage or WS API.
// Collectors must derive costs and ownership from verified current observations.
const { object, bool, integer, identifier, enumeration, array, literal, deepFreeze, validate, valid } = __m2;
const { JOB_TYPES, MARKETS } = __m4;
const { classifyUpstreamLog } = __m13;
const text = { type: 'string', minLength: 0, maxLength: 160 };
const nullableId = { oneOf: [identifier, literal(null)] };
const COST_SCHEMA = deepFreeze(object({ amount: integer(0, 100000000000), unit: enumeration(['credits', 'credit-hundredths', 'unverified']) }));
const file = object({ id: identifier, fileId: identifier, name: text, extension: text }, ['id', 'fileId', 'name', 'extension']);
const condition = object({ type: identifier, details: object({ fileExtension: text, files: array(file, 100), fileIds: array(identifier, 100), ips: array({ type: 'string', minLength: 1, maxLength: 64, pattern: '^[0-9a-fA-F.:/-]+$' }, 100) }, ['fileExtension', 'files', 'fileIds', 'ips']) }, ['details']);
const job = object({ jobId: identifier, name: enumeration(JOB_TYPES), serverName: text, serverId: nullableId, marketId: identifier, marketKey: enumeration(MARKETS), rewardCredits: integer(0, 100000000000), rewardReputation: integer(0, 1000000000), deposit: COST_SCHEMA, conditions: array(condition, 100), alreadyTaken: bool, canComplete: bool });
const config = object({ mercenaryId: identifier, marketId: identifier, locationConfigId: identifier, zoneConfigId: identifier, goalId: identifier, hasInsurance: bool });
const deadline = integer(0, Number.MAX_SAFE_INTEGER);
const CONTEXT_SCHEMAS = deepFreeze({
  jobs: object({ jobs: array(job, 1000) }),
  failedJobs: object({ jobs: array(object({ marketId: identifier, jobId: identifier, marketKey: enumeration(MARKETS) }), 1000) }),
  maintenance: object({ servers: array(object({ id: identifier, name: text }), 1000) }),
  specialists: object({ offers: array(object({ specialistType: identifier, kind: identifier, level: integer(1, 1000), priceId: identifier, cost: COST_SCHEMA, requiresItems: bool, available: bool }), 1000) }),
  expeditionConfig: object({ quotes: array(object({ config, totalCost: COST_SCHEMA, expiresAt: deadline, exactTupleVerified: bool }), 100), choices: array(object({ marketId: identifier, locationConfigId: identifier, zoneConfigId: identifier, goalId: identifier }), 1000) }, ['choices']),
  containers: object({ containers: array(object({ expeditionId: identifier, completed: bool, opened: bool, cost: COST_SCHEMA }), 1000) }),
  mercenaries: object({ mercenaries: array(object({ id: identifier, name: text }), 1000) }),
  decisions: object({ decisions: array(object({ expeditionId: identifier, messageId: identifier, optionIds: array(identifier, 100), deadline, resolved: bool }), 1000) }),
  decisionProof: object({ decisions: array(object({ expeditionId: identifier, messageId: identifier, selectedOption: nullableId, resolved: bool }), 1000) }),
  loadoutProof: object({ equippedHardwareIds: array(identifier, 1000), equippedSoftwareIds: array(identifier, 1000) }),
  droneOptions: object({ offers: array(object({ locationConfigId: identifier, missionConfigId: identifier, batteryCost: integer(0, 1000000), batteryAvailable: integer(0, 1000000), cost: { oneOf: [COST_SCHEMA, literal(null)] }, expiresAt: deadline, exactTupleVerified: bool }), 1000) }),
  droneRepair: object({ quotes: array(object({ targetDurability: integer(1, 100), cost: COST_SCHEMA, expiresAt: deadline, exactTargetVerified: bool }), 100) })
});
const fail = code => { const error = new Error(code); error.code = code; throw error; };
const one = values => { if (values.length !== 1) fail(values.length ? 'CONTEXT_AMBIGUOUS' : 'DATA_NOT_READY'); return values[0]; };
const price = (cost, maximum) => {
  if (cost.unit === 'unverified') fail('COST_UNIT_UNVERIFIED');
  const limit = cost.unit === 'credit-hundredths' ? maximum * 100 : maximum;
  if (!Number.isSafeInteger(limit) || cost.amount > limit) fail('BUDGET_EXCEEDED');
};
const HYDRATED_OPERATIONS = deepFreeze({ startAutoJobs: 'jobs', forceMaintenanceBatch: 'maintenance', purchaseSpecialist: 'specialists', launchExpedition: 'expeditionConfig', openContainer: 'containers', setAutoSendMerc: 'mercenaries', respondDecision: 'decisions', launchDrone: 'droneOptions', repairDrone: 'droneRepair' });
function hydrateOperation(operation, parameters, input, now = Date.now(), { gameCostMode = 'bounded' } = {}) {
  const domain = HYDRATED_OPERATIONS[operation];
  if (!domain) fail('NO_VERIFIED_MAPPING');
  const data = validate(CONTEXT_SCHEMAS[domain], input, 'INVALID_CONTEXT');
  const p = parameters;
  if (operation === 'startAutoJobs') {
    const jobs = p.jobs.map(ref => one(data.jobs.filter(job => job.jobId === ref.jobId && job.marketKey === ref.marketKey)));
    const seen = new Set(); let totalHundredths = 0;
    for (const job of jobs) {
      if (seen.has(job.jobId)) fail('CONTEXT_AMBIGUOUS'); seen.add(job.jobId);
      if (job.deposit.unit === 'unverified') fail('COST_UNIT_UNVERIFIED');
      if (!job.alreadyTaken) totalHundredths += job.deposit.amount * (job.deposit.unit === 'credits' ? 100 : 1);
    }
    if (!Number.isSafeInteger(totalHundredths) || totalHundredths > p.maxDepositCredits * 100) fail('BUDGET_EXCEEDED');
    return { action: 'startAutoJobs', jobs: jobs.map(job => ({ ...job, type: job.name, deposit: job.deposit.amount, status: 'pending' })), settings: {} };
  }
  if (operation === 'forceMaintenanceBatch') return { action: 'forceMaintenanceBatch', servers: p.serverIds.map(id => one(data.servers.filter(row => row.id === id))) };
  if (operation === 'purchaseSpecialist') {
    const offer = one(data.offers.filter(row => row.specialistType === p.specialistType && row.kind === p.kind && row.level === p.level && row.priceId === p.priceId));
    if (!offer.available) fail('DATA_NOT_READY');
    if (offer.requiresItems) fail('ITEM_PAYMENT_UNSUPPORTED');
    price(offer.cost, p.maxCostCredits);
    return { action: 'purchaseSpecialist', specialistType: p.specialistType, kind: p.kind, level: p.level, priceId: p.priceId };
  }
  if (operation === 'launchExpedition') {
    const matching = data.quotes.filter(row => Object.keys(p.config).every(key => row.config[key] === p.config[key]));
    if (matching.length === 0 && gameCostMode === 'unquoted-game-resources') {
      one((data.choices || []).filter(row => ['marketId', 'locationConfigId', 'zoneConfigId', 'goalId'].every(key => row[key] === p.config[key])));
      return { action: 'launchExpedition', config: p.config };
    }
    const quote = one(matching);
    if (!quote.exactTupleVerified || quote.expiresAt <= now) fail('QUOTE_NOT_VERIFIED');
    price(quote.totalCost, p.maxCostCredits);
    return { action: 'launchExpedition', config: p.config };
  }
  if (operation === 'openContainer') {
    const item = one(data.containers.filter(row => row.expeditionId === p.expeditionId));
    if (!item.completed || item.opened) fail('DATA_NOT_READY');
    price(item.cost, p.maxCostCredits);
    return { action: 'openContainer', expeditionId: p.expeditionId };
  }
  if (operation === 'setAutoSendMerc') {
    if (p.autoChooseMerc && p.mercenaryId === null) return { autoSendMerc: { ...p, mercenaryName: '', disabledReason: null } };
    const mercenary = one(data.mercenaries.filter(row => row.id === p.mercenaryId));
    return { autoSendMerc: { ...p, mercenaryName: mercenary.name, disabledReason: null } };
  }
  if (operation === 'respondDecision') {
    const decision = one(data.decisions.filter(row => row.expeditionId === p.expeditionId && row.messageId === p.messageId));
    if (decision.resolved || decision.deadline <= now || !decision.optionIds.includes(p.selectedOption)) fail('DECISION_NOT_CURRENT');
    return { action: 'respondDecision', expeditionId: p.expeditionId, messageId: p.messageId, selectedOption: p.selectedOption };
  }
  if (operation === 'launchDrone') {
    const offer = one(data.offers.filter(row => row.locationConfigId === p.locationConfigId && row.missionConfigId === p.missionConfigId));
    if (!offer.exactTupleVerified || offer.expiresAt <= now) fail('QUOTE_NOT_VERIFIED');
    if (offer.batteryCost > offer.batteryAvailable) fail('INSUFFICIENT_BATTERY');
    if (offer.cost) price(offer.cost, p.maxCostCredits);
    else if (gameCostMode !== 'unquoted-game-resources') fail('COST_QUOTE_UNAVAILABLE');
    return { action: 'launchDrone', locationConfigId: p.locationConfigId, missionConfigId: p.missionConfigId };
  }
  if (operation === 'repairDrone') {
    const quote = one(data.quotes.filter(row => row.targetDurability === p.targetDurability));
    if (!quote.exactTargetVerified || quote.expiresAt <= now) fail('QUOTE_NOT_VERIFIED');
    price(quote.cost, p.maxCostCredits);
    return { action: 'repairDrone', targetDurability: p.targetDurability };
  }
  fail('NO_VERIFIED_MAPPING');
}

const HYDRATED_MESSAGE_SCHEMAS = deepFreeze({
  startAutoJobs: object({ action: literal('startAutoJobs'), jobs: array(object({ ...job.properties, type: enumeration(JOB_TYPES), deposit: integer(0, 100000000000), status: literal('pending') }), 100, 1), settings: object({}) }),
  forceMaintenanceBatch: object({ action: literal('forceMaintenanceBatch'), servers: array(object({ id: identifier, name: text }), 100, 1) }),
  purchaseSpecialist: object({ action: literal('purchaseSpecialist'), specialistType: identifier, kind: identifier, level: integer(1, 1000), priceId: identifier }),
  launchExpedition: object({ action: literal('launchExpedition'), config }),
  openContainer: object({ action: literal('openContainer'), expeditionId: identifier }),
  respondDecision: object({ action: literal('respondDecision'), expeditionId: identifier, messageId: identifier, selectedOption: identifier }),
  launchDrone: object({ action: literal('launchDrone'), locationConfigId: identifier, missionConfigId: identifier }),
  repairDrone: object({ action: literal('repairDrone'), targetDurability: integer(1, 100) })
});

const marketEvents = { COR3_WS_MARKET: 'home', COR3_WS_DARK_MARKET: 'dark', COR3_WS_SOYUZ_MARKET: 'soyuz', COR3_WS_USOL_MARKET: 'usol' };
const MARKET_IDS = { home: '019d3ea4-85bd-7389-904d-8f7c85841134', dark: '019d3ea4-85bd-7389-904d-908ba9194aa0', soyuz: '019da731-2db5-7d76-9447-1ea3b9b78001', usol: '019e4065-6ae8-760d-8724-58ab4f2cf7d7' };
const list = x => { if (Array.isArray(x) && x.length > 1000) fail('DATA_TRUNCATED'); return Array.isArray(x) ? x : []; };
const label = x => typeof x === 'string' ? x.slice(0, 160) : '';
const cost = x => Number.isSafeInteger(x) && x >= 0 ? { amount: x, unit: 'credits' } : null;
const date = x => Number.isSafeInteger(x) && x >= 0 ? x : typeof x === 'string' && Number.isFinite(Date.parse(x)) ? Date.parse(x) : 0;
function conditions(input) {
  return list(input?.items || input).map(row => {
    const item = { type: row?.type };
    if (row?.details && typeof row.details === 'object') {
      item.details = {};
      for (const key of ['fileExtension', 'fileIds', 'ips']) if (Object.hasOwn(row.details, key)) item.details[key] = structuredClone(row.details[key]);
      if (Array.isArray(row.details.files)) item.details.files = list(row.details.files).map(f => Object.fromEntries(['id', 'fileId', 'name', 'extension'].filter(key => Object.hasOwn(f, key)).map(key => [key, f[key]])));
    }
    return item;
  });
}
const logEvents = { COR3_AUTOJOB_LOG: ['autoJobsDebugLogs', 'jobs'], COR3_VALUABLE_LOG: ['valuableDebugLogs', 'valuables'], COR3_DAILY_HACK_LOG: ['dailyHackLog', 'daily'], COR3_ICE_WALL_STATUS: ['iceWallSolverStatus', 'ice'], COR3_SIMPLE_DECRYPT_STATUS: ['simpleDecryptSolverStatus', 'simpleDecrypt'], COR3_WS_EXPEDITION_LAUNCH_ERROR: ['expeditionLaunchError', 'expeditions'] };
const CONTEXT_EVENT_DOMAINS = deepFreeze({
  COR3_WS_MARKET: ['jobs', 'failedJobs'], COR3_WS_DARK_MARKET: ['jobs', 'failedJobs'], COR3_WS_SOYUZ_MARKET: ['jobs', 'failedJobs'], COR3_WS_USOL_MARKET: ['jobs', 'failedJobs'],
  COR3_VALUABLE_MAINTENANCE_UPDATE: ['maintenance'], COR3_WS_SPECIALISTS: ['specialists'], COR3_WS_EXPEDITIONS: ['containers', 'expeditions'],
  COR3_WS_DECISIONS: ['decisions', 'decisionProof'], COR3_WS_MERCENARIES: ['mercenaries'], COR3_WS_USOL_MERCENARIES: ['mercenaries'], COR3_WS_DRONE_OPTIONS: ['droneOptions', 'drone'],
  COR3_WS_EXPEDITION_CONFIG: ['expeditionConfig'], COR3_WS_USOL_EXPEDITION_CONFIG: ['expeditionConfig'], COR3_WS_STASH: ['stash'], COR3_WS_LOADOUT: ['loadout', 'loadoutProof'],
  COR3_WS_ARCHIVED_EXPEDITIONS: ['archivedExpeditions'], COR3_WS_MAP_DATA: ['network', 'maintenance'],
  COR3_FULL_EFFECT_V3: ['loadoutProof', 'decisionProof'], COR3_OBSERVABLE_ERROR: ['logs'],
  ...Object.fromEntries(Object.keys(logEvents).map(event => [event, ['logs']]))
});
function viewRows(items) {
  return list(items).slice(0, 100).map(item => {
    const row = {};
    for (const key of ['id', 'name', 'type', 'status', 'level', 'quantity', 'credits', 'count', 'enabled', 'running', 'completed', 'total']) {
      const value = item?.[key];
      if (typeof value === 'string' && value.length <= 160 && !/(?:bearer|token|password|cookie|secret|authorization|https?:\/\/|[A-Za-z0-9_+\/=.-]{48,})/iu.test(value)) row[key] = value;
      else if (typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) row[key] = value;
    }
    if (Number.isFinite(item?.sellPrice)) row.credits = item.sellPrice;
    return row;
  });
}
function view(items) { const rows = list(items); return { available: true, rows: viewRows(rows), sourceTotalRows: rows.length, sourceTruncated: rows.length > 100 }; }
// Fixed source events only. Ownership/epoch is the isolated collector's job.
// Unknown or incomplete monetary values are omitted, NEVER interpreted as free.
function normalizeContextEvent(message, now = Date.now()) {
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') return [];
  const out = [];
  const emit = (domain, data) => { if (valid(CONTEXT_SCHEMAS[domain], data)) out.push({ domain, data }); };
  const m = message, d = message.data;
  if (m.type === 'COR3_FULL_EFFECT_V3') {
    if (m.version !== 3 || ![null, undefined].includes(m.requestId) && !valid(identifier, m.requestId) || Object.keys(m).some(key => !['type', 'version', 'resource', 'action', 'requestId', 'data'].includes(key))) return [];
    if (m.resource === 'loadoutProof' && m.action === 'loadout') emit('loadoutProof', m.data);
    if (m.resource === 'decisionProof' && m.action === 'expeditions') emit('decisionProof', m.data);
  } else if (m.type === 'COR3_OBSERVABLE_ERROR') {
    if (Object.keys(m).length !== 4 || !['type', 'source', 'code', 'phase'].every(key => Object.hasOwn(m, key)) || !['daily', 'ice', 'decryptLifecycle', 'simpleLifecycle'].includes(m.source) || m.code !== 'SOLVER_FAILED' || m.phase !== 'run') return [];
    out.push({ domain: 'logs', data: { available: true, scope: 'document', rows: [{ source: m.source === 'daily' ? 'dailyLifecycle' : m.source === 'ice' ? 'iceLifecycle' : m.source, feature: m.source.replace('Lifecycle',''), at: now, code: 'SOLVER_FAILED', phase: 'run', stage: 'observe', textOmitted: true, correlatedToOperation: false }] } });
  } else if (Object.hasOwn(logEvents, m.type)) {
    const [source, feature] = logEvents[m.type];
    out.push({ domain: 'logs', data: { available: true, scope: 'document', rows: [{ source, feature, at: now, code: classifyUpstreamLog(m), stage: 'observe', textOmitted: true, correlatedToOperation: false }] } });
  } else if (Object.hasOwn(marketEvents, m.type)) {
    const marketKey = marketEvents[m.type], market = m.market;
    if (!market || typeof market !== 'object' || !Array.isArray(market.jobs) && !Array.isArray(market.recentJobs)) return [];
    const jobs = [];
    for (const [items, alreadyTaken] of [[market.jobs, false], [market.recentJobs, true]]) for (const row of list(items)) {
      const deposit = cost(row.deposit); if (!deposit) continue;
      // A recent job with explicit other-market identity is not relabelled.
      if (row.marketId && row.marketId !== MARKET_IDS[marketKey]) continue;
      const server = list(row.relatedServers)[0];
      const item = { jobId: row.id, name: row.name, serverName: label(server?.serverName), serverId: server?.id || row.conditions?.serverConfigId || null,
        marketId: MARKET_IDS[marketKey], marketKey, rewardCredits: row.rewardCredits ?? 0, rewardReputation: row.rewardReputation ?? 0, deposit,
        conditions: conditions(row.conditions), alreadyTaken, canComplete: row.canComplete === true };
      if (valid(job, item)) jobs.push(item);
    }
    emit('jobs', { jobs });
    if (Array.isArray(market.recentJobs)) emit('failedJobs', { jobs: list(market.recentJobs).filter(row => row?.status === 'FAILED' && valid(identifier, row.id) && (!row.marketId || row.marketId === MARKET_IDS[marketKey])).map(row => ({ marketId: MARKET_IDS[marketKey], marketKey, jobId: row.id })) });
  } else if (m.type === 'COR3_VALUABLE_MAINTENANCE_UPDATE') {
    if (!Array.isArray(d?.servers)) return [];
    emit('maintenance', { servers: list(d?.servers).filter(row => valid(identifier, row?.id)).map(row => ({ id: row.id, name: label(row.serverName) })) });
  } else if (m.type === 'COR3_WS_SPECIALISTS') {
    if (!Array.isArray(d?.specialists)) return [];
    const offers = [];
    for (const specialist of list(d?.specialists)) for (const item of list(specialist.temporary)) for (const p of list(item.prices)) {
      const quote = cost(p.credits); if (!quote) continue;
      const offer = { specialistType: specialist.specialistType, kind: item.kind, level: item.level, priceId: p.id, cost: quote,
        requiresItems: p.items != null && (!Array.isArray(p.items) || p.items.length > 0), available: true };
      if (valid(CONTEXT_SCHEMAS.specialists.properties.offers.items, offer)) offers.push(offer);
    }
    emit('specialists', { offers });
  } else if (m.type === 'COR3_WS_EXPEDITIONS') {
    if (!Array.isArray(m.expeditions)) return [];
    const containers = [];
    for (const expedition of list(m.expeditions)) {
      const messages = list(expedition.messages).filter(row => row?.actionType === 'pay_and_open');
      if (messages.length !== 1) continue;
      const quote = cost(messages[0].actionData?.cost); if (!quote) continue;
      const item = { expeditionId: expedition.id, completed: expedition.status === 'COMPLETED', opened: !!expedition.containerOpenedAt, cost: quote };
      if (valid(CONTEXT_SCHEMAS.containers.properties.containers.items, item)) containers.push(item);
    }
    emit('containers', { containers });
    out.push({ domain: 'expeditions', data: view(m.expeditions) });
  } else if (m.type === 'COR3_WS_DECISIONS') {
    if (!Array.isArray(m.decisions)) return [];
    const decisions = [];
    for (const row of list(m.decisions)) {
      const item = { expeditionId: row.expeditionId, messageId: row.messageId, optionIds: list(row.decisionOptions).map(option => option.id), deadline: date(row.decisionDeadline), resolved: !!(row.isResolved || row.isAutoResolved || row.selectedOption) };
      if (valid(CONTEXT_SCHEMAS.decisions.properties.decisions.items, item)) decisions.push(item);
    }
    emit('decisions', { decisions });
    const proofs = list(m.decisions).filter(row => typeof row.isResolved === 'boolean' && Object.hasOwn(row, 'selectedOption')).map(row => ({ expeditionId: row.expeditionId, messageId: row.messageId, selectedOption: row.selectedOption, resolved: row.isResolved }));
    emit('decisionProof', { decisions: proofs });
  } else if (['COR3_WS_MERCENARIES', 'COR3_WS_USOL_MERCENARIES'].includes(m.type)) {
    if (!Array.isArray(d?.mercenaries) && !Array.isArray(d?.eliteSlots)) return [];
    const mercenaries = [...list(d?.mercenaries), ...list(d?.eliteSlots).map(row => row.mercenary)].filter(row => valid(identifier, row?.id)).map(row => ({ id: row.id, name: label(row.callsign || row.name) }));
    emit('mercenaries', { mercenaries });
  } else if (m.type === 'COR3_WS_DRONE_OPTIONS') {
    if (!d || typeof d !== 'object' || !Array.isArray(d.locations)) return [];
    const offers = [];
    for (const location of list(d?.locations)) for (const mission of list(location.missions)) {
      const offer = { locationConfigId: location.id, missionConfigId: mission.id, batteryCost: mission.batteryCost, batteryAvailable: d?.battery?.current,
        cost: null, expiresAt: now + 30000, exactTupleVerified: true };
      if (valid(CONTEXT_SCHEMAS.droneOptions.properties.offers.items, offer)) offers.push(offer);
    }
    emit('droneOptions', { offers });
    out.push({ domain: 'drone', data: view(d?.drone ? [d.drone] : []) });
  } else if (['COR3_WS_EXPEDITION_CONFIG', 'COR3_WS_USOL_EXPEDITION_CONFIG'].includes(m.type)) {
    if (!Array.isArray(d?.locations)) return [];
    const marketId = m.type === 'COR3_WS_USOL_EXPEDITION_CONFIG' ? MARKET_IDS.usol : MARKET_IDS.home, choices = [];
    for (const location of list(d?.locations)) for (const zone of list(location.zones)) for (const goal of list(zone.goals)) choices.push({ marketId, locationConfigId: location.id, zoneConfigId: zone.id, goalId: goal.id });
    emit('expeditionConfig', { quotes: [], choices });
  } else if (m.type === 'COR3_WS_STASH') { if (Array.isArray(m.stash?.items)) out.push({ domain: 'stash', data: view(m.stash.items) }); }
  else if (m.type === 'COR3_WS_LOADOUT') {
    const loadout = m.loadout;
    if (!loadout || typeof loadout !== 'object' || !loadout.equippedHardware && !Array.isArray(loadout.ownedHardware) && !Array.isArray(loadout.ownedSoftware) && !Array.isArray(loadout.equippedSoftware)) return [];
    const equipped = loadout?.equippedHardware && typeof loadout.equippedHardware === 'object' ? Object.values(loadout.equippedHardware) : [];
    out.push({ domain: 'loadout', data: view([...list(loadout?.ownedHardware), ...list(loadout?.ownedSoftware), ...list(loadout?.equippedSoftware), ...equipped]) });
    const slots = ['cpu', 'gpu', 'ram', 'psu'];
    if (loadout?.equippedHardware && typeof loadout.equippedHardware === 'object' && !Array.isArray(loadout.equippedHardware) && slots.every(slot => Object.hasOwn(loadout.equippedHardware, slot) && (loadout.equippedHardware[slot] === null || valid(identifier, loadout.equippedHardware[slot]?.id))) && Array.isArray(loadout.equippedSoftware)) emit('loadoutProof', { equippedHardwareIds: slots.map(slot => loadout.equippedHardware[slot]).filter(Boolean).map(item => item.id), equippedSoftwareIds: list(loadout.equippedSoftware).map(item => item.id) });
  } else if (m.type === 'COR3_WS_ARCHIVED_EXPEDITIONS') { if (Array.isArray(d) || Array.isArray(d?.items)) out.push({ domain: 'archivedExpeditions', data: view(Array.isArray(d) ? d : d.items) }); }
  else if (m.type === 'COR3_WS_MAP_DATA') {
    if (!Array.isArray(m.servers)) return [];
    out.push({ domain: 'network', data: view(m.servers) });
    emit('maintenance', { servers: list(m.servers).filter(row => valid(identifier, row?.id)).map(row => ({ id: row.id, name: label(row.serverName) })) });
  }
  // COR3_WS_MERC_CONFIGURE intentionally NOT promoted to an exact tuple quote.
  // Source correlates only by mercenaryId FIFO, not config/insurance/request ID.
  return out;
}

return Object.freeze({ COST_SCHEMA, CONTEXT_SCHEMAS, HYDRATED_OPERATIONS, hydrateOperation, HYDRATED_MESSAGE_SCHEMAS, CONTEXT_EVENT_DOMAINS, normalizeContextEvent });
})();
const __m14 = (() => {
// Semantic effect reservations are derived only from validated fixed actions.
// They are not caller inputs. Resource IDs intentionally ignore quantity, price
// ceiling, selected option and destination, so a new operation ID cannot replay
// the same unresolved effect with superficially different parameters.
const { getAction, isStart, isStop } = __m4;
const fp = (family, resource = '*') => ({ family, resource });
const id = (...parts) => JSON.stringify(parts);
function semanticFingerprints(action) {
  const p = action.parameters, name = action.operation, def = getAction(name);
  if (!def) throw new Error('INVALID_ARGUMENTS');
  if (isStart(action) || isStop(action)) return [];
  switch (name) {
    case 'sellItem': return [fp('stash-item', id(p.itemId))];
    case 'batchSellItems': return p.items.map(item => fp('stash-item', id(item.itemId)));
    case 'equipHardware': return [fp('hardware-loadout')]; // Slot unknown in caller input.
    case 'equipSoftware': case 'unequipSoftware': return [fp('software-module', id(p.moduleConfigId))];
    case 'purchaseSpecialist': return [fp('specialist', id(p.specialistType, p.kind))];
    case 'respondDecision': return [fp('expedition-decision', id(p.expeditionId, p.messageId))];
    case 'launchExpedition': return [fp('mercenary-expedition', id(p.config.mercenaryId))];
    case 'openContainer': case 'collectAll': return [fp('expedition-container', id(p.expeditionId))];
    case 'launchDrone': case 'repairDrone': case 'resolveDroneEvent': return [fp('account-drone')];
    // Manual fixed1.9 drone claim forces the mailbox queue even when automatic
    // drone/mercenary settings are off. Reserve both aliases until reconciled.
    case 'claimDrone': return [fp('account-drone'), fp('account-mailbox')];
    case 'claimMailbox': return [fp('account-mailbox')];
    case 'sortStash': return [fp('stash-layout')];
    case 'dismissFailedJobs': case 'autoCleanupFailedJobs': return p.jobs.map(job => fp('job-dismiss', id(job.marketId, job.jobId)));
    case 'runAutoCleanupFailedJobs': return [fp('job-dismiss')];
    case 'forceMaintenanceBatch': return p.serverIds.map(serverId => fp('server-maintenance', id(serverId)));
    default:
      // Read/resource-refresh, keep-alive and preference operations are not
      // irreversible resource effects. Their operation IDs still never replay.
      return [];
  }
}
function fingerprintsConflict(left, right) { return left.some(a => right.some(b => a.family === b.family && (a.resource === '*' || b.resource === '*' || a.resource === b.resource))); }
// An automatic starter may repeat an unresolved one-shot effect even though its
// own lifetime is managed by a running guard. Check this footprint for admission;
// do not turn every stopped automation into an irreversible-effect reservation.
function effectFootprint(action) {
  // Restore may permit enabled schedulers after manual reload. Without a proven
  // current preference plan, conservatively cover every fixed mutation family.
  if (action.operation === 'cor3SetHelperMode' && action.parameters.paused === false) return ['stash-item', 'hardware-loadout', 'software-module', 'specialist', 'expedition-decision', 'mercenary-expedition', 'expedition-container', 'account-drone', 'account-mailbox', 'stash-layout', 'job-dismiss', 'server-maintenance'].map(family => fp(family));
  if (!isStart(action)) return semanticFingerprints(action);
  switch (action.operation) {
    // The fixed1.9 mail queue checks enabled, not paused. Even a paused drone
    // preference can repeat an unresolved mailbox claim when enabled is true.
    case 'setAutoDrone': return [fp('account-drone'), fp('account-mailbox')];
    case 'setAutoSendMerc': return [fp('mercenary-expedition'), fp('expedition-container'), fp('stash-item')];
    case 'setAutoSendMercV19': return [fp('mercenary-expedition'), fp('expedition-container'), fp('stash-item'), fp('account-mailbox')];
    case 'setAutoSellCheapest': return [fp('stash-item')];
    case 'startAutoJobs': case 'setAutoFinishAllJobs': case 'setAutoFinishAllJobTypes': case 'setAutoCleanupFailedJobsEnabled': return [fp('job-dismiss')];
    case 'setDecisionModifiers': return [fp('expedition-decision')];
    case 'startValuableSeller': case 'startValuableSearch': return [fp('server-maintenance')];
    default: return [];
  }
}

return Object.freeze({ semanticFingerprints, fingerprintsConflict, effectFootprint });
})();
const __m11 = (() => {
// Candidate full-feature adapter. Never auto-starts, opens a browser, or connects.
// Runtime dependencies are supplied by the extension integration; tests use fakes.
const { ACTIONS, ACTION_SCHEMA, getAction, READ_SCOPES, isStart: actionStartsAutomation, isMitigation, isControllerMitigation } = __m4;
const { validate, valid, object, identifier, tokenSchema, targetSchema, operationId: operationIdSchema, sameTarget, deepFreeze, literal, array, bool, integer, enumeration } = __m2;
const { HYDRATED_OPERATIONS, HYDRATED_MESSAGE_SCHEMAS, CONTEXT_SCHEMAS, hydrateOperation } = __m12;
const { safeCode } = __m6;
const { COST_OPERATIONS, GAME_COST_POLICIES_SCHEMA } = __m5;
const { classifyUpstreamLog } = __m13;
const { semanticFingerprints, fingerprintsConflict, effectFootprint } = __m14;
const { RECONCILE_RESPONSE_SCHEMA } = __m7;

const locks = new Map(); // Account-wide, deliberately NOT account + installation.
const uncertain = new Map();
const latched = new Map();
const acceptedEffects = new Map();
const serial = async (accountId, work) => {
  const before = locks.get(accountId) || Promise.resolve();
  const task = before.catch(() => {}).then(work);
  locks.set(accountId, task);
  try { return await task; } finally { if (locks.get(accountId) === task) locks.delete(accountId); }
};
const fail = code => { const e = new Error(code); e.code = code; throw e; };
const cleanError = error => safeCode(error?.code || 'ADAPTER_IO_FAILED');
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const urlOK = value => { try { const u = new URL(value); return u.protocol === 'https:' && ['cor3.gg', 'os.cor3.gg'].includes(u.hostname) && !u.port && !u.username && !u.password; } catch { return false; } };
const sameDocument = (a, b) => a.tabId === b.tabId && a.documentId === b.documentId && a.url === b.url && a.generation === b.generation && sameTarget(a, b);

// These names are chosen by us, never copied from an MCP request's verb.
const specs = new Map();
const direct = (id, fields = [], extra = {}) => specs.set(id, { transport: 'content', fields, ...extra });
for (const id of ['requestExpeditions', 'requestNetworkMap', 'requestStash', 'requestSpecialists', 'requestLoadout', 'requestMarket', 'requestDarkMarket', 'requestSoyuzMarket', 'requestUsolMarket', 'requestArchivedExpeditions', 'requestMercenaries', 'requestUsolMercenaries', 'fetchDailyOps', 'refreshMarket', 'refreshDarkMarket', 'refreshSoyuzMarket', 'refreshUsolMarket', 'leaveStash', 'keepWorkerAlive', 'enableHackSolvers', 'startValuableSearch', 'startIpSearch']) direct(id);
direct('refreshAllMarketsSeq', ['skipLots', 'order']);
direct('devTcTestReachability', ['serverId']);
direct('requestExpeditionConfig', []);
for (const id of ['equipHardware', 'equipSoftware', 'unequipSoftware']) direct(id, ['moduleConfigId']);
direct('sellItem', ['itemId', 'quantity']);
direct('respondDecision', ['expeditionId', 'messageId', 'selectedOption']);
direct('collectAll', ['expeditionId'], { versions: ['original-1.7.0'] });
direct('startValuableSeller', ['selectedServers', 'selectedDownloads']);
direct('dismissFailedJobs', ['jobs', 'marketKey']);
for (const id of ['stopAutoJobs', 'stopValuable']) direct(id, [], { stop: true });
for (const [id, key] of [['toggleDecryptSolver', 'autoDecryptEnabled'], ['toggleIceWallSolver', 'autoIceWallEnabled'], ['toggleSimpleDecryptSolver', 'autoSimpleDecryptEnabled'], ['toggleDailyHackSolver', 'autoDailyHackEnabled']]) direct(id, ['enabled'], { toggle: true, preferenceKey: key });
for (const id of ['disableBackground', 'enableBackground', 'disableNetworkFog', 'enableNetworkFog', 'moveNotificationsLeft', 'moveNotificationsRight']) direct(id, [], { cosmetic: true });
direct('getVersionFallbacks', [], { cosmetic: true, readReply: true });
direct('testAlarm', ['volume', 'continuous'], { versions: ['original-1.7.0'], cosmetic: true });
direct('stopAlarm', [], { versions: ['original-1.7.0'], cosmetic: true, stop: true, synchronousStop: true });
direct('updateAlarms', [], { versions: ['original-1.7.0'], cosmetic: true, custom: 'alarms' });
direct('updateAutoRefresh', ['autoRefresh'], { custom: 'autoRefresh' });
for (const [id, key] of [['setAutoJobSolverPanel', 'autoJobSolverEnabled'], ['setAutoValuableSellerPanel', 'autoValuableSellerEnabled'], ['setAutoJobsDebugConsole', 'autoJobsDebugConsoleEnabled'], ['setValuableDebugConsole', 'valuableDebugConsoleEnabled']]) specs.set(id, { transport: 'preference', area: 'sync', key, param: 'enabled', cosmetic: true });
for (const [id, key] of [['setAutoUpdateMarkets', 'autoUpdateMarkets'], ['setAutoFinishAllJobs', 'autoFinishAllJobsEnabled'], ['setAutoSellCheapest', 'autoSellCheapest']]) specs.set(id, { transport: 'preference', area: 'sync', key, param: 'enabled', schedule: id === 'setAutoFinishAllJobs' });
specs.set('setSecretFinder', { transport: 'preference', area: 'sync', key: 'secretFinderEnabled', param: 'enabled', startAction: 'startIpSearch' });
specs.set('setTheme', { transport: 'preference', area: 'sync', key: 'selectedTheme', param: 'theme', cosmetic: true });
specs.set('setAutoJobTypes', { transport: 'preference', area: 'sync', key: 'autoJobsSelectedTypes', param: 'selectedTypes', cosmetic: true });
specs.set('setDecisionModifiers', { transport: 'preference', area: 'sync', key: 'decisionModifiers', whole: true });
specs.set('setValuableSelection', { transport: 'preference', custom: 'valuableSelection', cosmetic: true });
specs.set('setPinnedTimers', { transport: 'preference', custom: 'pinnedTimers', cosmetic: true });
specs.set('setThreeSolverDefaults', { transport: 'runtime', versions: ['fixed-1.9'], defaults: true });
specs.set('cor3SetHelperMode', { transport: 'runtime', versions: ['fixed-1.9'], master: true });
for (const id of ['setAutoSellCheapest', 'setDecisionModifiers']) specs.get(id).versions = ['original-1.7.0'];
specs.get('setAutoFinishAllJobs').recurring = true;
for (const [id, key, param, cosmetic] of [
  ['setAutoCleanupFailedJobsEnabled', 'autoCleanupFailedJobsEnabled', 'enabled', false],
  ['setMarketsPanelEnabled', 'marketsPanelEnabled', 'enabled', true],
  ['setAutoFinishAllJobTypes', 'autoFinishAllJobTypes', 'types', false],
  ['setUiLanguage', 'uiLang', 'language', true]
]) specs.set(id, { transport: 'preference', area: 'sync', key, param, cosmetic, versions: ['fixed-1.9'] });
specs.set('setAutoDrone', { transport: 'preference', area: 'sync', key: 'autoDrone', whole: true, versions: ['fixed-1.9'], recurring: true });
specs.set('setAutoSendMercV19', { transport: 'preference', area: 'sync', key: 'autoSendMerc', whole: true, versions: ['fixed-1.9'], recurring: true });
specs.get('setAutoCleanupFailedJobsEnabled').cleanup = true;
specs.get('setAutoFinishAllJobTypes').schedule = true;
specs.get('setAutoFinishAllJobTypes').recurring = true;
// Source-confirmed fixed1.9 additions. Spending calls are not guessed below.
for (const id of ['claimMailbox', 'requestDroneOptions', 'runAutoCleanupFailedJobs']) direct(id, [], { versions: ['fixed-1.9'] });
specs.set('runAutoCleanupFailedJobs', { transport: 'content', fields: [], custom: 'cleanup', versions: ['fixed-1.9'] });
direct('claimDrone', ['missionId'], { versions: ['fixed-1.9'] });
direct('resolveDroneEvent', ['missionId', 'eventId', 'optionId'], { versions: ['fixed-1.9'] });
direct('requestDroneArchived', ['cursor', 'limit'], { versions: ['fixed-1.9'] });
direct('sortStash', ['mode'], { versions: ['fixed-1.9'] });
direct('batchSellItems', ['items'], { versions: ['fixed-1.9'] });
direct('autoCleanupFailedJobs', ['jobs'], { versions: ['fixed-1.9'] });
for (const [id, domain] of Object.entries(HYDRATED_OPERATIONS)) specs.set(id, { transport: id === 'setAutoSendMerc' ? 'preference' : 'content', hydration: domain, fields: [], ...(id === 'setAutoSendMerc' ? { versions: ['original-1.7.0'], recurring: true } : ['launchDrone', 'repairDrone'].includes(id) ? { versions: ['fixed-1.9'] } : {}) });
const gaps = {
  setHelperMode: 'ORIGINAL_MASTER_STOP_UNSUPPORTED',
  requestExpeditionConfig: 'ORIGINAL_MERCENARY_ARGUMENT_IGNORED',
  purchaseSpecialist: 'TRUSTED_PRICE_HYDRATION_REQUIRED',
  openContainer: 'TRUSTED_PRICE_HYDRATION_REQUIRED',
  launchExpedition: 'TRUSTED_CONFIG_AND_PRICE_HYDRATION_REQUIRED',
  startAutoJobs: 'TRUSTED_JOB_AND_DEPOSIT_HYDRATION_REQUIRED',
  forceMaintenanceBatch: 'TRUSTED_SERVER_HYDRATION_REQUIRED',
  setAutoSendMerc: 'TRUSTED_MERCENARY_AND_PRICE_HYDRATION_REQUIRED',
  launchDrone: 'TRUSTED_CONFIG_AND_PRICE_HYDRATION_REQUIRED',
  repairDrone: 'TRUSTED_PRICE_HYDRATION_REQUIRED'
};
const ADAPTER_COVERAGE = deepFreeze(ACTIONS.map(action => ({ operation: action.id, mapping: specs.has(action.id) ? 'implemented' : 'unsupported', versions: specs.get(action.id)?.versions || ['original-1.7.0', 'fixed-1.9'], code: specs.has(action.id) ? 'OFFLINE_VALIDATED_ONLY' : gaps[action.id] || 'NO_VERIFIED_MAPPING' })));
const legacyAlarm = object({ id: identifier, timerSource: identifier, thresholdSeconds: integer(1, 3599), continuous: bool, volume: integer(0, 100), enabled: bool });
const emittedSchemas = ACTIONS.filter(a => specs.get(a.id)?.transport === 'content' && a.id !== 'runAutoCleanupFailedJobs').map(a => {
  if (HYDRATED_MESSAGE_SCHEMAS[a.id]) return HYDRATED_MESSAGE_SCHEMAS[a.id];
  const spec = specs.get(a.id), props = { action: literal(a.id) };
  for (const field of spec.fields) props[field] = a.inputSchema.properties[field];
  if (spec.custom === 'alarms') props.alarms = array(legacyAlarm, 32);
  return object(props);
});
const ADAPTER_CONTENT_MESSAGE_SCHEMA = deepFreeze({ oneOf: emittedSchemas });
const validateAdapterContentMessage = message => validate(ADAPTER_CONTENT_MESSAGE_SCHEMA, message);
const ADAPTER_RUNTIME_MESSAGE_SCHEMA = deepFreeze({ oneOf: [object({ action: literal('setThreeSolverDefaults') }), object({ action: literal('cor3SetHelperMode'), paused: bool }), object({ action: literal('scheduleAutoFinishAll') })] });
const validateAdapterRuntimeMessage = message => validate(ADAPTER_RUNTIME_MESSAGE_SCHEMA, message);

const safeNames = new Set(('id name type kind status message at updatedAt startedAt endedAt completedAt expiresAt running enabled active paused ready allowed reloadRequired helperMode selectedTheme autoJobSolverEnabled autoValuableSellerEnabled autoJobsDebugConsoleEnabled valuableDebugConsoleEnabled disableBackground disableNetworkFog moveNotificationsLeft autoUpdateMarkets autoDecryptEnabled autoIceWallEnabled autoSimpleDecryptEnabled autoDailyHackEnabled secretFinderEnabled autoFinishAllJobsEnabled autoSellCheapest hasClaimedToday nextTaskTime currentTask completed total count amount quantity level price priceId cost currency marketId marketKey jobId serverId fileId itemId moduleConfigId expeditionId mercenaryId missionId eventId optionId messageId selectedOption label title description timerSource thresholdSeconds continuous volume pinned value available reason progress queued retryAt code operation operationId generation revision webVersion systemVersion patchVersion daily ice decrypt simpleDecrypt home dark soyuz usol dailyHackLog dailyHackLogUpdatedAt iceWallSolverStatus simpleDecryptSolverStatus records items jobs recentJobs modules hardware software mercenaries expeditions decisions rewards options timers alarms logs queue results data configuration loot risk autoChoose noWaitAutoChoose getRidOfVeterans maxMercCost autoChooseMerc autoChooseUsolFirst ignoreEliteMerc applyMercCostLimiter autoSendMerc decisionModifiers selectedServers selectedDownloads home_jobs dark_jobs soyuz_jobs usol_jobs pinnedTimers autoRefresh autoJobsSelectedTypes').split(' '));
for (const key of 'rows scope source feature field unit stage nextCapability upstreamLogsUnavailable upstreamLogsCorrelatedToOperation textOmitted sourceTotalRows sourceTruncated totalRows hasMore currentStreak difficulty nextJobsResetAt maxCapacity currentUsage sellPrice ownedHardware equippedHardware ownedSoftware specs credits nextAt'.split(' ')) safeNames.add(key);
for (const key of 'requestedEnabled preferenceScope actualState observedState evidence isolatedSchedulerClosed gateReady gateAllowed documentId phase attribution correlatedToOperation upstreamAvailabilityCode'.split(' ')) safeNames.add(key);
for (const key of 'childHintCoverage childHintCoverageLimited childHistoryScope childHistoryPersistence childCaptureScope rootBrowserDocumentId childOfflineCaptureAvailable childPrebindErrorsAvailable frameId browserDocumentId childCoverage childAggregateState childErrorsCoverage childHistoryTruncated topLogsAvailable timestampKind historical'.split(' ')) safeNames.add(key);
for (const key of ['nativeOffset', 'nextOffset', 'truncated']) safeNames.add(key);
const secretish = /(?:bearer\s+|(?:token|password|secret|cookie|authorization|api[_-]?key)\s*[:=]|eyJ[A-Za-z0-9_-]{8,}\.|(?:sk-|ghp_|gho_|xox[baprs]-)[A-Za-z0-9_-]{8,}|[A-Za-z0-9_+/=-]{80,})/iu;
const SAFE_LOG_SOURCES = deepFreeze(['autoJobsDebugLogs', 'valuableDebugLogs', 'dailyHackDiagnostics', 'dailyHackLog', 'iceWallSolverStatus', 'simpleDecryptSolverStatus', 'mercWarning', 'droneWarning', 'expeditionLaunchError', 'cor3_errors', 'dailyLifecycle', 'iceLifecycle', 'decryptLifecycle', 'simpleLifecycle']);
function projectSafeLogs(input) {
  if (!record(input)) return null;
  const rows = [];
  const codes = new Set(['SESSION_EXPIRED', 'INSUFFICIENT_GAME_RESOURCES', 'TIMEOUT', 'CONNECTION_LOST', 'UI_TARGET_MISSING', 'DOCUMENT_RELOAD_REQUIRED', 'UPSTREAM_STOP_REPORTED', 'UPSTREAM_ERROR_REPORTED', 'UPSTREAM_EVENT_RECORDED', 'SOLVER_FAILED']);
  if (Array.isArray(input.rows)) for (const row of input.rows.slice(-50)) {
    if (SAFE_LOG_SOURCES.includes(row?.source) && codes.has(row?.code)) rows.push({ source: row.source, at: Number.isSafeInteger(row.at) ? row.at : null, code: row.code, textOmitted: true, correlatedToOperation: false, attribution: 'unattributed-observation', ...(row.source === 'simpleLifecycle' && row.scope === 'bound-child-history' && Number.isSafeInteger(row.frameId) && row.frameId > 0 && valid(identifier,row.browserDocumentId) ? {frameId:row.frameId,browserDocumentId:row.browserDocumentId,...(valid(identifier,row.rootBrowserDocumentId)?{rootBrowserDocumentId:row.rootBrowserDocumentId}:{}),scope:'bound-child-history',historical:true,timestampKind:'background-receipt'} : {}), ...(['dailyLifecycle', 'iceLifecycle', 'decryptLifecycle', 'simpleLifecycle'].includes(row.source) && ['SOLVER_FAILED','TIMEOUT'].includes(row.code) ? { feature: ({dailyLifecycle:'daily',iceLifecycle:'ice',decryptLifecycle:'decrypt',simpleLifecycle:'simple'})[row.source], stage: 'observe', phase: 'run' } : {}) });
  }
  for (const source of SAFE_LOG_SOURCES) {
    if (!Object.hasOwn(input, source)) continue;
    const values = Array.isArray(input[source]) ? input[source] : [input[source]];
    const records = values.slice(-50).map(value => {
      // Do not copy any upstream free text, stack, context, endpoint, or action.
      const timestamp = Number.isSafeInteger(value?.timestamp) && value.timestamp >= 0 ? value.timestamp : Number.isSafeInteger(value?.ts) && value.ts >= 0 ? value.ts : null;
      const level = ['debug', 'info', 'warn', 'error', 'success'].includes(value?.level) ? value.level : 'info';
      return { source, at: timestamp, level, code: classifyUpstreamLog(value), textOmitted: true, correlatedToOperation: false, attribution: 'unattributed-observation' };
    });
    rows.push(...records);
  }
  if (Number.isSafeInteger(input.nativeOffset)) {
    // A native page is already indexed. Dropping or slicing entries here would
    // silently skip records when the caller requests its continuation.
    if (!Array.isArray(input.rows) || rows.length !== input.rows.length) fail('INVALID_STATE');
    const page = { available: input.available === true, rows, upstreamAvailabilityCode: input.available === true ? 'CURRENT_DOCUMENT_EVENTS' : 'NO_FRESH_DOCUMENT_EVENTS' };
    for (const key of ['childHintCoverage','childHintCoverageLimited','childHistoryScope','childHistoryPersistence','childCaptureScope','childPrebindErrorsAvailable','childOfflineCaptureAvailable','childCoverage','childAggregateState','childErrorsCoverage','childHistoryTruncated','topLogsAvailable','nativeOffset', 'totalRows', 'sourceTotalRows', 'nextOffset', 'sourceTruncated', 'truncated']) if (Object.hasOwn(input, key)) page[key] = input[key];
    return page;
  }
  return rows.length ? { available: true, rows: rows.slice(-100) } : null;
}

// The runtime has paged the upstream prefix already. Append bridge-owned rows
// in a single virtual index, without applying the requested offset a second time.
function appendViewRows(upstream, localRows, options) {
  if (!Number.isSafeInteger(upstream?.nativeOffset)) return { ...upstream, available: upstream?.available === true || localRows.length > 0, rows: [...(upstream?.rows || []), ...localRows] };
  const offset = options.offset || 0, limit = options.limit || 40, total = upstream.totalRows;
  if (!Number.isSafeInteger(total) || total < 0 || upstream.nativeOffset !== offset || !Array.isArray(upstream.rows)) fail('INVALID_STATE');
  const rows = [...upstream.rows];
  if (offset + rows.length >= total && rows.length < limit) rows.push(...localRows.slice(Math.max(0, offset - total), Math.max(0, offset - total) + limit - rows.length));
  const totalRows = total + localRows.length, next = offset + rows.length;
  return { ...upstream, available: upstream.available === true || localRows.length > 0, rows, totalRows,
    sourceTotalRows: Math.max(total, upstream.sourceTotalRows || 0) + localRows.length,
    nextOffset: rows.length && next < totalRows ? next : null,
    truncated: upstream.sourceTruncated === true || offset > 0 || next < totalRows };
}
function projectSafeData(value, depth = 0) {
  if (depth > 8) return null;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return secretish.test(value) ? '[redacted]' : value.slice(0, 500);
  if (Array.isArray(value)) return value.slice(0, 100).map(item => projectSafeData(item, depth + 1));
  if (!record(value)) return null;
  const out = {};
  for (const key of Object.keys(value).slice(0, 200)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!safeNames.has(key) || !d || !('value' in d)) continue;
    out[key] = ['message', 'description', 'reason'].includes(key) ? '[untrusted text omitted]' : projectSafeData(d.value, depth + 1);
  }
  return out;
}

function createFullFeatureAdapter({ runtime, enabled = false, allowedOperations = [], policyTarget = null, gameCosts = [] } = {}) {
  const allow = new Set(allowedOperations);
  // Correlation boundary, not authentication or a grant. A replaced adapter
  // cannot certify absence of old worker-lifetime pending writes.
  const recoveryEpoch = 'adapter-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  validate(GAME_COST_POLICIES_SCHEMA, gameCosts, 'INVALID_RUNTIME');
  const costs = new Map();
  for (const rule of gameCosts) {
    if (!record(rule) || !getAction(rule.operation) || !['bounded', 'unquoted-game-resources', 'unbounded-recurring-game-resources'].includes(rule.mode) || costs.has(rule.operation) || !valid(targetSchema, policyTarget)) fail('INVALID_RUNTIME');
    costs.set(rule.operation, rule.mode);
  }
  const audit = [];
  const fallbackVersions = new Map();
  const dailyViews = new Map();
  const pending = new Map();
  const operationContexts = new Map();
  const dispatchSchema = object({ target: targetSchema, operationId: operationIdSchema, action: ACTION_SCHEMA, expectedGeneration: tokenSchema, expectedRevision: identifier });
  const pendingKey = req => `${req.target.accountId}/${req.target.profileInstallationId}/${req.operationId}`;
  const checkEnabled = () => { if (enabled !== true) fail('ADAPTER_DISABLED'); if (!runtime || !['original-1.7.0', 'fixed-1.9'].includes(runtime.sourceVersion)) fail('INVALID_RUNTIME'); };
  const captureSession = () => {
    const captured = typeof runtime.captureSession === 'function' ? runtime.captureSession() : () => true;
    if (typeof captured !== 'function') fail('SESSION_CLOSED');
    const check = () => { if (captured() !== true) fail('SESSION_CLOSED'); };
    check(); return check;
  };
  const log = (req, status, code) => {
    const context = operationContexts.get(pendingKey(req));
    audit.push({ source: 'bridge', at: Date.now(), accountId: req.target.accountId, profileInstallationId: req.target.profileInstallationId, operationId: req.operationId, operation: req.action.operation, feature: getAction(req.action.operation)?.group, status, code: safeCode(code), correlatedToOperation: true, attribution: 'bridge-request', textOmitted: true, ...(context ? { documentId: context.binding.documentId, generation: context.binding.generation, sessionCheck: context.sessionCheck } : {}) });
    if (audit.length > 100) audit.shift();
  };
  async function bindIdentity(target, expected, sessionCheck) {
    sessionCheck();
    const docs = await runtime.enumerateDocuments();
    sessionCheck();
    // All COR3 documents in this extension/profile, not a caller-filtered subset.
    if (!Array.isArray(docs) || docs.length !== 1) fail('TARGET_AMBIGUOUS');
    const doc = docs[0];
    if (!record(doc) || !Number.isSafeInteger(doc.tabId) || doc.tabId < 0 || doc.frameId !== 0 || !valid(identifier, doc.documentId) || !urlOK(doc.url) || doc.loading || doc.pendingUrl) fail('IDENTITY_UNKNOWN');
    const identity = await runtime.readIdentity(structuredClone(doc));
    sessionCheck();
    if (!record(identity) || !valid(targetSchema, { accountId: identity.accountId, profileInstallationId: identity.profileInstallationId }) || !sameTarget(identity, target) || !valid(tokenSchema, identity.generation) || identity.documentId !== doc.documentId) fail('IDENTITY_UNKNOWN');
    const now = { ...doc, ...target, generation: identity.generation };
    if (expected && !sameDocument(now, expected)) fail('IDENTITY_CHANGED');
    return now;
  }
  async function snapshotState(target, binding, options = { mode: 'binding' }, sessionCheck) {
    const before = await bindIdentity(target, binding, sessionCheck);
    sessionCheck();
    const state = await runtime.readState(structuredClone(before), options, sessionCheck);
    await bindIdentity(target, before, sessionCheck);
    if (!record(state) || !valid(identifier, state.revision) || !record(state.data)) fail('INVALID_STATE');
    const data = {};
    for (const view of READ_SCOPES) if (options.mode === 'view' && options.view === view && Object.hasOwn(state.data, view)) data[view] = view === 'logs' ? projectSafeLogs(state.data.logs) : projectSafeData(state.data[view]);
    const upstream = data.logs;
    if (upstream?.rows) upstream.rows = upstream.rows.map(row => ({ ...row, documentId: before.documentId, generation: before.generation }));
    const versions = fallbackVersions.get(`${target.accountId}/${target.profileInstallationId}/${before.documentId}`);
    if (options.view === 'versions' && versions) data.versions = appendViewRows(data.versions, Object.entries(versions).map(([name, value]) => ({ name, value })), options);
    const daily = dailyViews.get(`${target.accountId}/${target.profileInstallationId}/${before.documentId}`);
    if (options.view === 'daily' && daily) data.daily = structuredClone(daily);
    if (options.mode === 'view' && options.view === 'logs') data.logs = { ...appendViewRows(upstream, audit.filter(row => {
      if (row.accountId !== target.accountId || row.profileInstallationId !== target.profileInstallationId || row.documentId !== before.documentId || row.generation !== before.generation || Date.now() < row.at || Date.now() - row.at > 600000) return false;
      try { row.sessionCheck(); return true; } catch { return false; }
    }).map(({ sessionCheck, accountId, profileInstallationId, ...row }) => row), options), available: true, source: 'bridge', upstreamLogsUnavailable: upstream?.available !== true, upstreamLogsCorrelatedToOperation: false, upstreamAvailabilityCode: upstream?.available === true ? 'CURRENT_DOCUMENT_EVENTS' : 'NO_FRESH_DOCUMENT_EVENTS' };
    if (options.mode === 'view') {
      const section = data[options.view] || { available: false, rows: [] };
      if (!Number.isSafeInteger(section.nativeOffset)) {
        const rows = Array.isArray(section.rows) ? section.rows : [], offset = options.offset || 0, limit = options.limit || 40;
        section.sourceTotalRows = section.sourceTotalRows ?? rows.length;
        section.totalRows = rows.length;
        section.rows = rows.slice(offset, offset + limit); section.nativeOffset = offset;
        section.nextOffset = offset + section.rows.length < rows.length ? offset + section.rows.length : null;
        section.truncated = section.sourceTruncated === true || offset > 0 || section.nextOffset !== null;
      }
      if (!Number.isSafeInteger(section.totalRows) || section.totalRows < 0) section.totalRows = Number.isSafeInteger(section.sourceTotalRows) ? section.sourceTotalRows : null;
      const encoder = new TextEncoder();
      while (Array.isArray(section.rows) && section.rows.length && encoder.encode(JSON.stringify(section)).byteLength > 48000) { section.rows.pop(); section.truncated = true; section.nextOffset = section.nativeOffset + section.rows.length; }
      if (encoder.encode(JSON.stringify(section)).byteLength > 48000) fail('INVALID_STATE');
      data[options.view] = section;
    }
    return { target: structuredClone(target), generation: before.generation, revision: state.revision, data, ...(options.mode === 'binding' ? { bindingDocumentId: before.documentId, recoveryEpoch } : {}) };
  }
  async function inspect(input, options = { mode: 'binding' }) {
    const target = validate(targetSchema, input); checkEnabled();
    const sessionCheck = captureSession();
    const query = validate({ oneOf: [object({ mode: literal('binding') }), object({ mode: literal('view'), view: enumeration(READ_SCOPES), offset: integer(0, 1000000), limit: integer(1, 40) }, ['offset', 'limit'])] }, options);
    return serial(target.accountId, async () => { try { return await snapshotState(target, await bindIdentity(target, undefined, sessionCheck), query, sessionCheck); } catch (error) { fail(cleanError(error)); } });
  }
  async function dispatch(input) {
    const req = validate(dispatchSchema, input);
    const response = (status, code, extras = {}) => ({ target: req.target, generation: req.expectedGeneration, operationId: req.operationId, status, code, ...extras });
    const finish = (status, code, extras) => { log(req, status, code); return response(status, code, extras); };
    let sessionCheck;
    try { checkEnabled(); sessionCheck = captureSession(); } catch (error) { return finish('rejected', cleanError(error)); }
    const bind = (target, expected) => bindIdentity(target, expected, sessionCheck);
    const snapshot = (target, binding, options = { mode: 'binding' }) => snapshotState(target, binding, options, sessionCheck);
    if (!allow.has(req.action.operation)) return finish('rejected', 'SCOPE_DENIED');
    if (policyTarget && !sameTarget(policyTarget, req.target)) return finish('rejected', 'SCOPE_DENIED');
    const spec = specs.get(req.action.operation), definition = getAction(req.action.operation), params = req.action.parameters;
    if (actionStartsAutomation(req.action) && definition.requiresStopScopes?.some(scope => !allow.has(scope))) return finish('rejected', 'SCOPE_DENIED');
    if (req.action.operation === 'requestExpeditionConfig' && params.mercenaryId !== undefined) return finish('unsupported', 'ORIGINAL_MERCENARY_ARGUMENT_IGNORED');
    if (!spec) return finish('unsupported', gaps[req.action.operation] || 'NO_VERIFIED_MAPPING');
    if (spec.versions && !spec.versions.includes(runtime.sourceVersion)) return finish('unsupported', 'UNSUPPORTED_SOURCE_VERSION');
    return serial(req.target.accountId, async () => {
      let sent = false;
      let binding;
      const isStop = spec.stop || spec.toggle && params.enabled === false;
      const masterPause = spec.master && params.paused === true;
      const isCosmetic = spec.cosmetic === true;
      const guard = uncertain.get(req.target.accountId);
      const gameCostMode = costs.get(req.action.operation) || 'bounded';
      const makeGuard = () => ({ group: definition.group, operationId: req.operationId, localAutomation: isStop || actionStartsAutomation(req.action), masterResume: spec.master === true && params.paused === false, profileInstallationId: req.target.profileInstallationId, documentId: binding.documentId, generation: binding.generation, ...(definition.group === 'hackSolvers' ? { pendingGroups: ['decrypt', 'ice', 'simpleDecrypt'] } : {}) });
      try {
        binding = await bind(req.target);
        operationContexts.set(pendingKey(req), { binding: structuredClone(binding), sessionCheck });
        if (operationContexts.size > 256) operationContexts.delete(operationContexts.keys().next().value);
        if (binding.generation !== req.expectedGeneration) fail('STALE_GENERATION');
        const state = await snapshot(req.target, binding);
        if (state.revision !== req.expectedRevision) fail('STALE_REVISION');
        const observableToggle = runtime.sourceVersion === 'fixed-1.9' && ['toggleDailyHackSolver', 'toggleIceWallSolver', 'toggleDecryptSolver', 'toggleSimpleDecryptSolver'].includes(req.action.operation);
        if (observableToggle && params.enabled === true) {
          // A saved value does not reconcile an interrupted operation. The
          // direct endpoint has the same fail-closed rule as the durable broker.
          if (guard) fail('ACCOUNT_OPERATION_UNCONFIRMED');
          await bind(req.target, binding);
          const currentPreference = await runtime.readPreference(structuredClone(binding), 'sync', [spec.preferenceKey]);
          await bind(req.target, binding);
          if (currentPreference?.[spec.preferenceKey] === true) return finish('completed', 'PREFERENCE_UNCHANGED_NOOP');
          if (typeof runtime.readAutomationStatus !== 'function') fail('AUTOMATION_STATUS_UNAVAILABLE');
          const current = await runtime.readAutomationStatus(structuredClone(binding), sessionCheck);
          await bind(req.target, binding);
          if (['toggleDecryptSolver','toggleSimpleDecryptSolver'].includes(req.action.operation) && !current?.[definition.group === 'simpleDecrypt' ? 'simple' : definition.group]) fail('AUTOMATION_STATUS_UNAVAILABLE');
          if (current?.gate?.ready !== true || current.gate.allowed !== true || current.gate.reloadRequired !== false) fail('AUTOMATION_GATE_CLOSED');
        }
        if (observableToggle && params.enabled === false && typeof runtime.readAutomationStatus === 'function') {
          await bind(req.target, binding);
          const currentPreference = await runtime.readPreference(structuredClone(binding), 'sync', [spec.preferenceKey]);
          await bind(req.target, binding);
          if (currentPreference?.[spec.preferenceKey] === false) {
            let current;
            try { current = await runtime.readAutomationStatus(structuredClone(binding), sessionCheck); }
            catch (error) { if (['IDENTITY_CHANGED', 'SESSION_CLOSED', 'TARGET_AMBIGUOUS'].includes(error?.code)) throw error; }
            await bind(req.target, binding);
            const f = current?.[definition.group === 'simpleDecrypt' ? 'simple' : definition.group];
            if (f?.state === 'stopped' && f.evidence === 'observed-local-lifecycle' && f.isolatedSchedulerClosed && f.guardClosed && f.queuesInvalidated && f.activeRunsAborted) {
              const existing = uncertain.get(req.target.accountId);
              if (existing?.profileInstallationId === binding.profileInstallationId && existing.documentId === binding.documentId && existing.generation === binding.generation && existing.group === definition.group && existing.localAutomation) uncertain.delete(req.target.accountId);
              return finish('completed', 'LOCAL_LIFECYCLE_ALREADY_STOPPED', { stopped: true });
            }
          }
        }
        if (latched.get(req.target.accountId)?.documentId === binding.documentId && !spec.master && !isStop && !isCosmetic && !spec.defaults) fail('DOCUMENT_RELOAD_REQUIRED');
        // A changed document cannot prove that previously accepted server work stopped.
        const matchingGuard = guard && guard.profileInstallationId === req.target.profileInstallationId && guard.documentId === binding.documentId && guard.generation === binding.generation;
        const matchingGroup = guard && (guard.group === definition.group || guard.group === 'hackSolvers' && guard.pendingGroups?.includes(definition.group) || isControllerMitigation(req.action, guard.group));
        const preferenceMitigation = spec.transport === 'preference' && isMitigation(req.action);
        if (guard && !isCosmetic && !masterPause && !((isStop || preferenceMitigation) && matchingGuard && matchingGroup)) fail('ACCOUNT_OPERATION_UNCONFIRMED');
        const fingerprints = semanticFingerprints(req.action);
        if ((acceptedEffects.get(req.target.accountId) || []).some(effect => fingerprintsConflict(effect.fingerprints, effectFootprint(req.action)))) fail('EFFECT_UNVERIFIED');
        if (spec.recurring && actionStartsAutomation(req.action) && gameCostMode !== 'unbounded-recurring-game-resources') fail('GAME_COST_POLICY_REQUIRED');
        const io = async fn => {
          await bind(req.target, binding); // Last await immediately before side effect.
          sessionCheck();
          sent = true;
          if (!pending.has(pendingKey(req))) { pending.set(pendingKey(req), { request: structuredClone(req), binding: structuredClone(binding), sentAt: Date.now() }); if (pending.size > 256) pending.delete(pending.keys().next().value); }
          let result, thrown;
          try { result = await fn(); } catch (error) { thrown = error; }
          await bind(req.target, binding); // Always check after success or failure.
          if (thrown) throw thrown;
          return result;
        };
        const send = message => io(() => runtime.sendContent(structuredClone(binding), structuredClone(message), sessionCheck));
        const sendRuntime = message => io(() => runtime.sendRuntime(structuredClone(message), sessionCheck, { operationId: req.operationId }));
        const write = async (area, patch) => {
          await io(() => runtime.writePreference(structuredClone(binding), area, structuredClone(patch), sessionCheck));
          await bind(req.target, binding);
          const readback = await runtime.readPreference(structuredClone(binding), area, Object.keys(patch));
          await bind(req.target, binding);
          if (!record(readback) || Object.keys(patch).some(key => JSON.stringify(readback[key]) !== JSON.stringify(patch[key]))) fail('INVALID_STATE');
        };
        let hydrated = null;
        let cleanupJobs = null;
        if (spec.custom === 'cleanup' || spec.cleanup && params.enabled) {
          if (typeof runtime.readContext !== 'function') fail('DATA_NOT_READY');
          await bind(req.target, binding);
          const context = await runtime.readContext(structuredClone(binding), 'failedJobs');
          await bind(req.target, binding);
          if (!record(context) || !record(context.target) || !sameTarget(context.target, req.target) || context.documentId !== binding.documentId || context.generation !== binding.generation || context.revision !== state.revision || !Number.isSafeInteger(context.observedAt) || context.observedAt > Date.now() || Date.now() - context.observedAt > 30000) fail('DATA_NOT_READY');
          cleanupJobs = validate(CONTEXT_SCHEMAS.failedJobs, context.data, 'INVALID_CONTEXT').jobs;
          if (cleanupJobs.length > 100) fail('DATA_TRUNCATED');
        }
        if (spec.hydration) {
          if (req.action.operation === 'setAutoSendMerc' && (params.enabled === false || params.autoChooseMerc && params.mercenaryId === null)) {
            await bind(req.target, binding);
            const prior = await runtime.readPreference(structuredClone(binding), 'sync', ['autoSendMerc']);
            await bind(req.target, binding);
            hydrated = { autoSendMerc: { ...params, mercenaryName: typeof prior?.autoSendMerc?.mercenaryName === 'string' ? prior.autoSendMerc.mercenaryName.slice(0, 160) : '', disabledReason: params.enabled ? null : prior?.autoSendMerc?.disabledReason || null } };
          } else if (req.action.operation === 'repairDrone' && gameCostMode === 'unquoted-game-resources') hydrated = { action: 'repairDrone', targetDurability: params.targetDurability };
          else {
            if (typeof runtime.readContext !== 'function') fail('DATA_NOT_READY');
            await bind(req.target, binding);
            const context = await runtime.readContext(structuredClone(binding), spec.hydration);
            await bind(req.target, binding);
            if (!context) fail('DATA_NOT_READY');
            if (!record(context) || !record(context.target) || !sameTarget(context.target, req.target) || context.documentId !== binding.documentId || context.generation !== binding.generation || context.revision !== state.revision || !Number.isSafeInteger(context.observedAt) || context.observedAt > Date.now() || Date.now() - context.observedAt > 30000) fail('STALE_CONTEXT');
            hydrated = hydrateOperation(req.action.operation, params, context.data, Date.now(), { gameCostMode });
            if (req.action.operation === 'launchExpedition' && gameCostMode === 'unquoted-game-resources') {
              await bind(req.target, binding);
              const mercs = await runtime.readContext(structuredClone(binding), 'mercenaries');
              await bind(req.target, binding);
              if (!record(mercs) || !record(mercs.target) || !sameTarget(mercs.target, req.target) || mercs.documentId !== binding.documentId || mercs.generation !== binding.generation || mercs.revision !== state.revision || !Number.isSafeInteger(mercs.observedAt) || mercs.observedAt > Date.now() || Date.now() - mercs.observedAt > 30000 || !Array.isArray(mercs.data?.mercenaries) || mercs.data.mercenaries.filter(m => m.id === params.config.mercenaryId).length !== 1) fail('DATA_NOT_READY');
            }
          }
        }
        // Optional private lifecycle hook. The original callback is NOT a stop ACK.
        let stopObservation = null;
        if (isStop && !spec.synchronousStop && typeof runtime.prepareStopObservation === 'function') {
          await bind(req.target, binding);
          stopObservation = await runtime.prepareStopObservation(structuredClone(binding), { operationId: req.operationId, operation: req.action.operation, feature: definition.group }, sessionCheck);
          await bind(req.target, binding);
        }
        let result;
        if (spec.defaults) {
          const keys = ['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled'];
          await bind(req.target, binding);
          const before = await runtime.readPreference(structuredClone(binding), 'sync', keys);
          await bind(req.target, binding);
          if (keys.every(key => before?.[key] === true)) return finish('completed', 'PREFERENCE_UNCHANGED_NOOP');
          const saved = await sendRuntime({action:'setThreeSolverDefaults'});
          if (saved?.ok !== true || saved.persisted !== true || saved.started !== false) {
            const code = ['PREFERENCE_SAVE_REQUIRES_PAUSE','PREFERENCE_SAVE_FRAME_UNCONFIRMED','PREFERENCE_SAVE_STATE_CHANGED'].includes(saved?.code) ? saved.code : 'PREFERENCE_SAVE_FRAME_UNCONFIRMED';
            // Unknown dispatch outcome never triggers a compensating settings write.
            result = response(saved?.persisted === false ? 'rejected' : 'unconfirmed', code);
          } else {
            await bind(req.target, binding);
            const after = await runtime.readPreference(structuredClone(binding), 'sync', keys);
            await bind(req.target, binding);
            if (!keys.every(key => after?.[key] === true)) fail('INVALID_STATE');
            result = response('completed', 'THREE_SOLVER_DEFAULTS_SAVED');
          }
        } else if (spec.master) {
          if (!params.paused) {
            const required = { autoDecryptEnabled: 'toggleDecryptSolver', autoIceWallEnabled: 'toggleIceWallSolver', autoSimpleDecryptEnabled: 'toggleSimpleDecryptSolver', autoDailyHackEnabled: 'toggleDailyHackSolver', autoUpdateMarkets: 'setAutoUpdateMarkets', secretFinderEnabled: 'setSecretFinder', autoFinishAllJobsEnabled: 'setAutoFinishAllJobs', autoCleanupFailedJobsEnabled: 'setAutoCleanupFailedJobsEnabled' };
            const keys = [...Object.keys(required), 'autoSendMerc', 'autoDrone', 'autoRefresh'];
            await bind(req.target, binding);
            const prefs = await runtime.readPreference(structuredClone(binding), 'sync', keys);
            await bind(req.target, binding);
            if (!record(prefs)) fail('DATA_NOT_READY');
            // These fixed1.9 consumers use truthiness. Missing values default
            // off, but malformed truthy stored values must not bypass scopes.
            for (const [key, operation] of Object.entries(required)) if (prefs[key] && !allow.has(operation)) fail('SCOPE_DENIED');
            const check = (on, operation, recurring = false) => { if (on && (!allow.has(operation) || recurring && costs.get(operation) !== 'unbounded-recurring-game-resources')) fail('SCOPE_DENIED'); };
            check(prefs.autoSendMerc?.enabled, runtime.sourceVersion === 'fixed-1.9' ? 'setAutoSendMercV19' : 'setAutoSendMerc', true);
            check(prefs.autoDrone?.enabled, 'setAutoDrone', true);
            check(prefs.autoFinishAllJobsEnabled, 'setAutoFinishAllJobs', true);
            check(Object.values(prefs.autoRefresh || {}).some(Boolean), 'updateAutoRefresh');
          }
          result = await sendRuntime({ action: 'cor3SetHelperMode', paused: params.paused });
          const frames = result?.frames;
          const confirmed = result?.ok === true && result.persisted === true && result.paused === params.paused && Array.isArray(result.unconfirmed) && result.unconfirmed.length === 0 && Array.isArray(result.issues) && result.issues.length === 0 && Array.isArray(frames) && frames.length > 0 && frames.length <= 32 && frames.some(frame => frame?.frameId === 0) && new Set(frames.map(frame => frame?.frameId)).size === frames.length && frames.every(frame => frame?.tabId === binding.tabId && Number.isSafeInteger(frame.frameId) && frame.frameId >= 0 && frame.ok === true && Array.isArray(frame.errors) && frame.errors.length === 0 && frame.state?.ready === true && (params.paused ? frame.state.allowed === false : true));
          if (params.paused) latched.set(req.target.accountId, { documentId: binding.documentId, generation: binding.generation });
          const localMasterClosed = confirmed && params.paused && result.localMasterClosed === true && result.masterClosureOperationId === req.operationId;
          if (!confirmed) {
            const issue = result?.issues?.[0];
            const code = typeof issue === 'string' && /^MASTER_[A-Z_]+$/.test(issue) && safeCode(issue) === issue ? issue : 'MASTER_ACK_INCOMPLETE';
            uncertain.set(req.target.accountId, guard || makeGuard()); result = response('unconfirmed', code);
          }
          else result = response('completed', params.paused ? 'MASTER_PAUSED_DOCUMENT_LATCHED' : 'MANUAL_RELOAD_REQUIRED', { ...(params.paused ? { stopped: true, ...(localMasterClosed ? { localMasterClosed: true } : {}) } : {}), reloadRequired: true });
          // Confirmed all-frame master closure resolves local automation guards,
          // never an uncertain one-shot action already submitted to the server.
          if (confirmed && params.paused && matchingGuard && (guard.localAutomation || localMasterClosed && guard.masterResume === true)) uncertain.delete(req.target.accountId);
        } else if (spec.transport === 'preference') {
          let previousMerc = null;
          if (req.action.operation === 'setAutoSendMercV19') {
            await bind(req.target, binding);
            const prior = await runtime.readPreference(structuredClone(binding), 'sync', ['autoSendMerc']);
            await bind(req.target, binding);
            previousMerc = record(prior?.autoSendMerc) ? prior.autoSendMerc : {};
            const reason = typeof previousMerc.disabledReason === 'string' && previousMerc.disabledReason.length <= 160 ? previousMerc.disabledReason : null;
            hydrated = { autoSendMerc: { ...params, disabledReason: previousMerc.enabled !== params.enabled ? null : reason } };
          }
          if (hydrated) await write('sync', hydrated);
          else if (spec.custom === 'valuableSelection') await write('local', { valuableSelectedServers: params.selectedServers, valuableSelectedDownloads: params.selectedDownloads });
          else if (spec.custom === 'pinnedTimers') {
            const pinnedTimers = {};
            for (const item of params.timers) {
              const key = item.timer.kind === 'builtIn' ? item.timer.timer : `exp_${item.timer.expeditionId}`;
              if (Object.hasOwn(pinnedTimers, key)) fail('INVALID_ARGUMENTS');
              pinnedTimers[key] = item.pinned;
            }
            await write('sync', { pinnedTimers });
          } else await write(spec.area, { [spec.key]: spec.whole ? params : params[spec.param] });
          if (spec.schedule) await sendRuntime({ action: 'scheduleAutoFinishAll' });
          if (spec.cleanup && params.enabled && cleanupJobs.length) await send({ action: 'autoCleanupFailedJobs', jobs: cleanupJobs });
          if (req.action.operation === 'setAutoDrone' && params.enabled && !params.paused) await send({ action: 'requestDroneOptions' });
          if (previousMerc && previousMerc.hasInsurance !== params.hasInsurance) await send({ action: 'requestMercenaries' });
          if (spec.startAction && params.enabled) await send({ action: 'startIpSearch' });
          result = response(isCosmetic || isMitigation(req.action) ? 'completed' : 'unconfirmed', isCosmetic ? 'PREFERENCE_SAVED' : 'PREFERENCE_ONLY_NOT_STOP');
        } else {
          const message = hydrated || (spec.custom === 'cleanup' ? { action: 'autoCleanupFailedJobs', jobs: cleanupJobs } : { action: req.action.operation });
          if (spec.custom === 'cleanup' && !cleanupJobs.length) { const result = response('completed', 'NO_FAILED_JOBS'); log(req, result.status, result.code); return result; }
          for (const field of spec.fields) if (Object.hasOwn(params, field)) message[field] = params[field];
          if (spec.preferenceKey) await write('sync', { [spec.preferenceKey]: params.enabled });
          if (spec.custom === 'alarms') {
            message.alarms = params.alarms.map(a => ({ id: a.id, timerSource: a.timer.kind === 'builtIn' ? a.timer.timer : `exp_${a.timer.expeditionId}`, thresholdSeconds: a.thresholdSeconds, continuous: a.continuous, volume: a.volume, enabled: a.enabled }));
            await write('sync', { alarms: message.alarms });
          }
          if (spec.custom === 'autoRefresh') await write('sync', { autoRefresh: params.autoRefresh });
          let observation = null;
          if (definition.group === 'refresh' && typeof runtime.prepareObservation === 'function') {
            await bind(req.target, binding);
            observation = await runtime.prepareObservation(structuredClone(binding), { operation: req.action.operation, operationId: req.operationId, parameters: structuredClone(params) });
            await bind(req.target, binding);
          }
          const ack = await send(message);
          if (['AUTOMATION_GATE_CLOSED', 'AUTOMATION_COMMAND_FAILED', 'AUTOMATION_SUPERSEDED'].includes(ack?.cor3ObservableError)) fail(ack.cor3ObservableError);
          let observed = false;
          if (observation && typeof observation.finish === 'function') {
            const receipt = await observation.finish(); await bind(req.target, binding);
            observed = record(receipt) && record(receipt.target) && sameTarget(receipt.target, req.target) && receipt.documentId === binding.documentId && receipt.generation === binding.generation && receipt.operationId === req.operationId && receipt.operation === req.action.operation && receipt.status === 'completed';
          }
          let stopConfirmed = false;
          if (stopObservation && typeof stopObservation.finish === 'function' && Array.isArray(stopObservation.armedRuns) && stopObservation.armedRuns.length > 0 && stopObservation.armedRuns.length <= 32) {
            const receipt = await stopObservation.finish(); await bind(req.target, binding);
            const frames = receipt?.frames;
            stopConfirmed = record(receipt) && record(receipt.target) && sameTarget(receipt.target, req.target) && receipt.documentId === binding.documentId && receipt.generation === binding.generation && receipt.operationId === req.operationId && receipt.operation === req.action.operation && receipt.feature === definition.group && receipt.stopped === true && (!observableToggle || receipt.evidence === 'observed-local-lifecycle') && Array.isArray(frames) && frames.length === stopObservation.armedRuns.length && new Set(frames.map(f => f.frameId)).size === frames.length && frames.every(frame => {
              const armed = stopObservation.armedRuns.find(run => run.frameId === frame.frameId);
              return armed && Number.isSafeInteger(frame.frameId) && frame.frameId >= 0 && valid(identifier, frame.runId) && frame.runId === armed.runId && Number.isSafeInteger(armed.abortGeneration) && Number.isSafeInteger(frame.abortGeneration) && frame.abortGeneration > armed.abortGeneration && frame.guardClosed === true && frame.epochAdvanced === true && frame.queuesInvalidated === true && frame.activeRunsAborted === true;
            });
          }
          if (req.action.operation === 'fetchDailyOps' && record(ack?.data) && typeof ack.data.hasClaimedToday === 'boolean' && Number.isSafeInteger(ack.data.currentStreak) && ack.data.currentStreak >= 0 && ack.data.currentStreak <= 1000000 && typeof ack.data.difficulty === 'string' && /^[A-Za-z0-9_. -]{1,80}$/.test(ack.data.difficulty) && (ack.data.nextTaskTime === null || typeof ack.data.nextTaskTime === 'string' && Number.isFinite(Date.parse(ack.data.nextTaskTime)))) {
            dailyViews.set(`${req.target.accountId}/${req.target.profileInstallationId}/${binding.documentId}`, { available: true, rows: ['hasClaimedToday', 'currentStreak', 'difficulty', 'nextTaskTime'].map(name => ({ name, value: ack.data[name] })), updatedAt: Date.now() });
            result = response('completed', 'DATA_OBSERVED');
          }
          else if (observed) result = response('completed', 'DATA_OBSERVED');
          else if (spec.readReply) {
            const keys = ['webVersion', 'systemVersion', 'patchVersion'];
            const versions = {};
            if (record(ack) && Object.keys(ack).every(key => keys.includes(key))) for (const key of keys) if (typeof ack[key] === 'string' && /^[A-Za-z0-9][A-Za-z0-9._+-]{0,79}$/.test(ack[key])) versions[key] = ack[key];
            if (Object.keys(versions).length) { fallbackVersions.set(`${req.target.accountId}/${req.target.profileInstallationId}/${binding.documentId}`, versions); result = response('completed', 'READ_COMPLETE'); }
            else result = response('unconfirmed', 'COMMAND_OUTCOME_UNCONFIRMED');
          }
          else if (spec.synchronousStop && ack?.success === true) result = response('completed', 'ALARM_STOPPED', { stopped: true });
          else if (isStop && stopConfirmed) result = response('completed', observableToggle ? 'OBSERVED_LOCAL_LIFECYCLE_STOPPED' : 'LOCAL_WRITE_GUARD_CLOSED', { stopped: true });
          else if (isStop) result = response('unconfirmed', observableToggle ? 'STOP_LIFECYCLE_UNCONFIRMED' : 'STOP_ACK_UNAVAILABLE');
          else if (ack?.success === true || ack?.ok === true) result = response('accepted', 'ACCEPTED_NOT_COMPLETED');
          else result = response('unconfirmed', 'COMMAND_OUTCOME_UNCONFIRMED');
        }
        if (COST_OPERATIONS.includes(req.action.operation)) result.gameCost = { mode: gameCostMode, limitEnforced: gameCostMode === 'bounded' };
        if (!isCosmetic && (result.status === 'unconfirmed' || result.status === 'accepted' && makeGuard().localAutomation)) uncertain.set(req.target.accountId, guard || makeGuard());
        if (result.status === 'accepted' && !makeGuard().localAutomation && fingerprints.length) {
          const reservations = acceptedEffects.get(req.target.accountId) || [];
          reservations.push({ operationId: req.operationId, profileInstallationId: req.target.profileInstallationId, fingerprints });
          acceptedEffects.set(req.target.accountId, reservations);
        }
        if (isStop && result.status === 'completed' && result.stopped === true && matchingGuard && matchingGroup) {
          if (guard.group === 'hackSolvers') { guard.pendingGroups = guard.pendingGroups.filter(group => group !== definition.group); if (!guard.pendingGroups.length) uncertain.delete(req.target.accountId); }
          else uncertain.delete(req.target.accountId);
        }
        log(req, result.status, result.code);
        return result;
      } catch (error) {
        const code = cleanError(error);
        if (sent && !isCosmetic) uncertain.set(req.target.accountId, guard || makeGuard());
        const result = response(sent ? 'unconfirmed' : 'rejected', code);
        log(req, result.status, code); return result;
      }
    });
  }
  async function reconcile(input) {
    const req = validate(dispatchSchema, input);
    const response = (status, code, extras = {}) => ({ target: req.target, generation: req.expectedGeneration, operationId: req.operationId, status, code, ...extras });
    let sessionCheck;
    try { checkEnabled(); sessionCheck = captureSession(); } catch (error) { return response('unconfirmed', cleanError(error)); }
    const bind = (target, expected) => bindIdentity(target, expected, sessionCheck);
    const snapshot = (target, binding, options = { mode: 'binding' }) => snapshotState(target, binding, options, sessionCheck);
    if (!allow.has(req.action.operation) || policyTarget && !sameTarget(policyTarget, req.target)) return response('unconfirmed', 'SCOPE_DENIED');
    if (!['equipHardware', 'equipSoftware', 'unequipSoftware', 'respondDecision'].includes(req.action.operation)) return response('unsupported', 'RECONCILIATION_UNSUPPORTED');
    return serial(req.target.accountId, async () => {
      try {
        const original = pending.get(pendingKey(req));
        if (!original) return response('unconfirmed', 'ADAPTER_RESTART_UNCONFIRMED');
        if (JSON.stringify(original.request) !== JSON.stringify(req)) return response('unconfirmed', 'OPERATION_CONFLICT');
        const binding = await bind(req.target, original.binding);
        if (binding.generation !== req.expectedGeneration) fail('STALE_GENERATION');
        if (original.proof) return structuredClone(original.proof);
        const current = await snapshot(req.target, binding, { mode: 'binding' });
        if (typeof runtime.readContext !== 'function') fail('DATA_NOT_READY');
        const domain = req.action.operation === 'respondDecision' ? 'decisionProof' : 'loadoutProof';
        await bind(req.target, binding);
        const context = await runtime.readContext(structuredClone(binding), domain);
        await bind(req.target, binding);
        if (!record(context) || !record(context.target) || !sameTarget(context.target, req.target) || context.documentId !== binding.documentId || context.generation !== binding.generation || context.revision !== current.revision || context.revision === req.expectedRevision || !Number.isSafeInteger(context.observedAt) || context.observedAt <= original.sentAt || context.observedAt > Date.now() || Date.now() - context.observedAt > 30000) fail('DATA_NOT_READY');
        const data = validate(CONTEXT_SCHEMAS[domain], context.data, 'INVALID_CONTEXT'), p = req.action.parameters;
        let confirmed = false;
        if (req.action.operation === 'equipHardware') confirmed = data.equippedHardwareIds.includes(p.moduleConfigId);
        else if (req.action.operation === 'equipSoftware') confirmed = data.equippedSoftwareIds.includes(p.moduleConfigId);
        else if (req.action.operation === 'unequipSoftware') confirmed = !data.equippedSoftwareIds.includes(p.moduleConfigId);
        else { const matches = data.decisions.filter(d => d.expeditionId === p.expeditionId && d.messageId === p.messageId); confirmed = matches.length === 1 && matches[0].resolved && matches[0].selectedOption === p.selectedOption; }
        if (!confirmed) return response('unconfirmed', 'STATE_NOT_CONFIRMED');
        const evidence = domain === 'loadoutProof' ? { kind: 'loadout-current-state', documentId: binding.documentId, generation: binding.generation, observedAt: context.observedAt, revision: context.revision, moduleConfigId: p.moduleConfigId, position: req.action.operation === 'equipHardware' ? 'hardware' : 'software', present: req.action.operation !== 'unequipSoftware', complete: true } : { kind: 'decision-current-state', documentId: binding.documentId, generation: binding.generation, observedAt: context.observedAt, revision: context.revision, expeditionId: p.expeditionId, messageId: p.messageId, selectedOption: p.selectedOption, resolved: true };
        const proof = validate(RECONCILE_RESPONSE_SCHEMA, response('reconciled', 'CURRENT_STATE_CONFIRMED', { evidence }), 'INVALID_RESPONSE');
        const guard = uncertain.get(req.target.accountId);
        if (guard?.operationId === req.operationId && guard.profileInstallationId === req.target.profileInstallationId && guard.documentId === binding.documentId && guard.generation === binding.generation) uncertain.delete(req.target.accountId);
        acceptedEffects.set(req.target.accountId, (acceptedEffects.get(req.target.accountId) || []).filter(effect => effect.operationId !== req.operationId || effect.profileInstallationId !== req.target.profileInstallationId));
        log(req, 'reconciled', 'CURRENT_STATE_CONFIRMED');
        original.proof = proof;
        return structuredClone(original.proof);
      } catch (error) { const code = cleanError(error); log(req, 'unconfirmed', code); return response('unconfirmed', code); }
    });
  }
  return Object.freeze({ inspect, dispatch, reconcile, describe: () => ADAPTER_COVERAGE });
}

return Object.freeze({ ADAPTER_COVERAGE, ADAPTER_CONTENT_MESSAGE_SCHEMA, validateAdapterContentMessage, ADAPTER_RUNTIME_MESSAGE_SCHEMA, validateAdapterRuntimeMessage, SAFE_LOG_SOURCES, projectSafeLogs, projectSafeData, createFullFeatureAdapter, classifyUpstreamLog: __m13.classifyUpstreamLog });
})();
const __m15 = (() => {
// In-memory display-only diagnostics. Never an authorization or routing input.
// Only fixed enums leave this module; no Chrome error text or binding is exported.
const { object, literal, enumeration, integer, tokenSchema, valid, validate } = __m2;
const NATIVE_STARTUP_CODES = Object.freeze(["ARGS","SELF_IDENTITY","BROWSER_PARENT","ORIGIN","PARENT_WINDOW","BROKER_PEER","ROLE_SEND","LEGACY_V2_NOT_RETIRED","LEGACY_V2_ACTIVE","LEGACY_V2_STATUS_UNKNOWN","POLICY_DISABLED","POLICY_INVALID","HASH_MISMATCH","PEER_REJECTED","FRAMING_FAILURE","TRANSPORT_UNAVAILABLE","BROKER_NOT_RUNNING","JOURNAL_UNAVAILABLE","INVALID_RESPONSE","PLATFORM_UNSUPPORTED"]);
const startupFailureSchema = object({ v: literal(3), type: literal('nativeStartupFailure'), code: enumeration(NATIVE_STARTUP_CODES) });
function nativeStartupFailureCode(value) {
  try { return valid(startupFailureSchema, value) && JSON.stringify(value).length <= 256 ? 'NATIVE_STARTUP_' + value.code : null; } catch { return null; }
}
const DIAGNOSTIC_PHASE_CODES = Object.freeze({
  policy: Object.freeze(['POLICY_DISABLED', 'POLICY_INVALID', 'POLICY_UNCONFIGURED', 'PROFILE_MISMATCH', 'POLICY_SCOPE_MISMATCH']),
  identity: Object.freeze(['IDENTITY_DISABLED', 'IDENTITY_NOT_READY', 'IDENTITY_CHECKING', 'IDENTITY_CHECKED', 'NO_COR3_TAB', 'MULTIPLE_COR3_TABS', 'TAB_LOADING', 'IDENTITY_NO_RESPONSE', 'IDENTITY_INVALID', 'IDENTITY_SCOPE_MISMATCH', 'IDENTITY_CHANGED', 'IDENTITY_TIMEOUT', 'API_NO_RECEIVER', 'API_CHANNEL_CLOSED', 'API_CONTEXT_INVALIDATED', 'API_ERROR_UNKNOWN']),
  native: Object.freeze([...NATIVE_STARTUP_CODES.map(code => 'NATIVE_STARTUP_' + code), 'NATIVE_CONNECT_ATTEMPT', 'PORT_OPEN', 'HELLO_SENT', 'GRANT_WAITING', 'NATIVE_HOST_NOT_FOUND', 'NATIVE_HOST_FORBIDDEN', 'NATIVE_HOST_START_FAILED', 'NATIVE_HOST_EXITED', 'NATIVE_IO_ERROR', 'NATIVE_HOST_NAME_INVALID', 'NATIVE_DISCONNECTED_UNKNOWN']),
  session: Object.freeze(['GRANT_RECEIVED', 'GRANT_REJECTED', 'GRANT_TIMEOUT', 'CONNECTED', 'SESSION_EXPIRED', 'SESSION_REJECTED', 'TARGET_CHANGED', 'TAB_CLOSED', 'QUEUE_LIMIT', 'RECONNECT_BACKOFF', 'SESSION_CLOSED']),
  background: Object.freeze(['BACKGROUND_SUSPENDED', 'BACKGROUND_UNAVAILABLE', 'DIAGNOSTIC_EXACT_DOCUMENT_NO_RESPONSE', 'DIAGNOSTIC_CURRENT_DOCUMENT_NO_RESPONSE', 'DIAGNOSTIC_CURRENT_DOCUMENT_MISMATCH', 'DIAGNOSTIC_TAB_CHANGED'])
});
const DIAGNOSTIC_PHASES = Object.freeze(Object.keys(DIAGNOSTIC_PHASE_CODES));
const DIAGNOSTIC_CODES = Object.freeze(Object.values(DIAGNOSTIC_PHASE_CODES).flat());
const stageSchema = object({ phase: enumeration(DIAGNOSTIC_PHASES), code: enumeration(DIAGNOSTIC_CODES) });
const DIAGNOSTIC_SCHEMA = object({ v: literal(1), phase: enumeration(DIAGNOSTIC_PHASES), code: enumeration(DIAGNOSTIC_CODES), lastFailure: { oneOf: [literal(null), stageSchema] } });
const bindingSchema = object({ tabId: integer(0, 2147483647), documentId: tokenSchema, generation: tokenSchema, url: { type: 'string', minLength: 1, maxLength: 8192 } });
const progression = new Set(['IDENTITY_NOT_READY', 'IDENTITY_CHECKING', 'IDENTITY_CHECKED', 'NATIVE_CONNECT_ATTEMPT', 'PORT_OPEN', 'HELLO_SENT', 'GRANT_WAITING', 'GRANT_RECEIVED', 'CONNECTED', 'RECONNECT_BACKOFF']);
// Without a verified document, only account-independent configuration/readiness
// information can be exposed. In particular, native/session outcomes are private.
const globalCodes = new Set([...DIAGNOSTIC_PHASE_CODES.policy.filter(code => code !== 'POLICY_SCOPE_MISMATCH'), ...DIAGNOSTIC_PHASE_CODES.identity.filter(code => !['IDENTITY_CHECKED', 'IDENTITY_SCOPE_MISMATCH', 'IDENTITY_CHANGED'].includes(code)), ...DIAGNOSTIC_PHASE_CODES.background]);
const stageValid = (phase, code) => Object.hasOwn(DIAGNOSTIC_PHASE_CODES, phase) && DIAGNOSTIC_PHASE_CODES[phase].includes(code);
const bindingValid = binding => {
  if (!valid(bindingSchema, binding)) return false;
  try { const url = new URL(binding.url); return url.protocol === 'https:' && ['cor3.gg', 'os.cor3.gg'].includes(url.hostname) && !url.port && !url.username && !url.password; } catch { return false; }
};
const sameBinding = (a, b) => a && b && a.tabId === b.tabId && a.documentId === b.documentId && a.generation === b.generation && a.url === b.url;
function isDiagnosticState(value) { return valid(DIAGNOSTIC_SCHEMA, value) && stageValid(value.phase, value.code) && (value.lastFailure === null || stageValid(value.lastFailure.phase, value.lastFailure.code) && !progression.has(value.lastFailure.code)); }
function validateDiagnosticState(value) { if (!isDiagnosticState(value)) { const error = new Error('INVALID_DIAGNOSTIC'); error.code = 'INVALID_DIAGNOSTIC'; throw error; } return validate(DIAGNOSTIC_SCHEMA, value, 'INVALID_DIAGNOSTIC'); }
function createConnectionDiagnostics({ now: _now } = {}) {
  let coarse = { v: 1, phase: 'identity', code: 'IDENTITY_NOT_READY', lastFailure: null }, own = null;
  function record(phase, code, binding = null) {
    if (!stageValid(phase, code) || binding !== null && !bindingValid(binding) || binding === null && !globalCodes.has(code)) return false;
    if (binding === null) {
      coarse = { v: 1, phase, code, lastFailure: progression.has(code) ? coarse.lastFailure : { phase, code } };
      // Coarse readiness supersedes a stale CONNECTED display, but must not
      // erase this document's last disconnect during a bounded retry.
      if (own) own.state = { v: 1, phase, code, lastFailure: own.state.lastFailure || coarse.lastFailure };
      return true;
    }
    const previous = sameBinding(own?.binding, binding) ? own.state.lastFailure : null;
    const lastFailure = code === 'CONNECTED' ? null : progression.has(code) ? previous : { phase, code };
    own = { binding: { tabId: binding.tabId, documentId: binding.documentId, generation: binding.generation, url: binding.url }, state: { v: 1, phase, code, lastFailure } };
    return true;
  }
  function snapshot(binding) {
    const knownBinding = bindingValid(binding);
    // Before any account/document binding exists, a freshly challenged document
    // may read only the account-independent initial identity failure. Once bound,
    // another document never receives that document's state or last failure.
    const state = knownBinding && sameBinding(own?.binding, binding) ? own.state : coarse.phase === 'policy' || coarse.code === 'IDENTITY_DISABLED' || knownBinding && own === null && coarse.phase === 'identity' ? coarse : { v: 1, phase: 'identity', code: 'IDENTITY_NOT_READY', lastFailure: null };
    return { v: 1, phase: state.phase, code: state.code, lastFailure: state.lastFailure && { phase: state.lastFailure.phase, code: state.lastFailure.code } };
  }
  return Object.freeze({ record, snapshot });
}

const nativeErrors = Object.freeze({
  'Specified native messaging host not found.': 'NATIVE_HOST_NOT_FOUND',
  'Access to the specified native messaging host is forbidden.': 'NATIVE_HOST_FORBIDDEN',
  'Failed to start native messaging host.': 'NATIVE_HOST_START_FAILED',
  'Native host has exited.': 'NATIVE_HOST_EXITED',
  'Error when communicating with the native messaging host.': 'NATIVE_IO_ERROR',
  'Invalid native messaging host name specified.': 'NATIVE_HOST_NAME_INVALID'
});
const apiErrors = Object.freeze({
  'Could not establish connection. Receiving end does not exist.': 'API_NO_RECEIVER',
  'The message port closed before a response was received.': 'API_CHANNEL_CLOSED',
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received.': 'API_CHANNEL_CLOSED',
  'Extension context invalidated.': 'API_CONTEXT_INVALIDATED'
});
function mapChromeError(error, context = 'api') {
  const native = context === 'native', table = native ? nativeErrors : apiErrors;
  // Exact complete English messages only. Unknown/localized/interpolated text
  // must never be used to infer that a host is missing or failed to launch.
  try { const message = typeof error === 'string' ? error : error?.message; if (typeof message === 'string' && Object.hasOwn(table, message)) return table[message]; } catch {}
  return native ? 'NATIVE_DISCONNECTED_UNKNOWN' : 'API_ERROR_UNKNOWN';
}

return Object.freeze({ NATIVE_STARTUP_CODES, nativeStartupFailureCode, DIAGNOSTIC_PHASE_CODES, DIAGNOSTIC_PHASES, DIAGNOSTIC_CODES, DIAGNOSTIC_SCHEMA, isDiagnosticState, validateDiagnosticState, createConnectionDiagnostics, mapChromeError });
})();
const __m8 = (() => {
const { validSimpleFrameHint, validSimpleFrameContext } = __m9;
const { validate, valid, object, literal, integer, identifier, tokenSchema, sameTarget, fail } = __m2;
const { createFullFeatureAdapter } = __m11;
const { validateTransportPolicy, grantSchema, requestSchema, bounded, validateInspect, dispatchResultSchema } = __m3;
const { RECONCILE_RESPONSE_SCHEMA } = __m7;
const { mapChromeError, nativeStartupFailureCode } = __m15;
const IDENTITY_CHANNEL = 'cor3-full-identity/v3';
const IDENTITY_READY_CHANNEL = 'cor3-full-identity-ready/v3';
const readyHintSchema = object({ type: literal(IDENTITY_READY_CHANNEL), documentId: tokenSchema, generation: tokenSchema, nonce: tokenSchema });
const readyContextSchema = object({ tabId: integer(0, 2147483647), chromeDocumentId: identifier, url: { type: 'string', minLength: 1, maxLength: 2048 } });
function browserNonce(cryptoApi = globalThis.crypto) { if (!cryptoApi?.getRandomValues) fail('IDENTITY_UNKNOWN'); return Array.from(cryptoApi.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''); }
function createFullExtensionEndpoint({ policy: inputPolicy, runtime, chromeApi = globalThis.chrome, now = Date.now, nonce = browserNonce, setTimer = setTimeout, clearTimer = clearTimeout, diagnostics } = {}) {
  const policy = validateTransportPolicy(inputPolicy);
  let session = null, reusableAdapter = null, starting = false, stopped = false, startEpoch = 0, renewalTimer = null, retryCount = 0, lastCode = policy.enabled ? 'IDLE' : 'POLICY_DISABLED';
  let nativeAttempted = false, hintTimer = null, hintBusy = false, pendingHint = null, hintEpoch = 0, lastHintCheckAt = -Infinity;
  let lastDiagnosticBinding = null;
  const documentBinding = value => value && valid(tokenSchema, value.generation) ? { tabId: value.tabId, documentId: value.documentId, generation: value.generation, url: value.url } : null;
  const diagnostic = (phase, code, document = lastDiagnosticBinding) => { try { diagnostics?.record(phase, code, documentBinding(document)); } catch {} };
  diagnostic(policy.enabled && policy.installations.length ? 'identity' : 'policy', !policy.enabled ? 'POLICY_DISABLED' : !policy.installations.length ? 'POLICY_UNCONFIGURED' : 'IDENTITY_NOT_READY', null);
  const seenHints = new Set(); // at most 32 recent context/nonce pairs, never credentials
  const status = () => ({ enabled: policy.enabled, phase: session?.phase || 'closed', code: lastCode, tabId: session?.tabId ?? null });
  const hintAllowed = () => policy.enabled && policy.installations.length > 0 && !stopped && (session !== null || !nativeAttempted || policy.allowAutoRenew === true);
  const alreadyBound = hint => session && hint.documentId === session.documentId && hint.generation === session.generation;
  function cancelHint() { hintEpoch++; pendingHint = null; if (hintTimer !== null) clearTimer(hintTimer); hintTimer = null; }
  function scheduleHint() {
    if (!pendingHint || hintTimer !== null || hintBusy || starting || !hintAllowed()) return;
    hintTimer = setTimer(() => { hintTimer = null; void consumeHint(); }, Math.max(0, 1000 - (now() - lastHintCheckAt))); hintTimer?.unref?.();
  }
  async function consumeHint() {
    if (!hintAllowed()) { pendingHint = null; return; }
    if (starting || hintBusy || !pendingHint) return;
    const item = pendingHint; pendingHint = null;
    if (alreadyBound(item.hint)) return;
    hintBusy = true; lastHintCheckAt = now(); const epoch = hintEpoch, attempt = startEpoch, verificationDeadline = now() + 5000;
    let verificationOpen = true, verificationTimer = null;
    const checkVerification = () => { if (!verificationOpen || !hintAllowed() || epoch !== hintEpoch || attempt !== startEpoch || pendingHint || now() >= verificationDeadline) fail('IDENTITY_UNKNOWN'); };
    try {
      if (typeof runtime.verifyIdentityReady !== 'function') fail('IDENTITY_UNKNOWN');
      // Sender metadata is only a routing hint. The runtime challenges that
      // exact Chrome document, then independently reads the current top frame.
      const identity = await Promise.race([
        runtime.verifyIdentityReady(item.context, item.hint, checkVerification),
        new Promise((_, reject) => { verificationTimer = setTimer(() => reject(Object.assign(new Error('IDENTITY_UNKNOWN'), { code: 'IDENTITY_UNKNOWN' })), 5000); verificationTimer?.unref?.(); })
      ]);
      checkVerification();
      if (!hintAllowed() || epoch !== hintEpoch || attempt !== startEpoch || pendingHint) return;
      if (identity.documentId !== item.hint.documentId || identity.generation !== item.hint.generation) fail('IDENTITY_CHANGED');
      const bound = session;
      if (bound && bound.tabId === item.context.tabId && bound.url === item.context.url && sameTarget(identity, bound.target) && identity.documentId === bound.documentId && identity.generation === bound.generation) return;
      if (bound) { startEpoch++; revoke('TARGET_CHANGED', false); } // revoke old evidence, never dispatch or replay
      const origin = `chrome-extension://${chromeApi.runtime.id}/`;
      if (!policy.installations.some(i => sameTarget(i.target, identity) && i.extensionOrigin === origin)) { diagnostic('policy', 'POLICY_SCOPE_MISMATCH', { tabId: item.context.tabId, documentId: identity.documentId, generation: identity.generation, url: item.context.url }); fail('ACCOUNT_OFFLINE'); }
      // Without reviewed renewal, late initial identity may complete the FIRST
      // native attempt, but no event may create a second native connection.
      if (nativeAttempted && policy.allowAutoRenew !== true) return;
      if (renewalTimer !== null) clearTimer(renewalTimer); renewalTimer = null;
      // Hand off to the existing fenced, bounded startup path. Hint validation
      // itself ends within five seconds; it never waits for a native grant.
      void start();
    } catch (error) {
      if (!stopped && epoch === hintEpoch && !session) lastCode = ['IDENTITY_UNKNOWN', 'IDENTITY_CHANGED', 'TARGET_CHANGED', 'TARGET_AMBIGUOUS', 'ACCOUNT_OFFLINE'].includes(error?.code) ? error.code : 'IDENTITY_UNKNOWN';
    } finally { verificationOpen = false; if (verificationTimer !== null) clearTimer(verificationTimer); hintBusy = false; scheduleHint(); }
  }
  function identityReady(context, hint) {
    if (!hintAllowed() || !valid(readyContextSchema, context) || !valid(readyHintSchema, hint) || alreadyBound(hint)) return false;
    const key = context.chromeDocumentId + '/' + hint.nonce;
    if (seenHints.has(key)) return false;
    seenHints.add(key); if (seenHints.size > 32) seenHints.delete(seenHints.values().next().value);
    // A storm retains only one latest hint and at most one verification. A
    // newer epoch cannot borrow an in-flight verification of an older hint.
    pendingHint = { context: structuredClone(context), hint: structuredClone(hint) }; scheduleHint(); return true;
  }
  function simpleFrameHint(context,hint) {
    const s=session;
    if(!s || s.phase!=='ready' || !live(s) || !s.readScopes?.includes('logs') || !validSimpleFrameHint(hint) || !validSimpleFrameContext(context) || context.tabId!==s.tabId || context.topUrl!==s.url)return false;
    return runtime.simpleFrameHint?.(context,hint)===true;
  }
  function scheduleRenewal() {
    if (!policy.enabled || policy.allowAutoRenew !== true || stopped || renewalTimer !== null || session) return;
    // Reviewed persistent access retries at a bounded rate instead of becoming
    // permanently offline before the first MCP owner has started. Native ports
    // wait passively for that owner and never create a broker themselves.
    const delay = Math.min(10000, 500 * 2 ** Math.min(retryCount, 6));
    if (retryCount >= 6) { lastCode = 'RECONNECT_BACKOFF'; diagnostic('session', 'RECONNECT_BACKOFF'); }
    retryCount = Math.min(6, retryCount + 1);
    renewalTimer = setTimer(() => { renewalTimer = null; void start(); }, delay); renewalTimer?.unref?.();
  }
  function revoke(code = 'DISCONNECTED', renew = false, nativeCode = null) {
    const s = session; session = null; lastCode = code;
    runtime.clearSimpleFrameSession?.();
    const document = s || lastDiagnosticBinding;
    if (code === 'DISCONNECTED' || code === 'CONNECT_FAILED') diagnostic('native', nativeCode || 'NATIVE_DISCONNECTED_UNKNOWN', document);
    else if (code === 'BACKGROUND_SUSPENDED') diagnostic('background', 'BACKGROUND_SUSPENDED', document);
    else if (['SESSION_EXPIRED', 'GRANT_TIMEOUT', 'TARGET_CHANGED', 'TAB_CLOSED', 'QUEUE_LIMIT', 'SESSION_CLOSED'].includes(code)) diagnostic('session', code, document);
    else if (code === 'SESSION_REJECTED' || code === 'INVALID_RESPONSE') diagnostic('session', s?.phase === 'grant' ? 'GRANT_REJECTED' : 'SESSION_REJECTED', document);
    else if (code === 'IDENTITY_CHANGED') diagnostic('identity', 'IDENTITY_CHANGED', document);
    if (!['SESSION_EXPIRED', 'DISCONNECTED', 'GRANT_TIMEOUT', 'CONNECT_FAILED'].includes(code)) reusableAdapter = null;
    if (s) { s.closed = true; clearTimer(s.timer); try { s.port?.disconnect(); } catch {} }
    if (renew) scheduleRenewal();
  }
  function close(code = 'DISCONNECTED') { stopped = true; startEpoch++; cancelHint(); seenHints.clear(); reusableAdapter = null; if (renewalTimer !== null) clearTimer(renewalTimer); renewalTimer = null; revoke(code, false); }
  function invalidate(code = 'TARGET_CHANGED') { if (!stopped) { startEpoch++; cancelHint(); revoke(code, true); } }
  // A document may announce identity while its tab is still loading. The
  // existing complete event may finish the first attempt even without renewal;
  // once connectNative was attempted it must obey the reviewed renewal policy.
  function wake() { if ((policy.allowAutoRenew === true || !nativeAttempted) && !stopped && !session) { if (renewalTimer !== null) clearTimer(renewalTimer); renewalTimer = null; retryCount = 0; void start(); } }
  const live = s => !stopped && session === s && !s.closed && now() < s.expiresAt;
  async function binding(s) {
    if (!live(s)) fail('ACCOUNT_OFFLINE');
    const docs = await runtime.enumerateDocuments();
    if (!live(s) || !Array.isArray(docs) || docs.length !== 1 || docs[0].tabId !== s.tabId || docs[0].documentId !== s.documentId || docs[0].url !== s.url || docs[0].frameId !== 0 || docs[0].loading || docs[0].pendingUrl) fail('TARGET_CHANGED');
    const identity = await runtime.readIdentity(docs[0]);
    if (!live(s) || !sameTarget(identity, s.target) || identity.generation !== s.generation || identity.documentId !== s.documentId) fail('TARGET_CHANGED');
  }
  function send(s, frame) { if (!live(s)) fail('ACCOUNT_OFFLINE'); bounded(frame); s.port.postMessage(frame); }
  async function handle(s, raw) {
    if (!live(s)) fail('ACCOUNT_OFFLINE'); bounded(raw);
    if (s.phase === 'grant') {
      const f = validate(grantSchema, raw, 'INVALID_RESPONSE');
      if (!sameTarget(f.target, s.target) || f.tabId !== s.tabId || f.documentId !== s.documentId || f.generation !== s.generation || f.clientNonce !== s.clientNonce || f.expiresAt <= now() || f.expiresAt > now() + policy.sessionTtlMs || f.readScopes.some(v => !s.installation.readScopes.includes(v)) || f.writeScopes.some(v => !s.installation.writeScopes.includes(v))) fail('INVALID_RESPONSE');
      if (f.allowAutoRenew !== (policy.allowAutoRenew === true) || JSON.stringify(f.gameCosts) !== JSON.stringify(s.installation.gameCosts || []) || f.gameCosts.some(c => !f.writeScopes.includes(c.operation))) fail('INVALID_RESPONSE');
      diagnostic('session', 'GRANT_RECEIVED', s);
      await binding(s); if (!live(s)) fail('ACCOUNT_OFFLINE'); s.sessionId = f.sessionId; s.expiresAt = f.expiresAt; s.readScopes = f.readScopes; s.writeScopes = f.writeScopes;
      const adapterBinding = JSON.stringify({ target: s.target, tabId: s.tabId, documentId: s.documentId, generation: s.generation, url: s.url, readScopes: s.readScopes, writeScopes: s.writeScopes, gameCosts: f.gameCosts });
      // The adapter captures this lease once at each operation's entry. An old
      // in-flight operation cannot borrow a newer grant after TTL/renewal.
      const guardedRuntime = { ...runtime, captureSession: () => { const lease = session; return () => live(lease); } };
      s.adapter = reusableAdapter?.binding === adapterBinding ? reusableAdapter.adapter : createFullFeatureAdapter({ runtime: guardedRuntime, enabled: true, allowedOperations: s.writeScopes, policyTarget: s.target, gameCosts: f.gameCosts });
      reusableAdapter = { binding: adapterBinding, adapter: s.adapter };
      s.phase = 'ready';
      const frameDocument={tabId:s.tabId,frameId:0,url:s.url,documentId:s.documentId,generation:s.generation,...s.target};
      runtime.bindSimpleFrameSession?.(frameDocument,{live:()=>live(s),expiresAt:s.expiresAt,readScopes:s.readScopes});
      // Fixed, bounded observation only; no solver command or saved preference.
      if (runtime.primeSimpleFrames) void runtime.primeSimpleFrames(frameDocument).catch(()=>{});
      lastCode = 'CONNECTED'; retryCount = 0; diagnostic('session', 'CONNECTED', s);
      clearTimer(s.timer); s.timer = setTimer(() => { if (session === s) revoke('SESSION_EXPIRED', true); }, Math.max(0, s.expiresAt - now())); s.timer?.unref?.(); return;
    }
    const f = validate(requestSchema, raw, 'INVALID_RESPONSE');
    if (f.sessionId !== s.sessionId || f.seq !== s.inSeq + 1 || !sameTarget(f.args.target, s.target)) fail('INVALID_RESPONSE');
    s.inSeq = f.seq; await binding(s);
    let result;
    if (['dispatch', 'reconcile'].includes(f.op) && !s.writeScopes.includes(f.args.action.operation) || f.op === 'inspect' && (!s.readScopes.length && !s.writeScopes.length || f.args.options.mode === 'view' && !s.readScopes.includes(f.args.options.view))) result = { ok: false, code: 'SCOPE_DENIED' };
    else {
      try { const value = f.op === 'inspect' ? validateInspect(await s.adapter.inspect(f.args.target, f.args.options)) : validate(f.op === 'reconcile' ? RECONCILE_RESPONSE_SCHEMA : dispatchResultSchema, await (f.op === 'reconcile' ? s.adapter.reconcile(f.args) : s.adapter.dispatch(f.args)), 'INVALID_RESPONSE'); result = { ok: true, value }; }
      catch { result = { ok: false, code: 'ADAPTER_ERROR' }; }
    }
    await binding(s); send(s, { v: 3, type: 'response', sessionId: s.sessionId, seq: ++s.outSeq, requestId: f.requestId, result });
  }
  async function start() {
    if (!policy.enabled || !policy.installations.length || stopped) return status(); // No browser I/O while disabled.
    if (starting || session) return status(); starting = true;
    const attempt = ++startEpoch;
    diagnostic('identity', 'IDENTITY_CHECKING');
    let nativeFailureCode = null;
    const ensureStart = () => { if (stopped || attempt !== startEpoch) fail('SESSION_CLOSED'); };
    try {
      const origin = `chrome-extension://${chromeApi.runtime.id}/`;
      const docs = await runtime.enumerateDocuments(); ensureStart(); if (!Array.isArray(docs) || docs.length !== 1) fail('TARGET_CHANGED');
      const doc = docs[0]; lastDiagnosticBinding = null;
      const identity = await runtime.readIdentity(doc); ensureStart();
      lastDiagnosticBinding = documentBinding({ ...doc, generation: identity.generation });
      diagnostic('identity', 'IDENTITY_CHECKED');
      const installation = policy.installations.find(i => sameTarget(i.target, identity) && i.extensionOrigin === origin); if (!installation) { diagnostic('policy', 'POLICY_SCOPE_MISMATCH'); fail('ACCOUNT_OFFLINE'); }
      const grantWaitMs = policy.allowAutoRenew === true ? Math.max(10000, policy.sessionTtlMs) : 10000;
      const s = { target: installation.target, tabId: doc.tabId, documentId: doc.documentId, generation: identity.generation, url: doc.url, clientNonce: nonce(), installation, expiresAt: now() + grantWaitMs, phase: 'grant', inSeq: 0, outSeq: 0, queue: 0, chain: Promise.resolve(), closed: false };
      session = s; await binding(s); ensureStart();
      nativeAttempted = true; diagnostic('native', 'NATIVE_CONNECT_ATTEMPT', s);
      try { s.port = chromeApi.runtime.connectNative(policy.nativeHost); }
      catch (error) { nativeFailureCode = mapChromeError(error, 'native'); throw error; }
      diagnostic('native', 'PORT_OPEN', s); // A returned port is not a grant.
      s.timer = setTimer(() => { if (session === s) revoke('GRANT_TIMEOUT', true); }, grantWaitMs); s.timer?.unref?.();
      s.port.onDisconnect.addListener(() => {
        // Chrome exposes lastError only in this callback frame. Consume and
        // classify immediately, retaining only a fixed enum, never raw text.
        const code = mapChromeError(chromeApi.runtime.lastError, 'native');
        if (session === s) revoke('DISCONNECTED', true, code);
      });
      s.port.onMessage.addListener(frame => {
        if (!live(s)) return;
        try { bounded(frame); } catch { revoke('INVALID_RESPONSE', false); return; }
        // A startup failure is untrusted display-only information, never a grant.
        // Revoke synchronously so disconnect or already queued grants cannot win.
        const startupCode = s.phase === 'grant' ? nativeStartupFailureCode(frame) : null;
        if (startupCode) { revoke('DISCONNECTED', true, startupCode); return; }
        if (++s.queue > 16) { revoke('QUEUE_LIMIT', false); return; }
        s.chain = s.chain.then(() => handle(s, frame)).catch(() => { if (session === s) revoke('SESSION_REJECTED', false); }).finally(() => { s.queue--; });
      });
      send(s, { v: 3, type: 'hello', target: s.target, tabId: s.tabId, documentId: s.documentId, generation: s.generation, clientNonce: s.clientNonce });
      diagnostic('native', 'HELLO_SENT', s); diagnostic('native', 'GRANT_WAITING', s);
      return status();
    } catch (error) {
      if (stopped || attempt !== startEpoch) return status();
      const identityFailure = ['TARGET_AMBIGUOUS', 'IDENTITY_UNKNOWN', 'IDENTITY_CHANGED', 'TARGET_CHANGED', 'ACCOUNT_OFFLINE', 'INVALID_RUNTIME'].includes(error?.code);
      revoke(identityFailure ? error.code : 'CONNECT_FAILED', !identityFailure, nativeFailureCode); return status();
    } finally { starting = false; if (!stopped && attempt !== startEpoch) scheduleRenewal(); scheduleHint(); }
  }
  return Object.freeze({ start, close, invalidate, wake, identityReady, simpleFrameHint, status }); // No listener or connect on construction.
}

return Object.freeze({ IDENTITY_CHANNEL, IDENTITY_READY_CHANNEL, browserNonce, createFullExtensionEndpoint });
})();
const __m17 = (() => {
// Document-local evidence only. An observed page message is NOT authentication.
// No storage/cache adoption and no raw event or WebSocket export.
const { valid, identifier, tokenSchema, sameTarget, fail, validate } = __m2;
const { bounded, exact } = __m3;
const { CONTEXT_EVENT_DOMAINS, CONTEXT_SCHEMAS } = __m12;
const OBSERVATION_CHANNEL = 'cor3-full-observation/v3';
const OBSERVABLE = Object.freeze({
  requestExpeditions: 'COR3_WS_EXPEDITIONS', requestNetworkMap: 'COR3_WS_MAP_DATA', requestStash: 'COR3_WS_STASH', requestSpecialists: 'COR3_WS_SPECIALISTS', requestLoadout: 'COR3_WS_LOADOUT',
  requestMarket: 'COR3_WS_MARKET', requestDarkMarket: 'COR3_WS_DARK_MARKET', requestSoyuzMarket: 'COR3_WS_SOYUZ_MARKET', requestUsolMarket: 'COR3_WS_USOL_MARKET',
  requestArchivedExpeditions: 'COR3_WS_ARCHIVED_EXPEDITIONS', requestMercenaries: 'COR3_WS_MERCENARIES', requestUsolMercenaries: 'COR3_WS_USOL_MERCENARIES'
});
function createDocumentCollector({ identity, normalizeEvent, now = Date.now, nonce, maxAgeMs = 15000 }) {
  let binding = null, sequence = 0;
  const records = new Map(), observations = new Map(), partitions = new Map();
  const clear = () => { records.clear(); observations.clear(); partitions.clear(); binding = null; };
  function fresh() {
    const current = identity();
    if (!current || !valid(identifier, current.accountId) || !valid(identifier, current.profileInstallationId) || !valid(tokenSchema, current.documentId) || !valid(tokenSchema, current.generation)) { clear(); fail('IDENTITY_UNKNOWN'); }
    if (binding && (!sameTarget(binding, current) || binding.documentId !== current.documentId || binding.generation !== current.generation)) clear();
    binding = structuredClone(current); return binding;
  }
  function ingest(message) {
    try {
      const before = fresh();
      // A newer malformed/oversized response invalidates the old quote first.
      const previousLogs = records.get('logs');
      for (const domain of CONTEXT_EVENT_DOMAINS[message?.type] || []) { records.delete(domain); partitions.get(domain)?.delete(message.type); }
      bounded(message);
      const normalized = normalizeEvent(message); if (!Array.isArray(normalized) || normalized.length > 16) return false;
      const after = fresh(); if (!sameTarget(before, after) || before.documentId !== after.documentId || before.generation !== after.generation) return false;
      const revision = 'e_' + (++sequence), observedAt = now();
      let usable = 0;
      for (const item of normalized) {
        if (!exact(item, ['domain', 'data']) || !valid(identifier, item.domain)) continue;
        let data = structuredClone(item.data), at = observedAt;
        try { bounded(data); } catch { data = { contextOverflow: true }; partitions.delete(item.domain); }
        if (!data.contextOverflow && ['jobs', 'mercenaries', 'expeditionConfig', 'failedJobs'].includes(item.domain)) {
          let parts = partitions.get(item.domain); if (!parts) partitions.set(item.domain, parts = new Map());
          parts.set(message.type, { data, observedAt });
          for (const [key, part] of parts) if (now() - part.observedAt > maxAgeMs) parts.delete(key);
          const values = [...parts.values()];
          data = Object.fromEntries(Object.keys(data).map(key => [key, values.flatMap(part => part.data[key] || [])]));
          // All partitions were individually normalized and validated. Never
          // silently drop another market/mercenary's rows to fit a later frame.
          // Oversized aggregate remains a visible fail-closed state until a
          // bounded fresh set is available; it cannot hydrate a partial write.
          try { validate(CONTEXT_SCHEMAS[item.domain], data, 'INVALID_CONTEXT'); bounded(data); }
          catch { data = { contextOverflow: true }; }
          at = Math.min(...values.map(part => part.observedAt));
        } else if (item.domain === 'logs' && Array.isArray(data.rows)) {
          data.rows = [...(previousLogs?.data?.rows || []), ...data.rows].filter(row => !Number.isFinite(row.at) || now() - row.at <= 600000).slice(-100);
        }
        records.set(item.domain, { target: { accountId: after.accountId, profileInstallationId: after.profileInstallationId }, documentId: after.documentId, generation: after.generation, revision, observedAt: at, data });
        if (!data.contextOverflow) usable++;
      }
      // A bounded validated resource response satisfies observation, not causal
      // backend completion. Mutations and start/stop operations are not eligible.
      for (const o of observations.values()) if (o.event === message.type && sequence > o.baseline && usable) o.observed = true;
      return usable > 0;
    } catch { clear(); return false; }
  }
  function context(domain) { fresh(); const value = records.get(domain); if (!value || now() < value.observedAt || now() - value.observedAt > (domain === 'logs' ? 600000 : maxAgeMs)) fail('DATA_NOT_READY'); if (value.data?.contextOverflow) fail('DATA_TRUNCATED'); return structuredClone(value); }
  function index() { fresh(); return [...records.entries()].flatMap(([domain, value]) => now() >= value.observedAt && now() - value.observedAt <= (domain === 'logs' ? 600000 : maxAgeMs) ? [{ domain, revision: value.revision, observedAt: value.observedAt }] : []); }
  function arm({ operation, operationId, parameters }) {
    const current = fresh(); if (!Object.hasOwn(OBSERVABLE, operation) || !valid(identifier, operationId) || !exact(parameters, [])) return null;
    for (const [key, o] of observations) if (now() >= o.expiresAt) observations.delete(key);
    if (observations.size >= 16) fail('CAPACITY_REACHED');
    const ticket = nonce(); if (!valid(tokenSchema, ticket)) fail('INVALID_RESPONSE');
    observations.set(ticket, { operation, operationId, event: OBSERVABLE[operation], baseline: sequence, expiresAt: now() + 5000, observed: false, binding: current }); return ticket;
  }
  function finish(ticket) {
    fresh(); const o = observations.get(ticket); if (!o) return null;
    if (now() >= o.expiresAt) { observations.delete(ticket); return null; }
    if (!o.observed) return null;
    observations.delete(ticket); return { target: { accountId: o.binding.accountId, profileInstallationId: o.binding.profileInstallationId }, documentId: o.binding.documentId, generation: o.binding.generation, operationId: o.operationId, operation: o.operation, status: 'completed' };
  }
  return Object.freeze({ ingest, context, index, arm, finish, clear });
}

return Object.freeze({ OBSERVATION_CHANNEL, OBSERVABLE, createDocumentCollector });
})();
const __m16 = (() => {
const { createSimpleFrameTelemetry } = __m9;
// Concrete MV3 runtime. Only the fixed adapter can reach these internal methods.
// No credentials, caller-provided code, tab opening, or game network traffic;
// only fixed isolated observation functions are executed.
const { ACTION_SCHEMA, ACTION_IDS, READ_SCOPES } = __m4;
const { valid, validate, identifier, tokenSchema, sameTarget, fail, object, integer, literal } = __m2;
const { IDENTITY_CHANNEL, IDENTITY_READY_CHANNEL, browserNonce } = __m8;
const { exact, bounded, inspectOptionsSchema } = __m3;
const { OBSERVATION_CHANNEL, OBSERVABLE } = __m17;
const { validateAdapterContentMessage, validateAdapterRuntimeMessage } = __m11;
const { CONTEXT_SCHEMAS } = __m12;
const { mapChromeError } = __m15;
const { AUTOMATION_CHANNEL, AUTOMATION_OPERATIONS, safeAutomationProbe, unavailableAutomationProbe, automationRows, threeSolverRows } = __m10;
const CONTEXT_CHANNEL = 'cor3-full-context/v3';
const CONTEXT_DOMAINS = Object.freeze([...new Set([...Object.keys(CONTEXT_SCHEMAS), ...READ_SCOPES])]);
const SYNC_KEYS = Object.freeze(['helperMode', 'autoDecryptEnabled', 'autoIceWallEnabled', 'autoSimpleDecryptEnabled', 'autoDailyHackEnabled', 'autoUpdateMarkets', 'autoCleanupFailedJobsEnabled', 'autoFinishAllJobsEnabled', 'autoChatEnabled', 'secretFinderEnabled', 'autoJobSolverEnabled', 'autoValuableSellerEnabled', 'autoJobsDebugConsoleEnabled', 'valuableDebugConsoleEnabled', 'disableBackground', 'disableNetworkFog', 'moveNotificationsLeft', 'marketsPanelEnabled', 'autoSendMerc', 'autoDrone', 'autoRefresh', 'pinnedTimers', 'autoJobsSelectedTypes', 'autoFinishAllJobTypes', 'selectedTheme', 'uiLang']);
const ORIGINAL_SYNC_KEYS = Object.freeze(['selectedTheme', 'autoJobSolverEnabled', 'autoValuableSellerEnabled', 'autoJobsDebugConsoleEnabled', 'valuableDebugConsoleEnabled', 'autoUpdateMarkets', 'autoFinishAllJobsEnabled', 'autoSellCheapest', 'secretFinderEnabled', 'autoJobsSelectedTypes', 'decisionModifiers', 'pinnedTimers', 'autoRefresh', 'alarms', 'autoDecryptEnabled', 'autoIceWallEnabled', 'autoSimpleDecryptEnabled', 'autoDailyHackEnabled', 'autoSendMerc']);
const LOCAL_KEYS = Object.freeze(['valuableSelectedServers', 'valuableSelectedDownloads']);
const allowedUrl = url => { try { const u = new URL(url); return u.protocol === 'https:' && ['cor3.gg', 'os.cor3.gg'].includes(u.hostname) && !u.port && !u.username && !u.password; } catch { return false; } };
const readyHintSchema = object({ type: literal(IDENTITY_READY_CHANNEL), documentId: tokenSchema, generation: tokenSchema, nonce: tokenSchema });
const readyContextSchema = object({ tabId: integer(0, 2147483647), chromeDocumentId: identifier, url: { type: 'string', minLength: 1, maxLength: 2048 } });
const identityResponseSchema = object({ ok: literal(true), nonce: tokenSchema, accountId: identifier, profileInstallationId: identifier, generation: tokenSchema, documentId: tokenSchema, url: { type: 'string', minLength: 1, maxLength: 8192 } });
const sameDocument = (a, b) => a.tabId === b.tabId && a.documentId === b.documentId && a.url === b.url;
function createChromeRuntime({ chromeApi = globalThis.chrome, cryptoApi = globalThis.crypto, sourceVersion = 'fixed-1.9', profileInstallationId, now = Date.now, nonce = () => browserNonce(cryptoApi), diagnostics } = {}) {
  if (!valid(identifier, profileInstallationId)) fail('INVALID_RUNTIME');
  const syncKeys = sourceVersion === 'fixed-1.9' ? SYNC_KEYS : ORIGINAL_SYNC_KEYS;
  const sessionGuard = guard => { if (guard !== undefined) { if (typeof guard !== 'function') fail('SESSION_CLOSED'); guard(); } };
  let lastBinding = null, lastSnapshot = null;
  let freshDiagnosticBinding = null, diagnosticSequence = 0;
  const diagnostic = (code, binding = freshDiagnosticBinding) => { diagnosticSequence++; try { diagnostics?.record('identity', code, binding); } catch {} };
  const identityFailure = (code, detail) => { diagnostic(detail); fail(code); };
  // MV3 promise errors are classified at the API call, not by reading lastError
  // after an await. Preserve existing thrown codes and suppress late diagnostics.
  async function identityWait(invoke, verification) {
    let apiFailed = false, completed = false;
    const diagnosticBinding = freshDiagnosticBinding;
    let operation;
    try { operation = Promise.resolve(invoke()).catch(error => { apiFailed = true; if (!completed) diagnostic(mapChromeError(error), diagnosticBinding); throw error; }); }
    catch (error) { diagnostic(mapChromeError(error), diagnosticBinding); throw error; }
    try { return await (verification?.wait || deadline)(operation); }
    catch (error) { if (!apiFailed) diagnostic('IDENTITY_TIMEOUT', diagnosticBinding); throw error; }
    finally { completed = true; }
  }
  async function deadline(promise, timeoutMs = 5000) { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('IDENTITY_UNKNOWN')), timeoutMs); timer.unref?.(); })]); } finally { clearTimeout(timer); } }
  async function soleTab(verification) {
    verification?.check();
    const result = await identityWait(() => chromeApi.tabs.query({ url: ['https://cor3.gg/*', 'https://os.cor3.gg/*'] }), verification);
    verification?.check();
    if (!Array.isArray(result)) identityFailure('TARGET_AMBIGUOUS', 'IDENTITY_INVALID');
    const tabs = result.filter(t => allowedUrl(t.url) || allowedUrl(t.pendingUrl));
    if (tabs.length === 0) identityFailure('TARGET_AMBIGUOUS', 'NO_COR3_TAB');
    if (tabs.length !== 1) identityFailure('TARGET_AMBIGUOUS', 'MULTIPLE_COR3_TABS');
    if (!Number.isSafeInteger(tabs[0].id) || !allowedUrl(tabs[0].url)) identityFailure('TARGET_AMBIGUOUS', 'IDENTITY_INVALID');
    if (tabs[0].status === 'loading' || tabs[0].pendingUrl) identityFailure('TARGET_AMBIGUOUS', 'TAB_LOADING');
    return tabs[0];
  }
  async function identityFor(tab, verification) {
    verification?.check();
    const requestNonce = nonce();
    const result = await identityWait(() => chromeApi.tabs.sendMessage(tab.id, { type: IDENTITY_CHANNEL, nonce: requestNonce }, { frameId: 0 }), verification);
    verification?.check();
    if (result === undefined || result === null) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_NO_RESPONSE');
    if (!valid(identityResponseSchema, result)) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_INVALID');
    if (result.nonce !== requestNonce || result.profileInstallationId !== profileInstallationId || result.url !== tab.url) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_SCOPE_MISMATCH');
    const after = await soleTab(verification); verification?.check(); if (after.id !== tab.id || after.url !== tab.url) identityFailure('IDENTITY_CHANGED', 'IDENTITY_CHANGED');
    freshDiagnosticBinding = { tabId: tab.id, documentId: result.documentId, generation: result.generation, url: tab.url };
    return { accountId: result.accountId, profileInstallationId, generation: result.generation, documentId: result.documentId };
  }
  async function verifyIdentityReady(inputContext, inputHint, check) {
    const beforeDiagnostics = diagnosticSequence;
    try {
      const context = validate(readyContextSchema, inputContext, 'IDENTITY_UNKNOWN'), hint = validate(readyHintSchema, inputHint, 'IDENTITY_UNKNOWN');
      if (!allowedUrl(context.url)) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_INVALID');
      const expiresAt = now() + 5000;
      const verification = {
        check: () => { sessionGuard(check); if (now() >= expiresAt) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_TIMEOUT'); },
        wait: promise => deadline(promise, Math.max(0, expiresAt - now()))
      };
      verification.check();
      const tab = await soleTab(verification); verification.check();
      if (tab.id !== context.tabId || tab.url !== context.url) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_SCOPE_MISMATCH');
      const requestNonce = nonce(); if (!valid(tokenSchema, requestNonce)) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_INVALID');
      // Chrome's sender document ID is the routing selector. The content hint's
      // separate document nonce can never select a document or an account.
      verification.check();
      const response = await identityWait(() => chromeApi.tabs.sendMessage(tab.id, { type: IDENTITY_CHANNEL, nonce: requestNonce }, { documentId: context.chromeDocumentId }), verification);
      verification.check();
      if (response === undefined || response === null) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_NO_RESPONSE');
      if (!valid(identityResponseSchema, response)) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_INVALID');
      if (response.nonce !== requestNonce || response.url !== context.url || response.profileInstallationId !== profileInstallationId) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_SCOPE_MISMATCH');
      const current = await identityFor(tab, verification); verification.check();
      if (!sameTarget(response, current) || response.documentId !== current.documentId || response.generation !== current.generation || hint.documentId !== current.documentId || hint.generation !== current.generation) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_SCOPE_MISMATCH');
      const after = await soleTab(verification); verification.check();
      if (after.id !== context.tabId || after.url !== context.url) identityFailure('IDENTITY_UNKNOWN', 'IDENTITY_SCOPE_MISMATCH');
      return { accountId: current.accountId, profileInstallationId: current.profileInstallationId, documentId: current.documentId, generation: current.generation };
    } catch { if (diagnosticSequence === beforeDiagnostics) diagnostic('IDENTITY_INVALID'); fail('IDENTITY_UNKNOWN'); }
  }
  async function enumerateDocuments() { const tab = await soleTab(), identity = await identityFor(tab); return [{ tabId: tab.id, frameId: 0, url: tab.url, documentId: identity.documentId }]; }
  async function readIdentity(document) {
    const tab = await soleTab(); if (tab.id !== document.tabId || tab.url !== document.url) identityFailure('IDENTITY_CHANGED', 'IDENTITY_CHANGED');
    const identity = await identityFor(tab); if (identity.documentId !== document.documentId) identityFailure('IDENTITY_CHANGED', 'IDENTITY_CHANGED');
    lastBinding = { ...document, ...identity }; return identity;
  }
  async function checked(document) {
    if (!document) fail('IDENTITY_UNKNOWN');
    const id = await readIdentity(document);
    if (document.generation && (id.generation !== document.generation || !sameTarget(id, document))) identityFailure('IDENTITY_CHANGED', 'IDENTITY_CHANGED');
    return id;
  }
  function keys(area, selected) {
    const permitted = area === 'sync' ? syncKeys : area === 'local' ? LOCAL_KEYS : [];
    if (!Array.isArray(selected) || selected.length < 1 || new Set(selected).size !== selected.length || selected.some(key => !permitted.includes(key))) fail('INVALID_ARGUMENTS');
  }
  async function readPreference(document, area, selected) { keys(area, selected); await checked(document); const value = await chromeApi.storage[area].get(selected); await checked(document); return Object.fromEntries(selected.filter(k => Object.hasOwn(value, k)).map(k => [k, value[k]])); }
  async function writePreference(document, area, patch, guard) { bounded(patch); keys(area, Object.keys(patch)); sessionGuard(guard); await checked(document); sessionGuard(guard); await chromeApi.storage[area].set(patch); sessionGuard(guard); await checked(document); }
  async function rawContext(document, domain) {
    if (!CONTEXT_DOMAINS.includes(domain)) fail('INVALID_ARGUMENTS'); await checked(document);
    const requestNonce = nonce();
    const value = await deadline(chromeApi.tabs.sendMessage(document.tabId, { type: CONTEXT_CHANNEL, nonce: requestNonce, domain }, { frameId: 0 }));
    await checked(document); try { bounded(value); } catch { fail('DATA_TRUNCATED'); }
    if (value?.ok === false && value.code === 'DATA_TRUNCATED') fail('DATA_TRUNCATED');
    if (!exact(value, ['ok', 'nonce', 'context']) || value.ok !== true || value.nonce !== requestNonce || !value.context) fail('DATA_NOT_READY');
    const c = value.context;
    if (!exact(c, ['target', 'documentId', 'generation', 'revision', 'observedAt', 'data']) || !sameTarget(c.target, document) || c.documentId !== document.documentId || c.generation !== document.generation || !valid(identifier, c.revision) || !Number.isSafeInteger(c.observedAt) || c.observedAt > now() || now() - c.observedAt > (domain === 'logs' ? 600000 : 15000)) fail('DATA_NOT_READY');
    return structuredClone(c);
  }
  async function readContext(document, domain) {
    const current = await rawContext(document, domain);
    if (!lastSnapshot || lastSnapshot.generation !== document.generation || lastSnapshot.documentId !== document.documentId || lastSnapshot.events[domain] !== current.revision) fail('DATA_NOT_READY');
    return { ...current, revision: lastSnapshot.revision };
  }
  async function contextIndex(document) {
    await checked(document); const requestNonce = nonce();
    const result = await deadline(chromeApi.tabs.sendMessage(document.tabId, { type: CONTEXT_CHANNEL, phase: 'index', nonce: requestNonce }, { frameId: 0 }));
    await checked(document); bounded(result);
    if (!exact(result, ['ok', 'nonce', 'index']) || result.ok !== true || result.nonce !== requestNonce || !Array.isArray(result.index) || result.index.length > CONTEXT_DOMAINS.length) fail('DATA_NOT_READY');
    const values = {};
    for (const row of result.index) {
      if (!exact(row, ['domain', 'revision', 'observedAt']) || !CONTEXT_DOMAINS.includes(row.domain) || !valid(identifier, row.revision) || !Number.isSafeInteger(row.observedAt) || row.observedAt > now() || now() - row.observedAt > (row.domain === 'logs' ? 600000 : 15000) || Object.hasOwn(values, row.domain)) fail('DATA_NOT_READY');
      values[row.domain] = row.revision;
    }
    return values;
  }
  async function prepareObservation(document, observation) {
    if (!Object.hasOwn(OBSERVABLE, observation?.operation)) return null;
    await checked(document); const requestNonce = nonce();
    const arm = await deadline(chromeApi.tabs.sendMessage(document.tabId, { type: OBSERVATION_CHANNEL, phase: 'arm', nonce: requestNonce, observation }, { frameId: 0 }));
    await checked(document);
    if (!exact(arm, ['ok', 'nonce', 'ticket']) || arm.ok !== true || arm.nonce !== requestNonce || !valid(tokenSchema, arm.ticket)) return null;
    return Object.freeze({ finish: async () => {
      const expiresAt = now() + 4500;
      while (now() < expiresAt) {
        await checked(document); const replyNonce = nonce();
        const reply = await deadline(chromeApi.tabs.sendMessage(document.tabId, { type: OBSERVATION_CHANNEL, phase: 'finish', nonce: replyNonce, ticket: arm.ticket }, { frameId: 0 }));
        await checked(document);
        if (!exact(reply, ['ok', 'nonce', 'receipt']) || reply.ok !== true || reply.nonce !== replyNonce) return null;
        if (reply.receipt) return reply.receipt;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return null;
    } });
  }
  async function readAutomationStatus(document, guard) {
    sessionGuard(guard); await checked(document); sessionGuard(guard);
    const requestNonce = nonce();
    const reply = await deadline(chromeApi.tabs.sendMessage(document.tabId, { type: AUTOMATION_CHANNEL, nonce: requestNonce }, { frameId: 0 }));
    sessionGuard(guard); await checked(document); sessionGuard(guard); bounded(reply);
    if (!exact(reply, ['ok', 'nonce', 'target', 'documentId', 'generation', 'observedAt', 'probe']) || reply.ok !== true || reply.nonce !== requestNonce || !sameTarget(reply.target, document) || reply.documentId !== document.documentId || reply.generation !== document.generation || !Number.isSafeInteger(reply.observedAt) || reply.observedAt > now() || now() - reply.observedAt > 2000) fail('AUTOMATION_STATUS_UNAVAILABLE');
    return { ...safeAutomationProbe(reply.probe), observedAt: reply.observedAt };
  }
  async function prepareStopObservation(document, observation, guard) {
    const feature = AUTOMATION_OPERATIONS[observation?.operation];
    if (!feature || observation.feature !== (feature === 'simple' ? 'simpleDecrypt' : feature) || !valid(identifier, observation.operationId)) return null;
    let before; try { before = await readAutomationStatus(document, guard); } catch (error) { if (['IDENTITY_CHANGED', 'SESSION_CLOSED'].includes(error?.code)) throw error; return null; }
    const armed = before[feature], armedAt = now(); if (!armed) return null;
    return Object.freeze({ armedRuns: [{ frameId: 0, runId: armed.runId, abortGeneration: armed.abortGeneration }], finish: async () => {
      for (let attempt = 0; attempt < 20 && now() >= armedAt && now() - armedAt < 4500; attempt++) {
        const after = await readAutomationStatus(document, guard), current = after[feature];
        if (current.runId !== armed.runId || current.abortGeneration <= armed.abortGeneration) return null;
        if (now() >= armedAt && now() - armedAt < 4500 && after.observedAt >= armedAt && current.state === 'stopped' && current.evidence === 'observed-local-lifecycle' && current.isolatedSchedulerClosed && current.guardClosed && current.queuesInvalidated && current.activeRunsAborted) {
          await checked(document); sessionGuard(guard);
          if (now() < armedAt || now() - armedAt >= 4500) return null;
          return { target: { accountId: document.accountId, profileInstallationId: document.profileInstallationId }, documentId: document.documentId, generation: document.generation, operationId: observation.operationId, operation: observation.operation, feature: observation.feature, stopped: true, evidence: 'observed-local-lifecycle', frames: [{ frameId: 0, runId: current.runId, abortGeneration: current.abortGeneration, guardClosed: true, epochAdvanced: true, queuesInvalidated: true, activeRunsAborted: true }] };
        }
        if (current.evidence === 'unavailable') return null;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return null;
    } });
  }
  const simpleFrames = createSimpleFrameTelemetry({chromeApi,checked,now,nonce,deadline,cryptoApi});
  function bindSimpleFrameSession(document, settings) { simpleFrames.bind(document,settings); }
  function simpleFrameHint(context,hint) { return simpleFrames.notifyFrame(context,hint); }
  function clearSimpleFrameSession() { simpleFrames.release(); }
  async function primeSimpleFrames(document) { return simpleFrames.read(document); }
  async function readState(document, options, guard) {
    if (options !== undefined) validate(inspectOptionsSchema, options);
    await checked(document);
    const prefs = await chromeApi.storage.sync.get(syncKeys);
    await checked(document);
    const contexts = {}, viewDomains = { jobs: 'jobs', markets: 'jobs', network: 'maintenance', specialists: 'specialists', expeditions: 'containers', mercenaries: 'mercenaries', decisions: 'decisions' };
    // Revision metadata is tiny and independent of unrelated view payload size.
    // Preparing a stop never asks the content script to export its game datasets.
    let events; try { events = await contextIndex(document); } catch (error) { if (error?.code === 'DATA_NOT_READY') events = {}; else throw error; }
    const selected = options?.mode === 'binding' ? [] : options?.mode === 'view' ? [Object.hasOwn(events, options.view) ? options.view : viewDomains[options.view]].filter(Boolean) : Object.keys(events);
    for (const domain of selected) {
      try { contexts[domain] = await rawContext(document, domain); }
      catch (error) {
        if (error?.code === 'DATA_TRUNCATED') contexts[domain] = { observedAt: now(), data: { available: false, code: 'DATA_TRUNCATED', sourceTruncated: true, rows: [] } };
        else if (error?.code && error.code !== 'DATA_NOT_READY') throw error;
      }
    }
    await checked(document);
    const text = JSON.stringify({ generation: document.generation, prefs, events });
    const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const revision = 'r_' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const data = Object.fromEntries(READ_SCOPES.map(view => [view, { available: false, reason: 'ACCOUNT_SCOPED_DATA_NOT_READY' }]));
    data.overview = { available: true, status: 'identity_checked', reason: 'DOM identity is anti-misrouting, not authentication.' };
    const rows = [];
    const settingsRows = (value, name, depth = 0) => { if (depth > 3 || rows.length >= 100) return; if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) rows.push({ name, value }); else if (Array.isArray(value)) rows.push({ name, count: value.length }); else if (value && typeof value === 'object') for (const key of Object.keys(value).slice(0, 32)) settingsRows(value[key], `${name}.${key}`, depth + 1); };
    for (const key of syncKeys) if (Object.hasOwn(prefs, key)) settingsRows(prefs[key], key);
    data.settings = { available: true, scope: 'profile', reason: 'Preferences do not prove automation state.', rows };
    data.versions = { available: true, rows: [{ name: 'extensionVersion', value: chromeApi.runtime.getManifest().version }, { name: 'sourceVersion', value: sourceVersion }] };
    for (const view of READ_SCOPES) {
      const context = contexts[view] || contexts[viewDomains[view]]; if (!context) continue;
      const c = context.data;
      if (typeof c?.available === 'boolean' && Array.isArray(c.rows)) data[view] = { ...c, updatedAt: context.observedAt };
      else {
        const list = Object.values(c || {}).find(Array.isArray) || [];
        data[view] = { available: true, updatedAt: context.observedAt, scope: 'document', rows: list.slice(0, 100).map(item => ({
          ...(typeof (item.id ?? item.jobId ?? item.priceId ?? item.expeditionId ?? item.messageId) === 'string' ? { id: item.id ?? item.jobId ?? item.priceId ?? item.expeditionId ?? item.messageId } : {}),
          ...(typeof (item.name ?? item.specialistType) === 'string' ? { name: item.name ?? item.specialistType } : {}),
          ...(typeof item.marketKey === 'string' ? { market: item.marketKey } : {}),
          ...(Number.isFinite(item.cost?.amount) ? { credits: item.cost.amount } : {}),
          ...(Number.isFinite(item.deposit?.amount) ? { credits: item.deposit.amount } : {}),
          ...Object.fromEntries(['level', 'completed', 'available', 'resolved', 'opened', 'deadline'].filter(k => ['boolean', 'number'].includes(typeof item[k])).map(k => [k, item[k]]))
        })) };
      }
    }
    // Old profile-wide diagnostics have no account provenance. Never read or
    // relabel them. Only this document's collector and correlated bridge audit.
    data.logs = contexts.logs?.data || { available: false, scope: 'document', reason: 'UPSTREAM_LOGS_UNAVAILABLE', rows: [] };
    if (options?.mode === 'view' && ['automationStatus', 'threeSolverStatus'].includes(options.view)) {
      let probe, available = true;
      try { probe = await readAutomationStatus(document); } catch (error) { if (['IDENTITY_CHANGED', 'SESSION_CLOSED', 'TARGET_AMBIGUOUS'].includes(error?.code)) throw error; probe = unavailableAutomationProbe(); available = false; }
      data[options.view] = { available: true, code: available ? 'READ_COMPLETE' : 'AUTOMATION_STATUS_UNAVAILABLE', scope: 'profile-preferences-and-bound-document', rows: (options.view === 'threeSolverStatus' ? threeSolverRows : automationRows)(prefs, probe, probe.observedAt ?? now(), available).map(row => ({ ...row, documentId: document.documentId, generation: document.generation })) };
    }
    if (options?.mode === 'view' && ['threeSolverStatus','logs'].includes(options.view)) {
      const frames = await simpleFrames.read(document,guard);
      await checked(document); sessionGuard(guard);
      const section = data[options.view];
      for (const key of ['childHintCoverage','childHintCoverageLimited','childHistoryScope','childHistoryPersistence','childCaptureScope','childPrebindErrorsAvailable','childOfflineCaptureAvailable','childCoverage','childAggregateState','childErrorsCoverage','childHistoryTruncated']) section[key]=frames[key];
      if (options.view === 'threeSolverStatus') section.rows.push(...frames.rows.map(row=>({...row,documentId:document.documentId,generation:document.generation})));
      else {
        section.topLogsAvailable=section.available===true;
        section.rows=[...(section.rows||[]),...frames.logs];
        section.available=section.available===true || frames.logs.length>0;
        section.sourceTruncated=section.sourceTruncated===true || frames.childHistoryTruncated;
      }
    }
    lastSnapshot = { generation: document.generation, documentId: document.documentId, revision, events };
    if (options?.mode === 'binding') return { revision, data: {} };
    if (options?.mode === 'view') {
      const section = data[options.view] || { available: false, rows: [] }, allRows = Array.isArray(section.rows) ? section.rows : [];
      const sourceTotalRows = Math.max(section.sourceTotalRows || 0, allRows.length);
      const page = { ...section, rows: [], totalRows: allRows.length, sourceTotalRows, sourceTruncated: section.sourceTruncated === true, nativeOffset: options.offset, nextOffset: null, truncated: section.sourceTruncated === true };
      for (let i = options.offset; i < Math.min(allRows.length, options.offset + options.limit); i++) {
        page.rows.push(allRows[i]);
        if (new TextEncoder().encode(JSON.stringify(page)).length > 40000) { page.rows.pop(); break; }
      }
      const next = options.offset + page.rows.length;
      if (next < allRows.length && page.rows.length) page.nextOffset = next;
      if (next < allRows.length || section.sourceTruncated) page.truncated = true;
      if (next < allRows.length && !page.rows.length) { page.available = false; page.code = 'INVALID_RESPONSE'; }
      return { revision, data: { [options.view]: page } };
    }
    return { revision, data };
  }
  async function sendContent(document, message, guard) {
    bounded(message);
    if (!message || !ACTION_IDS.includes(message.action) || ['cor3SetHelperMode'].includes(message.action)) fail('INVALID_ARGUMENTS');
    // The internal adapter translates only fixed typed input. The special alarm
    // representation is generated there, never received from a native caller.
    validateAdapterContentMessage(message);
    sessionGuard(guard); await checked(document); sessionGuard(guard); const result = await deadline(chromeApi.tabs.sendMessage(document.tabId, message, { frameId: 0 })); sessionGuard(guard); await checked(document); return result;
  }
  async function sendRuntime(message, guard, operationContext) {
    validateAdapterRuntimeMessage(message);
    const document = lastBinding && structuredClone(lastBinding); sessionGuard(guard); await checked(document); sessionGuard(guard);
    // Sending to oneself does not invoke the sender's listener in every browser.
    // The fixed1.9 coordinator's direct command entry is wired by the package;
    // never fallback to broadcasting or to page code.
    const coordinator = globalThis.Cor3FullRuntimeCommands;
    if (!coordinator || typeof coordinator.dispatch !== 'function') fail('UNSUPPORTED');
    sessionGuard(guard); const result = await coordinator.dispatch(message, { tabId: document.tabId, operationId: operationContext?.operationId, assertCurrent: async () => { sessionGuard(guard); await checked(document); sessionGuard(guard); } }); sessionGuard(guard); await checked(document); return result;
  }
  return Object.freeze({ simpleFrameHint, bindSimpleFrameSession, clearSimpleFrameSession, primeSimpleFrames, sourceVersion, enumerateDocuments, readIdentity, verifyIdentityReady, readState, readContext, prepareObservation, readAutomationStatus, prepareStopObservation, sendContent, sendRuntime, writePreference, readPreference });
}

return Object.freeze({ CONTEXT_CHANNEL, CONTEXT_DOMAINS, SYNC_KEYS, LOCAL_KEYS, createChromeRuntime });
})();
const __m1 = (() => {
const { valid, identifier, tokenSchema, fail } = __m2;
const { exact, bounded } = __m3;
const { IDENTITY_CHANNEL, IDENTITY_READY_CHANNEL, browserNonce } = __m8;
const { CONTEXT_CHANNEL, CONTEXT_DOMAINS } = __m16;
const { OBSERVATION_CHANNEL, createDocumentCollector } = __m17;
const { CONTEXT_EVENT_DOMAINS } = __m12;
const { AUTOMATION_CHANNEL, safeAutomationProbe } = __m10;
const selectorPattern = /^(?:#[A-Za-z_][A-Za-z0-9_-]{0,99}|\[data-[a-z0-9-]+="[A-Za-z0-9_.:-]{1,100}"\])$/;
function installIdentityContent({ rules, normalizeEvent, chromeApi = globalThis.chrome, windowApi = globalThis.window, documentApi = globalThis.document, nonce = browserNonce, now = Date.now } = {}) {
  if (!rules || rules.version !== 3 || rules.enabled !== true || rules.validated !== true || !valid(identifier, rules.profileInstallationId) || !selectorPattern.test(rules.selector || '') || windowApi.top !== windowApi) return { enabled: false }; // No DOM read/listener while disabled.
  const documentId = nonce(), diagnosticListeners = new Set(); let generation = nonce(), marker = null, stopped = false, listenerReady = false, announcedGeneration = null;
  const root = chromeApi.runtime.getURL('');
  function visible(element) {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    let cursor = element, depth = 0;
    while (cursor) { if (++depth > 64 || cursor.hidden || cursor.getAttribute?.('aria-hidden') === 'true' || cursor.hasAttribute?.('inert')) return false; const style = windowApi.getComputedStyle(cursor); if (style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || Number(style.opacity) === 0) return false; cursor = cursor.parentElement; }
    const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < windowApi.innerHeight && r.left < windowApi.innerWidth;
  }
  function identity() {
    let current = null;
    try {
      const url = new URL(windowApi.location.href); if (stopped || url.protocol !== 'https:' || !['cor3.gg', 'os.cor3.gg'].includes(url.hostname) || url.port || url.username || url.password) fail('IDENTITY_UNKNOWN');
      const elements = documentApi.querySelectorAll(rules.selector);
      if (elements.length !== 1 || !visible(elements[0])) fail('IDENTITY_UNKNOWN');
      const accountId = elements[0].textContent?.trim(); if (!valid(identifier, accountId)) fail('IDENTITY_UNKNOWN');
      current = { accountId, profileInstallationId: rules.profileInstallationId, url: windowApi.location.href };
    } catch {}
    const next = JSON.stringify(current); if (marker !== next) {
      generation = nonce(); marker = next;
      for (const callback of diagnosticListeners) { try { callback(Object.freeze({ documentId, generation })); } catch {} }
    }
    // This private hint has no account or policy authority. Announce each valid
    // DOM generation once, then let the background independently challenge it.
    // Mark first so a synchronous identity probe cannot recursively announce.
    if (current && listenerReady && announcedGeneration !== generation && valid(tokenSchema, documentId) && valid(tokenSchema, generation)) {
      announcedGeneration = generation;
      try {
        const readyNonce = nonce();
        if (valid(tokenSchema, readyNonce)) chromeApi.runtime.sendMessage({ type: IDENTITY_READY_CHANNEL, documentId, generation, nonce: readyNonce })?.catch?.(() => {});
      } catch {} // A sleeping/closing background never causes a repeat storm.
    }
    return current && { ...current, generation, documentId };
  }
  const collector = createDocumentCollector({ identity, normalizeEvent, now, nonce });
  const trusted = sender => sender?.id === chromeApi.runtime.id && !sender.tab && (sender.url === undefined || sender.url.startsWith(root)) && (sender.origin === undefined || sender.origin === root.slice(0, -1));
  const listener = (message, sender, respond) => {
    if (![IDENTITY_CHANNEL, CONTEXT_CHANNEL, OBSERVATION_CHANNEL, AUTOMATION_CHANNEL].includes(message?.type)) return;
    try {
      bounded(message); if (!trusted(sender) || !valid(tokenSchema, message.nonce)) fail('IDENTITY_UNKNOWN');
      if (message.type === AUTOMATION_CHANNEL) {
        if (!exact(message, ['type', 'nonce'])) fail('INVALID_ARGUMENTS');
        const before = identity();
        if (!before || typeof globalThis.Cor3ObservableControls?.probe !== 'function') fail('DATA_NOT_READY');
        Promise.resolve(globalThis.Cor3ObservableControls.probe()).then(value => {
          const after = identity();
          if (!after || before.accountId !== after.accountId || before.documentId !== after.documentId || before.generation !== after.generation) fail('IDENTITY_CHANGED');
          const probe = safeAutomationProbe(value);
          respond({ ok: true, nonce: message.nonce, target: { accountId: after.accountId, profileInstallationId: after.profileInstallationId }, documentId: after.documentId, generation: after.generation, observedAt: now(), probe });
        }).catch(() => respond({ ok: false, code: 'DATA_NOT_READY' }));
        return true;
      }
      if (message.type === IDENTITY_CHANNEL) {
        if (!exact(message, ['type', 'nonce'])) fail('INVALID_ARGUMENTS'); const value = identity(); if (!value) fail('IDENTITY_UNKNOWN'); respond({ ok: true, nonce: message.nonce, ...value });
      } else if (message.type === CONTEXT_CHANNEL) {
        if (exact(message, ['type', 'nonce', 'phase']) && message.phase === 'index') respond({ ok: true, nonce: message.nonce, index: collector.index() });
        else { if (!exact(message, ['type', 'nonce', 'domain']) || !CONTEXT_DOMAINS.includes(message.domain)) fail('INVALID_ARGUMENTS'); respond({ ok: true, nonce: message.nonce, context: collector.context(message.domain) }); }
      } else if (message.phase === 'arm' && exact(message, ['type', 'nonce', 'phase', 'observation'])) respond({ ok: true, nonce: message.nonce, ticket: collector.arm(message.observation) });
      else if (message.phase === 'finish' && exact(message, ['type', 'nonce', 'phase', 'ticket']) && valid(tokenSchema, message.ticket)) respond({ ok: true, nonce: message.nonce, receipt: collector.finish(message.ticket) });
      else fail('INVALID_ARGUMENTS');
    } catch (error) { respond({ ok: false, code: error?.code === 'DATA_TRUNCATED' ? 'DATA_TRUNCATED' : 'DATA_NOT_READY' }); }
  };
  const onEvent = event => {
    if (event.source !== windowApi || event.origin !== windowApi.location.origin || !event.data || typeof event.data.type !== 'string' || !Object.hasOwn(CONTEXT_EVENT_DOMAINS, event.data.type)) return;
    collector.ingest(event.data);
  };
  chromeApi.runtime.onMessage.addListener(listener); listenerReady = true; windowApi.addEventListener('message', onEvent);
  const observer = new windowApi.MutationObserver(() => { identity(); });
  observer.observe(documentApi.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'aria-hidden', 'inert'] });
  const timer = setInterval(identity, 1000); timer.unref?.();
  const stop = () => { stopped = true; diagnosticListeners.clear(); clearInterval(timer); observer.disconnect(); collector.clear(); chromeApi.runtime.onMessage.removeListener?.(listener); windowApi.removeEventListener('message', onEvent); };
  windowApi.addEventListener('pagehide', stop, { once: true });
  identity();
  // Private isolated-module caller only; reads stored values, never account DOM.
  // Neither field is exported to the page or used as authorization.
  return Object.freeze({ enabled: true, stop, getDiagnosticBinding: () => stopped ? null : { documentId, generation }, subscribeDiagnosticBindingChange(callback) {
    if (stopped || typeof callback !== 'function') return () => {};
    diagnosticListeners.add(callback); return () => diagnosticListeners.delete(callback);
  } });
}

return Object.freeze({ installIdentityContent });
})();
const __m19 = (() => {
// Private extension-only, read-only diagnostic envelopes. These are not grants.
const { object, literal, tokenSchema, valid } = __m2;
const { DIAGNOSTIC_SCHEMA, isDiagnosticState, mapChromeError } = __m15;
const DIAGNOSTIC_READ = 'cor3-full-diagnostic-read/v1';
const DIAGNOSTIC_CHALLENGE = 'cor3-full-diagnostic-challenge/v1';
const DIAGNOSTIC_DOCUMENT = 'cor3-full-diagnostic-document/v1';
const DIAGNOSTIC_RESULT = 'cor3-full-diagnostic-result/v1';
const diagnosticReadSchema = object({ type: literal(DIAGNOSTIC_READ), nonce: tokenSchema, documentId: tokenSchema, generation: tokenSchema });
const diagnosticChallengeSchema = object({ type: literal(DIAGNOSTIC_CHALLENGE), nonce: tokenSchema });
const diagnosticDocumentSchema = object({ type: literal(DIAGNOSTIC_DOCUMENT), nonce: tokenSchema, documentId: tokenSchema, generation: tokenSchema });
const diagnosticBindingSchema = object({ documentId: tokenSchema, generation: tokenSchema });
const resultEnvelope = object({ type: literal(DIAGNOSTIC_RESULT), nonce: tokenSchema, state: DIAGNOSTIC_SCHEMA });
function isDiagnosticResult(value) {
  return valid(resultEnvelope, value) && isDiagnosticState(value.state);
}
function diagnosticGameUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try { const u = new URL(value); return u.protocol === 'https:' && ['cor3.gg', 'os.cor3.gg'].includes(u.hostname) && !u.port && !u.username && !u.password; } catch { return false; }
}
function diagnosticFailure(phase = 'identity', code = 'IDENTITY_NOT_READY') {
  const state = { v: 1, phase, code, lastFailure: null };
  return isDiagnosticState(state) ? state : { v: 1, phase: 'identity', code: 'IDENTITY_NOT_READY', lastFailure: null };
}
// Every callback reads lastError synchronously even if a competing Promise or
// timeout already settled. Promise-only fixtures and callback-style Chrome both
// work; no error text, native arguments or thrown value leave this boundary.
function diagnosticChromeCall(chromeApi, invoke, { timeoutMs = 2000, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false, timer;
    const finish = (ok, value) => { if (settled) return; settled = true; clearTimer(timer); ok ? resolve(value) : reject(Object.assign(new Error(value), { code: value })); };
    timer = setTimer(() => finish(false, 'BACKGROUND_UNAVAILABLE'), Math.max(1, Math.min(2000, timeoutMs))); timer?.unref?.();
    const callback = value => {
      let error;
      try { error = chromeApi.runtime.lastError; } catch { finish(false, 'BACKGROUND_UNAVAILABLE'); return; }
      if (error) finish(false, mapChromeError(error, 'api'));
      else if (value === undefined) finish(false, 'BACKGROUND_UNAVAILABLE');
      else finish(true, value);
    };
    try {
      const pending = invoke(callback);
      if (pending && typeof pending.then === 'function') pending.then(value => { if (value === undefined) finish(false, 'BACKGROUND_UNAVAILABLE'); else finish(true, value); }, error => finish(false, mapChromeError(error, 'api')));
    } catch (error) { finish(false, mapChromeError(error, 'api')); }
  });
}

return Object.freeze({ DIAGNOSTIC_READ, DIAGNOSTIC_CHALLENGE, DIAGNOSTIC_DOCUMENT, DIAGNOSTIC_RESULT, diagnosticReadSchema, diagnosticChallengeSchema, diagnosticDocumentSchema, diagnosticBindingSchema, isDiagnosticResult, diagnosticGameUrl, diagnosticFailure, diagnosticChromeCall });
})();
const __m18 = (() => {
// Isolated, optional read-only display. DOM is forgeable and never authority.
const { valid, tokenSchema } = __m2;
const { browserNonce } = __m8;
const { validateDiagnosticState, DIAGNOSTIC_PHASES, DIAGNOSTIC_CODES } = __m15;
const { DIAGNOSTIC_READ, DIAGNOSTIC_DOCUMENT, diagnosticChallengeSchema, diagnosticBindingSchema, diagnosticGameUrl, diagnosticFailure, diagnosticChromeCall, isDiagnosticResult } = __m19;
function installDiagnosticContent({ identity = null, chromeApi = globalThis.chrome, windowApi = globalThis.window, documentApi = globalThis.document, nonce = browserNonce, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  if (!windowApi || windowApi.top !== windowApi || !diagnosticGameUrl(windowApi.location?.href) || !documentApi?.documentElement || !chromeApi?.runtime?.onMessage?.addListener) return { enabled: false };
  const identityDisabled = identity?.enabled !== true;
  let privateBinding;
  try { privateBinding = identityDisabled ? { documentId: nonce(), generation: nonce() } : identity.getDiagnosticBinding(); } catch { return { enabled: false }; }
  if (!valid(diagnosticBindingSchema, privateBinding)) return { enabled: false };
  const currentBinding = () => {
    const value = identityDisabled ? privateBinding : identity.getDiagnosticBinding();
    if (!valid(diagnosticBindingSchema, value)) throw new Error('BACKGROUND_UNAVAILABLE');
    return { documentId: value.documentId, generation: value.generation };
  };
  const sameBinding = (a, b) => a.documentId === b.documentId && a.generation === b.generation;
  let displayedBinding = { ...privateBinding };
  const extensionRoot = `chrome-extension://${chromeApi.runtime.id}/`;
  let stopped = false, busy = false, lastRead = -Infinity, bindingEpoch = 0, bindingRefreshTimer = null, bindingRefreshPending = false, unsubscribe = null, state = diagnosticFailure('identity', identityDisabled ? 'IDENTITY_DISABLED' : 'IDENTITY_NOT_READY');
  const timers = new Set(); let host = null, status = null, detail = null, refreshButton = null;
  function render(value) {
    try { state = validateDiagnosticState(value); } catch { state = diagnosticFailure('background', 'BACKGROUND_UNAVAILABLE'); }
    if (!status) return;
    // Only validated enum values are inserted, exclusively with textContent.
    const phase = DIAGNOSTIC_PHASES.includes(state.phase) ? state.phase : 'background';
    const code = DIAGNOSTIC_CODES.includes(state.code) ? state.code : 'BACKGROUND_UNAVAILABLE';
    status.textContent = 'Read-only: ' + phase + ' / ' + code + (state.lastFailure ? ' / last: ' + state.lastFailure.code : '');
    detail.textContent = (identityDisabled ? 'Local identity: IDENTITY_DISABLED. ' : '') + 'Last known snapshot only. ' + (state.lastFailure ? 'Last failure: ' + state.lastFailure.phase + ' / ' + state.lastFailure.code + '. ' : 'No recorded failure. ') + 'Page content can imitate this display. It is not authentication or proof.';
  }
  async function refresh() {
    if (stopped || busy || now() - lastRead < 1000) return false;
    busy = true; bindingRefreshPending = false; lastRead = now(); const epoch = bindingEpoch; if (refreshButton) refreshButton.disabled = true;
    try {
      const binding = currentBinding();
      if (!sameBinding(displayedBinding, binding)) { render(diagnosticFailure('identity', 'IDENTITY_CHANGED')); displayedBinding = binding; }
      const requestNonce = nonce(); if (!valid(tokenSchema, requestNonce) || requestNonce === binding.documentId || requestNonce === binding.generation) throw new Error('BACKGROUND_UNAVAILABLE');
      const response = await diagnosticChromeCall(chromeApi, callback => chromeApi.runtime.sendMessage({ type: DIAGNOSTIC_READ, nonce: requestNonce, ...binding }, callback), { setTimer, clearTimer });
      if (!isDiagnosticResult(response) || response.nonce !== requestNonce) throw new Error('BACKGROUND_UNAVAILABLE');
      if (!stopped && epoch === bindingEpoch) {
        const after = currentBinding();
        if (sameBinding(binding, after)) { render(response.state); displayedBinding = binding; }
        else { render(diagnosticFailure('identity', 'IDENTITY_CHANGED')); displayedBinding = after; }
      }
    } catch { if (!stopped && epoch === bindingEpoch) render(diagnosticFailure('background', 'BACKGROUND_UNAVAILABLE')); }
    finally { busy = false; if (refreshButton) refreshButton.disabled = false; queueBindingRefresh(); }
    return true;
  }
  function queueBindingRefresh() {
    // A generation change during an old read stays dirty until finally. One
    // latest-generation read is queued, never a polling loop or endpoint wake.
    if (stopped || busy || !bindingRefreshPending || bindingRefreshTimer !== null) return;
    bindingRefreshTimer = setTimer(() => {
      timers.delete(bindingRefreshTimer); bindingRefreshTimer = null;
      if (bindingRefreshPending) void refresh();
    }, Math.max(0, 1000 - (now() - lastRead)));
    bindingRefreshTimer?.unref?.(); timers.add(bindingRefreshTimer);
  }
  const trusted = sender => sender?.id === chromeApi.runtime.id && !sender.tab && (sender.url === undefined || typeof sender.url === 'string' && sender.url.startsWith(extensionRoot)) && (sender.origin === undefined || sender.origin === extensionRoot.slice(0, -1));
  const listener = (request, sender, respond) => {
    if (stopped || !valid(diagnosticChallengeSchema, request) || !trusted(sender)) return;
    try { respond({ type: DIAGNOSTIC_DOCUMENT, nonce: request.nonce, ...currentBinding() }); } catch {}
  };
  try {
    host = documentApi.createElement('aside');
    // Nothing private is attached to the host, attributes, document or window.
    const root = host.attachShadow({ mode: 'open' });
    const style = documentApi.createElement('style');
    style.textContent = ':host{all:initial!important;position:fixed!important;right:8px!important;bottom:8px!important;z-index:2147483646!important;max-width:min(310px,80vw)!important;pointer-events:none!important}section{all:initial;display:block;box-sizing:border-box;padding:6px 8px;background:#142028;color:#e4edf3;border:1px solid #557080;border-radius:7px;font:11px/1.4 system-ui,sans-serif;pointer-events:auto;max-width:100%;overflow-wrap:anywhere}p{margin:3px 0}button{font:11px system-ui,sans-serif;color:#e4edf3;background:#253d4a;border:1px solid #6d8b9b;border-radius:4px;padding:3px 5px;cursor:pointer}button:disabled{opacity:.6;cursor:default}[hidden]{display:none!important}';
    const panel = documentApi.createElement('section'), title = documentApi.createElement('p');
    title.textContent = 'COR3 Helper connection';
    status = documentApi.createElement('p'); status.setAttribute('aria-live', 'polite');
    const toggle = documentApi.createElement('button'), body = documentApi.createElement('div');
    toggle.type = 'button'; toggle.textContent = 'Details'; toggle.setAttribute('aria-expanded', 'false'); body.hidden = true;
    detail = documentApi.createElement('p');
    refreshButton = documentApi.createElement('button'); refreshButton.type = 'button'; refreshButton.textContent = 'Refresh diagnostics';
    toggle.addEventListener('click', event => { if (event.isTrusted !== true || stopped) return; body.hidden = !body.hidden; toggle.textContent = body.hidden ? 'Details' : 'Hide details'; toggle.setAttribute('aria-expanded', String(!body.hidden)); });
    refreshButton.addEventListener('click', event => { if (event.isTrusted === true) void refresh(); });
    body.appendChild(detail); body.appendChild(refreshButton);
    panel.appendChild(title); panel.appendChild(status); panel.appendChild(toggle); panel.appendChild(body);
    root.appendChild(style); root.appendChild(panel); documentApi.documentElement.appendChild(host); render(state);
  } catch { try { host?.remove(); } catch {} return { enabled: false }; }
  // Existing identity observation announces a changed generation privately. It
  // clears old-account text immediately even after all startup reads finished.
  // At most one bounded refresh is queued; this adds no observer or interval.
  if (!identityDisabled && typeof identity.subscribeDiagnosticBindingChange === 'function') unsubscribe = identity.subscribeDiagnosticBindingChange(value => {
    if (stopped || !valid(diagnosticBindingSchema, value)) return;
    bindingEpoch++; displayedBinding = { documentId: value.documentId, generation: value.generation };
    render(diagnosticFailure('identity', 'IDENTITY_NOT_READY'));
    bindingRefreshPending = true; queueBindingRefresh();
  });
  chromeApi.runtime.onMessage.addListener(listener);
  const stop = () => { stopped = true; bindingRefreshPending = false; unsubscribe?.(); for (const timer of timers) clearTimer(timer); timers.clear(); chromeApi.runtime.onMessage.removeListener?.(listener); windowApi.removeEventListener?.('pagehide', stop); try { host?.remove(); } catch {} };
  windowApi.addEventListener('pagehide', stop, { once: true });
  // Finite startup reads, never an interval, heartbeat, alarm or keep-alive.
  for (const delay of [0, 3000, 10000]) { const timer = setTimer(() => { timers.delete(timer); void refresh(); }, delay); timer?.unref?.(); timers.add(timer); }
  return Object.freeze({ enabled: true, stop });
}

return Object.freeze({ installDiagnosticContent });
})();
const __m0 = (() => {
const { installIdentityContent } = __m1;
const { normalizeContextEvent } = __m12;
const { installDiagnosticContent } = __m18;
const identity = installIdentityContent({ rules: globalThis.Cor3FullIdentityRules, normalizeEvent: normalizeContextEvent });
installDiagnosticContent({ identity });

return Object.freeze({  });
})();
})();
