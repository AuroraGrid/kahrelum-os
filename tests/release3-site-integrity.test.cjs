'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const txt=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(txt(p));

test('Nov 12 post-deadline scoreboard is published separately from the immutable Nov 9 FC1 lock',()=>{
 const outcome=json('nfl/deadline-reconciled-2026.json');
 assert.equal(outcome.schema,'KAHRELUM_NFL_2026_POSTDEADLINE_AUDIT_V1');
 assert.equal(outcome.status,'POST_DEADLINE_RECONCILED');
 assert.equal(outcome.sourceAuditDate,'2026-11-12');
 assert.equal(outcome.tradeCountInSeason,17);
 assert.equal(outcome.clubAnnouncedNov10Count,5);
 assert.equal(outcome.registerDatedNov10Count,7);
 assert.equal(outcome.fc1VolumeScoreStatus,'UNRESOLVED_DATE_BOUNDARY');
 assert.equal(outcome.fixedCohort.eligibleForecasts,123);
 assert.equal(outcome.fixedCohort.positiveTrades,8);
 assert.equal(outcome.fixedCohort.brierScore,0.077813821138);
 assert.ok(outcome.fixedCohort.allNoBrier<outcome.fixedCohort.brierScore);
 assert.equal(outcome.confirmedTrades.length,17);
 assert.equal(new Set(outcome.confirmedTrades.map(x=>x.player)).size,17);
 assert.ok(outcome.confirmedTrades.every(x=>x.sourceUrl?.startsWith('https://')));
 assert.match(txt('nfl/deadline-watch-2026.js'),/deadline-reconciled-2026\.json/);
 const original=json('research/nfl-2026-trade-deadline/official-forecasts/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json');
 assert.equal(original.model.pointForecast,6);assert.equal(original.scoring.outcome,null);
});

test('public NFL deadline view is archived, no fake ongoing checks or winner claim',()=>{
 const html=txt('nfl/deadline-watch-2026.html'),js=txt('nfl/deadline-watch-2026.js');
 assert.doesNotMatch(html,/DEADLINE WINDOW OPEN THROUGH/);
 assert.match(html,/DEADLINE CLOSED/);
 assert.match(html,/17 completed in-season/i);
 assert.match(html,/November 5.*historical|historical.*November 5/i);
 assert.match(html,/FC1.*unresolved|unresolved.*FC1/i);
 assert.match(js,/POST_DEADLINE_RECONCILED/);
 assert.match(js,/Last pre-deadline source check/);
 assert.match(js,/UNRESOLVED_DATE_BOUNDARY/);
 assert.doesNotMatch(js,/official\.status!=='DEADLINE_STILL_OPEN'/);
 assert.match(txt('nfl/weekly-brief.html'),/archived|historical/i);
});

test('buyer inquiry is reviewable, accessible, and never masquerades as a sent submission',()=>{
 const html=txt('pilot.html');
 for(const t of ['pilotInquiry','copyInquiry','pilotFeedback','inquiryPreview','contactEmail','contactName'])assert.ok(html.includes(t),t);
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/mailto:hasan@kahrelum\.com/);
 assert.match(html,/not (?:automatically )?sent|not sent/i);
 assert.doesNotMatch(html,/fetch\(['"]https:\/\/[^'"]+\/(?:form|submit|collect)/);
 assert.match(html,/\$750 Fit Check/);
 assert.match(html,/\$2,500 Founding Pilot/);
});

test('article metadata and structured data are dated, accurate and do not invent businesses',()=>{
 for(const p of ['insights/hegseth-war-powers-fact-check.html','insights/nvidia-megaspeed-chip-custody.html','investigations/chip-01.html']){
   const html=txt(p);
   assert.match(html,/application\/ld\+json/);
   assert.match(html,/"@type":"Article"/);
   assert.match(html,/"dateModified":"2026-11-12"/);
   assert.doesNotMatch(html,/"@type":"LocalBusiness"/);
   const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'';
   assert.ok(description.length>=70&&description.length<=165,p+': '+description.length);
 }
});

test('Release 3 adds accurate dated sitemap routes and isolates Firebase writes',()=>{
 const pub=txt('scripts/firebase-overlay-release.cjs');
 const flow=txt('.github/workflows/firebase-scoped-release.yml');
 const prof=pub.match(/  'release3-verified': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(prof,'missing scoped Release 3 profile');
 assert.match(prof,/includeHomepage: false/);
 assert.match(prof,/sitemapLastmod:/);
 assert.doesNotMatch(prof,/\.png|candidate-portraits|source-observations|forecast-ledger\.json/);
 assert.match(pub,/Release 3 attempted to change unrelated live Firebase files/);
 for(const x of ['release3-verified','nfl/deadline-reconciled-2026.json','pilot.html','site-shell.css'])assert.ok(flow.includes(x),x);
});

test('mobile site shell has constrained narrow-screen layout and keyboard focus visibility',()=>{
 const css=txt('site-shell.css');
 assert.match(css,/@media\s*\(max-width:\s*480px\)/);
 assert.match(css, /\.site-mobile-panel/);
 assert.match(css,/focus-visible/);
 assert.match(css,/overflow-wrap|overflow-x/);
});
