'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const investigations = fs.readFileSync(path.join(root, 'investigations.html'), 'utf8');
const { buildCaseShareArtifacts } = require('../scripts/case-social-pages.cjs');

test('all twelve already-published case IDs get unique URLs, titles and source-bound cards', () => {
  const result = buildCaseShareArtifacts(investigations);
  const expected = [...investigations.matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].map(m => m[1]);
  assert.equal(expected.length, 12);
  assert.equal(result.cases.length, expected.length);
  assert.deepEqual(result.cases.map(x => x.id), expected);
  assert.equal(new Set(result.cases.map(x => x.url)).size, expected.length);
  assert.equal(new Set(result.cases.map(x => x.imagePath)).size, expected.length);
  for (const item of result.cases) {
    assert.equal(item.url, '/investigations/' + item.slug + '.html');
    assert.match(item.html, new RegExp('<link rel="canonical" href="https://kahrelum\\.com/investigations/' + item.slug + '\\.html">'));
    assert.ok(item.html.includes('og:image'));
    assert.ok(item.html.includes('og:title'));
    assert.ok(item.html.includes('og:description'));
    assert.ok(item.html.includes('twitter:image'));
    assert.ok(item.html.includes(item.id));
    assert.ok(item.html.includes(item.title));
    assert.ok(item.html.includes('Original finding'));
    assert.ok(result.overview.includes('href="' + item.url + '"'));
  }
});

test('default investigations overview is not advertised as AIR-01', () => {
  const { overview } = buildCaseShareArtifacts(investigations);
  assert.match(overview, /<meta property="og:title" content="Investigations &amp; OSINT \| KAHRELUM">/);
  assert.match(overview, /<meta property="og:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-investigations\.png">/);
  assert.doesNotMatch(overview.slice(0, overview.indexOf('</head>')), /og-air01-v1\.png|AIR-01: Learjet/);
  assert.equal((overview.match(/class="case-share-link"/g) || []).length, 12);
});

test('each case has a distinct valid 1200x630 PNG image, independently safe for social crawlers', () => {
  const { cases } = buildCaseShareArtifacts(investigations);
  const fingerprints = new Set();
  for (const c of cases) {
    assert.equal(c.image.subarray(1, 4).toString('ascii'), 'PNG');
    assert.equal(c.image.readUInt32BE(16), 1200);
    assert.equal(c.image.readUInt32BE(20), 630);
    assert.ok(c.image.length > 4000);
    fingerprints.add(crypto.createHash('sha256').update(c.image).digest('hex'));
    assert.ok(c.html.includes('content="https://kahrelum.com' + c.imagePath + '"'));
  }
  assert.equal(fingerprints.size, cases.length);
});

test('cases requiring redaction are not made newly indexable by dedicated pages', () => {
  const { cases } = buildCaseShareArtifacts(investigations);
  for (const c of cases.filter(x => x.status === 'NEEDS REDACTION' || x.status === 'NOT SUITABLE')) {
    assert.ok(c.html.includes('name="robots" content="noindex,nofollow"'), c.id);
    assert.ok(!c.includeInSitemap, c.id);
  }
});

test('case share release is scoped and preserves archived evidence and other modules', () => {
  const publisher = fs.readFileSync(path.join(root, 'scripts/firebase-overlay-release.cjs'), 'utf8');
  assert.match(publisher, /'case-share-cards': \{/);
  assert.match(publisher, /buildCaseShareArtifacts\(/);
  assert.match(publisher, /caseShare\.cases/);
  assert.match(publisher, /source.*investigations|investigations.*source/s);
  assert.match(publisher, /removedPaths: \[\]/);
});
