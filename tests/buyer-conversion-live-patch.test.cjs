'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function historicalFixture(route){
 let html=read(route==='assurance'?'assurance.html':'pilot.html');
 if(route==='assurance'){
   html=html.replace('AI Agent Decision Audits &amp; Assurance | KAHRELUM','AI &amp; Agent Assurance | KAHRELUM');
   html=html.replaceAll('Independent audits of historical AI agent decisions: check evidence, approval and escalation rules. $750 Fit Check for three authorized cases; no production access.','Independent historical AI decision, agent risk, evidence and authority audits.');
   html=html.replace(/<section id="example-decision-audits"[\s\S]*?<\/section>/,'');
 }else{
   html=html.replace('AI Decision Audit: $750 Fit Check | KAHRELUM','Historical AI Decision Review — KAHRELUM Pilot');
   html=html.replaceAll('Review three authorized historical AI decisions for $750. Trace evidence, policy and escalation gaps in a fixed-scope Fit Check. No production access.','Fixed-scope, operator-assisted historical AI decision review.');
   html=html.replace(/<meta (?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/g,'');
   html=html.replace(/<section id="fit-check-process"[\s\S]*?<\/section>/,'');
   html=html.replace('<a href="#request">Prepare a $750 Fit Check inquiry (you send)</a>','<a href="#request">Outline one workflow</a>');
 }
 return html;
}
test('live-only conversion update is source-truthful and repeatable for both routes',()=>{
 const {patchBuyerConversion}=require('../scripts/buyer-conversion-20261112.cjs');
 for(const route of ['assurance','pilot']){
   const source=read(route+'.html'),historical=historicalFixture(route);
   const patched=patchBuyerConversion(historical,source,'/'+route);
   assert.equal(patchBuyerConversion(patched,source,'/'+route),patched);
   assert.match(patched,new RegExp('id="'+(route==='pilot'?'fit-check-process':'example-decision-audits')+'"'));
   assert.ok(patched.includes(source.match(/<title>.*?<\/title>/)[0]));
   assert.ok(patched.includes(source.match(/<meta name="description" content="[^"]+">/)[0]));
   assert.equal((patched.match(/property="og:image"/g)||[]).length,1);
   assert.ok(patched.includes(route==='pilot'?'og-pilot.png':'og-assurance.png'));
   assert.match(patched,/No production access|No live third-party system access/i);
   assert.ok(patched.includes('href="/pilot#request"')||patched.includes('id="pilotInquiry"'));
 }
});

test('source surgical patch preserves unrelated original body and synthetic disclosures',()=>{
 const {patchBuyerConversion}=require('../scripts/buyer-conversion-20261112.cjs');
 for(const route of ['assurance','pilot']){
   const source=read(route+'.html'), historical=historicalFixture(route);
   const page=historical.replace('<main','<p id="test-preserved">Original live source evidence survives untouched.</p><main');
   const patched=patchBuyerConversion(page,source,'/'+route);
   assert.ok(patched.includes('<p id="test-preserved">Original live source evidence survives untouched.</p>'));
   assert.ok(patched.includes('not customer cases')||patched.includes('synthetic'));
 }
});

test('malformed source, changed canonical, unsupported title or conflicting existing section block promotion',()=>{
 const {patchBuyerConversion}=require('../scripts/buyer-conversion-20261112.cjs');
 const source=read('assurance.html'),old=historicalFixture('assurance');
 assert.throws(()=>patchBuyerConversion(old.replace('https://kahrelum.com/assurance','https://example.com/assurance'),source,'/assurance'),/canonical/i);
 assert.throws(()=>patchBuyerConversion(old.replace('<title>AI &amp; Agent Assurance | KAHRELUM</title>','<title>Unexpected</title>'),source,'/assurance'),/title/i);
 assert.throws(()=>patchBuyerConversion(old.replace('<section><p class="eyebrow">Buying & data handling','<section id="example-decision-audits"><h2>Conflicting third-party text</h2></section><section><p class="eyebrow">Buying & data handling'),source,'/assurance'),/conflict/i);
 assert.throws(()=>patchBuyerConversion(old,source,'/forecasting'),/route/i);
});

test('published pilot verification accepts the actual manual-send text and rejects a missing disclosure',()=>{
 const {patchBuyerConversion}=require('../scripts/buyer-conversion-20261112.cjs');
 const source=read('pilot.html');
 assert.match(source,/does not automatically transmit or store your entry/);
 const damaged=source.replace('does not automatically transmit or store your entry','might transmit information')
   .replace('not automatically sent','possibly sent');
 assert.throws(()=>patchBuyerConversion(damaged,source,'/pilot'),/manual.send|transmit|inquiry/i);
 const publisher=read('scripts/firebase-overlay-release.cjs');
 assert.match(publisher,/does not automatically transmit\|not automatically sent/);
});
