'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('eleven independently labeled public records preserve evidence and portfolio boundaries', () => {
  const html = read('investigations.html');
  const ids = ["CORP-04","CYBER-02","MKT-02","CORP-01","CORP-02","CORP-03","COURT-05","COURT-01","CYBER-01","AI-05","GEO-01"];
  const found = [...html.matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].map((m) => m[1]);
  assert.deepEqual(found, ids);
  assert.equal(new Set(found).size, 11);
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
  assert.match(html, /not eleven completed investigations/);
  assert.match(html, /No sums across distinct Meta cases or presumed payments/);
  assert.match(html, /NEEDS REDACTION/);
  assert.match(html, /NOT SUITABLE/);
  assert.match(html, /data-investigations-release="2026-11-01\.2"/);
  const youth = html.slice(html.indexOf('data-case-id="CORP-03"'), html.indexOf('data-case-id="COURT-05"'));
  assert.match(youth, /D-101-CV-2023-02838/);
  assert.match(youth, /\$567 million/);
  assert.match(youth, /\$375 million/);
  assert.match(youth, /appeal filings, any stay, collections and compliance are UNKNOWN/);
  assert.doesNotMatch(html, /<script\b/i);
});

test('scoped Firebase release cannot republish older elections, NFL, homepage or files outside investigations', () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const wrapper = read('scripts/deploy-unified-firebase.ps1');
  const profile = script.match(/  investigations: \{([\s\S]*?)\n  \},/);
  assert.ok(profile, 'dedicated investigations release profile must exist');
  assert.match(profile[1], /overlayFiles: \['investigations\.html'\]/);
  assert.match(profile[1], /sitemapRoutes: \[\]/);
  assert.match(profile[1], /includeHomepage: false/);
  assert.doesNotMatch(profile[1], /nfl\/|election\/|one\.html|forecasting\.html|index\.html|divisions\.css/);
  assert.match(script, /changedPaths\.some\(\(item\) => item !== '\/investigations\.html'\)/);
  assert.match(wrapper, /ValidateSet\([^\n]*"investigations"\)/);
  assert.match(wrapper, /stale-directory deployment path has been removed/);
});

test('integrity CI executes the scoped investigations regression test', () => {
  const workflow = read('.github/workflows/public-surface-integrity.yml');
  assert.match(workflow, /node --test[^\n]*tests\/investigations-publication\.test\.cjs/);
});


test('investigations overlay preserves opaque live hashes and never fetches or rewrites the sitemap', async () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const definitions = script.slice(0, script.lastIndexOf('\nmain().catch'));
  const build = new Function('require', '__dirname', 'process', 'fetch', 'Buffer',
    definitions + '\nreturn buildOverlay;')(require, path.join(root, 'scripts'), process,
      async () => { throw new Error('A bounded investigations release must not fetch unrelated live bytes'); }, Buffer);
  const fileMap = {
    '/sitemap.xml': 'opaque-hash-from-another-platform',
    '/index.html': 'live-home-hash',
    '/election/current-projections.json': 'concurrent-election-hash',
    '/nfl/desk-live.json': 'concurrent-nfl-hash',
  };
  const live = { fileMap, config: { cleanUrls: true, rewrites: [
    {glob: '/api/v1', path: '/data/api/v1/index.json'},
    {glob: '/api/v1/release', path: '/data/api/v1/release.json'},
    {glob: '/api/v1/example', path: '/data/api/v1/example.json'},
  ] } };
  const result = await build(live, 'investigations');
  for (const [name, hash] of Object.entries(fileMap)) assert.equal(result.desired[name], hash);
  assert.deepEqual(result.changedPaths, ['/investigations.html']);
  assert.deepEqual(live.fileMap, fileMap);
});


test('version lifecycle passes project and site separately to the installed Firebase CLI API', async () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const definitions = script.slice(0, script.lastIndexOf('\nmain().catch'));
  const createPreview = new Function('require', '__dirname', 'process', 'fetch', 'Buffer',
    definitions + '\nreturn createPreview;')(require, path.join(root, 'scripts'), process,
      async () => { throw new Error('No network access in this lifecycle test'); }, Buffer);
  const stop = new Error('Stop after observing finalization arguments');
  const config = {cleanUrls: true};
  const version = 'projects/806087933597/sites/kahrelum-public-hosting/versions/test';
  const calls = [];
  const hosting = {
    async createVersion(project, site, body) {
      calls.push(['create', project, site, body]);
      return version;
    },
    async updateVersion(project, site, id, body) {
      calls.push(['finalize', project, site, id, body]);
      throw stop;
    },
  };
  const client = { async post(url, body) {
    assert.equal(url, '/' + version + ':populateFiles');
    assert.deepEqual(body.files, {'/investigations.html': 'new-hash'});
    return {body: {uploadRequiredHashes: []}};
  } };
  await assert.rejects(createPreview(hosting, client, {config},
    {desired: {'/investigations.html': 'new-hash'}, changedPaths: ['/investigations.html']},
    'investigations', {commit: 'test', clean: true}), error => error === stop);
  assert.deepEqual(calls, [
    ['create', 'kahrelum-public-hosting', 'kahrelum-public-hosting', {
      config, labels: {'deployment-tool': 'kahrelum-safe-overlay'},
    }],
    ['finalize', 'kahrelum-public-hosting', 'kahrelum-public-hosting', 'test', {status: 'FINALIZED'}],
  ]);
});
