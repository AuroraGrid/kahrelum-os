import test from 'node:test';
import assert from 'node:assert/strict';
import { handleOdds, normalizedEvents } from '../functions/api/odds.js';

const sample = [{
 id:'game001',sport_key:'americanfootball_nfl',home_team:'Arizona Cardinals',away_team:'Atlanta Falcons',commence_time:'2026-11-03T00:00:00Z',
 bookmakers:[
  {key:'draftkings',title:'DraftKings',last_update:'2026-11-01T04:00:00Z',markets:[{key:'h2h',last_update:'2026-11-01T04:01:00Z',outcomes:[{name:'Atlanta Falcons',price:+110},{name:'Arizona Cardinals',price:-120}]}]},
  {key:'fanduel',title:'FanDuel',last_update:'2026-11-01T04:02:00Z',markets:[{key:'h2h',last_update:'2026-11-01T04:02:00Z',outcomes:[{name:'Atlanta Falcons',price:+115},{name:'Arizona Cardinals',price:-125}]}]}
 ]
}];
function mockKV(){const m=new Map();return {m,async get(k){return m.get(k)??null},async put(k,v){m.set(k,v)}}}
function request(query='sport=americanfootball_nfl&region=us&market=h2h'){return new Request('https://lineupsandlines.pages.dev/api/odds?'+query)}
function cfg(kv){return {ODDS_API_KEY:'test-secret',ODDS_CACHE:kv,ODDS_DAILY_CREDIT_LIMIT:'10',ODDS_MONTHLY_CREDIT_LIMIT:'300'}}
function apiResponse(body=sample, status=200, headers={'x-requests-remaining':'499','x-requests-last':'1'}){
  return new Response(JSON.stringify(body),{status,headers});
}
async function body(response){return response.json()}

test('fail closed without key, including status and no fake odds', async()=>{
 const r=await handleOdds({request:request(),env:{ODDS_CACHE:mockKV()}},async()=>{throw Error('unexpected request')},Date.parse('2026-11-01T04:05:00Z'));
 const x=await body(r);assert.equal(x.status,'NOT_CONFIGURED');assert.deepEqual(x.events,[]);
});

test('fail closed without persistent quota KV and never hit upstream',async()=>{
 const r=await handleOdds({request:request(),env:{ODDS_API_KEY:'key'}},async()=>{throw Error('must not call')},Date.parse('2026-11-01T04:05:00Z'));
 assert.equal((await body(r)).status,'QUOTA_STORE_MISSING');
});

test('input allowlist prevents arbitrary upstream queries or SSRF',async()=>{
 const env=cfg(mockKV());
 for(const q of ['sport=http://attacker', 'sport=basketball_nba&region=zz', 'sport=basketball_nba&region=us&market=player_points', 'sport=basketball_nba&region=us,uk', 'sport=basketball_nba&region=us&market=h2h,totals']){
  const r=await handleOdds({request:request(q),env},async()=>{throw Error('must not call')});
  assert.equal(r.status,400);
 }
});

test('one provider call normalizes named bookmakers and precise source timestamps',async()=>{
 const calls=[],kv=mockKV();
 const r=await handleOdds({request:request(),env:cfg(kv)},async u=>{calls.push(u);return apiResponse()},Date.parse('2026-11-01T04:05:00Z'));
 const x=await body(r);
 assert.equal(x.status,'OK');assert.equal(x.events.length,1);assert.equal(x.events[0].books.length,2);
 assert.equal(x.events[0].books[0].markets[0].outcomes[0].americanOdds,110);
 assert.equal(x.events[0].books[0].markets[0].updatedAt,'2026-11-01T04:01:00Z');
 assert.equal(x.bookmakerCount,2);assert.equal(calls.length,1);
 assert.ok(calls[0].includes('api.the-odds-api.com'));
 assert.ok(calls[0].includes('apiKey=test-secret'));
 assert.ok(!JSON.stringify(x).includes('test-secret'));
});

test('fresh KV cache prevents repeat API calls and preserves original timestamps',async()=>{
 const kv=mockKV();let calls=0;
 const fetcher=async()=>{calls++;return apiResponse()};
 const first=await body(await handleOdds({request:request(),env:cfg(kv)},fetcher,Date.parse('2026-11-01T04:05:00Z')));
 const next=await body(await handleOdds({request:request(),env:cfg(kv)},fetcher,Date.parse('2026-11-01T04:06:00Z')));
 assert.equal(calls,1);assert.equal(next.cache,'HIT');assert.equal(next.observedAt,first.observedAt);
});

test('daily quota blocks new API calls when already exhausted',async()=>{
 const kv=mockKV();await kv.put('usage:daily:2026-11-01','10');
 const r=await handleOdds({request:request(),env:cfg(kv)},async()=>{throw Error('must not call')},Date.parse('2026-11-01T04:05:00Z'));
 assert.equal((await body(r)).status,'DAILY_BUDGET_EXHAUSTED');
});

test('monthly quota blocks new API calls when already exhausted',async()=>{
 const kv=mockKV();await kv.put('usage:monthly:2026-11','300');
 const r=await handleOdds({request:request(),env:cfg(kv)},async()=>{throw Error('must not call')},Date.parse('2026-11-01T04:05:00Z'));
 assert.equal((await body(r)).status,'MONTHLY_BUDGET_EXHAUSTED');
});

test('upstream failures remain transparent with no fabricated bookmaker prices',async()=>{
 const r=await handleOdds({request:request(),env:cfg(mockKV())},async()=>apiResponse({message:'unauthorized'},401),Date.parse('2026-11-01T04:05:00Z'));
 const x=await body(r);
 assert.equal(x.status,'PROVIDER_ERROR');assert.deepEqual(x.events,[]);assert.equal(x.providerHttpStatus,401);
});

test('normalizer rejects nonsensical bookmaker prices and retains source identity',()=>{
 const list=structuredClone(sample);
 list[0].bookmakers[0].markets[0].outcomes.push({name:'Bad',price:0});
 list[0].bookmakers[0].markets[0].outcomes.push({name:'Bad2',price:-70});
 const x=normalizedEvents(list,Date.parse('2026-11-01T04:05:00Z'));
 assert.equal(x[0].books[0].markets[0].outcomes.length,2);
 assert.equal(x[0].books[0].key,'draftkings');
});

test('explicitly identifies started events as provisional in-play, not confirmed open markets',()=>{
 const list=structuredClone(sample);list[0].commence_time='2026-11-01T03:00:00Z';
 assert.equal(normalizedEvents(list,Date.parse('2026-11-01T04:05:00Z'))[0].eventState,'STARTED_STATUS_UNCONFIRMED');
});
