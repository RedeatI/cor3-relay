(async function(){'use strict';const api=globalThis.chrome||globalThis.browser;let proposal=null;
 const select=document.getElementById('tabs'),info=document.getElementById('info'),confirm=document.getElementById('confirm');
 const list=await api.runtime.sendMessage({type:'cor3-center-list'});
 if(list?.ok)for(const tab of list.tabs){const option=document.createElement('option');option.value=String(tab.tabId);option.textContent=`标签 ${tab.tabId}: ${tab.title||tab.url}`;select.appendChild(option)}
 document.getElementById('probe').addEventListener('click',async e=>{if(!e.isTrusted)return;confirm.disabled=true;proposal=null;const tabId=Number(select.value);if(select.value===''||!Number.isSafeInteger(tabId))return;const r=await api.runtime.sendMessage({type:'cor3-center-prepare',tabId});if(r?.ok){proposal=r.proposal;info.textContent=`可见账号 ${proposal.account}，标签 ${proposal.tabId}。请核对后确认。`;confirm.disabled=false}else info.textContent='无法核实账号，请在正常游戏页面确认后重新读取。'});
 select.addEventListener('change',()=>{proposal=null;confirm.disabled=true});
 confirm.addEventListener('click',async e=>{if(!e.isTrusted||!proposal)return;confirm.disabled=true;const p=proposal;proposal=null;const r=await api.runtime.sendMessage({type:'cor3-center-confirm',token:p.token});info.textContent=r?.ok?`已绑定 ${r.binding.accountId}，仍保持暂停。请关闭并重新打开 Helper 面板，再显式恢复；无需再次刷新。`:'身份发生变化或确认过期，未绑定。'});
 document.getElementById('unbind').addEventListener('click',async e=>{if(!e.isTrusted)return;proposal=null;confirm.disabled=true;const r=await api.runtime.sendMessage({type:'cor3-center-unbind'});info.textContent=r?.ok?'已解除绑定。':'无法确认解除结果。'});
})();


