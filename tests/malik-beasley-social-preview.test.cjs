'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const image = 'assets/social/og-malik-beasley-sentencing-2026.png';
const url = 'https://kahrelum.com/' + image;
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
test('Beasley article has a dedicated 1200x630 PNG with exact custodied bytes', () => {
  const png=fs.readFileSync(path.join(root,image));
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(png.readUInt32BE(16),1200);
  assert.equal(png.readUInt32BE(20),630);
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),'dfa09c25ca3755ec4a035c24ae3ccf1883a2e412cda28f0620e256ff1b8928c8');
  const html=read('insights/malik-beasley-sentencing-2026.html');
  for(const attr of ['property="og:image"','property="og:image:secure_url"','name="twitter:image"']) {
    assert.ok(html.includes('<meta '+attr+' content="'+url+'">'),'missing unique Beasley social tag '+attr);
  }
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('property="og:image:height" content="630"'));
  assert.ok(html.includes('62%'));
  assert.ok(html.includes('805d5df3c04eb5320f223dc552c55516dc487f76'));
});
test('Firebase profile and workflow release exactly the approved Beasley share image', () => {
  const publisher=read('scripts/firebase-overlay-release.cjs');
  const p=publisher.match(/  'malik-beasley-forecast': \{([\s\S]*?)\n  \},/);
  assert.ok(p,'missing dedicated overlay profile');
  assert.ok(p[1].includes("'"+image+"'"));
  assert.ok(p[1].includes('includeHomepage: false'));
  assert.ok(!p[1].includes('index.html'));
  const yml=read('.github/workflows/firebase-scoped-release.yml');
  assert.ok(yml.includes("'"+image+"'"));
  assert.ok(yml.includes("elif grep -Fqx 'insights/malik-beasley-sentencing-2026.html'"));
  assert.ok(yml.includes('malik-beasley-forecast'));
  assert.ok(!p[1].includes('research/malik-beasley-2026/MB-2026-01.json'));
});
