'use strict';
const assert=require('node:assert/strict');

const URLS=Object.freeze({
 '/':'index.html',
 '/insights':'insights.html',
 '/digital-id':'digital-id.html',
 '/os':'os.html',
 '/sports':'sports.html',
 '/nfl/deadline-watch-2026':'nfl/deadline-watch-2026.html',
 '/insights/nvidia-megaspeed-chip-custody':'insights/nvidia-megaspeed-chip-custody.html',
});
const MD=Object.freeze({
 '/insights':'/ai-discovery/insights.md',
 '/digital-id':'/ai-discovery/digital-id.md',
 '/os':'/ai-discovery/os.md',
 '/sports':'/ai-discovery/sports.md',
 '/nfl/deadline-watch-2026':'/ai-discovery/nfl-deadline-2026.md',
 '/insights/nvidia-megaspeed-chip-custody':'/ai-discovery/nvidia-chip-custody.md',
});
const GLOSSARY='<a class="agent-glossary-link" href="/ai-discovery/glossary.md">Evidence glossary</a>';
const NAV='<nav class="site-next-steps" aria-label="Next steps">';
const DESCRIBED='<link rel="describedby" href="/llms.txt">';
function one(s,needle,label){
 if(typeof s!=='string'||s.split(needle).length!==2)throw Error(label+': expected one occurrence');
}
function normalized(s){return s.replace(/\r\n/g,'\n')}
function enhanceAgentVisibility(live,source,route){
 if(!Object.hasOwn(URLS,route)||typeof live!=='string'||typeof source!=='string')throw Error('Unapproved live AI visibility route');
 const url='https://kahrelum.com'+(route==='/'?'/':route);
 one(live,'<link rel="canonical" href="'+url+'">','Live canonical '+route);
 one(source,'<link rel="canonical" href="'+url+'">','Source canonical '+route);
 one(live,'</head>','Live HTML head');
 one(source,'</head>','Source HTML head');
 one(live,NAV,'Live navigation');
 one(source,NAV,'Source navigation');
 const newline=live.includes('\r\n')?'\r\n':'\n';
 let out=live;
 if(route==='/'){
  // Production is read from the currently authenticated Firebase live version.
  // Only source-approved head metadata is inserted; no historical body bytes
  // or existing robots exclusions can be replaced by this scoped release.
  const schemaPattern=/<script type="application\/ld\+json" id="kahrelum-homepage-schema">([^<]+)<\/script>/;
  const schema=source.match(schemaPattern);
  if(!schema)throw Error('Required source homepage schema missing');
  const graph=JSON.parse(schema[1]);
  if(graph['@context']!=='https://schema.org'||graph['@type']!=='WebPage'||
     graph.url!==url||graph.dateModified!=='2026-11-12'||
     JSON.stringify(graph).includes('LocalBusiness'))throw Error('Unsupported homepage schema');
  const tags=[
    schema[0],
    '<link rel="alternate" type="text/markdown" href="/index.md">',
    DESCRIBED,
    '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">',
  ];
  for(const tag of tags){
   one(source,tag,'Source homepage metadata');
   if(!out.includes(tag)){
    if(tag===schema[0]&&out.includes('id="kahrelum-homepage-schema"'))throw Error('Conflicting live homepage schema');
    if(tag.includes('rel="alternate"')&&/rel="alternate" type="text\/markdown"/.test(out))throw Error('Conflicting live homepage Markdown alternate');
    if(tag===DESCRIBED&&out.includes('rel="describedby"'))throw Error('Conflicting live homepage AI discovery');
    if(tag.includes('name="robots"')&&/<meta name="robots"[^>]*>/.test(out))throw Error('Conflicting live homepage robots directive');
    out=out.replace('</head>',tag+newline+'</head>');
   }
   one(out,tag,'Live homepage metadata');
  }
 }
 if(route!=='/'){
  const marker='id="kahrelum-visibility-schema"';
  const expr=/<script type="application\/ld\+json" id="kahrelum-visibility-schema">([^<]+)<\/script>/;
  const srcScript=source.match(expr)?.[0];
  if(!srcScript)throw Error('Required source JSON-LD missing '+route);
  const obj=JSON.parse(source.match(expr)[1]);
  if(obj.url!==url||obj['@context']!=='https://schema.org')throw Error('Invalid canonical source schema');
  if(!['AboutPage','CollectionPage','Article'].includes(obj['@type'])||JSON.stringify(obj).includes('LocalBusiness'))throw Error('Unsupported schema claim');
  if(out.includes(marker)){
   const deployed=out.match(expr)?.[0];
   if(!deployed||JSON.stringify(JSON.parse(out.match(expr)[1]))!==JSON.stringify(obj))throw Error('Existing structured data conflicts with source');
  }else if(route==='/insights/nvidia-megaspeed-chip-custody'){
   // Existing post-Release-3 article already contains correctly attributed Article JSON-LD:
   // add an identifier instead of publishing a duplicate contradictory schema.
   const old=/<script type="application\/ld\+json">([^<]+)<\/script>/;
   const published=out.match(old);
   if(!published)throw Error('Nvidia previous source Article schema missing');
   const current=JSON.parse(published[1]);
   const historical={...obj};delete historical.url;
   if(JSON.stringify(current)!==JSON.stringify(historical)||current.mainEntityOfPage!==url)throw Error('Nvidia Article schema conflicts; preserve original rather than overwrite');
   out=out.replace(old,srcScript);
  }else {
   // Prevent two independently asserted versions of the same page schema.
   if(out.includes('"@type":"'+obj['@type']+'"'))throw Error('Existing JSON-LD of same type needs reconciliation');
   out=out.replace('</head>',srcScript+newline+'</head>');
  }
  const alt='<link rel="alternate" type="text/markdown" href="'+MD[route]+'">';
  if(!source.includes(alt))throw Error('Source Markdown alternate absent');
  if(!out.includes(alt))out=out.replace('</head>',alt+newline+'</head>');
  if(!out.includes(DESCRIBED))out=out.replace('</head>',DESCRIBED+newline+'</head>');
  const sourceRobots=source.match(/<meta name="robots" content="[^"]+">/)?.[0];
  if(sourceRobots&&!out.includes('name="robots"'))out=out.replace('</head>',sourceRobots+newline+'</head>');
 }
 if(!source.includes(GLOSSARY))throw Error('Canonical glossary not linked');
 if(!out.includes(GLOSSARY))out=out.replace(NAV,NAV+GLOSSARY);
 if(out.split(GLOSSARY).length!==2)throw Error('Duplicate glossary insertion');
 // Only the metadata area and a single navigation link may change.
 const body=h=>h.slice(h.indexOf('</head>')+7).replace(GLOSSARY,'');
 assert.equal(normalized(body(out)),normalized(body(live)),'Unexpected body edit outside glossary link '+route);
 return normalized(out)===normalized(live)?live:out;
}
module.exports={enhanceAgentVisibility,URLS,MD};
