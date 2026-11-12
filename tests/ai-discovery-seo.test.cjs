'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const specs=[
 ['assurance.html','/assurance','Service','ai-discovery/assurance.md'],
 ['investigations.html','/investigations','CollectionPage','ai-discovery/investigations.md'],
 ['forecasting.html','/forecasting','CollectionPage','ai-discovery/forecasting.md'],
 ['evidence-scorecard.html','/evidence-scorecard','SoftwareApplication','ai-discovery/evidence-scorecard.md']
];
test('four public division pages expose truthful structured data and meaningful Markdown discoverability',()=>{
 for(const [file,route,type,mirror] of specs){
  const page=read(file);
  assert.match(page,/id="kahrelum-ai-discovery-schema"/,file);
  const ld=page.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(ld,file);const graph=JSON.parse(ld);
  assert.equal(graph['@context'],'https://schema.org');
  assert.equal(graph['@type'],type,file);
  assert.equal(graph.url,'https://kahrelum.com'+route);
  assert.ok(!JSON.stringify(graph).includes('"@type":"LocalBusiness"'));
  assert.ok(!JSON.stringify(graph).includes('AggregateRating'));
  assert.ok(page.includes('<link rel="alternate" type="text/markdown" href="/'+mirror+'">'),file);
  assert.ok(page.includes('<link rel="describedby" href="/llms.txt">'),file);
  const md=read(mirror);
  assert.match(md,/^---\n(?:[^\n]+\n)+---\n/);
  assert.ok(md.includes('https://kahrelum.com'+route));
  assert.match(md,/## Source and verification boundaries/);
 }
});
test('commercial FAQ answers practical buyer questions and does not promise automatic submission',()=>{
 for(const file of ['assurance.html','pilot.html']){
  const html=read(file);
  assert.match(html,/id="buyer-faq-20261112"/);
  assert.match(html,/three historical|three authorized/i);
  assert.match(html,/\$750/);
  assert.match(html,/\$2,500/);
  assert.match(html,/no production access|without production access/i);
  assert.match(html,/not.*automatically sent|not.*automatically transmit/i);
 }
});
test('AI agent public instructions explain non-installable usage and preserve evidence limits',()=>{
 const agents=read('AGENTS.md');
 assert.match(agents,/## Configuration/);
 assert.match(agents,/## Usage examples/);
 assert.match(agents,/read-only/);
 assert.match(agents,/not.*(?:production API|customer records)|not a production agent API/i);
 const llms=read('llms.txt');
 for(const [file,route,type,mirror] of specs)assert.ok(llms.includes('https://kahrelum.com/'+mirror));
});
test('scoped Firebase AI discovery publisher cannot overwrite preexisting forecasts, images or unrelated HTML',()=>{
 const pub=read('scripts/firebase-overlay-release.cjs'),workflow=read('.github/workflows/firebase-scoped-release.yml'),wrapper=read('scripts/deploy-unified-firebase.ps1');
 const spec=pub.match(/  'ai-discovery-seo': \{([\s\S]*?)\n  \},/)?.[1];
 assert.ok(spec);
 assert.match(spec,/overlayFiles:/);
 assert.doesNotMatch(spec,/\.png|candidate-portraits|forecast-ledger|source-observations/);
 assert.match(spec,/sitemapLastmod:/);
 assert.match(spec,/includeHomepage: false/);
 assert.match(pub,/AI discovery SEO release attempted to change unrelated live Firebase files/);
 assert.match(pub,/enhanceDiscoveryPage/);
 assert.match(workflow,/ai-discovery-seo/);
 assert.match(wrapper,/"ai-discovery-seo"/);
});
test('live patch retains previous case bytes, frozen forecast HTML and prior metadata',()=>{
 const {enhanceDiscoveryPage}=require('../scripts/ai-seo-discovery.cjs');
 for(const [file,route,type,mirror] of specs){
  const source=read(file);
  const live=source.replace(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">[\s\S]*?<\/script>/,'')
    .replace('<link rel="alternate" type="text/markdown" href="/'+mirror+'">','')
    .replace('<link rel="describedby" href="/llms.txt">','')
    .replace(/<section id="buyer-faq-20261112"[\s\S]*?<\/section>/,'');
  const out=enhanceDiscoveryPage(live,source,route);
  assert.ok(out.includes('kahrelum-ai-discovery-schema'),file);
  assert.ok(out.includes('rel="alternate"'),file);
  assert.equal(enhanceDiscoveryPage(out,source,route),out,'must be idempotent '+file);
  if(file==='investigations.html'){
    const cards=[...live.matchAll(/<article class="case-record"[^>]*>[\s\S]*?<\/article>/g)].map(x=>x[0]);
    assert.equal(cards.length,12);
    for(const c of cards)assert.ok(out.includes(c),'case record was rewritten');
  }
  if(file==='forecasting.html')assert.equal(out.slice(out.indexOf('<main'),out.indexOf('</main>')),live.slice(live.indexOf('<main'),live.indexOf('</main>')));
 }
});
