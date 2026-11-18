/* Page-lifetime read bootstrap. Runs independently of either Helper panel. */
(function(root){'use strict';
 const same=(a,b)=>!!a&&!!b&&a.accountId===b.accountId&&a.documentId===b.documentId,CACHE_MS=root.Cor3InPageControlsFactory?.cacheMs||5*60*1000;
 function create({client=()=>root.Cor3InPageControls,identity=root.Cor3CenterIdentity,allowed=()=>root.Cor3Automation?.allowed()===true,now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  const settledDelay=60000;
  let requested=false;
  let timer=null,stopped=false,flight=false,epoch=0,session=0,scope=null,cycle=true,settledAt=null,state={phase:'waiting-permission'},retries=0,retryAt=null,retryKinds=null,lateCheckAt=null,readFailures=0,recoverAt=null;
  function schedule(ms){clearTimer(timer);timer=null;if(stopped)return;timer=setTimer(()=>{timer=null;void tick();},ms);timer?.unref?.();}
  async function tick(){
   if(stopped||flight)return;flight=true;const ticket=epoch;let delay=settledDelay,retryingKinds=false;
   try{
    const current=identity?.snapshot();
    if(!current||!allowed()||!client()){scope=null;state={phase:'waiting-permission'};cycle=true;return;}
    if(!same(current,scope)){scope={accountId:current.accountId,documentId:current.documentId};++session;cycle=true;settledAt=null;retries=0;retryAt=null;retryKinds=null;lateCheckAt=null;readFailures=0;recoverAt=null;state={phase:'checking'};}
    if(!cycle){delay=settledDelay;return;}
    if(recoverAt!==null&&now()<recoverAt){delay=recoverAt-now();return;}
    if(state.phase==='partial'){
     const at=now();
     if(retryAt!==null&&at>=retryAt){retryKinds=state.failed?.filter(k=>['loadout','expeditions','drone','daily','markets'].includes(k))||[];if(retryKinds.length){++session;++retries;retryingKinds=true;}retryAt=null;lateCheckAt=null;}
     else if(lateCheckAt!==null&&at>=lateCheckAt)lateCheckAt=null;
     else{delay=Math.min(lateCheckAt??Infinity,retryAt??Infinity)-at;if(!Number.isFinite(delay)){cycle=false;delay=settledDelay;}return;}
    }
    const captured={...scope},result=await client().autoRead(captured,session,retryKinds);
    if(stopped||ticket!==epoch||!allowed()||!same(captured,identity.snapshot()))return;
    readFailures=0;recoverAt=null;
    const firstPartial=state.phase!=='partial'||retryingKinds;
    state={...result,scope:captured,retries};
    if(result.phase==='complete'){cycle=false;settledAt=now();retryAt=null;retryKinds=null;delay=settledDelay;}
    else if(result.phase==='partial'){
     if(settledAt===null)settledAt=now();
     if(firstPartial)lateCheckAt=now()+5000;
     if(retryAt===null&&retries<3)retryAt=now()+30000*Math.pow(2,retries);
     state.nextRetryAt=retryAt;
     cycle=lateCheckAt!==null||retryAt!==null;
     delay=cycle?Math.min(lateCheckAt??Infinity,retryAt??Infinity)-now():settledDelay;
    }
    else{settledAt=null;delay=result.phase==='waiting'?2000:750;}
   }catch(error){
    if(!stopped&&ticket===epoch){
     cycle=true;
     if(!same(scope,identity?.snapshot())||!allowed()||['PAGE_ACCOUNT_UNAVAILABLE','PAGE_BINDING_UNAVAILABLE','PAGE_AUTOMATION_PAUSED','PAGE_CHANGED'].includes(error?.code)){
      state={phase:'waiting-permission'};readFailures=0;recoverAt=null;
     }else{
      delay=Math.min(30000,2000*2**Math.min(readFailures++,4));recoverAt=now()+delay;
      state={phase:'retrying',scope:{...scope},nextRetryAt:recoverAt};
     }
    }
   }
   finally{flight=false;if(!stopped)schedule(requested?0:delay);requested=false;}
  }
  function ensure(){if(stopped)return;const at=now(),expires=Number.isFinite(state.freshUntil)?state.freshUntil:settledAt===null?null:settledAt+CACHE_MS;if(settledAt!==null&&(at<settledAt||expires!==null&&at>=expires)){cycle=true;++session;settledAt=null;retries=0;retryAt=null;retryKinds=null;lateCheckAt=null;state={phase:'checking'};}if(flight)requested=true;else schedule(0);}
  function suspend(){if(stopped)return;++epoch;scope=null;cycle=true;settledAt=null;retries=0;retryAt=null;retryKinds=null;lateCheckAt=null;readFailures=0;recoverAt=null;state={phase:'waiting-permission'};schedule(settledDelay);}
  function stop(){if(stopped)return;stopped=true;++epoch;clearTimer(timer);timer=null;scope=null;state={phase:'closed'};}
  return Object.freeze({start:ensure,ensure,suspend,stop,status:()=>({...state,...(state.scope?{scope:{...state.scope}}:{}),...(state.failed?{failed:[...state.failed]}:{})})});
 }
 root.Cor3PageDataLoaderFactory=Object.freeze({create});
 if(root.window?.top!==root.window||!root.Cor3InPageControls||root.Cor3PageDataLoader)return;
 const loader=create();root.Cor3PageDataLoader=loader;
 root.Cor3Automation?.onReady?.(()=>loader.ensure());
 root.Cor3Automation?.onStop?.(()=>loader.suspend());
 root.window.addEventListener('pagehide',()=>loader.stop(),{once:true});
 loader.start();
})(globalThis);
