'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { runTrial, parseMode, buildRequest } = require('../scripts/opticodds-trial-smoke.cjs');

test('the default command is offline, even with a secret in the environment', async () => {
  let called = false;
  const output = [];
  const result = await runTrial({ argv: [], env: { OPTICODDS_API_KEY: 'secret-key' },
    fetchImpl: async () => { called = true; throw Error('must not call API'); },
    log: message => output.push(message) });
  assert.equal(result.mode, 'plan');
  assert.equal(called, false);
  assert.equal(output.join('\n').includes('secret-key'), false);
});

test('live mode requires explicit acknowledgement of trial start', () => {
  assert.equal(parseMode(['--plan']), 'plan');
  assert.equal(parseMode(['--live', '--confirm-trial-start']), 'live');
  assert.throws(() => parseMode(['--live']), /confirm-trial-start/);
  assert.throws(() => parseMode(['--confirm-trial-start']), /--live/);
  assert.throws(() => parseMode(['--typo']), /Unknown argument/);
});

test('the request sends the secret only in an auth header, never the URL', () => {
  const req = buildRequest('secret-value');
  assert.equal(req.url, 'https://api.opticodds.com/api/v3/sports');
  assert.equal(req.options.headers['X-Api-Key'], 'secret-value');
  assert.doesNotMatch(req.url, /secret-value|\?key=/);
  assert.equal(req.options.method, 'GET');
});

test('missing API key refuses live request before any network call', async () => {
  let called = false;
  await assert.rejects(runTrial({ argv: ['--live', '--confirm-trial-start'], env: {},
    fetchImpl: async () => { called = true; }, log: () => {} }), /OPTICODDS_API_KEY/);
  assert.equal(called, false);
});

test('an explicit live request records local metadata but no secret or raw odds', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'opticodds-test-'));
  let count = 0;
  try {
    const result = await runTrial({ argv: ['--live', '--confirm-trial-start'],
      env: { OPTICODDS_API_KEY: 'sensitive-test-secret' }, receiptDir: dir,
      fetchImpl: async (url, opts) => {
        count++;
        assert.equal(url, 'https://api.opticodds.com/api/v3/sports');
        assert.equal(opts.headers['X-Api-Key'], 'sensitive-test-secret');
        return { status: 200, ok: true };
      }, log: () => {} });
    assert.equal(result.mode, 'live');
    assert.equal(result.http_status, 200);
    assert.equal(count, 1);
    const text = await fs.readFile(path.join(dir, 'first-request.json'), 'utf8');
    assert.doesNotMatch(text, /sensitive-test-secret|raw_odds|api_key/i);
    assert.match(text, /"http_status": 200/);
    assert.match(text, /"first_request_utc":/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('network failure writes a redacted attempt receipt rather than leaking a key', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'opticodds-test-'));
  try {
    await assert.rejects(runTrial({ argv: ['--live', '--confirm-trial-start'],
      env: { OPTICODDS_API_KEY: 'another-secret' }, receiptDir: dir,
      fetchImpl: async () => { throw Error('network error another-secret'); }, log: () => {} }),
    /Request failed/);
    const text = await fs.readFile(path.join(dir, 'first-request.json'), 'utf8');
    assert.doesNotMatch(text, /another-secret|network error/);
    assert.match(text, /"outcome": "network_error"/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('existing first-request receipt blocks a second accidental trial start', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'opticodds-test-'));
  try {
    await fs.writeFile(path.join(dir, 'first-request.json'), '{"original":true}\n');
    let called = false;
    await assert.rejects(runTrial({ argv: ['--live', '--confirm-trial-start'],
      env: { OPTICODDS_API_KEY: 'key' }, receiptDir: dir,
      fetchImpl: async () => { called = true; }, log: () => {} }), /already exists/);
    assert.equal(called, false);
    assert.equal((await fs.readFile(path.join(dir, 'first-request.json'), 'utf8')).includes('original'), true);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
