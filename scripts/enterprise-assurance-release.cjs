'use strict';

// Surgical live-page patch for a dedicated enterprise positioning release.
// Requires the verified currently-deployed source, not a stale snapshot. Preserves other pages.
function replaceOnceOrExisting(html, original, replacement, description) {
  if (!replacement || replacement === original) throw new Error('Missing canonical '+description);
  const count = html.split(original).length - 1;
  if (count === 0 && html.includes(replacement)) return html;
  if (count !== 1 || html.includes(replacement)) throw new Error('Unexpected live source for '+description+'; HOLD');
  return html.replace(original,replacement);
}
function sectionFromSource(source,id) {
  const re = new RegExp('<section id="'+id+'">[\\s\\S]*?<\\/section>');
  const match = source.match(re);
  if (!match) throw new Error('Missing canonical section '+id);
  return match[0];
}
function patchEnterpriseAssurance(live, canonical, route) {
  if (!['/','/assurance','/pilot'].includes(route) || typeof live!=='string' || typeof canonical!=='string') throw new Error('Unsupported route or input');
  if (/\\$500|five.case diagnostics|five.case historical reviews/i.test(live)) throw new Error('Legacy public pricing reappeared; HOLD');
  if (!canonical.includes('href="/decision-assurance-samples"')) throw new Error('Canonical buyer link missing; HOLD');
  let out=live;
  if(route==='/'){
    out=replaceOnceOrExisting(out,'<h1>Decision intelligence that has to earn its answer.</h1>','<h1>Your AI made a decision. Can the evidence defend it?</h1>','homepage headline');
    const oldLede='<p class="lede">KAHRELUM OS is an evidence-to-decision system for forecasting, research and high-stakes analysis. It separates fact from inference, attacks its own conclusions, and is designed to block rather than manufacture certainty when the evidence does not support an answer.</p>';
    const nextLede=canonical.match(/<p class="lede">[^<]*<\\/p>/)?.[0];
    out=replaceOnceOrExisting(out,oldLede,nextLede,'homepage explanation');
    out=replaceOnceOrExisting(out,'h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:.98;margin:0 0 1rem;max-width:12ch}',
      'h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.02;margin:0 0 1rem;max-width:19ch}','homepage hero width');
    const oldCTA='<p><a class="cta primary" href="https://kahrelum.com/pilot#request">Review packages & start an inquiry</a><a class="cta" href="https://github.com/AuroraGrid/kahrelum-os/blob/main/evidence/EXTERNAL_AUDIT_SUMMARY.md">Review the Evidence</a></p>';
    const newCTA=canonical.match(/<p><a class="cta primary" href="\\/enterprise-ai-evaluation">[\\s\\S]*?<\\/p>/)?.[0];
    out=replaceOnceOrExisting(out,oldCTA,newCTA,'homepage call to action');
    const section=sectionFromSource(canonical,'commercial-workflows');
    out=replaceOnceOrExisting(out,'<section id="divisions">',section+'\n<section id="divisions">','homepage commercial workflows');
  } else if(route==='/assurance'){
    out=replaceOnceOrExisting(out,'<h1>Before an AI agent acts, test what justified it.</h1>','<h1>Can the evidence defend an AI-assisted decision?</h1>','assurance headline');
    const section=sectionFromSource(canonical,'sector-proof');
    out=replaceOnceOrExisting(out,'<section><p class="eyebrow">Two fixed-scope offerings</p>',section+'<section><p class="eyebrow">Two fixed-scope offerings</p>','assurance samples');
  } else {
    const section=sectionFromSource(canonical,'enterprise-samples');
    out=replaceOnceOrExisting(out,'<section><p class="eyebrow">Who it is for</p>',section+'<section><p class="eyebrow">Who it is for</p>','pilot samples');
  }
  if (!out.includes('href="/decision-assurance-samples"') || !out.includes('$750') || !out.includes('$2,500')) throw new Error('Buyer proof or published prices missing; HOLD');
  return out;
}
module.exports={patchEnterpriseAssurance};
