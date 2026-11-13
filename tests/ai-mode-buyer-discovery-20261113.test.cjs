'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const ID='buyer-intent-guide-20261113';
const sectionRE=new RegExp('<section id="'+ID+'"[^>]*>[\\s\\S]*?<\\/section>');

test('buyer-guide text answers an unbranded small-business need without overclaiming',()=>{
 for(const page of ['assurance.html','pilot.html']){
  const html=read(page);
  assert.equal((html.match(new RegExp('id="'+ID+'"','g'))||[]).length,1,page);
  assert.match(html,/three historical AI-assisted business decisions|three past AI-assisted decisions/i);
  assert.match(html,/two business days/i);
  assert.match(html,/\$750/);
  assert.match(html,/operator-assisted/i);
  assert.match(html,/certification|certified|accredit/i);
  assert.ok(html.includes('href="/pilot#request"')||html.includes('href="#request"'));
 }
 assert.match(read('assurance.html'),/monitoring platforms|monitoring software/i);
 assert.match(read('assurance.html'),/no (?:independently verified )?client results|not customer cases|no client results claimed/i);
});

test('buyer-guidance is safely patched into verified legacy live pages and remains idempotent',()=>{
 const {patchBuyerConversion}=require('../scripts/buyer-conversion-20261112.cjs');
 for(const route of ['assurance','pilot']){
  const source=read(route+'.html');
  assert.match(source,sectionRE);
  const legacy=source.replace(sectionRE,'');
  const patched=patchBuyerConversion(legacy,source,'/'+route);
  assert.match(patched,sectionRE);
  assert.equal(patchBuyerConversion(patched,source,'/'+route),patched);
  assert.match(patched,/mailto:hasan@kahrelum.com/);
  if(route==='pilot')assert.match(patched,/does not automatically transmit|not automatically sent/i);
  else assert.match(patched,/does not request confidential|not customer cases/i);
  const changed=legacy.replace(sectionRE,'');
  assert.throws(()=>patchBuyerConversion(changed.replace(
    route==='assurance'?'<section id="example-decision-audits"':'<section id="fit-check-process"',
    '<section id="'+ID+'"><p>Unapproved text</p></section>'+(route==='assurance'?'<section id="example-decision-audits"':'<section id="fit-check-process"')
  ),source,'/'+route),/conflict|Buyer|section/i);
 }
});

test('GitHub publisher scopes buyer-conversion release to exact buyer files',()=>{
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(workflow,/buyer-conversion/);
 assert.match(workflow,/grep -Fqx 'assurance\.html'/);
 assert.match(workflow,/profiles="buyer-conversion"/);
 const publisher=read('scripts/firebase-overlay-release.cjs');
 assert.match(publisher,/'buyer-conversion':/);
 assert.match(publisher,/\/assurance\.html.*\/pilot\.html/);
});

test('automatic buyer-conversion release accepts audited publisher script changes, not unrelated files',()=>{
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 const start=workflow.indexOf("elif grep -Fqx 'assurance.html'");
 const end=workflow.indexOf('profiles="buyer-conversion"',start);
 assert.ok(start>=0&&end>start,'Buyer release routing must exist');
 const buyer=workflow.slice(start,end+32);
 assert.ok(buyer.includes('scripts/firebase-overlay-release.cjs'));
 assert.ok(buyer.includes('tests/ai-mode-buyer-discovery-20261113.test.cjs'));
 assert.match(buyer,/Buyer-conversion release includes unrelated path/);
});
