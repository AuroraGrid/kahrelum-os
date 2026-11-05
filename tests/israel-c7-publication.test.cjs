'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const text = p => fs.readFileSync(path.join(root, p), 'utf8');
const data = () => JSON.parse(text('election/israel-certified-2026.json'));
const c7 = 'https://github.com/AuroraGrid/kahrelum-os/blob/68e12a07b7998a0267c4a345f3df6ce22229d89f/research/israel-2026-election/C7_OFFICIAL_RESULT_AND_CALIBRATION_2026-11-05.md';

test('C7 website gold source uses signed CEC documents and exact official valid-vote total', () => {
  const d = data();
  assert.equal(d.certifiedValidVotes, 5691426);
  assert.equal(d.certifiedTotalBallots, 5717397);
  assert.equal(d.certifiedInvalidVotes, 25971);
  assert.equal(d.certifiedTotalBallots - d.certifiedInvalidVotes, d.certifiedValidVotes);
  assert.equal(d.c7.status, 'CLOSED');
  assert.equal(d.c7.process.pass, 6);
  assert.equal(d.c7.process.miss, 4);
  assert.equal(d.c7.proprietaryWinnerBrier, 'NOT_EVALUABLE');
  assert.equal(d.c7.goldDocumentDate, '2026-11-04');
  assert.match(d.c7.caseRecordUrl, /C7_OFFICIAL_RESULT_AND_CALIBRATION_2026-11-05/);
  assert.ok(d.goldSourceUrls.some(u => /Memorandum%20-%20Results%20of%20the%2026th%20Knesset%20Elections.pdf/.test(u)));
  assert.ok(d.goldSourceUrls.some(u => /results_Appendix_to_the_memorandum_26th%20Knesset%20Elections.pdf/.test(u)));
  assert.equal(d.results.length, 14);
  assert.equal(d.results.reduce((sum, p) => sum + p.certifiedSeats, 0), 120);
  assert.equal(d.scores.externalOctober26.l1, 20);
  assert.equal(d.scores.externalOctober26.mae, 1.428571);
  assert.equal(d.scores.externalOctober26.rmse, 2.070197);
});

test('C7 page describes completed process, frozen third-party forecast and capture misses without a proprietary pre-election claim', () => {
  const h = text('israel-certified-2026.html');
  assert.match(h, /C7.*completed|completed.*C7/i);
  assert.match(h, /5,691,426/);
  assert.match(h, /6 PASS/);
  assert.match(h, /4 MISS/);
  assert.match(h, /L1.*20|20.*L1/i);
  assert.match(h, /2\.070/);
  assert.match(h, /not evaluable/i);
  assert.match(h, /25%.*50%.*75%/s);
  assert.match(h, /official.*PDF|signed.*memorandum/i);
  assert.ok(h.includes(c7));
  assert.match(h, /post-close/i);
  assert.match(h, /not.*pre-election|after.*polls.*closed/i);
  assert.doesNotMatch(h, /C7.*pending|certification pending/i);
});

test('public site entry points advertise C7 completion, not an unresolved Israeli election', () => {
  const forecast = text('forecasting.html');
  const homeFragment = text('hosting/homepage-divisions.html');
  assert.match(forecast, /Israel 2026.*C7 completed/s);
  assert.match(forecast, /6 PASS.*4 MISS/s);
  assert.match(forecast, /\/israel-certified-2026/);
  assert.doesNotMatch(forecast, /Israel 2026 · certification pending/i);
  assert.match(homeFragment, /Israel.*C7.*complete/i);
  assert.match(homeFragment, /\/israel-certified-2026/);
});

test('isolated Firebase C7 release cannot replace U.S. results, APIs or other research pages', () => {
  const wrapper = text('scripts/deploy-unified-firebase.ps1');
  const publisher = text('scripts/firebase-overlay-release.cjs');
  assert.match(wrapper, /"israel-c7"/);
  const m = publisher.match(/'israel-c7':\s*\{([\s\S]*?)\n\s*\},/);
  assert.ok(m, 'israel-c7 profile is required');
  for (const p of ['israel-certified-2026.html', 'israel-certified-2026.js', 'election/israel-certified-2026.json', 'forecasting.html']) {
    assert.ok(m[1].includes(p), p);
  }
  assert.match(m[1], /includeHomepage:\s*true/);
  assert.doesNotMatch(m[1], /election-results-2026|nfl\/|candidate-portraits|investigations\.html/);
  assert.match(publisher, /Israel C7 release attempted to replace an unrelated live Firebase path/);
  assert.match(publisher, /israel\.certifiedValidVotes\s*!==\s*5691426/);
  assert.match(publisher, /israel\.c7\?\.process\?\.pass\s*!==\s*6/);
  assert.match(publisher, /israel\.c7\?\.process\?\.miss\s*!==\s*4/);
});
