/* Callback reads share one attempt per key. Callers retain the endpoint until a
 * terminal result; an unacknowledged endpoint/configure command stays blocked. */
(function(root){'use strict';
 function create({epoch,allowed,listen,send,configure,pickConfig,trackMarket=()=>{},unreachable=()=>null,notify=()=>{},setTimer=setTimeout,clearTimer=clearTimeout,setPending=()=>{}}){
  const runs=new Map();
  function begin(key,callback){
   let old=runs.get(key);if(old&&!old.valid())old.finish({status:'cancelled',code:'SCOPE_CHANGED'});
   old=runs.get(key);if(old){if(typeof callback==='function')old.callbacks.push(callback);return null;}
   const captured=epoch(),cleanups=new Set(),callbacks=typeof callback==='function'?[callback]:[];let closed=false;
   const valid=()=>!closed&&allowed()&&epoch()===captured;
   const report=(status,code)=>notify({key,status,code});
   const finish=result=>{if(closed)return;const effective=valid()?result:{status:'cancelled',code:'SCOPE_CHANGED'};closed=true;for(const cleanup of cleanups)cleanup();cleanups.clear();if(runs.get(key)===op)runs.delete(key);report(effective.status,effective.code||'READ_COMPLETE');for(const cb of callbacks.splice(0)){try{cb(effective);}catch{}}};
   const later=(fn,ms)=>{let id;const cleanup=()=>clearTimer(id);cleanups.add(cleanup);id=setTimer(()=>{cleanups.delete(cleanup);if(!valid()){finish({status:'cancelled',code:'SCOPE_CHANGED'});return;}fn();},ms);return cleanup;};
   const on=(predicate,fn)=>{const remove=listen(data=>{if(!valid()){finish({status:'cancelled',code:'SCOPE_CHANGED'});return;}if(predicate(data))fn(data);});cleanups.add(remove);return ()=>{cleanups.delete(remove);remove();};};
   const packet=(name,action,data)=>{if(!valid()){finish({status:'cancelled',code:'SCOPE_CHANGED'});return false;}const ok=send('42'+JSON.stringify(['event',{event:{name,action},data}]));if(ok===false){finish({status:'unavailable',code:'TRANSPORT_UNAVAILABLE'});return false;}return true;};
   const op={key,callbacks,valid,finish,later,on,packet,report,cleanup:fn=>cleanups.add(fn)};runs.set(key,op);report('loading','READ_STARTED');return op;
  }
  function endpoint(op,spec,next){
   if(!spec.serverId){next();return;}
   if(unreachable(spec.marketType)){op.finish({status:'unavailable',code:'MARKET_UNREACHABLE'});return;}
   setPending(spec.marketType,true);op.cleanup(()=>setPending(spec.marketType,false));
   let blocked=false;
   const remove=op.on(data=>data.type==='COR3_WS_ENDPOINT_RESULT'&&(!(data.serverId||data.data?.serverId)||(data.serverId||data.data?.serverId)===spec.serverId)||data.type===spec.unreachableType,data=>{
    remove();timeout();setPending(spec.marketType,false);
    if(data.type===spec.unreachableType||data.success===false||data.error){op.finish({status:'unavailable',code:'MARKET_UNREACHABLE'});return;}
    if(blocked)op.report('loading','READ_RESUMED');next();
   });
   const timeout=op.later(()=>{blocked=true;op.report('blocked','ENDPOINT_UNCONFIRMED');},5000);
   op.packet('network-map','set.endpoint',{serverId:spec.serverId});
  }
  function market(spec,callback){
   const op=begin('market:'+spec.marketType+':'+(spec.jobsOnly?'jobs':'all'),callback);if(!op)return true;
   endpoint(op,spec,()=>{
    trackMarket(spec.marketId);
    const remove=op.on(d=>d.type==='COR3_MARKET_FETCH_COMPLETE'&&d.marketType===spec.marketType&&(!d.marketId||d.marketId===spec.marketId),()=>op.finish({status:'ok'}));
    op.later(()=>{remove();op.finish({status:'partial',code:'MARKET_DATA_TIMEOUT'});},15000);
    if(!op.packet('market','get.options',{marketId:spec.marketId}))return;
    if(!spec.jobsOnly&&!op.packet('market','get.lots',{marketId:spec.marketId}))return;
    op.packet('market','get.jobs',{marketId:spec.marketId});
   });return true;
  }
  function mercenaries(spec,callback){
   const op=begin('merc:'+spec.marketType,callback);if(!op)return true;
   endpoint(op,spec,()=>{
    let mercs=null,config=null,haveMercs=false,haveConfig=false,started=false;
    const timeout=op.later(()=>op.finish({status:'partial',code:'MERC_DATA_TIMEOUT'}),30000);
    const remove=op.on(d=>d.type===spec.mercType||d.type===spec.configType,data=>{
     if(data.type===spec.mercType){if(data.error){op.finish({status:'partial',code:'MERC_READ_FAILED'});return;}mercs=data.data;haveMercs=true;}
     if(data.type===spec.configType){if(data.error){op.finish({status:'partial',code:'CONFIG_READ_FAILED'});return;}config=pickConfig(data.data?.locations,spec.marketType);haveConfig=true;}
     if(started||!haveMercs||!haveConfig)return;started=true;remove();timeout();
     const list=Array.isArray(mercs)?mercs:Array.isArray(mercs?.mercenaries)?mercs.mercenaries:null;
     if(!list){op.finish({status:'partial',code:'MERC_DATA_INVALID'});return;}
     const ids=[...new Set([...list,...(mercs?.eliteSlots||[]).map(x=>x?.mercenary)].filter(x=>x?.id).map(x=>x.id))];
     if(!ids.length){op.finish({status:'ok'});return;}
     if(!config?.locationConfigId||!config.zoneConfigId||!config.goalId){op.finish({status:'partial',code:'CONFIG_UNAVAILABLE'});return;}
     let index=0;
     function next(){
      if(!op.valid()){op.finish({status:'cancelled',code:'SCOPE_CHANGED'});return;}
      if(index>=ids.length){op.finish({status:'ok'});return;}
      const mercenaryId=ids[index++];let blocked=false;
      const off=op.on(d=>d.type==='COR3_WS_MERC_CONFIGURE'&&d.mercenaryId===mercenaryId,d=>{
       off();timer();if(d.error){op.finish({status:'partial',code:'MERC_CONFIGURE_FAILED'});return;}
       if(blocked)op.report('loading','READ_RESUMED');op.later(next,200);
      });
      const timer=op.later(()=>{blocked=true;op.report('blocked','MERC_CONFIGURE_UNCONFIRMED');},5000);
      if(configure(mercenaryId,spec.marketId,config.locationConfigId,config.zoneConfigId,config.goalId)===false)op.finish({status:'unavailable',code:'TRANSPORT_UNAVAILABLE'});
     }
     next();
    });
    if(!op.packet('expeditions','get.mercenaries',{marketId:spec.marketId}))return;
    op.later(()=>op.packet('expeditions','get.config',{marketId:spec.marketId}),500);
   });return true;
  }
  function droneOptions(callback){
   const op=begin('drone:options',callback);if(!op)return true;
   op.on(d=>d.action==='get.options'&&(d.type==='COR3_WS_DRONE_OPTIONS'||d.type==='COR3_WS_DRONE_ERROR'),d=>{
    op.finish(d.type==='COR3_WS_DRONE_OPTIONS'?{status:'ok'}:{status:'partial',code:'DRONE_OPTIONS_FAILED'});
   });
   op.later(()=>op.finish({status:'partial',code:'DRONE_OPTIONS_TIMEOUT'}),15000);
   return op.packet('drone-missions','get.options',{});
  }
  return Object.freeze({market,mercenaries,droneOptions,cancelAll(){for(const op of [...runs.values()])op.finish({status:'cancelled',code:'READ_CANCELLED'});},active:()=>runs.size});
 }
 root.Cor3ReadRuntimeFactory=Object.freeze({create});
})(globalThis);
