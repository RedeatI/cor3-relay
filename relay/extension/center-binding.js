/* One browser-verified normal window, exactly one visible COR3 account. No implicit resume. */
(function(root){'use strict';
 const ACCOUNT=/^FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}$/,HEX=/^[a-f0-9]{32}$/;
 const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...k].sort().join('|');
 function safeUrl(x){try{const u=new URL(x);return typeof x==='string'&&x.length<=2048&&u.protocol==='https:'&&['cor3.gg','os.cor3.gg'].includes(u.hostname)&&!u.port&&!u.username&&!u.password}catch{return false}}
 function countActiveJobs(market) {
  if (!Array.isArray(market?.jobs)) return null;
  const taken = Array.isArray(market.recentJobs) ? market.recentJobs.filter(job => job?.status === 'TAKEN' && !job.isCompleted && !job.isExpired) : [];
  const takenIds = new Set(taken.map(job => job.id).filter(Boolean));
  return taken.length + market.jobs.filter(job => job && !job.isCompleted && !job.isExpired &&
   !['FAILED','COMPLETED','EXPIRED'].includes(job.status) && (!job.id || !takenIds.has(job.id))).length;
 }
 const error=code=>Object.assign(Error(code),{code});
 function create({api=root.chrome||root.browser,migration=root.Cor3CenterMigration,profile=root.Cor3CenterProfile,featureDefaults=root.Cor3CenterFeatureDefaults,expectedAccount=root.Cor3BrowserAccount?.accountId,nonce=()=>Array.from(root.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join(''),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let binding=null,epoch=0,closed=false,autoFlight=null,resolveFlight=null;const pending=new Map(),hooks=new Set(),boundHooks=new Set(),tabEpoch=new Map(),windowEpoch=new Map();
  const snapshot=()=>binding?Object.freeze({...binding}):null;
  const same=(a,b)=>!!a&&!!b&&['windowId','tabId','accountId','documentId','url','epoch'].every(k=>a[k]===b[k]);
  const isCurrent=b=>!closed&&same(b,binding);
  function revoke(){const old=binding;binding=null;epoch++;for(const [k,p]of pending){clearTimer(p.timer);pending.delete(k);p.reject(error('CENTER_BINDING_REVOKED'))}if(old)for(const f of hooks){try{Promise.resolve(f(Object.freeze({...old}))).catch(()=>{})}catch{}}
   // The page may still remember a successful announcement after a transport timeout.
   // Ask only that document's tab to re-announce; binding still requires fresh probes.
   if(old&&!closed)try{Promise.resolve(api.tabs.sendMessage(old.tabId,{type:'cor3-center-page-active'},{frameId:0})).catch(()=>{})}catch{}
  }
  const popupSender=s=>s?.id===api.runtime.id&&['popup.html','popup.html?mode=popout','popup.html?mode=sidepanel'].map(p=>api.runtime.getURL(p)).includes(s.url)&&(s.frameId===undefined||s.frameId===0);
  const readUiSender=s=>popupSender(s)||(s?.id===api.runtime.id&&['devtools-panel.html','devtools-log-viewer.html'].map(p=>api.runtime.getURL(p)).includes(s.url)&&(s.frameId===undefined||s.frameId===0));
  function verifyAccount(account) {
   if (expectedAccount !== undefined && (typeof expectedAccount !== 'string' || !ACCOUNT.test(expectedAccount) || account !== expectedAccount)) {
    throw error('CENTER_SAVED_ACCOUNT_MISMATCH');
   }
  }
  async function candidates(windowId){
   if(closed||!Number.isSafeInteger(windowId)||windowId<0)throw error('CENTER_WINDOW_UNAVAILABLE');
   const w=await api.windows.get(windowId);if(w?.id!==windowId||w.type!=='normal')throw error('CENTER_WINDOW_UNAVAILABLE');
   const all=await api.tabs.query({windowId});if(!Array.isArray(all)||all.some(t=>t.windowId!==windowId||!Number.isSafeInteger(t.id)||typeof t.url!=='string'))throw error('CENTER_WINDOW_UNAVAILABLE');
   const tabs=all.filter(t=>safeUrl(t.url)||safeUrl(t.pendingUrl));
   if(tabs.length!==1)throw error(tabs.length?'CENTER_ACCOUNT_AMBIGUOUS':'CENTER_ACCOUNT_NOT_FOUND');
   const t=tabs[0];if(t.status==='loading'||!safeUrl(t.url)||(t.pendingUrl!==undefined&&t.pendingUrl!==t.url))throw error('CENTER_ACCOUNT_NOT_READY');return {windowId,tabId:t.id,url:t.url};
  }
  const sameCandidate=(a,b)=>a&&b&&a.windowId===b.windowId&&a.tabId===b.tabId&&a.url===b.url;
  async function probe(candidate){
   const before=epoch,te=tabEpoch.get(candidate.tabId)||0,tab=await api.tabs.get(candidate.tabId);
   if(closed||before!==epoch||te!==(tabEpoch.get(candidate.tabId)||0)||tab?.id!==candidate.tabId||tab.windowId!==candidate.windowId||tab.url!==candidate.url||tab.status==='loading')throw error('CENTER_BINDING_REVOKED');
   const n=nonce();if(!HEX.test(n)||pending.has(n))throw error('CENTER_PROBE_UNAVAILABLE');
   return new Promise((resolve,reject)=>{const p={...candidate,epoch:before,resolve,reject,timer:setTimer(()=>{if(pending.get(n)!==p)return;pending.delete(n);reject(error('CENTER_PROBE_TIMEOUT'))},2500)};pending.set(n,p);
    Promise.resolve().then(()=>api.tabs.sendMessage(candidate.tabId,{type:'cor3-center-probe',nonce:n},{frameId:0})).catch(()=>{if(pending.get(n)!==p)return;pending.delete(n);clearTimer(p.timer);reject(error('CENTER_RECEIVER_UNAVAILABLE'))});
   });
  }
  function resolve(){const b=snapshot();if(!b)return Promise.resolve(null);if(resolveFlight&&same(resolveFlight.binding,b))return resolveFlight.promise;
   const flight={binding:b,promise:null};flight.promise=(async()=>{try{
    for(let attempt=0;attempt<2;attempt++)try{const before=await candidates(b.windowId);if(!isCurrent(b)||!sameCandidate(before,b))throw error('CENTER_BINDING_REVOKED');const o=await probe(before);const after=await candidates(b.windowId);if(!isCurrent(b)||!sameCandidate(before,after)||o.account!==b.accountId||o.documentId!==b.documentId||o.url!==b.url)throw error('CENTER_BINDING_REVOKED');return {...b,id:b.tabId};}
    catch(e){if(attempt||!isCurrent(b)||!['CENTER_PROBE_TIMEOUT','CENTER_RECEIVER_UNAVAILABLE'].includes(e.code))throw e;}
   }catch{if(isCurrent(b))revoke();return null;}finally{if(resolveFlight===flight)resolveFlight=null;}})();resolveFlight=flight;return flight.promise;
  }
  async function guard(tabId,fn,b=snapshot()){if(typeof fn!=='function'||!isCurrent(b)||b.tabId!==tabId)throw error('CENTER_BINDING_REVOKED');if(!await resolve()||!isCurrent(b))throw error('CENTER_BINDING_REVOKED');const v=await fn(Object.freeze({...b}));if(!await resolve()||!isCurrent(b))throw error('CENTER_BINDING_REVOKED');return v;}
  const matchesTopFrame=(sender,documentId,b)=>isCurrent(b)&&HEX.test(documentId)&&documentId===b.documentId&&sender?.id===api.runtime.id&&sender.frameId===0&&sender.tab?.id===b.tabId&&sender.tab.windowId===b.windowId&&sender.url===b.url;
  async function admission(sender,documentId){const b=snapshot();if(!matchesTopFrame(sender,documentId,b))return {allowed:false,snapshot:null};return await resolve()&&isCurrent(b)?{allowed:true,snapshot:b}:{allowed:false,snapshot:null};}
  async function autoBind(windowId,sender){
   if(!popupSender(sender))throw error('CENTER_UI_REQUIRED');
   if(sender.tab&&(!Number.isSafeInteger(sender.tab.windowId)||sender.tab.windowId!==windowId))throw error('CENTER_WINDOW_UNAVAILABLE');
   return bindWindow(windowId);
  }
  async function bindWindow(windowId, hint){
   if(binding){if(binding.windowId!==windowId)throw error('CENTER_OTHER_WINDOW_BOUND');const b=await resolve();if(!b)throw error('CENTER_BINDING_REVOKED');return {ok:true,tab:b};}
   if(autoFlight){if(autoFlight.windowId!==windowId)throw error('CENTER_AUTO_BUSY');return autoFlight.promise;}
   const start=epoch,we=windowEpoch.get(windowId)||0;
   const check=()=>{if(closed||epoch!==start||we!==(windowEpoch.get(windowId)||0)||binding)throw error('CENTER_BINDING_REVOKED')};
   const promise=(async()=>{const a=await candidates(windowId);check();if(hint&&(a.tabId!==hint.tabId||a.url!==hint.url))throw error('CENTER_BINDING_REVOKED');const one=await probe(a);check();verifyAccount(one.account);if(hint&&one.documentId!==hint.documentId)throw error('CENTER_BINDING_REVOKED');const b=await candidates(windowId);check();if(!sameCandidate(a,b))throw error('CENTER_BINDING_REVOKED');const two=await probe(b);check();const c=await candidates(windowId);check();if(!sameCandidate(a,c)||one.account!==two.account||one.documentId!==two.documentId||one.url!==two.url)throw error('CENTER_BINDING_REVOKED');
    const assertMigrationCurrent=async()=>{check();const current=await candidates(windowId);check();if(!sameCandidate(a,current))throw error('CENTER_BINDING_REVOKED');const observed=await probe(current);check();const after=await candidates(windowId);check();if(!sameCandidate(a,after)||observed.account!==two.account||observed.documentId!==two.documentId||observed.url!==two.url)throw error('CENTER_BINDING_REVOKED');};
    if(!migration||typeof migration.apply!=='function')throw error('CENTER_MIGRATION_UNAVAILABLE');
    if(profile)await profile.verify(two.account,assertMigrationCurrent);
    await migration.apply(two.account,assertMigrationCurrent);await assertMigrationCurrent();check();
    if(profile)await profile.remember(two.account,assertMigrationCurrent);
    if(featureDefaults)await featureDefaults.apply(two.account,assertMigrationCurrent);
    if(profile&&root.Cor3ExpeditionSaveRecovery){
     try{await root.Cor3ExpeditionSaveRecovery.restore(two.account,assertMigrationCurrent);}
     catch{root.console?.warn?.('COR3 Expedition save restore could not be confirmed');}
    }
    await assertMigrationCurrent();check();
    binding=Object.freeze({windowId,tabId:a.tabId,accountId:two.account,documentId:two.documentId,url:a.url,epoch:++epoch});const result=snapshot();for(const f of boundHooks){try{Promise.resolve(f(result)).catch(()=>{})}catch{}}return {ok:true,tab:{...result,id:result.tabId}};
   })();autoFlight={windowId,promise};try{return await promise}finally{if(autoFlight?.promise===promise)autoFlight=null}
  }
  async function popup(m,sender){
   if(m.type==='cor3-center-auto-bind'){if(!exact(m,['type','windowId']))throw error('CENTER_REQUEST_INVALID');return autoBind(m.windowId,sender)}
   if(!readUiSender(sender))throw error('CENTER_UI_REQUIRED');
   if(exact(m,['type'])&&m.type==='centerResolve')return {ok:true,tab:await resolve()};
   if(exact(m,['type','tabId','message','expectedBinding'])||exact(m,['type','tabId','message','options','expectedBinding'])){
    if(m.type!=='centerSend'||!isCurrent(m.expectedBinding)||!m.message||typeof m.message!=='object'||Array.isArray(m.message)||JSON.stringify(m.message).length>65536)throw error('CENTER_REQUEST_INVALID');if(m.options!==undefined&&(!exact(m.options,['frameId'])||m.options.frameId!==0))throw error('CENTER_REQUEST_INVALID');
    const value=await guard(m.tabId,b=>api.tabs.sendMessage(m.tabId,{...m.message,centerIdentityDocumentId:b.documentId},{frameId:0}),m.expectedBinding);return {ok:true,value};
   }throw error('CENTER_REQUEST_INVALID');
  }
  const diagnosticCodes=new Set(["CENTER_IDENTITY_SELECTOR_MISSING","CENTER_IDENTITY_SELECTOR_MULTIPLE","CENTER_IDENTITY_HIDDEN","CENTER_IDENTITY_FORMAT","CENTER_IDENTITY_UNAVAILABLE","CENTER_IDENTITY_REVOKED"]);
  const known=new Set([...diagnosticCodes,'CENTER_PROBE_TIMEOUT','CENTER_RECEIVER_UNAVAILABLE','CENTER_WINDOW_UNAVAILABLE','CENTER_ACCOUNT_AMBIGUOUS','CENTER_ACCOUNT_NOT_FOUND','CENTER_ACCOUNT_NOT_READY','CENTER_OTHER_WINDOW_BOUND','CENTER_AUTO_BUSY','CENTER_BINDING_REVOKED','CENTER_MIGRATION_UNAVAILABLE','CENTER_MIGRATION_INCOMPLETE','CENTER_MIGRATION_REVIEW_REQUIRED','CENTER_SAVED_ACCOUNT_MISMATCH','CENTER_ACCOUNT_SAVE_FAILED']);
  const cacheSummaryKeys = [
   'marketDataUpdatedAt','darkMarketDataUpdatedAt','soyuzMarketDataUpdatedAt','usolMarketDataUpdatedAt',
   'expeditionsDataUpdatedAt','droneDataUpdatedAt','dailyOpsUpdatedAt'
  ];
  const marketSummaryKeys = ['marketData','darkMarketData','soyuzMarketData','usolMarketData'];
  async function readCacheSummary(sender, documentId) {
   if (sender?.id !== api.runtime.id || sender.frameId !== 0 ||
       !Number.isSafeInteger(sender.tab?.id) || !Number.isSafeInteger(sender.tab.windowId) ||
       !safeUrl(sender.url) || sender.tab.url !== sender.url || !HEX.test(documentId)) throw error('CENTER_REQUEST_INVALID');
   const { id: tabId, windowId, url } = sender.tab;
   const observedEpoch = epoch, observedWindowEpoch = windowEpoch.get(windowId);
   async function check(expectedAccount) {
    const current = await candidates(windowId);
    const tab = await api.tabs.get(tabId);
    if (!sameCandidate(current,{windowId,tabId,url}) ||
        epoch !== observedEpoch || observedWindowEpoch !== windowEpoch.get(windowId)) throw error('CENTER_BINDING_REVOKED');
    const proof = await probe(current);
    if (proof.documentId !== documentId || proof.url !== url ||
        (expectedAccount && proof.account !== expectedAccount)) throw error('CENTER_BINDING_REVOKED');
    const end = await api.tabs.get(tabId);
    if (end.windowId !== windowId || end.url !== url || end.status === 'loading' ||
        epoch !== observedEpoch || observedWindowEpoch !== windowEpoch.get(windowId)) throw error('CENTER_BINDING_REVOKED');
    return proof.account;
   }
   const account = await check();
   verifyAccount(account);
   if(profile)await profile.verify(account,()=>check(account));
   const prefix = 'center:' + account + ':';
   const keys = [...cacheSummaryKeys, ...marketSummaryKeys.map(key=>key+'SummaryV1'), 'expeditionsData', 'droneData', 'autoSendMerc', 'autoDrone',
    'autoDailyHackEnabled','dailyOpsData','dailyHackDiagnostics','dailyHackNextCheckAt','sessionAuthDocumentId','sessionAuthReadyAt','networkRuntimeStatus','automationRunLogs'];
   const raw = await api.storage.local.get(keys.map(key => prefix + key));
   const counts = {}, legacy = [];
   for (const key of marketSummaryKeys) {
    const count = raw[prefix + key + 'SummaryV1']?.activeJobsCount;
    if (Number.isSafeInteger(count) && count >= 0) counts[key] = count;
    else if (count !== null) legacy.push(key);
   }
   if (legacy.length) {
    const rows = await api.storage.local.get(legacy.flatMap(key=>[prefix+key, prefix+key+'UpdatedAt']));
    for (const key of legacy) {
     const count = countActiveJobs(rows[prefix+key]);
     if (count !== null) counts[key] = count;
     raw[prefix+key+'UpdatedAt'] = rows[prefix+key+'UpdatedAt'];
    }
   }
   await check(account);
   const values = Object.fromEntries(cacheSummaryKeys.filter(key => Number.isFinite(raw[prefix + key])).map(key => [key, raw[prefix + key]]));
   const expeditions = raw[prefix + 'expeditionsData'];
   if (Array.isArray(expeditions)) counts.expeditionsData = expeditions.length;
   const drone = raw[prefix + 'droneData'];
   if (drone && typeof drone === 'object') counts.droneData = drone.activeMissionId ? 1 : 0;
   const expeditionSettings = {
    mercenaryEnabled: raw[prefix + 'autoSendMerc']?.enabled === true,
    droneEnabled: raw[prefix + 'autoDrone']?.enabled === true,
    dronePaused: raw[prefix + 'autoDrone']?.paused === true
   };
   const daily = raw[prefix + 'dailyOpsData'];
   const dailyState = {
    enabled: raw[prefix + 'autoDailyHackEnabled'] === true,
    sessionReady: raw[prefix + 'sessionAuthDocumentId'] === documentId,
    sessionReadyAt: Number.isFinite(raw[prefix + 'sessionAuthReadyAt']) ? raw[prefix + 'sessionAuthReadyAt'] : null,
    claimed: typeof daily?.hasClaimedToday === 'boolean' ? daily.hasClaimedToday : null,
    nextCheckAt: Number.isFinite(raw[prefix + 'dailyHackNextCheckAt']) ? raw[prefix + 'dailyHackNextCheckAt'] : null
   };
   const events = raw[prefix + 'dailyHackDiagnostics'];
   const dailyEvents = Array.isArray(events) ? events.slice(-5).filter(e =>
    Number.isFinite(e?.ts) && typeof e.step === 'string' && /^[a-z][a-z.]{0,40}$/.test(e.step)
   ).map(e => ({at:e.ts,step:e.step})) : [];
   const runtime=raw[prefix+'networkRuntimeStatus'];
   const operationState=runtime?.accountId===account&&runtime.documentId===documentId?{
    active:typeof runtime.active==='string'?runtime.active:null,
    queued:Array.isArray(runtime.queued)?runtime.queued.filter(x=>typeof x==='string').slice(0,20):[],
    endpointOwner:typeof runtime.lease?.owner==='string'?runtime.lease.owner:null,
    blocked:typeof runtime.blocked==='string'?runtime.blocked:null,
    updatedAt:Number.isFinite(runtime.updatedAt)?runtime.updatedAt:null
   }:null;
   const logs=raw[prefix+'automationRunLogs'];
   const operationEvents=logs?.accountId===account&&logs.documentId===documentId&&Array.isArray(logs.entries)?logs.entries.slice(-8).filter(e=>Number.isFinite(e?.at)&&typeof e.code==='string'&&/^[a-z][a-z0-9.-]{0,63}$/.test(e.code)).map(e=>({at:e.at,code:e.code,message:typeof e.message==='string'?e.message.slice(0,240):''})):[];
   return { ok: true, values, counts, expeditionSettings, dailyState, dailyEvents, operationState, operationEvents };
  }
  function message(m,sender,respond){
   if(m?.type==='cor3CenterCacheSummary'&&exact(m,['type','documentId'])){
    readCacheSummary(sender,m.documentId).then(respond,e=>respond({ok:false,code:known.has(e?.code)?e.code:'CENTER_CACHE_UNAVAILABLE'}));return true;
   }
   if(['centerResolve','centerSend','cor3-center-auto-bind'].includes(m?.type)){popup(m,sender).then(respond,e=>respond({ok:false,code:known.has(e?.code)?e.code:'CENTER_BINDING_UNAVAILABLE'}));return true;}
   if(exact(m,['type','documentId'])&&m.type==='centerAdmission'){admission(sender,m.documentId).then(respond,()=>respond({allowed:false,snapshot:null}));return true;}
   if(['cor3-center-list','cor3-center-prepare','cor3-center-confirm','cor3-center-unbind'].includes(m?.type)){respond({ok:false,code:'CENTER_MANUAL_BINDING_DISABLED'});return;}
   if(sender?.id!==api.runtime.id||sender.frameId!==0||!Number.isSafeInteger(sender.tab?.id)||!Number.isSafeInteger(sender.tab?.windowId)||!safeUrl(sender.url))return;
   if (m?.type === 'cor3-center-page-ready' && exact(m,['type','documentId']) && HEX.test(m.documentId)) {
    if ((!profile && (typeof expectedAccount !== 'string' || !ACCOUNT.test(expectedAccount))) || sender.tab.url !== sender.url) {
     respond({ok:false,code:'CENTER_ACCOUNT_NOT_READY'});
     return;
    }
    bindWindow(sender.tab.windowId,{tabId:sender.tab.id,url:sender.url,documentId:m.documentId})
     .then(result=>respond({ok:result.tab.tabId===sender.tab.id&&result.tab.documentId===m.documentId}),
       e=>respond({ok:false,code:known.has(e?.code)?e.code:'CENTER_BINDING_UNAVAILABLE'}));
    return true;
   }
   if(exact(m,['type','documentId'])&&m.type==='cor3-center-revoked'&&HEX.test(m.documentId)){if((binding?.tabId===sender.tab.id&&binding.windowId===sender.tab.windowId&&binding.documentId===m.documentId)||[...pending.values()].some(p=>p.tabId===sender.tab.id&&p.windowId===sender.tab.windowId))revoke();return;}
   if(exact(m,['type','nonce','code','count'])&&m.type==='cor3-center-diagnostic'&&HEX.test(m.nonce)&&diagnosticCodes.has(m.code)&&Number.isInteger(m.count)&&m.count>=0&&m.count<=2){const p=pending.get(m.nonce);if(!p||p.epoch!==epoch||p.tabId!==sender.tab.id||p.windowId!==sender.tab.windowId||p.url!==sender.url)return;pending.delete(m.nonce);clearTimer(p.timer);p.reject(error(m.code));return;}
   if(!exact(m,['type','nonce','account','documentId','url'])||m.type!=='cor3-center-observation'||!HEX.test(m.nonce)||!HEX.test(m.documentId)||!ACCOUNT.test(m.account))return;
   const p=pending.get(m.nonce);if(!p||p.epoch!==epoch||p.tabId!==sender.tab.id||p.windowId!==sender.tab.windowId||p.url!==sender.url||m.url!==p.url)return;pending.delete(m.nonce);clearTimer(p.timer);p.resolve({account:m.account,documentId:m.documentId,url:p.url});
  }
  function touchWindow(id){if(!Number.isSafeInteger(id))return;windowEpoch.set(id,(windowEpoch.get(id)||0)+1)}
  function checkBoundWindow(id){const b=snapshot();if(!b||id!==b.windowId)return;void candidates(id).then(c=>{if(isCurrent(b)&&!sameCandidate(c,b))revoke()},()=>{if(isCurrent(b))revoke()})}
  const updated=(id,change,tab)=>{if(change.status!=='loading'&&change.url===undefined)return;tabEpoch.set(id,(tabEpoch.get(id)||0)+1);touchWindow(tab?.windowId);if(binding?.tabId===id){revoke();return;}for(const [k,p]of pending)if(p.tabId===id){pending.delete(k);clearTimer(p.timer);p.reject(error('CENTER_BINDING_REVOKED'))}if(tab?.windowId!==undefined)checkBoundWindow(tab.windowId);else{const b=snapshot();if(b)void api.tabs.get(id).then(t=>{if(isCurrent(b))checkBoundWindow(t.windowId)},()=>{if(isCurrent(b))revoke()})}};
  const created=t=>{touchWindow(t.windowId);checkBoundWindow(t.windowId)};
  const removed=(id,info)=>{tabEpoch.set(id,(tabEpoch.get(id)||0)+1);touchWindow(info?.windowId);if(binding?.tabId===id)revoke();else checkBoundWindow(info?.windowId);for(const [k,p]of pending)if(p.tabId===id){pending.delete(k);clearTimer(p.timer);p.reject(error('CENTER_BINDING_REVOKED'))}};
  const attached=(id,info)=>{touchWindow(info.newWindowId);if(binding?.tabId===id)revoke();else checkBoundWindow(info.newWindowId)};
  const detached=(id,info)=>{touchWindow(info.oldWindowId);if(binding?.tabId===id)revoke();else checkBoundWindow(info.oldWindowId)};
  const windowRemoved=id=>{touchWindow(id);if(binding?.windowId===id)revoke()};
  const activated=({tabId,windowId})=>{
   if(expectedAccount===undefined&&!profile)return;
   checkBoundWindow(windowId);
   Promise.resolve(api.tabs.sendMessage(tabId,{type:'cor3-center-page-active'},{frameId:0})).catch(()=>{});
  };
  api.runtime.onMessage.addListener(message);api.tabs.onUpdated.addListener(updated);api.tabs.onRemoved.addListener(removed);api.tabs.onCreated?.addListener(created);api.tabs.onAttached?.addListener(attached);api.tabs.onDetached?.addListener(detached);api.windows.onRemoved?.addListener(windowRemoved);
  api.tabs.onActivated?.addListener(activated);
  return Object.freeze({snapshot,isCurrent,resolve,guard,revoke,admission,matchesTopFrame,onBound(f){boundHooks.add(f);return()=>boundHooks.delete(f)},onRevoke(f){hooks.add(f);return()=>hooks.delete(f)},close(){if(closed)return;closed=true;revoke();api.runtime.onMessage.removeListener(message);api.tabs.onUpdated.removeListener(updated);api.tabs.onRemoved.removeListener(removed);api.tabs.onCreated?.removeListener(created);api.tabs.onAttached?.removeListener(attached);api.tabs.onDetached?.removeListener(detached);api.tabs.onActivated?.removeListener(activated);api.windows.onRemoved?.removeListener(windowRemoved)}});
 }
 root.Cor3CenterBindingFactory=Object.freeze({create,safeUrl,countActiveJobs});if(root.chrome?.runtime?.onMessage||root.browser?.runtime?.onMessage)root.Cor3CenterBinding=create();
})(globalThis);


