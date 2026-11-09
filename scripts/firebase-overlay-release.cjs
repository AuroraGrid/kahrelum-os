'use strict';

const crypto = require('crypto');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { Readable } = require('stream');
const { PAGE_PATCHES, MODIFIED_ROUTES, patchLivePage, setSitemapLastmod } = require(path.join(__dirname, 'commercial-readiness.cjs'));
const { cleanupPromotedPreview } = require(path.join(__dirname, 'firebase-preview-cleanup.cjs'));
const { buildCaseShareArtifacts, extractCases } = require(path.join(__dirname, 'case-social-pages.cjs'));
const { buildChip01SocialArtifacts } = require(path.join(__dirname, 'chip01-social.cjs'));
const { patchBuyerPage } = require(path.join(__dirname, 'buyer-discovery.cjs'));

const SITE = 'kahrelum-public-hosting';
const INDEXNOW_KEY_FILE = 'dedc67db0c224b1c9a4be1379f7937f5.txt';
const DOMAIN = 'https://kahrelum.com';
const CHANNEL_PREFIX = 'safe-overlay';
const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.firebase-deploy');
const PREVIEW_RECEIPT = path.join(STATE_DIR, 'preview-receipt.json');
const PRODUCTION_RECEIPT = path.join(STATE_DIR, 'production-receipt.json');
const FIREBASE_TOOLS_ROOT = process.env.FIREBASE_TOOLS_ROOT;

