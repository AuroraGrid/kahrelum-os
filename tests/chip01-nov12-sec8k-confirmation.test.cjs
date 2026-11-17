'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['investigations/chip-01.html','insights/nvidia-megaspeed-chip-custody.html'];
const memo='research/chip-01/2026-11-12-sec8k-leadership-confirmation.md';

test('CHIP-01 November 12 filed 8-K correction reaches both public articles without retroactive outcome claims',()=>{
 for(const page of pages){
   const html=read(page);
   assert.match(html,/id="chip01-nov12-sec8k-confirmation"/,page);
   assert.match(html,/0001045810-26-000082/,page);
   assert.match(html,/November 11, 2026/,page);
   assert.match(html,/November 12, 2026/,page);
   assert.match(html,/Colette (?:M\. )?Kress/,page);
   assert.match(html,/Harvey (?:C\. )?Jones/,page);
   assert.match(html,/CFO/i,page);
   assert.match(html,/February 10, 2027/,page);
   assert.match(html,/not.*(?:evidence|proof).*espionage|does not prove espionage|not a finding of espionage/i,page);
   assert.match(html,/2026-11-12-sec8k-leadership-confirmation\.md/,page);
   assert.match(html,/id="chip01-nov12-leadership"/,page);
 }
});

test('append-only memo preserves direct/indirect source distinction and classifies the resignation mechanism as unresolved',()=>{
 const s=read(memo);
 for(const phrase of ['0001045810-26-000082','November 11, 2026','November 12, 2026','Colette','Harvey','8-K','Febru' ,'February 10, 2027','85%','10%','5%'])assert.ok(s.includes(phrase),phrase);
 assert.match(s,/full.*filing.*reproduced|reproduced.*8-K/i);
 assert.match(s,/direct SEC.*(not|unable|unavailable)|SEC endpoint.*(?:not|unavailable)/i);
 assert.match(s,/voluntary.*involuntary/i);
 assert.match(s,/not.*(?:score|scored)|unscored/i);
 assert.match(s,/not.*(prove|establish).*espionage/i);
 const original=JSON.parse(read('research/chip-01/forecast-2026-11-10.json'));
 assert.equal(original.issued_date,'2026-11-10');
 assert.deepEqual(original.outcomes.map(o=>o.probability),[0.85,0.10,0.05]);
 assert.equal(original.resolution.deadline,'2027-02-10T23:59:00-05:00');
});

test('discovery entries distinguish actual filed leadership change from a reported possibility',()=>{
 const overview=read('investigations.html');
 const insights=read('insights.html');
 assert.match(overview,/8-K/);
 assert.match(overview,/November 11, 2026/);
 assert.match(insights,/8-K/);
 assert.match(insights,/November 11, 2026/);
 assert.match(insights,/February 10, 2027|forecast.*(?:unscored|not scored)/i);
});

test('text-only Firebase pipeline scopes four pages and never republishes or edits graphics or forecast ledgers',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs');
 const wf=read('.github/workflows/firebase-scoped-release.yml');
 const helper=read('scripts/investigations-text-refresh.cjs');
 const block=pub.match(/  'investigations-text-only': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(block);
 assert.match(block,/overlayFiles: \[\]/);
 assert.match(block,/sitemapRoutes: \[\]/);
 assert.match(block,/includeHomepage: false/);
 assert.doesNotMatch(block,/\.png|\.jpg|candidate-portraits|forecast-2026-11-10/);
 for(const p of ['/investigations.html','/insights.html','/investigations/chip-01.html','/insights/nvidia-megaspeed-chip-custody.html'])assert.ok(pub.includes(p),p);
 assert.match(helper,/patchNvidiaDetailPage/);
 assert.match(wf,/investigations-text-only/);
});
