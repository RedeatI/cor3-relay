/* Isolated-world page controls. No MAIN-world command bridge or credential projection. */
(function(root){'use strict';
 const KEYS=Object.freeze(['autoRunMarketJobsEnabled','helperMode','autoUpdateMarkets','autoDailyHackEnabled','autoSendMerc','autoDrone','loadoutData','loadoutUpdatedAt','loadoutError','mercenariesData','mercenariesUpdatedAt','usolMercenariesData','usolMercenariesUpdatedAt','expeditionConfigData','usolExpeditionConfigData','expeditionsData','expeditionsDataUpdatedAt','droneData','droneDataUpdatedAt','droneOptionsReadError','marketDataUpdatedAt','darkMarketDataUpdatedAt','soyuzMarketDataUpdatedAt','usolMarketDataUpdatedAt','dailyOpsData','dailyOpsUpdatedAt','networkRuntimeStatus','automationRunLogs','autoJobsTrackerUpdatedAt','autoFinishAllJobTypes','autoJobsTracker',...Object.values(root.Cor3JobBatchFactory?.markets||{}).map(m=>m.key+'SummaryV1')]);
 const REFRESH=Object.freeze({markets:['refreshAllMarketsSeq'],loadout:['requestLoadout'],expeditions:['requestExpeditions','requestMercenaries','requestUsolMercenaries','requestExpeditionConfig'],drone:['requestDroneOptions'],daily:['fetchDailyOps']});
 const error=code=>Object.assign(Error(code),{code});
 const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
 const clean=x=>String(x??'').slice(0,160),id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(x);
 function mercList(raw){if(!Array.isArray(raw)&&!Array.isArray(raw?.mercenaries))return null;const list=Array.isArray(raw)?raw:raw.mercenaries;return [...new Map([...list,...(Array.isArray(raw?.eliteSlots)?raw.eliteSlots.map(x=>x?.mercenary):[])].filter(x=>x?.id).map(x=>[x.id,x])).values()];}
 function items(data,kind){
  if(kind==='hardware'){const all=[...Object.values(data?.equippedHardware||{}),...(Array.isArray(data?.ownedHardware)?data.ownedHardware:[])].filter(x=>x?.id);return [...new Map(all.map(x=>[x.id,x])).values()];}
  const installed=Array.isArray(data?.equippedSoftware)?data.equippedSoftware:[],owned=Array.isArray(data?.ownedSoftware)?data.ownedSoftware:[],ids=new Set(installed.map(x=>x.id));
  return [...installed.map(x=>({...x,installed:true})),...owned.filter(x=>!ids.has(x.id)).map(x=>({...x,installed:false}))];
 }
 function equipped(data,kind,moduleId){if(kind==='hardware')return Object.values(data?.equippedHardware||{}).some(x=>x?.id===moduleId);const entry=items(data,'software').find(x=>x?.id===moduleId);return !!entry?.installed;}
 function create({identity=root.Cor3CenterIdentity,admit,store=root.Cor3CenterStore,allowed=()=>root.Cor3Automation?.allowed()===true,dispatch,enqueue,queue=()=>root.Cor3NetworkRuntime?.snapshot(),version='2.1.0',now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),observeMs=15000}={}){
  let lastOperation=null,sequence=0,pending=null,readSequence=0,autoBatch=null,autoFlight=null;
  let heavyView=null,visualRevision=0;
  const heavyKeys=['loadoutData','mercenariesData','usolMercenariesData','expeditionConfigData','usolExpeditionConfigData','droneData','dailyOpsData','expeditionsData'];
  const stampKeys=['loadoutUpdatedAt','mercenariesUpdatedAt','usolMercenariesUpdatedAt','droneDataUpdatedAt','dailyOpsUpdatedAt','expeditionsDataUpdatedAt'];
  const lightKeys=KEYS.filter(k=>!heavyKeys.includes(k)),canObserve=typeof store.onChanged?.addListener==='function';
  store.onChanged?.addListener(changes=>{if([...heavyKeys,...stampKeys].some(k=>Object.hasOwn(changes,k))){++visualRevision;heavyView=null;}});
  async function viewData(scope){const light=await store.get(lightKeys);await check(scope);const stamp=JSON.stringify(stampKeys.map(k=>light[k]));if(canObserve&&heavyView&&same(heavyView.scope,scope)&&heavyView.stamp===stamp&&heavyView.revision===visualRevision)return {...light,...heavyView.values};const revision=visualRevision,values=await store.get(heavyKeys);await check(scope);if(canObserve&&revision===visualRevision)heavyView={scope:{...scope},stamp,revision,values};return {...light,...values};}
  const autoAttempts=new Map(),autoKinds=['loadout','expeditions','drone','daily','markets'];
  const jobBatch=root.Cor3JobBatchFactory?.create({check:s=>check(s,true),read:k=>store.get(k),send,queue,now,sleep,busy:()=>root.Cor3PageBusy?.()===true});
  const autoMarket=root.Cor3AutoMarketFactory?.create({scope:()=>identity?.snapshot(),check:s=>check(s,true),read:k=>store.get(k),claim:async(p,s)=>{await check(s,true);await store.update('autoMarketJobsSeenV1',p);await check(s,true);},begin:(s,f)=>jobBatch.beginAfterRefresh(s,f),batch:s=>jobBatch.status(s),queue,allowed,busy:()=>root.Cor3PageBusy?.()===true,now,log:(code,_phase,info)=>root.Cor3RuntimeLog?.log(code,'自动市场任务：'+({idle:'等待任一市场新任务',off:'已关闭',waiting:'等待当前限时操作或队列',submitted:'本轮已加入队列',empty:'新任务池没有待执行任务',review:'结果待核对',admitting:'正在加入队列','legacy-loop':'已有连续自动任务，未重复启动','waiting-permission':'等待当前页面许可'}[_phase]||_phase),info)});
  const autoMarketWatchKeys=new Set([...(root.Cor3JobBatchFactory?.keys||[]),'autoRunMarketJobsEnabled']);
  store.onChanged?.addListener(changes=>{if(Object.keys(changes).some(k=>autoMarketWatchKeys.has(k)))autoMarket?.wake();});
  jobBatch?.subscribe(()=>autoMarket?.wake());
  async function saveAutoMarket(enabled,selection,expected){const scope=await check(expected,true);if(typeof enabled!=='boolean'||!Array.isArray(selection)||selection.some(x=>!root.Cor3JobBatchFactory.types.includes(x)))throw error('PAGE_SETTING_INVALID');const types=root.Cor3JobBatchFactory.resolveTypes(selection);if(enabled&&!types.length)throw error('PAGE_JOB_TYPES_EMPTY');await store.set({autoRunMarketJobsEnabled:enabled,autoFinishAllJobTypes:types});await check(scope,true);const data=await store.get(['autoRunMarketJobsEnabled','autoFinishAllJobTypes']);await check(scope,true);if(data.autoRunMarketJobsEnabled!==enabled||JSON.stringify(data.autoFinishAllJobTypes)!==JSON.stringify(types))throw error('PAGE_SAVE_UNCONFIRMED');autoMarket?.wake();return {phase:'saved'};}
  const freshAt=(value,at)=>Number.isFinite(value)&&value>0&&value<=at+1000&&at-value<30000;
  function freshData(kind,data,at){
   if(kind==='loadout')return !!data.loadoutData&&!data.loadoutError&&freshAt(data.loadoutUpdatedAt,at);
   if(kind==='expeditions')return Array.isArray(data.expeditionsData)&&mercList(data.mercenariesData)!==null&&mercList(data.usolMercenariesData)!==null&&!!data.expeditionConfigData&&freshAt(data.expeditionsDataUpdatedAt,at);
   if(kind==='drone')return data.droneData!=null&&Object.hasOwn(data.droneData,'drone')&&freshAt(data.droneDataUpdatedAt,at);
   if(kind==='daily')return data.dailyOpsData!=null&&freshAt(data.dailyOpsUpdatedAt,at);
   return ['marketDataUpdatedAt','darkMarketDataUpdatedAt','soyuzMarketDataUpdatedAt','usolMarketDataUpdatedAt'].every(k=>freshAt(data[k],at));
  }
  async function autoReadStep(expected,session,retryKinds){
   const local=identity?.snapshot(),localQueue=queue();
   if(local&&allowed()&&(!expected||same(expected,local))&&localQueue&&same(localQueue,local)&&(localQueue.active||localQueue.queued?.length||localQueue.blocked)){for(const item of autoAttempts.values())if(same(item.scope,local)&&!item.done)item.waitAt=now();return {phase:'waiting',owner:clean(localQueue.blocked||localQueue.active||'queue')};}
   const scope=await check(expected,true);
   if(!autoBatch||autoBatch.session!==session||!same(autoBatch.scope,scope))autoBatch={scope,session,remaining:Array.isArray(retryKinds)?autoKinds.filter(k=>retryKinds.includes(k)):[...autoKinds],failed:[]};
   const live=queue();if(live&&!same(live,scope))throw error('PAGE_CHANGED');if(live&&(live.active||live.queued?.length||live.blocked)){for(const item of autoAttempts.values())if(same(item.scope,scope)&&!item.done)item.waitAt=now();return {phase:'waiting',owner:clean(live.blocked||live.active||'queue')};}
   const batch=autoBatch,data=await viewData(scope);await check(scope,true);const at=now();batch.failed=batch.failed.filter(kind=>!freshData(kind,data,at));
   batch.remaining=batch.remaining.filter(kind=>{if(!freshData(kind,data,at))return true;const previous=autoAttempts.get(kind);if(previous&&same(previous.scope,scope))previous.done=true;return false;});
   while(batch.remaining.length){const kind=batch.remaining[0],previous=autoAttempts.get(kind);
    const net=queue();if(net&&!same(net,scope))throw error('PAGE_CHANGED');
    if(net&&(net.active||net.queued?.length||net.blocked)){if(previous&&same(previous.scope,scope)&&!previous.done)previous.waitAt=at;return {phase:'waiting',owner:clean(net.active||net.blocked||'queue')};}
    if(previous&&same(previous.scope,scope)&&(!previous.done||at-previous.at<30000)){
     if(!previous.done&&at-previous.waitAt<15000)return {phase:'loading',kind};
     previous.done=true;batch.failed.push(kind);batch.remaining.shift();continue;
    }
    autoAttempts.set(kind,{scope,at,waitAt:at,done:false});
    try{await refresh(kind,scope);}catch(e){if(!same(identity.snapshot(),scope)||!allowed())throw e;batch.failed.push(kind);batch.remaining.shift();return {phase:'loading',kind:batch.remaining[0]||kind};}
    return {phase:'loading',kind};
   }
   return {phase:batch.failed.length?'partial':'complete',failed:[...new Set(batch.failed)]};
  }
  function autoRead(expected,session=0,retryKinds=null){
   if(autoFlight)return autoFlight;
   const flight=autoReadStep(expected,session,retryKinds);autoFlight=flight;
   return flight.finally(()=>{if(autoFlight===flight)autoFlight=null;});
  }
  async function check(expected,write=false){const local=identity?.snapshot();if(!local||!/^FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}$/.test(local.accountId)||!local.documentId)throw error('PAGE_ACCOUNT_UNAVAILABLE');if(expected&&!same(expected,local))throw error('PAGE_CHANGED');
   let proof;try{proof=await admit(local.documentId);}catch{throw error('PAGE_BINDING_UNAVAILABLE');}const after=identity.snapshot();if(after&&!same(local,after))throw error('PAGE_CHANGED');if(proof?.allowed!==true||!same(local,after)||!same(local,proof.snapshot))throw error('PAGE_BINDING_UNAVAILABLE');if(write&&!allowed())throw error('PAGE_AUTOMATION_PAUSED');return Object.freeze({accountId:local.accountId,documentId:local.documentId});
  }
  async function read(expected){const serial=++readSequence,scope=await check(expected);const data=await viewData(scope);await check(scope);if(serial!==readSequence)throw error('PAGE_READ_SUPERSEDED');
   if(pending&&same(pending.scope,scope))await reconcile(data);
   const own=x=>same(x,scope),live=queue(),net=own(live)?live:own(data.networkRuntimeStatus)?data.networkRuntimeStatus:null;
   const loadout=data.loadoutData;const hardware=items(loadout,'hardware').map(x=>({id:clean(x.id),name:clean(x.name),category:clean(x.category),installed:equipped(loadout,'hardware',x.id)}));
   const software=items(loadout,'software').map(x=>({id:clean(x.id),name:clean(x.name),installed:x.installed===true}));
   const logs=own(data.automationRunLogs)&&Array.isArray(data.automationRunLogs.entries)?data.automationRunLogs.entries.slice(-10).map(x=>({at:Number(x.at)||0,code:clean(x.code),message:root.Cor3RunLog?.text(x.message).slice(0,240)||clean(x.message)})):[];
   const coreMercs=mercList(data.mercenariesData),usolMercs=mercList(data.usolMercenariesData),mercs=[...(coreMercs||[]),...(usolMercs||[])];
   const locations=[data.expeditionConfigData,data.usolExpeditionConfigData].flatMap(x=>Array.isArray(x?.locations)?x.locations:[]);
   const project=(x,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(x||{},k)).map(k=>[k,x[k]]));
   const merc=project(data.autoSendMerc,['enabled','autoClaim','autoDecide','autoChooseUsolFirst','autoChooseMerc','applyMercCostLimiter','pauseBelowCredits','maxMercCost','minCredits','mercenaryId','locationConfigId']);
   const drone=project(data.autoDrone,['enabled','paused','autoClaim','autoDecide','autoChooseLocation','fullChargeOnly']);
   const droneError=data.droneOptionsReadError?.documentId===scope.documentId&&Number(data.droneOptionsReadError.at)>=Number(data.droneDataUpdatedAt||0)?clean(data.droneOptionsReadError.code):null;
   const readStatus={coreMercenaries:coreMercs===null?'unread':coreMercs.length?'ready':'empty',usolMercenaries:usolMercs===null?'unread':usolMercs.length?'ready':'empty',drone:droneError?'error':data.droneData?.drone?'ready':data.droneData&&Object.hasOwn(data.droneData,'drone')&&data.droneData.drone===null?'none':'unread',droneError};
   const retainedSettings={merc:project(data.autoSendMerc,['hasInsurance','applyMercCostLimiter','pauseBelowCredits','maxMercCost','minCredits']),drone:project(data.autoDrone,['repairEnabled','pauseOnRepairFail'])};
   return {scope,version,jobs:root.Cor3JobBatchFactory?{autoEnabled:data.autoRunMarketJobsEnabled!==false,autoStatus:autoMarket?.status()||null,types:root.Cor3JobBatchFactory.resolveTypes(data.autoFinishAllJobTypes),batch:jobBatch.status(scope),recent:{at:Number(data.autoJobsTrackerUpdatedAt)||null,rows:(Array.isArray(data.autoJobsTracker)?data.autoJobsTracker:[]).slice(-50).map(x=>({jobId:clean(x.jobId),name:root.Cor3RunLog?.text(x.name||x.type||'').slice(0,100)||'',status:['pending','running','done','failed','skipped','bugged'].includes(x.status)?x.status:'unknown',error:root.Cor3RunLog?.text(x.error||'').slice(0,320)||''}))},resets:Object.fromEntries(Object.entries(root.Cor3JobBatchFactory.markets).map(([k,m])=>[k,(data[m.key+'SummaryV1']||data[m.key])?.nextJobsResetAt||null]))}:null,readStatus,retainedSettings,allowed:allowed(),helperMode:data.helperMode===true,defaults:{markets:data.autoUpdateMarkets,daily:data.autoDailyHackEnabled},merc,drone,droneAvailable:!!data.droneData?.drone,loadout:{available:!!loadout,at:Number(data.loadoutUpdatedAt)||null,hardware,software,equippedHardware:Object.entries(loadout?.equippedHardware||{}).map(([category,x])=>({category:clean(category),name:clean(x?.name)}))},mercenaries:mercs.map(x=>({id:clean(x.id),name:clean(x.callsign||x.name)})),locations:locations.map(x=>({id:clean(x.id),name:clean(x.name)})),queue:net?{active:clean(net.active),queued:Array.isArray(net.queued)?net.queued.map(clean):[],blocked:clean(net.blocked),owner:clean(net.lease?.owner)}:null,logs,operation:same(lastOperation,scope)?{...lastOperation}:null,cache:Object.fromEntries(['marketDataUpdatedAt','darkMarketDataUpdatedAt','soyuzMarketDataUpdatedAt','usolMarketDataUpdatedAt','expeditionsDataUpdatedAt','droneDataUpdatedAt','dailyOpsUpdatedAt'].map(k=>[k,Number.isFinite(data[k])?data[k]:null]))};
  }
  async function send(action,scope,extra={}){await check(scope,true);const result=await dispatch({action,...extra,centerIdentityDocumentId:scope.documentId});await check(scope,true);if(!result||result.success===false||result.ok===false||result.error)throw error('PAGE_ACTION_REJECTED');return result;}
  async function refresh(kind,expected){if(!Object.hasOwn(REFRESH,kind))throw error('PAGE_ACTION_UNSUPPORTED');const scope=await check(expected,true),responses=[];for(const action of REFRESH[kind])responses.push(await send(action,scope));return {phase:responses.some(x=>x.queued==='queued'||x.queued==='already-queued')?'queued':'requested'};}
  function bools(input,keys){const out={};for(const k of keys)if(Object.hasOwn(input,k)){if(typeof input[k]!=='boolean')throw error('PAGE_SETTING_INVALID');out[k]=input[k];}return out;}
  function amount(value){if(!Number.isSafeInteger(value)||value<0||value>999999999)throw error('PAGE_BUDGET_INVALID');return value;}
  async function save(kind,input,expected){if(!input||typeof input!=='object'||Array.isArray(input))throw error('PAGE_SETTING_INVALID');const scope=await check(expected,true),key=kind==='merc'?'autoSendMerc':kind==='drone'?'autoDrone':null;if(!key)throw error('PAGE_SETTING_INVALID');
   const raw=await store.get([key,'droneData','mercenariesData','usolMercenariesData','expeditionConfigData','usolExpeditionConfigData']);await check(scope,true);
   const keys=kind==='merc'?['enabled','autoClaim','autoDecide','autoChooseUsolFirst','autoChooseMerc','applyMercCostLimiter','pauseBelowCredits','maxMercCost','minCredits','mercenaryId','locationConfigId']:['enabled','paused','autoClaim','autoDecide','autoChooseLocation','fullChargeOnly'];
   if(Object.keys(input).some(k=>!keys.includes(k)))throw error('PAGE_SETTING_UNSUPPORTED');
   const patch=bools(input,kind==='merc'?keys.filter(k=>!['maxMercCost','minCredits','mercenaryId','locationConfigId'].includes(k)):keys);
   if(kind==='merc'){
    for(const k of ['maxMercCost','minCredits'])if(Object.hasOwn(input,k)){patch[k]=amount(input[k]);if(k==='maxMercCost'&&patch[k]>999999)throw error('PAGE_BUDGET_INVALID');}
    const mercs=[...(mercList(raw.mercenariesData)||[]),...(mercList(raw.usolMercenariesData)||[])];
    const locations=[raw.expeditionConfigData,raw.usolExpeditionConfigData].flatMap(x=>x?.locations||[]);
    for(const [k,list]of [['mercenaryId',mercs],['locationConfigId',locations]])if(Object.hasOwn(input,k)){const value=input[k];if(value!==null&&(!id(value)||!list.some(x=>x.id===value)))throw error('PAGE_SELECTION_UNAVAILABLE');patch[k]=value;}
    if(patch.mercenaryId===null)patch.mercenaryName='';
    const next={...(raw[key]||{}),...patch};if(next.enabled&&(!next.applyMercCostLimiter||!next.pauseBelowCredits||!Number.isSafeInteger(next.maxMercCost)||!Number.isSafeInteger(next.minCredits)))throw error('PAGE_BUDGET_REQUIRED');
   }else if(patch.enabled&&!raw.droneData?.drone)throw error('PAGE_DRONE_UNAVAILABLE');
   await check(scope,true);await store.update(key,patch);await check(scope,true);const saved=(await store.get(key))[key];await check(scope,true);if(!Object.entries(patch).every(([k,v])=>saved?.[k]===v))throw error('PAGE_SAVE_UNCONFIRMED');return {phase:'saved'};
  }
  async function operation(scope,id,phase,details){if(!same(identity.snapshot(),scope))return;lastOperation={...scope,id,phase,at:now(),details};await store.set({inPageOperationState:{...lastOperation}}).catch(()=>{});}
  function matches(data,intent){return equipped(data.loadoutData,intent.kind,intent.moduleId)===intent.install;}
  async function reconcile(data){if(!pending||!pending.task.valid())return;const p=pending;if(Number(data.loadoutUpdatedAt)<p.sentAt)return;
   if(data.loadoutError){pending=null;await operation(p.scope,p.id,'failed','游戏返回配装错误');p.task.finish();}
   else if(matches(data,p)){pending=null;await operation(p.scope,p.id,'observed','游戏配装已确认');p.task.finish();}
  }
  async function equip(kind,moduleId,install,expected){if(!['hardware','software'].includes(kind)||!id(moduleId)||typeof install!=='boolean'||(kind==='hardware'&&!install))throw error('PAGE_EQUIPMENT_INVALID');const scope=await check(expected,true),opId=String(++sequence);
   if(pending?.task.valid())throw error('PAGE_EQUIPMENT_PENDING');
   const snapshot=await store.get('loadoutData');await check(scope,true);if(!items(snapshot.loadoutData,kind).some(x=>x.id===moduleId))throw error('PAGE_EQUIPMENT_NOT_OWNED');
   await operation(scope,opId,'queued','配装操作已排队');
   const outcome=enqueue('page-equip',async task=>{
    let submitted=false;try{
     await check(scope,true);if(!task.valid())return;
     const started=now(),before=await store.get(['loadoutUpdatedAt','loadoutData']);await send('requestLoadout',scope);
     let fresh=null;while(task.valid()&&now()-started<observeMs){await check(scope,true);const data=await store.get(['loadoutData','loadoutUpdatedAt','loadoutError']);if(data.loadoutUpdatedAt>Number(before.loadoutUpdatedAt||0)&&data.loadoutUpdatedAt>=started){fresh=data;break;}await sleep(400);}
     if(!task.valid())return;if(!fresh||fresh.loadoutError)throw error('PAGE_LOADOUT_UNAVAILABLE');
     if(!items(fresh.loadoutData,kind).some(x=>x.id===moduleId))throw error('PAGE_EQUIPMENT_NOT_OWNED');
     if(equipped(fresh.loadoutData,kind,moduleId)===install){await operation(scope,opId,'observed','当前配装已满足选择');task.finish();return;}
     const action=kind==='hardware'?'equipHardware':install?'equipSoftware':'unequipSoftware';
     const sentAt=now();submitted=true;pending={scope,id:opId,task,kind,moduleId,install,sentAt};await send(action,scope,{moduleConfigId:moduleId});await operation(scope,opId,'requested','配装请求已发出，等待游戏确认');await send('requestLoadout',scope);
     const until=now()+observeMs;while(task.valid()&&pending?.id===opId&&now()<until){await check(scope,true);await reconcile(await store.get(['loadoutData','loadoutUpdatedAt','loadoutError']));if(pending?.id!==opId)return;await sleep(400);}
     if(task.valid()&&pending?.id===opId){await operation(scope,opId,'unconfirmed','配装结果未确认，保留端点占用；读取配装后再次核对');task.fail('equipment-unconfirmed');}
    }catch(e){if(!task.valid())return;await operation(scope,opId,submitted?'unconfirmed':'failed',submitted?'配装结果未确认，端点仍被占用':e.code||'PAGE_ACTION_FAILED');if(submitted)task.fail('equipment-unconfirmed');else task.finish();}
   });
   if(outcome==='master-paused')throw error('PAGE_AUTOMATION_PAUSED');if(outcome==='already-running'||outcome==='already-queued')throw error('PAGE_EQUIPMENT_PENDING');return {phase:outcome==='started'?'requested':'queued',id:opId};
  }
  return Object.freeze({read,refresh,autoRead,equip,saveAutoMarket,startAutoMarket:()=>autoMarket?.start(),stopAutoMarket:()=>autoMarket?.stop(),onJobsState:fn=>{const off=jobBatch?.subscribe(fn),offQueue=root.Cor3NetworkRuntime?.subscribe?.(()=>jobBatch?.publish());return()=>{off?.();offQueue?.();};},runJobs:(selection,scope)=>{if(!jobBatch)throw error('PAGE_JOB_UNAVAILABLE');return jobBatch.begin(scope,selection);},stopJobs:scope=>{if(!jobBatch)throw error('PAGE_JOB_UNAVAILABLE');return jobBatch.stop(scope);},saveMerc:(x,s)=>save('merc',x,s),saveDrone:(x,s)=>save('drone',x,s)});
 }
 root.Cor3InPageControlsFactory=Object.freeze({create,keys:KEYS});
})(globalThis);
