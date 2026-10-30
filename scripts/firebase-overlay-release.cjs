'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { Readable } = require('stream');

const SITE = 'kahrelum-public-hosting';
const DOMAIN = 'https://kahrelum.com';
const CHANNEL = 'safe-overlay';
const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.firebase-deploy');
const PREVIEW_RECEIPT = path.join(STATE_DIR, 'preview-receipt.json');
const PRODUCTION_RECEIPT = path.join(STATE_DIR, 'production-receipt.json');
const FIREBASE_TOOLS_ROOT = process.env.FIREBASE_TOOLS_ROOT;

const OVERLAY_FILES = [
  'divisions.css',
  'assurance.html',
  'investigations.html',
  'forecasting.html',
  'digital-id.html',
  'one.html',
  'os.html',
  'election-lab.html',
  'election-lab-app.js',
  'election-lab-roster.json',
  'nfl/trades.html',
  'nfl/trade-board.json',
];

const HTML_ROUTES = [
  '/', '/assurance', '/investigations', '/forecasting', '/digital-id', '/one', '/os',
  '/pilot', '/demo', '/sample', '/connect', '/hasan', '/election-lab', '/election-live',
  '/election-count', '/election-method', '/election-showdown', '/election-comparison',
  '/nfl/trades',
];
const API_ROUTES = ['/api/v1', '/api/v1/release', '/api/v1/example'];
const REQUIRED_REWRITES = {
  '/api/v1': '/data/api/v1/index.json',
  '/api/v1/release': '/data/api/v1/release.json',
  '/api/v1/example': '/data/api/v1/example.json',
};
const DIVISION_ROUTES = ['/assurance', '/investigations', '/forecasting', '/digital-id', '/one', '/os'];

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const stableMapHash = (value) => sha256(Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(value).sort()))));
const gzip = (value) => zlib.gzipSync(value, { level: 9 });

