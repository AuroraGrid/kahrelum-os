'use strict';
// Text-only Release 3: modify current live Firebase pages without clobbering deployed metadata,
// historical research, Open Graph artwork, or live-only site shell elements.
function only(html,needle,label){
 const i=html.indexOf(needle);
 if(i<0||html.indexOf(needle,i+needle.length)!==-1)throw Error(label+': expected unique anchor');
 return i;
}
function span(html,start,end,label){
 const a=only(html,start,label+' start'), b=html.indexOf(end,a+start.length);
 if(b<0)throw Error(label+': closing boundary not found');
 return [a,b+end.length];
}
function replaceRange(live,source,start,end,label){
 const [a,b]=span(live,start,end,label+' live'),[c,d]=span(source,start,end,label+' source');
 return live.slice(0,a)+source.slice(c,d)+live.slice(b);
}
function patchPilot(live,source){
 if(!live.includes('<form class="pilot-inquiry" id="pilotInquiry"'))throw Error('Live buyer form signature missing');
 if(!source.includes('id="inquiryPreview"')||!source.includes('NOT sent')||!source.includes('contactEmail'))throw Error('Review-only buyer source invalid');
 let out=replaceRange(live,source,'<section id="request">','</section>','buyer request section');
 // Both published and source forms use one terminal inline (function(){}) script.
 const scriptHead='<script>(function(){';
 const [lA,lB]=span(out,scriptHead,'</script>','buyer JS live');
 const [sA,sB]=span(source,scriptHead,'</script>','buyer JS source');
 out=out.slice(0,lA)+source.slice(sA,sB)+out.slice(lB);
 if(out.split('</head>')[0]!==live.split('</head>')[0])throw Error('Buyer page metadata change outside release scope');
 if(!out.includes('window.location.href=mailto()')||!out.includes('aria-live="polite"'))throw Error('Buyer review safeguards missing');
 return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n')?live:out;
}
function patchArticleMetadata(live,source,mode){
 if(!['article','catalog'].includes(mode))throw Error('Unknown metadata mode');
 if(!live.includes('</head>')||!source.includes('</head>'))throw Error('Malformed article head');
 let out=live;
 const changes=[
  /<title>[^<]*<\/title>/i,
  /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
  /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
  /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
 ];
 for(const re of changes){
  const m=source.match(re);if(!m){if(re.source.includes('og:description')||re.source.includes('twitter:description'))continue;throw Error('Canonical metadata missing '+re);}
  const n=out.match(re);if(!n){if(re.source.includes('og:description')||re.source.includes('twitter:description'))continue;throw Error('Live metadata missing '+re);}
  out=out.replace(re,m[0]);
 }
 if(mode==='article'){
  const articleSource=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[0];
  if(!articleSource||!articleSource.includes('"@type":"Article"')||!articleSource.includes('"dateModified":"2026-11-12"'))throw Error('Dated source Article schema missing');
  if(!out.includes(articleSource)&&!out.includes('"@type":"Article"'))out=out.replace('</head>',articleSource+'</head>');
 }
 if(out.split('</head>')[1]!==live.split('</head>')[1])throw Error('Research article body altered during metadata patch');
 return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n')?live:out;
}
function patchHomepageC7(live,canonical){
 if(!canonical.includes('Israel 2026 election: C7 completed'))throw Error('Verified C7 source unavailable');
 const old='Official results and final accuracy remain pending';
 const count=live.split(old).length-1;if(count>1)throw Error('Duplicate outdated election claim');
 return count===1?live.replace(old,'The November 4 Israeli CEC result and November 5 KAHRELUM C7 audit are complete; see the dated certified-result comparison and limitations.'):live;
}
module.exports={patchPilot,patchArticleMetadata,patchHomepageC7};
