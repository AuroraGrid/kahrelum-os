// MQA-001 reconstructed candidate v1. Not recovered pilot code or a model benchmark.
import {createHash} from 'node:crypto';
export const SILVER_OZT = 0.7734;
const finite = x => typeof x === 'number' && Number.isFinite(x);
const positive = x => finite(x) && x > 0;
const text = x => typeof x === 'string' && x.trim().length > 0;
const timestamp = x => typeof x === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(x) ? Date.parse(x) : NaN;
export function silverFromWeight(grams) {
  if (!positive(grams)) throw new TypeError('Positive finite grams required');
  return grams * 0.9 / 31.1034768;
}
export function evaluate(input) {
  const x = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const q=x.quote||{}, c=x.coin||{}, s=x.spot||{};
  const reasons=[];
  const check=(ok,code)=>{if(!ok)reasons.push(code);};
  const at=timestamp(x.decisionAt);
  check(Number.isFinite(at),'DECISION_TIME');
  check(positive(x.maxAgeHours),'FRESHNESS_POLICY');
  const fresh=t=>Number.isFinite(timestamp(t)) && timestamp(t)<=at && at-timestamp(t)<=x.maxAgeHours*3600000;
  const sources=Array.isArray(x.sources)?x.sources:[];
  check(sources.length>0 && sources.every(s=>s && text(s.id)) && new Set(sources.map(s=>s?.id)).size===sources.length,'SOURCE_IDS');
  const supported=id=>sources.some(s=>s && s.id===id && s.verified===true && typeof s.url==='string' && /^https:\/\//.test(s.url) && Number.isFinite(timestamp(s.availableAt)) && timestamp(s.availableAt)<=at);
  check(x.intent==='buy'||x.intent==='sell','INTENT');
  check((x.intent==='sell'&&q.kind==='bid')||(x.intent==='buy'&&q.kind==='ask'),'QUOTE_DIRECTION');
  check(q.executable===true,'NON_EXECUTABLE');
  check(positive(q.amount),'QUOTE_AMOUNT');
  check(q.currency==='USD'&&q.unit==='per_coin'&&Number.isInteger(q.quantity)&&q.quantity>0,'QUOTE_UNITS');
  check(text(q.counterparty)&&text(q.terms),'TERMS');
  check(finite(q.fees)&&q.fees>=0&&finite(q.shipping)&&q.shipping>=0,'COSTS');
  check(fresh(q.observedAt),'QUOTE_TIME');
  check(timestamp(q.expiresAt)>at,'QUOTE_EXPIRY');
  check(supported(q.sourceId),'QUOTE_SOURCE');
  check(c.series==='Morgan'&&Number.isInteger(c.year)&&((c.year>=1878&&c.year<=1904)||c.year===1921)&&text(c.mintmark)&&text(c.condition)&&c.authenticated===true&&c.identityVerified===true,'COIN_IDENTITY');
  check(Array.isArray(x.conflicts)&&x.conflicts.length===0,'SOURCE_CONFLICT');
  check(positive(s.amount),'SPOT_AMOUNT');
  check(s.currency==='USD'&&s.unit==='USD_per_troy_oz','SPOT_UNITS');
  check(fresh(s.observedAt),'SPOT_TIME');
  check(supported(s.sourceId),'SPOT_SOURCE');
  check(x.addCollectibleTotalToMelt===undefined||x.addCollectibleTotalToMelt===false,'DOUBLE_COUNT');
  const status=reasons.length?'HOLD':'READY_FOR_COMPARISON';
  const ready=status==='READY_FOR_COMPARISON';
  const melt=ready?SILVER_OZT*s.amount:null;
  const event={id:text(x.id)?x.id:null,decisionAt:x.decisionAt??null,status,reasons:[...reasons]};
  return {status,reasons,melt,premium:ready?q.amount-melt:null,
    netProceeds:ready&&x.intent==='sell'?q.amount*q.quantity-q.fees-q.shipping:null,
    totalCost:ready&&x.intent==='buy'?q.amount*q.quantity+q.fees+q.shipping:null,
    clarification:reasons.length?'Supply timestamped, attributable evidence for: '+reasons.join(', '):null,
    audit:{version:'MQA-001-reconstructed-v1',inputHash:createHash('sha256').update(JSON.stringify(input??null)).digest('hex'),silverOzt:SILVER_OZT,
      history:[...structuredClone(Array.isArray(x.history)?x.history:[]),event]},
    limitation:'Caller-supplied evidence flags require human verification. Comparison only; no investment recommendation, coin authentication, or external model evaluation.'};
}
