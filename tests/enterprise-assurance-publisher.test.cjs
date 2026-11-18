'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');

test('surgical source-to-live patch preserves unrelated HTML and is repeatable',()=>{
 const {patchAssuranceBuyerPage,OLD_HOME_HERO,OLD_ASSURANCE_ACTIONS,OLD_PILOT_ACTIONS}=require('../scripts/assurance-samples-publication.cjs');
 const sourceHome=read('index.html');
 const newHomeHero=sourceHome.match(/<p class="eyebrow">Independent AI decision assurance[\s\S]*?(?=<span class="release">)/)?.[0];
 const newSection=sourceHome.match(/<section id="commercial-assurance-first">[\s\S]*?<\/section>/)?.[0];
 assert.ok(newHomeHero&&newSection);
 const oldHome=sourceHome.replace(newHomeHero,OLD_HOME_HERO).replace(newSection,'');
 const patched=patchAssuranceBuyerPage('/',oldHome,sourceHome);
 assert.ok(patched.includes('Your AI made a decision. Can the evidence defend it?'));
 assert.ok(patched.includes('id="commercial-assurance-first"'));
 assert.ok(patched.includes('<section id="divisions">'));
 assert.equal(patchAssuranceBuyerPage('/',patched,sourceHome),patched);

 const sourceAssurance=read('assurance.html'), newAssurance=sourceAssurance.match(/<div class="buttons"><a class="btn primary" href="\/pilot#request">[\s\S]*?<\/div>/)?.[0];
 assert.ok(newAssurance);
 const oldAssurance=sourceAssurance.replace(newAssurance,OLD_ASSURANCE_ACTIONS);
 const patchedAssurance=patchAssuranceBuyerPage('/assurance',oldAssurance,sourceAssurance);
 assert.ok(patchedAssurance.includes('href="/decision-assurance-samples"'));
 assert.equal(patchAssuranceBuyerPage('/assurance',patchedAssurance,sourceAssurance),patchedAssurance);

 const sourcePilot=read('pilot.html'),newPilot=sourcePilot.match(/<div class="pilot-actions">[\s\S]*?<\/div>/)?.[0];
 assert.ok(newPilot);
 const oldPilot=sourcePilot.replace(newPilot,OLD_PILOT_ACTIONS);
 const patchedPilot=patchAssuranceBuyerPage('/pilot',oldPilot,sourcePilot);
 assert.ok(patchedPilot.includes('href="/decision-assurance-samples"'));
 assert.ok(patchedPilot.includes('id="pilotInquiry"'));
 assert.equal(patchAssuranceBuyerPage('/pilot',patchedPilot,sourcePilot),patchedPilot);

 assert.throws(()=>patchAssuranceBuyerPage('/', '<html>unexpected current page</html>',sourceHome),/refus|missing|unexpected/i);
 assert.throws(()=>patchAssuranceBuyerPage('/other','<html></html>',sourceHome),/unsupported/i);
});

test('Firebase enterprise gallery overlay has explicit static files, homepage HTML patch, and exact post-promote readback',()=>{
 const src=read('scripts/firebase-overlay-release.cjs');
 const work=read('.github/workflows/firebase-scoped-release.yml');
 const block=src.match(/'enterprise-assurance-gallery':\s*\{([\s\S]*?)\n  \},/)?.[1]||'';
 for(const key of ['decision-assurance-samples.html','data/assurance/synthetic-reviews-v0.1.json','llms.txt'])assert.ok(block.includes(key),key);
 assert.match(src,/patchAssuranceBuyerPage\(route, liveHtml, sourceHtml\)/);
 assert.match(src,/Enterprise assurance gallery attempted to change unrelated live Firebase files/);
 assert.match(src,/Enterprise assurance gallery production readback failed/);
 assert.match(work,/profiles="enterprise-assurance-gallery"/);
 assert.match(work,/enterprise-assurance-gallery/);
 assert.doesNotMatch(work,/firebase deploy --only hosting/i);
});
