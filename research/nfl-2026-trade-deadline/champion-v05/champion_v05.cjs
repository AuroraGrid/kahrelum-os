'use strict';
/**
 * KAHRELUM NFL volume research-only champion/challenger selection v0.5.
 * This selects a method from strictly historical walk-forward data; it NEVER
 * creates a 2026 forecast, lock, performance entry or production release.
 */
const path = require('node:path');
const fs = require('node:fs');
const prior = require('../registry-model-v04/calibration_v04.cjs');
const CLASSIFICATION='SANDBOX_HYPOTHETICAL_NON_SCORING';
function modelSelected(summary) {
  const model=summary.model, naive=summary.naive;
  for(const pair of [model,naive]){
    if(!pair||pair.holdouts!==5||!Number.isFinite(pair.meanRPS)||!Number.isFinite(pair.MAE)||!Number.isFinite(pair.meanNLL))throw Error('INVALID_HISTORICAL_COMPARISON');
  }
  // Proper scoring rule selected in advance; MAE is displayed but not the ranking metric.
  const naiveWins=naive.meanRPS<=model.meanRPS;
  return {name:naiveWins?'NAIVE_POISSON_MEAN':'GAMMA_POISSON',
          criterion:'WALKFORWARD_MEAN_RANKED_PROBABILITY_SCORE',
          reason:'LOWER_HISTORICAL_WALKFORWARD_RPS',
          bestMeanRps:naiveWins?naive.meanRPS:model.meanRPS,
          runnerUpMeanRps:naiveWins?model.meanRPS:naive.meanRPS,
          holdoutSeasons:[2021,2022,2023,2024,2025],
          superiorityVsExternalInsidersClaimed:false};
}
function researchAudit({ext,old,rec}) {
  const primary=prior.runAudit(ext,old,rec);
  const years=primary.yearData.map(x=>x.season);
  const yearData=primary.yearData;
  const combined=(x)=>x.eve+x.deadline;
  const average=(records,metric)=>records.reduce((s,x)=>s+metric(x),0)/records.length;
  const rates={twoDay:average(yearData,combined),deadlineOnly:average(yearData,x=>x.deadline)};
  const withoutCovid=yearData.filter(x=>x.season!==2020);
  const week9=yearData.filter(x=>x.season>=2024);
  const bts=primary.backtests;
  for(const mode of ['twoDay','deadlineOnly']){
    const list=bts[mode];
    if(list.length!==5||list.some(e=>e.trainingYears.some(y=>y>=e.year)))throw Error('BACKTEST_LEAKAGE');
  }
  return {
    schema:'KAHRELUM_NFL_VOLUME_CHAMPION_RESEARCH_v0.5',
    lifecycle:'RESEARCH_ONLY_NOT_ISSUED',classification:CLASSIFICATION,
    isOfficialForecast:false,canPublishOfficialProjection:false,
    officialKahrelumPrediction:null,officialPredictionLock:null,
    performanceScoreboardUpdated:false,internalTestsCountAsOfficialForecasts:false,
    sources:{history:'NFL_MONTHLY_TRANSACTIONS_REGISTER',upstreamV04:'registry-model-v04/calibration_v04.cjs',priorSourceCorrectionsPreserved:true},
    historicalUniqueTrades:primary.historicalUniqueTransactions,
    historySeasons:primary.historicalSourceYearCount,
    trainSeasons:years,
    backtests:bts,
    summaries:primary.summaries,
    champions:{twoDay:modelSelected(primary.summaries.twoDay),deadlineOnly:modelSelected(primary.summaries.deadlineOnly)},
    trainingRates:rates,
    sensitivity:{trainingRatesWithoutCovid:{twoDay:average(withoutCovid,combined),deadlineOnly:average(withoutCovid,x=>x.deadline)},
      trainingRatesWeek9Only:{twoDay:average(week9,combined),deadlineOnly:average(week9,x=>x.deadline)}},
    original2026Snapshot:{baseline:old.official2026Completed.length,asOfET:old.asOfET,kind:'ORIGINAL_EDITORIAL_TRACKER_2026_SNAPSHOT',immutable:true},
    target2026:{status:'NOT_FIXED',deadlineUtc:'2026-11-10T21:00:00Z',uniqueTargetConvention:'NFL_MONTHLY_TRANSACTIONS_REGISTER',
      required:'Fresh cutoff and source reconciliation plus explicit authorization before any 2026 published forecast'},
    model:{pendingTradeAddOnAllowed:false,insiderSkillWeightsEmpiricallyFitted:false,
      defaultCriterion:'HISTORICAL_RPS_NOT_TUNED_TO_2026_OUTCOME',
      histogramOutputsOnly:'SANDBOX_HYPOTHETICAL_NON_SCORING'},
    caveats:[
      'Selecting the lower historical RPS model using five holdouts can still overfit; champion is a conservative baseline, not demonstrated predictive superiority.',
      'No matching historical insider count forecasts are verified, therefore no claim of superior skill versus insiders.',
      'End-of-eve and start-of-eve horizons do not equate to an intraday Monday cutoff. Real-time model must state its effective horizon or remain research-only.',
      'Reported and conditional trades remain source observations, not automatically completed transactions.'
    ]
  };
}
function championDistribution(audit,horizon) {
  if(audit.lifecycle!=='RESEARCH_ONLY_NOT_ISSUED'||audit.officialKahrelumPrediction!==null||audit.officialPredictionLock!==null)throw Error('FORECAST_PROMOTION_FORBIDDEN');
  if(!['twoDay','deadlineOnly'].includes(horizon))throw Error('BAD_COMPARISON_HORIZON');
  const candidate=audit.champions[horizon];
  if(candidate.name==='NAIVE_POISSON_MEAN')return prior.poissonPmf(audit.trainingRates[horizon]);
  throw Error('CHALLENGER_DISTRIBUTION_REQUIRES_FULL_HISTORICAL_INPUTS');
}
module.exports={researchAudit,modelSelected,championDistribution};
if(require.main===module){
 const ext=require('../registry-model-v04/registry_2018_2020.json');
 const old=require('../expanded-model-v02/inputs.json');
 const rec=require('../stress-audit-v03/reconciliation_v03.json');
 process.stdout.write(JSON.stringify(researchAudit({ext,old,rec}),null,2)+'\n');
}
