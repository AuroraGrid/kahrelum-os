const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const map = require('../election-challenge-map.js');
const root = path.resolve(__dirname,'..');
const read = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const ledger = read('election/candidate-portraits.json');
const makeRaces = () => map.buildRaces(read('election/house-forecast-lock.json'),read('election/current-projections.json'));

test('actual 940-card roster admits exactly 373 matching portraits',() => {
  const races = makeRaces();
  assert.equal(races.reduce((n,r) => n+r.candidates.length,0),940);
  assert.deepEqual(map.applyPortraitLedger(races,ledger),{matchedCards:373,uniquePeople:373,available:true});
  assert.equal(map.portraitCount(races),373);
});

test('reused IDs, wrong identity and duplicate records cannot attach another face',() => {
  for (const field of ['candidateName','state','party','contestId','chamber']) {
    const changed = structuredClone(ledger);
    changed.records[0][field] = 'wrong';
    assert.equal(map.applyPortraitLedger(makeRaces(),changed).matchedCards,372,field);
  }
  const duplicate = structuredClone(ledger);
  duplicate.records.push(duplicate.records[0]);
  assert.equal(map.applyPortraitLedger(makeRaces(),duplicate).matchedCards,372);
});

test('unavailable photo ledger preserves all races and clears stale photos',() => {
  const races = makeRaces();
  map.applyPortraitLedger(races,ledger);
  assert.deepEqual(map.applyPortraitLedger(races,null),{matchedCards:0,uniquePeople:0,available:false});
  assert.equal(races.length,470);
  assert.equal(map.portraitCount(races),0);
});

test('photo HTML reserves size, loads lazily, credits rights and keeps initials underneath',() => {
  const races=makeRaces(); map.applyPortraitLedger(races,ledger);
  const race=races.find(r=>r.candidates.some(map.admittedPortrait));
  const html=map.candidateCards(race);
  assert.match(html,/width="56" height="56" loading="lazy"/);
  assert.match(html,/class="nominee-avatar/);
  assert.match(html,/Photo source/);
  assert.match(html,/Public domain/);
  assert.match(html,/alt="[^"<>]+"/);
});

test('remote image failure removes only the broken photo, exposing its existing fallback',() => {
  let removed=0;
  const image={classList:{contains:cls=>cls==='nominee-photo'},remove:()=>{removed++;}};
  map.handlePortraitError({target:image});
  assert.equal(removed,1);
  map.handlePortraitError({target:{classList:{contains:()=>false},remove:()=>{throw new Error('wrong element');}}});
});

test('untrusted URL schemes never become admitted images',() => {
  const portrait={...ledger.records[0],url:'javascript:alert(1)'};
  assert.equal(map.admittedPortrait({portrait}),null);
});
