'use strict';
// Deliberately narrow, idempotent source-to-live editorial insertion.
// Firebase live bytes are independently hash-verified before this function is called.
// Existing article text, evidence cutoffs, hidden cases, artwork and configuration are untouched.
const SECTION_OPEN = '<section id="editorial-discovery-20261120"';
const ANCHORS = Object.freeze({
  '/insights': '<section id="recent-investigations-20261117"',
  '/investigations': '<section aria-labelledby="chip01-feature">',
});
const REQUIRED_LINKS = Object.freeze({
  '/insights': ['/investigations/anthropic-lobbying-chip-policy','/forecasting/nfc-east-2026',
    '/insights/morgan-dollar-quote','/investigations/chip-01#chip01-nov17-doj-statement'],
  '/investigations': ['/investigations/anthropic-lobbying-chip-policy',
    '/investigations/chip-01#chip01-nov17-doj-statement',
    '/investigations/ca-001','/investigations/air-02'],
});
const count = (s,needle) => s.split(needle).length-1;
function sectionOf(html,label) {
  if(count(html,SECTION_OPEN)!==1)throw Error(label+' dated section missing or duplicate');
  const start=html.indexOf(SECTION_OPEN),end=html.indexOf('</section>',start);
  if(end<0)throw Error(label+' section is unclosed');
  const section=html.slice(start,end+'</section>'.length);
  if(section.slice(SECTION_OPEN.length).includes('<section'))throw Error(label+' nested section is not allowed');
  return section;
}
function normalized(s){return s.replace(/\r\n/g,'\n');}
function syncEditorialSection(liveHtml,canonical,route) {
  if(typeof liveHtml!=='string'||typeof canonical!=='string'||!Object.hasOwn(ANCHORS,route)){
    throw Error('Unsupported editorial discovery route or input');
  }
  const anchor=ANCHORS[route];
  if(count(canonical,anchor)!==1)throw Error('Canonical index anchor missing or duplicate');
  const section=sectionOf(canonical,'Canonical');
  if(!section.includes('November 17, 2026')||!section.includes('November 20, 2026')){
    throw Error('Editorial section needs true publication and index-refresh dates');
  }
  for(const url of REQUIRED_LINKS[route]){
    if(!section.includes('href="'+url+'"'))throw Error('Canonical source link missing: '+url);
  }
  if(count(liveHtml,SECTION_OPEN)>1)throw Error('Multiple existing live dated sections');
  if(count(liveHtml,SECTION_OPEN)===1) {
    if(normalized(sectionOf(liveHtml,'Live'))!==normalized(section)){
      throw Error('Conflicting live editorial section differs from source; HOLD for review');
    }
    return liveHtml;
  }
  if(count(liveHtml,anchor)!==1)throw Error('Live editorial insertion anchor missing or duplicate');
  if(!liveHtml.includes('</head>')||!liveHtml.includes('<main')||!liveHtml.includes('</main>')){
    throw Error('Unexpected live HTML structure');
  }
  if(route==='/investigations'&&(!liveHtml.includes('id="case-desk"')||!liveHtml.includes('56 historical case families'))){
    throw Error('Historical investigations index is not in its recognized state');
  }
  const br=liveHtml.includes('\r\n')?'\r\n':'\n';
  const inserted=section.replace(/\r?\n/g,br)+br;
  const result=liveHtml.replace(anchor,inserted+anchor);
  if(result.split('</head>')[0]!==liveHtml.split('</head>')[0]){
    throw Error('Unexpected live metadata change');
  }
  if(!result.includes(anchor)||count(result,SECTION_OPEN)!==1){
    throw Error('Editorial index insertion incomplete');
  }
  return result;
}
module.exports={syncEditorialSection};
