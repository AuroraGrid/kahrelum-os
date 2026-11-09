'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const w=fs.readFileSync(path.join(__dirname,'../.github/workflows/firebase-scoped-release.yml'),'utf8');

test('publisher chooses scoped profiles based on changed pages rather than blindly publishing CHIP-01',()=>{
  assert.match(w,/name: Resolve changed publication profiles/);
  assert.match(w,/git diff --name-only/);
  assert.match(w,/ai-intelligence-evaluation-2026\.html/);
  assert.match(w,/opticodds-market-integrity\.html/);
  assert.match(w,/evidence-scorecard\.html/);
  assert.match(w,/chip01-publication/);
  assert.doesNotMatch(w,/RELEASE_PROFILE:.*github\.event_name\s*==\s*'push'\s*&&\s*'chip01-publication'/);
  assert.match(w,/No relevant content changed/);
});

test('manual releases remain bounded and avoid no-op preview failures',()=>{
  for (const p of ['ai-evaluation','opticodds-market-integrity','chip01-publication','lead-magnet','us-results-data','nfl-sourcegrid-data']) {
    assert.ok(w.includes(p),p);
  }
  assert.match(w,/changedPaths/);
  assert.match(w,/--plan --profile/);
  assert.match(w,/--preview --profile/);
  assert.match(w,/--promote --profile/);
  assert.match(w,/KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON/);
  assert.match(w,/firebase-tools@15\.34\.2/);
  assert.match(w,/concurrency:/);
  assert.doesNotMatch(w,/firebase deploy --only hosting/);
});
