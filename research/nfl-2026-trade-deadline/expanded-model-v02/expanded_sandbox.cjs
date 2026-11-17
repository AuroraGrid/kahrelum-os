'use strict';
// Non-scoring trade-count research. The 2026 KAHRELUM official forecast stays null.
const fs=require('node:fs'),path=require('node:path');
const sourcePath=path.join(__dirname,'inputs.json');
const dayNames=['eve','deadline'];
function valid(d){
 if(d.schema!=='KAHRELUM_NFL_EXPANDED_SANDBOX_v0.2'||d.classification!=='SANDBOX_HYPOTHETICAL_NON_SCORING'||
 d.isOfficialForecast!==false||d.isTimestampLocked!==false||d.countsInForecastScoreboard!==false||
 d.countsAsPerformanceEvidence!==false||d.officialKahrelumForecast!==null||d.officialKahrelumLock!==null)throw Error('FORECAST_NOT_AUTHORIZED');
 if(d.deadlineET!=='2026-11-10T16:00:00-05:00'||Date.parse(d.asOfET)>=Date.parse(d.deadlineET))throw Error('BAD_CUTOFF');
 const historyIds=d.historicalTransactions.map(x=>x.tradeId);
 if(new Set(historyIds).size!==historyIds.length)throw Error('DUPLICATE_HISTORICAL_IDS');
 const current=[...d.official2026Completed,...d.reportedPending];
 if(new Set(current.map(x=>x.tradeId)).size!==current.length)throw Error('DUPLICATE_2026_IDS');
 if(d.official2026Completed.length!==8||d.reportedPending.length!==1||d.reportedPending[0].officialCompletedAt!==null)throw Error('BASELINE_CHANGED_REQUIRES_NEW_VERSION');
 const weights=d.insiderScenario.claims.filter(c=>c.admissible).reduce((a,c)=>a+c.weight,0);
 if(weights>d.insiderScenario.maxTotalHeuristicWeight+1e-9)throw Error('INSIDER_CORRELATION_WEIGHT_CAP');
 return true;
}
function dayCounts(rows){
 const out={};
 for(const x of rows){
  if(!dayNames.includes(x.deadlinePosition))throw Error('BAD_DATE_CLASS');
  if(!out[x.season])out[x.season]={eve:0,deadline:0};
  out[x.season][x.deadlinePosition]++;
 }
 return out;
}
function posterior(d,day,weights=d.sourceRegimeWeights){
 const c=dayCounts(d.historicalTransactions);
 let shape=.5,rate=0;
 for(const [regime,years] of Object.entries(d.historicalRegimes)){
  const w=weights[regime];if(!(w>0&&w<=1))throw Error('BAD_HISTORICAL_WEIGHT');
  for(const year of years){rate+=w;shape+=w*c[year][day];}
 }
 return {shape,rate};
}
function negativeBinomial(shape,rate,exposure,n=120){
 if(!(shape>0&&rate>0&&exposure>=0))throw Error('BAD_PARAMETERS');
 const out=Array(n+1).fill(0);if(exposure===0){out[0]=1;return out;}
 const p=rate/(rate+exposure),z=exposure/(rate+exposure);
 out[0]=Math.pow(p,shape);
 for(let k=1;k<=n;k++)out[k]=out[k-1]*(k-1+shape)*z/k;
 const sum=out.reduce((a,b)=>a+b,0);if(Math.abs(sum-1)>1e-7)throw Error('LOST_PMF_MASS');
 return out.map(v=>v/sum);
}
function convolve(a,b){
 const out=Array(a.length+b.length-1).fill(0);
 for(let i=0;i<a.length;i++)if(a[i])for(let j=0;j<b.length;j++)if(b[j])out[i+j]+=a[i]*b[j];
 const total=out.reduce((x,y)=>x+y,0);return out.map(x=>x/total);
}
function pending(probs,q){
 if(q<0||q>1)throw Error('BAD_PENDING_ASSUMPTION');
 if(q===0)return [...probs];
 const out=Array(probs.length+1).fill(0);
 probs.forEach((p,k)=>{out[k]+=(1-q)*p;out[k+1]+=q*p;});return out;
}
function softTilt(probs,claims){
 const result=probs.map((p,k)=>{
  let loss=0;
  for(const c of claims){if(!c.admissible||!c.weight)continue;
   const dist=k<c.min?c.min-k:(c.max!==null&&k>c.max?k-c.max:0);
   loss+=(c.weight/2)*Math.pow(dist/c.sigma,2);
  }
  return p*Math.exp(-loss);
 });
 const sum=result.reduce((a,b)=>a+b,0);return result.map(x=>x/sum);
}
function quantile(probs,t){let acc=0;for(let k=0;k<probs.length;k++){acc+=probs[k];if(acc>=t-1e-12)return k;}throw Error('BAD_PMF');}
function summary(probs,completed){
 const mean=probs.reduce((a,p,k)=>a+k*p,0);
 const bins=[['0-4',0,4],['5-7',5,7],['8-10',8,10],['11-13',11,13],['14+',14,probs.length-1]];
 return {meanAdditional:mean,meanSeasonTotal:mean+completed,modalAdditional:probs.indexOf(Math.max(...probs)),
  p10Additional:quantile(probs,.1),p90Additional:quantile(probs,.9),
  p10SeasonTotal:completed+quantile(probs,.1),p90SeasonTotal:completed+quantile(probs,.9),
  probSixOrMoreAdditional:probs.slice(6).reduce((a,b)=>a+b,0),
  probNineOrMoreAdditional:probs.slice(9).reduce((a,b)=>a+b,0),
  bins:bins.map(([count,lo,hi])=>({count,probability:probs.slice(lo,hi+1).reduce((a,b)=>a+b,0)}))};
}
function calculate(d){
 valid(d);
 const a=d.operatingAssumptions,postE=posterior(d,'eve'),postD=posterior(d,'deadline');
 function distribution(f=a.remainingEveExposureFraction,q=a.batesPendingCompletesBeforeDeadlineIllustrativeProbability,weights=d.sourceRegimeWeights){
  const ep=posterior(d,'eve',weights),dp=posterior(d,'deadline',weights);
  return pending(convolve(negativeBinomial(ep.shape,ep.rate,f),negativeBinomial(dp.shape,dp.rate,1)),q);
 }
 const p=distribution(),baseline=d.official2026Completed.length;
 return {
  schema:'KAHRELUM_NFL_VOLUME_EXPANDED_REPORT_v0.2',classification:'SANDBOX_HYPOTHETICAL_NON_SCORING',
  asOfET:d.asOfET,deadlineET:d.deadlineET,
  isOfficialForecast:false,isTimestampLocked:false,countsInForecastScoreboard:false,countsAsPerformanceEvidence:false,
  officialKahrelumForecast:null,officialKahrelumLock:null,
  historicalEventCount:d.historicalTransactions.length,historyDayCounts:dayCounts(d.historicalTransactions),
  completedOfficial2026:baseline,pendingNotCounted:d.reportedPending.length,posteriors:{eve:postE,deadline:postD},
  historicalOnly:summary(p,baseline),insiderSoft:summary(softTilt(p,d.insiderScenario.claims),baseline),
  sensitivity:{pendingExcluded:summary(distribution(undefined,0),baseline),pendingCertain:summary(distribution(undefined,1),baseline),
   lowRemainingEve:summary(distribution(.25),baseline),highRemainingEve:summary(distribution(.75),baseline),
   week9RegimeOnly:summary(distribution(undefined,undefined,{early:.0001,transitional:.0001,new:1}),baseline)},
  restrictions:'NON_SCORING_NO_OFFICIAL_FORECAST. Analyst-set weights, exposure fractions and pending-completion q are not empirically calibrated.'
 };
}
module.exports={valid,dayCounts,posterior,negativeBinomial,convolve,pending,softTilt,summary,calculate};
if(require.main===module){console.log(JSON.stringify(calculate(JSON.parse(fs.readFileSync(sourcePath,'utf8'))),null,2));}
