/* Own-profile three-solver preferences. No account routing or game operations. */
(function(root){'use strict';
 const KEYS=Object.freeze(['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled']),PREFIX='cor3SolverProfile:',VERSION='r11-explicit-reset-v1',BASE=PREFIX+VERSION+':';
 const error=code=>Object.assign(Error(code),{code});
 function create({api=root.chrome||root.browser,storage=api.storage.local}={}){
  let queue=Promise.resolve();const hooks=new Set(),uncertain=new Set();
  const serial=f=>{const task=queue.then(f);queue=task.catch(()=>{});return task;};
  async function phase(name,values,verify){const done=BASE+name,attempt=done+':attempt';await verify();const old=await storage.get([done,attempt]);await verify();if(old[done]===VERSION)return;
   if(old[done]!==undefined||(old[attempt]!==undefined&&old[attempt]!==VERSION))throw error('SOLVER_MIGRATION_REVIEW_REQUIRED');
   if(old[attempt]===VERSION){const actual=await storage.get(Object.keys(values));await verify();if(!Object.entries(values).every(([k,v])=>actual[k]===v))throw error('SOLVER_MIGRATION_REVIEW_REQUIRED');}
   else {if(uncertain.has(done))throw error('SOLVER_MIGRATION_REVIEW_REQUIRED');uncertain.add(done);await storage.set({[attempt]:VERSION});const p=await storage.get(attempt);await verify();if(p[attempt]!==VERSION)throw error('SOLVER_MIGRATION_INCOMPLETE');await storage.set(values);const actual=await storage.get(Object.keys(values));await verify();if(!Object.entries(values).every(([k,v])=>actual[k]===v))throw error('SOLVER_MIGRATION_INCOMPLETE');}
   await verify();await storage.set({[done]:VERSION});const completed=await storage.get(done);await verify();if(completed[done]!==VERSION)throw error('SOLVER_MIGRATION_INCOMPLETE');uncertain.delete(done);
  }
  async function read(){const raw=await storage.get([...KEYS.map(k=>PREFIX+k),'helperMode',BASE+'preferences',BASE+'pause']);if(raw[BASE+'preferences']!==VERSION||raw[BASE+'pause']!==VERSION)throw error('SOLVER_MIGRATION_INCOMPLETE');const values=Object.fromEntries(KEYS.map(k=>[k,raw[PREFIX+k]]));values.helperMode=raw.helperMode;if(Object.values(values).some(v=>typeof v!=='boolean'))throw error('SOLVER_PREFERENCES_UNKNOWN');return Object.freeze(values);}
  const changed=(changes,area)=>{if(area==='local'&&Object.keys(changes).some(k=>k==='helperMode'||KEYS.some(n=>k===PREFIX+n)))for(const h of hooks)try{h()}catch{}};api.storage.onChanged?.addListener(changed);
  return Object.freeze({initialize(verify){return serial(async()=>{if(typeof verify!=='function')throw error('SOLVER_SCOPE_REQUIRED');await phase('preferences',Object.fromEntries(KEYS.map(k=>[PREFIX+k,true])),verify);await phase('pause',{helperMode:false},verify);await verify();return read();});},get:()=>serial(read),set(values,verify){return serial(async()=>{if(!values||Array.isArray(values)||!Object.keys(values).length||Object.entries(values).some(([k,v])=>![...KEYS,'helperMode'].includes(k)||typeof v!=='boolean')||typeof verify!=='function')throw error('SOLVER_PREFERENCES_INVALID');await verify();await read();const data=Object.fromEntries(Object.entries(values).map(([k,v])=>[k==='helperMode'?k:PREFIX+k,v]));await storage.set(data);const result=await read();await verify();if(Object.entries(values).some(([k,v])=>result[k]!==v))throw error('SOLVER_PREFERENCES_UNKNOWN');return result;});},onChanged(f){hooks.add(f);return()=>hooks.delete(f)}});
 }
 root.Cor3SolverProfileFactory=Object.freeze({create,keys:KEYS,prefix:PREFIX,version:VERSION});if((root.chrome||root.browser)?.storage?.local)root.Cor3SolverProfile=create();
})(globalThis);
