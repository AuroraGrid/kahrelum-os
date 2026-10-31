'use strict';

const origin = (process.argv[2] || 'https://kahrelum.com').replace(/\/$/, '');
const routes = [
  '/', '/assurance', '/investigations', '/forecasting', '/digital-id', '/one', '/os',
  '/election-challenge', '/pilot', '/demo', '/sample', '/connect', '/hasan', '/election-lab',
  '/election-live', '/election-count', '/election-method', '/election-showdown', '/election-comparison',
  '/nfl/trades', '/nfl/analysis', '/nfl/weekly-brief', '/sports', '/nfl/film-room', '/sports/nba',
  '/sports/mlb', '/sports/nhl', '/insights', '/insights/nfl-brier-accountability',
  '/insights/election-forecast-custody', '/insights/ai-bots-money-claims', '/sports-interest'
];

function meta(html, attribute, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escaped}["']`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&');
  }
  return null;
}

function imageDimensions(buffer, contentType) {
  if (contentType.includes('png') && buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if ((contentType.includes('jpeg') || contentType.includes('jpg')) && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      if (offset + 4 >= buffer.length) break;
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  return { width: null, height: null };
}

async function readImage(url, cache) {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || '';
  const dimensions = imageDimensions(buffer, contentType);
  const record = { status: response.status, contentType, bytes: buffer.length, ...dimensions };
  cache.set(url, record);
  return record;
}

async function main() {
  const imageCache = new Map();
  const pages = [];
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`, { redirect: 'follow', cache: 'no-store' });
    const html = await response.text();
    const ogImage = meta(html, 'property', 'og:image');
    const twitterImage = meta(html, 'name', 'twitter:image');
    const twitterCard = meta(html, 'name', 'twitter:card');
    const declaredWidth = meta(html, 'property', 'og:image:width');
    const declaredHeight = meta(html, 'property', 'og:image:height');
    const declaredType = meta(html, 'property', 'og:image:type');
    const ogAlt = meta(html, 'property', 'og:image:alt');
    const image = ogImage ? await readImage(ogImage, imageCache) : null;
    const issues = [];
    if (response.status !== 200) issues.push(`page returned ${response.status}`);
    if (!ogImage) issues.push('missing og:image');
    if (!twitterImage) issues.push('missing twitter:image');
    if (ogImage !== twitterImage) issues.push('Open Graph and X images differ');
    if (twitterCard !== 'summary_large_image') issues.push('missing summary_large_image');
    if (!ogAlt) issues.push('missing og:image:alt');
    if (declaredWidth !== '1200' || declaredHeight !== '630') issues.push('declared dimensions are not 1200x630');
    if (image && image.status !== 200) issues.push(`image returned ${image.status}`);
    if (image && (image.width !== 1200 || image.height !== 630)) issues.push('actual dimensions are not 1200x630');
    pages.push({ route, pageStatus: response.status, ogImage, twitterImage, twitterCard, declaredWidth, declaredHeight, declaredType, ogAlt, image, issues });
  }
  const grouped = new Map();
  for (const page of pages) grouped.set(page.ogImage, [...(grouped.get(page.ogImage) || []), page]);
  const shared = [...grouped.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([image, group]) => ({ image, routes: group.map((page) => page.route) }));
  const report = {
    auditedAtUtc: new Date().toISOString(), origin, pageCount: pages.length,
    uniqueImageCount: imageCache.size, issueCount: pages.filter((page) => page.issues.length).length,
    issues: pages.filter((page) => page.issues.length), shared, pages
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.issueCount) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
