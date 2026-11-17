/* One privileged UI is pinned once to its own browser window and one binding generation. */
(function(root){'use strict';const api=root.chrome||root.browser;let fixed=null,invalid=false,inflight=null,initialization=null,ownerWindowId=null,lastTransient=null,retryAfter=0,closed=false,retryTimer=null,cancelRetry=null;
 const fields=['windowId','tabId','accountId','documentId','url','epoch'];const same=(a,b)=>a&&b&&fields.every(k=>a[k]===b[k]);
 function status(text){const node=root.document?.getElementById('centerAccountStatus')||root.document?.getElementById('centerConnectionStatus');if(node)node.textContent=text;}
 const reasons={CENTER_RECEIVER_UNAVAILABLE:'游戏页未能接收插件身份探测；请确认扩展已载入此页面。',CENTER_PROBE_TIMEOUT:'游戏页身份探测超时，本次未启动。',CENTER_IDENTITY_SELECTOR_MISSING:'页面尚未显示指定账号身份元素，本次未启动。',CENTER_IDENTITY_SELECTOR_MULTIPLE:'页面出现多个账号身份元素，无法唯一确认，本次未启动。',CENTER_IDENTITY_HIDDEN:'账号身份元素暂时不可见，本次未启动；恢复可见后重新打开插件。',CENTER_IDENTITY_FORMAT:'账号身份元素格式不符合要求，本次未启动。',CENTER_IDENTITY_UNAVAILABLE:'无法核验页面身份，本次未启动。',CENTER_IDENTITY_REVOKED:'当前页面身份代已失效，请在有效游戏页重新打开插件。',CENTER_MIGRATION_INCOMPLETE:'设置升级未完成，本次未启动；重新打开仅核验已完成值并补完成标记，不会重复覆盖设置。',CENTER_MIGRATION_REVIEW_REQUIRED:'设置升级记录与当前设置不一致，本次未启动且未覆盖设置；请提供此提示，由检查确认保留当前值或另行批准修复。',CENTER_MIGRATION_UNAVAILABLE:'设置升级组件不可用，本次未启动；请提供此提示检查。',CENTER_WINDOW_UNAVAILABLE:'无法确定这个插件界面所属的普通浏览器窗口。请在游戏所在窗口打开插件。',CENTER_ACCOUNT_AMBIGUOUS:'当前窗口有多个 COR3 标签页，无法唯一识别账号。',CENTER_ACCOUNT_NOT_FOUND:'当前窗口未找到 COR3 游戏标签页。',CENTER_ACCOUNT_NOT_READY:'当前 COR3 页面仍在加载或尚未显示可信账号。',CENTER_OTHER_WINDOW_BOUND:'另一个窗口已有有效账号连接，当前界面不会抢占。',CENTER_AUTO_BUSY:'另一个窗口正在识别账号，当前界面不会切换目标。',CENTER_BINDING_REVOKED:'页面或账号发生变化，请重新打开插件后识别。'};
 const transient=new Set(['CENTER_IDENTITY_SELECTOR_MISSING','CENTER_IDENTITY_HIDDEN','CENTER_ACCOUNT_NOT_READY','CENTER_RECEIVER_UNAVAILABLE','CENTER_PROBE_TIMEOUT']);
 const pause=ms=>new Promise((resolve,reject)=>{cancelRetry=()=>reject(Error('CENTER_UI_CLOSED'));retryTimer=root.setTimeout(()=>{retryTimer=null;cancelRetry=null;resolve();},ms);});
 root.addEventListener?.('pagehide',()=>{closed=true;if(retryTimer!==null)root.clearTimeout?.(retryTimer);retryTimer=null;cancelRetry?.();cancelRetry=null;},{once:true});
 function fail(){invalid=true;status('账号或文档已变化。请关闭并重新打开此 Helper 界面。');throw Error('CENTER_UI_REOPEN_REQUIRED')}
 function initialize(){if(closed)return Promise.reject(Error('CENTER_UI_CLOSED'));if(initialization){if(!fixed&&lastTransient&&Date.now()>=retryAfter){initialization=null;lastTransient=null;}else return initialization;}initialization=(async()=>{
  try{
   if(root.location?.href===api.runtime.getURL('devtools-panel.html')){
    const id=api.devtools?.inspectedWindow?.tabId;
    if(!Number.isSafeInteger(id)||id<0)throw Error('CENTER_WINDOW_UNAVAILABLE');
    const before=await api.tabs.get(id);
    const r=await api.runtime.sendMessage({type:'centerResolve'});
    const b=r?.ok?r.tab:null;
    if(!b||before?.id!==id||before.windowId!==b.windowId||id!==b.tabId||before.url!==b.url||before.status==='loading')throw Error('CENTER_BINDING_UNAVAILABLE');
    const after=await api.tabs.get(id);
    const check=await api.runtime.sendMessage({type:'centerResolve'});
    if(after?.id!==id||after.windowId!==b.windowId||after.url!==b.url||after.status==='loading'||!check?.ok||!same(b,check.tab))throw Error('CENTER_BINDING_REVOKED');
    if(closed)throw Error('CENTER_UI_CLOSED');fixed=Object.freeze(Object.fromEntries(fields.map(k=>[k,b[k]])));status('已附着当前检查标签的既有账号连接。');return fixed;
   }
   // This runs in the privileged popup context. No caller-supplied window or focus fallback.
   const w=await api.windows.getCurrent({populate:false});if(!Number.isSafeInteger(w?.id)||w.id<0||w.type!=='normal')throw Error('CENTER_WINDOW_UNAVAILABLE');
   if(ownerWindowId===null)ownerWindowId=w.id;if(w.id!==ownerWindowId)throw Error('CENTER_WINDOW_UNAVAILABLE');
   let r;
   for(let attempt=0;attempt<4;attempt++){
    if(closed)throw Error('CENTER_UI_CLOSED');
    const current=await api.windows.getCurrent({populate:false});if(current?.id!==ownerWindowId||current.type!=='normal')throw Error('CENTER_WINDOW_UNAVAILABLE');
    r=await api.runtime.sendMessage({type:'cor3-center-auto-bind',windowId:ownerWindowId});if(closed)throw Error('CENTER_UI_CLOSED');if(r?.ok&&r.tab)break;
    const code=r?.code||'CENTER_BINDING_UNAVAILABLE';
    if(!transient.has(code)||attempt===3||typeof root.setTimeout!=='function')throw Error(code);
    status('正在等待当前游戏页账号就绪，自动重试中…');await pause(250*2**attempt);
   }
   const after=await api.windows.getCurrent({populate:false});if(after?.id!==w.id||after.type!=='normal'||r.tab.windowId!==w.id)throw Error('CENTER_BINDING_REVOKED');
   if(closed)throw Error('CENTER_UI_CLOSED');fixed=Object.freeze(Object.fromEntries(fields.map(k=>[k,r.tab[k]])));status(`已识别当前窗口账号：${fixed.accountId}。功能状态遵循此账号的已保存设置。`);return fixed;
  }catch(e){if(transient.has(e?.message)){lastTransient=e.message;retryAfter=Date.now()+2000;}if(!closed)status(reasons[e?.message]||'暂时无法核实当前窗口的 COR3 账号；未选择其他窗口或标签。');throw e;}
 })();initialization.catch(()=>{});return initialization;}
 async function binding(){if(closed)throw Error('CENTER_UI_CLOSED');if(invalid)return fail();if(inflight)return inflight;inflight=(async()=>{if(!fixed)await initialize();if(closed)throw Error('CENTER_UI_CLOSED');const r=await api.runtime.sendMessage({type:'centerResolve'});if(closed)throw Error('CENTER_UI_CLOSED');const b=r?.ok?r.tab:null;if(!same(fixed,b))return fail();return fixed;})();try{return await inflight}finally{inflight=null}}
 function complete(p,cb){p.catch(()=>{});if(typeof cb==='function')p.then(v=>cb(v),()=>cb(undefined));return p}
 async function command(request){const b=await binding();const r=await api.runtime.sendMessage({...request,centerExpectedBinding:b});await binding();return r;}
 const ready=initialize().catch(()=>null);
 root.Cor3CenterUi=Object.freeze({ready,binding,
  async resolve(){try{const b=await binding();return {...b,id:b.tabId}}catch(e){if(invalid)throw e;return null}},
  send(tabId,message,options,callback){if(typeof options==='function'){callback=options;options=undefined}const p=(async()=>{const b=await binding();if(tabId!==b.tabId)return fail();const r=await api.runtime.sendMessage({type:'centerSend',tabId,message,options:options||{frameId:0},expectedBinding:b});await binding();if(!r?.ok)throw Error('CENTER_BINDING_UNAVAILABLE');return r.value})();return complete(p,callback)},
  command,master:paused=>command({action:'cor3SetHelperMode',paused}),
  async execute(options){const b=await binding();if(options?.target?.tabId!==b.tabId)return fail();const result=await api.scripting.executeScript(options);await binding();return result},
  // Retained compatibility method never opens the deprecated pairing webpage.
  openBinding:()=>binding(),
  async panel(tab){if(Number.isSafeInteger(tab?.id)&&tab.id>=0&&api.sidePanel?.open){try{return await api.sidePanel.open({tabId:tab.id})}catch{}}if(api.sidebarAction?.open){try{return await api.sidebarAction.open()}catch{}}throw Error('CENTER_SIDEBAR_UNAVAILABLE');}
 });
})(globalThis);

