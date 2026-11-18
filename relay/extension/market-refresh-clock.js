/* Persistent cached deadlines, checked against wall time. No UI countdown is read. */
(function(root){'use strict';
 const key='marketRefreshClockV1',markets={home:'marketData',dark:'darkMarketData',soyuz:'soyuzMarketData',usol:'usolMarketData'};
 const keys=[key,'autoUpdateMarkets',...Object.values(markets).flatMap(k=>[k+'SummaryV1',k+'UpdatedAt'])];
 const firstRetryMs=60000,maxRetryMs=900000,maxAttempts=5;
 function plan(data,state={},now=Date.now()){
  state=state||{};const back=Number(state.observedAt)>now+60000,attempt=back?0:Number(state.lastAttemptAt)||0;
  const deadlines=Object.fromEntries(Object.entries(markets).map(([k,v])=>[k,Date.parse((data[v+'SummaryV1']||data[v])?.nextJobsResetAt)]).filter(([,at])=>Number.isFinite(at)));
  const timestamps=Object.values(markets).map(k=>Number(data[k+'UpdatedAt'])).filter(at=>at>0&&at<=now+1000);
  const observed=back?now:Number(state.observedAt)||now;
  const unknownAt=timestamps.length?Math.min(...timestamps)+600000:!back&&Number(state.cacheProbeAt)>0?Number(state.cacheProbeAt):observed+600000;
  const retryByMarket={},due=[];
  // Older saved clocks carried one cooldown. Import its remaining minute once.
  const legacyRetryAt=!state.retryByMarket&&attempt?attempt+firstRetryMs:0;
  let at=Infinity;
  for(const name of Object.keys(markets)){
   const deadline=deadlines[name]??null,previous=back?null:state.retryByMarket?.[name],target=deadline===null?unknownAt:deadline+2000;
   if(previous?.deadline===deadline&&Number.isSafeInteger(previous.count)&&previous.count>0&&previous.count<=maxAttempts&&Number.isFinite(previous.nextAt))retryByMarket[name]=previous;
   else if(legacyRetryAt>now&&target<=attempt)retryByMarket[name]={deadline,count:1,nextAt:legacyRetryAt};
   const next=Math.max(target,retryByMarket[name]?.nextAt||0);
   at=Math.min(at,next);
   if(next<=now)due.push(name);
  }
  const unknown=Object.keys(deadlines).length<Object.keys(markets).length;
  const reason=back?'clock-backward':unknown&&!due.some(name=>deadlines[name]!==undefined)?'cache-probe':'cached-deadline';
  return {due:due.length>0,at,cacheProbeAt:unknownAt,deadlines,markets:due,reason,lastAttemptAt:attempt,observedAt:now,retryByMarket};
 }
 function create({read,write,scope,allowed,busy,enqueue,now=()=>Date.now(),log=()=>{}}={}){
  let flight=null,lastScope=null,lastObservedAt=0,errorLogged=false;
  const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
  async function check(){
   const s=scope();if(!s||!allowed()||busy())return;
   const data=await read(keys);if(!same(s,scope())||!allowed()||busy()||data.autoUpdateMarkets===false)return;
   const at=now(),saved=data[key],remembered=same(lastScope,s)?lastObservedAt:0;
   const p=plan(data,{...saved,observedAt:Math.max(Number(saved?.observedAt)||0,remembered)},at);lastScope={...s};lastObservedAt=at;
   const retryByMarket={...p.retryByMarket};
   for(const name of p.markets){
    const count=Math.min((retryByMarket[name]?.count||0)+1,maxAttempts);
    retryByMarket[name]={deadline:p.deadlines[name]??null,count,nextAt:at+Math.min(maxRetryMs,firstRetryMs*2**(count-1))};
   }
   const state={...p,lastAttemptAt:p.due?at:p.lastAttemptAt,retryByMarket};
   state.nextCheckAt=p.due?plan(data,state,at).at:p.at;
   const signature=value=>JSON.stringify(value?{deadlines:value.deadlines,cacheProbeAt:value.cacheProbeAt,lastAttemptAt:value.lastAttemptAt,nextCheckAt:value.nextCheckAt,retryByMarket:value.retryByMarket}:null);
   // Stable deadlines need a checkpoint, not a storage write on every 30-second heartbeat.
   if(!saved||p.due||signature(saved)!==signature(state)||at-(Number(saved.observedAt)||0)>=600000)await write(state,s);
   if(!same(s,scope())||!allowed())return;
   if(busy()){if(p.due)await write({...p,nextCheckAt:p.at},s);return;}
   if(!p.due)return;
   log('market.clock.due','缓存市场截止时间已到，按系统时间补查',{markets:p.markets,reason:p.reason});
   // Queue admission is synchronous; a queued refresh has its own unknown-receipt lease.
   return enqueue({markets:p.markets,reason:p.reason,at});
  }
  function tick(){if(flight)return flight;flight=check().then(()=>{errorLogged=false;},()=>{if(!errorLogged){errorLogged=true;log('market.clock.error','缓存计时未确认，本次未刷新',null,'warn');}}).finally(()=>{flight=null;});return flight;}
  return Object.freeze({tick});
 }
 root.Cor3MarketClockFactory=Object.freeze({create,plan,key,keys});
})(globalThis);
