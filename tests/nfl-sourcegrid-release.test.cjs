'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const text = rel => fs.readFileSync(path.join(root,rel),'utf8');
const script = text('scripts/firebase-overlay-release.cjs');
const wrapper = text('scripts/deploy-unified-firebase.ps1');
const expected = [
  'nfl/sourcegrid.json', 'nfl/source-observations.json', 'nfl/review-queue.json',
  'nfl/refresh-status.json', 'nfl/source-health.json', 'nfl/public-feed.json',
  'nfl/publishing.json', 'nfl/deadline-audit.json', 'nfl/forecast-ledger.json',
  'nfl/desk-live.json',
];

test('NFL operational publication uses an exact ten-file Firebase data-only overlay', () => {
  const match = script.match(/'nfl-sourcegrid-data':\s*\{([\s\S]*?)\n\s*\},/);
  assert.ok(match, 'missing guarded SourceGrid data profile');
  const section = match[1];
  const entries = [...section.matchAll(/'([^']+\.json)'/g)].map(m=>m[1]);
  assert.deepEqual(entries.sort(), [...expected].sort());
  assert.match(section,/sitemapRoutes:\s*\[\]/);
  assert.match(section,/includeHomepage:\s*false/);
  assert.match(wrapper,/"nfl-sourcegrid-data"/);
  assert.doesNotMatch(section,/html|\.png|forecasting|israel|house-forecast-lock|candidate-portraits/);
});

test('SourceGrid Firebase publication cannot replace unrelated live paths or roll back source freshness', () => {
  assert.match(script,/profileName === 'nfl-sourcegrid-data'\s*&&\s*changedPaths\.some/);
  assert.match(script,/RELEASE_PROFILES\['nfl-sourcegrid-data'\]\.overlayFiles/);
  assert.match(script,/lastCompletedCheckAt/);
  assert.match(script,/SourceGrid.*older|older.*SourceGrid/i);
  assert.match(script,/sourceStatus|sourcegrid.*refresh-status/);
});

test('Operating state keeps verified source, scoring, and editorial boundaries intact', () => {
  const status=JSON.parse(text('nfl/refresh-status.json'));
  const publishing=JSON.parse(text('nfl/publishing.json'));
  const ledger=JSON.parse(text('nfl/forecast-ledger.json'));
  const desk=JSON.parse(text('nfl/desk-live.json'));
  assert.equal(status.monitoringState,'DEADLINE_WINDOW_OPEN');
  assert.ok(['DEGRADED','FRESH','STALE_FAILED'].includes(status.feedFreshness));
  assert.equal(publishing.publishingAuthorized,false);
  assert.ok(Array.isArray(ledger.eligibleLocks));
  assert.ok(Array.isArray(ledger.historicalExcluded));
  assert.equal(desk.schema,'KAHRELUM_NFL_DESK_LIVE_v1.0');
});
