'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const {patchNvidiaDetailPage}=require('../scripts/investigations-text-refresh.cjs');
const pages=['investigations/chip-01.html','insights/nvidia-megaspeed-chip-custody.html'];
const marker='<section id="chip01-nov17-doj-statement"';

test('both CHIP-01 articles preserve the November 10 forecast and attach the November 17 US government statement',()=>{
 for(const file of pages){
  const html=read(file);
  const index=html.indexOf(marker);
  assert.ok(index>=0,'separate dated section missing: '+file);
  assert.equal(html.indexOf(marker,index+1),-1,'duplicate dated section');
  const section=html.slice(index,html.indexOf('</section>',index)+10);
  for(const term of ['November 17, 2026','2024','May 2025','June 2025','no-sell','BIS','DOJ','not a finding of guilt','Megaspeed']){
   assert.ok(section.includes(term),term+' missing from '+file);
  }
  assert.ok(section.includes('https://www.justice.gov/opa/pr/joint-statement-department-commerce-and-department-justice-megaspeed-investigation'));
  for(const term of ['id="chip01-nov12-leadership"','85%','10%','5%','February 10, 2027'])
   assert.ok(html.includes(term),'prior record lost: '+term);
 }
 const memo=read('research/chip-01/2026-11-17-doj-bis-statement.md');
 assert.match(memo,/not.*(?:charge|guilt|conviction)/i);
 assert.ok(memo.includes('2026-11-17'));
});

test('live CHIP-01 patch appends only Nov17 section, is idempotent, and preserves verified live-only text',()=>{
 for(const file of pages){
  const full=read(file).replace(/\r\n/g,'\n');
  const section=full.match(/<section id="chip01-nov17-doj-statement"[^>]*>[\s\S]*?<\/section>\n/)?.[0];
  assert.ok(section,file);
  const stale=full.replace(section,'');
  const live=stale.replace('</main>','<!-- LIVE-ONLY-PRESERVED-20261117 --></main>');
  const result=patchNvidiaDetailPage(live,full,file);
  assert.ok(result.includes('LIVE-ONLY-PRESERVED-20261117'));
  assert.ok(result.includes(section));
  assert.equal(result.replace(section,''),live);
  assert.equal(patchNvidiaDetailPage(result,full,file),result,'no repeat inserts');
  const broken=result.replace('not a finding of guilt','confirmed guilt');
  assert.throws(()=>patchNvidiaDetailPage(broken,full,file),/conflicting|modified|mismatch|changed/i);
 }
});

test('automatic CHIP-01 text update is scope-guarded without article or social republishing',()=>{
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 const i=workflow.indexOf("elif grep -Fqx 'investigations/chip-01.html' <<< \"$changed\"; then");
 assert.ok(i>=0,'exact CHIP-01 release gate');
 const j=workflow.indexOf('profiles="investigations-text-only"',i);
 assert.ok(j>i,'text-only profile selection');
 const part=workflow.slice(i,j);
 for(const allowed of ['investigations/chip-01.html','insights/nvidia-megaspeed-chip-custody.html','research/chip-01/2026-11-17-doj-bis-statement.md','tests/chip01-nov17-doj.test.cjs','scripts/investigations-text-refresh.cjs'])
  assert.ok(part.includes(allowed),'missing bounded path '+allowed);
 assert.ok(!part.includes('assets/social/*'),'no broad social-art release');
});
