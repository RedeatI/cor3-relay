/* Account namespaced local cache/preferences; shared code contains no account or key. */
(function(root){'use strict';
 const api=root.chrome||root.browser,raw=api.storage.local;
 const validKey=k=>typeof k==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(k)&&!k.startsWith('center:');
 const privileged=s=>s?.id===api.runtime.id&&['popup.html','devtools-panel.html','devtools-log-viewer.html'].some(p=>s.url===api.runtime.getURL(p)||s.url?.startsWith(api.runtime.getURL(p)+'?'))&&!s.tab?.url?.startsWith('https:');
 let writeTail=Promise.resolve();
 const serialize=fn=>{const next=writeTail.then(fn,fn);writeTail=next.catch(()=>{});return next;};
 const helper='helperMode';
 const dailyLockTtlMs=10*60*1000;
 const enabledDefaults=Object.freeze(['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled','autoUpdateMarkets','autoDailyHackEnabled','autoRunMarketJobsEnabled']);
 const marketKeys=['marketData','darkMarketData','soyuzMarketData','usolMarketData'];
 const summarySources=Object.fromEntries(marketKeys.map(k=>[k+'SummaryV1',k]));
 const summarize=value=>value&&typeof value==='object'?{activeJobsCount:root.Cor3CenterBindingFactory?.countActiveJobs(value),nextJobsResetAt:typeof value.nextJobsResetAt==='string'?value.nextJobsResetAt:null,jobsCount:Array.isArray(value.jobs)?value.jobs.length:0,recentJobsCount:Array.isArray(value.recentJobs)?value.recentJobs.length:0}:undefined;
 let summaryGeneration=null,summaryRevision=0;const legacySummaries=new Map();
 async function dispatch(op,value,sender,documentId,uiBinding){
  const binding=root.Cor3CenterBinding,internal=sender===undefined,expected=binding.snapshot(),ui=privileged(sender);
  if(ui&&!binding.isCurrent(uiBinding))throw Error('CENTER_UI_REOPEN_REQUIRED');
  let child=false;
  if(!internal&&!ui&&!binding.matchesTopFrame(sender,documentId,expected)){
    let u;try{u=new URL(sender?.url)}catch{}
    if(!expected||sender?.id!==api.runtime.id||sender.tab?.id!==expected.tabId||!Number.isSafeInteger(sender.frameId)||sender.frameId<=0||!u||u.protocol!=='https:'||u.hostname!=='svc-corie.cor3.gg'||!u.pathname.startsWith('/games/simple-hack')||u.port||u.username||u.password||!/^[a-f0-9]{32}$/.test(documentId))throw Error('CENTER_STORE_UNBOUND');
    const frames=await api.scripting.executeScript({target:{tabId:expected.tabId,frameIds:[sender.frameId]},func:()=>globalThis.Cor3Automation?.contentDocumentId});
    if(frames?.length!==1||frames[0].frameId!==sender.frameId||frames[0].result!==documentId||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
    const keys=typeof value==='string'?[value]:Array.isArray(value)?value:value&&typeof value==='object'?Object.keys(value):[];
    if(op!=='scope'&&(keys.length===0||keys.some(k=>!['autoSimpleDecryptEnabled','simpleDecryptSolverStatus'].includes(k))))throw Error('CENTER_STORE_UNBOUND');
    child=true;
  }
  const helperRead=op==='get'&&value===helper;
  if(internal&&helperRead)return raw.get(helper);
  if(!expected||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
  if(op==='scope'){
   if(!await binding.resolve()||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
   return {accountId:expected.accountId};
  }
  const b=expected;
  const prefix='center:'+b.accountId+':';
  const verifyChild=async()=>{if(!child)return;const f=await api.scripting.executeScript({target:{tabId:expected.tabId,frameIds:[sender.frameId]},func:()=>globalThis.Cor3Automation?.contentDocumentId});if(f?.length!==1||f[0].frameId!==sender.frameId||f[0].result!==documentId||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');};
  const execute=()=>binding.guard(b.tabId,async()=>{await verifyChild();
   if(op==='get'){
    const keys=value===null||value===undefined?null:typeof value==='string'?[value]:Array.isArray(value)?value:Object.keys(value);
    if(keys&&(!keys.every(validKey)||keys.length>1000))throw Error('CENTER_STORE_KEYS');
    const data=await raw.get(keys===null?null:keys.map(k=>k===helper?helper:prefix+k));const result={};
    // Old profiles can derive small summaries without migrating or deleting their market cache.
    const missing=(keys||[]).filter(k=>summarySources[k]&&!Object.hasOwn(data,prefix+k));
    if(missing.length){const generation=JSON.stringify([b.accountId,b.id,b.documentId]);if(summaryGeneration!==generation){summaryGeneration=generation;legacySummaries.clear();}const uncached=missing.filter(k=>!legacySummaries.has(k)),captured=summaryRevision;if(uncached.length){const legacy=await raw.get(uncached.map(k=>prefix+summarySources[k]));for(const k of uncached){const summary=summarize(legacy[prefix+summarySources[k]]);if(summary)data[prefix+k]=summary;if(captured===summaryRevision&&generation===summaryGeneration)legacySummaries.set(k,summary||null);}}for(const k of missing)if(legacySummaries.get(k))data[prefix+k]=legacySummaries.get(k);}
    if(keys===null){for(const [k,v]of Object.entries(data))if(k.startsWith(prefix))result[k.slice(prefix.length)]=v;for(const k of enabledDefaults)if(!Object.hasOwn(result,k))result[k]=true;}
    else for(const k of keys){const pk=k===helper?helper:prefix+k;if(Object.hasOwn(data,pk))result[k]=data[pk];else if(enabledDefaults.includes(k))result[k]=true;else if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.hasOwn(value,k))result[k]=value[k];}return result;
   }
   if(op==='appendConsole'){
    if(child||!Array.isArray(value)||!value.length||value.length>128)throw Error('CENTER_LOG_BATCH');
    const key=prefix+'cor3_console_logs';
    const batch=value.map(entry=>{
     if(!entry||typeof entry.args!=='string'||entry.args.length>2048||!['background','popup','content'].includes(entry.source)
       ||!['log','warn','error'].includes(entry.level)||typeof entry.timestamp!=='string'||entry.timestamp.length!==24||!Number.isFinite(Date.parse(entry.timestamp)))throw Error('CENTER_LOG_ENTRY');
     return {timestamp:entry.timestamp,source:entry.source,level:entry.level,args:entry.args};
    });
    const saved=(await raw.get(key))[key];
    if(!binding.isCurrent(b))throw Error('CENTER_STORE_UNBOUND');
    const cutoff=new Date(Date.now()-8*3600000).toISOString();
    const history=Array.isArray(saved)?saved:[];
    let budget=1024*1024;
    const entries=history.concat(batch);
    let at=entries.length;
    while(at>0 && entries.length-at<5000){
     const row=entries[at-1];
     if(typeof row?.args!=='string'||row.timestamp<cutoff)break;
     // Bound UTF-8 storage conservatively even for non-ASCII console output.
     budget-=120+row.args.length*3;
     if(budget<0)break;
     at--;
    }
    batch[batch.length-1].batchSize=batch.length;
    await raw.set({[key]:entries.slice(at)});
    return {};
   }
   if(op==='daily'){
    if(internal||ui||child||!value||!['acquire','release','schedule'].includes(value.action))throw Error('CENTER_DAILY_SCOPE');
    const lockKey=prefix+'dailyHackRunLock', enabledKey=prefix+'autoDailyHackEnabled';
    const enabled=state=>state[helper]!==true&&(!Object.hasOwn(state,enabledKey)||state[enabledKey]===true);
    if(value.action==='schedule'){
     if(!Number.isFinite(value.at)||value.at<=0)throw Error('CENTER_DAILY_SCHEDULE');
     const state=await raw.get([enabledKey,helper]);
     if(!binding.isCurrent(b))throw Error('CENTER_STORE_UNBOUND');
     if(!enabled(state))return {scheduled:false};
     await raw.set({[prefix+'dailyHackNextCheckAt']:value.at});
     return {scheduled:true};
    }
    if(typeof value.owner!=='string'||!/^daily-[0-9]+-[0-9]+-[a-z0-9]{1,24}$/.test(value.owner))throw Error('CENTER_DAILY_OWNER');
    const state=await raw.get([lockKey,enabledKey,helper]);
    if(!binding.isCurrent(b))throw Error('CENTER_STORE_UNBOUND');
    const lock=state[lockKey];
    const owned=lock?.owner===value.owner&&lock.tabId===b.tabId&&lock.documentId===b.documentId;
    if(value.action==='release'){
     if(owned)await raw.remove([lockKey]);
     return {released:owned};
    }
    if(!enabled(state))return {acquired:false,disabled:true};
    if(owned)return {acquired:true};
    const now=Date.now();
    const ageMs=Number.isFinite(lock?.startedAt)?Math.max(0,now-lock.startedAt):dailyLockTtlMs;
    if(lock&&ageMs<dailyLockTtlMs){
     const scoped=Number.isSafeInteger(lock.tabId)&&typeof lock.documentId==='string';
     let ownerGone=scoped&&lock.tabId===b.tabId&&lock.documentId!==b.documentId;
     if(scoped&&lock.tabId!==b.tabId){
      try {
       const tabs=await api.tabs.query({});
       ownerGone=Array.isArray(tabs)&&tabs.some(tab=>tab.id===b.tabId)&&!tabs.some(tab=>tab.id===lock.tabId);
      } catch { /* An unreadable tab list leaves the preceding lease in place. */ }
     }
     if(!binding.isCurrent(b))throw Error('CENTER_STORE_UNBOUND');
     if(!ownerGone)return {acquired:false,ageMs,retryInMs:Math.min(120000,dailyLockTtlMs-ageMs)};
    }
    await raw.set({[lockKey]:{owner:value.owner,tabId:b.tabId,documentId:b.documentId,startedAt:now}});
    return {acquired:true};
   }
   if(op==='reconcileJobs'){
    if(internal||ui||child)throw Error('CENTER_STORE_UNBOUND');
    const runningKey=prefix+'autoJobsRunning', documentKey=prefix+'autoJobsRunDocumentId';
    const state=await raw.get([runningKey,documentKey]);
    if(!binding.isCurrent(b))throw Error('CENTER_STORE_UNBOUND');
    if(state[runningKey]!==true||state[documentKey]===b.documentId)return {cleared:false};
    await raw.set({[runningKey]:false,[documentKey]:null,[prefix+'autoJobsQueue']:[]});
    return {cleared:true};
   }
   if(op==='update'){
    if(!value||!validKey(value.key)||value.key===helper||!value.patch||typeof value.patch!=='object'||Array.isArray(value.patch)||Object.keys(value.patch).length>1000)throw Error('CENTER_STORE_KEYS');
    const pk=prefix+value.key,stored=(await raw.get(pk))[pk];
    if(!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
    const next={...(stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{}),...value.patch};
    const patch = {[pk]:next};
    if (marketKeys.includes(value.key)) patch[pk+'SummaryV1'] = summarize(next);
    await raw.set(patch);return next;
   }
   if(op==='set'){
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>1000||!Object.keys(value).every(k=>validKey(k)&&k!==helper))throw Error('CENTER_STORE_KEYS');
    const values={...value};
    if(typeof value.autoJobsRunning==='boolean')values.autoJobsRunDocumentId=value.autoJobsRunning?b.documentId:null;
    if(value.autoDailyHackEnabled===false)values.dailyHackNextCheckAt=null;for(const k of marketKeys)if(Object.hasOwn(value,k))values[k+'SummaryV1']=summarize(value[k])||null;
    await raw.set(Object.fromEntries(Object.entries(values).map(([k,v])=>[prefix+k,v])));return {};
   }
   if(op==='remove'){const keys=typeof value==='string'?[value]:value;if(!Array.isArray(keys)||!keys.every(k=>validKey(k)&&k!==helper))throw Error('CENTER_STORE_KEYS');const all=[...keys,...keys.filter(k=>marketKeys.includes(k)).map(k=>k+'SummaryV1')];await raw.remove(all.map(k=>prefix+k));return {};}
   throw Error('CENTER_STORE_OPERATION');
  },expected);const result=await (op==='get'?writeTail.then(execute,execute):serialize(execute));await verifyChild();return result;
 }
 if(root.Cor3CenterBinding)api.runtime.onMessage.addListener((m,sender,respond)=>{if(m?.type!=='cor3-center-store')return;dispatch(m.op,m.value,sender,m.documentId,m.expectedBinding).then(value=>respond({ok:true,value}),()=>respond({ok:false,code:'CENTER_STORE_UNAVAILABLE'}));return true;});
 async function invoke(op,value){
  if(root.Cor3CenterBinding)return dispatch(op,value);
  const ui=root.Cor3CenterUi,expectedBinding=ui?await ui.pinnedBinding():undefined;
  const r=await api.runtime.sendMessage({type:'cor3-center-store',op,value,documentId:root.Cor3CenterIdentity?.snapshot()?.documentId||root.Cor3Automation?.contentDocumentId,expectedBinding});
  if(ui)await ui.binding();
  if(!r?.ok)throw Error('CENTER_STORE_UNAVAILABLE');
  return r.value;
 }
 function readOnly(op,value){
  const request=invoke(op,value);
  if(root.Cor3CenterBinding)return request;
  let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CENTER_STORE_TIMEOUT')),10000);});
  return Promise.race([request,deadline]).finally(()=>clearTimeout(timer));
 }
 let revision=0;const reads=new Map(),listeners=new Set();
 const copy=value=>value===undefined?value:typeof root.structuredClone==='function'?root.structuredClone(value):JSON.parse(JSON.stringify(value));
 const context=()=>{const s=root.Cor3CenterBinding?.snapshot()||root.Cor3CenterIdentity?.snapshot();return JSON.stringify([s?.id,s?.accountId,s?.documentId,s?.epoch,root.Cor3Automation?.contentDocumentId]);};
 function call(op,value,callback){
  let p;
  if(op==='get'&&(typeof value==='string'||Array.isArray(value)&&value.every(k=>typeof k==='string'))){const key=context()+':'+revision+':'+(typeof value==='string'?'string':'array')+':'+JSON.stringify([...new Set(typeof value==='string'?[value]:value)].sort());let shared=reads.get(key);if(!shared){shared=readOnly(op,value);reads.set(key,shared);shared.finally(()=>{if(reads.get(key)===shared)reads.delete(key);}).catch(()=>{});}p=shared.then(copy);}
  else if(op==='get')p=readOnly(op,value);
  else{++revision;reads.clear();p=invoke(op,value);}
  p.catch(()=>{});if(typeof callback==='function')p.then(callback,()=>callback(op==='get'?{}:undefined)).catch(()=>{});return p;
 }
 // Most subscribers only inspect settings. Clone the large rolling log only for readers.
 function subscriberChanges(mapped){
  if(!Object.hasOwn(mapped,'cor3_console_logs'))return copy(mapped);
  const {cor3_console_logs:history,...other}=mapped;
  const view=copy(other);
  Object.defineProperty(view,'cor3_console_logs',{enumerable:true,configurable:true,get(){
   const value=copy(history);
   Object.defineProperty(view,'cor3_console_logs',{enumerable:true,configurable:true,writable:true,value});
   return value;
  },set(value){Object.defineProperty(view,'cor3_console_logs',{enumerable:true,configurable:true,writable:true,value});}});
  return view;
 }
 const events={addListener(fn){if(typeof fn==='function')listeners.add(fn);},removeListener(fn){listeners.delete(fn);}};
 api.storage.onChanged.addListener(async(changes,area)=>{
  if(area!=='local')return;
  const keys=Object.keys(changes), localScope=root.Cor3CenterBinding?.snapshot()||root.Cor3CenterIdentity?.snapshot();
  if(!keys.some(k=>k===helper||k.startsWith(localScope?.accountId?'center:'+localScope.accountId+':':'center:')))return;
  ++revision;reads.clear();if(Object.keys(changes).some(k=>marketKeys.some(m=>k.endsWith(':'+m)||k.endsWith(':'+m+'SummaryV1')))){++summaryRevision;legacySummaries.clear();}if(!listeners.size)return;
  const stamp=context();let mapped={};
  try{const scope=await readOnly('scope');if(stamp!==context())return;const prefix='center:'+scope.accountId+':';for(const[k,v]of Object.entries(changes))if(k.startsWith(prefix))mapped[k.slice(prefix.length)]=v;else if(k===helper)mapped[k]=v;}
  catch{if(changes[helper])mapped[helper]=changes[helper];}
  if(!Object.keys(mapped).length)return;for(const fn of [...listeners])if(listeners.has(fn))try{fn(subscriberChanges(mapped),'local');}catch{}
 });
 root.Cor3CenterStore=Object.freeze({get:(v,cb)=>call('get',v,cb),set:(v,cb)=>call('set',v,cb),update:(key,patch,cb)=>call('update',{key,patch},cb),remove:(v,cb)=>call('remove',v,cb),appendConsole:v=>call('appendConsole',v),daily:v=>call('daily',v),reconcileJobs:()=>call('reconcileJobs'),onChanged:events});
})(globalThis);





