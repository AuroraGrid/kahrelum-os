'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Hegseth legal and forecast pages disclose the actual November 10 House procedural result without relocking the forecast',()=>{
  for(const page of ['insights/hegseth-impeachment-forecast-2026.html','insights/hegseth-war-powers-fact-check.html']){
    const html=read(page);
    assert.match(html,/id="hegseth-nov12-update"/,page);
    assert.match(html,/clerk\.house\.gov\/votes\/2026317/,page);
    assert.match(html,/211[^\d]+204/,page);
    assert.match(html,/not (?:a|an) (?:House )?impeachment (?:vote|decision|adoption)/i,page);
    assert.match(html,/research\/us-hegseth-2026\/2026-11-12-procedural-vote-addendum\.md/,page);
  }
  const original=read('insights/hegseth-impeachment-forecast-2026.html');
  assert.match(original,/<strong>76%<\/strong>/);
  assert.match(original,/<strong>45%<\/strong>/);
  assert.match(read('research/us-hegseth-2026/2026-11-12-procedural-vote-addendum.md'),/not.*(?:formal|actual).*impeachment/i);
});

test('CHIP-01 and companion Insight attribute the November 12 Megaspeed claims and preserve open-case status',()=>{
  for(const page of ['investigations/chip-01.html','insights/nvidia-megaspeed-chip-custody.html']){
    const html=read(page);
    assert.match(html,/id="chip01-nov12-update"/,page);
    assert.match(html,/reuters\.com\/world\/china\/nvidia-customer-megaspeed-says-it-cooperated-with-us-inspections-takes-export-2026-11-12\//,page);
    assert.match(html,/Megaspeed.{0,500}(?:says|said|claims)/i,page);
    assert.match(html,/research\/chip-01\/update-2026-11-12\.md/,page);
  }
  const ledger=read('research/chip-01/update-2026-11-12.md');
  assert.match(ledger,/independent (?:official|BIS) (?:confirmation|verification)|not independently verified/i);
});

test('deadline-day FC1 page separates registered dates from actual Nov 10 club completions, without inventing a winner',()=>{
  const html=read('nfl/trade-volume-challenge-2026.html');
  assert.match(html,/id="nfl-nov12-outcome-update"/);
  assert.match(html,/five completed/i);
  assert.match(html,/seven.*register/i);
  assert.match(html,/Daiyan Henley/i);
  assert.match(html,/denverbroncos\.com\/news\/statement-from-the-broncos/);
  assert.match(html,/2026-11-12_FC1_OUTCOME_ADJUDICATION\.md/);
  assert.match(html,/OUTCOME NOT YET ADJUDICATED/);
  const ledger=read('research/nfl-2026-trade-deadline/2026-11-12_FC1_OUTCOME_ADJUDICATION.md');
  assert.match(ledger,/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK\.json/);
  assert.match(ledger,/Bates/i);
  assert.match(ledger,/Davis/i);
  assert.match(ledger,/Henley/i);
  const original=JSON.parse(read('research/nfl-2026-trade-deadline/official-forecasts/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json'));
  assert.equal(original.model.pointForecast,6);
  assert.equal(original.scoring.outcome,null);
});

test('US election map continues loading the source-validated, same-origin 506-race snapshot',()=>{
  const js=read('election-results-2026.js');
  assert.match(js,/fetch\('\/election\/results-2026-snapshot\.json/);
  const data=JSON.parse(read('election/results-2026-snapshot.json'));
  assert.equal(data.schema,'KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1');
  assert.equal(data.house.length,435);
  assert.equal(data.senate.length,35);
  assert.equal(data.governor.length,36);
  assert.equal(data.resultStatus,'UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED');
});
