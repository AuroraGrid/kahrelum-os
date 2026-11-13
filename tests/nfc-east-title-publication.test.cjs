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
 for(const label of ['Giants 66.4%','Cowboys 23.4%','Commanders','Eagles','OPEN · UNSCORED','EXPERIMENTAL MODEL','2026-11-13T04:33:38Z','Post-game update ledger','d29ffcc02433efe3bd184865bd15d075fcfce7de']) assert.ok(page.includes(label),label);
 assert.ok(page.includes('<link rel="canonical" href="https://kahrelum.com/forecasting/nfc-east-2026">'));
 assert.ok(page.includes('property="og:image" content="https://kahrelum.com/assets/social/og-nfc-east-title-2026.png"'));
 assert.ok(page.includes('name="twitter:image" content="https://kahrelum.com/assets/social/og-nfc-east-title-2026.png"'));
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