'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lib = require(path.join(root, 'evidence-scorecard.js'));
const PASS = Array(8).fill('PASS');
test('exactly eight review gates are defined', () => {
  assert.equal(lib.CONTROLS.length, 8);
  assert.equal(new Set(lib.CONTROLS).size, 8);
});
test('a gap always triggers escalation even when other gates are unknown', () => {
  assert.equal(lib.triage(['GAP', 'UNKNOWN', ...Array(6).fill('PASS')]), 'REVIEW / ESCALATE');
});
test('unknowns without a gap never become a pass', () => {
  assert.equal(lib.triage(['UNKNOWN', ...Array(7).fill('PASS')]), 'INCOMPLETE');
});
test('eight passes return bounded no-gap recorded', () => {
  assert.equal(lib.triage(PASS), 'NO GAP RECORDED');
});
test('unreviewed and malformed records remain unreviewed', () => {
  assert.equal(lib.triage([]), 'NOT REVIEWED');
  assert.equal(lib.triage(['PASS', ...Array(7).fill('')]), 'NOT REVIEWED');
  assert.equal(lib.triage(['PASS', ...Array(7).fill('CLAIMED')]), 'NOT REVIEWED');
});
test('CSV export includes case statuses and disarms formula injection', () => {
  const raw = lib.toCsv([{id:'=HYPERLINK("a")',action:'hello,"world"\nline2', controls:PASS}]);
  assert.match(raw,/NO GAP RECORDED/);
  assert.match(raw,/"'=HYPERLINK\(""a""\)"/);
  assert.match(raw,/"hello,""world""\nline2"/);
});
test('page provides canonical URL, private-data warning, and no fake email submission endpoint', () => {
  const html = fs.readFileSync(path.join(root,'evidence-scorecard.html'),'utf8');
  assert.match(html, /https:\/\/kahrelum\.com\/evidence-scorecard/);
  assert.match(html, /de-identified/);
  assert.match(html, /mailto:hasan@kahrelum\.com/);
  assert.doesNotMatch(html, /form\s+action="https?:\/\//);
});
