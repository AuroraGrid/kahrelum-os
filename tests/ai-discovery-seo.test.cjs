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


test('pilot offer page exposes accurate machine-readable service scope and a safe Markdown mirror',()=>{
  const source=read('pilot.html');
  const json=source.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([\s\S]*?)<\/script>/);
  assert.ok(json,'Pilot must publish a source-bound JSON-LD block');
  const service=JSON.parse(json[1]);
  assert.equal(service['@context'],'https://schema.org');
  assert.equal(service['@type'],'WebPage');
  assert.equal(service.url,'https://kahrelum.com/pilot');
  assert.equal(service.mainEntity['@type'],'Service');
  assert.equal(service.mainEntity['@id'],'https://kahrelum.com/pilot#service');
  assert.equal(service.mainEntity.provider['@type'],'Organization');
  assert.deepEqual(service.mainEntity.offers.map(o=>o.price),['750','2500']);
  assert.ok(service.mainEntity.offers.every(o=>o.priceCurrency==='USD'));
  const buyer=require('../scripts/buyer-discovery.cjs').patchBuyerPage('/pilot',source);
  const buyerGraph=JSON.parse(buyer.match(/<script type="application\/ld\+json" id="kahrelum-buyer-discovery-schema">([^<]+)<\/script>/)[1]);
  assert.equal(buyerGraph['@graph'].find(n=>n['@type']==='Service')['@id'],service.mainEntity['@id']);
  assert.ok(!JSON.stringify(service).includes('LocalBusiness'));
  assert.ok(!JSON.stringify(service).includes('AggregateRating'));
  const alt='<link rel="alternate" type="text/markdown" href="/pilot-page.md">';
  const described='<link rel="describedby" href="/llms.txt">';
  const robots='<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">';
  const glossary='<a class="agent-glossary-link" href="/ai-discovery/glossary.md">Evidence glossary</a>';
  for(const hint of [alt,described,robots,glossary]) assert.ok(source.includes(hint),'Pilot missing '+hint);
  assert.match(read('pilot-page.md'),/canonical: "https:\/\/kahrelum\.com\/pilot"/);
  const legacy=source.replace(json[0],'').replace(alt,'').replace(described,'').replace(robots,'').replace(glossary,'');
  const {enhanceDiscoveryPage}=require('../scripts/ai-seo-discovery.cjs');
  const patched=enhanceDiscoveryPage(legacy,source,'/pilot');
  for(const hint of [json[0],alt,described,robots,glossary])assert.ok(patched.includes(hint));
  assert.equal(enhanceDiscoveryPage(patched,source,'/pilot'),patched,'Pilot patch must be idempotent');
  assert.equal(patched.split('</head>')[1].replace(glossary,''),legacy.split('</head>')[1],'Prior live commercial copy must remain unchanged');
  assert.throws(()=>enhanceDiscoveryPage(legacy.replace('href="https://kahrelum.com/pilot"','href="https://wrong.invalid/pilot"'),source,'/pilot'),/canonical/);
});


test('pilot Service schema migration is source-pinned and preserves all live content',()=>{
  const source=read('pilot.html');
  const sourceScript=source.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([^<]+)<\/script>/)?.[0];
  assert.ok(sourceScript);
  const schema=JSON.parse(source.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([^<]+)<\/script>/)[1]);
  const prior={'@context':'https://schema.org',...schema.mainEntity};
  delete prior['@id'];
  const oldScript='<script type="application/ld+json" id="kahrelum-ai-discovery-schema">'+JSON.stringify(prior)+'</script>';
  const oldLive=source.replace(sourceScript,oldScript);
  const {enhanceDiscoveryPage}=require('../scripts/ai-seo-discovery.cjs');
  const next=enhanceDiscoveryPage(oldLive,source,'/pilot');
  assert.ok(next.includes(sourceScript));
  assert.equal(enhanceDiscoveryPage(next,source,'/pilot'),next);
  assert.equal(next.replace(sourceScript,''),oldLive.replace(oldScript,''),'No modification of historical buyer page content');
  const changed={...prior,offers:[...prior.offers]};
  changed.offers[0]={...changed.offers[0],price:'700'};
  const bad=source.replace(sourceScript,oldScript.replace(JSON.stringify(prior),JSON.stringify(changed)));
  assert.throws(()=>enhanceDiscoveryPage(bad,source,'/pilot'),/previous verified source/);
});