function fail(message) {
  throw new Error(message);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function requireFirebaseTools() {
  if (!FIREBASE_TOOLS_ROOT || !fs.existsSync(FIREBASE_TOOLS_ROOT)) {
    fail('FIREBASE_TOOLS_ROOT must point to the installed Firebase CLI module. Run through deploy-unified-firebase.ps1.');
  }
  return {
    firebase: require(FIREBASE_TOOLS_ROOT),
    hosting: require(path.join(FIREBASE_TOOLS_ROOT, 'lib/hosting/api')),
    Client: require(path.join(FIREBASE_TOOLS_ROOT, 'lib/apiv2')).Client,
    hostingApiOrigin: require(path.join(FIREBASE_TOOLS_ROOT, 'lib/api')).hostingApiOrigin,
  };
}

async function fetchBytes(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) fail(`${url} returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function normalizeConfig(config) {
  return JSON.parse(JSON.stringify(config || {}));
}

function assertHostingConfig(config) {
  if (config.cleanUrls !== true) fail('Live Hosting cleanUrls is not true. Refusing to prepare a release.');
  const rewrites = Object.fromEntries((config.rewrites || []).map((item) => [item.glob, item.path]));
  for (const [source, destination] of Object.entries(REQUIRED_REWRITES)) {
    if (rewrites[source] !== destination) fail(`Required live rewrite changed: ${source} -> ${destination}`);
  }
}

async function listVersionFiles(client, versionName) {
  const files = [];
  let pageToken = '';
  do {
    const response = await client.get(`/${versionName}/files`, {
      queryParams: { pageSize: 1000, ...(pageToken ? { pageToken } : {}) },
    });
    files.push(...(response.body.files || []));
    pageToken = response.body.nextPageToken || '';
  } while (pageToken);
  return files;
}

async function readLiveState(hosting, client) {
  const channel = await hosting.getChannel('-', SITE, 'live');
  const version = channel?.release?.version;
  if (!version?.name || version.status !== 'FINALIZED') fail('Firebase live channel does not point to a finalized version.');
  const files = await listVersionFiles(client, version.name);
  return {
    channel,
    version,
    config: normalizeConfig(version.config),
    files,
    fileMap: Object.fromEntries(files.map((item) => [item.path, item.hash])),
  };
}

async function verifiedLiveFile(live, hostingPath, publicPath) {
  const expected = live.fileMap[hostingPath];
  if (!expected) fail(`Live Firebase inventory does not contain ${hostingPath}.`);
  const bytes = await fetchBytes(DOMAIN + publicPath);
  if (sha256(gzip(bytes)) !== expected) fail(`Public bytes do not match the live Firebase hash for ${hostingPath}.`);
  return bytes;
}

function replaceHomepageSection(home, fragment) {
  const marker = 'id="kahrelum-divisions-update"';
  const sectionPattern = /<section\b[^>]*id="kahrelum-divisions-update"[^>]*>[\s\S]*?<\/section>/i;
  let output = home;
  const existing = sectionPattern.exec(output)?.[0];
  const normalizedFragment = fragment.trim().replace(/\r\n/g, '\n');
  if (existing && existing.trim().replace(/\r\n/g, '\n') === normalizedFragment) {
    // Preserve the live bytes when the governed fragment is already equivalent.
  } else if (existing) {
    output = output.replace(sectionPattern, fragment.trim());
  } else {
    const main = /<main\b[^>]*>/i.exec(output);
    if (!main) fail('Live homepage has no <main> element for the bounded division insertion.');
    output = output.slice(0, main.index + main[0].length) + '\n' + fragment.trim() + '\n' + output.slice(main.index + main[0].length);
  }
  if ((output.match(new RegExp(marker, 'g')) || []).length !== 1) fail('Homepage must contain exactly one KAHRELUM division section.');
  for (const route of DIVISION_ROUTES) {
    if (!output.includes(`href="${route}"`)) fail(`Homepage is missing division navigation to ${route}.`);
  }
  if (!output.includes('$750') || !output.includes('$2,500')) fail('Homepage pricing custody check failed.');
  return Buffer.from(output, 'utf8');
}

function updateSitemap(xml) {
  let output = xml;
  if (!output.includes('</urlset>')) fail('Live sitemap has no closing urlset element.');
  for (const route of [...DIVISION_ROUTES, '/election-lab', '/nfl/trades']) {
    const url = DOMAIN + route;
    if (!output.includes(`<loc>${url}</loc>`)) {
      output = output.replace('</urlset>', `<url><loc>${url}</loc></url>\n</urlset>`);
    }
  }
  return Buffer.from(output, 'utf8');
}

function addBlob(desired, blobs, hostingPath, bytes) {
  const compressed = gzip(bytes);
  const hash = sha256(compressed);
  desired[hostingPath] = hash;
  blobs[hash] = compressed;
}

function readRepositoryTextBytes(name) {
  const text = fs.readFileSync(path.join(ROOT, name), 'utf8');
  return Buffer.from(text.replace(/\r?\n/g, '\r\n'), 'utf8');
}

async function buildOverlay(live) {
  assertHostingConfig(live.config);
  const desired = { ...live.fileMap };
  const blobs = {};

  for (const name of OVERLAY_FILES) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) fail(`Repository overlay source is missing: ${name}`);
    addBlob(desired, blobs, '/' + name, readRepositoryTextBytes(name));
  }

  const one = fs.readFileSync(path.join(ROOT, 'one.html'), 'utf8');
  if (!/in development/i.test(one)) fail('KAHRELUM ONE must remain explicitly marked in development.');

  const forecast = fs.readFileSync(path.join(ROOT, 'forecasting.html'), 'utf8');
  for (const required of ['0.222593', '0.146176', 'original cutoff', 'confidence intervals include zero']) {
    if (!forecast.includes(required)) fail(`Forecasting custody check failed for: ${required}`);
  }

  const home = (await verifiedLiveFile(live, '/index.html', '/')).toString('utf8');
  const fragment = fs.readFileSync(path.join(ROOT, 'hosting', 'homepage-divisions.html'), 'utf8');
  addBlob(desired, blobs, '/index.html', replaceHomepageSection(home, fragment));

  const sitemap = (await verifiedLiveFile(live, '/sitemap.xml', '/sitemap.xml')).toString('utf8');
  addBlob(desired, blobs, '/sitemap.xml', updateSitemap(sitemap));

  const changedPaths = Object.keys(desired).filter((item) => live.fileMap[item] !== desired[item]).sort();
  const removedPaths = Object.keys(live.fileMap).filter((item) => !(item in desired));
  if (removedPaths.length) fail(`Overlay attempted to remove live paths: ${removedPaths.join(', ')}`);

  return { desired, blobs, changedPaths };
}

async function captureApiHashes(origin) {
  const hashes = {};
  for (const route of API_ROUTES) {
    const bytes = await fetchBytes(origin + route);
    JSON.parse(bytes.toString('utf8'));
    hashes[route] = sha256(bytes);
  }
  return hashes;
}

function extractCanonical(html) {
  const tag = html.match(/<link\b(?=[^>]*rel="canonical")[^>]*>/i)?.[0];
  return tag?.match(/href="([^"]+)"/i)?.[1];
}

async function verifySurface(origin, expectedApiHashes) {
  const checks = [];
  const internal = new Set();
  for (const route of HTML_ROUTES) {
    const bytes = await fetchBytes(origin + route);
    const html = bytes.toString('utf8');
    const expectedCanonical = DOMAIN + (route === '/' ? '/' : route);
    if (extractCanonical(html) !== expectedCanonical) fail(`Canonical check failed for ${route}.`);
    if (!html.includes('name="viewport"')) fail(`Viewport metadata is missing on ${route}.`);
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) internal.add(match[1]);
    checks.push({ route, status: 200, sha256: sha256(bytes) });
  }

  const nflData = JSON.parse((await fetchBytes(origin + '/nfl/trade-board.json')).toString('utf8'));
  if (!Array.isArray(nflData.candidates) || nflData.candidates.length !== 124 ||
      !Array.isArray(nflData.deals) || nflData.deals.length !== 7 ||
      nflData.sourceAccountability?.certifiedMeanBrier !== null) {
    fail('NFL trade board data integrity or forecast-certification boundary failed.');
  }
  const one = (await fetchBytes(origin + '/one')).toString('utf8');
  if (!/in development/i.test(one)) fail('KAHRELUM ONE development warning is absent from the deployed page.');
  const home = (await fetchBytes(origin + '/')).toString('utf8');
  if (!home.includes('$750') || !home.includes('$2,500')) fail('Deployed homepage pricing custody check failed.');

  for (const route of internal) await fetchBytes(origin + route);

  const apiHashes = await captureApiHashes(origin);
  if (!util.isDeepStrictEqual(apiHashes, expectedApiHashes)) fail('Preview API bodies differ from the live baseline.');
  return { origin, routes: checks, internalTargets: internal.size, apiHashes };
}

async function createPreview(hosting, client, live, overlay) {
  if (!overlay.changedPaths.length) fail('The overlay is already identical to production; no preview release is needed.');
  const versionName = await hosting.createVersion(SITE, {
    config: live.config,
    labels: { 'deployment-tool': 'kahrelum-safe-overlay' },
  });
  const populated = (await client.post(`/${versionName}:populateFiles`, { files: overlay.desired })).body;
  for (const hash of populated.uploadRequiredHashes || []) {
    const body = overlay.blobs[hash];
    if (!body) fail(`Firebase requested a preserved live blob (${hash}); refusing an incomplete replacement.`);
    const uploadClient = new client.constructor({ urlPrefix: populated.uploadUrl, auth: true });
    const response = await uploadClient.request({
      method: 'POST', path: '/' + hash, body: Readable.from(body), resolveOnHTTPError: true, responseType: 'stream',
    });
    if (response.status !== 200) fail(`Firebase blob upload failed with HTTP ${response.status}.`);
  }

  const versionId = versionName.split('/').pop();
  const finalized = await hosting.updateVersion(SITE, versionId, { status: 'FINALIZED' });
  if (finalized.status !== 'FINALIZED') fail('Preview version did not finalize.');

  let channel;
  try {
    channel = await hosting.getChannel('-', SITE, CHANNEL);
  } catch (error) {
    if (error.status !== 404) throw error;
    channel = await hosting.createChannel('-', SITE, CHANNEL, 24 * 60 * 60 * 1000);
  }
  await hosting.createRelease(SITE, CHANNEL, versionName, {
    message: `Safe overlay preview based on ${live.version.name}`,
  });
  channel = await hosting.getChannel('-', SITE, CHANNEL);
  const expectedApiHashes = await captureApiHashes(DOMAIN);
  const verification = await verifySurface(channel.url, expectedApiHashes);
  const receipt = {
    createdAt: new Date().toISOString(),
    site: SITE,
    baseVersion: live.version.name,
    baseConfig: live.config,
    baseConfigHash: sha256(Buffer.from(JSON.stringify(live.config))),
    previewChannel: CHANNEL,
    previewUrl: channel.url,
    previewVersion: versionName,
    desiredFiles: overlay.desired,
    desiredMapHash: stableMapHash(overlay.desired),
    changedPaths: overlay.changedPaths,
    expectedApiHashes,
    verification,
  };
  writeJson(PREVIEW_RECEIPT, receipt);
  return receipt;
}

async function promotePreview(hosting, client, live) {
  if (!fs.existsSync(PREVIEW_RECEIPT)) fail('No verified preview receipt exists. Run -Preview first.');
  const receipt = JSON.parse(fs.readFileSync(PREVIEW_RECEIPT, 'utf8'));
  if (live.version.name !== receipt.baseVersion) {
    fail(`Production changed after preview (${receipt.baseVersion} -> ${live.version.name}). Prepare a new preview.`);
  }
  if (sha256(Buffer.from(JSON.stringify(live.config))) !== receipt.baseConfigHash) fail('Production Hosting configuration changed after preview.');
  if (stableMapHash(receipt.desiredFiles) !== receipt.desiredMapHash) fail('Preview receipt file map is not internally consistent.');

  const preview = await hosting.getChannel('-', SITE, receipt.previewChannel);
  if (preview?.release?.version?.name !== receipt.previewVersion) fail('Preview channel no longer points to the verified version.');
  await verifySurface(receipt.previewUrl, receipt.expectedApiHashes);

  const finalLiveCheck = await hosting.getChannel('-', SITE, 'live');
  if (finalLiveCheck?.release?.version?.name !== receipt.baseVersion) fail('Production changed during promotion checks. Prepare a new preview.');

  const release = await hosting.createRelease(SITE, 'live', receipt.previewVersion, {
    message: `Promote verified safe overlay ${receipt.previewVersion.split('/').pop()}`,
  });
  const released = await hosting.getChannel('-', SITE, 'live');
  const releasedFiles = await listVersionFiles(client, released.release.version.name);
  const releasedMap = Object.fromEntries(releasedFiles.map((item) => [item.path, item.hash]));
  if (released.release.version.name !== receipt.previewVersion) fail('Live channel did not adopt the verified preview version.');
  if (!util.isDeepStrictEqual(releasedMap, receipt.desiredFiles)) fail('Production file-map readback differs from the verified preview.');
  if (!util.isDeepStrictEqual(normalizeConfig(released.release.version.config), receipt.baseConfig)) fail('Production Hosting configuration changed during promotion.');
  const verification = await verifySurface(DOMAIN, receipt.expectedApiHashes);
  const productionReceipt = {
    promotedAt: new Date().toISOString(),
    release: release.name,
    version: released.release.version.name,
    fileCount: releasedFiles.length,
    desiredMapHash: receipt.desiredMapHash,
    configUnchanged: true,
    verification,
  };
  writeJson(PRODUCTION_RECEIPT, productionReceipt);
  return productionReceipt;
}

async function main() {
  const mode = process.argv[2] || '--plan';
  if (!['--plan', '--preview', '--promote'].includes(mode)) fail(`Unknown mode: ${mode}`);
  const { firebase, hosting, Client, hostingApiOrigin } = requireFirebaseTools();
  await firebase.projects.list({ json: true, nonInteractive: true });
  const client = new Client({ urlPrefix: hostingApiOrigin(), apiVersion: 'v1beta1', auth: true });
  const live = await readLiveState(hosting, client);

  if (mode === '--promote') {
    console.log(JSON.stringify(await promotePreview(hosting, client, live), null, 2));
    return;
  }

  const overlay = await buildOverlay(live);
  const summary = {
    mode: mode.slice(2).toUpperCase(),
    site: SITE,
    baseVersion: live.version.name,
    baseFileCount: live.files.length,
    desiredFileCount: Object.keys(overlay.desired).length,
    changedPaths: overlay.changedPaths,
    removedPaths: [],
    configPreserved: true,
  };
  if (mode === '--plan') {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  const receipt = await createPreview(hosting, client, live, overlay);
  console.log(JSON.stringify({ ...summary, previewUrl: receipt.previewUrl, previewVersion: receipt.previewVersion }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
