'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('twelve independently labeled public records preserve evidence and portfolio boundaries', () => {
  const html = read('investigations.html');
  const ids = ["CORP-04","CYBER-02","MKT-02","CORP-01","CORP-02","CORP-03","COURT-05","COURT-01","CYBER-01","AI-05","GEO-01","AIR-01"];
  const found = [...html.matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].map((m) => m[1]);
  assert.deepEqual(found, ids);
  assert.equal(new Set(found).size, 12);
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
  assert.match(html, /not twelve completed investigations/);
  assert.match(html, /No sums across distinct Meta cases or presumed payments/);
  assert.match(html, /NEEDS REDACTION/);
  assert.match(html, /NOT SUITABLE/);
  assert.match(html, /data-investigations-release="2026-11-02\.1"/);
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
  assert.match(profile[1], /overlayFiles: \['investigations\.html', 'assets\/social\/og-air01-v1\.png'\]/);
  assert.match(profile[1], /sitemapRoutes: \[\]/);
  assert.match(profile[1], /includeHomepage: false/);
  assert.doesNotMatch(profile[1], /nfl\/|election\/|one\.html|forecasting\.html|index\.html|divisions\.css/);
  assert.match(script, /changedPaths\.some/);
  assert.match(script, /og-air01-v1\.png/);
  const profileSet = wrapper.match(/ValidateSet\(([^\n]*)\)/)?.[1];
  assert.ok(profileSet, 'Firebase wrapper must declare an explicit ValidateSet');
  assert.ok(profileSet.split(', ').includes('"investigations"'), 'investigations profile stays available');
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
  assert.deepEqual(result.changedPaths, ['/assets/social/og-air01-v1.png', '/investigations.html']);
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
  await assert.rejects(createPreview(hosting, client, {config, version: {name: 'projects/806087933597/sites/kahrelum-public-hosting/versions/base'}},
    {desired: {'/investigations.html': 'new-hash'}, changedPaths: ['/investigations.html']},
    'investigations', {commit: 'test', clean: true}), error => error === stop);
  assert.deepEqual(calls, [
    ['create', 'kahrelum-public-hosting', 'kahrelum-public-hosting', {
      config, labels: {'deployment-tool': 'kahrelum-safe-overlay'},
    }],
    ['finalize', 'kahrelum-public-hosting', 'kahrelum-public-hosting', 'test', {status: 'FINALIZED'}],
  ]);
});


test('version lifecycle supports the two-argument Firebase CLI API installed by the guarded publisher', async () => {
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
    async createVersion(site, body) {
      calls.push(['create', site, body]);
      return version;
    },
    async updateVersion(site, id, body) {
      calls.push(['finalize', site, id, body]);
      throw stop;
    },
  };
  const client = { async post(url, body) {
    assert.equal(url, '/' + version + ':populateFiles');
    assert.deepEqual(body.files, {'/investigations.html': 'new-hash'});
    return {body: {uploadRequiredHashes: []}};
  } };
  await assert.rejects(createPreview(hosting, client, {config, version: {name: 'projects/806087933597/sites/kahrelum-public-hosting/versions/base'}},
    {desired: {'/investigations.html': 'new-hash'}, changedPaths: ['/investigations.html']},
    'investigations', {commit: 'test', clean: true}), error => error === stop);
  assert.deepEqual(calls, [
    ['create', 'kahrelum-public-hosting', {
      config, labels: {'deployment-tool': 'kahrelum-safe-overlay'},
    }],
    ['finalize', 'kahrelum-public-hosting', 'test', {status: 'FINALIZED'}],
  ]);
});


test('project-name aliases canonicalize to the verified project number without accepting another project or site', () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const definitions = script.slice(0, script.lastIndexOf('\nmain().catch'));
  const canonical = new Function('require', '__dirname', 'process', 'Buffer',
    definitions + '\nreturn canonicalVersionName;')(require, path.join(root, 'scripts'), process, Buffer);
  const live = 'projects/806087933597/sites/kahrelum-public-hosting/versions/base';
  const expected = 'projects/806087933597/sites/kahrelum-public-hosting/versions/19b135529a0ef046';
  assert.equal(canonical('projects/kahrelum-public-hosting/sites/kahrelum-public-hosting/versions/19b135529a0ef046', live), expected);
  assert.equal(canonical(expected, live), expected);
  assert.throws(() => canonical(expected.replace('806087933597', 'another-project'), live), /verified live project/);
  assert.throws(() => canonical(expected.replace('/sites/kahrelum-public-hosting/', '/sites/another-site/'), live), /verified live project/);
  assert.throws(() => canonical(expected + '/extra', live), /verified live project/);
});

