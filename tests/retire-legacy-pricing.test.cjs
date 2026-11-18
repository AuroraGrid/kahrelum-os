'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('public-facing KAHRELUM offer contains only current $750 and $2,500 prices',()=>{
 for(const name of ['index.html','pilot.html','assurance.html','PILOT.md','AGENTS.md','pilot-page.md','README.md']){
  const content=read(name);
  assert.doesNotMatch(content,/\$500|US\$500|five.case (?:diagnostics|historical reviews)/i, name);
  assert.doesNotMatch(content,/previously quoted recipient-specific offers|existing commitments: previously quoted|earlier recipient-specific quotes|prior recipient-specific quotes/i, name);
 }
 const home=read('index.html'),pilot=read('pilot.html');
 assert.match(home,/US\$750/);
 assert.match(home,/US\$2,500/);
 assert.match(pilot,/id="pilotInquiry"/);
 assert.match(pilot,/\$750/);
 assert.match(pilot,/\$2,500/);
});

test('live retire-patch removes only the legacy reference and is idempotent',()=>{
 const {retireLegacyPricing}=require('../scripts/retire-legacy-pricing.cjs');
 for(const [route,phrase] of [
  ['/','Previously quoted recipient-specific offers, including US$500 five-case diagnostics, remain unchanged.'],
  ['/pilot','<p>Existing commitments: Previously quoted recipient-specific terms, including the $500 five-case historical reviews, remain unchanged for those recipients. They are not a generally available third public package.</p>'],
 ]) {
  const original='<html><head><title>KAHRELUM</title></head><body><p>US$750 / US$2,500</p>'+phrase+'<footer>Other content stays</footer></body></html>';
  const updated=retireLegacyPricing(original,route);
  assert.ok(!updated.includes('$500'));
  assert.ok(updated.includes('Other content stays'));
  assert.ok(updated.includes('US$750 / US$2,500'));
  assert.equal(retireLegacyPricing(updated,route),updated);
  assert.notEqual(updated,original);
 }
 assert.throws(()=>retireLegacyPricing('<html><p>Unknown third tier $500</p></html>','/'),/unexpected|unrecognized|unsupported/i);
 assert.throws(()=>retireLegacyPricing('<html></html>','/outside'),/unsupported|route/i);
});

test('guarded Firebase release has a homepage and pilot-only pricing-removal profile',()=>{
 const publisher=read('scripts/firebase-overlay-release.cjs'),workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(publisher, /'pricing-retirement':\s*\{[\s\S]{0,250}overlayFiles:\s*\[\]/);
 assert.match(publisher, /retireLegacyPricing\(liveHtml, route\)/);
 assert.match(publisher, /Pricing retirement attempted to change unrelated live Firebase files/);
 assert.match(workflow, /profiles="pricing-retirement"/);
 assert.match(workflow, /pricing-retirement/);
 assert.doesNotMatch(workflow, /firebase deploy --only hosting/);
});
