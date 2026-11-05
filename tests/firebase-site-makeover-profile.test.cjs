'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/firebase-overlay-release.cjs'), 'utf8');
const wrapper = fs.readFileSync(path.join(root, 'scripts/deploy-unified-firebase.ps1'), 'utf8');
const start = source.indexOf('function injectSharedShell(');
const end = source.indexOf('\nfunction replaceHomepageSection(', start);
assert.ok(start >= 0 && end > start, 'The bounded live-page shell transformer must exist');
const injectSharedShell = new Function(
  'fail',
  'htmlAttribute',
  'Buffer',
  source.slice(start, end) + '\nreturn injectSharedShell;'
)((message) => { throw new Error(message); }, (value) => value, Buffer);

test('site makeover release profile is explicit and includes the legacy public routes', () => {
  const profileStart = source.indexOf("'site-makeover': {");
  const profileEnd = source.indexOf("  full: {", profileStart);
  assert.ok(profileStart >= 0 && profileEnd > profileStart);
  const profile = source.slice(profileStart, profileEnd);
  for (const file of [
    'index.html',
    'site-shell.css',
    'site-shell.js',
    'pilot.html',
    'demo.html',
    'data/api/v1/example.json',
    'sports/mlb.html',
    'sports/nhl.html',
  ]) {
    assert.ok(profile.includes("'" + file + "'"), file + ' must be included in the bounded release');
  }
  for (const route of [
    '/sample', '/connect', '/hasan', '/election-live', '/election-count',
    '/election-method', '/election-showdown', '/election-comparison',
  ]) {
    assert.ok(profile.includes("'" + route + "'"), route + ' must receive the shared shell');
  }
  assert.match(wrapper, /ValidateSet.*site-makeover/s);
});

test('legacy-page transformation preserves page content and adds one shared shell', () => {
  const html = '<!doctype html><html><head><title>Existing page</title></head><body>' +
    '<a class="skip-link" href="#main-content">Skip to content</a>' +
    '<div class="wrap"><header><a class="wordmark" href="/">KAHRELUM</a></header>' +
    '<main><p>FACT: preserve the existing published record.</p></main></div></body></html>';
  const once = injectSharedShell(html, '/sample').toString('utf8');
  const twice = injectSharedShell(once, '/sample').toString('utf8');

  assert.ok(twice.includes('FACT: preserve the existing published record.'));
  assert.ok(twice.includes('Skip to main content'));
  assert.ok(twice.includes('href="#main-content"'));
  assert.ok(twice.includes('/site-shell.css'));
  assert.ok(twice.includes('/site-shell.js'));
  assert.ok(twice.includes('Public Research Labs'));
  assert.ok(twice.includes('href="/pilot#request"'));
  assert.ok(twice.includes('Independent, operator-assisted research and evidence review. Not a certification.'));
  assert.equal((twice.match(/class="site-header"/g) || []).length, 1);
  assert.equal((twice.match(/class="site-footer"/g) || []).length, 1);
  assert.equal((twice.match(/class="site-next-steps"/g) || []).length, 1);
});

test('legacy election page gets election-specific next steps without replacing its evidence text', () => {
  const html = '<html><head></head><body><main><p>Frozen record remains as published.</p></main></body></html>';
  const result = injectSharedShell(html, '/election-method').toString('utf8');

  assert.ok(result.includes('Frozen record remains as published.'));
  assert.ok(result.includes('href="/forecasting">Read the forecasting desk -></a>'));
  assert.ok(result.includes('href="/election-challenge">Review the election challenge -></a>'));
});
