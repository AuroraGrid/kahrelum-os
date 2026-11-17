const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const map = require('../election-challenge-map.js');
const root = path.resolve(__dirname,'..');
const read = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const ledger = read('election/candidate-portraits.json');
const admittedCount = ledger.coverage.admittedPortraits;
const makeRaces = () => map.buildRaces(read('election/house-forecast-lock.json'),read('election/current-projections.json'));

test('actual 940-card roster admits its entire verified portrait ledger',() => {
  const races = makeRaces();
  assert.equal(races.reduce((n,r) => n+r.candidates.length,0),940);
  assert.ok(admittedCount >= 373);
  assert.deepEqual(map.applyPortraitLedger(races,ledger),{matchedCards:admittedCount,uniquePeople:admittedCount,available:true});
  assert.equal(map.portraitCount(races),admittedCount);
});

test('reused IDs, wrong identity and duplicate records cannot attach another face',() => {
  for (const field of ['candidateName','state','party','contestId','chamber']) {
    const changed = structuredClone(ledger);
    changed.records[0][field] = 'wrong';
    assert.equal(map.applyPortraitLedger(makeRaces(),changed).matchedCards,admittedCount-1,field);
  }
  const duplicate = structuredClone(ledger);
  duplicate.records.push(duplicate.records[0]);
  assert.equal(map.applyPortraitLedger(makeRaces(),duplicate).matchedCards,admittedCount-1);
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

test('local public-domain photos require the exact identity and content-hash path',() => {
  const base = {...ledger.records[0],imageSha256:'a'.repeat(64)};
  base.url = `/assets/candidate-portraits/${base.bioguideId}-${base.imageSha256.slice(0,16)}.jpg`;
  assert.equal(map.admittedPortrait({portrait:base}),base);
  for (const url of ['/assets/candidate-portraits/../wrong.jpg','//example.com/photo.jpg',base.url.replace('-aaaaaaaa','-bbbbbbbb')]) {
    assert.equal(map.admittedPortrait({portrait:{...base,url}}),null);
  }
});

test('non-Congress portraits use real FEC identity and complete Commons rights, without Bioguide IDs',() => {
  const portrait=ledger.records.find(r=>r.identityType==='FEC_CANDIDATE');
  assert.ok(portrait);
  assert.equal(portrait.bioguideId,undefined);
  assert.equal(map.admittedPortrait({portrait}),portrait);
  for(const patch of [{identityType:'UNKNOWN'},{identityId:'S6XX00000'},{bioguideId:'F999999'},
    {license:'Fair use'},{licenseUrl:'https://example.com/'},{attribution:''},{rightsBasis:''},
    {commonsRevisionId:1},{sourceOriginalImageSha1:''},{identitySourceSha256:''},
    {url:'https://example.com/wrong-person.jpg',sourceThumbnailUrl:'https://example.com/wrong-person.jpg'}]) {
    assert.equal(map.admittedPortrait({portrait:{...portrait,...patch}}),null,JSON.stringify(patch));
  }
  for(const field of ['candidateName','state','party','chamber','contestId','sourceCandidateId']){
    const changed=structuredClone(ledger);
    changed.records.find(r=>r.identityType==='FEC_CANDIDATE')[field]='wrong';
    assert.equal(map.applyPortraitLedger(makeRaces(),changed).matchedCards,admittedCount-1,field);
  }
});

test('licensed-image creator credit and source/license links remain visible',()=>{
  const races=makeRaces();map.applyPortraitLedger(races,ledger);
  const race=races.find(r=>r.candidates.some(c=>c.portrait?.identityType==='FEC_CANDIDATE' && c.portrait.license.startsWith('CC BY')));
  assert.ok(race);
  const html=map.candidateCards(race);
  assert.match(html,/CC BY/);
  assert.match(html,/Photo source/);
  assert.match(html,/Source thumbnail; no additional edits/);
  const portrait=race.candidates.find(c=>c.portrait?.identityType==='FEC_CANDIDATE').portrait;
  assert.ok(html.includes(portrait.attribution.replace(/&/g,'&amp;')));
});


test('newly licensed Commons derivatives bind to their exact roster records and reject substitutions', () => {
  const races = makeRaces();
  assert.equal(map.applyPortraitLedger(races, ledger).matchedCards, admittedCount);
  for (const name of ['Hallie Shoffner','Charles Booker','Annie Andrews']) {
    const row = ledger.records.find(r => r.candidateName === name);
    assert.ok(row && row.identityType === 'CREDITED_COMMONS_PHOTO',name);
    assert.equal(map.admittedPortrait({portrait:row}),row,name);
    const match = races.flatMap(r => r.candidates).find(c => c.sourceCandidateId === row.sourceCandidateId);
    assert.equal(match?.portrait,row,name);
    const race = races.find(r => r.candidates.includes(match));
    const html = map.candidateCards(race);
    assert.match(html,/Previously cropped source thumbnail; no additional edits by KAHRELUM/);
    assert.ok(html.includes(row.attribution));
    for (const patch of [
      {identityType:'UNVERIFIED'},{license:'Fair use'},{licenseUrl:'https://example.org'},
      {sourceUrl:'https://commons.wikimedia.org/wiki/File:Wrong_Person.jpg'},
      {sourceImageUrl:'https://midtermsforecast.com/img/cand/S-AK_left.jpg'},
      {url:'/assets/candidate-portraits/123-aaaa.jpg'},{imageSha256:'a'.repeat(64)},
      {width:95},{attribution:''},{identityId:'File:Other_Person.jpg'}
    ]) assert.equal(map.admittedPortrait({portrait:{...row,...patch}}),null,name + ' ' + JSON.stringify(patch));
  }
});

test('local Commons photos require FEC evidence, scoped permissions and visible creator credit', () => {
  const races=makeRaces(); map.applyPortraitLedger(races,ledger);
  const rows=ledger.records.filter(r=>r.identityType==='FEC_LOCAL_COMMONS');
  assert.equal(rows.length,5);
  for(const row of rows){
    assert.equal(map.admittedPortrait({portrait:row}),row);
    const race=races.find(r=>r.candidates.some(c=>c.portrait===row));
    assert.ok(race,row.candidateName);
    const html=map.candidateCards(race);
    assert.ok(html.includes(row.creditNote || row.attribution));
    assert.match(html,/Source thumbnail; no additional edits/);
    for(const patch of [{fecCandidateId:'S6XX00000'},{identitySourceSha256:''},
      {identitySourceUrl:'https://example.org'},{url:'https://example.org/photo.jpg'},
      {license:'Public domain'},{licenseUrl:'https://example.org/license'},
      {sourceCapture:{sha256:''}},{attribution:''},{bioguideId:'F999999'}]){
      assert.equal(map.admittedPortrait({portrait:{...row,...patch}}),null,row.candidateName+' '+JSON.stringify(patch));
    }
    for(const field of ['candidateName','state','party','chamber','contestId','sourceCandidateId']){
      const changed=structuredClone(ledger);
      changed.records.find(r=>r.sourceCandidateId===row.sourceCandidateId)[field]='wrong';
      assert.equal(map.applyPortraitLedger(makeRaces(),changed).matchedCards,admittedCount-1,field);
    }
  }
});

test('November 3 byte-verified Commons batch attaches 26 exact FEC-bound candidate pictures', () => {
  const photos = ledger.records.filter(p => p.identityType === 'FEC_ENWIKI_SHARED_COMMONS');
  assert.equal(photos.length, 26);
  const races = makeRaces();
  assert.equal(map.applyPortraitLedger(races,ledger).matchedCards,admittedCount);
  for (const portrait of photos) {
    assert.equal(map.admittedPortrait({portrait}),portrait,portrait.candidateName);
    const match = races.flatMap(r=>r.candidates).find(c=>c.sourceCandidateId===portrait.sourceCandidateId);
    assert.equal(match?.portrait,portrait,portrait.candidateName);
    const race=races.find(r=>r.candidates.includes(match));
    const html=map.candidateCards(race);
    assert.ok(html.includes(portrait.attribution.replace(/&/g,'&amp;')),portrait.candidateName);
    assert.ok(html.includes('Source thumbnail; no additional edits'),portrait.candidateName);
    for(const bad of [
      {identityType:'UNVERIFIED'},
      {fecCandidateId:'H6ZZ00000'},
      {identitySourceUrl:'https://example.com/'},
      {license:'Fair use'},
      {licenseUrl:'https://example.com/wrong'},
      {imageSha256:'0'.repeat(64)},
      {url:'/assets/candidate-portraits/123-bad.jpg'},
      {rightsBasis:''},
      {attribution:''},
      {commonsImageSha1:''}
    ]) assert.equal(map.admittedPortrait({portrait:{...portrait,...bad}}),null,
                    portrait.candidateName+' '+JSON.stringify(bad));
  }
});
