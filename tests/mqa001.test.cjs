const test = require('node:test');
const assert = require('node:assert/strict');
const gate = () => import('../research/mqa-001/quote_gate.mjs');
const base = () => ({id:'synthetic-001',decisionAt:'2026-11-17T12:00:00Z',maxAgeHours:24,
  intent:'sell',coin:{series:'Morgan',year:1921,mintmark:'Philadelphia',condition:'AU',authenticated:true,identityVerified:true},
  quote:{kind:'bid',amount:42,currency:'USD',unit:'per_coin',executable:true,counterparty:'Synthetic Dealer',terms:'Accepted inspected coin; no further conditions',fees:2,shipping:1,quantity:1,observedAt:'2026-11-17T11:00:00Z',expiresAt:'2026-11-17T13:00:00Z',sourceId:'bid'},
  spot:{amount:40,currency:'USD',unit:'USD_per_troy_oz',observedAt:'2026-11-17T11:00:00Z',sourceId:'spot'},
  sources:[{id:'bid',url:'https://example.com/bid',verified:true,availableAt:'2026-11-17T11:00:00Z'},{id:'spot',url:'https://example.com/spot',verified:true,availableAt:'2026-11-17T11:00:00Z'}],conflicts:[],history:[]});
test('complete synthetic bid supports comparison, never a trade recommendation',async()=>{const r=(await gate()).evaluate(base());assert.equal(r.status,'READY_FOR_COMPARISON');assert.equal(r.netProceeds,39);assert.equal(r.melt,30.936);assert.ok(Math.abs(r.premium-11.064)<1e-9);assert.ok(r.audit.inputHash);});
const cases = [
 ['retail ask cannot satisfy sale bid',x=>x.quote.kind='ask','QUOTE_DIRECTION'],
 ['guide is never executable bid',x=>x.quote.kind='guide','QUOTE_DIRECTION'],
 ['unknown intent',x=>x.intent='invest','INTENT'],
 ['anonymous conversation',x=>x.quote.executable=false,'NON_EXECUTABLE'],
 ['missing quote source',x=>x.quote.sourceId='missing','QUOTE_SOURCE'],
 ['unsupported source',x=>x.sources[0].verified=false,'QUOTE_SOURCE'],
 ['conflicting sources',x=>x.conflicts.push('different coin identity'),'SOURCE_CONFLICT'],
 ['stale quote',x=>x.quote.observedAt='2026-11-15T11:00:00Z','QUOTE_TIME'],
 ['future quote',x=>x.quote.observedAt='2026-11-18T11:00:00Z','QUOTE_TIME'],
 ['future evidence cannot repair history',x=>x.sources[0].availableAt='2026-11-18T11:00:00Z','QUOTE_SOURCE'],
 ['expired quote',x=>x.quote.expiresAt=x.decisionAt,'QUOTE_EXPIRY'],
 ['invalid decision timestamp',x=>x.decisionAt='yesterday','DECISION_TIME'],
 ['missing timestamp zone',x=>x.quote.observedAt='2026-11-17T11:00:00','QUOTE_TIME'],
 ['unknown authenticity',x=>x.coin.authenticated=false,'COIN_IDENTITY'],
 ['unknown condition',x=>delete x.coin.condition,'COIN_IDENTITY'],
 ['unknown mintmark',x=>delete x.coin.mintmark,'COIN_IDENTITY'],
 ['unverified identity',x=>x.coin.identityVerified=false,'COIN_IDENTITY'],
 ['modern issue excluded',x=>x.coin.year=2021,'COIN_IDENTITY'],
 ['nonissue year excluded',x=>x.coin.year=1910,'COIN_IDENTITY'],
 ['wrong series excluded',x=>x.coin.series='Peace','COIN_IDENTITY'],
 ['wrong currency',x=>x.quote.currency='CAD','QUOTE_UNITS'],
 ['lot quote cannot be per coin',x=>x.quote.unit='lot','QUOTE_UNITS'],
 ['unknown fees',x=>delete x.quote.fees,'COSTS'],
 ['negative fees',x=>x.quote.fees=-1,'COSTS'],
 ['string price',x=>x.quote.amount='42','QUOTE_AMOUNT'],
 ['nonfinite price',x=>x.quote.amount=Infinity,'QUOTE_AMOUNT'],
 ['missing dealer',x=>delete x.quote.counterparty,'TERMS'],
 ['missing terms',x=>delete x.quote.terms,'TERMS'],
 ['missing spot evidence',x=>x.spot.sourceId='missing','SPOT_SOURCE'],
 ['stale spot',x=>x.spot.observedAt='2026-11-15T11:00:00Z','SPOT_TIME'],
 ['wrong spot units',x=>x.spot.unit='USD_per_gram','SPOT_UNITS'],
 ['collectible total plus metal double counts',x=>x.addCollectibleTotalToMelt=50,'DOUBLE_COUNT'],
 ['duplicate source ids',x=>x.sources[1].id='bid','SOURCE_IDS'],
 ['missing freshness policy',x=>delete x.maxAgeHours,'FRESHNESS_POLICY'],
 ['invalid quantity',x=>x.quote.quantity=0,'QUOTE_UNITS']
];
for(const [name,mutate,reason] of cases)test(name,async()=>{const x=base();mutate(x);const r=(await gate()).evaluate(x);assert.equal(r.status,'HOLD');assert.ok(r.reasons.includes(reason),JSON.stringify(r));assert.equal(r.netProceeds,null);});
test('buy direction supports ask comparison',async()=>{const x=base();x.intent='buy';x.quote.kind='ask';const r=(await gate()).evaluate(x);assert.equal(r.status,'READY_FOR_COMPARISON');assert.equal(r.totalCost,45);assert.equal(r.netProceeds,null);});
test('preserves prior failure and correction without mutating input',async()=>{const x=base();x.history=[{status:'HOLD',reason:'Initially treated unverified quote as bid'}];const before=JSON.stringify(x);const r=(await gate()).evaluate(x);assert.equal(JSON.stringify(x),before);assert.equal(r.audit.history[0].status,'HOLD');assert.equal(r.audit.history.length,2);});
test('empty and malformed inputs fail closed',async()=>{for(const x of [null,{},[],{sources:{}}])assert.equal((await gate()).evaluate(x).status,'HOLD');});
test('arithmetic uses declared conventional silver content',async()=>{const m=await gate();assert.equal(m.SILVER_OZT,0.7734);assert.ok(Math.abs(m.silverFromWeight(26.73)-0.7734505102)<1e-9);assert.throws(()=>m.silverFromWeight(-1));});

