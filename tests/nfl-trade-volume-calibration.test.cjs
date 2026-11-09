'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const ledger=require('../research/nfl-2026-trade-deadline/2026-11-09_VOLUME_CALIBRATION_INPUTS.json');
const model=require('../scripts/nfl-trade-volume-calibration.cjs');

test('official deadline and historical references are fixed; no new KAHRELUM forecast',()=>{
  assert.equal(ledger.target.deadlineUtc,'2026-11-10T21:00:00Z');
  assert.equal(ledger.target.firstRegularSeasonDay,'2026-09-09');
  assert.equal(ledger.lifecycle,'RESEARCH_ONLY_NOT_ISSUED');
  assert.equal(ledger.kahrelumVolumeForecast,null);
  assert.equal(ledger.kahrelumVolumeLock,null);
  assert.deepEqual(ledger.historical.map(v=>[v.season,v.total]),[[2023,15],[2024,18],[2025,22]]);
  assert.ok(ledger.historical.every(v=>v.sourceUrl&&v.countingWindow));
});
test('only eight official tracker entries count; Bates report is excluded',()=>{
  assert.equal(model.validateLedger(ledger),true);
  assert.equal(model.completedTradeCount(ledger),8);
  assert.equal(ledger.reportedAgreements.length,1);
  assert.equal(ledger.reportedAgreements[0].tradeId,'BATES_ATL_JAX_20261109');
  assert.equal(ledger.reportedAgreements[0].status,'REPORTED_AGREEMENT_NOT_IN_OFFICIAL_TRACKER');
});
test('a two-player deal is counted once and duplicate trade IDs are deduplicated',()=>{
  const same={tradeId:'example-1',date:'2026-11-09',players:['A','B']};
  assert.equal(model.countUniqueTrades([same,{...same}]),1);
});
test('Schultz range is not normalized while its coverage window is unknown',()=>{
  const c=ledger.insiderClaims.find(v=>v.id==='SCHULTZ-2026-10-26');
  const a=model.alignInsiderHurdle(c,ledger);
  assert.equal(a.comparable,false);
  assert.equal(a.reason,'WINDOW_OR_POPULATION_UNVERIFIED');
  assert.equal(a.remainingLower,null);
});
test('Pelissero user reported statement is not treated as a verified source',()=>{
  const c=ledger.insiderClaims.find(v=>v.id==='PELISSERO-UNVERIFIED');
  assert.equal(c.provenance,'USER_REPORTED_UNVERIFIED');
  assert.equal(model.alignInsiderHurdle(c,ledger).comparable,false);
});
test('dated Schefter and Wolfe statements imply separate retrospective hurdles',()=>{
  const s=model.alignInsiderHurdle(ledger.insiderClaims.find(v=>v.id==='SCHEFTER-2026-10-26'),ledger);
  const w=model.alignInsiderHurdle(ledger.insiderClaims.find(v=>v.id==='WOLFE-2026-11-03'),ledger);
  assert.equal(s.comparable,true);assert.equal(s.knownAfterReference,4);assert.equal(s.remainingLower,6);
  assert.equal(w.comparable,true);assert.equal(w.knownAfterReference,1);assert.equal(w.remainingLower,9);
});
test('unknown time on a trade date blocks same-day date-only normalization',()=>{
  const c={id:'BOUNDARY_TEST',reporter:'Test',scope:'AFTER_DATE_TO_DEADLINE',startDate:'2026-10-27',provenance:'ATTRIBUTED_SECONDARY',min:10,max:null};
  const x=model.alignInsiderHurdle(c,ledger);
  assert.equal(x.comparable,false);
  assert.equal(x.reason,'SAME_DAY_TRADE_WITHOUT_PRECISE_CUTOFF');
});
test('leave-one-year-out test is historical backtest, not a 2026 count prediction',()=>{
  const v=model.historicalLeaveOneOut(ledger.historical);
  assert.equal(v.length,3);
  const mae=v.reduce((s,x)=>s+x.absoluteError,0)/3;
  assert.ok(Math.abs(mae-(11/3))<1e-9);
});
test('interval diagnostic handles bounded and lower-bound claims',()=>{
  assert.deepEqual(model.scoreCountAgainstInterval(11,{min:12,max:20}),{covered:false,distance:1});
  assert.deepEqual(model.scoreCountAgainstInterval(20,{min:12,max:20}),{covered:true,distance:0});
  assert.deepEqual(model.scoreCountAgainstInterval(9,{min:10,max:null}),{covered:false,distance:1});
});
test('cannot score unresolved 2026 insider claims before official deadline outcome',()=>{
  assert.throws(()=>model.score2026Insiders(ledger),/VERIFIED_FINAL_OUTCOME_REQUIRED/);
});
test('CLI readiness report never contains KAHRELUM predicted trade volume',()=>{
  const s=model.buildReadinessReport(ledger);
  assert.equal(s.confirmedTrades,8);
  assert.equal(s.reportedAgreementsNotCounted,1);
  assert.equal(s.kahrelumForecast,null);
  assert.equal(s.kahrelumLock,null);
  assert.equal(s.eligibleForScoring,false);
});
