'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {patchNvidiaDetailPage}=require('../scripts/investigations-text-refresh.cjs');
const caseRoute='investigations/chip-01.html',insightRoute='insights/nvidia-megaspeed-chip-custody.html';

test('Nvidia Nov12 CEO succession announcement is dated and attributed across both detailed research pages',()=>{
  for(const file of [caseRoute,insightRoute]){
    const html=read(file);
    assert.match(html,/id="chip01-nov12-leadership"/,file);
    assert.match(html,/Colette Kress.*interim (?:chief executive|CEO)/i,file);
    assert.match(html,/Huang.*(?:leav|stepp|resign).*(?:CEO|board)|Huang.*(?:CEO|board).*(?:leav|stepp|resign)/i,file);
    assert.match(html,/reuters\.com\/business\/retail-consumer\/nvidia-ceo-jensen-huang-step-down-big-blow-ai-boom-2026-11-12/,file);
    assert.match(html,/2026-11-12-ceo-transition-addendum\.md/,file);
    assert.match(html,/February 10, 2027/,file);
    assert.match(html,/unresolved|not final|not yet scorable|unscored/i,file);
  }
  const source=read('research/chip-01/2026-11-12-ceo-transition-addendum.md');
  assert.match(source,/public announcement.*Reuters|Reuters.*announcement/i);
  assert.match(source,/not.*(?:verify|authenticated).*SEC|SEC.*not.*(?:verify|authenticated)/i);
  assert.match(source,/voluntar(y|ily).*involuntar(y|ily)/i);
  const original=JSON.parse(read('research/chip-01/forecast-2026-11-10.json'));
  assert.deepEqual(original.outcomes.map(x=>x.probability),[0.85,0.10,0.05]);
});

test('Index pages update the old unconfirmed note with the subsequently reported CEO transition',()=>{
 const investigations=read('investigations.html');
 const insights=read('insights.html');
 assert.match(investigations,/Huang.*(?:stepping down|leaving).*(?:board|CEO)|Huang.*(?:CEO|board).*(?:stepping down|leaving)/i);
 assert.match(investigations,/Colette Kress/);
 assert.match(insights,/Huang.*(?:stepping down|leaving)|Huang.*resign/i);
 assert.match(insights,/Colette Kress/);
 assert.doesNotMatch(investigations,/a resignation or Colette Kress interim appointment was <strong>not independently confirmed<\/strong>/i);
 assert.doesNotMatch(insights,/do not establish that Jensen Huang resigned/i);
});

test('Scoped text publisher reads and patches four current live HTML pages without any artwork',()=>{
 const script=read('scripts/firebase-overlay-release.cjs');
 const profile=script.match(/  'investigations-text-only': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(profile);
 assert.match(profile,/overlayFiles: \[\]/);
 assert.match(profile,/includeHomepage: false/);
 assert.match(script,/patchNvidiaDetailPage/);
 for(const p of ["/investigations/chip-01.html","/insights/nvidia-megaspeed-chip-custody.html"]){
   assert.ok(script.includes(p),p);
 }
 const ci=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(ci,/investigations\/chip-01\.html\|insights\/nvidia-megaspeed-chip-custody\.html/);
 assert.match(ci,/selections\+=\(investigations-text-only\)/);
});

test('Live CHIP-01 detailed-page insertions are additive and preserve all old forecast numbers and metadata',()=>{
 for(const file of [caseRoute,insightRoute]){
   const canonical=read(file);
   const section=canonical.match(/<section id="chip01-nov12-leadership"[^>]*>[\s\S]*?<\/section>\n/)?.[0];
   assert.ok(section,file);
   const stale=canonical.replace(section,'').replace('</main>','<!-- VERIFIED-LIVE-ONLY-TAIL --></main>');
   const revised=patchNvidiaDetailPage(stale,canonical,file);
   assert.match(revised,/VERIFIED-LIVE-ONLY-TAIL/);
   assert.ok(revised.includes(section));
   assert.equal(revised.replace(section,''),stale,'Only the new dated section is inserted');
   assert.equal(patchNvidiaDetailPage(revised,canonical,file),revised,'Idempotent same-source releases');
   assert.equal(stale.split('</head>')[0],revised.split('</head>')[0]);
   for(const p of ['85%','10%','5%'])assert.ok(revised.includes(p));
 }
});
