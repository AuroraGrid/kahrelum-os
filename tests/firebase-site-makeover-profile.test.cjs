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
    'site-shell.css',
    'site-shell.js',
    'pilot.html',
    'demo.html',
    'digital-id.html',
  ]) {
    assert.ok(profile.includes("'" + file + "'"), file + ' must be included in the bounded release');
  }
  for (const route of [
    '/index.html', '/assurance', '/investigations', '/forecasting', '/election-challenge',
    '/nfl/weekly-brief', '/sports/mlb', '/sample', '/connect', '/hasan',
    '/election-live', '/election-count', '/election-method', '/election-showdown',
    '/election-comparison',
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


const footerStart = source.indexOf('function normalizeSharedFooter(');
const footerEnd = source.indexOf('function injectSharedShell(', footerStart);
assert.ok(footerStart >= 0 && footerEnd > footerStart, 'Shared footer normalization must exist');
const normalizeSharedFooter = new Function(
  source.slice(footerStart, footerEnd) + '\nreturn normalizeSharedFooter;'
)();

test('release normalization consolidates page footers without dropping publication details', () => {
  const html = '<html><body><main>Page content</main>' +
    '<footer class="site-local-footer"><p>Publication boundary: example note.</p><p>© 2026 KAHRELUM</p></footer>' +
    '<footer class="site-footer"><div class="site-footer-inner"><nav aria-label="Footer navigation">' +
    '<a href="/os">KAHRELUM OS</a><a href="/pilot#request">Pilot inquiry</a>' +
    '<a href="mailto:hasan@kahrelum.com">hasan@kahrelum.com</a>' +
    '<a href="https://github.com/AuroraGrid/kahrelum-os">GitHub repository</a>' +
    '</nav><p>Independent, operator-assisted research and evidence review. Not a certification.</p></div></footer>' +
    '</body></html>';
  const result = normalizeSharedFooter(html);

  assert.equal(result.split('<footer').length - 1, 1);
  assert.ok(result.includes('Publication boundary: example note.'));
  assert.ok(result.includes('© 2026 KAHRELUM'));
  assert.ok(result.includes('mailto:hasan@kahrelum.com'));
  assert.ok(result.includes('https://github.com/AuroraGrid/kahrelum-os'));
  assert.ok(result.includes('Independent, operator-assisted research and evidence review. Not a certification.'));
});

test('shared screenshot polish hooks are present', () => {
  const css = fs.readFileSync(path.join(root, 'site-shell.css'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'site-shell.js'), 'utf8');
  const digitalId = fs.readFileSync(path.join(root, 'digital-id.html'), 'utf8');
  const pilot = fs.readFileSync(path.join(root, 'pilot.html'), 'utf8');

  assert.ok(css.includes('.site-wordmark{color:#5b3b73!important}'));
  assert.match(css, /\.site-mobile-menu>summary[^}]*border:1px solid/);
  assert.ok(css.includes('.digital-id-watch-callout{padding:14px 16px!important}'));
  assert.ok(css.includes('.pilot-wrap section>.eyebrow'));
  assert.ok(shell.includes('Commercial Assurance'));
  assert.ok(shell.includes('Public Intelligence Desks'));
  assert.ok(digitalId.includes('digital-id-watch-callout'));
  assert.ok(pilot.includes('Target delivery: 2 business days (Fit Check) · 5 business days (Founding Pilot)'));
});


test('legacy article-only routes gain a valid skip target without changing article text', () => {
  const html = '<html><head></head><body><header>Local heading</header>' +
    '<article><h1>Published article</h1><p>Preserve this research text.</p></article>' +
    '<footer class="site-local-footer">Copyright</footer></body></html>';
  const result = injectSharedShell(html, '/nfl/analysis').toString('utf8');

  assert.ok(result.includes('<main id="main-content"><article>'));
  assert.ok(result.includes('href="#main-content">Skip to main content</a>'));
  assert.ok(result.includes('<p>Preserve this research text.</p>'));
  assert.ok(result.includes('</article></main>'));
});
