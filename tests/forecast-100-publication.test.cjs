'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const route='/forecasting/100-forecast-challenge';
const page='forecasting/100-forecast-challenge.html';
const feed='forecasting/100-forecast-v1.4.json';
const card='assets/social/og-100-forecast-challenge-v2.png';
const commit='1c0124e4431e941dfaf2cd57dac339f9b7488891';
const digest='952eb38e27ddb65cf46fcf6217c9dccc4e006e568f616ae418af85f449781481';

test('100-forecast public dataset is reproducible and honest about pending audit',()=>{
  const p=json(feed);
  assert.equal(p.version,'v1.4');
  assert.equal(p.commitSha,commit);
  assert.equal(p.jsonlSha256,digest);
  assert.equal(p.status,'PROSPECTIVE_CANDIDATE_AUDIT_HOLD');
  assert.equal(p.resolvedCount,0);
  assert.equal(p.brierScore,null);
  assert.equal(p.records.length,100);
  assert.equal(new Set(p.records.map(x=>x.id)).size,100);
  assert.deepEqual([...new Set(p.records.map(x=>x.domain))].sort(),['AI/Technology','Commercial/Business','Geopolitics','Markets/Macro','Sports'].sort());
  for(const domain of new Set(p.records.map(x=>x.domain)))assert.equal(p.records.filter(x=>x.domain===domain).length,20);
  assert.equal(p.records.filter(x=>x.horizon.startsWith('Short')).length,50);
  assert.equal(p.records.filter(x=>x.horizon.startsWith('Medium')).length,50);
  for(const rec of p.records){
    assert.ok(/^KAH-100-[A-Z]+-\d{3}-V14$/.test(rec.id),rec.id);
    assert.equal(rec.status,'RES_OPEN');
    assert.ok(rec.pYes>0&&rec.pYes<1,rec.id);
    assert.ok(Math.abs(rec.pYes+rec.pNo-1)<1e-9,rec.id);
    assert.ok(rec.question.length>35&&rec.resolutionCriteria.length>25,rec.id);
    assert.ok(!isNaN(Date.parse(rec.deadlineUtc)),rec.id);
    assert.ok(Array.isArray(rec.sourceUrls)&&rec.sourceUrls.length>=1,rec.id);
    assert.ok(rec.sourceUrls.every(x=>x.startsWith('https://')),rec.id);
  }
});

test('challenge page has correct canonical, dedicated raster share card, 100 indexed records and evidence limits',()=>{
  const html=read(page);
  assert.ok(html.includes('<link rel="canonical" href="https://kahrelum.com'+route+'">'));
  assert.ok(html.includes('<meta property="og:url" content="https://kahrelum.com'+route+'">'));
  assert.ok(html.includes('<meta property="og:image" content="https://kahrelum.com/'+card+'">'));
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('property="og:image:height" content="630"'));
  assert.equal((html.match(/data-forecast-id="/g)||[]).length,100);
  assert.ok(html.includes('Audit pending'));
  assert.ok(html.includes('Historical v1.0 timestamps unverified'));
  assert.ok(html.includes(commit));
  assert.ok(html.includes(digest));
  assert.ok(html.includes('Brier scores are not available'));
  assert.ok(html.includes('/forecasting/100-forecast-v1.4.json'));
  assert.ok(html.includes('id="forecastSearch"'));
  assert.ok(html.includes('id="forecastDomain"'));
  assert.ok(html.includes('id="forecastHorizon"'));
  assert.ok(html.includes('role="status"'));
  assert.doesNotMatch(html,/100 (?:certified|verified) (?:forecasts|locks)/i);
  const b=fs.readFileSync(path.join(root,card));
  assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(b.readUInt32BE(16),1200);
  assert.equal(b.readUInt32BE(20),630);
});

test('challenge is visible in Forecasting, sitemap and agent-readable discovery without claiming accuracy',()=>{
  for(const p of ['forecasting.html','sitemap.md','llms.txt','ai-discovery/forecasting.md']) {
    assert.ok(read(p).includes(route),p);
  }
  const md=read('ai-discovery/100-forecast-challenge.md');
  assert.ok(md.includes(route));assert.ok(md.includes(commit));
  assert.match(md,/HOLD|not certified/i);
  assert.ok(!md.includes('100 verified locks'));
});

test('Firebase preview-to-production profile is specific to the challenge and leaves homepage/other ledgers intact',()=>{
  const pub=read('scripts/firebase-overlay-release.cjs');
  const m=pub.match(/  'forecast-100-publication': \{([\s\S]*?)\n  \},/);
  assert.ok(m,'Dedicated scoped profile required');
  for(const needle of [page,feed,card,'forecasting.html','sitemap.md','llms.txt','ai-discovery/forecasting.md','ai-discovery/100-forecast-challenge.md',"includeHomepage: false","'/forecasting/100-forecast-challenge'"])assert.ok(m[1].includes(needle),needle);
  assert.doesNotMatch(m[1],/index\.html|nfl\/forecast-ledger|election\/house-forecast-lock|sourcegrid\.json/);
  assert.ok(pub.includes("profileName === 'forecast-100-publication'"),'the release must verify new page and discovery');
  const workflow=read('.github/workflows/firebase-scoped-release.yml');
  assert.ok(workflow.includes('forecast-100-publication'));
  assert.ok(workflow.includes(page));
  assert.ok(workflow.includes('tests/forecast-100-publication.test.cjs'));
  assert.doesNotMatch(workflow,/firebase deploy --only hosting/);
});