/* Read only, using the popup's pinned account binding. No automatic tab selection. */
(() => {'use strict';
 const details=document.getElementById('runtimeStatus'),output=document.getElementById('runtimeStatusText');
 if(!details||!output)return;
 const keys=['networkRuntimeStatus','automationRunLogs','dailyHackNextCheckAt'];
 const same=(a,b)=>a&&b&&a.documentId===b.documentId&&a.accountId===b.accountId;
 let generation=0,reading=false,pending=false;
 function show(text){if(output.textContent!==text)output.textContent=text;}
 function format(data,binding){
  const state=data.networkRuntimeStatus,logs=data.automationRunLogs;
  if(!same(state,binding))return '当前游戏页状态尚未读取';
  const active=Object.hasOwn(state,'active')?state.active||'空闲':'未读取';
  const queued=Array.isArray(state.queued)?state.queued.join(' → ')||'无':'未读取';
  const endpoint=state.lease===null?'空闲':state.lease?.owner||'未读取';
  const entries=same(logs,binding)&&Array.isArray(logs.entries)?logs.entries.slice(-8).filter(x=>Number.isFinite(x?.at)):[];
  return [`执行：${active}`,`排队：${queued}`,`端点：${endpoint}${state.lease?.expired?'（超时，等待结束确认）':''}`,state.blocked?`等待：${state.blocked}`:'',Number.isFinite(data.dailyHackNextCheckAt)?`Daily 下次：${new Date(data.dailyHackNextCheckAt).toLocaleString()}`:'Daily 下次：未读取',...entries.map(x=>`${new Date(x.at).toLocaleTimeString()} ${x.code} ${x.message}`)].filter(Boolean).join('\n');
 }
 async function refresh(){
  if(!details.open)return;
  pending=true;
  if(reading)return;
  reading=true;
  try{
   while(pending&&details.open){
    pending=false;
    const ticket=generation;
    const visible=()=>details.open&&ticket===generation;
    try{
     const binding=await Cor3CenterUi.binding();
     if(!visible())continue;
     const data=await Cor3CenterStore.get(keys);
     if(!visible())continue;
     const after=await Cor3CenterUi.binding();
     if(visible()&&same(binding,after)&&binding.epoch===after.epoch)show(format(data,binding));
    }catch(error){
     if(visible())show(['CENTER_STORE_TIMEOUT','CENTER_PROBE_TIMEOUT'].includes(error?.message)?'后台读取超时，可重新展开状态':'当前页面许可或账号未确认');
    }
   }
  }finally{reading=false;}
 }
 details.addEventListener('toggle',()=>{++generation;if(details.open)void refresh();else pending=false;});
 Cor3CenterStore.onChanged.addListener(changes=>{if(keys.some(key=>Object.hasOwn(changes,key)))void refresh();});
 Cor3CenterUi.ready.then(()=>void refresh()).catch(()=>{});
})();
