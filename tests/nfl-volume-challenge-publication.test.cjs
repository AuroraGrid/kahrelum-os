'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const file=p=>fs.readFileSync(path.join(root,p));
const route='/nfl/trade-volume-challenge-2026';
const image='assets/social/og-nfl-trade-volume-challenge-2026-v2.png';
test('challenge page has an immutable external forecast custody link and fixed event period',()=>{
 const html=read('nfl/trade-volume-challenge-2026.html');
 assert.ok(html.includes('798a6f3d4b3b9ca6f93d84089f8fe33295cb4ae5'));
 assert.match(html,/November 10, 2026/i);
 assert.match(html,/22:59:40 ET/);
 assert.match(html,/OUTCOME NOT YET ADJUDICATED/);
 assert.match(html,/differing dates and counting windows|differing.*windows|counting windows preserved/i);
});
test('Open Graph and X metadata identify one unique 1200×630 challenge preview',()=>{
 const html=read('nfl/trade-volume-challenge-2026.html');
 assert.ok(html.includes('href="https://kahrelum.com'+route+'"'));
 assert.ok(html.includes('content="https://kahrelum.com/'+image+'"'));
 assert.ok(html.includes('property="og:image:width" content="1200"'));
 assert.ok(html.includes('property="og:image:height" content="630"'));
 assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
 assert.ok(!html.includes('og-nfl-trades.png'));
});
test('social image is a valid 1200×630 PNG with decodable image data',()=>{
 const b=file(image);
 assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(b.readUInt32BE(16),1200);assert.equal(b.readUInt32BE(20),630);
 assert.ok([0,2,3,4,6].includes(b[25])); // valid PNG color type; no single renderer is prescribed
 let offset=8,idat=[];
 while(offset<b.length){const len=b.readUInt32BE(offset),type=b.toString('ascii',offset+4,offset+8);if(type==='IDAT')idat.push(b.subarray(offset+8,offset+8+len));offset+=12+len;}
 assert.ok(idat.length>0);
 const pixels=zlib.inflateSync(Buffer.concat(idat));
 assert.ok(pixels.length>=630*600); // permits RGBA or indexed rasterization
});
test('scoped Firebase challenge profile cannot overwrite SourceGrid or forecast ledgers',()=>{
 const s=read('scripts/firebase-overlay-release.cjs');
 const match=s.match(/  'nfl-editorial-v2': \{([\s\S]*?)\n  \},/);
 assert.ok(match);
 assert.ok(match[1].includes("'nfl/trade-volume-challenge-2026.html'"));
 assert.ok(match[1].includes("'assets/social/og-nfl-trade-volume-challenge-2026-v2.png'"));
 assert.ok(match[1].includes("sitemapRoutes: []"));
 assert.ok(match[1].includes('includeHomepage: false'));
 assert.doesNotMatch(match[1],/forecast-ledger|sourcegrid|desk-live|current-forecasts|firebase deploy/);
});
test('Firebase CI watches the versioned page assets and allows nfl-editorial-v2 profile',()=>{
 const y=read('.github/workflows/firebase-scoped-release.yml');
 for(const token of ['nfl/trade-volume-challenge-2026.html','assets/social/editorial-source/**','selections+=(nfl-editorial-v2)','- nfl-editorial-v2','nfl-editorial-v2|us-results-data'])assert.ok(y.includes(token),token);
 assert.doesNotMatch(y,/firebase deploy --only hosting/);
});
test('challenge links are present in sports desk, NFL trade desk, film room and public sitemap',()=>{
 for(const p of ['sports.html','nfl/trades.html','nfl/film-room.html','sitemap.md'])assert.ok(read(p).includes(route),p);
});
test('source forecast lock remains completely separate from challenge page',()=>{
 const d=JSON.parse(read('research/nfl-2026-trade-deadline/official-forecasts/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json'));
 assert.equal(d.model.pointForecast,6);
 assert.equal(d.model.lambda,6.5);
 assert.deepEqual(d.model.central80PercentInterval,[3,10]);
 assert.equal(d.status,'ISSUED_PRE_EVENT');
 assert.equal(d.scoring.outcome,null);
});
