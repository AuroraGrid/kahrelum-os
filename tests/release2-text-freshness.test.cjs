'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {patchInvestigationOverview,patchInsightsIndex}=require('../scripts/investigations-text-refresh.cjs');

test('Release 2 names the November 12 CHIP-01 update without implying all twelve case cards were re-reviewed',()=>{
 const html=read('investigations.html');
 assert.match(html,/id="investigations-r2-desk-status"/);
 assert.match(html,/Open investigation · Updated November 12, 2026/);
 assert.match(html,/November 12.*Megaspeed.*BIS|November 12.*Megaspeed.*inspect/i);
 assert.match(html,/October 31(?:, 2026)? through November 2(?:, 2026)?|October 31.*November 2/i);
 assert.match(html,/not (?:an? )?(?:new|fresh) (?:review|verification|fact-check) of the (?:older|other|twelve) case records/i);
 assert.match(html,/56 historical case families/);
 assert.match(html,/four extension leads/);
 assert.equal([...html.matchAll(/data-case-id="[A-Z]+-[0-9]+"/g)].length,12);
 assert.match(html,/data-investigations-release="2026-11-02\.1"/);
});

test('Release 2 adds discovery for ten already-published records but not redaction-required case detail pages',()=>{
 const html=read('investigations.html');
 const nav=html.match(/<nav class="case-toolbar case-published-directory"[^>]*>[\s\S]*?<\/nav>/)?.[0];
 assert.ok(nav,'A dedicated existing-case navigation is required');
 for (const slug of ['corp-04','cyber-02','mkt-02','corp-01','corp-02','corp-03','cyber-01','ai-05','geo-01','air-01']) {
   assert.match(nav,new RegExp('href="/investigations/'+slug+'"'));
 }
 assert.equal((nav.match(/href="\/investigations\//g)||[]).length,10);
 assert.doesNotMatch(nav,/\/investigations\/court-01|\/investigations\/court-05/);
 assert.match(html,/NEEDS REDACTION/);
});

test('Insights index surfaces follow-up evidence while protecting original forecast values and their dates',()=>{
 const html=read('insights.html');
 assert.match(html,/War powers.*Nov 12/i);
 assert.match(html,/Counterintelligence.*Updated Nov 12/i);
 assert.match(html,/(?:refer|referred).*Judiciary Committee/i);
 assert.match(html,/Megaspeed.*BIS|Megaspeed.*inspections/i);
 assert.match(html,/Original judgment forecast: 76% House impeachment by year-end, 45% actual departure/);
});

test('Live overview patch retains untouched case-card bytes, live-only navigation and unrelated metadata',()=>{
 const canonical=read('investigations.html');
 const oldBlock='<section aria-labelledby="chip01-feature"><p>Outdated November 10 display</p></section>\n';
 const section=canonical.match(/<section aria-labelledby="chip01-feature">[\s\S]*?(?=<section aria-labelledby="lane-title">)/)?.[0];
 assert.ok(section);
 const directory=canonical.match(/<nav class="case-toolbar case-published-directory"[^>]*>[\s\S]*?<\/nav>\r?\n/)?.[0];
 assert.ok(directory);
 const stale=canonical.replace(section,oldBlock).replace(directory,'')
   .replace('</main>','<!-- LIVE-ONLY-SAFE-FOOTER --></main>')
   .replace('https://kahrelum.com/assets/social/og-investigations.png','https://kahrelum.com/assets/social/og-investigations.png');
 const patched=patchInvestigationOverview(stale,canonical);
 assert.match(patched,/Updated November 12, 2026/);
 assert.match(patched,/LIVE-ONLY-SAFE-FOOTER/);
 assert.equal((patched.match(/case-published-directory/g)||[]).length,1);
 assert.equal((patched.match(/data-case-id=/g)||[]).length,12);
 assert.equal((patched.match(/class="case-share-link"/g)||[]).length,(stale.match(/class="case-share-link"/g)||[]).length);
 for(const original of [...stale.matchAll(/<article class="case-record"[^>]*>[\s\S]*?<\/article>/g)]){
   assert.ok(patched.includes(original[0]),'Preserve all historic case card bytes');
 }
 assert.equal(patchInvestigationOverview(patched,canonical),patched,'Patch must be idempotent');
});

test('Live Insights patch only replaces three approved discovery cards and preserves all other material',()=>{
 const canonical=read('insights.html');
 const card=canonical.match(/<article class="card"><p class="kicker">Counterintelligence[^]*?<\/article>/)?.[0];
 assert.ok(card);
 const stale=canonical.replace(card,'<article class="card"><p>OLD NOVEMBER 10 NVIDIA ENTRY</p><a href="/insights/nvidia-megaspeed-chip-custody">Details</a></article>')
 .replace('</main>','<!-- LIVE-ONLY-INDEX-EXTRA --></main>');
 const patched=patchInsightsIndex(stale,canonical);
 assert.match(patched,/Updated Nov 12/);
 assert.match(patched,/LIVE-ONLY-INDEX-EXTRA/);
 assert.doesNotMatch(patched,/OLD NOVEMBER 10 NVIDIA ENTRY/);
 assert.equal(patchInsightsIndex(patched,canonical),patched);
});

test('Automatic text-only Firebase profile is explicitly allowlisted with zero artwork changes',()=>{
 const script=read('scripts/firebase-overlay-release.cjs');
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 const wrapper=read('scripts/deploy-unified-firebase.ps1');
 const profile=script.match(/  'investigations-text-only': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(profile,'Bounded text-only profile missing');
 assert.match(profile,/overlayFiles: \[\]/);
 assert.match(profile,/sitemapRoutes: \[\]/);
 assert.match(profile,/includeHomepage: false/);
 assert.doesNotMatch(profile,/\.png|portraits|forecast|candidate|\/index\.html/);
 assert.match(script,/profileName === 'investigations-text-only'/);
 assert.match(script,/patchInvestigationOverview/);
 assert.match(script,/patchInsightsIndex/);
 assert.match(workflow,/investigations-text-only/);
 assert.match(wrapper,/"investigations-text-only"/);
 const writeable = ['\/investigations.html','\/insights.html'];
 for (const path of writeable) assert.ok(script.includes(path));
});
