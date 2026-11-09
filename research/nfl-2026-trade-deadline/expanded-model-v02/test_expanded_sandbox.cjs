'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const d=require('./inputs.json'),m=require('./expanded_sandbox.cjs');
test('official-forecast promotion is explicitly rejected',()=>{
 assert.equal(m.valid(d),true);
 assert.throws(()=>m.valid({...d,isOfficialForecast:true}),/FORECAST_NOT_AUTHORIZED/);
 assert.throws(()=>m.valid({...d,officialKahrelumForecast:18}),/FORECAST_NOT_AUTHORIZED/);
});
test('five historical seasons and 43 unique transactions',()=>{
 assert.equal(d.historicalTransactions.length,43);
 assert.deepEqual(m.dayCounts(d.historicalTransactions),{
 '2021':{eve:1,deadline:4},'2022':{eve:0,deadline:11},
 '2023':{eve:2,deadline:6},'2024':{eve:1,deadline:8},'2025':{eve:2,deadline:8}});
});
test('reported-only Bates cannot become the ninth completed deal',()=>{
 const r=m.calculate(d);assert.equal(r.completedOfficial2026,8);assert.equal(r.pendingNotCounted,1);
});
test('probability distribution has unit mass',()=>{
 const p=m.posterior(d,'deadline'),probs=m.negativeBinomial(p.shape,p.rate,1);
 assert.ok(Math.abs(probs.reduce((a,b)=>a+b,0)-1)<1e-8);
});
test('pending 0 creates no phantom trade and pending 1 shifts by one',()=>{
 assert.deepEqual(m.pending([.6,.4],0),[.6,.4]);assert.deepEqual(m.pending([.6,.4],1),[0,.6,.4]);
});
test('nonadmissible insider does not change the baseline',()=>{
 const b=[.2,.3,.5];assert.deepEqual(m.softTilt(b,[{admissible:false,weight:1,min:2,max:null,sigma:3}]),b);
});
test('local cross-language core outputs agree and remain non-scoring',()=>{
 const r=m.calculate(d);assert.equal(r.officialKahrelumForecast,null);assert.equal(r.isTimestampLocked,false);
 assert.equal(r.countsInForecastScoreboard,false);
 assert.ok(Math.abs(r.historicalOnly.meanAdditional-9.197)<.001);
 assert.ok(Math.abs(r.insiderSoft.meanAdditional-9.2969)<.001);
 assert.equal(r.historicalOnly.p10Additional,5);assert.equal(r.historicalOnly.p90Additional,14);
});
test('Monday exposure sensitivity and insider correlation weight cap',()=>{
 const r=m.calculate(d);assert.ok(r.sensitivity.lowRemainingEve.meanAdditional<r.historicalOnly.meanAdditional);
 assert.ok(r.sensitivity.highRemainingEve.meanAdditional>r.historicalOnly.meanAdditional);
 assert.throws(()=>m.valid({...d,insiderScenario:{...d.insiderScenario,maxTotalHeuristicWeight:.01}}),/INSIDER_CORRELATION_WEIGHT_CAP/);
});
