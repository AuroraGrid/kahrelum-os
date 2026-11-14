'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('AIR-02 is a separate dated case with linked evidence, uncertainty and correction trail',()=>{
 const html=read('investigations/air-02.html');
 assert.match(html,/AIR-02/);assert.match(html,/November 13, 2026/);
 for(const phrase of ['ground stop','communications','UNKNOWN','cybersecurity','cause','correction','Source cutoff','Reuters','Associated Press','FAA']) assert.match(html,new RegExp(phrase,'i'));
 assert.match(html,/not established|unverified/i);
 assert.match(html,/https:\/\/www\.faa\.gov/);
 assert.match(html,/apnews\.com/);assert.match(html,/reuters\.com/);
 assert.match(html,/og-air02-v1\.png/);assert.match(html,/1200/);assert.match(html,/630/);
 assert.match(read('investigations.html'),/href="\/investigations\/air-02"/);
 const original=JSON.parse(read('tests/investigations-preserved-cards.json'));
 const index=read('investigations.html');
 for(const [id,hash] of Object.entries(original)){
  const card=index.match(new RegExp('<article class="case-record"[^>]*data-case-id="'+id+'"[\\s\\S]*?<\\/article>'));
  if(card)assert.equal(crypto.createHash('sha256').update(card[0].replace(/\r\n/g,'\n')).digest('hex'),hash,id);
 }
 assert.match(index,/data-investigations-release="2026-11-02\.1"/);
 assert.match(index,/12<\/strong><span>Public case records/);
});

test('AIR-02 has its own 1200x630 PNG and matching article metadata',()=>{
 const img=fs.readFileSync(path.join(root,'assets/social/og-air02-v1.png'));
 assert.equal(img.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(img.readUInt32BE(16),1200);assert.equal(img.readUInt32BE(20),630);
 assert.ok(img.length>4000);
 const html=read('investigations/air-02.html');
 for(const prop of ['og:image','og:image:secure_url'])assert.ok(html.includes('property="'+prop+'" content="https://kahrelum.com/assets/social/og-air02-v1.png"'));
 assert.ok(html.includes('name="twitter:image" content="https://kahrelum.com/assets/social/og-air02-v1.png"'));
});

test('AIR-02 Firebase profile admits exactly its page, art, live index and sitemap',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs');
 const profile=pub.match(/'air02-publication': \{([\s\S]*?)\n  \},/);
 assert.ok(profile);
 for(const item of ['investigations/air-02.html','assets/social/og-air02-v1.png'])assert.ok(profile[1].includes(item));
 assert.match(profile[1],/liveTransformRoutes/);assert.match(profile[1],/sitemapRoutes: \['\/investigations\/air-02'\]/);
 assert.match(pub,/AIR-02 publication attempted to change an unrelated live Firebase path/);
 assert.match(pub,/verifyAir02IndexPatch/);
 const wf=read('.github/workflows/firebase-scoped-release.yml');
 const ps=read('scripts/deploy-unified-firebase.ps1');
 assert.match(wf,/air02-publication/);assert.match(ps,/air02-publication/);
});


test('AIR-02 addendum preserves the entire original cutoff record',()=>{
 const html=read('investigations/air-02.html').replace(/\r\n/g,'\n');
 const baseline=html.replace(/<section id="update-20261114"[\s\S]*?<\/section>\s*(?=<\/main>)/,'');
 assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),'a56c6dcd137f9d734f4e736af666c14d57e6d593131f7deebacc99a98f19dda9');
 assert.match(html,/04:27 UTC/);
 assert.match(html,/official preliminary explanation/);
 assert.match(html,/AIR-02 remains OPEN/);
 assert.match(html,/adv_date=11142026&amp;advn=5/);
});
