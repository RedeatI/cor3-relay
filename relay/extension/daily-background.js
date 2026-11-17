/* Alarm wakeups only target the already verified tab/document. Never find another tab. */
(function(root){'use strict';
 function create({api=root.chrome||root.browser,binding=root.Cor3CenterBinding,store=root.Cor3CenterStore,now=()=>Date.now()}={}){
  const name=b=>'cor3DailyCheck:'+b.accountId+':'+b.documentId;let revision=0,tail=Promise.resolve();
  const commit=fn=>{const next=tail.then(fn,fn);tail=next.catch(()=>{});return next;};
  async function sync(){const version=++revision,b=binding.snapshot();if(!b)return;
   try{const data=await store.get(['autoDailyHackEnabled','dailyHackNextCheckAt','helperMode']);if(version!==revision||!binding.isCurrent(b))return;
    await commit(async()=>{if(version!==revision||!binding.isCurrent(b))return;
     if(data.autoDailyHackEnabled!==true||data.helperMode||!Number.isFinite(data.dailyHackNextCheckAt)){await api.alarms.clear(name(b));return;}
     await api.alarms.create(name(b),{when:Math.max(now()+1000,data.dailyHackNextCheckAt)});
    });
   }catch{}
  }
  async function wake(alarm){const b=binding.snapshot();if(!b||alarm.name!==name(b))return;
   try{const data=await store.get(['autoDailyHackEnabled','dailyHackNextCheckAt','helperMode']);if(!binding.isCurrent(b)||data.autoDailyHackEnabled!==true||data.helperMode||!root.Cor3Automation?.allowed())return;
    if(data.dailyHackNextCheckAt>now()){await sync();return;}
    await binding.guard(b.tabId,()=>api.tabs.sendMessage(b.tabId,{type:'cor3-daily-wake',documentId:b.documentId},{frameId:0}),b);
   }catch{}
  }
  api.alarms.onAlarm.addListener(wake);
  api.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;const b=binding.snapshot(),prefix=b?'center:'+b.accountId+':':'';
   if(changes.helperMode||(b&&['autoDailyHackEnabled','dailyHackNextCheckAt'].some(k=>changes[prefix+k])))void sync();
  });
  binding.onBound(()=>void sync());binding.onRevoke(old=>{revision++;if(old)void commit(()=>api.alarms.clear(name(old)));});
  return Object.freeze({sync,wake});
 }
 root.Cor3DailyBackgroundFactory=Object.freeze({create});
 if((root.chrome||root.browser)?.alarms&&root.Cor3CenterBinding&&root.Cor3CenterStore)root.Cor3DailyBackground=create();
})(globalThis);
