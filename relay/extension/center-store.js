/* Account namespaced local cache/preferences; shared code contains no account or key. */
(function(root){'use strict';
 const api=root.chrome||root.browser,raw=api.storage.local;
 const validKey=k=>typeof k==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(k)&&!k.startsWith('center:');
 const privileged=s=>s?.id===api.runtime.id&&['popup.html','devtools-panel.html','devtools-log-viewer.html'].some(p=>s.url===api.runtime.getURL(p)||s.url?.startsWith(api.runtime.getURL(p)+'?'))&&!s.tab?.url?.startsWith('https:');
 let writeTail=Promise.resolve();
 const serialize=fn=>{const next=writeTail.then(fn,fn);writeTail=next.catch(()=>{});return next;};
 const helper='helperMode';
 const enabledDefaults=Object.freeze(['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled','autoUpdateMarkets','autoDailyHackEnabled','autoRunMarketJobsEnabled']);
 const marketKeys=['marketData','darkMarketData','soyuzMarketData','usolMarketData'];
 const summarySources=Object.fromEntries(marketKeys.map(k=>[k+'SummaryV1',k]));
 const summarize=value=>value&&typeof value==='object'?{nextJobsResetAt:typeof value.nextJobsResetAt==='string'?value.nextJobsResetAt:null,jobsCount:Array.isArray(value.jobs)?value.jobs.length:0,recentJobsCount:Array.isArray(value.recentJobs)?value.recentJobs.length:0}:undefined;
 let summaryGeneration=null,summaryRevision=0;const legacySummaries=new Map();
 async function dispatch(op,value,sender,documentId,uiBinding){
  const binding=root.Cor3CenterBinding,internal=sender===undefined,expected=binding.snapshot();
    if(!internal&&privileged(sender)&&!binding.isCurrent(uiBinding))throw Error('CENTER_UI_REOPEN_REQUIRED');
  let child=false;
  if(!internal&&!privileged(sender)){
   const admitted=await binding.admission(sender,documentId);
   if(admitted?.allowed!==true){
    let u;try{u=new URL(sender?.url)}catch{}
    if(!expected||sender?.id!==api.runtime.id||sender.tab?.id!==expected.tabId||!Number.isSafeInteger(sender.frameId)||sender.frameId<=0||!u||u.protocol!=='https:'||u.hostname!=='svc-corie.cor3.gg'||!u.pathname.startsWith('/games/simple-hack')||u.port||u.username||u.password||!/^[a-f0-9]{32}$/.test(documentId))throw Error('CENTER_STORE_UNBOUND');
    const frames=await api.scripting.executeScript({target:{tabId:expected.tabId,frameIds:[sender.frameId]},func:()=>globalThis.Cor3Automation?.contentDocumentId});
    if(frames?.length!==1||frames[0].frameId!==sender.frameId||frames[0].result!==documentId||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
    const keys=typeof value==='string'?[value]:Array.isArray(value)?value:value&&typeof value==='object'?Object.keys(value):[];
    if(op!=='scope'&&(keys.length===0||keys.some(k=>!['autoSimpleDecryptEnabled','simpleDecryptSolverStatus'].includes(k))))throw Error('CENTER_STORE_UNBOUND');
    child=true;
   }
  }
  const b=await binding.resolve();
  if(op==='get'&&value===helper)return raw.get(helper);
  if(!b||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
  if(op==='scope')return {accountId:b.accountId};
  const prefix='center:'+b.accountId+':';
  const verifyChild=async()=>{if(!child)return;const f=await api.scripting.executeScript({target:{tabId:expected.tabId,frameIds:[sender.frameId]},func:()=>globalThis.Cor3Automation?.contentDocumentId});if(f?.length!==1||f[0].frameId!==sender.frameId||f[0].result!==documentId||!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');};
  const execute=()=>binding.guard(b.id,async()=>{await verifyChild();
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
   if(op==='update'){
    if(!value||!validKey(value.key)||value.key===helper||!value.patch||typeof value.patch!=='object'||Array.isArray(value.patch)||Object.keys(value.patch).length>1000)throw Error('CENTER_STORE_KEYS');
    const pk=prefix+value.key,stored=(await raw.get(pk))[pk];
    if(!binding.isCurrent(expected))throw Error('CENTER_STORE_UNBOUND');
    const next={...(stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{}),...value.patch};
    await raw.set({[pk]:next});return next;
   }
   if(op==='set'){
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>1000||!Object.keys(value).every(k=>validKey(k)&&k!==helper))throw Error('CENTER_STORE_KEYS');
    const values={...value};for(const k of marketKeys)if(Object.hasOwn(value,k))values[k+'SummaryV1']=summarize(value[k])||null;
    await raw.set(Object.fromEntries(Object.entries(values).map(([k,v])=>[prefix+k,v])));return {};
   }
   if(op==='remove'){const keys=typeof value==='string'?[value]:value;if(!Array.isArray(keys)||!keys.every(k=>validKey(k)&&k!==helper))throw Error('CENTER_STORE_KEYS');const all=[...keys,...keys.filter(k=>marketKeys.includes(k)).map(k=>k+'SummaryV1')];await raw.remove(all.map(k=>prefix+k));return {};}
   throw Error('CENTER_STORE_OPERATION');
  },expected);const result=await (op==='get'||op==='scope'?writeTail.then(execute,execute):serialize(execute));await verifyChild();return result;
 }
 if(root.Cor3CenterBinding)api.runtime.onMessage.addListener((m,sender,respond)=>{if(m?.type!=='cor3-center-store')return;dispatch(m.op,m.value,sender,m.documentId,m.expectedBinding).then(value=>respond({ok:true,value}),()=>respond({ok:false,code:'CENTER_STORE_UNAVAILABLE'}));return true;});
 async function invoke(op,value){if(root.Cor3CenterBinding)return dispatch(op,value);const expectedBinding=root.Cor3CenterUi?await root.Cor3CenterUi.binding():undefined;const r=await api.runtime.sendMessage({type:'cor3-center-store',op,value,documentId:root.Cor3CenterIdentity?.snapshot()?.documentId||root.Cor3Automation?.contentDocumentId,expectedBinding});if(root.Cor3CenterUi)await root.Cor3CenterUi.binding();if(!r?.ok)throw Error('CENTER_STORE_UNAVAILABLE');return r.value;}
 let revision=0;const reads=new Map(),listeners=new Set();
 const copy=value=>value===undefined?value:typeof root.structuredClone==='function'?root.structuredClone(value):JSON.parse(JSON.stringify(value));
 const context=()=>{const s=root.Cor3CenterBinding?.snapshot()||root.Cor3CenterIdentity?.snapshot();return JSON.stringify([s?.id,s?.accountId,s?.documentId,s?.epoch,root.Cor3Automation?.contentDocumentId]);};
 function call(op,value,callback){
  let p;
  if(op==='get'&&(typeof value==='string'||Array.isArray(value)&&value.every(k=>typeof k==='string'))){const key=context()+':'+revision+':'+(typeof value==='string'?'string':'array')+':'+JSON.stringify([...new Set(typeof value==='string'?[value]:value)].sort());let shared=reads.get(key);if(!shared){shared=invoke(op,value);reads.set(key,shared);shared.finally(()=>{if(reads.get(key)===shared)reads.delete(key);}).catch(()=>{});}p=shared.then(copy);}
  else{if(op!=='get'){++revision;reads.clear();}p=invoke(op,value);}
  p.catch(()=>{});if(typeof callback==='function')p.then(callback,()=>callback(op==='get'?{}:undefined)).catch(()=>{});return p;
 }
 const events={addListener(fn){if(typeof fn==='function')listeners.add(fn);},removeListener(fn){listeners.delete(fn);}};
 api.storage.onChanged.addListener(async(changes,area)=>{
  if(area!=='local')return;++revision;reads.clear();if(Object.keys(changes).some(k=>marketKeys.some(m=>k.endsWith(':'+m)||k.endsWith(':'+m+'SummaryV1')))){++summaryRevision;legacySummaries.clear();}if(!listeners.size)return;
  const keys=Object.keys(changes);if(!keys.some(k=>k===helper||k.startsWith('center:')))return;
  const stamp=context();let mapped={};
  try{const scope=await invoke('scope');if(stamp!==context())return;const prefix='center:'+scope.accountId+':';for(const[k,v]of Object.entries(changes))if(k.startsWith(prefix))mapped[k.slice(prefix.length)]=v;else if(k===helper)mapped[k]=v;}
  catch{if(changes[helper])mapped[helper]=changes[helper];}
  if(!Object.keys(mapped).length)return;for(const fn of [...listeners])if(listeners.has(fn))try{fn(copy(mapped),'local');}catch{}
 });
 root.Cor3CenterStore=Object.freeze({get:(v,cb)=>call('get',v,cb),set:(v,cb)=>call('set',v,cb),update:(key,patch,cb)=>call('update',{key,patch},cb),remove:(v,cb)=>call('remove',v,cb),onChanged:events});
})(globalThis);





