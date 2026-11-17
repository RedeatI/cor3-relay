/* Read only, using the popup's pinned account binding. No automatic tab selection. */
(() => {'use strict';
 const details=document.getElementById('runtimeStatus'),output=document.getElementById('runtimeStatusText');
 if(!details||!output)return;let serial=0;
 async function refresh(){
  if(!details.open)return;const ticket=++serial;
  try{
   const binding=await Cor3CenterUi.binding();
   const data=await Cor3CenterStore.get(['networkRuntimeStatus','automationRunLogs','dailyHackNextCheckAt']);
   const after=await Cor3CenterUi.binding();if(ticket!==serial||binding.documentId!==after.documentId||binding.accountId!==after.accountId)return;
   const state=data.networkRuntimeStatus,logs=data.automationRunLogs;
   if(state?.documentId!==binding.documentId||state.accountId!==binding.accountId){output.textContent='当前游戏页状态尚未读取';return;}
   output.textContent=[`执行：${state.active||'空闲'}`,`排队：${state.queued.join(' → ')||'无'}`,`端点：${state.lease?.owner||'空闲'}${state.lease?.expired?'（超时，等待结束确认）':''}`,state.blocked?`等待：${state.blocked}`:'',Number.isFinite(data.dailyHackNextCheckAt)?`Daily 下次：${new Date(data.dailyHackNextCheckAt).toLocaleString()}`:'Daily 下次：未读取',...(logs?.documentId===binding.documentId&&logs.accountId===binding.accountId?logs.entries.slice(-8).map(x=>`${new Date(x.at).toLocaleTimeString()} ${x.code} ${x.message}`):[])].filter(Boolean).join('\n');
  }catch{if(ticket===serial)output.textContent='当前页面许可或账号未确认';}
 }
 details.addEventListener('toggle',()=>void refresh());
 Cor3CenterStore.onChanged.addListener(changes=>{if(changes.networkRuntimeStatus||changes.automationRunLogs)void refresh();});
 Cor3CenterUi.ready.then(()=>void refresh()).catch(()=>{});
})();
