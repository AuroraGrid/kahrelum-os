'use strict';

const crypto = require('crypto');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { Readable } = require('stream');

const SITE = 'kahrelum-public-hosting';
const DOMAIN = 'https://kahrelum.com';
const CHANNEL_PREFIX = 'safe-overlay';
const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.firebase-deploy');
const PREVIEW_RECEIPT = path.join(STATE_DIR, 'preview-receipt.json');
const PRODUCTION_RECEIPT = path.join(STATE_DIR, 'production-receipt.json');
const FIREBASE_TOOLS_ROOT = process.env.FIREBASE_TOOLS_ROOT;

// Local candidate portraits are public-domain source thumbnails. Only the exact
// identity/hash paths admitted by the portrait ledger may enter a release.
const CANDIDATE_PORTRAIT_FILES = JSON.parse(fs.readFileSync(path.join(ROOT, 'election/candidate-portraits.json'), 'utf8')).records
  .filter((record) => typeof record.url === 'string' && record.url.startsWith('/assets/candidate-portraits/'))
  .map((record) => {
    if (!/^[A-Z][0-9]{6}$/.test(record.bioguideId) || !/^[a-f0-9]{64}$/.test(record.imageSha256 || '') ||
        record.url !== `/assets/candidate-portraits/${record.bioguideId}-${record.imageSha256.slice(0,16)}.jpg`) {
      throw new Error('Candidate portrait path is not bound to its identity and hash.');
    }
    const file = record.url.slice(1);
    if (crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex') !== record.imageSha256) {
      throw new Error(`Candidate portrait bytes changed: ${file}`);
    }
    return file;
  });
const NBA_DIRECTORY_FILES = ['sports/nba.html', 'sports/nba-players.js', 'sports/nba-players.css', 'sports/nba-player-portraits.json'];

const SOCIAL_CARD_FILES = [
  'assets/social-manifest.json',
  'assets/social/og-home.png',
  'assets/social/og-pilot.png',
  'assets/social/og-demo.png',
  'assets/social/og-sample.png',
  'assets/social/og-connect.png',
  'assets/social/og-hasan.png',
  'assets/social/og-assurance.png',
  'assets/social/og-digital-id.png',
  'assets/social/og-election-challenge.png',
  'assets/social/og-election-lab.png',
  'assets/social/og-forecasting.png',
  'assets/social/og-insights-ai-bots-money-claims.png',
  'assets/social/og-insights-election-forecast-custody.png',
  'assets/social/og-insights-nfl-brier-accountability.png',
  'assets/social/og-insights.png',
  'assets/social/og-investigations.png',
  'assets/social/og-nfl-analysis.png',
  'assets/social/og-nfl-film-room.png',
  'assets/social/og-nfl-trades.png',
  'assets/social/og-nfl-weekly-brief.png',
  'assets/social/og-one.png',
  'assets/social/og-os.png',
  'assets/social/og-sports-interest.png',
  'assets/social/og-sports-mlb.png',
  'assets/social/og-sports-nba.png',
  'assets/social/og-sports-nhl.png',
  'assets/social/og-sports.png',
];