// Local candidate portraits have recorded per-image reuse rights. Only the exact
// identity/hash paths admitted by the portrait ledger may enter a release.
const CANDIDATE_PORTRAIT_FILES = JSON.parse(fs.readFileSync(path.join(ROOT, 'election/candidate-portraits.json'), 'utf8')).records
  .filter((record) => typeof record.url === 'string' && record.url.startsWith('/assets/candidate-portraits/'))
  .map((record) => {
    if (!require('../election-challenge-map.js').admittedPortrait({portrait: record}) ||
        !/^[a-f0-9]{64}$/.test(record.imageSha256 || '')) {
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
  'election/poliwave-watchlist.json',
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
  'buyer-discovery': {
    // Read-patch current live homepage and pilot without replacing archived sections or live social assets.
    overlayFiles: ['AGENTS.md', 'sitemap.md', 'llms-full.txt', 'index.md', 'pilot-page.md'],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'opticodds-market-integrity': {
    // Synthetic OpticOdds-aligned preview only; keep every other live Firebase file and config unchanged.
    overlayFiles: ['opticodds-market-integrity.html', 'assets/social/og-opticodds-market-integrity.png'],
    sitemapRoutes: ['/opticodds-market-integrity'],
    includeHomepage: false,
  },
  'ai-evaluation': {
    // Bounded, source-linked synthetic evaluation. Keep all other live Firebase files unchanged.
    overlayFiles: ['ai-intelligence-evaluation-2026.html'],
    sitemapRoutes: ['/ai-intelligence-evaluation-2026'],
    includeHomepage: false,
  },
  'results-verified': {
    // First release for the three election / NFL public views. Never publish research drafts or frozen forecasts.
    overlayFiles: [
      'election-results-2026.html', 'election-results-2026.js', 'election/results-2026-snapshot.json',
      'israel-certified-2026.html', 'israel-certified-2026.js', 'election/israel-certified-2026.json',
      'nfl/deadline-watch-2026.html', 'nfl/deadline-watch-2026.js', 'nfl/official-trade-snapshot-2026.json',
      'evidence-scorecard.html',
      'assets/social/og-us-results-2026.png', 'assets/social/og-israel-certified-2026.png',
      'assets/social/og-nfl-deadline-watch-2026.png', 'assets/social/og-evidence-scorecard.png',
      'assets/social-manifest.json',
    ],
    sitemapRoutes: ['/election-results-2026', '/israel-certified-2026', '/nfl/deadline-watch-2026', '/evidence-scorecard'],
    includeHomepage: true,
  },
  'israel-c7': {
    // Final Israel C7 only, without replacing unrelated live U.S. / NFL / investigation files.
    overlayFiles: ['israel-certified-2026.html', 'israel-certified-2026.js',
      'election/israel-certified-2026.json', 'forecasting.html'],
    sitemapRoutes: [],
    includeHomepage: true,
  },
  'us-results-ui': {
    // Tiny one-time client freshness message; distinct from historical/results data.
    overlayFiles: ['election-results-2026.js'],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'us-results-data': {
    // Recurrent, unofficial elections data only. Old locks, current Israeli records, NFL editorial releases remain immutable.
    overlayFiles: ['election/results-2026-snapshot.json'],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'nfl-sourcegrid-data': {
    // Scheduled research evidence only, never overwrite published HTML, forecasts, or unrelated records.
    overlayFiles: [
      'nfl/sourcegrid.json', 'nfl/source-observations.json', 'nfl/review-queue.json',
      'nfl/refresh-status.json', 'nfl/source-health.json', 'nfl/public-feed.json',
      'nfl/publishing.json', 'nfl/deadline-audit.json', 'nfl/forecast-ledger.json',
      'nfl/desk-live.json',
    ],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'poliwave-watch': {
    // Reference-only Poliwave lookups. Preserve live data, photos, APIs and all older forecast locks.
    overlayFiles: ['election-challenge.html', 'election-challenge-map.js', 'election/poliwave-watchlist.json'],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'lead-magnet': {
    // Bounded landing-page release: existing Firebase files and unrelated routes stay unchanged.
    overlayFiles: ['evidence-scorecard.html', 'evidence-scorecard.js'],
    sitemapRoutes: ['/evidence-scorecard'],
    includeHomepage: false,
  },
  'candidate-portraits': {
    overlayFiles: ['election-challenge.html', 'election-challenge-map.js',
      'election/candidate-portraits.json', ...CANDIDATE_PORTRAIT_FILES],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'indexnow-key': {
    // IndexNow ownership proof only: never replace any live sitemap, case, forecast, assets or site settings.
    overlayFiles: [INDEXNOW_KEY_FILE],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'chip01-publication': {
    // New, source-bound CHIP-01 feature and companion Insight, no unrelated site changes.
    overlayFiles: ['investigations.html', 'investigations/chip-01.html', 'insights.html',
      'insights/nvidia-megaspeed-chip-custody.html'],
    sitemapRoutes: ['/investigations/chip-01', '/insights/nvidia-megaspeed-chip-custody'],
    includeHomepage: false,
  },
  'case-share-cards': {
    // Publish only source-bound case pages and unique 1200x630 cards. Preserve the current
    // production overview image and social manifest rather than reintroducing stale bytes.
    overlayFiles: [],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'legacy-social-metadata': {
    // Repair only /pilot and /demo, whose already-hosted distinct images lacked social tags.
    // Other commercial and research routes retain their exact live files and hashes.
    overlayFiles: [],
    legacySocialRoutes: ['/pilot', '/demo'],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  investigations: {
    // Only the governed investigations document and its exact social card are replaced. Keep other assets,
    // APIs, forecast locks, CSS and homepage as currently deployed, even if local copies are stale.
    overlayFiles: ['investigations.html', 'assets/social/og-air01-v1.png'],
    // The existing live sitemap already lists this route. Preserve its exact hash.
    sitemapRoutes: [],
    includeHomepage: false,
  },
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
  'site-makeover': {
    overlayFiles: ['site-shell.css', 'site-shell.js', 'digital-id.html', 'pilot.html', 'demo.html'],
    liveTransformRoutes: [
      ['/index.html', '/'], ['/assurance.html', '/assurance'], ['/investigations.html', '/investigations'],
      ['/forecasting.html', '/forecasting'], ['/election-challenge.html', '/election-challenge'],
      ['/one.html', '/one'], ['/os.html', '/os'], ['/election-lab.html', '/election-lab'],
      ['/election-results-2026.html', '/election-results-2026'],
      ['/evidence-scorecard.html', '/evidence-scorecard'],
      ['/israel-certified-2026.html', '/israel-certified-2026'],
      ['/nfl/deadline-watch-2026.html', '/nfl/deadline-watch-2026'],
      ['/nfl/analysis.html', '/nfl/analysis'], ['/nfl/film-room.html', '/nfl/film-room'],
      ['/nfl/trades.html', '/nfl/trades'], ['/nfl/weekly-brief.html', '/nfl/weekly-brief'],
      ['/sports-interest.html', '/sports-interest'], ['/sports.html', '/sports'],
      ['/sports/mlb.html', '/sports/mlb'], ['/sports/nba.html', '/sports/nba'], ['/sports/nhl.html', '/sports/nhl'],
      ['/insights.html', '/insights'], ['/insights/ai-bots-money-claims.html', '/insights/ai-bots-money-claims'],
      ['/insights/election-forecast-custody.html', '/insights/election-forecast-custody'],
      ['/insights/nfl-brier-accountability.html', '/insights/nfl-brier-accountability'],
      ['/sample.html', '/sample'], ['/connect.html', '/connect'], ['/hasan.html', '/hasan'],
      ['/election-live.html', '/election-live'], ['/election-count.html', '/election-count'],
      ['/election-method.html', '/election-method'], ['/election-showdown.html', '/election-showdown'],
      ['/election-comparison.html', '/election-comparison'],
    ],
    sitemapRoutes: [],
    includeHomepage: false,
  },
  'commercial-readiness': {
    // Only edit approved snippets of verified live HTML; preserve all other Firebase bytes.
    overlayFiles: ['llms.txt'],
    liveTextRoutes: [
      ['/forecasting.html', '/forecasting'],
      ['/investigations.html', '/investigations'],
      ['/digital-id.html', '/digital-id'],
    ],
    sitemapRoutes: [],
    sitemapLastmod: MODIFIED_ROUTES,
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
  'election-challenge-data': {
    overlayFiles: ['election/challenger-source-checks.json', 'election/seat-projections.json'],
    sitemapRoutes: [],
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

function groupMobileDrawer(html) {
  return html.replace(/(<div\b(?=[^>]*class=["'][^"']*\bsite-mobile-panel\b)[^>]*>)([\s\S]*?)(<\/div>)/i, (full, open, inner, close) => {
    if (/\bsite-mobile-group\b/i.test(inner)) return full;
    const anchors = Array.from(inner.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>[\s\S]*?<\/a>/gi))
      .map((match) => ({ href: match[1], html: match[0] }));
    if (!anchors.length) return full;
    const commercialHrefs = ["/assurance", "/pilot", "/demo", "/os", "mailto:hasan@kahrelum.com"];
    const publicHrefs = ["/forecasting", "/investigations", "/election-lab", "/digital-id", "/sports", "/insights"];
    const used = new Set();
    function group(label, className, hrefs, includeRemaining) {
      const links = hrefs.map((href) => anchors.find((item) => item.href === href && !used.has(item))).filter(Boolean);
      links.forEach((item) => used.add(item));
      if (includeRemaining) anchors.filter((item) => !used.has(item)).forEach((item) => { links.push(item); used.add(item); });
      return '<div class="site-mobile-group ' + className + '"><p class="site-mobile-group-label">' + label + '</p>' +
        links.map((item) => item.html).join("") + '</div>';
    }
    return open +
      group("Commercial Assurance", "site-mobile-group-commercial", commercialHrefs, false) +
      group("Public Intelligence Desks", "site-mobile-group-public", publicHrefs, true) +
      close;
  });
}

function normalizeSharedFooter(html) {
  const pageContexts = [];
  const footerMarker = "\u0000KAHRELUM_SHARED_FOOTER\u0000";
  let sharedOpen = null;
  let sharedInner = "";
  let sharedClose = "</footer>";

  let output = html.replace(/<footer\b([^>]*)>([\s\S]*?)<\/footer>/gi, (full, attrs, inner) => {
    if (/\bsite-footer\b/i.test(attrs) && !sharedOpen) {
      sharedOpen = "<footer" + attrs + ">";
      sharedInner = inner;
      return footerMarker;
    }
    pageContexts.push(inner);
    return "";
  });

  if (!sharedOpen) {
    sharedOpen = '<footer class="site-footer">';
    sharedInner = '<div class="site-footer-inner"><nav aria-label="Footer navigation"><a href="/os">KAHRELUM OS</a><a href="/pilot#request">Pilot inquiry</a><a href="mailto:hasan@kahrelum.com">hasan@kahrelum.com</a><a href="https://github.com/AuroraGrid/kahrelum-os">GitHub repository</a></nav></div>';
  }

  const contextMarkup = pageContexts
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content) => '<div class="site-footer-context">' + content + '</div>')
    .join("");

  if (contextMarkup) {
    const innerOpen = /<div\b(?=[^>]*class=["'][^"']*\bsite-footer-inner\b)[^>]*>/i.exec(sharedInner);
    if (innerOpen) {
      sharedInner = sharedInner.slice(0, innerOpen.index + innerOpen[0].length) +
        contextMarkup + sharedInner.slice(innerOpen.index + innerOpen[0].length);
    } else {
      sharedInner = '<div class="site-footer-inner">' + contextMarkup + sharedInner + '</div>';
    }
  }

  if (!sharedInner.includes('aria-label="Footer navigation"')) {
    sharedInner = sharedInner.replace(/<\/div>\s*$/i,
      '<nav aria-label="Footer navigation"><a href="/os">KAHRELUM OS</a><a href="/pilot#request">Pilot inquiry</a><a href="mailto:hasan@kahrelum.com">hasan@kahrelum.com</a><a href="https://github.com/AuroraGrid/kahrelum-os">GitHub repository</a></nav></div>');
  }
  if (!/Independent, operator-assisted research and evidence review\. Not a certification\./i.test(sharedInner)) {
    sharedInner = sharedInner.replace(/<\/div>\s*$/i,
      '<p class="site-footer-boundary">Independent, operator-assisted research and evidence review. Not a certification.</p></div>');
  } else {
    sharedInner = sharedInner.replace(
      /<p>(Independent, operator-assisted research and evidence review\. Not a certification\.)<\/p>/i,
      '<p class="site-footer-boundary">$1</p>');
  }
  if (!/© 2026 KAHRELUM|&copy; 2026 KAHRELUM/i.test(sharedInner)) {
    sharedInner = sharedInner.replace(/<\/div>\s*$/i, '<p class="site-footer-copyright">© 2026 KAHRELUM</p></div>');
  }

  const sharedFooter = sharedOpen + sharedInner + sharedClose;
  return output.includes(footerMarker) ? output.replace(footerMarker, sharedFooter) : output.replace(/<\/body>/i, sharedFooter + "</body>");
}

function injectSharedShell(html, route) {
  let output = html;
  let mainTag = /<main\b[^>]*>/i.exec(output);
  if (!mainTag) {
    const articleStart = /<article\b[^>]*>/i.exec(output);
    const articleEndPattern = /<\/article>/gi;
    let articleEnd;
    let lastArticleEnd;
    while ((articleEnd = articleEndPattern.exec(output))) lastArticleEnd = articleEnd;
    if (!articleStart || !lastArticleEnd) fail('Legacy public page has no main landmark: ' + route);
    output = output.slice(0, articleStart.index) + '<main id="main-content">' + output.slice(articleStart.index);
    const mainEnd = lastArticleEnd.index + lastArticleEnd[0].length + '<main id="main-content">'.length;
    output = output.slice(0, mainEnd) + '</main>' + output.slice(mainEnd);
    mainTag = /<main\b[^>]*>/i.exec(output);
  }
  let mainId = mainTag[0].match(/\bid=["']([^"']+)["']/i)?.[1];
  if (!mainId) {
    mainId = 'main-content';
    output = output.replace(mainTag[0], mainTag[0].replace(/>$/, ' id="main-content">'));
  }
  if (!/<link\b[^>]*href=["']\/site-shell\.css(?:\?[^"']*)?["']/i.test(output)) {
    output = output.replace(/<\/head>/i, '<link rel="stylesheet" href="/site-shell.css?v=20261105-1"></head>');
  }
  if (!/<script\b[^>]*src=["']\/site-shell\.js(?:\?[^"']*)?["']/i.test(output)) {
    output = output.replace(/<\/head>/i, '<script defer src="/site-shell.js?v=20261105-1"></script></head>');
  }

  const skip = `<a class="site-skip skip-link" href="#${htmlAttribute(mainId)}">Skip to main content</a>`;
  const skipPattern = /<a\b(?=[^>]*class=["'][^"']*\bskip-link\b)[^>]*>[\s\S]*?<\/a>/i;
  if (skipPattern.test(output)) {
    output = output.replace(skipPattern, skip);
  } else {
    output = output.replace(/<body\b[^>]*>/i, (bodyTag) => bodyTag + skip);
  }

  if (!/<header\b[^>]*class=["'][^"']*\bsite-header\b/i.test(output)) {
    const header = '<header class="site-header"><div class="site-header-inner"><a class="site-wordmark" href="/">KAHRELUM OS</a><nav class="site-nav" aria-label="Primary navigation"><a href="/assurance">AI Assurance</a><a href="/pilot">Pilot</a><a href="/demo">Sample Record</a><details class="site-labs"><summary>Public Research Labs <span aria-hidden="true">▾</span></summary><div class="site-labs-panel"><a href="/investigations">Investigations</a><a href="/forecasting">Forecasting</a><a href="/digital-id">Digital ID</a><a href="/sports">Sports</a><a href="/insights">Insights</a><a href="/election-lab">Election Lab</a></div></details><a href="/os">OS &amp; Method</a><a href="mailto:hasan@kahrelum.com">Connect</a></nav><details class="site-mobile-menu"><summary>Menu</summary><div class="site-mobile-panel"><a href="/assurance">AI Assurance</a><a href="/pilot">Pilot</a><a href="/demo">Sample Record</a><a href="/investigations">Investigations</a><a href="/forecasting">Forecasting</a><a href="/digital-id">Digital ID</a><a href="/sports">Sports</a><a href="/insights">Insights</a><a href="/election-lab">Election Lab</a><a href="/os">OS &amp; Method</a><a href="mailto:hasan@kahrelum.com">Connect</a></div></details></div></header>';
    const skipMatch = skipPattern.exec(output);
    const insertAt = skipMatch.index + skipMatch[0].length;
    output = output.slice(0, insertAt) + header + output.slice(insertAt);
  }

  if (!/<footer\b[^>]*class=["'][^"']*\bsite-footer\b/i.test(output)) {
    const nextSteps = route.startsWith('/election-')
      ? '<nav class="site-next-steps" aria-label="Next steps"><a href="/forecasting">Read the forecasting desk -></a><a href="/election-challenge">Review the election challenge -></a></nav>'
      : route === '/sample'
      ? '<nav class="site-next-steps" aria-label="Next steps"><a href="/pilot#request">Review the pilot packages -></a><a href="/demo">Open the worked example -></a></nav>'
      : '<nav class="site-next-steps" aria-label="Next steps"><a href="/pilot#request">Review the pilot packages -></a><a href="/os">Read KAHRELUM OS & Method -></a></nav>';
    const footer = '<footer class="site-footer"><div class="site-footer-inner"><nav aria-label="Footer navigation"><a href="/os">KAHRELUM OS</a><a href="/pilot#request">Pilot inquiry</a><a href="mailto:hasan@kahrelum.com">hasan@kahrelum.com</a><a href="https://github.com/AuroraGrid/kahrelum-os">GitHub repository</a></nav><p>Independent, operator-assisted research and evidence review. Not a certification.</p></div></footer>';
    output = output.replace(/<\/body>/i, nextSteps + footer + '</body>');
  }
  return Buffer.from(output, 'utf8');
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

function replaceIsraelHomepagePortfolio(home, fragment) {
  // Replace only the existing Israel portfolio section, retaining every unrelated live byte.
  const section = /<section\b[^>]*id="portfolio"[^>]*>[\s\S]*?<\/section>/gi;
  const matches = home.match(section) || [];
  if (matches.length !== 1) fail('Israel C7 homepage update requires exactly one existing portfolio section.');
  const bounded = fragment.trim();
  if (!bounded.startsWith('<section id="portfolio">') || !bounded.includes('C7 completed') ||
      !bounded.includes('6 PASS') || !bounded.includes('4 MISS')) {
    fail('Israel C7 homepage fragment lacks required custody text.');
  }
  return home.replace(section, bounded);
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
  if (new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico']).has(path.extname(name).toLowerCase())) return source;
  return Buffer.from(source.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
}

async function buildOverlay(live, profileName) {
  assertHostingConfig(live.config);
  const profile = RELEASE_PROFILES[profileName];
  if (!profile) fail(`Unknown release profile: ${profileName}`);
  const desired = { ...live.fileMap };
  const blobs = {};
  if (profileName === 'indexnow-key') {
    const keyValue = fs.readFileSync(path.join(ROOT, INDEXNOW_KEY_FILE), 'utf8');
    if (keyValue !== INDEXNOW_KEY_FILE.slice(0, -4)) {
      fail('IndexNow key file content does not match its basename.');
    }
  }

  if (profileName === 'nfl-sourcegrid-data') {
    // An automated source check may refresh evidence, not roll back timestamps,
    // silently erase previously reviewed editorial entries, or change forecast locks.
    const sourceStatus = JSON.parse(fs.readFileSync(path.join(ROOT, 'nfl/refresh-status.json'), 'utf8'));
    const liveStatus = JSON.parse((await verifiedLiveFile(live, '/nfl/refresh-status.json', '/nfl/refresh-status.json')).toString('utf8'));
    const incomingAt = Date.parse(sourceStatus.lastCompletedCheckAt);
    const liveAt = Date.parse(liveStatus.lastCompletedCheckAt);
    if (!Number.isFinite(incomingAt) || !Number.isFinite(liveAt) || incomingAt < liveAt) {
      fail('SourceGrid source check is older than the live Firebase checkpoint.');
    }
    if (sourceStatus.sourcesAttempted !== 37 || sourceStatus.sourcesSucceeded + sourceStatus.sourcesFailed !== 37 ||
        !['FRESH','DEGRADED','STALE_FAILED'].includes(sourceStatus.feedFreshness)) {
      fail('SourceGrid check is incomplete or not an executed 37-source report.');
    }
    const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'nfl/forecast-ledger.json'), 'utf8'));
    const liveLedger = JSON.parse((await verifiedLiveFile(live, '/nfl/forecast-ledger.json', '/nfl/forecast-ledger.json')).toString('utf8'));
    for (const key of ['eligibleLocks','historicalExcluded','outcomeRecords']) {
      const candidate = new Set((ledger[key] || []).map(record => record.recordHash || JSON.stringify(record)));
      if ((liveLedger[key] || []).some(record => !candidate.has(record.recordHash || JSON.stringify(record)))) {
        fail('SourceGrid update attempted to erase or rewrite a historical forecast record.');
      }
    }
    const published = JSON.parse(fs.readFileSync(path.join(ROOT, 'nfl/public-feed.json'), 'utf8'));
    const livePublished = JSON.parse((await verifiedLiveFile(live, '/nfl/public-feed.json', '/nfl/public-feed.json')).toString('utf8'));
    const articles = new Set((published.publishedUpdates || []).map(record => JSON.stringify(record)));
    if ((livePublished.publishedUpdates || []).some(record => !articles.has(JSON.stringify(record)))) {
      fail('SourceGrid update attempted to replace or erase an approved editorial release.');
    }
    const publishing = JSON.parse(fs.readFileSync(path.join(ROOT, 'nfl/publishing.json'), 'utf8'));
    if (publishing.publishingAuthorized !== false) fail('SourceGrid may not authorize automated third-party publication.');
  }

  for (const name of profile.overlayFiles) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) fail(`Repository overlay source is missing: ${name}`);
    let sourceBytes = readRepositoryBytes(name);
    if (profileName === 'site-makeover' && name.toLowerCase().endsWith('.html')) {
      sourceBytes = Buffer.from(normalizeSharedFooter(groupMobileDrawer(sourceBytes.toString('utf8'))), 'utf8');
    }
    addBlob(desired, blobs, '/' + name, sourceBytes);
  }

  if (profileName === 'chip01-publication') {
    for (const item of buildChip01SocialArtifacts()) {
      if (!item.approvedArt) {
        fail('Approved CHIP-01 image is not present in GitHub source: ' + item.path);
      }
      addBlob(desired, blobs, item.path, item.image);
    }
  }

  let caseShare = null;
  if (profileName === 'case-share-cards') {
    caseShare = buildCaseShareArtifacts(fs.readFileSync(path.join(ROOT, 'investigations.html'), 'utf8'));
    addBlob(desired, blobs, '/investigations.html', Buffer.from(caseShare.overview, 'utf8'));
    for (const record of caseShare.cases) {
      addBlob(desired, blobs, record.hostingPath, Buffer.from(record.html, 'utf8'));
      addBlob(desired, blobs, record.imagePath, record.image);
    }
  }

  for (const [hostingPath, route] of profile.liveTransformRoutes || []) {
    const liveHtml = (await verifiedLiveFile(live, hostingPath, route)).toString('utf8');
    const shelled = injectSharedShell(liveHtml, route).toString('utf8');
    addBlob(desired, blobs, hostingPath, Buffer.from(normalizeSharedFooter(groupMobileDrawer(shelled)), 'utf8'));
  }

  for (const [hostingPath, route] of profile.liveTextRoutes || []) {
    const file = hostingPath.slice(1);
    const repositoryHtml = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const { after } of PAGE_PATCHES[file] || []) {
      if (!repositoryHtml.includes(after)) fail('Repository canonical file has not been updated: ' + file);
    }
    const liveHtml = (await verifiedLiveFile(live, hostingPath, route)).toString('utf8');
    const revised = patchLivePage(file, liveHtml);
    addBlob(desired, blobs, hostingPath, Buffer.from(revised, 'utf8'));
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
    let boundedHome = replaceHomepageSection(home, fragment).toString('utf8');
    if (profileName === 'israel-c7') {
      const portfolio = fs.readFileSync(path.join(ROOT, 'hosting', 'homepage-israel-c7.html'), 'utf8');
      boundedHome = replaceIsraelHomepagePortfolio(boundedHome, portfolio);
    }
    addBlob(desired, blobs, '/index.html', replaceHomepageSocialMetadata(boundedHome, repositoryHome));
  }

  if (profile.legacySocialRoutes) {
    for (const route of profile.legacySocialRoutes) {
      const spec = LEGACY_SOCIAL_SPECS[route];
      if (!spec) fail('Legacy social route is not in the approved mapping: ' + route);
      const html = (await verifiedLiveFile(live, spec.hostingPath, route)).toString('utf8');
      addBlob(desired, blobs, spec.hostingPath, replaceLegacySocialMetadata(html, route, spec));
    }
  }
  if (profile.patchLegacySocial) {
    for (const [route, spec] of Object.entries(LEGACY_SOCIAL_SPECS)) {
      const html = (await verifiedLiveFile(live, spec.hostingPath, route)).toString('utf8');
      addBlob(desired, blobs, spec.hostingPath, replaceLegacySocialMetadata(html, route, spec));
    }
  }

  const caseSitemapRoutes = caseShare ? caseShare.cases.filter(x => x.includeInSitemap).map(x => x.url) : [];
  if (profile.sitemapRoutes.length || caseSitemapRoutes.length) {
    const sitemap = (await verifiedLiveFile(live, '/sitemap.xml', '/sitemap.xml')).toString('utf8');
    addBlob(desired, blobs, '/sitemap.xml', updateSitemap(sitemap, [...profile.sitemapRoutes, ...caseSitemapRoutes]));
  }

  if (profile.sitemapLastmod) {
    const sitemap = (await verifiedLiveFile(live, '/sitemap.xml', '/sitemap.xml')).toString('utf8');
    addBlob(desired, blobs, '/sitemap.xml', Buffer.from(setSitemapLastmod(sitemap, profile.sitemapLastmod), 'utf8'));
  }

  const changedPaths = Object.keys(desired).filter((item) => live.fileMap[item] !== desired[item]).sort();
  if (profileName === 'buyer-discovery' &&
      changedPaths.some((item) => ![
        '/index.html', '/pilot.html', '/AGENTS.md', '/sitemap.md', '/llms-full.txt', '/index.md', '/pilot-page.md',
      ].includes(item))) {
    fail('Buyer discovery release attempted to change an unrelated live Firebase path.');
  }
  if (profileName === 'opticodds-market-integrity' &&
      changedPaths.some((item) => ![
        '/opticodds-market-integrity.html', '/assets/social/og-opticodds-market-integrity.png', '/sitemap.xml',
      ].includes(item))) {
    fail('OpticOdds release attempted to change an unrelated live Firebase path.');
  }
  if (profileName === 'ai-evaluation' &&
      changedPaths.some((item) => !['/ai-intelligence-evaluation-2026.html', '/sitemap.xml'].includes(item))) {
    fail('AI evaluation release attempted to change an unrelated live Firebase path.');
  }
  if (profileName === 'israel-c7' && changedPaths.some(item =>
      !['/israel-certified-2026.html', '/israel-certified-2026.js',
        '/election/israel-certified-2026.json', '/forecasting.html', '/index.html'].includes(item))) {
    fail('Israel C7 release attempted to replace an unrelated live Firebase path.');
  }
  if (profileName === 'results-verified' && changedPaths.some(item =>
      !RELEASE_PROFILES['results-verified'].overlayFiles.includes(item.slice(1)) &&
      !['/index.html','/sitemap.xml'].includes(item))) {
    fail('Results release attempted to replace an unrelated live path.');
  }
  if (profileName === 'us-results-ui' && changedPaths.some(item => item !== '/election-results-2026.js')) {
    fail('US results freshness UI attempted to replace unrelated Firebase paths.');
  }
  if (profileName === 'us-results-data' &&
      changedPaths.some(item => item !== '/election/results-2026-snapshot.json')) {
    fail('Automated U.S. results data may replace only its one approved snapshot.');
  }
  if (profileName === 'nfl-sourcegrid-data' && changedPaths.some(item =>
      !RELEASE_PROFILES['nfl-sourcegrid-data'].overlayFiles.includes(item.slice(1)))) {
    fail('SourceGrid refresh attempted to replace an unrelated live Firebase path.');
  }
  if (profileName === 'candidate-portraits' && changedPaths.some((item) =>
      !RELEASE_PROFILES['candidate-portraits'].overlayFiles.includes(item.slice(1)))) {
    fail('Candidate portrait release attempted to replace an unrelated live path.');
  }
  if (profileName === 'election-challenge-data' && changedPaths.some((item) =>
      !RELEASE_PROFILES['election-challenge-data'].overlayFiles.includes(item.slice(1)))) {
    fail('Election challenger data release attempted to replace an unrelated live path.');
  }
  if (profileName === 'chip01-publication') {
    const allowed = new Set(['/sitemap.xml',
      ...RELEASE_PROFILES['chip01-publication'].overlayFiles.map(name => '/' + name),
      ...buildChip01SocialArtifacts().map(item => item.path)]);
    if (changedPaths.some(item => !allowed.has(item))) {
      fail('CHIP-01 publication attempted to change an unrelated live Firebase path.');
    }
  }
  if (profileName === 'legacy-social-metadata' && changedPaths.some(item => !['/pilot.html', '/demo.html'].includes(item))) {
    fail('Legacy social metadata attempted to change an unrelated Firebase path.');
  }
  if (profileName === 'indexnow-key' && changedPaths.some(item => item !== '/' + INDEXNOW_KEY_FILE)) {
    fail('IndexNow release attempted to change a path outside its exact key file.');
  }
  if (profileName === 'case-share-cards') {
    const allowed = new Set(['/investigations.html', '/sitemap.xml', '/assets/social/og-investigations.png']);
    for (const record of caseShare.cases) { allowed.add(record.hostingPath); allowed.add(record.imagePath); }
    if (changedPaths.some(item => !allowed.has(item))) {
      fail('Case share release attempted to replace an unrelated live Firebase path.');
    }
  }
  if (profileName === 'investigations' &&
      changedPaths.some((item) => !['/investigations.html', '/assets/social/og-air01-v1.png'].includes(item))) {
    fail('Investigations release attempted to replace an unrelated live Firebase path.');
  }
  if (profileName === 'site-makeover') {
    const allowed = new Set([
      ...profile.overlayFiles.map((name) => '/' + name),
      ...(profile.liveTransformRoutes || []).map(([hostingPath]) => hostingPath),
    ]);
    if (changedPaths.some((item) => !allowed.has(item))) {
      fail('Site makeover attempted to replace an unrelated live Firebase path.');
    }
  }
  if (profileName === 'commercial-readiness') {
    const allowed = new Set([
      '/llms.txt', '/forecasting.html', '/investigations.html', '/digital-id.html', '/sitemap.xml',
    ]);
    if (changedPaths.some((item) => !allowed.has(item))) {
      fail('Commercial readiness release attempted to change an unrelated live Firebase path.');
    }
  }
  if (profileName === 'lead-magnet' &&
      changedPaths.some((item) => !['/evidence-scorecard.html', '/evidence-scorecard.js', '/sitemap.xml'].includes(item))) {
    fail('Lead magnet release attempted to change unrelated live Firebase paths.');
  }
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
  const verifiedRoutes = profileName === 'buyer-discovery'
    ? ['/', '/pilot']
    : profileName === 'opticodds-market-integrity'
    ? ['/opticodds-market-integrity']
    : profileName === 'ai-evaluation'
    ? ['/ai-intelligence-evaluation-2026']
    : profileName === 'lead-magnet'
    ? [...HTML_ROUTES, '/evidence-scorecard']
    : profileName === 'results-verified'
    ? [...HTML_ROUTES, '/evidence-scorecard', '/election-results-2026', '/israel-certified-2026', '/nfl/deadline-watch-2026']
    : profileName === 'israel-c7'
    ? ['/', '/forecasting', '/israel-certified-2026']
    : profileName === 'us-results-data'
    ? ['/election-results-2026']
    : profileName === 'us-results-ui'
    ? ['/election-results-2026']
    : profileName === 'indexnow-key'
    ? ['/']
    : profileName === 'chip01-publication'
    ? ['/investigations', '/investigations/chip-01', '/insights', '/insights/nvidia-megaspeed-chip-custody']
    : profileName === 'legacy-social-metadata'
    ? ['/pilot', '/demo']
    : profileName === 'case-share-cards'
    ? ['/investigations', ...extractCases(fs.readFileSync(path.join(ROOT, 'investigations.html'), 'utf8')).map(x => '/investigations/' + x.slug)]
    : profileName === 'nfl-sourcegrid-data'
    ? ['/nfl/trades', '/nfl/deadline-watch-2026']
    : profileName === 'candidate-portraits' ? ['/election-challenge'] : profileName === 'sports-intelligence'
    ? HTML_ROUTES.filter((route) => route !== '/election-challenge')
    : HTML_ROUTES;
  for (const route of verifiedRoutes) {
    const bytes = await fetchBytes(origin + route);
    const html = bytes.toString('utf8');
    const expectedCanonical = DOMAIN + (route === '/' ? '/' : route);
    if (extractCanonical(html) !== expectedCanonical) fail(`Canonical check failed for ${route}.`);
    if (!html.includes('name="viewport"')) fail(`Viewport metadata is missing on ${route}.`);
    if (profileName === 'site-makeover') {
      if (!html.includes('site-header')) fail(`Shared header is missing on ${route}.`);
      if (!html.includes('skip-link') || !/Skip to main content/i.test(html)) fail(`Skip link is missing on ${route}.`);
      if (!html.includes('site-footer')) fail(`Shared footer is missing on ${route}.`);
      if (!html.includes('/site-shell.css')) fail(`Shared shell stylesheet is missing on ${route}.`);
      if (route !== '/investigations' && !html.includes('/site-shell.js')) fail(`Shared shell behavior is missing on ${route}.`);
      for (const link of ['/os', '/pilot#request', 'mailto:hasan@kahrelum.com', 'https://github.com/AuroraGrid/kahrelum-os']) {
        if (!html.includes(`href="${link}"`)) fail(`Shared footer link ${link} is missing on ${route}.`);
      }
      if (!html.includes('Independent, operator-assisted research and evidence review. Not a certification.')) {
        fail(`Publication-boundary footer is missing on ${route}.`);
      }
    }
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) internal.add(match[1]);
    checks.push({ route, status: 200, sha256: sha256(bytes) });
  }

  if (profileName === 'buyer-discovery') {
    for (const route of ['/', '/pilot']) {
      const page = (await fetchBytes(origin + route)).toString('utf8');
      if (!page.includes('id="kahrelum-buyer-discovery-schema"') ||
          !page.includes('rel="describedby" href="/llms.txt"') ||
          !page.includes('rel="alternate" type="text/markdown"')) {
        fail('Buyer discovery structured metadata readback failed: ' + route);
      }
      if (route === '/pilot' &&
          (!page.includes('/opticodds-market-integrity') ||
           !page.includes('/ai-intelligence-evaluation-2026') ||
           !page.includes('mailto:hasan@kahrelum.com?subject=KAHRELUM%20Fit%20Check%20Inquiry'))) {
        fail('Buyer discovery conversion links readback failed.');
      }
    }
    for (const name of ['AGENTS.md', 'sitemap.md', 'llms-full.txt', 'index.md', 'pilot-page.md']) {
      const output = await fetchBytes(origin + '/' + name);
      if (sha256(output) !== sha256(readRepositoryBytes(name))) {
        fail('Buyer discovery documentation readback failed: ' + name);
      }
      checks.push({ route: '/' + name, status: 200, sha256: sha256(output) });
    }
  }

  if (profileName === 'opticodds-market-integrity') {
    const imagePath = '/assets/social/og-opticodds-market-integrity.png';
    const image = await fetchBytes(origin + imagePath);
    const expected = fs.readFileSync(path.join(ROOT, imagePath.slice(1)));
    if (image.subarray(1, 4).toString('ascii') !== 'PNG' ||
        image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630 ||
        sha256(image) !== sha256(expected)) {
      fail('OpticOdds social preview readback failed.');
    }
    const sitemap = (await fetchBytes(origin + '/sitemap.xml')).toString('utf8');
    if (!sitemap.includes('<loc>' + DOMAIN + '/opticodds-market-integrity</loc>')) {
      fail('OpticOdds sitemap route readback failed.');
    }
    const page = (await fetchBytes(origin + '/opticodds-market-integrity')).toString('utf8');
    if (!page.includes('Synthetic / No live API') ||
        !page.includes('No OpticOdds customer failure is alleged') ||
        !page.includes('No production integration')) {
      fail('OpticOdds synthetic evidence boundary readback failed.');
    }
    checks.push({ route: imagePath, status: 200, sha256: sha256(image) });
  }

  if (profileName === 'commercial-readiness') {
    const llms = (await fetchBytes(origin + '/llms.txt')).toString('utf8');
    if (!llms.startsWith('# KAHRELUM') || !llms.includes('No client results claimed.') ||
        !llms.includes('https://kahrelum.com/pilot')) {
      fail('Public llms.txt does not describe the bounded, non-customer offer.');
    }
    const sitemap = (await fetchBytes(origin + '/sitemap.xml')).toString('utf8');
    for (const [route, date] of Object.entries(MODIFIED_ROUTES)) {
      if (!sitemap.includes('<loc>' + DOMAIN + route + '</loc><lastmod>' + date + '</lastmod>')) {
        fail('Modified sitemap date is missing for ' + route);
      }
    }
    for (const [file, route] of [
      ['forecasting.html', '/forecasting'],
      ['investigations.html', '/investigations'],
      ['digital-id.html', '/digital-id'],
    ]) {
      const html = (await fetchBytes(origin + route)).toString('utf8');
      for (const { before, after } of PAGE_PATCHES[file]) {
        if (html.includes(before) || !html.includes(after)) fail('Research-page conversion patch was not published: ' + route);
      }
    }
  }

  if (profileName === 'chip01-publication') {
    for (const item of buildChip01SocialArtifacts()) {
      const deployed = await fetchBytes(origin + item.path);
      if (deployed.toString('ascii', 1, 4) !== 'PNG' ||
          deployed.readUInt32BE(16) !== 1200 || deployed.readUInt32BE(20) !== 630 ||
          sha256(deployed) !== sha256(item.image)) {
        fail('CHIP-01 social image failed exact 1200x630 readback: ' + item.path);
      }
    }
    for (const [route, image] of [
      ['/investigations/chip-01', '/assets/social/og-investigations-chip-01.png'],
      ['/insights/nvidia-megaspeed-chip-custody', '/assets/social/og-insights-nvidia-megaspeed-chip-custody.png'],
    ]) {
      const html = (await fetchBytes(origin + route)).toString('utf8');
      if (!html.includes('content="' + DOMAIN + image + '"') ||
          !html.includes('twitter:card" content="summary_large_image"')) {
        fail('CHIP-01 route-specific social tags not live: ' + route);
      }
    }
  }
  if (profileName === 'indexnow-key') {
    const keyBytes = await fetchBytes(origin + '/' + INDEXNOW_KEY_FILE);
    if (keyBytes.toString('utf8').trim() !== INDEXNOW_KEY_FILE.slice(0, -4)) {
      fail('IndexNow key readback failed.');
    }
  }
  if (profileName === 'legacy-social-metadata') {
    for (const route of ['/pilot', '/demo']) {
      const spec = LEGACY_SOCIAL_SPECS[route];
      const html = (await fetchBytes(origin + route)).toString('utf8');
      const image = DOMAIN + spec.image;
      if (!html.includes('property="og:image" content="' + image + '"') ||
          !html.includes('name="twitter:image" content="' + image + '"') ||
          !html.includes('name="twitter:card" content="summary_large_image"') ||
          !html.includes('property="og:image:width" content="1200"') ||
          !html.includes('property="og:image:height" content="630"')) {
        fail('Legacy social metadata image mismatch: ' + route);
      }
      const bytes = await fetchBytes(origin + spec.image);
      if (bytes.toString('ascii', 1, 4) !== 'PNG' ||
          bytes.readUInt32BE(16) !== 1200 || bytes.readUInt32BE(20) !== 630) {
        fail('Legacy social metadata image mismatch: ' + route);
      }
    }
  }
  if (profileName === 'case-share-cards') {
    const overview = (await fetchBytes(origin + '/investigations')).toString('utf8');
    if (!overview.includes('/assets/social/og-investigations.png') ||
        overview.slice(0, overview.indexOf('</head>')).includes('/assets/social/og-air01-v1.png')) {
      fail('Investigations overview retains the AIR-01 preview.');
    }
    const items = buildCaseShareArtifacts(fs.readFileSync(path.join(ROOT, 'investigations.html'), 'utf8')).cases;
    for (const row of items) {
      if (!overview.includes('href="' + row.url + '"')) fail('Missing original card share link: ' + row.id);
      const document = (await fetchBytes(origin + row.url)).toString('utf8');
      if (!document.includes('content="' + DOMAIN + row.imagePath + '"') ||
          !document.includes(row.id) || !document.includes('Original finding')) {
        fail('Case-specific metadata or source custody failed: ' + row.id);
      }
      if (!row.includeInSitemap && !document.includes('name="robots" content="noindex,nofollow"')) {
        fail('Sensitive case was newly indexable: ' + row.id);
      }
      const deployed = await fetchBytes(origin + row.imagePath);
      if (deployed.toString('ascii', 1, 4) !== 'PNG' ||
          deployed.readUInt32BE(16) !== 1200 || deployed.readUInt32BE(20) !== 630 ||
          sha256(deployed) !== sha256(row.image)) {
        fail('Case-specific Open Graph PNG failed readback: ' + row.id);
      }
    }
  }

  if (profileName === 'candidate-portraits') {
    const map = require('../election-challenge-map.js');
    const [portraits, current, house] = await Promise.all([
      '/election/candidate-portraits.json', '/election/current-projections.json', '/election/house-forecast-lock.json'
    ].map(async route => JSON.parse((await fetchBytes(origin + route)).toString('utf8'))));
    const races = map.buildRaces(house, current);
    const coverage = map.applyPortraitLedger(races, portraits);
    if (coverage.matchedCards !== portraits.records.length || coverage.matchedCards !== portraits.coverage.admittedPortraits) {
      fail('The deployed roster does not attach every admitted portrait.');
    }
    for (const record of portraits.records.filter(row => row.url.startsWith('/'))) {
      if (sha256(await fetchBytes(origin + record.url)) !== record.imageSha256) fail('Deployed candidate image hash differs: ' + record.candidateName);
    }
    for (const route of internal) await fetchBytes(origin + route);
    const apiHashes = await captureApiHashes(origin);
    if (!util.isDeepStrictEqual(apiHashes, expectedApiHashes)) fail('Portrait release changed an existing API body.');
    return {origin, routes: checks, coverage, localImages: portraits.records.filter(row => row.url.startsWith('/')).length, apiHashes};
  }
  if (profileName === 'us-results-ui') {
    const script = (await fetchBytes(origin + '/election-results-2026.js')).toString('utf8');
    if (!script.includes('STALE SOURCE SNAPSHOT') || !script.includes('90*60*1000')) {
      fail('US results UI freshness warning not deployed.');
    }
  }
  if (['results-verified','us-results-data'].includes(profileName)) {
    const us = JSON.parse((await fetchBytes(origin + '/election/results-2026-snapshot.json')).toString('utf8'));
    if (us.schema !== 'KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1' ||
        us.resultStatus !== 'UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED' ||
        us.house?.length !== 435 || us.senate?.length !== 35 || us.governor?.length !== 36 ||
        new Set(us.house.map(x => x.id)).size !== 435 ||
        new Set(us.senate.map(x => x.id)).size !== 35 ||
        new Set(us.governor.map(x => x.id)).size !== 36 ||
        (us.summary.house.called + us.summary.house.counting) !== 435 ||
        us.summary.senate?.seatsNotUp !== undefined) {
      fail('U.S. results content incomplete, unlabelled, or mixes noncontested Senate seats.');
    }
  }
  if (profileName === 'israel-c7') {
    const israel = JSON.parse((await fetchBytes(origin + '/election/israel-certified-2026.json')).toString('utf8'));
    if (israel.schema !== 'KAHRELUM_ISRAEL_C7_CERTIFIED_SEATS_POSTELECTION_AUDIT_V1' ||
        israel.certifiedValidVotes !== 5691426 || israel.certifiedTotalBallots !== 5717397 ||
        israel.certifiedInvalidVotes !== 25971 || israel.c7?.status !== 'CLOSED' ||
        israel.c7?.process?.pass !== 6 || israel.c7?.process?.miss !== 4 ||
        israel.c7?.proprietaryWinnerBrier !== 'NOT_EVALUABLE' ||
        israel.results?.length !== 14 ||
        israel.results.reduce((sum, x) => sum + x.certifiedSeats, 0) !== 120 ||
        israel.scores.externalOctober26.l1 !== 20 || israel.scores.kahrelumPostClose.l1 !== 8 ||
        !israel.goldSourceUrls.some(url => url.includes('Memorandum%20-%20Results%20of%20the%2026th%20Knesset%20Elections.pdf'))) {
      fail('Israel C7 official-source or scoring integrity check failed.');
    }
    const page = (await fetchBytes(origin + '/israel-certified-2026')).toString('utf8');
    const desk = (await fetchBytes(origin + '/forecasting')).toString('utf8');
    if (!page.includes('6 PASS') || !page.includes('4 MISS') ||
        !page.includes('5,691,426') || !page.includes('not evaluable') ||
        !desk.includes('C7 completed')) fail('Israel C7 content boundary failed.');
  }
  if (profileName === 'results-verified') {
    const israel = JSON.parse((await fetchBytes(origin + '/election/israel-certified-2026.json')).toString('utf8'));
    if (israel.schema !== 'KAHRELUM_ISRAEL_C7_CERTIFIED_SEATS_POSTELECTION_AUDIT_V1' ||
        israel.results?.length !== 14 || israel.certifiedValidVotes !== 5691426 ||
        israel.results.reduce((sum, x) => sum + x.certifiedSeats, 0) !== 120 ||
        israel.scores.kahrelumPostClose.l1 !== 8 || israel.scores.externalOctober26.l1 !== 20 ||
        israel.forecastSources?.kahrelum?.type !== 'POST_CLOSE_EXIT_POLL_CONDITIONED_NOWCAST_NOT_PREELECTION') {
      fail('Israel C7 score integrity or information cutoff boundary failed.');
    }
    const nfl = JSON.parse((await fetchBytes(origin + '/nfl/official-trade-snapshot-2026.json')).toString('utf8'));
    if (nfl.schema !== 'KAHRELUM_NFL_OFFICIAL_DEADLINE_SOURCE_SNAPSHOT_V1' ||
        nfl.status !== 'DEADLINE_STILL_OPEN' || nfl.deals?.length !== nfl.officialListedCount ||
        !nfl.reportedUnconfirmed?.every(x => x.status.includes('NOT_IN_OFFICIAL_NFL_TRACKER'))) {
      fail('Official-tracker and reported-not-confirmed NFL separation failed.');
    }
    const cards = [
      '/assets/social/og-us-results-2026.png', '/assets/social/og-israel-certified-2026.png',
      '/assets/social/og-nfl-deadline-watch-2026.png', '/assets/social/og-evidence-scorecard.png'
    ];
    for (const card of cards) {
      const bytes = await fetchBytes(origin + card);
      if (bytes.length < 4096 || bytes.toString('ascii',1,4) !== 'PNG' ||
          bytes.readUInt32BE(16) !== 1200 || bytes.readUInt32BE(20) !== 630) {
        fail('Open Graph image missing or incorrect dimensions: ' + card);
      }
    }
  }
  const nflData = JSON.parse((await fetchBytes(origin + '/nfl/trade-board.json')).toString('utf8'));
  if (!Array.isArray(nflData.candidates) || nflData.candidates.length < 124 ||
      !Array.isArray(nflData.deals) || nflData.deals.length < 7 ||
      !Array.isArray(nflData.sources) || nflData.sources.length < 21 ||
      nflData.sourceAccountability?.certifiedMeanBrier !== null) {
    fail('NFL trade board data integrity or forecast-certification boundary failed.');
  }
  if (['full', 'sports-intelligence', 'publishing', 'desk-upgrade', 'nfl-sourcegrid-data'].includes(profileName)) {
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

function canonicalVersionName(versionName, liveVersionName) {
  const pattern = /^projects\/([^/]+)\/sites\/([^/]+)\/versions\/([A-Za-z0-9_-]+)$/;
  const live = pattern.exec(liveVersionName || '');
  const candidate = pattern.exec(versionName || '');
  if (!live || !candidate || live[2] !== SITE || candidate[2] !== SITE ||
      ![SITE, live[1]].includes(candidate[1])) {
    fail('Firebase version resource does not belong to the verified live project and site.');
  }
  return `projects/${live[1]}/sites/${SITE}/versions/${candidate[3]}`;
}

function createHostingVersion(hosting, version) {
  return hosting.createVersion.length >= 3
    ? hosting.createVersion(SITE, SITE, version)
    : hosting.createVersion(SITE, version);
}

function updateHostingVersion(hosting, versionId, version) {
  return hosting.updateVersion.length >= 4
    ? hosting.updateVersion(SITE, SITE, versionId, version)
    : hosting.updateVersion(SITE, versionId, version);
}

async function createPreview(hosting, client, live, overlay, profileName, sourceState) {
  if (!overlay.changedPaths.length) fail('The overlay is already identical to production; no preview release is needed.');
  const channelId = `${CHANNEL_PREFIX}-${stableMapHash(overlay.desired).slice(0, 12)}`;
  const versionName = canonicalVersionName(await createHostingVersion(hosting, {
    config: live.config,
    labels: { 'deployment-tool': 'kahrelum-safe-overlay' },
  }), live.version.name);
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
  const finalized = await updateHostingVersion(hosting, versionId, { status: 'FINALIZED' });
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
  // Only after production has passed exact-version file-map, config, and public
  // readback checks, reclaim the redundant preview. Failed cleanup never masks
  // a successful deploy or permits deletion of a live / archive channel.
  try {
    productionReceipt.previewCleanup = await cleanupPromotedPreview(hosting, SITE, receipt.previewChannel, receipt.previewVersion);
  } catch (error) {
    productionReceipt.previewCleanupWarning = String(error.message || error);
  }
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
