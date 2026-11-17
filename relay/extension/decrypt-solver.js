// decrypt-solver.js
// Auto-solver for "decrypt" hacking minigame on cor3.gg
// Injected into MAIN world. Controllable via window.__solverAbort flag.
// Updated for the new arrow-key-based UI (no text input).

(function () {
  'use strict';
  // Correlation ticket only: MAIN world is not an authentication boundary.
  const lifecycleTicket = document.currentScript?.dataset?.cor3LifecycleTicket;
  const lifecycleRun = window.__cor3SolverLifecycle?.begin('decrypt', lifecycleTicket);
  if (!lifecycleRun) return;
  const owner = Object.freeze({});
  window.__cor3DecryptRunOwner = owner;
  window.__solverActive = true;
  window.__solverAbort = false;
  function masterAllowed() {
    return lifecycleRun.valid() && window.__cor3DecryptRunOwner === owner && !window.__solverAbort;
  }
  function cleanup() {
    lifecycleRun.finish();
    if (window.__cor3DecryptRunOwner === owner) {
      window.__solverActive = false;
      // A stale finalizer must never reset abort or clear a newer run.
      window.__cor3DecryptRunOwner = null;
    }
  }


  const sleep=ms=>lifecycleRun.sleep(ms),normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
  const codeError=code=>Object.assign(Error(code),{code});
  function report(code,level='info'){console.log('[COR3 Terminal] '+code);window.postMessage({type:'COR3_DECRYPT_STATUS',lifecycleTicket,code,level,message:code},location.origin);}
  function visible(node){return !!node?.isConnected&&!!node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden';}
  function findHackContainer(){const apps=[...document.querySelectorAll('[data-sentry-component="ConfigHackApplication"], [data-component-name="ConfigHackApplication"]')].filter(visible);return apps.length===1?apps[0]:null;}
  function logRoot(app){return app?.querySelector('[data-sentry-element="LogContentStyled"][data-sentry-source-file="config-hack-application.tsx"]')||null;}
  function logText(log){return String(log?.innerText||log?.textContent||'');}
  function fieldButtons(app){return [...(app?.querySelectorAll('[data-sentry-component="ParameterCells"] button[type="button"], [data-component-name="ParameterCells"] button[type="button"]')||[])].filter(b=>b.getAttribute('data-sentry-element')!=='SendButtonStyled');}
  function fieldValues(app){return fieldButtons(app).map(b=>{const spans=b.querySelectorAll('span');return spans.length>=2?normalize(spans[1].textContent):null;});}
  function detectFields(text){const fields=[];for(const line of String(text).split(/\r?\n/)){const m=line.match(/→\s*(.+)/);if(!m)continue;const values=m[1].split('/').map(normalize);if(values.length>1&&values.every(Boolean))fields.push(values);}return fields;}
  function responseRecords(text){const rows=[],rx=/(?:Input|输入)\s*[:：]\s*([\s\S]*?)\s*(?:Result|结果)\s*[:：]\s*(?:Mismatched|不匹配(?:数量|数)?|未匹配(?:数量|数)?)\s*[:：]?\s*(\d+)/gi;let m;while((m=rx.exec(text)))rows.push({combo:normalize(m[1]),mismatch:Number(m[2])});return rows;}
  function counts(rows){const values=new Map();for(const row of rows){const k=row.combo+'\n'+row.mismatch;values.set(k,(values.get(k)||0)+1);}return values;}
  function freshResponse(before,after,combo){const old=counts(before),seen=new Map();for(const row of after){const k=row.combo+'\n'+row.mismatch,n=(seen.get(k)||0)+1;seen.set(k,n);if(row.combo===combo&&n>(old.get(k)||0))return row.mismatch;}return null;}
  function combinations(fields){if(!fields.length||fields.length>8||fields.some(f=>f.length<2||f.length>12||new Set(f).size!==f.length))throw codeError('TERMINAL_FIELDS_UNSUPPORTED');const size=fields.reduce((n,f)=>n*f.length,1);if(size>512)throw codeError('TERMINAL_FIELDS_UNSUPPORTED');let all=[[]];for(const f of fields)all=all.flatMap(row=>f.map((_,i)=>[...row,i]));return all;}
  function distance(a,b){return a.reduce((n,x,i)=>n+(x!==b[i]),0);}
  // Bounded minimax partitions; no recursive depth search can block the game UI.
  function chooseGuess(all,candidates,tried){if(candidates.length===1&&!tried.has(candidates[0]))return candidates[0];let best=-1,bestScore=null;const possible=new Set(candidates);for(let g=0;g<all.length;g++){if(tried.has(g))continue;const bins=Array(all[g].length+1).fill(0);for(const p of candidates)bins[distance(all[g],all[p])]++;const score=[Math.max(...bins),bins.reduce((n,x)=>n+x*x,0),possible.has(g)?0:1,g];if(!bestScore||score.some((v,i)=>v<bestScore[i]&&score.slice(0,i).every((x,j)=>x===bestScore[j]))){best=g;bestScore=score;}}return best;}
  function validSession(s){return masterAllowed()&&findHackContainer()===s.app&&logRoot(s.app)===s.log&&visible(s.log)&&fieldButtons(s.app).length===s.fields.length;}
  function assertSession(s){if(!validSession(s))throw codeError('TERMINAL_SESSION_CHANGED');}
  async function key(s,key,keyCode){assertSession(s);for(const type of ['keydown','keyup']){assertSession(s);s.app.dispatchEvent(new KeyboardEvent(type,{key,code:key,keyCode,which:keyCode,bubbles:true,cancelable:true}));}}
  async function waitValueChange(s,index,before,timeout=1500){const start=Date.now();while(true){assertSession(s);const values=fieldValues(s.app);if(!values.every((v,i)=>s.fields[i].includes(v)))throw codeError('TERMINAL_FIELDS_CHANGED');if(values[index]!==before)return;if(Date.now()-start>=timeout)throw codeError('TERMINAL_NAVIGATION_UNCONFIRMED');await sleep(25);}}
  async function submitGuess(s,indices){assertSession(s);s.app.focus();await sleep(40);for(let i=0;i<s.fields.length;i++){await key(s,'ArrowLeft',37);await sleep(25);}
   for(let f=0;f<s.fields.length;f++){if(f){await key(s,'ArrowRight',39);await sleep(40);}let settled=false;for(let tries=0;tries<s.fields[f].length*2+2;tries++){assertSession(s);const current=fieldValues(s.app)[f],options=s.fields[f],at=options.indexOf(current),target=indices[f];if(at<0)throw codeError('TERMINAL_FIELDS_CHANGED');if(at===target){settled=true;break;}const up=(target-at+options.length)%options.length,down=(at-target+options.length)%options.length;await key(s,down<=up?'ArrowDown':'ArrowUp',down<=up?40:38);await waitValueChange(s,f,current);}if(!settled)throw codeError('TERMINAL_NAVIGATION_UNCONFIRMED');}
   // Read every rendered value again immediately before the one Enter.
   await sleep(40);assertSession(s);if(!fieldValues(s.app).every((v,i)=>v===s.fields[i][indices[i]]))throw codeError('TERMINAL_NAVIGATION_UNCONFIRMED');const before=responseRecords(logText(s.log));await key(s,'Enter',13);return before;
  }
  async function waitForResponse(s,combo,before,timeout=15000){const start=Date.now();while(true){assertSession(s);const result=freshResponse(before,responseRecords(logText(s.log)),combo);if(result!==null)return result;if(Date.now()-start>=timeout)throw codeError('TERMINAL_RESPONSE_UNCONFIRMED');await sleep(50);}}
  function historyCandidates(all,fields,records){let candidates=all.map((_,i)=>i);for(const r of records){const values=r.combo.split(' ');if(values.length!==fields.length||r.mismatch>fields.length)continue;const indices=values.map((v,i)=>fields[i].indexOf(v));if(indices.some(i=>i<0))continue;candidates=candidates.filter(p=>distance(all[p],indices)===r.mismatch);}return candidates;}
  async function runSolver(s){assertSession(s);const all=combinations(s.fields),records=responseRecords(logText(s.log)).filter(r=>r.mismatch<=s.fields.length&&all.some(g=>g.map((x,i)=>s.fields[i][x]).join(' ')===r.combo));let candidates=historyCandidates(all,s.fields,records);const tried=new Set();for(const row of records){const index=all.findIndex(v=>v.map((x,i)=>s.fields[i][x]).join(' ')===row.combo);if(index>=0)tried.add(index);}if(records.some(r=>r.mismatch===0)){report('TERMINAL_ALREADY_MATCHED');return;}
   while(candidates.length){assertSession(s);const guess=chooseGuess(all,candidates,tried);if(guess<0)throw codeError('TERMINAL_FEEDBACK_INCONSISTENT');const combo=all[guess].map((x,i)=>s.fields[i][x]).join(' ');tried.add(guess);const before=await submitGuess(s,all[guess]);report('TERMINAL_GUESS_SUBMITTED');const mismatch=await waitForResponse(s,combo,before);if(mismatch<0||mismatch>s.fields.length)throw codeError('TERMINAL_FEEDBACK_INCONSISTENT');if(mismatch===0){report('TERMINAL_MATCHED');return;}candidates=candidates.filter(p=>distance(all[guess],all[p])===mismatch);report('TERMINAL_FEEDBACK_RECEIVED');await sleep(40);}
   throw codeError('TERMINAL_FEEDBACK_INCONSISTENT');
  }
  async function waitForMinigame(){let handledApp=null,handledLog=null;report('TERMINAL_WATCHING');while(masterAllowed()){await sleep(200);if(!masterAllowed())return;const app=findHackContainer(),log=logRoot(app);if(!app){handledApp=null;handledLog=null;continue;}if(app===handledApp&&log===handledLog)continue;if(!visible(log))continue;const fields=detectFields(logText(log)),values=fieldValues(app);if(!fields.length||values.length!==fields.length||!values.every((v,i)=>fields[i].includes(v)))continue;
    const session={app,log,fields};await sleep(50);if(!validSession(session))continue;handledApp=app;handledLog=log;report('TERMINAL_STARTED');try{await runSolver(session);}catch(e){if(!masterAllowed())return;const code=/^TERMINAL_[A-Z_]+$/.test(e?.code||'')?e.code:'TERMINAL_FAILED';report(code,code==='TERMINAL_SESSION_CHANGED'?'info':'error');} // No blind resubmit or reopening a challenge after an unknown result.
   }}
  waitForMinigame().catch(()=>{if(masterAllowed()){report('TERMINAL_FAILED','error');window.postMessage({type:'COR3_OBSERVABLE_ERROR',source:'decryptLifecycle',code:'SOLVER_FAILED',phase:'run'},location.origin);}}).finally(cleanup);
})();
