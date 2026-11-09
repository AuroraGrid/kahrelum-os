'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('./champion_v05.cjs');
const ext = require('../registry-model-v04/registry_2018_2020.json');
const old = require('../expanded-model-v02/inputs.json');
const rec = require('../stress-audit-v03/reconciliation_v03.json');
const deps = {ext,old,rec};
test('historical comparison uses five chronological holdouts with past-only training',()=>{
 const x=m.researchAudit(deps);
 for(const mode of ['twoDay','deadlineOnly']){
  const s=x.backtests[mode];
  assert.deepEqual(s.map(v=>v.year),[2021,2022,2023,2024,2025]);
  for(const row of s) assert.ok(row.trainingYears.every(y=>y<row.year));
 }
});
test('champion selection uses proper ranked probability score over exactly comparable cutoffs',()=>{
 const x=m.researchAudit(deps);
 assert.equal(x.champions.twoDay.name,'NAIVE_POISSON_MEAN');
 assert.equal(x.champions.deadlineOnly.name,'NAIVE_POISSON_MEAN');
 for(const key of ['twoDay','deadlineOnly']){
  const c=x.champions[key];
  assert.equal(c.reason,'LOWER_HISTORICAL_WALKFORWARD_RPS');
  assert.ok(c.bestMeanRps<c.runnerUpMeanRps);
 }
});
test('no model selection can score retrospective training samples as separate trials',()=>{
 const x=m.researchAudit(deps);
 assert.equal(x.performanceScoreboardUpdated,false);
 assert.equal(x.internalTestsCountAsOfficialForecasts,false);
 assert.equal(x.officialKahrelumPrediction,null);
 assert.equal(x.officialPredictionLock,null);
});
test('input provenance and classification prevent a scorecard promotion',()=>{
 const x=m.researchAudit(deps);
 assert.equal(x.lifecycle,'RESEARCH_ONLY_NOT_ISSUED');
 assert.equal(x.canPublishOfficialProjection,false);
 assert.equal(x.historicalUniqueTrades,59);
 assert.equal(x.historySeasons,8);
});
test('Bates and new external reports cannot be counted as additional generic Bernoulli events',()=>{
 const x=m.researchAudit(deps);
 assert.equal(x.model.pendingTradeAddOnAllowed,false);
 assert.equal(x.model.insiderSkillWeightsEmpiricallyFitted,false);
 assert.equal(x.sources.history,'NFL_MONTHLY_TRANSACTIONS_REGISTER');
});
test('historical mean-based Poisson is normalized and its mean matches the training set',()=>{
 const x=m.researchAudit(deps);
 const full=m.championDistribution(x,'twoDay');
 assert.ok(Math.abs(full.reduce((a,b)=>a+b,0)-1)<1e-10);
 assert.ok(Math.abs(full.reduce((s,p,i)=>s+i*p,0)-x.trainingRates.twoDay)<1e-8);
});
test('2026 completion requires a fresh source-matched cutoff and explicit user permission',()=>{
 const x=m.researchAudit(deps);
 assert.equal(x.original2026Snapshot.baseline,8);
 assert.equal(x.original2026Snapshot.asOfET,'2026-11-09T12:16:16-05:00');
 assert.equal(x.target2026.status,'NOT_FIXED');
 assert.equal(x.target2026.uniqueTargetConvention,'NFL_MONTHLY_TRANSACTIONS_REGISTER');
});
test('historical regime sensitivity does not overwrite the champion',()=>{
 const x=m.researchAudit(deps);
 assert.ok(x.sensitivity.trainingRatesWithoutCovid.twoDay>0);
 assert.ok(x.sensitivity.trainingRatesWeek9Only.twoDay>0);
 assert.equal(x.champions.twoDay.name,'NAIVE_POISSON_MEAN');
});
