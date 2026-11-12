'use strict';
// Release 2: patch only editorial text, preserving verified live Firebase files.
const assert=require('node:assert/strict');

function matchLineEndings(live, canonical){
  const normalized=canonical.replace(/\r\n/g,'\n');
  return live.includes('\r\n') ? normalized.replace(/\n/g,'\r\n') : normalized;
}

function uniqueRange(html,start,end,label){
  const a=html.indexOf(start);
  if(a<0||html.indexOf(start,a+start.length)!==-1)throw Error(label+': start anchor missing or repeated');
  const b=html.indexOf(end,a+start.length);
  if(b<0||html.indexOf(end,b+end.length)!==-1)throw Error(label+': end anchor missing or repeated');
  return {a,b,segment:html.slice(a,b)};
}
function replaceRange(live,canonical,start,end,label){
  const src=uniqueRange(canonical,start,end,label+' source');
  const old=uniqueRange(live,start,end,label+' live');
  return live.slice(0,old.a)+src.segment+live.slice(old.b);
}
function cards(html){
  return [...html.matchAll(/<article class="case-record"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
}
const navStart='<nav class="case-toolbar case-published-directory"';
function directory(html){
  const a=html.indexOf(navStart);
  if(a<0||html.indexOf(navStart,a+1)>=0)throw Error('Case directory missing or duplicated');
  const b=html.indexOf('</nav>',a);
  if(b<0)throw Error('Case directory unclosed');
  return html.slice(a,b+6);
}
function patchInvestigationOverview(live,canonical){
  canonical=matchLineEndings(live,canonical);
  if(typeof live!=='string'||typeof canonical!=='string')throw TypeError('Expected HTML text');
  const src=uniqueRange(canonical,'<section aria-labelledby="chip01-feature">','<section aria-labelledby="lane-title">','CHIP-01 section');
  if(!src.segment.includes('id="investigations-r2-desk-status"')||!src.segment.includes('Updated November 12, 2026'))throw Error('Canonical dated update absent');
  let out=replaceRange(live,canonical,'<section aria-labelledby="chip01-feature">','<section aria-labelledby="lane-title">','CHIP-01 section');
  const nav=directory(canonical);
  const marker='<div class="case-records">';
  if(out.split(marker).length!==2)throw Error('Missing or repeated case-records container');
  const existing=out.split(navStart).length-1;
  if(existing>1)throw Error('Duplicate live case-directory nav');
  if(existing===0){out=out.replace(marker,nav+'\n'+marker);}
  else {
    const first=out.indexOf(navStart),last=out.indexOf('</nav>',first);
    if(last<0)throw Error('Live case-directory nav is unclosed');
    out=out.slice(0,first)+nav+out.slice(last+6);
  }
  const old=cards(live),next=cards(out);
  if(old.length!==12||next.length!==12)throw Error('Expected exactly twelve historical case cards');
  assert.deepEqual(next,old,'Historical case evidence must be byte-preserved');
  if(out.split('</head>')[0]!==live.split('</head>')[0])throw Error('Live metadata or artwork reference changed');
  const actual=directory(out);
  for(const slug of ['corp-04','cyber-02','mkt-02','corp-01','corp-02','corp-03','cyber-01','ai-05','geo-01','air-01']){
    if(!actual.includes('href="/investigations/'+slug+'"'))throw Error('Missing approved case route '+slug);
  }
  if((actual.match(/href="\/investigations\//g)||[]).length!==10)throw Error('Exactly ten public case links required');
  if(actual.includes('href="/investigations/court-01"')||actual.includes('href="/investigations/court-05"'))throw Error('Redaction-required case was linked');
  return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n') ? live : out;
}
const routes=[
'/insights/hegseth-war-powers-fact-check',
'/insights/hegseth-impeachment-forecast-2026',
'/insights/nvidia-megaspeed-chip-custody'
];
function getCard(html,route){
  const cards=[...html.matchAll(/<article class="card">[\s\S]*?<\/article>/g)].filter(m=>m[0].includes('href="'+route+'"'));
  if(cards.length!==1)throw Error('Insights card missing or repeated '+route);
  return cards[0][0];
}
function patchInsightsIndex(live,canonical){
  canonical=matchLineEndings(live,canonical);
  if(typeof live!=='string'||typeof canonical!=='string')throw TypeError('Expected HTML text');
  let out=live;
  for(const route of routes){out=out.replace(getCard(out,route),getCard(canonical,route));}
  if(!out.includes('Updated Nov 12')||!out.includes('211–204'))throw Error('Nov 12 discovery correction missing');
  if(out.split('</head>')[0]!==live.split('</head>')[0])throw Error('Live Insights metadata changed');
  return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n') ? live : out;
}
function patchNvidiaDetailPage(live,canonical,file){
  canonical=matchLineEndings(live,canonical);
  const anchors={
    'investigations/chip-01.html':'<section aria-labelledby="chip01-forecast">',
    'insights/nvidia-megaspeed-chip-custody.html':'<section aria-labelledby="insight-leadership">',
  };
  const anchor=anchors[file];
  if(!anchor)throw Error('Unapproved detailed article for a bounded CHIP-01 text patch');
  const marker='<section id="chip01-nov12-leadership"';
  const start=canonical.indexOf(marker);
  if(start<0||canonical.indexOf(marker,start+1)>=0)throw Error('Missing or repeated canonical leadership update');
  const end=canonical.indexOf('</section>',start);
  if(end<0)throw Error('Leadership update has no unique section close');
  const snippet=canonical.slice(start,end+'</section>'.length);
  if(!snippet.includes('Colette Kress')||!snippet.includes('February 10, 2027')||!snippet.includes('2026-11-12-ceo-transition-addendum.md'))throw Error('Leadership text has incomplete source and settlement boundaries');
  let out=live;
  if(out.includes(marker)){
    const oldStart=out.indexOf(marker),oldEnd=out.indexOf('</section>',oldStart);
    if(oldEnd<0||out.indexOf(marker,oldStart+1)>=0)throw Error('Corrupt existing leadership section');
    out=out.slice(0,oldStart)+snippet+out.slice(oldEnd+'</section>'.length);
  } else {
    if(out.split(anchor).length!==2)throw Error('Expected a single frozen leadership forecast anchor');
    out=out.replace(anchor,snippet+(live.includes('\r\n')?'\r\n':'\n')+anchor);
  }
  if(out.split('</head>')[0]!==live.split('</head>')[0])throw Error('Unapproved metadata modification in CHIP-01 patch');
  if(!out.includes(anchor)||!out.includes('85%')||!out.includes('10%')||!out.includes('5%'))throw Error('Original outcome forecast disappeared');
  return out.replace(/\r\n/g,'\n')===live.replace(/\r\n/g,'\n') ? live : out;
}
module.exports={patchInvestigationOverview,patchInsightsIndex,patchNvidiaDetailPage};
