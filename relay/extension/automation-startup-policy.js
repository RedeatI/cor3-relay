/* Desired pause is a user preference; missing is false. Binding is a separate gate. */
(function(root){
 'use strict';const KEY='cor3CenterStartupVersion',RUNTIME='cor3CenterRuntimeEpoch',VERSION='center-defaults-v2';let initialized=false,sequence=0;
 const effectivePaused=value=>!initialized||value!==false;
 async function readState(api){const current=++sequence;try{const data=await api.storage.local.get([KEY,RUNTIME,'helperMode']);if(current!==sequence)return {helperMode:true};initialized=data[KEY]===VERSION&&typeof data[RUNTIME]==='string'&&/^[a-f0-9]{32}$/.test(data[RUNTIME]);return {helperMode:effectivePaused(data.helperMode)}}catch(e){if(current===sequence)initialized=false;throw e}}
 async function initializeBackground(api){initialized=false;const current=++sequence;try{
  const saved=await api.storage.local.get('helperMode');
  // Preserve true even when its historical provenance is unknown; never relabel it user-authored.
  if(!Object.prototype.hasOwnProperty.call(saved,'helperMode')||saved.helperMode===undefined)await api.storage.local.set({helperMode:false});
  const runtimeEpoch=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  await api.storage.local.set({[KEY]:VERSION,[RUNTIME]:runtimeEpoch});
  const data=await api.storage.local.get('helperMode');if(current!==sequence)return {helperMode:true};
  if(typeof data.helperMode!=='boolean')throw Error('CENTER_PAUSE_PREFERENCE_UNKNOWN');
  initialized=true;return {helperMode:data.helperMode};
 }catch(e){if(current===sequence)initialized=false;throw e}}
 root.Cor3CandidateStartup=Object.freeze({key:KEY,runtimeKey:RUNTIME,version:VERSION,readState,initializeBackground,effectivePaused,isInitialized:()=>initialized});
})(globalThis);

