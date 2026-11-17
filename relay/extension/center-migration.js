/* Explicit user-authorized r8 reset. Own extension storage.local only; no game/native calls. */
(function(root){'use strict';
 const VERSION='r8-explicit-reset-v1';
 const error=code=>Object.assign(Error(code),{code});
 const ACCOUNTS=Object.freeze([]);
 const KEYS=Object.freeze(['autoDecryptEnabled','autoIceWallEnabled','autoSimpleDecryptEnabled']);
 const BASE='cor3CenterMigration:'+VERSION+':';
 const marker=(scope,account)=>BASE+scope+(account?':'+account:'');
 const done=record=>record===VERSION;
 function create({storage=(root.chrome||root.browser)?.storage?.local,accounts=ACCOUNTS}={}){
  accounts=Object.freeze(Array.from(accounts));
  let chain=Promise.resolve();const uncertain=new Set();
  async function phase(scope,account,values,assertCurrent){
   const finish=marker(scope,account),attempt=finish+':attempt';
   await assertCurrent();const existing=await storage.get([finish,attempt]);await assertCurrent();
   if(done(existing[finish]))return {changed:false};
   // Pending phases may converge only by completing a marker, never replaying values.
   if(existing[finish]!==undefined||(existing[attempt]!==undefined&&existing[attempt]!==VERSION))throw error('CENTER_MIGRATION_REVIEW_REQUIRED');
   if(existing[attempt]===VERSION){
    try{
     const actual=await storage.get(Object.keys(values));await assertCurrent();
     if(!Object.entries(values).every(([k,v])=>actual[k]===v))throw error('CENTER_MIGRATION_REVIEW_REQUIRED');
     await assertCurrent();await storage.set({[finish]:VERSION});
     const verified=await storage.get(finish);await assertCurrent();
     if(!done(verified[finish]))throw error('CENTER_MIGRATION_INCOMPLETE');
     uncertain.delete(finish);return {changed:true};
    }catch(e){uncertain.add(finish);throw error(e.code==='CENTER_MIGRATION_REVIEW_REQUIRED'?'CENTER_MIGRATION_REVIEW_REQUIRED':'CENTER_MIGRATION_INCOMPLETE');}
   }
   if(uncertain.has(finish))throw error('CENTER_MIGRATION_REVIEW_REQUIRED');
   let started=false;
   try{
    await assertCurrent();started=true;await storage.set({[attempt]:VERSION});
    const pending=await storage.get(attempt);await assertCurrent();if(pending[attempt]!==VERSION)throw error('CENTER_MIGRATION_VERIFY_FAILED');
    await assertCurrent();await storage.set(values);
    const actual=await storage.get(Object.keys(values));await assertCurrent();if(!Object.entries(values).every(([k,v])=>actual[k]===v))throw error('CENTER_MIGRATION_VERIFY_FAILED');
    // Completion marker is separate and strictly after verified data; attempt is retained as audit metadata.
    await assertCurrent();await storage.set({[finish]:VERSION});
    const verified=await storage.get(finish);await assertCurrent();if(!done(verified[finish]))throw error('CENTER_MIGRATION_VERIFY_FAILED');return {changed:true};
   }catch(e){if(started)uncertain.add(finish);throw error('CENTER_MIGRATION_INCOMPLETE');}
  }
  async function run(account,assertCurrent){
   if(typeof assertCurrent!=='function')throw error('CENTER_MIGRATION_CONTEXT_REQUIRED');
   await assertCurrent();if(!accounts.includes(account))return {applied:false,code:'CENTER_MIGRATION_OUT_OF_SCOPE'};
   const prefix='center:'+account+':';
   const a=await phase('account',account,Object.fromEntries(KEYS.map(k=>[prefix+k,true])),assertCurrent);
   // Global unpause is attempted only after this account's three preferences have completed.
   const p=await phase('profile',null,{helperMode:false},assertCurrent);
   await assertCurrent();return {applied:a.changed||p.changed,accountChanged:a.changed,profileChanged:p.changed,code:'CENTER_MIGRATION_COMPLETE'};
  }
  return Object.freeze({apply(account,assertCurrent){const task=chain.then(()=>run(account,assertCurrent));chain=task.catch(()=>{});return task;}});
 }
 root.Cor3CenterMigrationFactory=Object.freeze({create,accounts:ACCOUNTS,keys:KEYS,version:VERSION,marker});
 // r11 owns the sole reset. Keep this historical factory for regression tests,
 // but a late account probe must never replay r8 after a user pauses r11.
 if((root.chrome||root.browser)?.storage?.local)root.Cor3CenterMigration=Object.freeze({async apply(account,assertCurrent){if(typeof assertCurrent!=='function')throw error('CENTER_MIGRATION_CONTEXT_REQUIRED');await assertCurrent();return {applied:false,code:'CENTER_MIGRATION_SUPERSEDED_BY_PAGE_PROFILE'};}});
})(globalThis);

