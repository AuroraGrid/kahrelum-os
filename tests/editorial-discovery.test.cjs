'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const {syncEditorialSection} = require('../scripts/editorial-discovery.cjs');
const marker = '<section id="editorial-discovery-20261120"';
const anchors = {
  '/insights': '<section id="recent-investigations-20261117"',
  '/investigations': '<section aria-labelledby="chip01-feature">',
};
function datedSection(html) {
  const matches = [...html.matchAll(/<section id="editorial-discovery-20261120"[^>]*>[\s\S]*?<\/section>/g)];
  assert.equal(matches.length,1,'Expected exactly one dated section');
  return matches[0][0];
}
test('both discovery pages promote November research with traceable source links and no rewritten historical evidence',()=>{
 const insights = read('insights.html');
 const investigations = read('investigations.html');
 for(const html of [insights,investigations]) {
  assert.ok(html.includes(marker));
  assert.match(html,/November 17, 2026/);
  assert.match(html,/href="\/investigations\/anthropic-lobbying-chip-policy"/);
  assert.match(html,/historical|dated|original|unscored/i);
  assert.ok(!/\$500/.test(datedSection(html)));
 }
 for(const link of ['/forecasting/nfc-east-2026','/insights/morgan-dollar-quote']) assert.ok(insights.includes('href="'+link+'"'));
 for(const link of ['/investigations/air-02','/investigations/ca-001','/investigations/chip-01#chip01-nov17-doj-statement']) assert.ok(investigations.includes('href="'+link+'"'));
 assert.match(investigations,/56 historical case families/);
 assert.match(investigations,/NEEDS REDACTION/);
 assert.match(insights,/id="recent-investigations-20261117"/);
});
test('live patch is surgical, idempotent and preserves an independently published feature',()=>{
 for(const [route,file] of [['/insights','insights.html'],['/investigations','investigations.html']]) {
  const canonical = read(file),section=datedSection(canonical);
  let live = canonical.replace(section,'');
  const extra='<section id="separate-live-feature"><p>Previously published source and image preserved.</p></section>';
  if(route==='/investigations') live=live.replace(anchors[route],extra+anchors[route]);
  const updated=syncEditorialSection(live,canonical,route);
  assert.ok(updated.includes(extra)||route==='/insights');
  assert.equal(updated.split('</head>')[0],live.split('</head>')[0]);
  assert.ok(updated.includes(section));
  assert.equal(syncEditorialSection(updated,canonical,route),updated);
 }
});
test('fails closed on duplicate, missing anchor, unapproved route, or independently edited live content',()=>{
 const canonical = read('insights.html'),section=datedSection(canonical),live=canonical.replace(section,'');
 assert.throws(()=>syncEditorialSection(live,canonical,'/pilot'),/unsupported/i);
 assert.throws(()=>syncEditorialSection(live.replace(anchors['/insights'],'<section id="removed">'),canonical,'/insights'),/anchor/i);
 assert.throws(()=>syncEditorialSection(live,canonical.replace(section,section+section),'/insights'),/duplicate|multiple/i);
 assert.throws(()=>syncEditorialSection(canonical.replace('New research, with records you can inspect','Unauthorized edit'),canonical,'/insights'),/conflict|mismatch|differs/i);
});
test('Firebase publisher only releases two dated index pages and sitemap lastmods',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs');
 const wf=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(pub,/'editorial-discovery': \{/);
 assert.match(pub,/profileName === 'editorial-discovery'/);
 assert.match(pub,/syncEditorialSection\(liveHtml, canonical, route\)/);
 assert.match(pub,/Editorial discovery.*unrelated live Firebase/i);
 assert.match(pub,/\/insights\.html.*\/investigations\.html.*\/sitemap\.xml/);
 assert.match(wf,/profiles="editorial-discovery"/);
 assert.match(wf,/scripts\/editorial-discovery\.cjs/);
 assert.match(wf,/tests\/editorial-discovery\.test\.cjs/);
});