const OVERLAY_FILES = [
  'divisions.css',
  'assurance.html',
  'investigations.html',
  'forecasting.html',
  'election-challenge.html',
  'election-challenge-map.css',
  'election-challenge-map.js',
  'assets/us-states-map.json',
  'assets/us-states-map.SOURCE.md',
  'election/candidate-portraits.json', 'election/comparator-admission.json',
  ...CANDIDATE_PORTRAIT_FILES,
  'election/house-forecast-lock.json',
  'election/senate-forecast-lock.json',
  'election/senate-ratings-source.json',
  'election/current-projections.json',
  'election/fresh-run-checkpoint.json',
  'election/challenger-source-checks.json',
  'election/seat-projections.json',
  'digital-id.html',
  'one.html',
  'os.html',
  'election-lab.html',
  'election-lab-app.js',
  'election-lab-roster.json',
  'nfl/trades.html', 'nfl/trades.js', 'nfl/desk-live.json', 'nfl/current-forecasts.json', 'nfl/player-portraits.json',
  'nfl/analysis.html',
  'nfl/trade-board.json',
  'nfl/sourcegrid.json',
  'nfl/source-observations.json',
  'nfl/review-queue.json',
  'nfl/refresh-status.json',
  'nfl/source-health.json',
  'nfl/public-feed.json',
  'nfl/forecast-ledger.json',
  'nfl/deadline-audit.json',
  'nfl/publishing.json',
  'sports-desk.css',
  'sports-article.css',
  'sports.html',
  'sports/module-registry.json',
  'nfl/film-room.html',
  ...NBA_DIRECTORY_FILES,
  'sports/mlb.html',
  'sports/nhl.html',
  'insights.css',
  'insights.html',
  'insights/nfl-brier-accountability.html',
  'insights/election-forecast-custody.html',
  'insights/ai-bots-money-claims.html',
  'nfl/weekly-brief.html',
  'sports-interest.html',
  'assets/kahrelum-sports-intelligence-nfl-social-card.png',
  'assets/kahrelum-sports-intelligence-social-card.png',
  ...SOCIAL_CARD_FILES,
];

