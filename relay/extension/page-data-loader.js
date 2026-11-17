/* Page-lifetime read bootstrap. Runs independently of either Helper panel. */
(function(root){'use strict';
 const same=(a,b)=>!!a&&!!b&&a.accountId===b.accountId&&a.documentId===b.documentId;
 function create({client=()=>root.Cor3InPageControls,identity=root.Cor3CenterIdentity,allowed=()=>root.Cor3Automation?.allowed()===true,now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let timer=null,stopped=false,flight=false,epoch=0,session=0,scope=null,cycle=true,settledAt=null,state={phase:'waiting-permission'},retries=0,retryAt=null,retryKinds=null;
  function schedule(ms){clearTimer(timer);timer=null;if(stopped)return;timer=setTimer(()=>{timer=null;void tick();},ms);timer?.unref?.();}
  async function tick(){
   if(stopped||flight)return;flight=true;const ticket=epoch;let delay=2000;
   try{
    const current=identity?.snapshot();
    if(!current||!allowed()||!client()){scope=null;state={phase:'waiting-permission'};cycle=true;return;}
    if(!same(current,scope)){scope={accountId:current.accountId,documentId:current.documentId};++session;cycle=true;settledAt=null;retries=0;retryAt=null;retryKinds=null;}
    if(!cycle){delay=5000;return;}
    if(state.phase==='partial'&&retryAt!==null&&now()>=retryAt&&retries<3){retryKinds=state.failed?.filter(k=>['loadout','expeditions','drone','daily','markets'].includes(k))||[];if(retryKinds.length){++session;++retries;}retryAt=null;}
    const captured={...scope},result=await client().autoRead(captured,session,retryKinds);
    if(stopped||ticket!==epoch||!allowed()||!same(captured,identity.snapshot()))return;
    state={...result,scope:captured,retries};
    if(result.phase==='complete'){cycle=false;settledAt=now();retryAt=null;retryKinds=null;delay=5000;}
    else if(result.phase==='partial'){cycle=true;if(settledAt===null)settledAt=now();if(retryAt===null&&retries<3)retryAt=now()+30000*Math.pow(2,retries);state.nextRetryAt=retryAt;delay=5000;}
    else{settledAt=null;delay=result.phase==='waiting'?2000:750;}
   }catch{if(!stopped&&ticket===epoch){scope=null;cycle=true;state={phase:'waiting-permission'};}}
   finally{flight=false;if(!stopped)schedule(delay);}
  }
  function ensure(){if(stopped)return;if(settledAt!==null&&now()-settledAt>=30000){cycle=true;++session;settledAt=null;retries=0;retryAt=null;retryKinds=null;}schedule(0);}
  function suspend(){if(stopped)return;++epoch;scope=null;cycle=true;settledAt=null;retries=0;retryAt=null;retryKinds=null;state={phase:'waiting-permission'};schedule(2000);}
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
