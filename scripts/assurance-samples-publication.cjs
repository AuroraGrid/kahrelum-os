'use strict';

// Strict, idempotent transformation of current hash-verified live Firebase HTML.
// Never replace an entire live page from a possibly stale checkout.
const OLD_HOME_HERO = `<p class="eyebrow">Evidence → adversarial analysis → probability → decision → audit</p>
<h1>Decision intelligence that has to earn its answer.</h1>
<p class="lede">KAHRELUM OS is an evidence-to-decision system for forecasting, research and high-stakes analysis. It separates fact from inference, attacks its own conclusions, and is designed to block rather than manufacture certainty when the evidence does not support an answer.</p>
`;
const OLD_HOME_ACTIONS = '<p><a class="cta primary" href="https://kahrelum.com/pilot#request">Review packages & start an inquiry</a><a class="cta" href="https://github.com/AuroraGrid/kahrelum-os/blob/main/evidence/EXTERNAL_AUDIT_SUMMARY.md">Review the Evidence</a></p>';
const OLD_ASSURANCE_ACTIONS = '<div class="buttons"><a class="btn primary" href="/pilot#request">Request the Fit Check</a><a class="btn" href="/os">See the method</a></div>';
const OLD_PILOT_ACTIONS = '<div class="pilot-actions"><a href="#request">Prepare a $750 Fit Check inquiry (you send)</a><a class="secondary" href="/demo">Inspect the synthetic deliverable</a></div>';

function extractOne(source, regex, name) {
  const matches = [...source.matchAll(new RegExp(regex.source, regex.flags+'g'))];
  if (matches.length !== 1) throw new Error('Refusing unexpected canonical source: '+name);
  return matches[0][0];
}
function swapExact(live, oldText, desired, name) {
  if (live.includes(desired)) return live;
  if (live.split(oldText).length !== 2) throw new Error('Refusing unexpected current live page: '+name);
  return live.replace(oldText, desired);
}
function patchAssuranceBuyerPage(route, liveHtml, sourceHtml) {
  if (!['/','/assurance','/pilot'].includes(route)) throw new Error('Unsupported assurance gallery route');
  if (typeof liveHtml !== 'string' || typeof sourceHtml !== 'string') throw new Error('Refusing non-HTML source');
  let next=liveHtml;
  if(route === '/') {
    const desiredHero=extractOne(sourceHtml,
      /<p class="eyebrow">Independent AI decision assurance[\s\S]*?(?=<span class="release">)/,
      'new homepage hero');
    const desiredActions=extractOne(sourceHtml,
      /<p><a class="cta primary" href="https:\/\/kahrelum\.com\/pilot#request">[\s\S]*?<\/p>/,
      'new homepage CTA');
    const section=extractOne(sourceHtml,
      /<section id="commercial-assurance-first">[\s\S]*?<\/section>/,
      'buyer assurance overview');
    next=swapExact(next,OLD_HOME_HERO,desiredHero,'homepage hero');
    next=swapExact(next,OLD_HOME_ACTIONS,desiredActions,'homepage CTA');
    if(!next.includes(section)){
      const marker='<section id="divisions">';
      if(next.split(marker).length !== 2 || next.includes('id="commercial-assurance-first"')) {
        throw new Error('Refusing unexpected homepage section placement');
      }
      next=next.replace(marker,section+'\n'+marker);
    }
  } else if(route === '/assurance') {
    const desired=extractOne(sourceHtml,
      /<div class="buttons"><a class="btn primary" href="\/pilot#request">[\s\S]*?<\/div>/,
      'assurance actions');
    next=swapExact(next,OLD_ASSURANCE_ACTIONS,desired,'assurance CTA');
  } else if(route === '/pilot') {
    const desired=extractOne(sourceHtml,
      /<div class="pilot-actions">[\s\S]*?<\/div>/,
      'pilot actions');
    next=swapExact(next,OLD_PILOT_ACTIONS,desired,'pilot CTA');
    if (!next.includes('id="pilotInquiry"')) throw new Error('Refusing to alter pilot without manual inquiry');
  }
  if (/\$500|five-case (?:diagnostics|historical reviews)/i.test(next)) {
    throw new Error('Refusing to reintroduce retired public price');
  }
  if (!next.includes('$750') || !next.includes('$2,500') ||
      !next.includes('href="/decision-assurance-samples"')) {
    throw new Error('Refusing incorrect commercial offer, price or proof link');
  }
  return next;
}
module.exports={patchAssuranceBuyerPage,OLD_HOME_HERO,OLD_HOME_ACTIONS,OLD_ASSURANCE_ACTIONS,OLD_PILOT_ACTIONS};
