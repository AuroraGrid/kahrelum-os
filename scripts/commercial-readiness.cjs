'use strict';

// Surgical text-only updates to the authenticated, preserved live Hosting version.
// Any missing or duplicated anchor blocks the release rather than overwriting a page.
const PILOT_CTA = '<a href="/pilot#request">Historical AI decision review: $750 Fit Check →</a>';

const PAGE_PATCHES = Object.freeze({
  'forecasting.html': [
    {
      before: 'Before resolution, no competitor is declared beaten.',
      after: 'No competitor is declared beaten until the applicable official certifications and contract-resolution rules are satisfied.',
    },
    {
      before: '<a href="/pilot#request">Review the pilot →</a>',
      after: PILOT_CTA,
    },
  ],
  'investigations.html': [
    {
      before: '<a href="/os">Read KAHRELUM OS &amp; Method →</a></nav>',
      after: '<a href="/os">Read KAHRELUM OS &amp; Method →</a>' + PILOT_CTA + '</nav>',
    },
  ],
  'digital-id.html': [
    {
      before: '<a href="/os">Read KAHRELUM OS & Method →</a></nav>',
      after: '<a href="/os">Read KAHRELUM OS & Method →</a>' + PILOT_CTA + '</nav>',
    },
  ],
});

const MODIFIED_ROUTES = Object.freeze({
  '/forecasting': '2026-11-05',
  '/investigations': '2026-11-05',
  '/digital-id': '2026-11-05',
});

function patchLivePage(filename, html) {
  const patches = PAGE_PATCHES[filename];
  if (!patches || typeof html !== 'string') throw new Error('Unexpected page patch input: ' + filename);
  let result = html;
  for (const { before, after } of patches) {
    const beforeCount = result.split(before).length - 1;
    const afterCount = result.split(after).length - 1;
    if (beforeCount === 0 && afterCount === 1) continue; // an already-applied fix
    if (beforeCount !== 1 || afterCount !== 0) {
      throw new Error('Expected one unique patch anchor in ' + filename);
    }
    result = result.replace(before, after);
  }
  return result;
}

function setSitemapLastmod(xml, modifiedRoutes = MODIFIED_ROUTES) {
  if (typeof xml !== 'string' || !xml.includes('</urlset>')) {
    throw new Error('Expected a valid existing live sitemap');
  }
  let result = xml;
  for (const [route, date] of Object.entries(modifiedRoutes)) {
    if (!/^\/(?:[a-z0-9/-]*)$/.test(route) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
      throw new Error('Invalid sitemap route or verified modification date');
    }
    const url = 'https://kahrelum.com' + route;
    const escaped = url.replaceAll('.', '\\.').replaceAll('/', '\\/');
    const pattern = new RegExp('<url>\\s*<loc>' + escaped + '<\\/loc>\\s*(?:<lastmod>[^<]+<\\/lastmod>\\s*)?<\\/url>', 'g');
    let count = 0;
    result = result.replace(pattern, function () {
      count += 1;
      return '<url><loc>' + url + '</loc><lastmod>' + date + '</lastmod></url>';
    });
    if (count !== 1) throw new Error('Expected a unique sitemap entry: ' + route);
  }
  return result;
}

module.exports = { PILOT_CTA, PAGE_PATCHES, MODIFIED_ROUTES, patchLivePage, setSitemapLastmod };
