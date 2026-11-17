import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const scope = vm.createContext({});
vm.runInContext(readFileSync(new URL('../extension/expedition-priority.js', import.meta.url), 'utf8'), scope);
const rules = scope.Cor3ExpeditionPriority;

test('pinning a mercenary does not bypass cost, elite or destination constraints', () => {
  const candidates = [
    {id:'preferred', status:'AVAILABLE', _isElite:true, _locationUnavailable:true},
    {id:'alternate', status:'AVAILABLE'}
  ];
  const quotes = {preferred:{totalCost:150}, alternate:{totalCost:60}};
  assert.equal(rules.selectMercenary(candidates, quotes, {mercenaryId:'preferred'}).id, 'preferred');
  for (const policy of [{applyMercCostLimiter:true,maxMercCost:100},{ignoreEliteMerc:true},{locationConfigId:'site'}]) {
    assert.equal(rules.selectMercenary(candidates, quotes, {...policy,mercenaryId:'preferred'}).id, 'alternate');
  }
  assert.equal(rules.selectMercenary(candidates, quotes, {applyMercCostLimiter:true,maxMercCost:50}).id, null);
  assert.equal(rules.selectExpeditionLocation({locations:[{id:'old'}]}, {locationConfigId:'missing'}, []), null);
});

test('credit floor and full charge wait for confirmed values; chosen missions never silently change', () => {
  assert.equal(rules.shouldPauseForCredits({}, undefined), false);
  assert.equal(rules.shouldPauseForCredits({pauseBelowCredits:true,minCredits:100}, undefined), true);
  assert.equal(rules.shouldPauseForCredits({pauseBelowCredits:true,minCredits:100}, 100), false);
  assert.equal(rules.shouldWaitForFullCharge(undefined, {fullChargeOnly:true}), true);
  assert.equal(rules.shouldWaitForFullCharge({current:50,max:50}, {fullChargeOnly:true}), false);
  const options = {locations:[{id:'a',missions:[{id:'one'},{id:'two'}]}]};
  assert.equal(rules.pickDroneMission(options,{autoChooseLocation:false,locationConfigId:'a',missionId:'two'}).id,'two');
  assert.equal(rules.pickDroneMission(options,{autoChooseLocation:false,locationConfigId:'a',missionId:'gone'}),null);
});
