'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('homepage exposes truthful canonical WebPage schema and agent discovery hints', () => {
  const html = read('index.html');
  const head = html.split('</head>')[0];
  const match = head.match(/<script type="application\/ld\+json" id="kahrelum-homepage-schema">([^<]+)<\/script>/);
  assert.ok(match, 'Expected one homepage JSON-LD block');
  assert.equal(head.split('id="kahrelum-homepage-schema"').length - 1, 1);
  const schema = JSON.parse(match[1]);
  assert.equal(schema['@type'], 'WebPage');
  assert.equal(schema.url, 'https://kahrelum.com/');
  assert.equal(schema.dateModified, '2026-11-12');
  assert.ok(!JSON.stringify(schema).includes('LocalBusiness'));
  assert.match(head, /rel="alternate" type="text\/markdown" href="\/index\.md"/);
  assert.match(head, /rel="describedby" href="\/llms\.txt"/);
  assert.match(head, /name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"/);
  assert.match(read('index.md'), /canonical: "https:\/\/kahrelum\.com\/"/);
});
