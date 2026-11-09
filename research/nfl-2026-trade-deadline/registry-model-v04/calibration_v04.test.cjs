'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const fx=require('./registry_2018_2020.json');
const old=require('../expanded-model-v02/inputs.json'); const recon=require('../stress-audit-v03/reconciliation_v03.json');
const m=require('./calibration_v04.cjs');
const {state,rows}=m.canonicalLedger(fx,old,recon);
test('research output is non-scoring and no new forecast or lock',()=>{
 assert.equal(state.officialForecast,null);assert.equal(state.officialLock,null);assert.equal(state.countsInForecastScoreboard,false);
 assert.throws(()=>m.validateState({...state,officialForecast:16}),/FORECAST_LOCK_FORBIDDEN/);
});
test('primary historical source convention fixed to NFL monthly transaction register',()=>{
 assert.equal(state.primaryDateConvention,'NFL_MONTHLY_TRANSACTIONS_REGISTER');
 assert.ok(rows.every(e=>e.sourceUrl==='https://www.nfl.com/transactions/league/trades/'+e.season+'/'+e.registeredDate.slice(5,7)));
});
test('2018-2025 eight seasons, 59 distinct deals, never 60 player rows',()=>{
 assert.equal(rows.length,59);assert.equal(new Set(rows.map(x=>x.tradeId)).size,59);
 assert.deepEqual(m.seasonCounts(rows).map(x=>[x.season,x.eve,x.deadline]),[[2018,0,5],[2019,2,2],[2020,3,3],[2021,0,5],[2022,0,11],[2023,0,8],[2024,1,8],[2025,1,10]]);
});
test('one 2020 exchange involving Kwon Alexander and Kiko Alonso counts as one deal',()=>{
 const x=rows.find(v=>v.tradeId==='2020-reg-04');assert.deepEqual(x.players,['Kwon Alexander','Kiko Alonso']);
 assert.equal(rows.filter(v=>v.players.includes('Kwon Alexander')||v.players.includes('Kiko Alonso')).length,1);
});
test('2023 report date changes do not leak into canonical registry date',()=>{
 assert.equal(rows.filter(x=>x.season===2023&&x.relativeDay==='eve').length,0);
});
test('2025 Jaire Alexander added on register date November 3',()=>{
 const x=rows.find(v=>v.tradeId==='2025-REGISTRY-JAIRE-ALEXANDER');assert.equal(x.relativeDay,'eve');assert.equal(x.registeredDate,'2025-11-03');
});
test('unverified Bates condition does not contaminate completed totals',()=>{
 assert.equal(state.originalStrictBaseline,8);assert.equal(state.currentLeagueEditorialListed,9);
 assert.equal(state.batesState,'CLUB_ANNOUNCED_PENDING_PHYSICAL');
});
test('duplicate transaction ID or out of window row rejected',()=>{
 assert.throws(()=>m.validateRows([...rows,rows[0]],state),/DUPLICATE_TRADE_ID/);
 assert.throws(()=>m.validateRows([...rows.slice(1),{...rows[0],registeredDate:'2018-10-22'}],state),/OUTSIDE_TWO_DAY_WINDOW/);
});
test('negbin distribution normalized and nonnegative',()=>{
 const p=m.predictFromTraining(rows,[2018,2019,2020],1,1);assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-9);assert.ok(p.every(v=>v>=0));
});
test('historical walk-forward uses strictly preceding years, five holdout seasons',()=>{
 const x=m.backtest(rows,'two-day');assert.deepEqual(x.map(v=>v.year),[2021,2022,2023,2024,2025]);
 for(const v of x)assert.ok(v.trainingYears.every(y=>y<v.year));
});
test('end-of-eve cutoff is a different leakage-free matched horizon',()=>{
 const x=m.backtest(rows,'deadline-only');assert.equal(x.length,5);assert.ok(x.every(v=>v.horizon==='deadline-only'));
});
test('a generic future-trade distribution contains NO additive Bates term',()=>{
 const p=m.predictFromTraining(rows,[2018,2019,2020,2021,2022,2023,2024,2025],.5,1);
 const statusOnly={...state,batesState:'RESOLVED_OR_UNRESOLVED_STATUS_CHANGED'};
 assert.deepEqual(p,m.predictFromTraining(rows,[2018,2019,2020,2021,2022,2023,2024,2025],.5,1));
 assert.notEqual(statusOnly.batesState,state.batesState);assert.ok(!Object.hasOwn(m,'addPendingTrade'));
});
test('same-day/after-eve comparison uses historical registry dates, not guessed intraday fraction',()=>{
 const r=m.runAudit(fx,old,recon);assert.equal(r.historicalCutoffs['two-day'],'START_OF_DEADLINE_EVE');
 assert.equal(r.historicalCutoffs['deadline-only'],'START_OF_DEADLINE_DAY');assert.equal(r.mondayExposureEmpiricallyValidated,false);
});
test('Poisson baseline and model properly score integer outcomes',()=>{
 const p=m.poissonPmf(5);assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-9);
 const s=m.score(p,5);assert.ok(s.rps>=0&&Number.isFinite(s.nll));
});
test('2020 exclusion sensitivity and zero insider weights remain research-only',()=>{
 const r=m.runAudit(fx,old,recon);assert.equal(r.sourceWeightSkillValidated,false);
 assert.equal(r.officialForecast,null);assert.equal(r.officialLock,null);
 assert.ok(Number.isFinite(r.sensitivity.excludeCovid2020.meanAdditionalSandbox));
});
test('forbid alternative date convention silently promoted to core',()=>{
 assert.throws(()=>m.validateState({...state,primaryDateConvention:'NFL_EDITORIAL_REPORT_DATE'}),/DATE_CONVENTION_CHANGED/);
});
