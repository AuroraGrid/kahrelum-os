'use strict';
// KAHRELUM NFL trade-volume research only. Deterministic and side-effect-free
// except reading the immutable input snapshot when invoked as a CLI.
// This script NEVER issues, locks, publishes, or infers a 2026 KAHRELUM forecast.
const fs=require('node:fs');
const path=require('node:path');
const admittedProvenance=new Set(['ATTRIBUTED_SECONDARY','ORIGINAL_AUTHOR_TEXT_RELAYED','ORIGINAL_AUTHOR']);
function assertUtc(s) {
  if(typeof s!=='string'||!(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/).test(s)||Number.isNaN(Date.parse(s))) throw Error('BAD_UTC_TIMESTAMP');
}
function assertDay(s) {
  if(typeof s!=='string'||!(/^\d{4}-\d\d-\d\d$/).test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))) throw Error('BAD_DATE');
}
function countUniqueTrades(xs) {
  if(!Array.isArray(xs)) throw TypeError('TRADES_MUST_BE_ARRAY');
  return new Set(xs.map(x=>x.tradeId)).size;
}
function validateLedger(d) {
  if(!d||d.schema!=='KAHRELUM_NFL_VOLUME_CALIBRATION_INPUTS_v1.0') throw Error('BAD_SCHEMA');
  if(d.lifecycle!=='RESEARCH_ONLY_NOT_ISSUED'||d.kahrelumVolumeForecast!==null||d.kahrelumVolumeLock!==null) throw Error('FORECAST_NOT_AUTHORIZED');
  assertUtc(d.observedAtUtc); assertUtc(d.target?.deadlineUtc); assertDay(d.target?.firstRegularSeasonDay);
  if(d.target.unit!=='UNIQUE_IN_SEASON_NFL_TRADE_TRANSACTION'||d.target.deadlineUtc!=='2026-11-10T21:00:00Z') throw Error('DEADLINE_OR_UNIT_MISMATCH');
  if(Date.parse(d.observedAtUtc)>=Date.parse(d.target.deadlineUtc)) throw Error('INVALID_RESEARCH_TIME');
  if(!Array.isArray(d.historical)||d.historical.length<3) throw Error('MISSING_HISTORICAL_DATA');
  if(!Array.isArray(d.completedTransactions)||!Array.isArray(d.reportedAgreements)||!Array.isArray(d.insiderClaims)) throw Error('MISSING_DATA');
  const all=[...d.completedTransactions,...d.reportedAgreements];
  if(all.some(x=>!x.tradeId)||countUniqueTrades(all)!==all.length) throw Error('DUPLICATE_OR_MISSING_TRADE_ID');
  for(const row of d.historical) if(!Number.isInteger(row.season)||!Number.isInteger(row.total)||row.total<0||!row.sourceUrl||!row.countingWindow) throw Error('INVALID_HISTORY');
  for(const v of d.completedTransactions) {
    assertDay(v.date);
    if(v.status!=='OFFICIAL_NFL_TRACKER_LISTED'||v.date<d.target.firstRegularSeasonDay||v.date>d.observedAtUtc.slice(0,10)) throw Error('UNVERIFIED_OR_OUT_OF_WINDOW_TRADE');
  }
  for(const v of d.reportedAgreements) {
    assertDay(v.date);
    if(v.status!=='REPORTED_AGREEMENT_NOT_IN_OFFICIAL_TRACKER') throw Error('BAD_REPORT_STATUS');
  }
  const claims=new Set();
  for(const c of d.insiderClaims) {
    if(!c.id||claims.has(c.id)||!c.reporter||!c.scope||!c.provenance) throw Error('BAD_CLAIM');
    claims.add(c.id);
    if(c.date!==null) assertDay(c.date);
    if(c.startDate!==null) assertDay(c.startDate);
    if(c.min!==null&&(!Number.isInteger(c.min)||c.min<0)) throw Error('INVALID_CLAIM_MIN');
    if(c.max!==null&&(!Number.isInteger(c.max)||c.max<0)) throw Error('INVALID_CLAIM_MAX');
    if(c.min!==null&&c.max!==null&&c.max<c.min) throw Error('INVERTED_RANGE');
    if(c.provenance==='USER_REPORTED_UNVERIFIED'&&c.sourceUrl) throw Error('MISREPRESENTED_USER_SOURCE');
  }
  return true;
}
function completedTradeCount(d) {
  return countUniqueTrades(d.completedTransactions.filter(x=>x.status==='OFFICIAL_NFL_TRACKER_LISTED'));
}
function alignInsiderHurdle(c,d) {
  function excluded(reason) {return {id:c.id,comparable:false,reason,remainingLower:null,remainingUpper:null};}
  if(!admittedProvenance.has(c.provenance)) return excluded('PROVENANCE_UNVERIFIED');
  if(c.scope!=='AFTER_DATE_TO_DEADLINE'||!c.startDate) return excluded('WINDOW_OR_POPULATION_UNVERIFIED');
  if(c.min===null) return excluded('NO_HARD_NUMERICAL_BOUND');
  if(d.completedTransactions.some(v=>v.date===c.startDate)&&!c.originalTimeUtc) return excluded('SAME_DAY_TRADE_WITHOUT_PRECISE_CUTOFF');
  if(c.startDate>d.observedAtUtc.slice(0,10)) return excluded('CLAIM_DATE_AFTER_SNAPSHOT');
  const knownAfterReference=countUniqueTrades(d.completedTransactions.filter(v=>v.status==='OFFICIAL_NFL_TRACKER_LISTED'&&v.date>c.startDate&&v.date<=d.observedAtUtc.slice(0,10)));
  return {id:c.id,comparable:true,scope:c.scope,referenceDay:c.startDate,knownAfterReference,
    remainingLower:Math.max(0,c.min-knownAfterReference),
    remainingUpper:c.max===null?null:Math.max(0,c.max-knownAfterReference),
    note:'Insider-implied threshold only; NOT a KAHRELUM prediction. Reported-only agreements excluded.'};
}
function historicalLeaveOneOut(rows) {
  if(!Array.isArray(rows)||rows.length<3) throw Error('MINIMUM_THREE_HISTORICAL_YEARS');
  return rows.map((v,i)=>{
    const others=rows.filter((_,j)=>i!==j);
    const mean=others.reduce((a,b)=>a+b.total,0)/others.length;
    return {heldOutYear:v.season,actual:v.total,historicalMeanWithoutHoldout:mean,absoluteError:Math.abs(v.total-mean)};
  });
}
function scoreCountAgainstInterval(actual,claim) {
  if(!Number.isInteger(actual)||actual<0) throw Error('BAD_FINAL_COUNT');
  if(!claim||!Number.isInteger(claim.min)||claim.min<0||(claim.max!==null&&(!Number.isInteger(claim.max)||claim.max<claim.min))) throw Error('BAD_NUMERICAL_CLAIM');
  const distance=actual<claim.min?claim.min-actual:(claim.max!==null&&actual>claim.max?actual-claim.max:0);
  return {covered:distance===0,distance};
}
function score2026Insiders(d) {
  if(!d.finalOutcome||d.finalOutcome.verified!==true||!Array.isArray(d.finalOutcome.completedTransactions)) throw Error('VERIFIED_FINAL_OUTCOME_REQUIRED');
  assertUtc(d.finalOutcome.verifiedAtUtc);
  if(Date.parse(d.finalOutcome.verifiedAtUtc)<=Date.parse(d.target.deadlineUtc)) throw Error('DEADLINE_NOT_YET_CLOSED');
  return d.insiderClaims.map(c=>{
    const a=alignInsiderHurdle(c,d);
    if(!a.comparable) return {id:c.id,scored:false,reason:a.reason};
    const count=countUniqueTrades(d.finalOutcome.completedTransactions.filter(v=>v.date>c.startDate&&v.date<=d.target.deadlineUtc.slice(0,10)));
    return {id:c.id,scored:true,realized:count,...scoreCountAgainstInterval(count,c)};
  });
}
function buildReadinessReport(d) {
  validateLedger(d);
  const cv=historicalLeaveOneOut(d.historical);
  return {
    schema:'KAHRELUM_NFL_TRADE_VOLUME_RESEARCH_REPORT_v1.0',
    lifecycle:d.lifecycle,observationUtc:d.observedAtUtc,deadlineUtc:d.target.deadlineUtc,
    confirmedTrades:completedTradeCount(d),reportedAgreementsNotCounted:d.reportedAgreements.length,
    historicalSamples:d.historical.map(v=>({season:v.season,completedTrades:v.total})),
    historicalLeaveOneOutMeanAbsoluteError:cv.reduce((s,v)=>s+v.absoluteError,0)/cv.length,
    insiderClaimAudit:d.insiderClaims.map(v=>alignInsiderHurdle(v,d)),
    historicalAndClaimLimitations:d.referenceCaveats,eligibleForScoring:false,
    kahrelumForecast:null,kahrelumLock:null
  };
}
module.exports={validateLedger,countUniqueTrades,completedTradeCount,alignInsiderHurdle,historicalLeaveOneOut,scoreCountAgainstInterval,score2026Insiders,buildReadinessReport};
if(require.main===module) {
  const input=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'..','research','nfl-2026-trade-deadline','2026-11-09_VOLUME_CALIBRATION_INPUTS.json');
  const data=JSON.parse(fs.readFileSync(input,'utf8'));
  process.stdout.write(JSON.stringify(buildReadinessReport(data),null,2)+'\n');
}
