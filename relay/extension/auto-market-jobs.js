/* Account-scoped fresh-market rounds. Reuse the page queue; never refresh from this runner. */
(function(root){'use strict';
 const seenKey='autoMarketJobsSeenV1',flag='autoRunMarketJobsEnabled';
 const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
 const terminal=new Set(['done','failed','skipped','bugged']);
 function freshPools(data,scope,now){
  const pools={};
  for(const [key,m]of Object.entries(root.Cor3JobBatchFactory.markets)){
   const md=data[m.key],p=data.marketReadProofs?.[key],at=data[m.at];
   if(!md||!Array.isArray(md.jobs)||p?.status!=='ok'||p.documentId!==scope.documentId||!Number.isFinite(p.at)||!Number.isFinite(at)||Math.abs(at-p.at)>2000||p.at>now+1000||at>now+1000)continue;
   const ids=[...new Set([...md.jobs,...(md.recentJobs||[])].map(x=>x?.id).filter(x=>typeof x==='string'))].sort();
   pools[key]={reset:String(md.nextJobsResetAt||''),ids,after:Math.min(p.at,at)};
  }
  return pools;
 }
 function changed(previous,pool){return !previous||previous.reset!==pool.reset||pool.ids.some(id=>!previous.ids?.includes(id));}
 function create({scope,check,read,claim,begin,batch,queue,allowed,busy=()=>false,log=()=>{},now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let enabled=false,timer=null,timerAt=null,flight=null,deferredAt=null,generation=0,state=null;
  const update=(s,phase,extra={})=>{const next={scope:s?{...s}:null,phase,...extra};if(state?.phase!==phase||JSON.stringify(state?.markets)!==JSON.stringify(extra.markets))log('market.auto.'+phase,phase,extra);state=next;};
  function arm(at){if(!enabled||timer!==null&&timerAt<=at)return;if(timer!==null)clearTimer(timer);timerAt=at;timer=setTimer(()=>{timer=null;timerAt=null;void tick();},Math.max(0,at-now()));}
  function wake(delay=800){if(!enabled)return;const at=now()+Math.max(0,delay);if(flight){deferredAt=deferredAt===null?at:Math.min(deferredAt,at);return;}arm(at);}
  async function step(gen){
   const s=scope();if(!s||!allowed()){update(s,'waiting-permission');return;}
   const valid=async()=>{if(!enabled||gen!==generation||!same(s,scope())||!allowed())throw Error('PAGE_CHANGED');await check(s);if(!enabled||gen!==generation||!same(s,scope())||!allowed())throw Error('PAGE_CHANGED');};
   const current=batch(s),q=queue();if(q&&!same(q,s))throw Error('PAGE_CHANGED');
   if(['blocked','unconfirmed'].includes(current?.phase)){update(s,'review',{code:current.code});return;}
   if(current&&!['complete','cancelled'].includes(current.phase)||q?.active||q?.queued?.length||q?.blocked||busy()){
    update(s,'waiting',{owner:q?.blocked||q?.active||current?.phase||'minigame'});wake(2000);return;
   }
   await valid();const data=await read([...root.Cor3JobBatchFactory.keys,flag,seenKey]);await valid();
   if(data[flag]===false){update(s,'off');return;}
   if(data.autoFinishAllJobsEnabled===true){update(s,'legacy-loop');return;}
   const latest=batch(s),latestQueue=queue();if(latestQueue&&!same(latestQueue,s))throw Error('PAGE_CHANGED');
   if(latest&&!['complete','cancelled'].includes(latest.phase)||data.autoJobsRunning===true||latestQueue?.active||latestQueue?.queued?.length||latestQueue?.blocked||busy()){
    update(s,'waiting',{owner:latestQueue?.blocked||latestQueue?.active||latest?.phase||'minigame'});wake(2000);return;
   }
   const all=freshPools(data,s,now()),seen=data[seenKey]||{},pools=Object.fromEntries(Object.entries(all).filter(([k,p])=>changed(seen[k],p)));
   const markets=Object.keys(pools);if(!markets.length){update(s,'idle');return;}
   const after=Math.min(...Object.values(pools).map(p=>p.after));
   const attempted=new Set([...(data.autoJobsCompletedResults||[]),...(data.autoJobsTracker||[])].filter(x=>terminal.has(x.status)).map(x=>x.jobId));
   const jobIds=root.Cor3JobBatchFactory.collect(data,data.autoFinishAllJobTypes,after,now(),s.documentId).jobs.filter(j=>markets.includes(j.marketKey)&&!attempted.has(j.jobId)).map(j=>j.jobId);
   const patch=Object.fromEntries(Object.entries(pools).map(([k,p])=>[k,{reset:p.reset,ids:[...new Set([...(seen[k]?.reset===p.reset?seen[k].ids||[]:[]),...p.ids])],at:now()}]));
   // Claim before admission. A lost start acknowledgement must not replay the same pool after reload.
   await valid();await claim(patch,s);await valid();
   const verified=await read([seenKey,flag]);await valid();
   if(!markets.every(k=>verified[seenKey]?.[k]?.reset===patch[k].reset&&patch[k].ids.every(id=>verified[seenKey]?.[k]?.ids?.includes(id))))throw Error('PAGE_SAVE_UNCONFIRMED');
   if(verified[flag]===false){await claim(Object.fromEntries(markets.map(k=>[k,seen[k]||null])),s);await valid();update(s,'off');return;}
   if(!jobIds.length){update(s,'empty',{markets});return;}
   update(s,'admitting',{markets,count:jobIds.length});
   try{const result=await begin(s,{markets,after,jobIds});await valid();update(s,'submitted',{markets,count:jobIds.length,batchId:result.id});}
   catch(e){
    // Only explicit pre-admission refusals are retryable. Unknown outcomes keep the claim.
    if(['PAGE_JOB_BATCH_RUNNING','PAGE_JOB_ALREADY_RUNNING'].includes(e.code||e.message)){
     await valid();await claim(Object.fromEntries(markets.map(k=>[k,seen[k]||null])),s);update(s,'waiting',{owner:'auto-jobs'});wake(2000);return;
    }
    throw e;
   }
  }
  async function tick(){if(!enabled)return;if(flight){wake();return flight;}if(timer!==null){clearTimer(timer);timer=null;timerAt=null;}const gen=generation;
   flight=step(gen).catch(e=>{if(gen===generation&&enabled)update(scope(),e.message==='PAGE_CHANGED'?'waiting-permission':'review',{code:e.code||e.message||'PAGE_JOB_START_UNCONFIRMED'});});
   try{await flight;}finally{flight=null;if(deferredAt!==null&&enabled){const at=deferredAt;deferredAt=null;arm(at);}}
  }
  return Object.freeze({start(){if(!enabled){enabled=true;++generation;}wake();},stop(){enabled=false;++generation;deferredAt=null;if(timer!==null)clearTimer(timer);timer=null;timerAt=null;},wake,tick,status:()=>state?JSON.parse(JSON.stringify(state)):null});
 }
 root.Cor3AutoMarketFactory=Object.freeze({create,freshPools,changed,seenKey,flag});
})(globalThis);
