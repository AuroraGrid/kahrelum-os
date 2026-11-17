'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { gzipPinned, matchesPublishedGzipHash } = require('../scripts/firebase-gzip-custody.cjs');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');

test('Firebase gzip preserves Windows legacy OS byte 10 even on Linux', () => {
  for (const payload of [Buffer.from('KAHRELUM'), Buffer.from('KAHRELUM\n'.repeat(2000)), Buffer.from([0, 127, 255, 13, 10, 0])]) {
    const gz = gzipPinned(payload);
    assert.equal(gz.subarray(0, 2).toString('hex'), '1f8b');
    assert.equal(gz[9], 10);
    assert.deepEqual(zlib.gunzipSync(gz), payload);
    assert.ok(matchesPublishedGzipHash(payload, sha(gz)));
  }
});

test('legacy Linux gzip OS byte 3 is verified only when the full SHA-256 digest matches', () => {
  const raw = Buffer.from('KAHRELUM evidence-to-decision\r\n'.repeat(200));
  const original = gzipPinned(raw);
  const unixGzip = Buffer.from(original);
  unixGzip[9] = 3;
  assert.notEqual(sha(original), sha(unixGzip));
  assert.ok(matchesPublishedGzipHash(raw, sha(unixGzip)));
  assert.ok(matchesPublishedGzipHash(raw, sha(original)));
  assert.equal(matchesPublishedGzipHash(Buffer.concat([raw, Buffer.from('!')]), sha(unixGzip)), false);
  assert.equal(matchesPublishedGzipHash(raw, sha(raw)), false);
  assert.equal(matchesPublishedGzipHash(raw, '0'.repeat(64)), false);
  assert.equal(matchesPublishedGzipHash(raw, 'not-a-sha'), false);
});

test('verified live files check exact compressed blob identity not just raw bytes', () => {
  const publisher = fs.readFileSync(path.join(root, 'scripts/firebase-overlay-release.cjs'), 'utf8');
  assert.match(publisher, /matchesPublishedGzipHash\(bytes, expected\)/);
  assert.match(publisher, /Public bytes do not match the live Firebase hash/);
  assert.match(publisher, /const gzip = gzipPinned/);
});
