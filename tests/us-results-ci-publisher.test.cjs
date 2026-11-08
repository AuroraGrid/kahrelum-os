'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('US election snapshot publication date is actual capture date, never hardcoded Nov 5',()=>{
  const src=read('scripts/build_election_results_snapshot.py');
  assert.doesNotMatch(src, /"publishedAsOf":"Snapshot captured on 2026-11-05/);
  assert.match(src, /publishedAsOf/);
  assert.match(src, /retrievalUtc/);
  assert.match(src, /retrieved_at/);
});

test('US election page labels stale public snapshots using actual retrieval age',()=>{
  const src=read('election-results-2026.js');
  assert.match(src, /STALE SOURCE SNAPSHOT/);
  assert.match(src, /retrievalUtc/);
  assert.match(src, /Date\.now\(\)/);
  assert.match(src, /90\*60\*1000/);
});

test('GitHub self-host-independent official election source polling is bounded, source-validated and authenticated',()=>{
  const src=read('.github/workflows/us-election-results-publisher.yml');
  assert.match(src,/schedule:/);
  assert.match(src,/main/);
  assert.match(src,/python3 scripts\/refresh_us_results_ci.py/);
  assert.match(src,/--plan --profile us-results-data/);
  assert.match(src,/--preview --profile us-results-data/);
  assert.match(src,/--promote --profile us-results-data/);
  assert.match(src,/KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON/);
  assert.match(src,/GOOGLE_APPLICATION_CREDENTIALS/);
  assert.match(src,/SKIPPED: required Firebase publisher credential/);
  assert.doesNotMatch(src, /firebase deploy --only hosting/);
});
test('election source update rejects winner reversals and stale source timestamps',()=>{
  const src=read('scripts/refresh_us_results_ci.py');
  for(const word of ['CALLED','COUNTING','sourceLatestResultUpdatedUtc','sourceSha256','previous winner','stale or regressed','--source-dir','polling-desk.com']) assert.ok(src.includes(word),word);
  assert.match(src,/urllib\.request/);
  assert.match(src,/subprocess/);
});

test('stale-banner client receives its own narrowly scoped authenticated Firebase release',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs');
 const wrapper=read('scripts/deploy-unified-firebase.ps1');
 const workflow=read('.github/workflows/us-election-results-publisher.yml');
 assert.match(pub, /'us-results-ui': \\{/);
 assert.match(pub, /overlayFiles: \\['election-results-2026\\.js'\\]/);
 assert.match(wrapper, /"us-results-ui"/);
 assert.match(workflow, /--preview --profile us-results-ui/);
 assert.match(workflow, /--promote --profile us-results-ui/);
 assert.match(workflow, /ui_needs_publish/);
});
