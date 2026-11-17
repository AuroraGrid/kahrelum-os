'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page='opticodds-market-integrity.html';
const image='assets/social/og-opticodds-market-integrity.png';
const route='/opticodds-market-integrity';

test('market lab is explicitly synthetic, independent and free of live API credentials',()=>{
 const html=read(page);
 for(const text of ['Synthetic / No live API','No OpticOdds customer failure is alleged','Nothing is sent to a server','FIT/NO FIT']) assert.ok(html.includes(text),text);
 assert.match(html,/href="https:\/\/kahrelum\.com\/opticodds-market-integrity"/);
 assert.match(html,/<meta property="og:title"/);
 assert.match(html,/<meta name="twitter:card" content="summary_large_image"/);
 assert.match(html,/property="og:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-opticodds-market-integrity\.png"/);
 assert.match(html,/name="twitter:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-opticodds-market-integrity\.png"/);
 for(const id of ['tab-injury','tab-reconnect','tab-settlement','downloadJson','downloadCsv']) assert.ok(html.includes('id="'+id+'"'),id);
});

test('unique OG preview is a real 1200x630 PNG',()=>{
 const png=fs.readFileSync(path.join(root,image));
 assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
 assert.ok(png.length>8000);
});

test('Firebase publishes only bounded page, unique image and sitemap',()=>{
 const publisher=read('scripts/firebase-overlay-release.cjs');
 const profile=publisher.match(/  'opticodds-market-integrity': \{([\s\S]*?)\n  \},/);
 assert.ok(profile,'scoped release profile');
 assert.match(profile[1],/overlayFiles: \['opticodds-market-integrity\.html', 'assets\/social\/og-opticodds-market-integrity\.png'\]/);
 assert.match(profile[1],/sitemapRoutes: \['\/opticodds-market-integrity'\]/);
 assert.match(profile[1],/includeHomepage: false/);
 assert.match(publisher,/OpticOdds release attempted to change an unrelated live Firebase path/);
 assert.match(publisher,/OpticOdds social preview readback failed/);
 assert.match(publisher,/profileName === 'opticodds-market-integrity'/);
 assert.match(read('scripts/deploy-unified-firebase.ps1'),/"opticodds-market-integrity"/);
});

test('canonical route and all 3 synthetic paths are present in source',()=>{
 const html=read(page);
 assert.match(html,/rel="canonical" href="https:\/\/kahrelum\.com\/opticodds-market-integrity"/);
 assert.match(html,/Injury → suspended prop/);
 assert.match(html,/SSE reconnect → missing checkpoint/);
 assert.match(html,/Player results → final grade/);
});
