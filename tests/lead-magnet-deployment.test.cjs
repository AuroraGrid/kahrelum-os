'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(__dirname, '..');
const overlay = fs.readFileSync(path.join(repo, 'scripts/firebase-overlay-release.cjs'), 'utf8');
const wrapper = fs.readFileSync(path.join(repo, 'scripts/deploy-unified-firebase.ps1'), 'utf8');
test('scorecard deploy runs a bounded profile rather than the full site', () => {
  assert.match(overlay, /'lead-magnet':\s*\{[\s\S]*?overlayFiles:\s*\['evidence-scorecard\.html', 'evidence-scorecard\.js'\]/);
  assert.match(overlay, /sitemapRoutes:\s*\['\/evidence-scorecard'\]/);
  assert.match(overlay, /profileName === 'lead-magnet' &&[\s\S]*?changedPaths\.some[\s\S]*?\/sitemap\.xml/);
  assert.match(wrapper, /'lead-magnet'|"lead-magnet"/);
  assert.doesNotMatch(overlay.split('const HTML_ROUTES =')[0], /'evidence-scorecard\.html'/);
});
test('new scorecard route is verified only on its scoped release profile', () => {
  assert.match(overlay, /const verifiedRoutes = profileName === 'lead-magnet'/);
  assert.match(overlay, /\[\.\.\.HTML_ROUTES, '\/evidence-scorecard'\]/);
});
