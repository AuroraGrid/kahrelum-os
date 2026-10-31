'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/firebase-overlay-release.cjs'), 'utf8');
const readerSource = source.match(/function readRepositoryBytes\(name\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(readerSource, 'The production Firebase overlay source-byte reader must exist');

function makeReader(fileSystem, base = root) {
  // Execute only the small, isolated source-reader function. Never execute the
  // Firebase deployment command in a unit test.
  return new Function('fs', 'path', 'ROOT', 'Buffer', readerSource + '\nreturn readRepositoryBytes;')(fileSystem, path, base, Buffer);
}

test('Firebase release preserves JPEG and other image bytes exactly', () => {
  const sample = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  const fakeFs = {readFileSync: () => Buffer.from(sample)};
  const reader = makeReader(fakeFs);
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'ico']) {
    assert.deepEqual(reader('assets/portrait.' + ext), sample, ext + ' must remain byte-for-byte unchanged');
  }
});

test('Every admitted candidate JPEG survives the actual Firebase overlay reader', () => {
  const records = JSON.parse(fs.readFileSync(path.join(root, 'election/candidate-portraits.json'), 'utf8')).records;
  const candidateImages = records.filter(item => item.url?.startsWith('/assets/candidate-portraits/'));
  assert.ok(candidateImages.length >= 421, 'Preserve the verified October 31 portrait floor');
  const reader = makeReader(fs);
  for (const item of candidateImages) {
    const name = item.url.slice(1);
    const original = fs.readFileSync(path.join(root, name));
    const packaged = reader(name);
    assert.ok(original.equals(packaged), name + ': overlay must not transcode JPEG bytes');
    assert.equal(crypto.createHash('sha256').update(packaged).digest('hex'), item.imageSha256, name + ': image identity/hash must hold');
  }
});

test('Text-file CRLF normalization remains unchanged', () => {
  const name = 'nfl/trades.html';
  const reader = makeReader(fs);
  const original = fs.readFileSync(path.join(root, name));
  const expected = Buffer.from(original.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
  assert.ok(reader(name).equals(expected));
});