const HTML_ROUTES = [
  '/', '/assurance', '/investigations', '/forecasting', '/digital-id', '/one', '/os',
  '/election-challenge',
  '/pilot', '/demo', '/sample', '/connect', '/hasan', '/election-lab', '/election-live',
  '/election-count', '/election-method', '/election-showdown', '/election-comparison',
  '/nfl/trades', '/nfl/analysis', '/nfl/weekly-brief',
  '/sports', '/nfl/film-room', '/sports/nba', '/sports/mlb', '/sports/nhl',
  '/insights', '/insights/nfl-brier-accountability', '/insights/election-forecast-custody',
  '/insights/ai-bots-money-claims', '/sports-interest',
];
const API_ROUTES = ['/api/v1', '/api/v1/release', '/api/v1/example'];
const LEGACY_SOCIAL_SPECS = {
  '/pilot': { hostingPath: '/pilot.html', image: '/assets/social/og-pilot.png', alt: 'Historical AI Decision Review — KAHRELUM Pilot social preview' },
  '/demo': { hostingPath: '/demo.html', image: '/assets/social/og-demo.png', alt: 'KAHRELUM Worked Example — Synthetic, Prerecorded social preview' },
  '/sample': { hostingPath: '/sample.html', image: '/assets/social/og-sample.png', alt: 'Synthetic Sample Deliverable — KAHRELUM social preview' },
  '/connect': { hostingPath: '/connect.html', image: '/assets/social/og-connect.png', alt: 'Connect with Hasan Raza Kazmi — KAHRELUM social preview' },
  '/hasan': { hostingPath: '/hasan.html', image: '/assets/social/og-hasan.png', alt: 'Hasan Raza Kazmi — Founder, KAHRELUM social preview' },
};
const REQUIRED_REWRITES = {
  '/api/v1': '/data/api/v1/index.json',
  '/api/v1/release': '/data/api/v1/release.json',
  '/api/v1/example': '/data/api/v1/example.json',
};
const DIVISION_ROUTES = ['/assurance', '/investigations', '/forecasting', '/digital-id', '/one', '/os'];
const RELEASE_PROFILES = {
  portraits: {
    overlayFiles: [
      'sports.html', 'sports/module-registry.json', ...NBA_DIRECTORY_FILES,
      'nfl/trades.html', 'nfl/trades.js', 'nfl/trade-board.json',
      'nfl/desk-live.json', 'nfl/current-forecasts.json', 'nfl/player-portraits.json',
      'nfl/forecast-ledger.json', 'nfl/deadline-audit.json',
      'election-challenge.html', 'election-challenge-map.js', 'election-challenge-map.css',
      'election/candidate-portraits.json', 'election/comparator-admission.json',
      'election/fresh-run-checkpoint.json', ...CANDIDATE_PORTRAIT_FILES,
    ],
    sitemapRoutes: ['/sports', '/sports/nba', '/nfl/trades', '/election-challenge'],
    includeHomepage: false,
  },
  'desk-upgrade': {
    overlayFiles: [
      'nfl/trades.html', 'nfl/trades.js', 'nfl/trade-board.json',
      'nfl/desk-live.json', 'nfl/current-forecasts.json', 'nfl/player-portraits.json',
      'nfl/forecast-ledger.json', 'nfl/deadline-audit.json',
      'election-challenge.html', 'election-challenge-map.js', 'election-challenge-map.css',
      'election/candidate-portraits.json', 'election/comparator-admission.json',
      'election/current-projections.json',
      'election/fresh-run-checkpoint.json',
      ...CANDIDATE_PORTRAIT_FILES,
    ],
    sitemapRoutes: ['/nfl/trades', '/election-challenge'],
    includeHomepage: false,
  },
  full: {
    overlayFiles: OVERLAY_FILES,
    sitemapRoutes: [
      ...DIVISION_ROUTES, '/election-lab', '/election-challenge', '/sports', '/nfl/trades',
      '/nfl/analysis', '/nfl/film-room', '/sports/nba', '/sports/mlb', '/sports/nhl',
      '/election-live', '/election-count', '/election-method', '/election-showdown',
      '/election-comparison',
    ],
    includeHomepage: true,
  },
  'election-challenge': {
    overlayFiles: [
      'forecasting.html', 'election-challenge.html', 'election-challenge-map.css',
      'election-challenge-map.js', 'election/house-forecast-lock.json',
      'election/senate-forecast-lock.json', 'election/senate-ratings-source.json',
      'election/current-projections.json', 'election/challenger-source-checks.json',
      'election/fresh-run-checkpoint.json',
      'election/seat-projections.json',
      'assets/social/og-election-challenge.png',
      'assets/us-states-map.json',
      'assets/us-states-map.SOURCE.md',
      'election/candidate-portraits.json', 'election/comparator-admission.json',
      ...CANDIDATE_PORTRAIT_FILES,
    ],
    sitemapRoutes: ['/election-challenge'],
    includeHomepage: false,
  },
  'sports-intelligence': {
    overlayFiles: [
      'nfl/trades.html', 'nfl/trades.js', 'nfl/desk-live.json', 'nfl/current-forecasts.json', 'nfl/player-portraits.json', 'nfl/trade-board.json', 'nfl/analysis.html', 'nfl/sourcegrid.json', 'nfl/source-observations.json',
      'nfl/review-queue.json', 'nfl/refresh-status.json', 'nfl/public-feed.json',
      'nfl/source-health.json',
      'nfl/forecast-ledger.json', 'nfl/deadline-audit.json', 'nfl/publishing.json',
      'sports-desk.css', 'sports-article.css', 'sports.html', 'sports/module-registry.json', 'nfl/film-room.html',
      ...NBA_DIRECTORY_FILES, 'sports/mlb.html', 'sports/nhl.html',
      'assets/social/og-sports.png', 'assets/social/og-nfl-trades.png',
      'assets/social/og-nfl-analysis.png', 'assets/social/og-nfl-film-room.png',
      'assets/social/og-sports-nba.png', 'assets/social/og-sports-mlb.png',
      'assets/social/og-sports-nhl.png',
    ],
    sitemapRoutes: [
      '/sports', '/nfl/trades', '/nfl/analysis', '/nfl/film-room',
      '/sports/nba', '/sports/mlb', '/sports/nhl',
    ],
    includeHomepage: false,
  },
  publishing: {
    overlayFiles: [
      'forecasting.html', 'investigations.html', 'election-challenge.html', 'sports-desk.css', 'sports-article.css', 'sports.html', 'sports/module-registry.json',
      'election/fresh-run-checkpoint.json',
      'nfl/trades.html', 'nfl/trades.js', 'nfl/desk-live.json', 'nfl/current-forecasts.json', 'nfl/player-portraits.json', 'nfl/analysis.html', 'nfl/film-room.html', ...NBA_DIRECTORY_FILES, 'sports/mlb.html',
      'sports/nhl.html', 'nfl/weekly-brief.html', 'insights.css', 'insights.html',
      'insights/nfl-brier-accountability.html', 'insights/election-forecast-custody.html',
      'insights/ai-bots-money-claims.html', 'sports-interest.html',
      'assets/kahrelum-sports-intelligence-nfl-social-card.png',
      'assets/kahrelum-sports-intelligence-social-card.png',
      ...SOCIAL_CARD_FILES,
    ],
    sitemapRoutes: [
      '/sports', '/nfl/trades', '/nfl/film-room', '/sports/nba', '/sports/mlb',
      '/sports/nhl', '/nfl/weekly-brief', '/insights', '/insights/nfl-brier-accountability',
      '/insights/election-forecast-custody', '/insights/ai-bots-money-claims', '/sports-interest',
      '/election-live', '/election-count', '/election-method', '/election-showdown',
      '/election-comparison',
    ],
    includeHomepage: true,
  },
  'social-previews': {
    overlayFiles: [
      'assets/social-manifest.json',
      'assets/social/og-pilot.png', 'assets/social/og-demo.png', 'assets/social/og-sample.png',
      'assets/social/og-connect.png', 'assets/social/og-hasan.png',
      'election/challenger-source-checks.json', 'election/seat-projections.json',
    ],
    sitemapRoutes: [],
    includeHomepage: false,
    patchLegacySocial: true,
  },
};

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

