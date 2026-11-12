'use strict';
const assert=require('node:assert/strict');
const ROUTES=Object.freeze({
 '/assurance':'assurance.html',
 '/investigations':'investigations.html',
 '/forecasting':'forecasting.html',
 '/evidence-scorecard':'evidence-scorecard.html',
 '/pilot':'pilot.html',
});
function onlyOne(h,needle,label){const n=h.split(needle).length-1;if(n!==1)throw Error(label+': expected exactly one anchor, found '+n);}
function section(html,id){
 const re=new RegExp('<section id="'+id+'"[^>]*>[\\s\\S]*?<\\/section>');
 const match=html.match(re);if(!match)throw Error('Missing approved section '+id);
 onlyOne(html,'id="'+id+'"',id);
 return match[0];
}
function enhanceDiscoveryPage(live,canonical,route){
 if(!ROUTES[route]||typeof live!=='string'||typeof canonical!=='string')throw Error('Unapproved AI discovery patch input');
 const url='https://kahrelum.com'+route;
 if(!live.includes('<link rel="canonical" href="'+url+'">')||!canonical.includes('<link rel="canonical" href="'+url+'">'))throw Error('Live route canonical mismatch '+route);
 if(!live.includes('</head>')||live.split('</head>').length!==2)throw Error('Malformed live head');
 let out=live;
 if(route!=='/pilot'){
  const marker='id="kahrelum-ai-discovery-schema"';
  const m=canonical.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([\s\S]*?)<\/script>/);
  if(!m)throw Error('Missing canonical AI discovery JSON-LD');
  const data=JSON.parse(m[1]);
  if(data.url!==url||data['@context']!=='https://schema.org')throw Error('Schema URL or context mismatch');
  if(!['Service','CollectionPage','SoftwareApplication'].includes(data['@type'])||JSON.stringify(data).includes('"@type":"LocalBusiness"'))throw Error('Unsupported schema claim');
  if(out.includes(marker)){
   const published=out.match(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">([\s\S]*?)<\/script>/);
   if(!published||JSON.stringify(JSON.parse(published[1]))!==JSON.stringify(data))throw Error('Existing schema conflicts with source');
  }else{
   out=out.replace('</head>',m[0]+'\n</head>');
  }
  const mirror=canonical.match(/<link rel="alternate" type="text\/markdown" href="(\/ai-discovery\/[^"]+\.md)">/)?.[0];
  if(!mirror)throw Error('Missing canonical Markdown alternate');
  if(!out.includes(mirror))out=out.replace('</head>',mirror+'\n</head>');
 }
 const described='<link rel="describedby" href="/llms.txt">';
 if(!out.includes(described))out=out.replace('</head>',described+'\n</head>');
 const faqid='buyer-faq-20261112';
 if(route==='/assurance'||route==='/pilot'){
   const snippet=section(canonical,faqid);
   const existing=out.includes('id="'+faqid+'"');
   if(existing){const liveFAQ=section(out,faqid);if(liveFAQ!==snippet)throw Error('An independently modified buyer FAQ needs review');}
   else{
     onlyOne(out,'</main>','main closing tag');
     out=out.replace('</main>',snippet+'\n</main>');
   }
 }
 // These are additive discovery changes only, and must preserve all prior source
 // analysis, case cards, injected commercial metadata and site-shell code.
 const strip=(h)=>h.replace(/<script type="application\/ld\+json" id="kahrelum-ai-discovery-schema">[\s\S]*?<\/script>\s*/,'')
  .replace(/<link rel="alternate" type="text\/markdown" href="\/ai-discovery\/[^"]+\.md">\s*/,'')
  .replace(/<link rel="describedby" href="\/llms.txt">\s*/,'')
  .replace(/<section id="buyer-faq-20261112"[^>]*>[\s\S]*?<\/section>\s*/,'')
  .replace(/\s+(?=<\/head>)/g,'');
 const norm=s=>s.replace(/\r\n/g,'\n');
 assert.equal(norm(strip(out)),norm(strip(live)),'Unexpected mutation outside approved AI discovery snippets: '+route);
 return norm(out)===norm(live)?live:out;
}
module.exports={enhanceDiscoveryPage};
