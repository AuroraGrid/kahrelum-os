'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const slug = 'insights/hegseth-impeachment-forecast-2026.html';
const url = 'https://kahrelum.com/insights/hegseth-impeachment-forecast-2026';
const imagePath = 'assets/social/og-hegseth-impeachment-forecast-2026.png';

test('Hegseth article has dated source labels, a unique canonical, social card, and custody boundary', () => {
  const html = read(slug);
  assert.match(html, new RegExp('<link rel="canonical" href="' + url + '">'));
  assert.match(html, new RegExp('<meta property="og:url" content="' + url + '">'));
  assert.ok(html.includes(url.replace('https://kahrelum.com', '/')) || html.includes('Hegseth'));
  for (const phrase of ['KAHRELUM-US-HEGSETH-20261109-V1', 'November 9, 2026',
    '76%', '45%', '62%', 'not independently time-locked', 'subjective',
    'allegations', 'House impeachment is not Senate conviction']) {
    assert.ok(html.toLowerCase().includes(phrase.toLowerCase()), phrase);
  }
  assert.match(html, /<meta property="og:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-hegseth-impeachment-forecast-2026\.png">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.ok(html.includes('https://clerk.house.gov/evs/2026/roll307'));
  assert.ok(html.includes('https://massie.house.gov/news/documentsingle.aspx?DocumentID=395863'));
});
test('snapshot preserves original event definitions and horizons without recasting them as verified track record', () => {
  const record=JSON.parse(read('research/us-hegseth-2026/2026-11-09_v1_original.json'));
  assert.equal(record.record_id, 'KAHRELUM-US-HEGSETH-20261109-V1');
  assert.equal(record.status, 'local analysis snapshot; not publicly posted or cryptographically time-locked');
  const find=(type,deadline)=>record.forecast_events.find(x=>x.event===type&&x.deadline_local.startsWith(deadline))?.probability;
  assert.equal(find('formal_house_impeachment','2026-11-20'),0.64);
  assert.equal(find('formal_house_impeachment','2026-12-31'),0.76);
  assert.equal(find('departure','2026-12-31'),0.45);
  assert.equal(find('departure','2027-01-31'),0.62);
  assert.equal(find('senate_conviction','2027-06-30'),0.05);
  assert.equal(record.successor_first_nominee_conditional.reduce((n,x)=>n+x.probability,0),1);
});
test('social card is a distinct actual 1200 by 630 PNG and website discovery includes the forecast',()=>{
  const img=fs.readFileSync(path.join(root,imagePath));
  assert.equal(img.subarray(1,4).toString(),'PNG');
  assert.equal(img.readUInt32BE(16),1200);
  assert.equal(img.readUInt32BE(20),630);
  for (const p of ['insights.html','forecasting.html','sitemap.md']) {
    assert.ok(read(p).includes('/insights/hegseth-impeachment-forecast-2026'),p);
  }
});
test('Firebase overlay and GitHub workflow scope this article, its original snapshot and social PNG',()=>{
  const publisher=read('scripts/firebase-overlay-release.cjs');
  const workflow=read('.github/workflows/firebase-scoped-release.yml');
  assert.match(publisher, /'hegseth-forecast':\s*\{/);
  for(const p of [slug,imagePath,'insights.html','forecasting.html']) assert.ok(publisher.includes(p),p);
  assert.ok(publisher.includes('/insights/hegseth-impeachment-forecast-2026'));
  for(const p of [slug,imagePath,'insights.html','forecasting.html','hegseth-forecast']) assert.ok(workflow.includes(p),p);
  assert.match(workflow, /--preview --profile/);
  assert.match(workflow, /--promote --profile/);
  assert.doesNotMatch(workflow, /firebase deploy --only hosting/);
});
