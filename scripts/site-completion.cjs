'use strict';
// Rerun the integrated site-completion release to close Markdown frontmatter and verified election directory SEO.
const assert=require('node:assert/strict');
const BASE='https://kahrelum.com';
const MARKDOWN_CANONICALS=Object.freeze([
 ['/index.md',BASE+'/'],
 ['/pilot-page.md',BASE+'/pilot'],
 ['/ai-discovery/assurance.md',BASE+'/assurance'],
 ['/ai-discovery/investigations.md',BASE+'/investigations'],
 ['/ai-discovery/forecasting.md',BASE+'/forecasting'],
 ['/ai-discovery/evidence-scorecard.md',BASE+'/evidence-scorecard'],
 ['/ai-discovery/insights.md',BASE+'/insights'],
 ['/ai-discovery/digital-id.md',BASE+'/digital-id'],
 ['/ai-discovery/os.md',BASE+'/os'],
 ['/ai-discovery/sports.md',BASE+'/sports'],
 ['/ai-discovery/nfl-deadline-2026.md',BASE+'/nfl/deadline-watch-2026'],
 ['/ai-discovery/nvidia-chip-custody.md',BASE+'/insights/nvidia-megaspeed-chip-custody'],
 ['/ai-discovery/glossary.md',BASE+'/ai-discovery/glossary.md'],
]);
const contentType='text/markdown; charset=utf-8';
// Single source of truth for the exact bounded Firebase Hosting file-map delta.
// The 13 canonical Markdown mirrors are preexisting public files, not a full-site overwrite.
function siteCompletionAllowedPaths(){
 const allowed=new Set([
  '/index.html','/insights.html','/nfl/deadline-watch-2026.html',
  '/election-data/index.html','/site-shell.css','/sitemap.xml',
 ]);
 for(const [route,canonical] of MARKDOWN_CANONICALS){
  if(!/^\/(?:index\.md|pilot-page\.md|ai-discovery\/[a-z0-9-]+\.md)$/.test(route)||
      !canonical.startsWith(BASE+'/'))throw Error('Unapproved Markdown response path or canonical '+route);
  if(allowed.has(route))throw Error('Duplicate site completion file path '+route);
  allowed.add(route);
 }
 if(MARKDOWN_CANONICALS.length!==13)throw Error('Unexpected Markdown allowlist count');
 return allowed;
}

