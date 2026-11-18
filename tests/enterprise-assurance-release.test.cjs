'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const {patchEnterpriseAssurance}=require('../scripts/enterprise-assurance-release.cjs');

test('three live buyer pages accept a surgical positioning update without rewriting unrelated content',()=>{
  for(const [page,route] of [['index.html','/'],['assurance.html','/assurance'],['pilot.html','/pilot']]){
    const source=read(page);
    let original=source;
    if(route==='/'){
      original=original.replace('<h1>Your AI made a decision. Can the evidence defend it?</h1>','<h1>Decision intelligence that has to earn its answer.</h1>');
      original=original.replace(/<p class="lede">KAHRELUM independently reviews[^<]*<\/p>/,'<p class="lede">KAHRELUM OS is an evidence-to-decision system for forecasting, research and high-stakes analysis. It separates fact from inference, attacks its own conclusions, and is designed to block rather than manufacture certainty when the evidence does not support an answer.</p>');
      original=original.replace('h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.02;margin:0 0 1rem;max-width:19ch}','h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:.98;margin:0 0 1rem;max-width:12ch}');
      original=original.replace(/<p><a class="cta primary" href="\/enterprise-ai-evaluation">[\s\S]*?<\/p>/,'<p><a class="cta primary" href="https://kahrelum.com/pilot#request">Review packages & start an inquiry</a><a class="cta" href="https://github.com/AuroraGrid/kahrelum-os/blob/main/evidence/EXTERNAL_AUDIT_SUMMARY.md">Review the Evidence</a></p>');
      original=original.replace(/<section id="commercial-workflows">[\s\S]*?<\/section>\s*/, '');
    }else if(route==='/assurance'){
      original=original.replace('<h1>Can the evidence defend an AI-assisted decision?</h1>','<h1>Before an AI agent acts, test what justified it.</h1>');
      original=original.replace(/<section id="sector-proof">[\s\S]*?<\/section>/, '');
    }else{
      original=original.replace(/<section id="enterprise-samples">[\s\S]*?<\/section>/, '');
    }
    const patched=patchEnterpriseAssurance(original,source,route);
    assert.equal(patched,source,page);
    assert.equal(patchEnterpriseAssurance(patched,source,route),source,page+' idempotent');
    assert.throws(()=>patchEnterpriseAssurance(original.replace('$750','$500'),source,route),/pricing/i);
    assert.throws(()=>patchEnterpriseAssurance('unexpected unrelated page',source,route),/HOLD|missing/i);
  }
});

test('new scoped publisher is guarded, includes page and JSON samples, and excludes research ledgers',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs'),workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(pub,/'enterprise-assurance':\s*\{/);
 assert.match(pub,/patchEnterpriseAssurance\(liveHtml, sourceHtml, route\)/);
 assert.match(pub,/Enterprise assurance attempted to change unrelated live Firebase files/);
 for(const item of ['enterprise-ai-evaluation.html','decision-assurance-samples.html','data/assurance/synthetic-reviews-v0.1.json'])assert.ok(pub.includes(item));
 assert.match(workflow,/profiles="enterprise-assurance"/);
 assert.match(workflow,/enterprise-assurance/);
 assert.doesNotMatch(workflow,/firebase deploy --only hosting/);
});
