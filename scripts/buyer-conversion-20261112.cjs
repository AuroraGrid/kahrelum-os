'use strict';
const assert=require('node:assert/strict');

const ORIGIN='https://kahrelum.com';
const ROUTES=Object.freeze({
 '/assurance':{
  oldTitle:'AI &amp; Agent Assurance | KAHRELUM',
  oldDescriptions:['Independent historical AI decision, agent risk, evidence and authority audits.'],
  sectionId:'example-decision-audits',
  before:'<section><p class="eyebrow">Buying & data handling',
  image:'/assets/social/og-assurance.png'
 },
 '/pilot':{
  oldTitle:'Historical AI Decision Review — KAHRELUM Pilot',
  oldDescriptions:[
   'Fixed-scope, operator-assisted historical AI decision review.',
   'Review three authorized historical AI decisions for $750, or up to ten for $2,500. Independent evidence-to-decision records, no production access required.'
  ],
  sectionId:'fit-check-process',
  before:'<section><p class="eyebrow">What you provide',
  image:'/assets/social/og-pilot.png'
 },
});
const SOCIAL=/<meta\s+(?:property|name)="(?:og:(?:type|url|title|description|image(?::(?:secure_url|type|width|height|alt))?)|twitter:(?:card|title|description|image|image:alt))"[^>]*>\s*/gi;

function exactlyOne(text,regex,label){
 const matches=[...text.matchAll(new RegExp(regex.source,regex.flags.includes('g')?regex.flags:regex.flags+'g'))];
 if(matches.length!==1)throw Error(label+': expected exactly one match');
 return matches[0][0];
}
function replaceAllowed(html,regex,desired,allowed,label){
 const original=exactlyOne(html,regex,label);
 if(original===desired)return html;
 if(!allowed.includes(original))throw Error(label+': unsupported existing value');
 return html.replace(original,desired);
}
function extractSection(html,id){
 const start='<section id="'+id+'"';
 const sections=[...html.matchAll(new RegExp('<section id="'+id+'"[^>]*>[\\s\\S]*?<\\/section>','g'))];
 if(sections.length!==1||html.split(start).length!==2)throw Error('Source section not unique: '+id);
 return sections[0][0];
}
function patchBuyerConversion(live,source,route){
 const spec=ROUTES[route];
 if(!spec||typeof live!=='string'||typeof source!=='string')throw Error('Unapproved buyer-conversion route');
 const canonical='<link rel="canonical" href="'+ORIGIN+route+'">';
 for(const html of [live,source]){
  if(html.split(canonical).length!==2)throw Error('Buyer canonical mismatch for '+route);
  if(html.split('</head>').length!==2||html.split('</main>').length!==2)throw Error('Malformed buyer page');
 }
 const sourceHead=source.split('</head>')[0];
 const intendedTitle=exactlyOne(sourceHead,/<title>[^<]+<\/title>/,'Source title');
 const intendedDescription=exactlyOne(sourceHead,/<meta name="description" content="[^"]+">/,'Source description');
 if(!intendedTitle.includes('KAHRELUM')||!intendedDescription.includes('historical AI'))throw Error('Unexpected buyer source metadata');
 let out=replaceAllowed(live,/<title>[^<]+<\/title>/,intendedTitle,
  ['<title>'+spec.oldTitle+'</title>'],'Buyer title');
 out=replaceAllowed(out,/<meta name="description" content="[^"]+">/,intendedDescription,
  spec.oldDescriptions.map(value=>'<meta name="description" content="'+value+'">'),'Buyer description');
 const desiredSocial=sourceHead.match(SOCIAL)||[];
 if(desiredSocial.length!==15)throw Error('Source must contain exactly 15 governed social tags');
 const liveHead=out.split('</head>')[0];
 const previousSocial=liveHead.match(SOCIAL)||[];
 if(previousSocial.length!==0&&previousSocial.length!==15)throw Error('Unexpected partial live social metadata');
 const actualImage=liveHead.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
 const approvedImage=ORIGIN+spec.image;
 if(actualImage&&actualImage!==approvedImage)throw Error('Live social artwork path is not approved');
 if(!desiredSocial.some(x=>x.includes('property="og:image" content="'+approvedImage+'"')))throw Error('Source social artwork path is not approved');
 if(previousSocial.join('')!==desiredSocial.join('')){
  const headWithoutSocial=liveHead.replace(SOCIAL,'');
  out=headWithoutSocial.replace(canonical,canonical+desiredSocial.join(''))+'</head>'+out.split('</head>').slice(1).join('</head>');
 }
 const approvedSection=extractSection(source,spec.sectionId);
 const marker='<section id="'+spec.sectionId+'"';
 if(out.includes(marker)){
  if(out.split(marker).length!==2||!out.includes(approvedSection))throw Error('Existing buyer section conflicts with verified source');
 }else{
  if(out.split(spec.before).length!==2)throw Error('Live buyer section anchor changed: '+route);
  out=out.replace(spec.before,approvedSection+spec.before);
 }
 const guideId='buyer-intent-guide-20261113';
 const approvedGuide=extractSection(source,guideId);
 const guideMarker='<section id="'+guideId+'"';
 const beforeGuide='<section id="'+spec.sectionId+'"';
 if(out.includes(guideMarker)){
  if(out.split(guideMarker).length!==2||!out.includes(approvedGuide))throw Error('Existing buyer guide conflicts with verified source');
 }else{
  if(out.split(beforeGuide).length!==2)throw Error('Buyer guide insertion anchor changed: '+route);
  out=out.replace(beforeGuide,approvedGuide+beforeGuide);
 }
 if(route==='/pilot'){
  // The public inquiry is a local email composer, not a data-submitting form.
  // Refuse any live patch that loses the explicit manual-send disclosure.
  if(!/does not automatically transmit|not automatically sent/i.test(out)) {
   throw Error('Pilot inquiry manual-send disclosure missing');
  }
  const approved='<a href="#request">Prepare a $750 Fit Check inquiry (you send)</a>';
  const prior='<a href="#request">Outline one workflow</a>';
  if(!source.includes(approved))throw Error('Missing approved pilot CTA');
  if(out.includes(prior))out=out.replace(prior,approved);
  else if(!out.includes(approved))throw Error('Live pilot CTA changed: refuse edit');
 }
 assert.equal(out.split(canonical).length,2);
 if(!out.includes('mailto:hasan@kahrelum.com')||!out.includes('$750')||!out.includes('$2,500'))throw Error('Commercial terms or contact boundary absent');
 return out;
}
module.exports={patchBuyerConversion,ROUTES};
