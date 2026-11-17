/* User-requested Daily/Markets defaults, applied once per verified account. */
(function(root) {
  'use strict';
  const marker='featureDefaultsDailyMarketsV1';
  const keys=Object.freeze(['autoUpdateMarkets','autoDailyHackEnabled']);
  function create(storage=(root.chrome||root.browser)?.storage?.local) {
    let chain=Promise.resolve();
    async function apply(account,check) {
      if(!/^FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}$/.test(account)||typeof check!=='function')throw Error('CENTER_DEFAULTS_CONTEXT_REQUIRED');
      const prefix='center:'+account+':',savedKey=prefix+marker;
      await check();const saved=await storage.get(savedKey);await check();
      if(saved[savedKey]===1)return {changed:false};
      if(saved[savedKey]!==undefined)throw Error('CENTER_DEFAULTS_VERSION_INVALID');
      const values=Object.fromEntries(keys.map(key=>[prefix+key,true]));
      values[savedKey]=1;
      await check();await storage.set(values);
      const actual=await storage.get(Object.keys(values));await check();
      if(!Object.entries(values).every(([key,value])=>actual[key]===value))throw Error('CENTER_DEFAULTS_SAVE_FAILED');
      return {changed:true};
    }
    return Object.freeze({apply(account,check){const next=chain.then(()=>apply(account,check));chain=next.catch(()=>{});return next;}});
  }
  root.Cor3CenterFeatureDefaultsFactory=Object.freeze({create,keys,marker});
  if((root.chrome||root.browser)?.storage?.local)root.Cor3CenterFeatureDefaults=create();
})(globalThis);
