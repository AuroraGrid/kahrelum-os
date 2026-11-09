'use strict';

// Source-pinned, non-destructive patching of the current Firebase production HTML.
// Never build the buyer pages from a stale repository copy.
const origin='https://kahrelum.com';
const organization={
  '@type':'Organization',
  '@id':origin+'/#organization',
  name:'KAHRELUM',
  url:origin+'/',
  description:'Independent, operator-assisted historical AI decision assurance, public-source research and forecasting.',
  founder:{'@type':'Person',name:'Hasan Raza Kazmi'},
  sameAs:['https://github.com/AuroraGrid/kahrelum-os','https://www.linkedin.com/in/hasan-raza-kazmi']
};
const webSite={
  '@type':'WebSite','@id':origin+'/#website',name:'KAHRELUM',
  url:origin+'/',publisher:{'@id':origin+'/#organization'}
};
const service={
  '@type':'Service','@id':origin+'/pilot#service',
  name:'KAHRELUM historical AI decision review',
  serviceType:'Retrospective AI decision assurance',
  url:origin+'/pilot',
  description:'Operator-assisted review of authorized, de-identified closed historical decisions. No production integration, certification, or guaranteed performance.',
  provider:{'@id':origin+'/#organization'},
  offers:[
    {'@type':'Offer',name:'Fit Check: three historical cases',price:'750',priceCurrency:'USD',url:origin+'/pilot#request'},
    {'@type':'Offer',name:'Founding Pilot: up to ten historical decisions',price:'2500',priceCurrency:'USD',url:origin+'/pilot#request'}
  ]
};
function injectHead(html,marker,fragment){
 if(html.includes(marker))return html;
 if(html.split('</head>').length!==2)throw new Error('Expected one HTML head closing tag');
 return html.replace('</head>',fragment+'</head>');
}
function patchBuyerPage(route,html){
 if(!['/','/pilot'].includes(route)||typeof html!=='string')throw new Error('Unexpected buyer discovery route');
 const canonical='<link rel="canonical" href="'+origin+(route==='/'?'/':route)+'">';
 if(!html.includes(canonical))throw new Error('Unverified canonical live page: '+route);
 let result=html;
 const schema={'@context':'https://schema.org','@graph':route==='/'?[organization,webSite]:[organization,service]};
 const marker='id="kahrelum-buyer-discovery-schema"';
 result=injectHead(result,marker,'<script type="application/ld+json" '+marker+'>'+JSON.stringify(schema)+'</script>\n');
 result=injectHead(result,'rel="describedby" href="/llms.txt"','<link rel="describedby" href="/llms.txt">\n');
 const mirror=route==='/'?'/index.md':'/pilot-page.md';
 result=injectHead(result,'rel="alternate" type="text/markdown" href="'+mirror+'"','<link rel="alternate" type="text/markdown" href="'+mirror+'">\n');
 if(!/name="robots"/i.test(result)){
   result=injectHead(result,'name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"','<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">\n');
 }
 if(route==='/pilot'){
   const oldDescription='<meta name="description" content="Fixed-scope, operator-assisted historical AI decision review.">';
   const newDescription='<meta name="description" content="Review three authorized historical AI decisions for $750, or up to ten for $2,500. Independent evidence-to-decision records, no production access required.">';
   if(result.includes(oldDescription))result=result.replace(oldDescription,newDescription);
   else if(!result.includes(newDescription))throw new Error('Pilot description anchor changed; refusing stale overwrite');
   const oldLink='<a class="secondary" href="/demo">Inspect the synthetic deliverable</a>';
   const newLinks=oldLink+
      '<a class="secondary" href="/opticodds-market-integrity">Market integrity demonstration</a>'+
      '<a class="secondary" href="/ai-intelligence-evaluation-2026">AI evaluation scorecard</a>'+
      '<a class="secondary" href="mailto:hasan@kahrelum.com?subject=KAHRELUM%20Fit%20Check%20Inquiry">Email a Fit Check inquiry</a>';
   if(result.includes(oldLink)&&!result.includes('/opticodds-market-integrity'))result=result.replace(oldLink,newLinks);
   else if(!result.includes(newLinks))throw new Error('Pilot CTA anchor changed; refusing speculative patch');
 }
 return result;
}
module.exports={patchBuyerPage};
