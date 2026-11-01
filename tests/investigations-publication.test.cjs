'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('ten independently labeled public records preserve evidence and portfolio boundaries', () => {
  const html = read('investigations.html');
  const ids = ["CORP-04","CYBER-02","MKT-02","CORP-01","CORP-02","COURT-05","COURT-01","CYBER-01","AI-05","GEO-01"];
  const found = [...html.matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].map((m) => m[1]);
  assert.deepEqual(found, ids);
  assert.equal(new Set(found).size, 10);
  for (const id of ids) {
    const beginning = html.indexOf('data-case-id="' + id + '"');
    const ending = html.indexOf('</article>', beginning);
    assert.ok(beginning >= 0 && ending > beginning, id + ': complete card');
    const card = html.slice(beginning, ending);
    for (const required of ['Original finding', 'Updated evidence', 'Decision significance', 'Primary sources, unresolved records and falsifiers', 'Portfolio:', 'https://']) {
      assert.ok(card.includes(required), id + ': missing ' + required);
    }
    assert.match(card, /data-reviewed="2026-1[01]-[0-3][0-9]"/);
  }
  assert.match(html, /56 historical case families and four extension leads/);
  assert.match(html, /not ten completed investigations/);
  assert.match(html, /No sums across distinct Meta cases or presumed payments/);
  assert.match(html, /NEEDS REDACTION/);
  assert.doesNotMatch(html, /<script\b/i);
});

test('scoped Firebase release cannot republish older elections, NFL, homepage or files outside investigations', () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const wrapper = read('scripts/deploy-unified-firebase.ps1');
  const profile = script.match(/  investigations: \{([\s\S]*?)\n  \},/);
  assert.ok(profile, 'dedicated investigations release profile must exist');
  assert.match(profile[1], /overlayFiles: \['investigations\.html'\]/);
  assert.match(profile[1], /sitemapRoutes: \['\/investigations'\]/);
  assert.match(profile[1], /includeHomepage: false/);
  assert.doesNotMatch(profile[1], /nfl\/|election\/|one\.html|forecasting\.html|index\.html|divisions\.css/);
  assert.match(script, /changedPaths\.some\(\(item\) => !\['\/investigations\.html', '\/sitemap\.xml'\]\.includes\(item\)\)/);
  assert.match(wrapper, /ValidateSet\([^\n]*"investigations"\)/);
  assert.match(wrapper, /stale-directory deployment path has been removed/);
});

test('integrity CI executes the scoped investigations regression test', () => {
  const workflow = read('.github/workflows/public-surface-integrity.yml');
  assert.match(workflow, /node --test[^\n]*tests\/investigations-publication\.test\.cjs/);
});
