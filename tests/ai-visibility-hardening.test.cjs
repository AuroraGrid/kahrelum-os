'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pages=[
['insights.html','/insights','CollectionPage','ai-discovery/insights.md'],
['digital-id.html','/digital-id','CollectionPage','ai-discovery/digital-id.md'],
['os.html','/os','AboutPage','ai-discovery/os.md'],
['sports.html','/sports','CollectionPage','ai-discovery/sports.md'],
['nfl/deadline-watch-2026.html','/nfl/deadline-watch-2026','Article','ai-discovery/nfl-deadline-2026.md'],
['insights/nvidia-megaspeed-chip-custody.html','/insights/nvidia-megaspeed-chip-custody','Article','ai-discovery/nvidia-chip-custody.md'],
];
test('Six prioritized public pages offer crawler-readable, source-true schemas, summaries and glossary',()=>{
 for(const [file,route,type,md] of pages){
  const html=read(file),head=html.split('</head>')[0];
  const match=head.match(/<script type="application\/ld\+json" id="kahrelum-visibility-schema">([^<]+)<\/script>/);
  assert.ok(match,'No dedicated JSON-LD: '+file);
  const data=JSON.parse(match[1]);assert.equal(data['@type'],type);assert.equal(data.url,'https://kahrelum.com'+route);
  assert.ok(!JSON.stringify(data).includes('LocalBusiness'));
  assert.match(head,new RegExp('rel="alternate" type="text/markdown" href="/'+md.replaceAll('/','\\/')+'"'));
  assert.match(head,/rel="describedby" href="\/llms.txt"/);
  assert.match(html,/href="\/ai-discovery\/glossary\.md"/);
  const summary=read(md);assert.match(summary,/^---\n/);
  assert.match(summary,/## Source and verification boundaries/);
  assert.match(summary,/## Sitemap/);
  assert.ok(summary.includes('https://kahrelum.com'+route));
 }
});
test('Homepage and both commercial Markdown mirrors expose glossary and dated, honest frontmatter',()=>{
 const home=read('index.html');
 assert.match(home,/href="\/ai-discovery\/glossary\.md"/);
 for(const name of ['index.md','pilot-page.md']){
  const md=read(name);assert.match(md,/^---\n/);assert.match(md,/## Sitemap/);assert.match(md,/https:\/\/kahrelum\.com/);
 }
 const guide=read('ai-discovery/glossary.md');
 for(const phrase of ['FACT','ALLEGATION','INFERENCE','FORECAST','UNKNOWN','NO FIT','FC1','C7','Source and verification boundaries','## Sitemap'])assert.ok(guide.includes(phrase),phrase);
 assert.match(read('llms.txt'),/ai-discovery\/glossary\.md/);
 assert.match(read('AGENTS.md'),/ai-discovery\/glossary\.md/);
});
test('Scoped publisher preserves all historic text, image metadata, API files and current Hosting config',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs'),work=read('.github/workflows/firebase-scoped-release.yml');
 const block=pub.match(/  'ai-visibility-hardening': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(block);assert.match(block,/includeHomepage: false/);assert.match(block,/sitemapLastmod:/);
 assert.doesNotMatch(block,/\.png|forecast-ledger|candidate-portraits/);
 assert.match(pub,/AI visibility release attempted to change unrelated live Firebase files/);
 assert.match(pub,/enhanceAgentVisibility/);
 assert.match(work,/ai-visibility-hardening/);
 assert.match(read('scripts/deploy-unified-firebase.ps1'),/"ai-visibility-hardening"/);
});
test('Fail-closed patch is idempotent and cannot rewrite source bodies',()=>{
 const {enhanceAgentVisibility}=require('../scripts/agent-visibility-hardening.cjs');
 for(const [file,route,type,md] of pages){
  const source=read(file);
  const old=source.replace(/<script type="application\/ld\+json" id="kahrelum-visibility-schema">[^<]+<\/script>\s*/,'')
    .replace(/<link rel="alternate" type="text\/markdown" href="\/ai-discovery\/[^"]+\.md">\s*/,'')
    .replace(/<link rel="describedby" href="\/llms.txt">\s*/,'')
    .replace(/<a class="agent-glossary-link" href="\/ai-discovery\/glossary\.md">[^<]+<\/a>/,'');
  const patched=enhanceAgentVisibility(old,source,route);
  assert.match(patched,/kahrelum-visibility-schema/);
  assert.equal(enhanceAgentVisibility(patched,source,route),patched);
  // JSON-LD and glossary links may appear, but all preexisting case-card and forecast body content survives unchanged.
  for(const chunk of [...old.matchAll(/<article class="case-record"[\s\S]*?<\/article>/g)])assert.ok(patched.includes(chunk[0]));
 }
});

test('sitemap accepts only source-verified homepage modification date, idempotently',()=>{
 const {setSitemapLastmod}=require('../scripts/commercial-readiness.cjs');
 const sitemap='<?xml version="1.0"?><urlset><url><loc>https://kahrelum.com/</loc></url></urlset>';
 const revised=setSitemapLastmod(sitemap,{'/':'2026-11-12'});
 assert.match(revised,/<loc>https:\/\/kahrelum\.com\/<\/loc><lastmod>2026-11-12<\/lastmod>/);
 assert.equal(setSitemapLastmod(revised,{'/':'2026-11-12'}),revised);
 assert.throws(()=>setSitemapLastmod(sitemap,{'/../../etc':'2026-11-12'}));
});
