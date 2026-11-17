/* Isolated top-frame identity observer. Fixed diagnostic codes only; no DOM text diagnostics. */
(function(root){'use strict';
 if(root.window.top!==root.window||root.Cor3CenterIdentity)return;
 const api=root.chrome||root.browser,selector='[data-component-name="UserIdentityUserNameText"]';
 const nonce=()=>Array.from(root.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 let documentId=null,last=null,hard=false,observedIdentity=null;
 const bad=(code,count=0)=>({code,count});
 function inspect(){try{
  if(hard)return bad('CENTER_IDENTITY_REVOKED');
  const u=new URL(root.location.href);if(u.protocol!=='https:'||!['cor3.gg','os.cor3.gg'].includes(u.hostname)||u.port||u.username||u.password)return bad('CENTER_IDENTITY_UNAVAILABLE');
  const list=root.document.querySelectorAll(selector);observedIdentity=list.length===1?list[0]:null;const count=Math.min(list.length,2);
  if(!list.length)return bad('CENTER_IDENTITY_SELECTOR_MISSING');if(list.length!==1)return bad('CENTER_IDENTITY_SELECTOR_MULTIPLE',count);
  const el=list[0];if(!el.isConnected||!el.getClientRects().length)return bad('CENTER_IDENTITY_HIDDEN',1);
  let p=el,n=0;while(p){const s=root.getComputedStyle(p);if(++n>64||p.hidden||p.getAttribute('aria-hidden')==='true'||p.hasAttribute('inert')||s.display==='none'||['hidden','collapse'].includes(s.visibility)||Number(s.opacity)===0)return bad('CENTER_IDENTITY_HIDDEN',1);p=p.parentElement;}
  const r=el.getBoundingClientRect();if(!(r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<root.innerHeight&&r.left<root.innerWidth))return bad('CENTER_IDENTITY_HIDDEN',1);
  const account=el.textContent.trim();if(!/^FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}$/.test(account))return bad('CENTER_IDENTITY_FORMAT',1);
  return {account,url:u.href};
 }catch{return bad('CENTER_IDENTITY_UNAVAILABLE')}}
 function invalidate(){++noticeSequence;announced=null;connection={code:'CENTER_ACCOUNT_NOT_READY'};const old=documentId;documentId=null;last=null;if(old)try{Promise.resolve(api.runtime.sendMessage({type:'cor3-center-revoked',documentId:old})).catch(()=>{})}catch{}}
 function refresh(){const current=inspect();if(current.code){invalidate();return current;}if(last&&(last.account!==current.account||last.url!==current.url))invalidate();if(!documentId)documentId=nonce();last=current;return {...current,documentId};}
 let announced=null, announcementFlight=false, nextAttempt=0, noticeSequence=0, reconnectRequested=false;
 let connection={code:'CENTER_ACCOUNT_NOT_READY'};
 function announce(current,force=false){
  if(current.code||announcementFlight||(!force&&current.documentId===announced)||Date.now()<nextAttempt)return;
  const sequence=++noticeSequence, id=current.documentId;
  announcementFlight=true;
  Promise.resolve().then(()=>api.runtime.sendMessage({type:'cor3-center-page-ready',documentId:id})).then(result=>{
   if(sequence!==noticeSequence||hard)return;
   connection={code:result?.ok?'CENTER_CONNECTED':result?.code||'CENTER_RECEIVER_UNAVAILABLE'};
   if(result?.ok)announced=id;
   nextAttempt=Date.now()+2000;
  },()=>{
   if(sequence===noticeSequence)connection={code:'CENTER_RECEIVER_UNAVAILABLE'};
   nextAttempt=Date.now()+2000;
  }).finally(()=>{announcementFlight=false;if(reconnectRequested){reconnectRequested=false;announced=null;nextAttempt=0;check();}});
 }
 function check(){if(!hard)announce(refresh())}
 function revoke(){if(hard)return;hard=true;invalidate();observer.disconnect();clearInterval(timer)}
 const listener=(m,sender)=>{
  if(sender?.id===api.runtime.id&&!sender.tab&&m?.type==='cor3-center-page-active'&&!hard){announced=null;nextAttempt=0;if(announcementFlight)reconnectRequested=true;else announce(refresh(),true);return;}
  if(sender?.id!==api.runtime.id||sender.tab||!m||Object.keys(m).sort().join('|')!=='nonce|type'||m.type!=='cor3-center-probe'||typeof m.nonce!=='string'||!/^[a-f0-9]{32}$/.test(m.nonce))return;
  const current=refresh();
  const reply=current.code?{type:'cor3-center-diagnostic',nonce:m.nonce,code:current.code,count:current.count}:{type:'cor3-center-observation',nonce:m.nonce,account:current.account,documentId:current.documentId,url:current.url};
  try{return Promise.resolve(api.runtime.sendMessage(reply)).catch(()=>undefined)}catch{return undefined}
 };
 function identityAffected(records){
  if(!Array.isArray(records)||!records.length)return true;
  const hasIdentity=node=>node===observedIdentity||!!node?.contains?.(observedIdentity)||!!node?.matches?.(selector)||!!node?.querySelector?.(selector);
  return records.some(record=>{const target=record.target;if(target?.closest?.('#cor3-helper-shell,#cor3-helper-controls,#cor3-helper-diagnostics'))return false;
   if(record.type==='attributes')return record.attributeName==='data-component-name'||target===observedIdentity||!!target?.contains?.(observedIdentity);
   if(record.type==='characterData')return target===observedIdentity||!!observedIdentity?.contains?.(target);
   if(record.type==='childList')return target===observedIdentity||!!observedIdentity?.contains?.(target)||[...(record.addedNodes||[]),...(record.removedNodes||[])].some(hasIdentity);
   return true;
  });
 }
 const observer=new root.MutationObserver(records=>{if(identityAffected(records))check();});observer.observe(root.document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','aria-hidden','inert','style','class','data-component-name']});
 api.storage?.onChanged?.addListener((changes,area)=>{
  if(!hard&&area==='local'&&changes.cor3CenterRuntimeEpoch){announced=null;nextAttempt=0;announce(refresh(),true);}
 });
 const timer=setInterval(check,500);api.runtime.onMessage.addListener(listener);for(const e of ['pagehide','popstate','hashchange'])root.addEventListener(e,revoke,{once:true});
 root.Cor3CenterIdentity=Object.freeze({status:()=>({...connection}),snapshot(){const current=refresh();return current.code?null:Object.freeze({accountId:current.account,documentId:current.documentId,url:current.url});}});
 check();
})(globalThis);
