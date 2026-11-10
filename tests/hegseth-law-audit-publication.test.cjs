'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const page = 'insights/hegseth-war-powers-fact-check.html';
const route = '/insights/hegseth-war-powers-fact-check';
const canonical = 'https://kahrelum.com' + route;

test('Hegseth legal audit page, editorial index and source ledger are source-bounded', () => {
  const html = read(page);
  assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'));
  assert.ok(html.includes('<meta property="og:url" content="' + canonical + '">'));
  for (const v of ['76%', '64%', '45%', '5%', '10 U.S.C. §184',
    'Kelly v. Hegseth', 'R42738', 'R42699', 'preliminary injunction',
    'not a fresh statistically calibrated model']) {
    assert.ok(html.includes(v), v);
  }
  assert.ok(read('insights.html').includes('href="' + route + '"'));
  assert.ok(read('sitemap.md').includes(canonical));
  assert.ok(read('research/hegseth-war-powers/2026-11-10-source-ledger.md')
    .includes('DO NOT MUTATE'));
});

test('Firebase publisher scopes a distinct Hegseth legal audit release and readback', () => {
  const publisher = read('scripts/firebase-overlay-release.cjs');
  const workflow = read('.github/workflows/firebase-scoped-release.yml');

  assert.ok(publisher.includes("'hegseth-law-audit': {"), 'dedicated release profile missing');
  assert.ok(publisher.includes(page), 'article excluded from release artifact manifest');
  assert.ok(publisher.includes("sitemapRoutes: ['" + route + "']"), 'sitemap route missing');
  assert.ok(publisher.includes("profileName === 'hegseth-law-audit'"),
    'no readback or scoped path protection');
  assert.ok(publisher.includes("['/insights', '" + route + "']"),
    'verification must request the canonical article');
  assert.ok(publisher.includes('Hegseth legal audit article missing from production'),
    'post-promotion readback missing');

  assert.ok(workflow.includes("      - '" + page + "'"), 'new article does not trigger publisher');
  assert.ok(workflow.includes("selections+=(hegseth-law-audit)"), 'new profile is not selected');
  assert.ok(workflow.includes('hegseth-law-audit|'), 'publisher allowlist missing new profile');
  assert.ok(workflow.includes('          - hegseth-law-audit'), 'manual dispatch option missing');
  assert.ok(workflow.includes('--preview --profile'));
  assert.ok(workflow.includes('--promote --profile'));
  assert.doesNotMatch(workflow, /firebase deploy --only hosting/);
});
