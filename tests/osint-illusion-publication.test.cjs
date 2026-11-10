'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const pagePath='insights/osint-illusion.html';
const imagePath='assets/social/og-insights-osint-illusion.png';
const route='/insights/osint-illusion';
const url='https://kahrelum.com'+route;

test('OSINT explainer has unique canonical, complete social metadata and source boundaries',()=>{
 const html=read(pagePath);
 assert.ok(html.includes('<link rel="canonical" href="'+url+'">'));
 assert.ok(html.includes('<meta property="og:url" content="'+url+'">'));
 assert.ok(html.includes('<meta property="og:image" content="https://kahrelum.com/'+imagePath+'">'));
 assert.ok(html.includes('twitter:card" content="summary_large_image"'));
 for(const phrase of ['November 10, 2026','7Q-VAF','Vise Air','Karachi',
  'unverified','corrections','cargo','passengers','https://www.flightradar24.com/data/aircraft/7q-vaf',
  'https://www.flightradar24.com/How-It-Works','https://www.faa.gov/air_traffic/technology/equipadsb/capabilities/ins_outs',
  'https://humanrights.berkeley.edu/publications/berkeley-protocol-on-digital-open-source-investigations/']){
  assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
 }
 assert.ok(html.includes('No verified evidence in this source review establishes'));
});

test('distinct OSINT social preview is a real 1200x630 PNG',()=>{
 const img=fs.readFileSync(path.join(root,imagePath));
 assert.equal(img.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(img.readUInt32BE(16),1200);
 assert.equal(img.readUInt32BE(20),630);
 assert.notDeepEqual(img,fs.readFileSync(path.join(root,'assets/social/og-insights.png')));
});

test('Insights discovery, public directory and evidence ledger all identify the article',()=>{
 for(const p of ['insights.html','sitemap.md'])assert.ok(read(p).includes(route),p);
 const ledger=read('research/osint-illusion/2026-11-10-evidence-ledger.md');
 for(const value of ['7Q-VAF','Vise Air','November 6','November 8','UNVERIFIED','screenshot']){
  assert.ok(ledger.includes(value),value);
 }
});

test('bounded Firebase release is triggered and verifies real production article and image',()=>{
 const publisher=read('scripts/firebase-overlay-release.cjs');
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 for(const p of [pagePath,imagePath,'insights.html'])assert.ok(publisher.includes(p),p);
 assert.ok(publisher.includes("'osint-illusion': {"));
 assert.ok(publisher.includes(route));
 assert.ok(publisher.includes("profileName === 'osint-illusion'"));
 for(const p of [pagePath,imagePath,'osint-illusion'])assert.ok(workflow.includes(p),p);
 assert.ok(workflow.includes('selections+=(osint-illusion)'));
 assert.ok(workflow.includes('--preview --profile'));
 assert.ok(workflow.includes('--promote --profile'));
 assert.doesNotMatch(workflow,/firebase deploy --only hosting/);
});