test('AIR-01 retains explicit uncertainty, sources and all original card bytes', () => {
 const html=read('investigations.html');
 const card=html.match(/<article class="case-record"[^>]*data-case-id="AIR-01"[\s\S]*?<\/article>/)[0];
 for(const value of ['ACTIVE / CAUSE UNDETERMINED','No authenticated evidence establishes a Trump or Mar-a-Lago connection','LR60271 LLC','North Eleuthera','UNKNOWN','Competing hypotheses','Correction and update trail','https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=722BD','https://www.faa.gov/newsroom/statements/accident_incidents']) assert.ok(card.includes(value),value);
 const crypto=require('node:crypto');
 const prior=JSON.parse(read('tests/investigations-preserved-cards.json'));
 for(const m of html.matchAll(/<article class="case-record"[^>]*data-case-id="([^"]+)"[\s\S]*?<\/article>/g)) if(prior[m[1]]) assert.equal(crypto.createHash('sha256').update(m[0].replace(/\r\n/g, '\n')).digest('hex'),prior[m[1]],m[1]);
 assert.match(html, /<strong>12<\/strong><span>Public case records/);
 const register=JSON.parse(read('research/investigations-2026/AIR-01/evidence-register-v1.json'));
 for(const source of register.sources.filter(s=>s.public)) assert.ok(card.includes(source.url));
 assert.equal(register.forecast,null);
});

test('investigations overview is generic while AIR-01 has its own published 1200x630 card', () => {
 const html=read('investigations.html');
 const url='https://kahrelum.com/assets/social/og-investigations.png';
 for(const prop of ['og:image','og:image:secure_url']) assert.ok(html.includes('property="'+prop+'" content="'+url+'"'));
 assert.ok(html.includes('name="twitter:image" content="'+url+'"'));
 assert.ok(html.includes('property="og:title" content="Investigations &amp; OSINT | KAHRELUM"'));
 const {buildCaseShareArtifacts}=require('../scripts/case-social-pages.cjs');
 const air=buildCaseShareArtifacts(html).cases.find(x=>x.id==='AIR-01');
 assert.ok(air);
 for(const prop of ['og:image','og:image:secure_url']) assert.ok(air.html.includes('property="'+prop+'" content="https://kahrelum.com/assets/social/og-air01-v1.png"'));
 assert.ok(air.html.includes('CAUSE UNDETERMINED') || air.html.includes('cause undetermined') || air.html.includes('Cause undetermined'));
 const data=fs.readFileSync(path.join(root,'assets/social/og-air01-v1.png'));
 assert.equal(data.readUInt32BE(16),1200);assert.equal(data.readUInt32BE(20),630);
 const manifest=JSON.parse(read('assets/social-manifest.json')).cards.find(c=>c.route==='/investigations');
 assert.equal(manifest.image,'assets/social/og-investigations.png');
 assert.equal(manifest.sha256,require('node:crypto').createHash('sha256')
   .update(fs.readFileSync(path.join(root,manifest.image))).digest('hex'));
});

test('AIR-01 two-camera evidence and high-altitude leads remain explicitly bounded', () => {
 const html=read('investigations.html');
 const card=html.match(/<article class="case-record"[^>]*data-case-id="AIR-01"[\s\S]*?<\/article>/)[0];
 for(const value of ['Two-camera evidence and high-altitude upset (November 2 update)','VIDEO-A / descent view','VIDEO-B / fireball-only view','VIDEO-C / additional roadway clip','https://x.com/ScopeReport_/status/2116977473703354580','https://x.com/KeryexNetwork/status/2116983354788815342/video/1','https://myradar.com/layers/metnotes/details/86','do NOT establish sabotage']) assert.ok(card.includes(value),value);
 assert.match(card,/data-reviewed="2026-11-02"/);
 const register=JSON.parse(read('research/investigations-2026/AIR-01/video-evidence-review-v2.json'));
 assert.equal(register.caseId,'AIR-01');assert.equal(register.cause,'UNKNOWN');
 assert.equal(register.videoSources.length,3);assert.equal(register.originalSourceFilesAuthenticated,false);
 assert.equal((html.match(/data-case-id="AIR-01"/g)||[]).length,1);
});
