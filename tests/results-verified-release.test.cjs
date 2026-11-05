'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x));
const text=x=>read(x).toString('utf8');
const json=x=>JSON.parse(text(x));
const sha=x=>crypto.createHash('sha256').update(read(x)).digest('hex');

test('US results snapshot contains 435+35+36, called and counting are distinct, no invented Senate balance',()=>{
  const d=json('election/results-2026-snapshot.json');
  assert.equal(d.house.length,435); assert.equal(d.senate.length,35);assert.equal(d.governor.length,36);
  assert.equal(d.summary.house.called+d.summary.house.counting,435);
  assert.equal(d.summary.senate.called+d.summary.senate.counting,35);
  assert.equal(d.summary.governor.called+d.summary.governor.counting,36);
  assert.equal(d.summary.house.called, d.house.filter(r=>r.status==='CALLED').length);
  assert.equal(d.summary.senate.called, d.senate.filter(r=>r.status==='CALLED').length);
  assert.equal(d.summary.governor.called, d.governor.filter(r=>r.status==='CALLED').length);
  assert.equal(Object.hasOwn(d.summary.senate,'seatsNotUp'),false,'Do not manufacture full Senate control from election subset');
  assert.match(d.resultStatus,/UNOFFICIAL/);
  assert.ok(d.house.some(x=>x.status==='COUNTING'));
  assert.ok(d.house.every(x=>x.sourceUrl.startsWith('https://polling-desk.com/')));
  const js=text('election-results-2026.js');
  assert.doesNotMatch(js,/seatsNotUp/);
  assert.match(js,/Still counting|counting/);
  assert.match(text('election-results-2026.html'),/Not certified|not state certifications|unofficial/i);
});

test('Israel C7 result compares actual official seats against correctly classified frozen sources',()=>{
  const d=json('election/israel-certified-2026.json');
  assert.equal(d.results.length,14);assert.equal(d.results.reduce((s,p)=>s+p.certifiedSeats,0),120);
  assert.equal(d.scores.kahrelumPostClose.l1,8);assert.equal(d.scores.externalOctober26.l1,20);
  assert.equal(d.forecastSources.kahrelum.sha256,sha('research/israel-2026-election/HEAD_TO_HEAD_LOCK_2026-10-28.json'));
  assert.equal(d.forecastSources.externalOriginal.sha256,sha('research/israel-2026-election/BASELINE_LOCK_2026-10-26.md'));
  assert.match(d.forecastSources.kahrelum.type,/POST_CLOSE/);
  assert.match(d.forecastSources.externalOriginal.type,/PRE_ELECTION/);
  assert.equal(d.certifiedValidVotes,5691426);
  assert.ok(d.goldSourceUrls.some(s=>s.includes('president.gov.il')));
  assert.ok(d.goldSourceUrls.some(s=>s.includes('main.knesset.gov.il')));
  assert.equal(d.blocs.netanyahu+d.blocs.opposition+d.blocs.arabLed,120);
  assert.ok(text('israel-certified-2026.html').includes('/israel-certified-2026.js'));
  assert.ok(text('israel-certified-2026.js').includes('/election/israel-certified-2026.json'));
  assert.ok(text('israel-certified-2026.js').includes('kahrelumPostCloseSeats')||text('israel-certified-2026.js').includes('kahrelumPostClose'));
});

test('NFL page exposes review/source failures and does not automatically equate reports with confirmed trades',()=>{
 const html=text('nfl/deadline-watch-2026.html'),js=text('nfl/deadline-watch-2026.js');
 assert.ok(html.includes('/nfl/refresh-status.json')||js.includes('/nfl/refresh-status.json'));
 assert.ok(html.includes('/nfl/public-feed.json')||js.includes('/nfl/public-feed.json'));
 assert.ok(html.includes('2026-11-10T21:00:00Z')||js.includes('2026-11-10T21:00:00Z'));
 assert.match(html,/official|confirmed/i);
 assert.match(html,/review|unapproved/i);
 assert.match(js,/publishedUpdates/);
 assert.match(js,/sourcesFailed/);
 assert.match(js,/transactionConfirmed/);
 const p=json('nfl/publishing.json');assert.equal(p.publishingAuthorized,false);
});

test('four new/share-updated pages have absolute OG images with matching local 1200x630 PNG assets',()=>{
 const entries=[
  ['election-results-2026.html','assets/social/og-us-results-2026.png','https://kahrelum.com/election-results-2026'],
  ['israel-certified-2026.html','assets/social/og-israel-certified-2026.png','https://kahrelum.com/israel-certified-2026'],
  ['nfl/deadline-watch-2026.html','assets/social/og-nfl-deadline-watch-2026.png','https://kahrelum.com/nfl/deadline-watch-2026'],
  ['evidence-scorecard.html','assets/social/og-evidence-scorecard.png','https://kahrelum.com/evidence-scorecard']
 ];
 for(const [htmlFile,pngFile,url] of entries){
  const h=text(htmlFile);
  assert.match(h,new RegExp('<link rel="canonical" href="'+url+'"'));
  assert.ok(h.includes('<meta property="og:image" content="https://kahrelum.com/'+pngFile+'"'),htmlFile);
  assert.ok(h.includes('name="twitter:card"'),htmlFile);
  const buf=read(pngFile);
  assert.equal(buf.slice(1,4).toString(),'PNG',pngFile);
  assert.equal(buf.readUInt32BE(16),1200);assert.equal(buf.readUInt32BE(20),630);
 }
});

test('release profile changes only new results pages/assets plus scorecard preview, homepage fragment and sitemap',()=>{
 const overlay=text('scripts/firebase-overlay-release.cjs');
 const wrapper=text('scripts/deploy-unified-firebase.ps1');
 assert.match(wrapper,/"results-verified"/);
 const match=overlay.match(/'results-verified':\s*\{([\s\S]*?)\n\s*\},/);
 assert.ok(match,'missing strict results release profile');
 const block=match[1];
 for(const s of ['election-results-2026.html','election-results-2026.js','israel-certified-2026.html','israel-certified-2026.js',
 'nfl/deadline-watch-2026.html','nfl/deadline-watch-2026.js','election/results-2026-snapshot.json','election/israel-certified-2026.json',
 'evidence-scorecard.html','og-us-results-2026.png','og-israel-certified-2026.png','og-nfl-deadline-watch-2026.png','og-evidence-scorecard.png'])
 assert.ok(block.includes(s),'missing scoped file '+s);
 assert.ok(block.includes('includeHomepage: true'));
 assert.ok(block.includes('/election-results-2026'));
 assert.ok(block.includes('/israel-certified-2026'));
 assert.ok(block.includes('/nfl/deadline-watch-2026'));
 assert.doesNotMatch(block,/candidate-portraits\.json|nfl\/forecast-ledger\.json|election\/house-forecast-lock\.json/);
 const fragment=text('hosting/homepage-divisions.html');
 for(const s of ['/election-results-2026','/israel-certified-2026','/nfl/deadline-watch-2026','/evidence-scorecard'])
  assert.ok(fragment.includes('href="'+s+'"'),s);
});