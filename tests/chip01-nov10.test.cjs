'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('CHIP-01 Nov 10 public update preserves the Nov 8 baseline and shows all new independently sourced events',()=>{
 const a=read('investigations/chip-01.html');
 const b=read('insights/nvidia-megaspeed-chip-custody.html');
 const old=read('research/chip-01/evidence-record-2026-11-08.md');
 const log=read('research/chip-01/update-2026-11-10.md');
 assert.match(old,/\*\*Cutoff:\*\* 2026-11-08/);
 for(const html of [a,b]){
  assert.match(html,/November 10, 2026 update/);
  assert.match(html,/nvidianews\.nvidia\.com\/news\/statement-from-nvidia-board-of-directors/);
  assert.match(html,/nvidianews\.nvidia\.com\/news\/a-message-to-our-company/);
  assert.match(html,/mfa\.gov\.cn\/eng\/xw\/fyrbt\/202611/);
  assert.match(html,/class action/i);
  assert.match(html,/\$178\.67/);
  assert.match(html,/November 11/);
  assert.match(html,/November 17/);
  assert.match(html,/November 18/);
  assert.match(html,/unproven|not established/i);
 }
 assert.match(log,/Allegation is not proof/);
 assert.match(log,/No public finding/);
 assert.match(log,/FBI/);
});
test('CHIP-01 outcome forecasts are timestamp-custodied as new November 10 predictions with settlement and falsifiers',()=>{
 const src=JSON.parse(read('research/chip-01/forecast-2026-11-10.json'));
 assert.equal(src.case_id,'CHIP-01');
 assert.equal(src.issued_date,'2026-11-10');
 assert.equal(src.status,'new_public_forecast');
 assert.deepEqual(src.outcomes.map(x=>x.probability),[0.85,0.10,0.05]);
 assert.equal(src.outcomes.reduce((a,x)=>a+x.probability,0),1);
 assert.match(src.resolution.rules.join(' '),/February 10, 2027/);
 assert.ok(src.resolution.primary_source);
 assert.match(src.resolution.rules.join(" "),/EXCEPTION\/UNSCORED/);
 assert.ok(src.falsifiers.length>=3);
 for(const page of ['investigations/chip-01.html','insights/nvidia-megaspeed-chip-custody.html']){
  const html=read(page);
  for(const p of ['85%','10%','5%'])assert.ok(html.includes(p));
  assert.match(html,/not a backdated prediction|new forecast made after/i);
 }
});
test('CHIP-01 discovery pages announce an updated date without replacing original cases',()=>{
 assert.match(read('investigations.html'),/Open investigation · Updated November 12, 2026/);
 assert.match(read('insights.html'),/Counterintelligence · AI infrastructure · Updated Nov 12/);
 assert.equal([...read('investigations.html').matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].length,12);
});
