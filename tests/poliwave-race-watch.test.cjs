'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const election=require('../election-challenge-map.js');
const root=path.resolve(__dirname,'..');
const read=x=>JSON.parse(fs.readFileSync(path.join(root,x),'utf8'));
const races=election.buildRaces(read('election/house-forecast-lock.json'),read('election/current-projections.json'));

test('Poliwave is a first-look link for all 470 already-tracked congressional races',()=>{
 const watch=read('election/poliwave-watchlist.json');
 assert.equal(races.length,470);
 assert.equal(watch.status,'LINK_REFERENCE_ONLY_NO_IMPORTED_POLIWAVE_DATA');
 assert.equal(watch.records.length,470);
 assert.equal(watch.coverage.house,435);
 assert.equal(watch.coverage.senate,35);
 const refs=new Map(watch.records.map(r=>[r.contestId,r]));
 assert.equal(refs.size,470);
 for(const race of races){
  const record=refs.get(race.contestId);
  assert.ok(record,'missing '+race.contestId);
  assert.equal(record.poliwaveUrl,election.poliwaveRaceUrl(race));
  assert.equal(record.chamber,race.chamber);
  assert.equal(record.state,race.state);
  assert.equal(record.resultStatus,'NOT_IMPORTED');
  assert.equal(record.officialCertification,'NOT_VERIFIED');
 }
});

test('Poliwave URLs are known published state and office routes, not forged result data',()=>{
 assert.equal(election.poliwaveRaceUrl({state:'AK',chamber:'House'}),'https://www.poliwave.com/us/live/midterms-2026/alaska/house');
 assert.equal(election.poliwaveRaceUrl({state:'OH',chamber:'House'}),'https://www.poliwave.com/us/live/midterms-2026/ohio/house');
 assert.equal(election.poliwaveRaceUrl({state:'TX',chamber:'Senate'}),'https://www.poliwave.com/us/live/midterms-2026/texas');
 assert.equal(election.poliwaveRaceUrl({state:'XX',chamber:'House'}),null);
 assert.equal(election.poliwaveRaceUrl({state:'TX',chamber:'Governor'}),null);
 const html=election.raceCard(races.find(r=>r.chamber==='House'&&r.state==='AK'));
 assert.match(html,/poliwave\.com\/us\/live\/midterms-2026\/alaska\/house/);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.match(html,/Unofficial source/);
 assert.doesNotMatch(html,/Poliwave says .*winner|Poliwave predicts .*winner/);
});

test('the watchlist is reference-only and protects frozen forecast inputs',()=>{
 const watch=read('election/poliwave-watchlist.json');
 assert.equal(watch.licenseUrl,'https://www.poliwave.com/about/licensing');
 assert.equal(watch.policy.copiedVotes,false);
 assert.equal(watch.policy.automatedBulkExtraction,false);
 assert.equal(watch.policy.officialStateCertificationRequired,true);
 for(const row of watch.records){
  assert.ok(/^https:\/\/www\.poliwave\.com\/us\/live\/midterms-2026\/[a-z-]+(?:\/house)?$/.test(row.poliwaveUrl));
  for(const key of ['votes','voteShare','winner','called','forecastProbability','polledupdate']) assert.equal(Object.hasOwn(row,key),false,row.contestId+' '+key);
 }
});

test('Firebase Poliwave release profile is bounded to three public reference files',()=>{
 const overlay=fs.readFileSync(path.join(root,'scripts/firebase-overlay-release.cjs'),'utf8');
 const wrapper=fs.readFileSync(path.join(root,'scripts/deploy-unified-firebase.ps1'),'utf8');
 const match=overlay.match(/'poliwave-watch':\s*\{([\s\S]*?)\n\s*\},/);
 assert.ok(match,'Missing poliwave-watch scoped release profile');
 const files=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
 assert.deepEqual(files,['election-challenge.html','election-challenge-map.js','election/poliwave-watchlist.json']);
 assert.match(match[1],/sitemapRoutes:\s*\[\]/);
 assert.match(match[1],/includeHomepage:\s*false/);
 assert.match(wrapper,/"poliwave-watch"/);
 const html=fs.readFileSync(path.join(root,'election-challenge.html'),'utf8');
 assert.match(html,/Poliwave 2026 results/);
 assert.match(html,/poliwave-watchlist\.json/);
 assert.doesNotMatch(html,/Unofficial results confirmed|Official winners from Poliwave/);
});
