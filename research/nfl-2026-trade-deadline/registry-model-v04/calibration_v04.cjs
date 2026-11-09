'use strict';
/**
 * KAHRELUM 2026 trade-volume RESEARCH ONLY v0.4.
 * Canonical training measure: unique two-team player-involving transactions
 * dated on the NFL monthly transaction register on deadline eve or day.
 * No additive pending-trade/Bates probability exists in this model.
 * Every output has an explicit NON-SCORING classification and null forecast.
 */
const fs=require('node:fs');const path=require('node:path');
const DATES={2018:'2018-10-30',2019:'2019-10-29',2020:'2020-11-03',2021:'2021-11-02',2022:'2022-11-01',2023:'2023-10-31',2024:'2024-11-05',2025:'2025-11-04'};
const SOURCE='NFL_MONTHLY_TRANSACTIONS_REGISTER';
const CLASSIFICATION='SANDBOX_HYPOTHETICAL_NON_SCORING';
function offsetDate(day,days){return new Date(Date.parse(day+'T00:00:00Z')+days*86400e3).toISOString().slice(0,10);}
function sourceUrl(year,day){return 'https://www.nfl.com/transactions/league/trades/'+year+'/'+day.slice(5,7);}
function validateState(state){
 if(state.classification!==CLASSIFICATION||state.officialForecast!==null||state.officialLock!==null||state.countsInForecastScoreboard!==false||state.isOfficialForecast!==false)throw Error('FORECAST_LOCK_FORBIDDEN');
 if(state.primaryDateConvention!==SOURCE)throw Error('DATE_CONVENTION_CHANGED');
 if(state.deadline2026Utc!=='2026-11-10T21:00:00Z')throw Error('DEADLINE_CHANGED');
 return true;
}
function validateRows(rows,state){
 validateState(state);const seen=new Set();
 for(const x of rows){
  if(!x.tradeId||seen.has(x.tradeId))throw Error('DUPLICATE_TRADE_ID');seen.add(x.tradeId);
  if(!DATES[x.season]||![DATES[x.season],offsetDate(DATES[x.season],-1)].includes(x.registeredDate))throw Error('OUTSIDE_TWO_DAY_WINDOW');
  if(x.relativeDay!==(x.registeredDate===DATES[x.season]?'deadline':'eve'))throw Error('BAD_RELATIVE_DAY');
  if(x.sourceUrl!==sourceUrl(x.season,x.registeredDate)||!Array.isArray(x.players)||!x.players.length)throw Error('UNVERIFIED_EVENT_METADATA');
 }
 if(rows.length!==59||Object.keys(DATES).length!==8)throw Error('HISTORICAL_COHORT_SIZE_CHANGED');
 return true;
}
function canonicalLedger(extension,old,recon){
 if(extension.schema!=='KAHRELUM_NFL_REGISTRY_EXTENSION_2018_2020_v0.4'||old.schema!=='KAHRELUM_NFL_EXPANDED_SANDBOX_v0.2'||recon.schema!=='KAHRELUM_NFL_TRADE_VOLUME_HISTORY_RECONCILIATION_v0.3')throw Error('UNEXPECTED_SOURCE_SCHEMA');
 if(extension.classification!==CLASSIFICATION||old.classification!==CLASSIFICATION||recon.classification!==CLASSIFICATION)throw Error('INPUT_SCOREBOARD_CONTAMINATION');
 const state={classification:CLASSIFICATION,primaryDateConvention:SOURCE,isOfficialForecast:false,officialForecast:null,officialLock:null,countsInForecastScoreboard:false,deadline2026Utc:'2026-11-10T21:00:00Z',originalStrictBaseline:old.official2026Completed.length,currentLeagueEditorialListed:9,batesState:recon.batesClubAnnouncement.classificationAtV02AsOf,official2026BaselineFrozenAt:old.asOfET,sourceRule:'NFL MONTHLY register dates only for historical model; NFL editorial 2026 listings are separate and not substituted into historical ledger'};
 const adjustments=new Map(recon.registryAdjustments.map(x=>[x.eventId,x.toDay]));
 const rows=[];
 for(const x of extension.events){
  rows.push({...x,relativeDay:x.registeredDate===DATES[x.season]?'deadline':'eve',sourceUrl:sourceUrl(x.season,x.registeredDate)});
 }
 for(const x of old.historicalTransactions){
  const relativeDay=adjustments.get(x.tradeId)||x.deadlinePosition;
  const registeredDate=relativeDay==='deadline'?DATES[x.season]:offsetDate(DATES[x.season],-1);
  rows.push({tradeId:x.tradeId,season:x.season,registeredDate,relativeDay,players:[x.headline],sourceUrl:sourceUrl(x.season,registeredDate),originalReportDate:x.eventDate});
 }
 for(const x of recon.registryAdditions){
  const registeredDate=x.eventDate;
  rows.push({tradeId:x.tradeId,season:x.season,registeredDate,relativeDay:x.deadlinePosition,players:[x.headline],sourceUrl:sourceUrl(x.season,registeredDate),originalReportDate:x.originalReportedDate});
 }
 rows.sort((a,b)=>a.season-b.season||a.registeredDate.localeCompare(b.registeredDate)||a.tradeId.localeCompare(b.tradeId));
 validateRows(rows,state);return {state,rows};
}
function seasonCounts(rows){const years=Object.keys(DATES).map(Number);return years.map(season=>({season,eve:rows.filter(x=>x.season===season&&x.relativeDay==='eve').length,deadline:rows.filter(x=>x.season===season&&x.relativeDay==='deadline').length}));}
function normalize(p){const s=p.reduce((a,b)=>a+b,0);if(!(s>0)||Math.abs(s-1)>1e-6)throw Error('PMF_NOT_NORMALIZED');return p.map(x=>x/s);}
function negativeBinomial(shape,rate,exposure=1,n=140){
 if(!(shape>0&&rate>0&&exposure>=0&&exposure<=1))throw Error('BAD_GAMMA_POISSON_INPUT');
 if(exposure===0)return [1,...Array(n).fill(0)];
 const p=rate/(rate+exposure),q=exposure/(rate+exposure);const out=Array(n+1).fill(0);
 out[0]=Math.pow(p,shape);for(let k=1;k<out.length;k++)out[k]=out[k-1]*(k-1+shape)*q/k;
 return normalize(out);
}
function convolve(a,b){const x=Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)if(a[i])for(let j=0;j<b.length;j++)if(b[j])x[i+j]+=a[i]*b[j];return normalize(x);}
function poissonPmf(lambda,n=150){if(!(lambda>=0))throw Error('INVALID_POISSON_MEAN');if(lambda===0)return [1,...Array(n).fill(0)];let a=Array(n+1).fill(0);a[0]=Math.exp(-lambda);for(let k=1;k<a.length;k++)a[k]=a[k-1]*lambda/k;return normalize(a);}
function predictFromTraining(rows,trainingYears,eveExposure=1,deadlineExposure=1){
 if(!trainingYears.length||new Set(trainingYears).size!==trainingYears.length||!trainingYears.every(y=>Object.hasOwn(DATES,y)))throw Error('INVALID_TRAINING_YEARS');
 const all=seasonCounts(rows).filter(x=>trainingYears.includes(x.season));
 const fit=(day,exposure)=>negativeBinomial(.5+all.reduce((s,x)=>s+x[day],0),.5+all.length,exposure);
 return convolve(fit('eve',eveExposure),fit('deadline',deadlineExposure));
}
function quantile(p,q){let s=0;for(let i=0;i<p.length;i++){s+=p[i];if(s>=q-1e-12)return i;}throw Error('QUANTILE_OUT_OF_RANGE');}
function score(p,actual){
 if(!Number.isInteger(actual)||actual<0||actual>=p.length)throw Error('INVALID_SCORE_OUTCOME');
 let c=0,rps=0;for(let i=0;i<p.length-1;i++){c+=p[i];rps+=Math.pow(c-(actual<=i?1:0),2);}
 const mean=p.reduce((s,v,i)=>s+v*i,0);const lower=quantile(p,.1),upper=quantile(p,.9);
 return {actual,mean,absoluteError:Math.abs(mean-actual),rps,nll:-Math.log(Math.max(p[actual],1e-300)),p10:lower,p90:upper,central80Covers:actual>=lower&&actual<=upper};
}
function backtest(rows,horizon='two-day'){
 if(!['two-day','deadline-only'].includes(horizon))throw Error('INVALID_HORIZON');
 const table=seasonCounts(rows);const out=[];
 for(const x of table){if(x.season<2021)continue;
  const train=table.filter(v=>v.season<x.season),years=train.map(z=>z.season);
  const outcome=horizon==='two-day'?x.eve+x.deadline:x.deadline;
  const sampleMean=train.reduce((s,v)=>s+(horizon==='two-day'?v.eve+v.deadline:v.deadline),0)/train.length;
  const dist=predictFromTraining(rows,years,horizon==='two-day'?1:0,1);
  out.push({year:x.season,horizon,trainingYears:years,actual:outcome,model:score(dist,outcome),poissonBaseline:score(poissonPmf(sampleMean),outcome)});
 }
 return out;
}
function aggregate(rows,key){const v=rows.map(x=>x[key]);return {holdouts:v.length,MAE:v.reduce((s,x)=>s+x.absoluteError,0)/v.length,meanRPS:v.reduce((s,x)=>s+x.rps,0)/v.length,meanNLL:v.reduce((s,x)=>s+x.nll,0)/v.length,coverage80:v.reduce((s,x)=>s+(x.central80Covers?1:0),0)/v.length};}
function moment(p){return p.reduce((s,x,i)=>s+x*i,0);}
function runAudit(extension,old,recon){
 const {state,rows}=canonicalLedger(extension,old,recon);
 const t=backtest(rows,'two-day'),d=backtest(rows,'deadline-only');
 const years=seasonCounts(rows).map(x=>x.season);
 const main=predictFromTraining(rows,years,.5,1);
 const noCovid=predictFromTraining(rows,years.filter(x=>x!==2020),.5,1);
 const f0=predictFromTraining(rows,years,0,1);
 const f1=predictFromTraining(rows,years,1,1);
 return {
  schema:'KAHRELUM_NFL_REGISTRY_CALIBRATION_AUDIT_v0.4',classification:CLASSIFICATION,
  officialForecast:null,officialLock:null,countsInForecastScoreboard:false,isOfficialForecast:false,
  sourceConvention:SOURCE,historicalSourceYearCount:years.length,historicalUniqueTransactions:rows.length,
  yearData:seasonCounts(rows),historicalCutoffs:{'two-day':'START_OF_DEADLINE_EVE','deadline-only':'START_OF_DEADLINE_DAY'},
  backtests:{twoDay:t,deadlineOnly:d},summaries:{twoDay:{model:aggregate(t,'model'),naive:aggregate(t,'poissonBaseline')},deadlineOnly:{model:aggregate(d,'model'),naive:aggregate(d,'poissonBaseline')}},
  sensitivity:{excludeCovid2020:{meanAdditionalSandbox:moment(noCovid)},assumedRemainingMonday0:{meanAdditionalSandbox:moment(f0)},assumedRemainingMonday1:{meanAdditionalSandbox:moment(f1)}},
  researchExample:{strictOriginal8Baseline:8,sourceCutoff:state.official2026BaselineFrozenAt,meanAdditionalSandbox:moment(main),note:'Illustration only: fixed 50% remaining Monday assumption has no intraday validation. No Bates add-on, no scoring.'},
  sourceWeightSkillValidated:false,mondayExposureEmpiricallyValidated:false,priorHyperparameters:{shape:.5,rate:.5},
  batesStatusOnly:{status:state.batesState,officialEditorialTrackerListed2026:state.currentLeagueEditorialListed,strictFrozenBaseline:state.originalStrictBaseline,
   independentBernoulliProbability:null,addedToModel:false},
  caveats:['Only five strictly chronological holdouts, season clusters are not independent trade events.','2018–2023 followed Week 8; 2024–2025 followed Week 9; cannot treat regimes as interchangeable without sensitivity.','The register date sometimes differs from first public news or execution; this model targets register-dated calendar-day counts.','Monday intraday exposure is an unmeasured scenario, not an observed feature.','Any evaluation or future authorized publication must freeze cutoff, source definitions and full count distribution.']
 };
}
module.exports={canonicalLedger,validateState,validateRows,seasonCounts,negativeBinomial,poissonPmf,predictFromTraining,quantile,score,backtest,runAudit};
if(require.main===module){const root=__dirname;const extension=require(path.join(root,'registry_2018_2020.json'));const old=require(path.join(root,'..','expanded-model-v02','inputs.json'));const recon=require(path.join(root,'..','stress-audit-v03','reconciliation_v03.json'));process.stdout.write(JSON.stringify(runAudit(extension,old,recon),null,2)+'\n');}
