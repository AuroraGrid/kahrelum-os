#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE_URL = 'https://unpkg.com/@svg-maps/usa.states-territories@2.0.0/index.js';
const OUTPUT = path.join(__dirname, '..', 'assets', 'us-states-map.json');
const STATE_CODES = new Set([
  'ak','al','ar','az','ca','co','ct','de','fl','ga','hi','ia','id','il','in','ks','ky','la','ma','md','me','mi','mn','mo','ms','mt',
  'nc','nd','ne','nh','nj','nm','nv','ny','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','va','vt','wa','wi','wv','wy',
]);

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'user-agent': 'kahrelum-map-vendor/1.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        return resolve(fetchText(new URL(response.headers.location, url).href));
      }
      if (response.statusCode !== 200) return reject(new Error(`Map source returned HTTP ${response.statusCode}.`));
      response.setEncoding('utf8');
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

(async () => {
  const source = await fetchText(SOURCE_URL);
  const expression = source.replace(/^\s*export\s+default\s+/, '').replace(/;\s*$/, '');
  const map = vm.runInNewContext(`(${expression})`, Object.create(null), { timeout: 1000 });
  const locations = map.locations.filter((location) => STATE_CODES.has(location.id));
  if (locations.length !== 50) throw new Error(`Expected 50 states, found ${locations.length}.`);
  const payload = {
    schema: 'KAHRELUM_US_STATES_MAP_v1.0',
    source: SOURCE_URL,
    sourcePackage: '@svg-maps/usa.states-territories@2.0.0',
    license: 'Unlicense / public domain dedication',
    viewBox: map.viewBox,
    locations,
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload)}\n`, 'utf8');
  process.stdout.write(`Wrote ${locations.length} state paths to ${OUTPUT}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
