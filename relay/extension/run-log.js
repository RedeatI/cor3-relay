/* Redaction adapted from SaltApocalypse/cor3-helper v2.0.0-salta; see LICENSE.upstream. */
(function(root){'use strict';
 const sensitive=/authorization|cookie|(?:^|[_-])(?:token|jwt|session(?:id)?|password|secret|api.?key)(?:$|[_-])|bearerToken|accessToken|refreshToken/i;
 function text(value){return String(value).replace(/\bBearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+/=-]+/gi,'Bearer [REDACTED]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[REDACTED_JWT]').replace(/(["']?(?:authorization|cookie|password|secret|token|session(?:id)?|access[_-]?token|refresh[_-]?token|bearerToken|api[_-]?key)["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}]+)/gi,'$1[REDACTED]');}
 function redact(input){const seen=new WeakSet();function visit(v,key='',depth=0){if(sensitive.test(key))return '[REDACTED]';if(typeof v==='string')return text(v).slice(0,2000);if(v==null||typeof v!=='object')return typeof v==='function'?'[Function]':v;if(depth>8)return '[Depth]';if(seen.has(v))return '[Circular]';seen.add(v);if(v instanceof Error)return {name:v.name,message:text(v.message),stack:text(v.stack||'').slice(0,2000)};if(Array.isArray(v))return v.slice(0,80).map(x=>visit(x,'',depth+1));return Object.fromEntries(Object.entries(v).slice(0,80).map(([k,x])=>[k,visit(x,k,depth+1)]));}try{return visit(input);}catch{return '[Unserializable]';}}
 function create({scope=()=>null,now=()=>Date.now(),sink=()=>{}}={}){
  let key=null,entries=[],pending=null,flight=null;const stats={accepted:0,persisted:0,coalesced:0,discarded:0};
  function drain(){if(flight)return flight;const run=async()=>{while(pending){const payload=pending;pending=null;const s=scope();if(s?.accountId!==payload.accountId||s.documentId!==payload.documentId){++stats.discarded;continue;}try{await sink(payload);++stats.persisted;}catch{++stats.discarded;}}};flight=Promise.resolve().then(run).finally(()=>{flight=null;if(pending)void drain();});flight.catch(()=>{});return flight;}
  function log(code,message='',data=null,level='info'){
   const current=scope();if(!current?.documentId||!current?.accountId)return;
   const nextKey=current.accountId+':'+current.documentId;if(nextKey!==key){key=nextKey;entries=[];}
   if(!/^[a-z][a-z0-9.-]{0,63}$/.test(code))return;
   const at=now(),previous=entries.at(-1),safeMessage=text(message).slice(0,240),safeData=redact(data),safeLevel=['info','warn','error','debug'].includes(level)?level:'info';
   if(previous?.code===code&&previous.level===safeLevel&&previous.message===safeMessage&&JSON.stringify(previous.data)===JSON.stringify(safeData)&&at-previous.at<1000)return;
   entries=entries.filter(x=>x.at>at-8*3600000).slice(-119);
   entries.push({at,code,level:safeLevel,message:safeMessage,data:safeData});++stats.accepted;
   const payload={accountId:current.accountId,documentId:current.documentId,entries:entries.map(x=>({...x}))};
   if(pending)++stats.coalesced;pending=payload;void drain();
  }
  return Object.freeze({log,flush:async()=>{while(flight||pending){if(!flight)drain();await flight;}},snapshot:()=>entries.map(x=>({...x})),stats:()=>({...stats})});
 }
 root.Cor3RunLog=Object.freeze({text,redact,create});
})(globalThis);
