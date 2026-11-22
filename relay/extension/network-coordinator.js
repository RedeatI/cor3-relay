/* Queue and lease adapted from SaltApocalypse/cor3-helper v2.0.0-salta; see LICENSE.upstream.
 * A timed-out operation keeps its lease until acknowledgement or explicit stop.
 */
(function(root){'use strict';
 const priorities=Object.freeze({'initial-fetch':100,'auto-daily':55,'auto-send':50,'manual-market':45,'auto-drone':40,'auto-jobs':35,'job-batch-refresh':35,'clear-failed-jobs':30,'auto-valuable':20,'auto-update-markets':10});
 function create({scope,allowed,blocked=()=>false,now=()=>Date.now(),onChange=()=>{},log=()=>{},ttlMs=300000}={}){
  let active=null,waiting=[],serial=0,epoch=0;
  const same=(a,b)=>a&&b&&a.accountId===b.accountId&&a.documentId===b.documentId;
  const valid=t=>t&&t.epoch===epoch&&allowed()&&same(t.scope,scope());
  const info=t=>t?{id:t.id,type:t.type,owner:t.type,priority:t.priority,startedAt:t.startedAt||null,enqueuedAt:t.enqueuedAt}:null;
  function snapshot(){const s=scope();return {accountId:s?.accountId||null,documentId:s?.documentId||null,active:active?.type||null,queued:waiting.map(t=>t.type),running:info(active),waiting:waiting.map(info),lease:active?{owner:active.type,id:active.id,acquiredAt:active.startedAt,expiresAt:active.expiresAt,expired:now()>=active.expiresAt}:null,blocked:active?.fault||(blocked()?'game-busy':null),updatedAt:now()};}
  const changed=()=>{try{onChange(snapshot());}catch{}};
  function release(task){
   active=null;
   try{task?.onRelease?.();}catch(error){log('queue.cleanup',String(error),{},'warn');}
  }
  function cancel(){epoch++;waiting=[];release(active);changed();}
  function pump(){
   if(active){if(!valid(active)){cancel();return;}if(now()>=active.expiresAt&&!active.fault){active.fault='lease-expired';log('queue.timeout','操作超时，保留端点占用等待结束确认',{owner:active.type},'warn');changed();}return;}
   if(!waiting.length||!allowed()||blocked())return;
   waiting=waiting.filter(valid);if(!waiting.length)return;
   const task=waiting.shift();active=task;task.startedAt=now();task.expiresAt=now()+ttlMs;
   log('queue.started','开始操作',{owner:task.type});changed();
   const context=Object.freeze({id:task.id,valid:()=>active===task&&valid(task),finish:()=>finish(task.type,task.id),renew:()=>renew(task.id),onRelease:fn=>{if(active===task)task.onRelease=fn;},fail:code=>{if(active===task){task.fault=code||'operation-failed';changed();}}});
   try{const promise=task.run(context);if(promise?.then)promise.catch(()=>{if(context.valid())context.fail('operation-failed');});}catch{context.fail('operation-failed');}
  }
  function enqueue(type,run,priority=priorities[type]??(type.startsWith("manual-market:")?45:25)){
   const s=scope();if(!allowed()||!s?.accountId||!s.documentId)return 'master-paused';
   if(active?.type===type)return 'already-running';if(waiting.some(x=>x.type===type))return 'already-queued';
   const task={id:String(++serial),type,scope:{...s},epoch,run,priority,enqueuedAt:now()};waiting.push(task);waiting.sort((a,b)=>b.priority-a.priority||Number(a.id)-Number(b.id));
   log('queue.queued','操作已排队',{owner:type});changed();pump();return active===task?'started':'queued';
  }
  function finish(type,id){if(!active||active.type!==type||active.id!==id||!valid(active))return false;log('queue.finished','操作结束，释放端点',{owner:type});release(active);changed();pump();return true;}
  function renew(id){if(!active||active.id!==id||!valid(active)||active.fault||now()>=active.expiresAt)return false;const at=now();active.expiresAt=at+ttlMs;if(at-(active.lastLeaseNoticeAt??active.startedAt)>=ttlMs/2){active.lastLeaseNoticeAt=at;changed();}return true;}
  function keepWaiting(types){waiting=waiting.filter(t=>types.includes(t.type));changed();}
  function cancelQueued(type,id){const at=waiting.findIndex(t=>t.type===type&&t.id===id&&valid(t));if(at<0)return false;waiting.splice(at,1);log('queue.cancelled','取消排队操作',{owner:type});changed();pump();return true;}
  return Object.freeze({enqueue,finish,renew,cancel,cancelQueued,pump,snapshot,keepWaiting,current:()=>active?{...info(active)}:null});
 }
 root.Cor3NetworkCoordinator=Object.freeze({create,priorities});
})(globalThis);
