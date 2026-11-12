'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const page = 'insights/malik-beasley-sentencing-2026.html';
const record = 'research/malik-beasley-2026/MB-2026-01.json';
const url = 'https://kahrelum.com/insights/malik-beasley-sentencing-2026';
const commit = '805d5df3c04eb5320f223dc552c55516dc487f76';

test('prospective v1 is one fixed, identifiable, scoreable judicial event', () => {
  const f = JSON.parse(read(record));
  assert.equal(f.forecast_id, 'KAHRELUM-NBA-MB-20261112-V1');
  assert.equal(f.primary.probability_yes, 0.62);
  assert.equal(f.primary.threshold_months, 12);
  assert.equal(f.secondary_unscored_analysis.probability_any_federal_imprisonment, 0.82);
  assert.equal(f.secondary_unscored_analysis.central_judgment_months, 18);
  const buckets = Object.values(f.secondary_unscored_analysis.scenario_distribution_pct);
  assert.equal(buckets.reduce((a,b)=>a+b,0),100);
  assert.equal(f.secondary_unscored_analysis.scenario_distribution_pct['12_to_35_months']+
    f.secondary_unscored_analysis.scenario_distribution_pct['36_to_59_months']+
    f.secondary_unscored_analysis.scenario_distribution_pct['60_plus_months'], 62);
  assert.match(f.primary.pending_if,/no sentence|No sentence/i);
  assert.match(f.primary.settlement_yes,/12 months or longer/);
  assert.match(f.primary.settlement_no,/less than 12 months/);
});

test('article accurately discloses a forecast, no invented sentence and original lock source', () => {
  const html = read(page);
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'));
  assert.match(html,/>62%</);
  assert.match(html,/82%/);
  assert.match(html,/18 months/);
  assert.match(html,/2026-12-09/);
  assert.match(html,/plea hearing, not a sentencing hearing/i);
  assert.match(html,/pending|unresolved/i);
  assert.match(html,/allegations.*not findings/i);
  assert.ok(html.includes(commit),'the original GitHub custody commit must be linked');
  assert.ok(html.includes('26-CR-190'));
  assert.ok(html.includes('brier') || html.includes('Brier'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('name="twitter:image"'));
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('property="og:image:height" content="630"'));
  assert.ok(!html.includes('sentenced on December 9'));
});

test('discovery and release are scoped; no change to historical ledgers, homepage or production config', () => {
  assert.ok(read('insights.html').includes('/insights/malik-beasley-sentencing-2026'));
  assert.ok(read('forecasting.html').includes('/insights/malik-beasley-sentencing-2026'));
  assert.ok(read('sitemap.md').includes(url));
  assert.ok(read('llms.txt').includes(url));
  const publisher = read('scripts/firebase-overlay-release.cjs');
  const profile = publisher.match(/'malik-beasley-forecast': \{([\s\S]*?)\n  \},/);
  assert.ok(profile, 'dedicated publication profile required');
  assert.ok(profile[1].includes(page));
  assert.ok(profile[1].includes('includeHomepage: false'));
  assert.ok(!profile[1].includes('index.html'));
  assert.ok(!profile[1].includes('nfl/forecast-ledger.json'));
  assert.ok(!profile[1].includes('election/house-forecast-lock.json'));
  assert.ok(publisher.includes("profileName === 'malik-beasley-forecast'"));
  const workflow=read('.github/workflows/firebase-scoped-release.yml');
  assert.ok(workflow.includes('profiles="malik-beasley-forecast"'));
  assert.ok(workflow.includes('malik-beasley-forecast|'));
});
