'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('NFC East original 1m-run forecast is preserved and probabilities sum to one',()=>{
 const r=JSON.parse(read('research/nfc-east-2026/nfc-east-title-2026-11-12.json'));
 assert.equal(r.main.sample_counts.draws,1000000);
 assert.deepEqual(r.main.sample_counts.champions,{DAL:233978,NYG:663737,PHI:5145,WAS:97140});
 assert.ok(Math.abs(Object.values(r.main.division_odds).reduce((a,b)=>a+b,0)-1)<1e-10);
 assert.equal(r.main.model_assumptions.no_future_tie_games,true);
 assert.equal(r.main.sample_counts.deep_unresolved_ties_allocated_50_50,349);
});
test('NFC East page has provenance, 4 probabilities, original date, canonical and dedicated social metadata',()=>{
 const page=read('forecasting/nfc-east-2026.html');
 for(const label of ['Giants 70.9%','Cowboys 17.5%','Commanders 11.0%','Eagles 0.6%','Giants 66.4%','Cowboys 23.4%','OPEN · UNSCORED','EXPERIMENTAL MODEL','2026-11-13T04:33:38Z','Post-game update ledger','d29ffcc02433efe3bd184865bd15d075fcfce7de']) assert.ok(page.includes(label),label);
 assert.ok(page.includes('<link rel="canonical" href="https://kahrelum.com/forecasting/nfc-east-2026">'));
 assert.ok(page.includes('property="og:image" content="https://kahrelum.com/assets/social/og-nfc-east-title-2026-11-15.png"'));
 assert.ok(page.includes('name="twitter:image" content="https://kahrelum.com/assets/social/og-nfc-east-title-2026-11-15.png"'));
});
test('Dedicated PNG social artwork renders from committed SVG at exact 1200x630',()=>{
 const png=cp.execFileSync('python3',[path.join(root,'scripts/render-nfc-social.py')],{maxBuffer:6*1024*1024});
 assert.ok(png.length>10000);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.ok(read('assets/social/og-nfc-east-title-2026.svg').includes('NFC EAST TITLE ODDS'));
});
test('Dedicated guarded Firebase profile never updates unrelated pages, original locks or homepage',()=>{
 for(const file of ['forecasting.html','sitemap.md','llms.txt','ai-discovery/forecasting.md'])
   assert.ok(read(file).includes('/forecasting/nfc-east-2026'),file);
 const publisher=read('scripts/firebase-overlay-release.cjs');
 const profile=publisher.match(/'nfc-east-title-2026': \{([\s\S]*?)\n  \},/);
 assert.ok(profile);assert.ok(profile[1].includes('includeHomepage: false'));
 assert.ok(!profile[1].includes('index.html'));
 assert.ok(!profile[1].includes('election/house-forecast-lock.json'));
 assert.ok(publisher.includes("profileName === 'nfc-east-title-2026'"));
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.ok(workflow.includes('profiles="nfc-east-title-2026"'));
 assert.ok(workflow.includes('nfc-east-title-2026|malik-beasley-forecast|'));
});
test('Nov 15 source is additive with all four new odds and preserved original',()=>{
 const old=JSON.parse(read('research/nfc-east-2026/nfc-east-title-2026-11-12.json'));
 const r=JSON.parse(read('research/nfc-east-2026/nfc-east-title-2026-11-15-post-sf.json'));
 assert.equal(old.main.division_odds.NYG,.663737);
 assert.equal(r.main.sample_counts.draws,1000000);
 assert.deepEqual(r.main.sample_counts.champions,{NYG:708953,DAL:175437,WAS:109501,PHI:6109});
 assert.equal(r.main.schedule.length,27);
 assert.ok(!r.main.schedule.some(g=>g.away==='SF'&&g.home==='DAL'));
 assert.equal(r.base_records_after_final.DAL.l,6);
 assert.equal(r.base_records_after_final.DAL.conf_l,5);
 assert.equal(r.main.model_assumptions.seed,2026111501);
 assert.ok(Math.abs(Object.values(r.main.division_odds).reduce((a,b)=>a+b,0)-1)<1e-9);
 assert.equal(r.main.sample_counts.deep_unresolved_ties_allocated_50_50,258);
});
test('Versioned Nov 15 social art renders exactly 1200x630 and metadata points to new PNG',()=>{
 const svg='assets/social/og-nfc-east-title-2026-11-15.svg';
 assert.ok(read(svg).includes('NFC EAST TITLE ODDS'));
 assert.ok(read(svg).includes('70.9%'));
 assert.ok(read(svg).includes('17.5%'));
 const png=cp.execFileSync('python3',[path.join(root,'scripts/render-nfc-social.py'),svg],{maxBuffer:6*1024*1024});
 assert.ok(png.length>10000);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
 assert.ok(read('forecasting/nfc-east-2026.html').includes('/assets/social/og-nfc-east-title-2026-11-15.png'));
 assert.ok(read('scripts/firebase-overlay-release.cjs').includes('/forecasting/nfc-east-title-2026-11-15-post-sf.json'));
});

test('Guarded NFC East publisher explicitly allows only the two new postgame routes',()=>{
 const publisher=read('scripts/firebase-overlay-release.cjs');
 const start=publisher.lastIndexOf("  if (profileName === 'nfc-east-title-2026') {");
 const end=publisher.indexOf("  if (profileName === 'malik-beasley-forecast')",start);
 assert.ok(start>=0 && end>start);
 const guard=publisher.slice(start,end);
 assert.ok(guard.includes("'/forecasting/nfc-east-title-2026-11-15-post-sf.json'"));
 assert.ok(guard.includes("'/assets/social/og-nfc-east-title-2026-11-15.png'"));
 assert.ok(guard.includes("...RELEASE_PROFILES['nfc-east-title-2026'].overlayFiles"));
});
