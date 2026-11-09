'use strict';

// Firebase Hosting stores SHA-256 of the *gzip-encoded* file, not raw bytes.
// Existing KAHRELUM production blobs were encoded by Windows Node zlib,
// which sets gzip byte 9 (OS) to 0x0a. Linux Node zlib sets that byte to 0x03.
// This code pins the historical Windows marker for NEW files and validates
// existing hashes against either exact, recognized encoding. No content,
// checksum, file-map, or production release comparison is bypassed.
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const PINNED_GZIP_OS = 10;
const ACCEPTED_LEGACY_OS = Object.freeze([10, 3]);

function gzipPinned(bytes) {
  const compressed = zlib.gzipSync(bytes, { level: 9 });
  if (compressed.length < 18 || compressed[0] !== 0x1f || compressed[1] !== 0x8b) {
    throw new Error('Invalid gzip output; Firebase upload aborted.');
  }
  compressed[9] = PINNED_GZIP_OS;
  return compressed;
}

function matchesPublishedGzipHash(bytes, expectedSha256) {
  if (!/^[0-9a-f]{64}$/.test(expectedSha256 || '')) return false;
  const encoded = gzipPinned(bytes);
  for (const osByte of ACCEPTED_LEGACY_OS) {
    encoded[9] = osByte;
    if (sha256(encoded) === expectedSha256) return true;
  }
  return false;
}

module.exports = { gzipPinned, matchesPublishedGzipHash };
