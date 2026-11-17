/* Isolated top-frame page-generation nonce; never reads account identity or DOM contents. */
(function(root){'use strict';if(root.window.top!==root.window||root.Cor3SolverPageDocument)return;const api=root.chrome||root.browser;const documentId=Array.from(root.crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');const original=root.location.href;let revoked=false;
 const valid=()=>{try{const u=new URL(root.location.href);return !revoked&&u.href===original&&u.protocol==='https:'&&['cor3.gg','os.cor3.gg'].includes(u.hostname)&&!u.port&&!u.username&&!u.password}catch{return false}};
 function revoke(){if(revoked)return;revoked=true;try{Promise.resolve(api.runtime.sendMessage({type:'solverPageRevoked',documentId})).catch(()=>{})}catch{}}
 api.runtime.onMessage.addListener((m,s)=>{if(s?.id!==api.runtime.id||s.tab||m?.type!=='solverPageProbe'||Object.keys(m).sort().join('|')!=='nonce|type'||!/^[a-f0-9]{32}$/.test(m.nonce))return;if(!valid()){revoke();return;}return api.runtime.sendMessage({type:'solverPageObservation',nonce:m.nonce,documentId,url:original});});
 for(const e of ['pagehide','popstate','hashchange'])root.addEventListener(e,revoke,{once:true});root.Cor3SolverPageDocument=Object.freeze({snapshot(){if(!valid()){revoke();return null;}return Object.freeze({documentId,url:original});}});
})(globalThis);
