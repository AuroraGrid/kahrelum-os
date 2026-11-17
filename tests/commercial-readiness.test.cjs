'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { PAGE_PATCHES, MODIFIED_ROUTES, patchLivePage, setSitemapLastmod } = require('../scripts/commercial-readiness.cjs');

test('public research pages retain their records and link to the accurately scoped paid Fit Check', () => {
  for (const filename of ['forecasting.html', 'investigations.html', 'digital-id.html']) {
    const html = fs.readFileSync(path.join(root, filename), 'utf8');
    assert.match(html, /href="\/pilot#request"[^>]*>Historical AI decision review: \$750 Fit Check/);
    for (const { after } of PAGE_PATCHES[filename]) assert.ok(html.includes(after), filename);
  }
  const forecasting = fs.readFileSync(path.join(root, 'forecasting.html'), 'utf8');
  assert.ok(forecasting.includes('ELECTION CLOSED 3 NOV 2026'));
  assert.ok(!forecasting.includes('Before resolution, no competitor is declared beaten.'));
  assert.ok(forecasting.includes('0.222593') && forecasting.includes('0.146176'));
  const investigations = fs.readFileSync(path.join(root, 'investigations.html'), 'utf8');
  assert.ok(investigations.includes('CAUSE UNDETERMINED'));
  const identity = fs.readFileSync(path.join(root, 'digital-id.html'), 'utf8');
  assert.ok(identity.includes('NOT ASSESSED'));
});

test('live-page patch changes only exact intended snippets and is repeatable', () => {
  for (const [filename, changes] of Object.entries(PAGE_PATCHES)) {
    const original = '<html><main>' + changes.map(x => x.before).join(' // ') + '</main></html>';
    const patched = patchLivePage(filename, original);
    for (const { before, after } of changes) {
      assert.ok(patched.includes(after));
      assert.ok(!patched.includes(before));
    }
    assert.equal(patchLivePage(filename, patched), patched);
    assert.throws(() => patchLivePage(filename, '<html>unexpected live page</html>'), /expected.*patch|patch.*expected/i);
  }
});

test('sitemap dates only the modified pages and leaves unrelated entries unchanged', () => {
  const original = '<?xml version="1.0"?><urlset>' +
    '<url><loc>https://kahrelum.com/</loc><lastmod>2026-10-01</lastmod></url>' +
    '<url><loc>https://kahrelum.com/forecasting</loc></url>' +
    '<url><loc>https://kahrelum.com/investigations</loc></url>' +
    '<url><loc>https://kahrelum.com/digital-id</loc></url></urlset>';
  const updated = setSitemapLastmod(original, MODIFIED_ROUTES);
  for (const route of Object.keys(MODIFIED_ROUTES)) {
    assert.ok(updated.includes('<loc>https://kahrelum.com' + route + '</loc><lastmod>2026-11-05</lastmod>'));
  }
  assert.ok(updated.includes('<loc>https://kahrelum.com/</loc><lastmod>2026-10-01</lastmod>'));
  assert.equal(setSitemapLastmod(updated, MODIFIED_ROUTES), updated);
  assert.throws(() => setSitemapLastmod(original.replace('https://kahrelum.com/digital-id','https://kahrelum.com/other'), MODIFIED_ROUTES), /missing|expected|unique/i);
});

test('llms.txt describes offers and limits without inventing any customer outcome', () => {
  const txt = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
  assert.match(txt, /^# KAHRELUM/m);
  for (const needle of ['https://kahrelum.com/pilot', 'https://kahrelum.com/evidence-scorecard', 'https://kahrelum.com/demo', '$750', '$2,500', 'synthetic', 'No client results claimed']) {
    assert.ok(txt.includes(needle), 'Missing: ' + needle);
  }
});

test('commercial release is specifically gated and never uses a broad Hosting deployment', () => {
  const script = fs.readFileSync(path.join(root, 'scripts/firebase-overlay-release.cjs'), 'utf8');
  const wrapper = fs.readFileSync(path.join(root, 'scripts/deploy-unified-firebase.ps1'), 'utf8');
  assert.match(script, /'commercial-readiness':\s*\{/);
  assert.match(script, /profileName === 'commercial-readiness'/);
  assert.match(script, /\/llms\.txt/);
  assert.match(script, /\/sitemap\.xml/);
  assert.match(wrapper, /commercial-readiness/);
  assert.doesNotMatch(wrapper, /firebase deploy --only hosting/i);
});
