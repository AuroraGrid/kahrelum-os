'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const mirrors=[
['/index.md','https://kahrelum.com/'],
['/pilot-page.md','https://kahrelum.com/pilot'],
['/ai-discovery/assurance.md','https://kahrelum.com/assurance'],
['/ai-discovery/investigations.md','https://kahrelum.com/investigations'],
['/ai-discovery/forecasting.md','https://kahrelum.com/forecasting'],
['/ai-discovery/evidence-scorecard.md','https://kahrelum.com/evidence-scorecard'],
['/ai-discovery/insights.md','https://kahrelum.com/insights'],
['/ai-discovery/digital-id.md','https://kahrelum.com/digital-id'],
['/ai-discovery/os.md','https://kahrelum.com/os'],
['/ai-discovery/sports.md','https://kahrelum.com/sports'],
['/ai-discovery/nfl-deadline-2026.md','https://kahrelum.com/nfl/deadline-watch-2026'],
['/ai-discovery/nvidia-chip-custody.md','https://kahrelum.com/insights/nvidia-megaspeed-chip-custody'],
['/ai-discovery/glossary.md','https://kahrelum.com/ai-discovery/glossary.md']
];
test('real Firebase REST Hosting config extends only Markdown response headers and preserves all original settings',()=>{
 const {prepareMarkdownHostingConfig,MARKDOWN_CANONICALS}=require('../scripts/site-completion.cjs');
 assert.deepEqual(MARKDOWN_CANONICALS,mirrors);
 const initial={cleanUrls:true,rewrites:[{glob:'/api/v1',path:'/data/api/v1/index.json'}],headers:[{glob:'/foo',headers:{'Cache-Control':'max-age=1800'}}]};
 const before=JSON.stringify(initial);
 const result=prepareMarkdownHostingConfig(initial);
 assert.equal(JSON.stringify(initial),before,'must not mutate existing config');
 assert.deepEqual(result.rewrites,initial.rewrites);
 assert.deepEqual(result.headers[0],initial.headers[0]);
 for(const [route,canonical] of mirrors){
   const found=result.headers.find(x=>x.glob===route);
   assert.ok(found,'missing exact Markdown header '+route);
   assert.equal(found.headers['Content-Type'],'text/markdown; charset=utf-8');
   assert.equal(found.headers.Link,'<'+canonical+'>; rel="canonical"');
 }
 assert.deepEqual(prepareMarkdownHostingConfig(result),result,'idempotent new config');
 assert.throws(()=>prepareMarkdownHostingConfig({...initial,headers:[{glob:'/index.md',headers:{Link:'<https://evil.example>; rel="canonical"'}}]}));
});
test('SEO titles, source boundaries and commercial content are corrected without third party claims',()=>{
 const insights=read('insights.html');
 const title=insights.match(/<title>([^<]+)<\/title>/)[1];
 assert.ok(title.length>=30&&title.length<=60,title);
 assert.match(insights,/property="og:title" content="KAHRELUM Insights/i);
 assert.match(insights,/name="twitter:title" content="KAHRELUM Insights/i);
 const home=read('index.html');
 assert.doesNotMatch(home,/Official results and final accuracy remain pending until verified/);
 for(const page of ['nfl/deadline-watch-2026.html','election-data/index.html']){
  const html=read(page);
  assert.match(html,/id="site-completion-clarifications"/,page);
  assert.match(html,/source|historical|verification/i,page);
 }
});
test('scoped Firebase can release metadata and an audited header-only config delta without touching forecasts or images',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs'),workflow=read('.github/workflows/firebase-scoped-release.yml');
 const profile=pub.match(/  'site-completion': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(profile);
 assert.doesNotMatch(profile,/\.png|candidate-portraits|forecast-ledger|BASELINE_LOCK/);
 assert.match(profile,/includeHomepage: false/);
 assert.match(pub,/prepareMarkdownHostingConfig/);
 assert.match(pub,/Site completion attempted to replace an unrelated Firebase file/);
 assert.match(pub,/expectedConfigHash/);
 assert.match(pub,/verifyMarkdownResponseHeaders/);
 assert.match(workflow,/site-completion/);
 assert.match(read('scripts/deploy-unified-firebase.ps1'),/"site-completion"/);
});
test('headless browser QA has viewport and navigation, no credential or form submission behaviour',()=>{
 const source=read('scripts/site-completion-browser-qa.cjs');
 for(const n of ['320','390','768','1280','scrollWidth','document.documentElement','site-mobile-menu','pilotInquiry'])assert.ok(source.includes(n));
 assert.doesNotMatch(source,/\.submit\(|dispatchEvent\(new Event\('submit'/);
 assert.match(read('.github/workflows/firebase-scoped-release.yml'),/site-completion-browser-qa\.cjs/);
});

test('narrow viewports make multi-column data tables independently scrollable without hiding body overflow',()=>{
 const css=read('site-shell.css');
 assert.match(css,/@media\s*\(max-width:\s*640px\)/);
 assert.match(css,/main table\s*\{/);
 assert.match(css,/overflow-x:\s*auto/);
 assert.match(css,/overscroll-behavior-inline:\s*contain/);
 const pub=read('scripts/firebase-overlay-release.cjs');
 assert.match(pub,/'site-completion':\s*\{[\s\S]{0,500}'site-shell\.css'/);
 assert.match(pub,/Site completion attempted to replace an unrelated Firebase file/);
});

test('all 13 public Markdown canonical mirrors have complete honest dated frontmatter',()=>{
 const docs=['index.md','pilot-page.md',...[
  'assurance','digital-id','evidence-scorecard','forecasting','glossary','insights',
  'investigations','nfl-deadline-2026','nvidia-chip-custody','os','sports'
 ].map(x=>'ai-discovery/'+x+'.md')];
 assert.equal(docs.length,13);
 for(const doc of docs){
  const body=read(doc),front=body.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  assert.ok(front,doc+' missing YAML frontmatter');
  for(const field of ['title','canonical','description','last_updated'])assert.match(front,new RegExp('^'+field+':\\s*".+"','m'),doc+' missing '+field);
  assert.match(front,/last_updated: "2026-11-12"/);
  assert.match(body,/## Sitemap/);
 }
 const pub=read('scripts/firebase-overlay-release.cjs');
 const segment=pub.match(/  'site-completion': \{([\s\S]*?)\n  \},/)?.[1]||'';
 assert.match(segment,/index\.md/);
 assert.match(segment,/pilot-page\.md/);
 assert.match(segment,/ai-discovery\/assurance\.md/);
});
test('election-data page is substantive, source-cautious, and has a concise SEO description',()=>{
 const h=read('election-data/index.html'),desc=h.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
 assert.ok(desc.length>=70&&desc.length<=160,desc.length);
 assert.match(h,/id="site-final-reading-notes"/);
 assert.match(h,/not.*certif|unofficial/i);
 const words=h.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').trim().split(/\s+/);
 assert.ok(words.length>=600,'thin page: '+words.length+' words');
});


test('site-completion allowlist includes all canonical Markdown mirrors without permitting images or forecast mutations',()=>{
 const {MARKDOWN_CANONICALS,siteCompletionAllowedPaths}=require('../scripts/site-completion.cjs');
 const allowed=siteCompletionAllowedPaths();
 assert.ok(allowed instanceof Set);
 assert.equal(MARKDOWN_CANONICALS.length,13);
 for(const [url] of MARKDOWN_CANONICALS)assert.ok(allowed.has(url),'Missing exact Markdown mirror '+url);
 for(const url of ['/index.html','/insights.html','/nfl/deadline-watch-2026.html','/election-data/index.html','/site-shell.css','/sitemap.xml'])assert.ok(allowed.has(url),'Missing HTML/CSS '+url);
 for(const url of ['/assets/social/og-home.png','/nfl/forecast-ledger.json','/election/candidate-portraits.json','/api/v1'])assert.equal(allowed.has(url),false,'Unsafe path '+url);
 const pub=read('scripts/firebase-overlay-release.cjs');
 assert.match(pub,/siteCompletionAllowedPaths\(\)/);
 assert.match(pub,/Unexpected site completion changed paths/);
});
