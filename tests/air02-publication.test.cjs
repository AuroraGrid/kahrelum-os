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
 const historic=html.replace(/\\n<section id="faa-clarification-20261117"[\\s\\S]*?<\\/section>/,'').replace('<meta property="article:modified_time" content="2026-11-17">','<meta property="article:modified_time" content="2026-11-13">');
 const withoutV12=historic.replace(/<section id="reconciliation-20261114"[\\s\\S]*?<\\/section>\\n(?=<\\/main>)/,'');
 const baseline=withoutV12.replace(/<section id="update-20261114"[\s\S]*?<\/section>\s*(?=<\/main>)/,'');
 assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),'a56c6dcd137f9d734f4e736af666c14d57e6d593131f7deebacc99a98f19dda9');
 assert.match(html,/04:27 UTC/);
 assert.match(html,/official preliminary explanation/);
 assert.match(html,/AIR-02 remains OPEN/);
 assert.match(html,/adv_date=11142026&amp;advn=5/);
});

test('AIR-02 v1.2 source reconciliation is dated, linked and explicitly bounds raw-feed claims',()=>{
 const html=read('investigations/air-02.html');
 const section=html.match(/<section id="reconciliation-20261114"[\s\S]*?<\/section>/);
 assert.ok(section,'separate versioned reconciliation section must exist');
 for(const phrase of ['November 14, 2026','Advisory 111','Advisory 120','Advisory 005','OpenSky','adsb.lol','21 en-route centers','not independently certified','unverified','root-cause']) assert.match(section[0],new RegExp(phrase,'i'));
 assert.match(section[0],/evidence\/AIR-02_OSINT_RECONCILIATION_2026-11-14\.md/);
 assert.match(section[0],/not the 22 claimed/);
 assert.match(section[0],/NWS|National Weather Service/);
 const ledger=read('evidence/AIR-02_OSINT_RECONCILIATION_2026-11-14.md');
 for(const phrase of ['REPORTED OSINT','NOT YET REPRODUCED','3:36 p.m.','1,083','1,035','990','199/208','Kp=0','not independently established','preserve'])assert.match(ledger,new RegExp(phrase,'i'));
});

test('AIR-02 November 17 addendum cites the new FAA primary Q&A without rewriting the November 13 cutoff',()=>{
 const html=read('investigations/air-02.html');
 const section=html.match(/<section id="faa-clarification-20261117"[\s\S]*?<\/section>/)?.[0];
 assert.ok(section,'dated later-evidence section');
 for(const phrase of ['Added November 17, 2026','November 15','1,000','Amarillo','El Dorado','L3Harris','17 of 22','12,462','no indication','root cause remains open','not an independent forensic conclusion']){
  assert.ok(section.includes(phrase),'missing source-bound detail: '+phrase);
 }
 assert.ok(section.includes('https://www.faa.gov/newsroom/nationwide-ground-stop-questions-and-answers'));
 assert.ok(section.includes('https://www.transportation.gov/briefing-room/icymi-us-transportation-secretary-sean-p-duffy-provides-update-restoration-airspace'));
 assert.ok(html.includes('id="reconciliation-20261114"'),'original November 14 analysis retained');
});
