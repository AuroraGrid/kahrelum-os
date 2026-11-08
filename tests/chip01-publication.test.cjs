'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
test('CHIP-01 public pages link primary sources and explicitly keep contested allegations unproven',()=>{
 const caseHtml=read('investigations/chip-01.html');
 const insight=read('insights/nvidia-megaspeed-chip-custody.html');
 const inv=read('investigations.html');
 const listing=read('insights.html');
 assert.match(caseHtml,/CHIP-01/);assert.match(caseHtml,/Case status: OPEN/);
 assert.match(caseHtml,/not established|not a finding|no criminal violation/i);
 for(const phrase of ['Singapore','Nvidia','Megaspeed','BIS','House','DOJ'])assert.ok(caseHtml.includes(phrase)||insight.includes(phrase),phrase);
 assert.match(caseHtml,/mha\.gov\.sg/);
 assert.match(insight,/foreignaffairs\.house\.gov/);
 assert.match(insight,/Underlying memorandum|underlying memorandum/i);
 assert.match(inv,/href="\/investigations\/chip-01"/);
 assert.match(listing,/href="\/insights\/nvidia-megaspeed-chip-custody"/);
 // The old 12 fully documented cases remain immutable, distinct from this new featured case.
 assert.equal([...inv.matchAll(/data-case-id="([A-Z]+-[0-9]+)"/g)].length,12);
 assert.equal((caseHtml.match(/<main\b/g)||[]).length,1);
 assert.equal((insight.match(/<main\b/g)||[]).length,1);
});
test('CHIP-01 and Insight use different accessible 1200x630 PNG OpenGraph assets',()=>{
 const {buildChip01SocialArtifacts}=require('../scripts/chip01-social.cjs');
 const imgs=buildChip01SocialArtifacts();
 assert.equal(imgs.length,2);
 assert.equal(new Set(imgs.map(x=>x.path)).size,2);
 const hashes=new Set();
 for(const row of imgs){
  assert.equal(row.image.subarray(1,4).toString('ascii'),'PNG');
  assert.equal(row.image.readUInt32BE(16),1200);
  assert.equal(row.image.readUInt32BE(20),630);
  assert.ok(row.image.length>4000);
  hashes.add(crypto.createHash('sha256').update(row.image).digest('hex'));
 }
 assert.equal(hashes.size,2);
 for(const [file,img] of [['investigations/chip-01.html',imgs[0]],['insights/nvidia-megaspeed-chip-custody.html',imgs[1]]]){
  const html=read(file);
  assert.match(html,/twitter:card" content="summary_large_image"/);
  for(const name of ['og:image','og:image:secure_url']){
   assert.ok(html.includes('property="'+name+'" content="https://kahrelum.com'+img.path+'"'));
  }
  assert.ok(html.includes('name="twitter:image" content="https://kahrelum.com'+img.path+'"'));
  assert.match(html,/og:image:alt/);
 }
});
test('CHIP-01 Firebase publish scope has safe preview, promotion and exact readback',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs');
 const yaml=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(pub,/'chip01-publication': \{/);
 assert.match(pub,/buildChip01SocialArtifacts\(/);
 assert.match(pub,/CHIP-01 publication attempted to change an unrelated live Firebase path/);
 for(const p of ['/investigations/chip-01','/insights/nvidia-megaspeed-chip-custody']){
  assert.ok(pub.includes(p),p);
 }
 assert.match(yaml,/chip01-publication/);
 for(const value of ['--plan --profile','--preview --profile','--promote --profile','KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON']) assert.ok(yaml.includes(value),value);
});
