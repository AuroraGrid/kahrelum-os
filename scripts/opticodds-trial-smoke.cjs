'use strict';
// Safety-first, single-request smoke test. NEVER place provider credentials in this repository.
// Running without flags is offline; a real request may begin a time-limited trial.
const fs = require('node:fs/promises');
const path = require('node:path');
const DEFAULT_RECEIPT_DIR = path.join(process.cwd(), '.opticodds-trial');
const ENDPOINT = 'https://api.opticodds.com/api/v3/sports';

function parseMode(argv) {
  const allowed = new Set(['--plan', '--live', '--confirm-trial-start']);
  for (const flag of argv) if (!allowed.has(flag)) throw new Error('Unknown argument: ' + flag);
  const live = argv.includes('--live');
  const confirmed = argv.includes('--confirm-trial-start');
  if (live && argv.includes('--plan')) throw new Error('Choose --plan or --live, not both');
  if (live && !confirmed) throw new Error('--live requires --confirm-trial-start');
  if (!live && confirmed) throw new Error('--confirm-trial-start requires --live');
  return live ? 'live' : 'plan';
}

function buildRequest(apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error('OPTICODDS_API_KEY is required for live mode');
  return {
    url: ENDPOINT,
    options: {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey.trim(), Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    },
  };
}

async function runTrial({ argv = [], env = process.env, fetchImpl = globalThis.fetch,
  receiptDir = DEFAULT_RECEIPT_DIR, log = console.log } = {}) {
  const mode = parseMode(argv);
  if (mode === 'plan') {
    log('OFFLINE: no OpticOdds request sent and the seven-day clock was not triggered by this command.');
    log('Endpoint planned: GET ' + ENDPOINT);
    log('After vendor confirmation: set OPTICODDS_API_KEY privately, then explicitly run --live --confirm-trial-start.');
    return { mode: 'plan', network: false };
  }
  const request = buildRequest(env.OPTICODDS_API_KEY);
  const receiptPath = path.join(receiptDir, 'first-request.json');
  await fs.mkdir(receiptDir, { recursive: true, mode: 0o700 });
  const firstRequestUtc = new Date().toISOString();
  // Reserve durably BEFORE any network access. An interrupted attempt remains
  // blocked, even when its actual network outcome cannot be recovered.
  const reservation = {
    first_request_utc: firstRequestUtc,
    endpoint: '/api/v3/sports',
    http_status: null,
    outcome: 'reserved_outcome_unknown',
    vendor_trial_end_utc: null,
    note: 'Reservation is not proof a request was sent. Do not retry or erase it without reconciliation.',
  };
  let handle;
  try {
    handle = await fs.open(receiptPath, 'wx', 0o600);
    await handle.writeFile(JSON.stringify(reservation, null, 2) + '\n');
    await handle.sync();
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('A first-request receipt already exists. Refusing another accidental trial start.');
    throw error;
  } finally {
    if (handle) await handle.close();
  }
  let httpStatus = null;
  let outcome = 'network_error';
  try {
    const response = await fetchImpl(request.url, request.options);
    httpStatus = response.status;
    outcome = response.ok ? 'response_ok' : 'http_error';
  } catch (_) {
    // Never print thrown client errors, which may include request headers or secret values.
  }
  const receipt = {
    source: 'OpticOdds trial preflight; requester-generated, not vendor proof of trial dates',
    first_request_utc: firstRequestUtc,
    endpoint: '/api/v3/sports',
    http_status: httpStatus,
    outcome,
    vendor_trial_end_utc: null,
    note: 'No raw API response is retained. Confirm vendor clock and expiration separately.',
  };
  // The reservation file continues to block retries even if completion writing fails.
  await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  log('Trial attempt receipt saved locally: ' + receiptPath + '. HTTP status: ' + (httpStatus ?? 'no response') + '.');
  if (outcome === 'network_error') throw new Error('Request failed; review connectivity privately. First-attempt receipt preserved.');
  if (outcome === 'http_error') throw new Error('API returned HTTP ' + httpStatus + '; verify entitlement with Chirag. First-attempt receipt preserved.');
  return { mode: 'live', network: true, http_status: httpStatus, receipt_path: receiptPath };
}

if (require.main === module) {
  runTrial({ argv: process.argv.slice(2) }).catch(error => {
    console.error('Trial preflight: ' + error.message);
    process.exitCode = 1;
  });
}
module.exports = { runTrial, parseMode, buildRequest };
