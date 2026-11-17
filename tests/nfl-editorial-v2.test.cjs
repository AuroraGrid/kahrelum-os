'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cards=[
 ['nfl/trade-volume-challenge-2026.html','og-nfl-trade-volume-challenge-2026-v2.png','nfl-trade-volume-challenge-2026.svg'],
 ['nfl/trades.html','og-nfl-trades-v2.png','nfl-trades.svg'],
 ['nfl/film-room.html','og-nfl-film-room-v2.png','nfl-film-room.svg'],
 ['nfl/analysis.html','og-nfl-analysis-v2.png','nfl-analysis.svg'],
 ['sports.html','og-sports-v2.png','sports-desk.svg'],
 ['nfl/deadline-watch-2026.html','og-nfl-deadline-watch-2026-v2.png','nfl-deadline-watch-2026.svg'],
 ['nfl/weekly-brief.html','og-nfl-weekly-brief-v2.png','nfl-weekly-brief.svg'],
 ['insights/nfl-brier-accountability.html','og-insights-nfl-brier-accountability-v2.png','nfl-brier-accountability.svg']
];
test('redesigned NFL challenge uses the same serious editorial desk design language as Film Room',()=>{
 const s=read('nfl/trade-volume-challenge-2026.html');
 assert.ok(s.includes('href="/sports-desk.css"'));
 assert.match(s,/href="\/nfl\/trade-volume-challenge-2026\.css(?:\?v=\d+)?"/);
 assert.ok(s.includes('class="site-header"'));
 assert.ok(s.includes('class="ops-strip"'));
 assert.ok(s.includes('class="challenge-report"'));
 assert.ok(s.includes('id="challenger-board"'));
 assert.ok(s.includes('id="source-ledger"'));
 assert.ok(s.includes('id="scoring-method"'));
 assert.ok(s.includes('KAHRELUM-NFL-2026-TRADE-VOLUME-DEADLINE-DAY-FC1'));
 assert.ok(s.includes('798a6f3d4b3b9ca6f93d84089f8fe33295cb4ae5'));
 assert.ok(!s.includes('class="bar-fill"'));
});
test('all eight editorial previews are bespoke, versioned, untruncated and annotated',()=>{
 const art=new Set();
 for(const [html,og,svg] of cards){
  const s=read(html),source=read('assets/social/editorial-source/'+svg);
  assert.ok(s.includes('https://kahrelum.com/assets/social/'+og),html);
  assert.ok(s.includes('name="twitter:card" content="summary_large_image"'),html);
  assert.ok(s.includes('og:image:width')&&s.includes('1200'),html);
  assert.ok(s.includes('og:image:height')&&s.includes('630'),html);
  assert.ok(source.includes('<svg')&&source.includes('K A H R E L U M'),svg);
  assert.ok(!source.includes('...')&&!source.includes('source-cu'),svg);
  art.add(crypto.createHash('sha256').update(source).digest('hex'));
 }
 assert.equal(art.size,cards.length);
});
test('compiled 1200x630 PNGs are distinct with source-specific integrity checks',()=>{
 const signatures=new Set();
 const manifest=JSON.parse(read('assets/social/nfl-editorial-v2-manifest.json'));
 assert.equal(manifest.schema,'KAHRELUM_NFL_EDITORIAL_SOCIAL_v2');
 assert.equal(manifest.assets.length,cards.length);
 for(const [,name,svg] of cards){
  const img=path.join(root,'assets/social',name);
  assert.ok(fs.existsSync(img),name+' must be built by the generation step');
  const bytes=fs.readFileSync(img);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16),1200);
  assert.equal(bytes.readUInt32BE(20),630);
  const digest=crypto.createHash('sha256').update(bytes).digest('hex');
  const rec=manifest.assets.find(a=>a.output==='assets/social/'+name);
  assert.ok(rec&&rec.source==='assets/social/editorial-source/'+svg);
  assert.equal(rec.sha256,digest);
  signatures.add(digest);
 }
 assert.equal(signatures.size,cards.length);
});
test('dedicated Firebase release is bounded to page, social assets and existing nav surfaces',()=>{
 const s=read('scripts/firebase-overlay-release.cjs');
 const match=s.match(/  'nfl-editorial-v2': \{([\s\S]*?)\n  \},/);
 assert.ok(match);
 for(const [p,n] of cards){assert.ok(match[1].includes("'"+p+"'"),p);assert.ok(match[1].includes("'assets/social/"+n+"'"),n);}
 assert.match(match[1],/sitemapRoutes:/);
 assert.match(match[1],/includeHomepage: false/);
 assert.doesNotMatch(match[1],/sourcegrid\.json|forecast-ledger\.json|current-forecasts\.json|desk-live\.json|election\/|candidate-portraits/);
});
test('Firebase CI generates social art before validation and preview/promotion',()=>{
 const s=read('.github/workflows/firebase-scoped-release.yml');
 assert.ok(s.includes('nfl-editorial-v2'));
 assert.ok(s.includes('build-kahrelum-editorial-social.py'));
 assert.ok(s.indexOf('build-kahrelum-editorial-social.py')<s.indexOf('node --test tests/'));
 assert.ok(s.includes('Publish scoped preview, then promote with exact production readback'));
});
test('original deadline forecast remains unchanged and no synthetic results are credited',()=>{
 const d=JSON.parse(read('research/nfl-2026-trade-deadline/official-forecasts/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json'));
 assert.equal(d.status,'ISSUED_PRE_EVENT');assert.equal(d.scoring.outcome,null);
 assert.equal(d.model.pointForecast,6);assert.equal(d.model.lambda,6.5);
 assert.equal(d.scoring.internalTestsDoNotCount,true);
});