function prepareMarkdownHostingConfig(original){
 if(!original||original.cleanUrls!==true)throw Error('Verified Hosting cleanUrls required');
 const source=JSON.stringify(original);
 const config=JSON.parse(source);
 config.headers=Array.isArray(config.headers)?config.headers:[];
 for(const [route,canonical] of MARKDOWN_CANONICALS){
  const required={'Content-Type':contentType,Link:'<'+canonical+'>; rel="canonical"'};
  const matching=config.headers.filter(h=>h.glob===route||h.regex===route);
  if(matching.length>1)throw Error('Duplicate Markdown header rule for '+route);
  if(matching.length===1){
    const existing=matching[0].headers||{};
    for(const [key,value] of Object.entries(required)){
      if(existing[key]!==value)throw Error('Conflicting published Markdown response header: '+route+' '+key);
    }
  }else{
    config.headers.push({glob:route,headers:required});
  }
 }
 assert.equal(JSON.stringify(original),source,'Mutation of protected Hosting config');
 return config;
}
function replaceUnique(text,oldValue,nextValue,label){
 const oldCount=text.split(oldValue).length-1;
 const newCount=text.split(nextValue).length-1;
 if(oldCount===0&&newCount===1)return text;
 if(oldCount!==1||newCount!==0)throw Error(label+': conflicting or missing exact text anchor');
 return text.replace(oldValue,nextValue);
}
function patchCompletionPage(live,source,route){
 if(!['/','/insights','/nfl/deadline-watch-2026','/election-data/'].includes(route))throw Error('Unapproved completion route');
 if(typeof live!=='string'||typeof source!=='string')throw TypeError('HTML required');
 const expected=BASE+(route==='/'?'/':route);
 if(!live.includes('<link rel="canonical" href="'+expected+'">')||!source.includes('<link rel="canonical" href="'+expected+'">'))throw Error('Unverified canonical: '+route);
 let out=live;
 if(route==='/insights'){
  for(const regex of [/<title>[^<]+<\/title>/,/<meta property="og:title" content="[^"]+">/,/<meta name="twitter:title" content="[^"]+">/]){
   const before=out.match(regex)?.[0],after=source.match(regex)?.[0];
   if(!before||!after)throw Error('Missing exact Insights title metadata');
   if(before!==after)out=replaceUnique(out,before,after,'Insights title');
  }
 }
 if(route==='/'){
  const outdated='Experimental, post-close forecasts. Official results and final accuracy remain pending until verified.';
  const corrected='Historical post-close scenarios remain distinct from the completed Israeli C7 result; consult the official-result audit and its source limitations.';
  if(out.includes(outdated))out=replaceUnique(out,outdated,corrected,'Home historical forecast footer');
 }
 if(route==='/nfl/deadline-watch-2026'||route==='/election-data/'){
  const marker='id="site-completion-clarifications"';
  const chunk=source.match(/<section id="site-completion-clarifications"[^>]*>[\s\S]*?<\/section>/)?.[0];
  if(!chunk)throw Error('Missing bounded publication clarification');
  if(out.includes(marker)){
   if(!out.includes(chunk))throw Error('Conflicting live source clarification');
  }else{
   if(out.split('</main>').length!==2)throw Error('Unique live main closing tag missing');
   out=out.replace('</main>',chunk+'\n</main>');
  }
 }
 if(route==='/election-data/'){
   const sourceMeta=source.match(/<meta name="description" content="[^"]+">/)?.[0];
   const currentMeta=out.match(/<meta name="description" content="[^"]+">/)?.[0];
   if(!sourceMeta||!currentMeta)throw Error('Election data SEO description missing');
   if(currentMeta!==sourceMeta)out=replaceUnique(out,currentMeta,sourceMeta,'Election data description');
   const marker='id="site-final-reading-notes"';
   const snippet=source.match(/<section id="site-final-reading-notes"[^>]*>[\s\S]*?<\/section>/)?.[0];
   if(!snippet)throw Error('Verified election reading notes missing');
   if(out.includes(marker)){
    if(!out.includes(snippet))throw Error('Changed election reading notes require review');
   }else{
    if(out.split('</main>').length!==2)throw Error('Election closing main missing');
    out=out.replace('</main>',snippet+'\n</main>');
   }
  }
 if(/<script\b/i.test(out.slice(out.indexOf('<main'),out.indexOf('</main>')).replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,''))&&!/script\b/i.test(live.slice(live.indexOf('<main'),live.indexOf('</main>')))){
   throw Error('An executable script was injected into the article body');
 }
 return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n')?live:out;
}
async function verifyMarkdownResponseHeaders(origin){
 const checks=[];
 for(const [route,canonical] of [MARKDOWN_CANONICALS[0],MARKDOWN_CANONICALS[1],MARKDOWN_CANONICALS[2],MARKDOWN_CANONICALS[12]]){
   const response=await fetch(origin+route,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
   if(!response.ok)throw Error('Markdown route unavailable '+route+' HTTP '+response.status);
   const type=(response.headers.get('content-type')||'').toLowerCase();
   const link=response.headers.get('link')||'';
   if(!type.startsWith('text/markdown'))throw Error('Markdown response Content-Type not verified for '+route+': '+type);
   if(!link.includes('<'+canonical+'>')||!link.includes('rel="canonical"'))throw Error('Markdown Link canonical not verified for '+route);
   checks.push({route,status:response.status,type,canonical});
 }
 return checks;
}
module.exports={MARKDOWN_CANONICALS,siteCompletionAllowedPaths,prepareMarkdownHostingConfig,patchCompletionPage,verifyMarkdownResponseHeaders};
