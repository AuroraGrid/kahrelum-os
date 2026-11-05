'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('challenger data release preserves unrelated live files and changes exactly two JSON paths', async () => {
  const script = read('scripts/firebase-overlay-release.cjs');
  const wrapper = read('scripts/deploy-unified-firebase.ps1');
  assert.match(wrapper, /"election-challenge-data"/);
  const definitions = script.slice(0, script.lastIndexOf('\nmain().catch'));
  const build = new Function('require', '__dirname', 'process', 'fetch', 'Buffer',
    definitions + '\nreturn buildOverlay;')(require, path.join(root, 'scripts'), process,
      async () => { throw new Error('A challenger data release must not fetch unrelated live bytes'); }, Buffer);
  const fileMap = {
    '/sitemap.xml': 'opaque-sitemap-hash',
    '/index.html': 'opaque-home-hash',
    '/election-challenge.html': 'opaque-page-hash',
    '/election-challenge-map.js': 'opaque-script-hash',
    '/election/current-projections.json': 'opaque-model-hash',
    '/election/candidate-portraits.json': 'opaque-portrait-ledger-hash',
    '/assets/candidate-portraits/example.jpg': 'opaque-portrait-hash',
    '/election/challenger-source-checks.json': 'old-challenger-hash',
    '/election/seat-projections.json': 'old-seat-comparison-hash',
  };
  const live = { fileMap, config: { cleanUrls: true, rewrites: [
    {glob: '/api/v1', path: '/data/api/v1/index.json'},
    {glob: '/api/v1/release', path: '/data/api/v1/release.json'},
    {glob: '/api/v1/example', path: '/data/api/v1/example.json'},
  ] } };
  const result = await build(live, 'election-challenge-data');
  assert.deepEqual(result.changedPaths, [
    '/election/challenger-source-checks.json', '/election/seat-projections.json',
  ]);
  for (const [name, hash] of Object.entries(fileMap)) {
    if (!result.changedPaths.includes(name)) assert.equal(result.desired[name], hash, name);
  }
  assert.deepEqual(live.fileMap, fileMap);
});
