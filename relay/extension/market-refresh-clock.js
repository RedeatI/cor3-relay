/* Persistent cached deadlines, checked against wall time. No UI countdown is read. */
(function(root){'use strict';
 const key='marketRefreshClockV1',markets={home:'marketData',dark:'darkMarketData',soyuz:'soyuzMarketData',usol:'usolMarketData'};
 const keys=[key,'autoUpdateMarkets',...Object.values(markets).flatMap(k=>[k+'SummaryV1',k+'UpdatedAt'])];
 function plan(data,state={},now=Date.now()){
  state=state||{};const back=Number(state.observedAt)>now+60000,attempt=back?0:Number(state.lastAttemptAt)||0;
  const deadlines=Object.fromEntries(Object.entries(markets).map(([k,v])=>[k,Date.parse((data[v+'SummaryV1']||data[v])?.nextJobsResetAt)]).filter(([,at])=>Number.isFinite(at)));
  const due=Object.entries(deadlines).filter(([,at])=>at+2000<=now).map(([k])=>k);
  const unknown=Object.keys(markets).filter(k=>!Object.hasOwn(deadlines,k));
  const timestamps=Object.values(markets).map(k=>Number(data[k+'UpdatedAt'])).filter(at=>at>0&&at<=now+1000);
  const observed=back?now:Number(state.observedAt)||now;
  const unknownAt=timestamps.length?Math.min(...timestamps)+600000:!back&&Number(state.cacheProbeAt)>0?Number(state.cacheProbeAt):observed+600000;
  let at=Object.values(deadlines).length?Math.min(...Object.values(deadlines).map(n=>n+2000)):unknownAt;
  if(unknown.length)at=Math.min(at,unknownAt);
  const retryAt=attempt?attempt+60000:0;
  at=Math.max(at,retryAt);
  return {due:now>=at,at,cacheProbeAt:unknownAt,deadlines,markets:due.length?due:unknown,reason:back?'clock-backward':due.length?'cached-deadline':unknown.length?'cache-probe':'cached-deadline',lastAttemptAt:attempt,observedAt:now};
 }
 function create({read,write,scope,allowed,busy,enqueue,now=()=>Date.now(),log=()=>{}}={}){
  let flight=null,lastScope=null,lastObservedAt=0,errorLogged=false;
  const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
  async function check(){
   const s=scope();if(!s||!allowed()||busy())return;
   const data=await read(keys);if(!same(s,scope())||!allowed()||busy()||data.autoUpdateMarkets===false)return;
   const at=now(),saved=data[key],remembered=same(lastScope,s)?lastObservedAt:0;
   const p=plan(data,{...saved,observedAt:Math.max(Number(saved?.observedAt)||0,remembered)},at);lastScope={...s};lastObservedAt=at;
   const state={...p,lastAttemptAt:p.due?at:p.lastAttemptAt,nextCheckAt:p.due?Math.max(p.at,at+60000):p.at};
   const signature=value=>JSON.stringify(value?{deadlines:value.deadlines,cacheProbeAt:value.cacheProbeAt,reason:value.reason,lastAttemptAt:value.lastAttemptAt,nextCheckAt:value.nextCheckAt}:null);
   // Stable deadlines need a checkpoint, not a storage write on every 30-second heartbeat.
   if(!saved||p.due||signature(saved)!==signature(state)||at-(Number(saved.observedAt)||0)>=600000)await write(state,s);
   if(!same(s,scope())||!allowed()||busy())return;
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
