/* One scoped batch at a time, then hand control back. Fresh-market rounds never refresh again. */
(function(root){'use strict';
 const types=Object.freeze(['Data Download','Data Upload','Decrypt & Extract','File Decryption','File Elimination','IP Cleanup','IP Injection','Log Deletion','Log Download']);
 const markets=Object.freeze({home:{id:'019d3ea4-85bd-7389-904d-8f7c85841134',key:'marketData',at:'marketDataUpdatedAt'},dark:{id:'019d3ea4-85bd-7389-904d-908ba9194aa0',key:'darkMarketData',at:'darkMarketDataUpdatedAt'},soyuz:{id:'019da731-2db5-7d76-9447-1ea3b9b78001',key:'soyuzMarketData',at:'soyuzMarketDataUpdatedAt'},usol:{id:'019e4065-6ae8-760d-8724-58ab4f2cf7d7',key:'usolMarketData',at:'usolMarketDataUpdatedAt'}});
 const keys=Object.freeze([...Object.values(markets).flatMap(m=>[m.key,m.at]),'marketReadProofs','_allMarketsRefreshed','autoJobsRunning','autoJobsTracker','autoJobsCompletedResults','autoFinishAllJobsEnabled','autoFinishAllJobTypes','autoJobsLockedJobs','autoRunMarketJobsEnabled']);
 const monitorKeys=Object.freeze(['autoJobsRunning','autoJobsTracker','autoJobsTrackerUpdatedAt']);
 const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
 const error=code=>Object.assign(Error(code),{code});
 const resolveTypes=value=>Array.isArray(value)?types.filter(x=>value.includes(x)):[...types];
 function verifiedJobsAt(market,cacheAt,proof,documentId,now){
  if(!market||!Array.isArray(market.jobs)||proof?.documentId!==documentId||proof?.status!=='ok'||
     !Number.isFinite(proof.at)||proof.at>now+1000)return null;
  // The jobs reply and its receipt share an ID. Later options or lot updates
  // keep that ID, even though their generic cache timestamp changes.
  if(proof.jobsReadId!==undefined||market.relayJobsReadId!==undefined)
   return Number.isSafeInteger(proof.jobsReadId)&&proof.jobsReadId>0&&proof.jobsReadId===market.relayJobsReadId?proof.at:null;
  // Older cached receipts have no ID. Preserve the narrow timestamp check.
  return Number.isFinite(cacheAt)&&cacheAt<=now+1000&&Math.abs(cacheAt-proof.at)<=2000?Math.min(cacheAt,proof.at):null;
 }
 function collect(data,selected,after,now,documentId){
  const allowed=new Set(resolveTypes(selected)),history=data.autoJobsCompletedResults||[],done=new Set(history.filter(x=>x.status==='done').map(x=>x.jobId));
  const locks=new Map((data.autoJobsLockedJobs||[]).map(x=>[x.jobId,new Date(x.lockExpiresAt).getTime()]));
  const jobs=[],seen=new Set(),freshMarkets=[];
  for(const [marketKey,m]of Object.entries(markets)){
   const md=data[m.key];
   const verifiedAt=documentId?verifiedJobsAt(md,data[m.at],data.marketReadProofs?.[marketKey],documentId,now):data[m.at];
   if(!md||!Number.isFinite(verifiedAt)||verifiedAt<after||verifiedAt>now+1000)continue;
   freshMarkets.push(marketKey);
   for(const [rows,taken]of [[md.recentJobs||[],true],[md.jobs||[],false]])for(const row of rows){
    const name=row.name||row.type,id=row.id;
    const claimOnly=taken&&row.status==='TAKEN'&&row.canComplete===true;
    if(!id||seen.has(id)||(!claimOnly&&done.has(id))||!allowed.has(name)||row.isCompleted||row.isExpired||(taken&&row.status!=='TAKEN')||(!claimOnly&&locks.get(id)>now))continue;
    const expires=new Date(row.expiresAt||row.deadline).getTime();if(Number.isFinite(expires)&&expires<=now)continue;
    const serverless=name==='File Decryption',server=serverless?null:row.relatedServers?.[0];
    if(!claimOnly&&server?.serverName==='D4RK RM7CE'&&['Log Deletion','Log Download'].includes(name))continue;
    seen.add(id);jobs.push({jobId:id,name,type:name,marketId:m.id,marketKey,serverId:serverless?null:server?.id||row.serverId||row.conditions?.serverConfigId||null,serverName:serverless?'None':server?.serverName||row.serverName||'None',
     rewardCredits:Number(row.rewardCredits)||0,rewardReputation:Number(row.rewardReputation)||0,deposit:Number(row.deposit)||0,
     conditions:Array.isArray(row.conditions)?row.conditions:row.conditions?.items||[],...(row.fileInfo?{fileInfo:row.fileInfo}:{}),alreadyTaken:taken,canComplete:taken&&row.canComplete===true,status:'pending'});
   }
  }
  // v2 job ordering: local files first, then deterministic task types.
  jobs.sort((a,b)=>(a.serverName==='None'?0:1)-(b.serverName==='None'?0:1)||types.indexOf(a.type)-types.indexOf(b.type));
  return {jobs,freshMarkets};
 }
 function create({check,read,send,queue,receipt=()=>root.Cor3NetworkRuntime?.batchReceipt(),busy=()=>false,now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),refreshMs=90000,startMs=30000}={}){
  let active=null,serial=0,state=null,admitting=false;const listeners=new Set();
  const update=(ctx,patch)=>{if(active===ctx&&state?.id===ctx.id){state={...state,...patch,observedAt:now()};publish();}};
  const net=scope=>{const q=queue();if(!q||!same(q,scope))throw error('PAGE_QUEUE_UNREAD');return q;};
  const proof=ctx=>{const r=receipt();return r?.id===ctx.id&&same(r.scope,ctx.scope)?r:null;};
  const idle=scope=>{const q=net(scope);return !q.active&&!q.queued?.length&&!q.blocked&&!busy();};
  const snapshot=scope=>same(state?.scope,scope)?{...state,scope:{...state.scope},ready:['complete','cancelled'].includes(state.phase)&&idle(scope),...(state.summary?{summary:{...state.summary}}:{})}:null;
  function publish(){if(!state)return;let payload;try{payload={scope:{...state.scope},batch:snapshot(state.scope),queue:queue()};}catch{payload={scope:{...state.scope},batch:{...state,ready:false},queue:null};}for(const fn of listeners)try{fn(JSON.parse(JSON.stringify(payload)));}catch{}}
  const transient=e=>['PAGE_BINDING_UNAVAILABLE','PAGE_ACCOUNT_UNAVAILABLE','CENTER_STORE_UNAVAILABLE'].includes(e.code||e.message);
  async function confirmed(ctx){let phase=null;while(active===ctx){try{await check(ctx.scope);if(phase)update(ctx,{phase,code:null});return;}catch(e){if(!transient(e))throw e;if(!phase)phase=state.phase;update(ctx,{phase:'reconnecting',code:e.code||e.message});await sleep(750);}}throw error('PAGE_CHANGED');}
  async function dataFor(ctx,readKeys=keys){while(active===ctx){await confirmed(ctx);try{const data=await read(readKeys);await confirmed(ctx);return data;}catch(e){if(!transient(e))throw e;update(ctx,{phase:'reconnecting',code:e.code||e.message});await sleep(750);}}throw error('PAGE_CHANGED');}
  function finish(ctx,phase,patch={}){update(ctx,{phase,finishedAt:now(),waitingFor:null,...patch});if(active===ctx)active=null;}
  function waiting(ctx,q){update(ctx,{phase:ctx.cancel?'cancelling':'queued',waitingFor:q.blocked||q.active||'queue'});}
  async function once(ctx,action,extra){await confirmed(ctx);if(ctx.cancel&&action!=='cancelJobBatch')return {cancelled:true};try{return await send(action,ctx.scope,{...extra,batchId:ctx.id});}catch(e){
   // A dispatch may have been accepted before its post-check failed. Never repeat it.
   if(!transient(e))throw e;await confirmed(ctx);const r=proof(ctx),step=action==='startAutoJobs'?r?.execution:r?.refresh;
   if(!step?.ticket)throw error('PAGE_JOB_START_UNCONFIRMED');return {queued:'queued',queueResult:'queued',networkTicket:step.ticket};
  }}
  async function begin(expected,selection,fresh=null){
   if(active||admitting)throw error('PAGE_JOB_BATCH_RUNNING');admitting=true;
   try{const scope=await check(expected);net(scope);const data=await read(keys);await check(scope);
    if(data.autoFinishAllJobsEnabled===true)throw error('PAGE_JOB_LOOP_ENABLED');
    if(fresh&&(data.autoRunMarketJobsEnabled===false||data.autoJobsRunning===true||busy()))throw error('PAGE_JOB_ALREADY_RUNNING');
    if(fresh&&(!Array.isArray(fresh.markets)||!fresh.markets.length||fresh.markets.some(k=>!Object.hasOwn(markets,k))||!Number.isFinite(fresh.after)||!Array.isArray(fresh.jobIds)))throw error('PAGE_JOB_REFRESH_UNCONFIRMED');
    const selected=resolveTypes(selection===undefined?data.autoFinishAllJobTypes:selection);if(!selected.length)throw error('PAGE_JOB_TYPES_EMPTY');
    const ctx={id:String(++serial),scope,cancel:false,fresh};active=ctx;state={id:ctx.id,scope,source:fresh?'auto-market':'manual',phase:'queued',startedAt:now(),total:0,done:0,processed:0};publish();
    void run(ctx,selected).catch(e=>finish(ctx,e.code==='PAGE_CHANGED'?'cancelled':'blocked',{code:e.code||e.message||'PAGE_JOB_BATCH_UNCONFIRMED'}));
    return {phase:'queued',id:ctx.id};
   }finally{admitting=false;}
  }
  async function run(ctx,selection){
   const scope=ctx.scope;let data,refresh;
   if(!ctx.fresh){const reply=await once(ctx,'refreshAllMarketsSeq',{skipLots:true});if(reply.cancelled){finish(ctx,'cancelled');return;}
   if(!['started','queued'].includes(reply.queued)||!reply.networkTicket)throw error('PAGE_JOB_REFRESH_UNCONFIRMED');
   while(active===ctx){await confirmed(ctx);const q=net(scope),r=proof(ctx);refresh=r?.refresh;
    if(!refresh||refresh.ticket!==reply.networkTicket)throw error('PAGE_JOB_REFRESH_UNCONFIRMED');
    if(ctx.cancel&&(refresh.cancelled||refresh.finishedAt)){finish(ctx,'cancelled');return;}
    if(refresh.finishedAt)break;
    if(refresh.startedAt){update(ctx,{phase:ctx.cancel?'cancelling':'refreshing',waitingFor:null});if(now()-refresh.startedAt>refreshMs)throw error('PAGE_JOB_REFRESH_UNCONFIRMED');}
    else {if(!q.waiting?.some(t=>t.id===refresh.ticket&&t.type==='job-batch-refresh'))throw error('PAGE_JOB_REFRESH_UNCONFIRMED');waiting(ctx,q);}await sleep(500);
   }
   }else refresh={startedAt:ctx.fresh.after};
   data=await dataFor(ctx);if(ctx.cancel){finish(ctx,'cancelled');return;}
   if(data.autoFinishAllJobsEnabled===true)throw error('PAGE_JOB_LOOP_ENABLED');
   const selected=collect(data,selection,refresh.startedAt,now(),scope.documentId);
   if(ctx.fresh){selected.jobs=selected.jobs.filter(j=>ctx.fresh.markets.includes(j.marketKey)&&ctx.fresh.jobIds.includes(j.jobId));selected.freshMarkets=selected.freshMarkets.filter(k=>ctx.fresh.markets.includes(k));}
   if(!selected.freshMarkets.length)throw error('PAGE_JOB_REFRESH_UNCONFIRMED');
   update(ctx,{total:selected.jobs.length,markets:selected.freshMarkets,unreadMarkets:(ctx.fresh?ctx.fresh.markets:Object.keys(markets)).filter(x=>!selected.freshMarkets.includes(x))});
   if(!selected.jobs.length){finish(ctx,'complete',{done:0,summary:{done:0,failed:0,skipped:0}});return;}
   const accepted=await once(ctx,'startAutoJobs',{jobs:selected.jobs,settings:{skipFinalRefresh:true,singleBatch:true},...(ctx.fresh?{freshMarketRead:{markets:selected.freshMarkets,after:refresh.startedAt}}:{})});if(accepted.cancelled){finish(ctx,'cancelled');return;}
   if(!['started','queued'].includes(accepted.queueResult)||!accepted.networkTicket)throw error('PAGE_JOB_START_UNCONFIRMED');
   // Stop can arrive during command acknowledgement; cancel only this batch's ticket.
   if(ctx.cancel)await once(ctx,'cancelJobBatch',{});
   const ids=new Set(selected.jobs.map(x=>x.jobId));let observed=false,settlingAt=null;
   while(active===ctx){data=await dataFor(ctx,monitorKeys);const q=net(scope),r=proof(ctx),execution=r?.execution;
    if(!execution||execution.ticket!==accepted.networkTicket)throw error('PAGE_JOB_START_UNCONFIRMED');
    const rows=[...new Map((execution.tracker||data.autoJobsTracker||[]).filter(x=>ids.has(x?.jobId)).map(x=>[x.jobId,x])).values()],done=rows.filter(x=>x.status==='done').length,processed=rows.filter(x=>['done','failed','skipped','bugged'].includes(x.status)).length;
    if(execution.startedAt||execution.finishedAt)observed=true;
    if(!observed&&!execution.cancelled&&!q.waiting?.some(t=>t.id===execution.ticket&&t.type==='auto-jobs'))throw error('PAGE_JOB_START_UNCONFIRMED');
    const ownActive=q.running?.id===execution.ticket&&q.active==='auto-jobs';
    const slowAck=ownActive&&!execution.acceptedAt&&!data.autoJobsRunning&&now()-(execution.dispatchedAt||execution.startedAt)>startMs;
    update(ctx,{phase:ctx.cancel?'cancelling':execution.waitingFor==='minigame'?'waiting-minigame':!observed?'queued':slowAck?'waiting-ack':data.autoJobsRunning||ownActive?'running':'finishing',leaseExpired:ownActive&&q.blocked==='lease-expired',done,processed,results:rows.map(x=>({jobId:x.jobId,name:x.name||x.type||'',serverName:x.serverName||'',status:x.status,error:root.Cor3RunLog?.text(x.error||'').slice(0,320)||''})),current:observed?rows.find(x=>x.status==='running')?.name||null:null,waitingFor:observed?null:q.blocked||q.active||'queue'});
    if(execution.error){update(ctx,{reason:execution.reason});throw error(execution.error);}
    if(execution.cancelled||execution.finishedAt){
     if(ownActive){await sleep(500);continue;}
     const terminal=rows.filter(x=>['done','failed','skipped','bugged'].includes(x.status));
     if(!ctx.cancel&&terminal.length!==ids.size){if(settlingAt===null)settlingAt=now();if(now()-settlingAt<5000){update(ctx,{phase:'finishing'});await sleep(500);continue;}}
     finish(ctx,ctx.cancel?'cancelled':terminal.length===ids.size?'complete':'unconfirmed',{summary:{done,failed:rows.filter(x=>x.status==='failed').length,skipped:rows.filter(x=>['skipped','bugged'].includes(x.status)).length}});return;
    }
    if(execution.startedAt&&!data.autoJobsRunning&&!ownActive&&now()-execution.startedAt>startMs)throw error('PAGE_JOB_START_UNCONFIRMED');
    await sleep(1000);
   }
  }
  async function stop(expected){const scope=await check(expected),ctx=active;if(!ctx||!same(ctx.scope,scope))throw error('PAGE_JOB_NOT_RUNNING');ctx.cancel=true;update(ctx,{phase:'cancelling'});if(!proof(ctx)){finish(ctx,'cancelled');return {phase:'requested'};}await once(ctx,'cancelJobBatch',{});return {phase:'requested'};}
  return Object.freeze({begin,beginAfterRefresh:(scope,fresh)=>begin(scope,undefined,fresh),stop,status:snapshot,publish,subscribe:fn=>{listeners.add(fn);publish();return()=>listeners.delete(fn);}});
 }
 root.Cor3JobBatchFactory=Object.freeze({create,collect,verifiedJobsAt,resolveTypes,types,markets,keys});
})(globalThis);
