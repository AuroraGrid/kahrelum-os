'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const route='/election-data/';
const imagePath='assets/social/og-election-data-guide.png';

test('legacy election-data directory has a real, carefully bounded index page',()=>{
 const html=read('election-data/index.html');
 assert.match(html,/rel="canonical" href="https:\/\/kahrelum\.com\/election-data\/"/);
 assert.match(html,/<h1>Election data directory<\/h1>/i);
 assert.match(html,/name="description"/);
 assert.match(html,/name="viewport"/);
 for (const link of ['/election-lab','/election-challenge','/election-data/latest.json','/election-data/coalitions.json','/election-data/competition-lock.json','/election-data/comparison-time-windows.json']) assert.ok(html.includes('href="'+link+'"'),link);
 assert.match(html,/not a certified election result/i);
 assert.match(html,/Historical locks are not rewritten/i);
 assert.match(html,/property="og:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-election-data-guide\.png"/);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
});
test('election-data social preview is unique valid 1200x630 image',()=>{
 const png=fs.readFileSync(path.join(root,imagePath));
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
});
test('scoped Firebase source preserves old data files and sitemap canonical',()=>{
 const code=read('scripts/firebase-overlay-release.cjs');
 const p=code.match(/  'election-data-index': \{([\s\S]*?)\n  \},/);
 assert.ok(p,'no dedicated source-bound profile');
 assert.ok(p[1].includes('election-data/index.html'));
 assert.ok(p[1].includes(imagePath));
 assert.ok(p[1].includes('sitemap.md'));
 assert.ok(read('sitemap.md').includes('https://kahrelum.com/election-data/'));
 assert.ok(p[1].includes("sitemapRoutes: ['/election-data/']"));
 assert.match(code,/Election data index attempted to change unrelated live Firebase files/);
 assert.match(code,/Election data index readback failed/);
 assert.match(code,/profileName === 'election-data-index'/);
 assert.match(read('scripts/deploy-unified-firebase.ps1'),/"election-data-index"/);
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.ok(workflow.includes('election-data-index'));
 assert.ok(workflow.includes("'election-data/index.html'"));
});