function readSourceState() {
  const options = { cwd: ROOT, encoding: 'utf8', windowsHide: true };
  try {
    const commit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], options).trim();
    const status = childProcess.execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], options).trim();
    return { commit, clean: status.length === 0 };
  } catch (error) {
    fail(`Unable to establish Git source identity: ${error.message}`);
  }
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
  const previewRequest = new URL(url).hostname.includes('--safe-overlay-');
  const attempts = previewRequest ? 5 : 1;
  let lastStatus = 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const requestUrl = new URL(url);
    if (previewRequest) requestUrl.searchParams.set('kahrelum_preview_check', `${Date.now()}-${attempt}`);
    const response = await fetch(requestUrl, {
      redirect: 'follow',
      headers: previewRequest ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } : {},
    });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    lastStatus = response.status;
    if (attempt + 1 < attempts && (response.status === 404 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    break;
  }
  fail(`${url} returned HTTP ${lastStatus}`);
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

async function createRelease(client, channel, versionName, partialRelease) {
  const siteResource = versionName.replace(/\/versions\/[^/]+$/, '');
  if (!/^projects\/[^/]+\/sites\/[^/]+$/.test(siteResource)) fail(`Invalid Firebase version resource: ${versionName}`);
  const response = await client.post(`/${siteResource}/channels/${channel}/releases`, partialRelease, {
    queryParams: { versionName },
  });
  return response.body;
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
  for (const route of ['/sports', '/nfl/trades', '/nfl/film-room']) {
    if (!output.includes(`href="${route}"`)) fail(`Homepage is missing sports navigation to ${route}.`);
  }
  if (!output.includes('$750') || !output.includes('$2,500')) fail('Homepage pricing custody check failed.');
  const publicReleaseIdentity = /<section>\s*<p class="eyebrow">Release identity<\/p>[\s\S]*?<\/section>\s*/gi;
  const identitySections = output.match(publicReleaseIdentity) || [];
  if (identitySections.length > 1) fail('Homepage contains multiple public release-identity sections.');
  output = output.replace(publicReleaseIdentity, '');
  if (/<p class="eyebrow">Release identity<\/p>/i.test(output)) fail('Homepage public release-identity section was not removed.');
  return Buffer.from(output, 'utf8');
}

function replaceHomepageSocialMetadata(home, repositoryHome) {
  const socialPattern = /<meta\s+(?:property|name)="(?:og:(?:type|url|title|description|image(?::(?:secure_url|type|width|height|alt))?)|twitter:(?:card|title|description|image|image:alt))"[^>]*>\s*/gi;
  const approvedTags = repositoryHome.match(socialPattern) || [];
  if (approvedTags.length !== 15) fail(`Repository homepage must contain exactly 15 governed social metadata tags; found ${approvedTags.length}.`);
  let output = home.replace(socialPattern, '');
  const canonical = /<link\s+rel="canonical"\s+href="https:\/\/kahrelum\.com\/"[^>]*>/i.exec(output);
  if (!canonical) fail('Live homepage has no canonical URL for the bounded social metadata insertion.');
  output = output.slice(0, canonical.index + canonical[0].length) + approvedTags.join('') + output.slice(canonical.index + canonical[0].length);
  if ((output.match(/property="og:image"/g) || []).length !== 1) fail('Homepage must contain exactly one Open Graph image after metadata insertion.');
  if (!output.includes('https://kahrelum.com/assets/social/og-home.png')) fail('Homepage social card URL was not inserted.');
  return Buffer.from(output, 'utf8');
}

function htmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replaceLegacySocialMetadata(html, route, spec) {
  const canonicalUrl = DOMAIN + route;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const descriptionTag = html.match(/<meta\b(?=[^>]*name=["']description["'])[^>]*>/i)?.[0];
  const description = descriptionTag?.match(/content=["']([^"']*)["']/i)?.[1];
  if (!title || !description) fail(`Legacy social source is missing a title or description: ${route}`);
  if (extractCanonical(html) !== canonicalUrl) fail(`Legacy social canonical changed for ${route}.`);
  const socialPattern = /<meta\b(?=[^>]*(?:property|name)=["'](?:og:(?:type|url|title|description|image(?::(?:secure_url|type|width|height|alt))?)|twitter:(?:card|title|description|image|image:alt))["'])[^>]*>\s*/gi;
  let output = html.replace(socialPattern, '');
  const canonicalTag = output.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/i)?.[0];
  if (!canonicalTag) fail(`Legacy social source has no canonical tag: ${route}`);
  const imageUrl = DOMAIN + spec.image;
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:title" content="${htmlAttribute(title)}">`,
    `<meta property="og:description" content="${htmlAttribute(description)}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:secure_url" content="${imageUrl}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${htmlAttribute(spec.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${htmlAttribute(title)}">`,
    `<meta name="twitter:description" content="${htmlAttribute(description)}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${htmlAttribute(spec.alt)}">`,
  ];
  const insertion = canonicalTag + tags.join('');
  output = output.replace(canonicalTag, insertion);
  if ((output.match(/property="og:image"/g) || []).length !== 1) fail(`Legacy Open Graph image cardinality failed: ${route}`);
  if ((output.match(/name="twitter:image"/g) || []).length !== 1) fail(`Legacy X image cardinality failed: ${route}`);
  return Buffer.from(output, 'utf8');
}

function updateSitemap(xml, routes) {
  let output = xml;
  if (!output.includes('</urlset>')) fail('Live sitemap has no closing urlset element.');
  for (const route of routes) {
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

function readRepositoryBytes(name) {
  const source = fs.readFileSync(path.join(ROOT, name));
  if (path.extname(name).toLowerCase() === '.png') return source;
  return Buffer.from(source.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
}

async function buildOverlay(live, profileName) {
  assertHostingConfig(live.config);
  const profile = RELEASE_PROFILES[profileName];
  if (!profile) fail(`Unknown release profile: ${profileName}`);
  const desired = { ...live.fileMap };
  const blobs = {};

  for (const name of profile.overlayFiles) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) fail(`Repository overlay source is missing: ${name}`);
    addBlob(desired, blobs, '/' + name, readRepositoryBytes(name));
  }

  const one = fs.readFileSync(path.join(ROOT, 'one.html'), 'utf8');
  if (!/in development/i.test(one)) fail('KAHRELUM ONE must remain explicitly marked in development.');

  const forecast = fs.readFileSync(path.join(ROOT, 'forecasting.html'), 'utf8');
  for (const required of ['0.222593', '0.146176', 'original cutoff', 'confidence intervals include zero']) {
    if (!forecast.includes(required)) fail(`Forecasting custody check failed for: ${required}`);
  }

  if (profile.includeHomepage) {
    const home = (await verifiedLiveFile(live, '/index.html', '/')).toString('utf8');
    const fragment = fs.readFileSync(path.join(ROOT, 'hosting', 'homepage-divisions.html'), 'utf8');
    const repositoryHome = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const boundedHome = replaceHomepageSection(home, fragment).toString('utf8');
    addBlob(desired, blobs, '/index.html', replaceHomepageSocialMetadata(boundedHome, repositoryHome));
  }

  if (profile.patchLegacySocial) {
    for (const [route, spec] of Object.entries(LEGACY_SOCIAL_SPECS)) {
      const html = (await verifiedLiveFile(live, spec.hostingPath, route)).toString('utf8');
      addBlob(desired, blobs, spec.hostingPath, replaceLegacySocialMetadata(html, route, spec));
    }
  }

  const sitemap = (await verifiedLiveFile(live, '/sitemap.xml', '/sitemap.xml')).toString('utf8');
  addBlob(desired, blobs, '/sitemap.xml', updateSitemap(sitemap, profile.sitemapRoutes));

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

async function verifySurface(origin, expectedApiHashes, profileName = 'full') {
  const checks = [];
  const internal = new Set();
  const verifiedRoutes = profileName === 'sports-intelligence'
    ? HTML_ROUTES.filter((route) => route !== '/election-challenge')
    : HTML_ROUTES;
  for (const route of verifiedRoutes) {
    const bytes = await fetchBytes(origin + route);
    const html = bytes.toString('utf8');
    const expectedCanonical = DOMAIN + (route === '/' ? '/' : route);
    if (extractCanonical(html) !== expectedCanonical) fail(`Canonical check failed for ${route}.`);
    if (!html.includes('name="viewport"')) fail(`Viewport metadata is missing on ${route}.`);
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) internal.add(match[1]);
    checks.push({ route, status: 200, sha256: sha256(bytes) });
  }

  const nflData = JSON.parse((await fetchBytes(origin + '/nfl/trade-board.json')).toString('utf8'));
  if (!Array.isArray(nflData.candidates) || nflData.candidates.length < 124 ||
      !Array.isArray(nflData.deals) || nflData.deals.length < 7 ||
      !Array.isArray(nflData.sources) || nflData.sources.length < 21 ||
      nflData.sourceAccountability?.certifiedMeanBrier !== null) {
    fail('NFL trade board data integrity or forecast-certification boundary failed.');
  }
  if (['full', 'sports-intelligence', 'publishing', 'desk-upgrade'].includes(profileName)) {
    const [sourcegrid, status, health, ledger, audit, publicFeed, publishing] = await Promise.all([
      '/nfl/sourcegrid.json', '/nfl/refresh-status.json', '/nfl/source-health.json',
      '/nfl/forecast-ledger.json', '/nfl/deadline-audit.json', '/nfl/public-feed.json', '/nfl/publishing.json',
    ].map(async (route) => JSON.parse((await fetchBytes(origin + route)).toString('utf8'))));
    if (sourcegrid.counts?.operational < 37 || sourcegrid.counts?.teamsCovered !== 32) fail('SourceGrid coverage gate failed.');
    if (!Array.isArray(health.sources) || health.sources.length !== sourcegrid.counts.operational) fail('Per-source health coverage gate failed.');
    if (!['FRESH', 'DEGRADED', 'STALE_FAILED', 'ARCHIVED_NO_DEADLINE_FETCH'].includes(status.feedFreshness)) fail('Refresh status is not an executed state.');
    if (!Array.isArray(ledger.eligibleLocks) || !Array.isArray(ledger.historicalExcluded) || ledger.historicalExcluded.length < 20) fail('Forecast ledger custody gate failed.');
    const requestedHistorical = new Map([
      ['Marvin Harrison Jr.', [0.49, 0.2601]],
      ['Quenton Nelson', [0.39, 0.3721]],
      ['DeForest Buckner', [0.68, 0.1024]],
    ]);
    for (const [player, [probability, brier]] of requestedHistorical) {
      const record = ledger.historicalExcluded.find(item => item.player === player && item.provisionalBrierArithmetic !== undefined);
      if (!record || record.scoringEligible !== false || record.outcome !== 1 ||
          Math.abs(record.probability - probability) > 1e-12 ||
          Math.abs(record.provisionalBrierArithmetic - brier) > 1e-12 ||
          Math.abs(record.provisionalBrierArithmetic - ((record.probability - record.outcome) ** 2)) > 1e-12) {
        fail(`Excluded historical Brier custody failed for ${player}.`);
      }
    }
    if ((publicFeed.materialAlerts || []).length > 3) fail('Priority alert limit exceeded.');
    if (audit.brierScore !== null && !(audit.eligibleForecasts > 0)) fail('Brier score lacks an eligible denominator.');
    if (publishing.publishingAuthorized !== false) fail('Third-party publishing must remain authorization-gated.');
  }
  if (['full', 'desk-upgrade', 'sports-intelligence'].includes(profileName)) {
    const [current, desk, portraits] = await Promise.all([
      '/nfl/current-forecasts.json', '/nfl/desk-live.json', '/nfl/player-portraits.json',
    ].map(async (route) => JSON.parse((await fetchBytes(origin + route)).toString('utf8'))));
    const expectedIds = new Set(nflData.candidates.map((row) => row.id));
    if (current.schema !== 'KAHRELUM_CURRENT_NFL_FORECASTS_v1.0' ||
        current.forecasts.length !== expectedIds.size ||
        new Set(current.forecasts.map((row) => row.candidateId)).size !== expectedIds.size ||
        current.forecasts.some((row) => !expectedIds.has(row.candidateId) || !Number.isFinite(row.probability) || row.probability < 0 || row.probability > 1)) fail('Every NFL candidate must have one valid current KAHRELUM estimate.');
    if (desk.schema !== 'KAHRELUM_NFL_DESK_LIVE_v1.0' || desk.currentForecasts.forecasts.length !== expectedIds.size) fail('The live desk bundle is incomplete.');
    if (portraits.schema !== 'KAHRELUM_PLAYER_PORTRAITS_v1.0' || new Set(portraits.records.map((row) => row.candidateId)).size !== expectedIds.size) fail('NFL player portrait coverage is incomplete.');
  }
  const one = (await fetchBytes(origin + '/one')).toString('utf8');
  if (['full', 'sports-intelligence', 'publishing', 'portraits'].includes(profileName)) {
    const nba = JSON.parse((await fetchBytes(origin + '/sports/nba-player-portraits.json')).toString('utf8'));
    if (nba.schema !== 'KAHRELUM_NBA_PLAYER_PORTRAITS_v1.0' || nba.league !== 'NBA' ||
        nba.coverage.teams !== 30 || nba.records.length !== nba.coverage.players ||
        new Set(nba.records.map((record) => record.playerId)).size !== nba.records.length ||
        nba.records.some((record) => record.id !== `NBA-ESPN-${record.playerId}`)) fail('NBA player identity or snapshot coverage check failed.');
    const nbaPage = (await fetchBytes(origin + '/sports/nba')).toString('utf8');
    if (!nbaPage.includes('id="nbaPlayers"') || !nbaPage.includes('/sports/nba-players.js')) fail('NBA player directory client is missing.');
  }
  if (!/in development/i.test(one)) fail('KAHRELUM ONE development warning is absent from the deployed page.');
  const home = (await fetchBytes(origin + '/')).toString('utf8');
  if (!home.includes('$750') || !home.includes('$2,500')) fail('Deployed homepage pricing custody check failed.');

  for (const route of internal) await fetchBytes(origin + route);

  const apiHashes = await captureApiHashes(origin);
  if (!util.isDeepStrictEqual(apiHashes, expectedApiHashes)) fail('Preview API bodies differ from the live baseline.');
  return { origin, routes: checks, internalTargets: internal.size, apiHashes };
}

async function createPreview(hosting, client, live, overlay, profileName, sourceState) {
  if (!overlay.changedPaths.length) fail('The overlay is already identical to production; no preview release is needed.');
  const channelId = `${CHANNEL_PREFIX}-${stableMapHash(overlay.desired).slice(0, 12)}`;
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
  const finalizedFiles = await listVersionFiles(client, versionName);
  const finalizedMap = Object.fromEntries(finalizedFiles.map((item) => [item.path, item.hash]));
  if (!util.isDeepStrictEqual(finalizedMap, overlay.desired)) fail('Finalized preview file map differs from the live-derived desired map.');
  if (!util.isDeepStrictEqual(normalizeConfig(finalized.config), live.config)) fail('Finalized preview Hosting configuration differs from production.');

  let channel = await hosting.getChannel('-', SITE, channelId);
  if (!channel) {
    channel = await hosting.createChannel('-', SITE, channelId, 24 * 60 * 60 * 1000);
  }
  await createRelease(client, channelId, versionName, {
    message: `Safe overlay preview based on ${live.version.name}`,
  });
  channel = await hosting.getChannel('-', SITE, channelId);
  const expectedApiHashes = await captureApiHashes(DOMAIN);
  const verification = await verifySurface(channel.url, expectedApiHashes, profileName);
  const receipt = {
    createdAt: new Date().toISOString(),
    site: SITE,
    releaseProfile: profileName,
    sourceCommit: sourceState.commit,
    baseVersion: live.version.name,
    baseConfig: live.config,
    baseConfigHash: sha256(Buffer.from(JSON.stringify(live.config))),
    previewChannel: channelId,
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
  await verifySurface(receipt.previewUrl, receipt.expectedApiHashes, receipt.releaseProfile || 'full');

  const finalLiveCheck = await hosting.getChannel('-', SITE, 'live');
  if (finalLiveCheck?.release?.version?.name !== receipt.baseVersion) fail('Production changed during promotion checks. Prepare a new preview.');

  const release = await createRelease(client, 'live', receipt.previewVersion, {
    message: `Promote verified safe overlay ${receipt.previewVersion.split('/').pop()}`,
  });
  const released = await hosting.getChannel('-', SITE, 'live');
  const releasedFiles = await listVersionFiles(client, released.release.version.name);
  const releasedMap = Object.fromEntries(releasedFiles.map((item) => [item.path, item.hash]));
  if (released.release.version.name !== receipt.previewVersion) fail('Live channel did not adopt the verified preview version.');
  if (!util.isDeepStrictEqual(releasedMap, receipt.desiredFiles)) fail('Production file-map readback differs from the verified preview.');
  if (!util.isDeepStrictEqual(normalizeConfig(released.release.version.config), receipt.baseConfig)) fail('Production Hosting configuration changed during promotion.');
  const verification = await verifySurface(DOMAIN, receipt.expectedApiHashes, receipt.releaseProfile || 'full');
  const productionReceipt = {
    promotedAt: new Date().toISOString(),
    release: release.name,
    version: released.release.version.name,
    fileCount: releasedFiles.length,
    desiredMapHash: receipt.desiredMapHash,
    sourceCommit: receipt.sourceCommit,
    configUnchanged: true,
    verification,
  };
  writeJson(PRODUCTION_RECEIPT, productionReceipt);
  return productionReceipt;
}

async function main() {
  const mode = process.argv[2] || '--plan';
  if (!['--plan', '--preview', '--promote'].includes(mode)) fail(`Unknown mode: ${mode}`);
  const profileFlag = process.argv.indexOf('--profile');
  const profileName = profileFlag === -1 ? 'full' : process.argv[profileFlag + 1];
  if (!profileName || !RELEASE_PROFILES[profileName]) fail(`Unknown or missing release profile: ${profileName || '(missing)'}`);
  const sourceState = readSourceState();
  if (mode === '--preview' && !sourceState.clean) fail('Preview requires a clean Git working tree so the deployed bytes have an exact commit identity.');
  const { firebase, hosting, Client, hostingApiOrigin } = requireFirebaseTools();
  await firebase.projects.list({ json: true, nonInteractive: true });
  const client = new Client({ urlPrefix: hostingApiOrigin(), apiVersion: 'v1beta1', auth: true });
  const live = await readLiveState(hosting, client);

  if (mode === '--promote') {
    console.log(JSON.stringify(await promotePreview(hosting, client, live), null, 2));
    return;
  }

  const overlay = await buildOverlay(live, profileName);
  const summary = {
    mode: mode.slice(2).toUpperCase(),
    site: SITE,
    releaseProfile: profileName,
    sourceCommit: sourceState.commit,
    sourceClean: sourceState.clean,
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
  const receipt = await createPreview(hosting, client, live, overlay, profileName, sourceState);
  console.log(JSON.stringify({ ...summary, previewUrl: receipt.previewUrl, previewVersion: receipt.previewVersion }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
