/* Adapted from SaltApocalypse/cor3-helper v2.0.0-salta; see LICENSE.upstream. */
(function(root){'use strict';
 function plan({now=Date.now(),state=null,intervalMinutes=15}={}){
  const next=state?.nextTaskTime?new Date(state.nextTaskTime).getTime():NaN;
  if(!state||typeof state.hasClaimedToday!=='boolean')return {at:now+300000,reason:'state-unavailable'};
  if(!state.hasClaimedToday)return {at:now+300000,reason:'unclaimed'};
  if(Number.isFinite(next)&&next>now+60000)return {at:next+30000,reason:'next-task'};
  const interval=Number.isFinite(intervalMinutes)&&intervalMinutes>0?intervalMinutes:15;
  return {at:now+Math.min(interval*60000,900000),reason:'unknown-reset'};
 }
 root.Cor3DailySchedule=Object.freeze({plan});
})(globalThis);
