'use strict';

// Narrow live-page transformation, applied to current verified Firebase bytes.
// Historical private quotes are a separate contractual matter; public pricing has two tiers.
const LEGACY = {
  '/': [
    /\s*Previously quoted recipient-specific offers, including US\$500 five-case diagnostics, remain unchanged\./i,
  ],
  '/pilot': [
    /<p>Existing commitments:\s*Previously quoted recipient-specific terms, including the \$500 five-case historical reviews, remain unchanged for those recipients\. They are not a generally available third public package\.<\/p>/i,
  ],
};

function retireLegacyPricing(html, route) {
  if (typeof html !== 'string' || !Object.hasOwn(LEGACY, route)) {
    throw new Error('Unsupported pricing retirement route');
  }
  let result = html;
  for (const pattern of LEGACY[route]) {
    const matches = [...result.matchAll(new RegExp(pattern.source, pattern.flags+'g'))];
    if (matches.length > 1) throw new Error('Unexpected duplicate legacy pricing string');
    result = result.replace(pattern, '');
  }
  if (/\$500|US\$500|five-case (?:diagnostics|historical reviews)/i.test(result)) {
    throw new Error('Unrecognized legacy pricing copy: stop instead of silently publishing');
  }
  if (!result.includes('$750') || !result.includes('$2,500')) {
    throw new Error('Current $750 and $2,500 offer missing in reviewed live page');
  }
  return result;
}

module.exports = {retireLegacyPricing};
