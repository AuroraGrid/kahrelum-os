'use strict';
// Derived C7 score. Never mutate archived C0, C2, or post-close K-PREDICT receipts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const src=path.join(ROOT,'research','israel-2026-election');
const head=JSON.parse(fs.readFileSync(path.join(src,'HEAD_TO_HEAD_LOCK_2026-10-28.json'),'utf8'));
const baseline=fs.readFileSync(path.join(src,'BASELINE_LOCK_2026-10-26.md'),'utf8');
const primary=new Map([
 ['Likud',27],['Yashar',21],["B'Yachad",12],['Joint List',11],['Democrats',8],["Ra'am",8],
 ['Yisrael Beytenu',7],['United Torah Judaism',7],['Otzma Yehudit',7],['Shas',6],['Religious Zionism',6],
 ['Reservists-Economic',0],['People of Israel',0],['Noam',0]
]);
const rows=[
 ['Likud','Likud','Likud'],['Yashar','Yashar','Yashar'],["B'Yachad",'Together',"B'Yachad"],['Democrats','Democrats','Democrats'],
 ['Joint List','Joint List','Joint List'],['Otzma Yehudit','Otzma Yehudit','Otzma Yehudit'],
 ['Shas','Shas','Shas'],['United Torah Judaism','UTJ','United Torah Judaism'],['Yisrael Beytenu','Yisrael Beiteinu','Yisrael Beytenu'],
 ['Religious Zionism','Religious Zionism-Zehut','Religious Zionism-Zehut'],["Ra'am",'Raam',"Ra'am"],
 ['Reservists-Economic','Reservists-Economic','Reservists-Economic'],['People of Israel','People of Israel','People of Israel'],['Noam','Noam','Noam']
];
const baselineSegment=baseline.split('## 4. Preregistered external forecast benchmark')[1]?.split('## 5. Canonical')[0]||'';
assert.ok(baselineSegment,'Original external comparator baseline not found');
const quoteRe=(s)=>s.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
const parties=rows.map(([official,local,externalLabel])=>{
 const actual=primary.get(official);
 const predicted=head.KAHRELUM_anchor.medians[local];
 assert.ok(Number.isInteger(actual)&&Number.isInteger(predicted),'Missing seat data '+official);
 const line=baselineSegment.split('\n').find(t=>t.startsWith('| '+externalLabel+' |'));
 assert.ok(line,'External original seat vector missing '+externalLabel);
 const external=Number(line.split('|')[2]?.trim());
 assert.ok(Number.isInteger(external),'Bad third-party seat '+externalLabel);
 return {party:official,certifiedSeats:actual,kahrelumPostCloseSeats:predicted,externalOctober26Seats:external,
   kahrelumError:predicted-actual,externalError:external-actual};
});
assert.equal(parties.reduce((x,p)=>x+p.certifiedSeats,0),120);
assert.equal(parties.reduce((x,p)=>x+p.kahrelumPostCloseSeats,0),120);
assert.equal(parties.reduce((x,p)=>x+p.externalOctober26Seats,0),120);
function score(key){const errors=parties.map(p=>p[key]-p.certifiedSeats);return {l1:errors.reduce((s,x)=>s+Math.abs(x),0),mae:+(errors.reduce((s,x)=>s+Math.abs(x),0)/14).toFixed(6),rmse:+Math.sqrt(errors.reduce((s,x)=>s+x*x,0)/14).toFixed(6)};}
const sourceHash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(src,p))).digest('hex');
const result={schema:'KAHRELUM_ISRAEL_C7_CERTIFIED_SEATS_POSTELECTION_AUDIT_V1',electionDate:'2026-10-27',certifiedOn:'2026-11-04',
 goldStatus:'OFFICIALLY_PRESENTED_RESULTS_SEATS_CROSSCHECKED; DIRECT_CEC_SITE_RETRIEVAL_RESTRICTED',
 goldSourceUrls:[
 'https://main.knesset.gov.il/mk/elections/pages/electionsresults26.aspx',
 'https://www.gov.il/he/pages/mandates',
 'https://www.president.gov.il/en/president-herzog-receives-the-official-results-of-the-elections-to-the-26th-knesset/',
 'https://www.israelielections.com/2026/results/'
 ],
 goldProvenance:'The Central Elections Committee certified the 120-seat allocation on November 4, 2026, and submitted the final results to the president. Israel Knesset results page reports 5,691,396 valid votes. Direct CEC gov.il endpoint may block automated retrieval.',
 certifiedValidVotes:5691396,
 partyAliasCrosswalk:'B’Yachad/Together, UTJ/United Torah Judaism, Raam/Ra’am, Yisrael Beiteinu/Yisrael Beytenu, Religious Zionism-Zehut/Religious Zionism are identified crosswalks. Others exact.',
 cohort:{lists:14,seats:120},blocs:{netanyahu:53,opposition:48,arabLed:19,majority:61,blocsUnofficial:true},
 results:parties,scores:{kahrelumPostClose:score('kahrelumPostCloseSeats'),externalOctober26:score('externalOctober26Seats')},
 forecastSources:{
  externalOriginal:{path:'research/israel-2026-election/BASELINE_LOCK_2026-10-26.md',sha256:sourceHash('BASELINE_LOCK_2026-10-26.md'),cutoff:'2026-10-26T21:33:42.393Z',type:'THIRD_PARTY_PRE_ELECTION_COMPARATOR'},
  kahrelum:{path:'research/israel-2026-election/HEAD_TO_HEAD_LOCK_2026-10-28.json',sha256:sourceHash('HEAD_TO_HEAD_LOCK_2026-10-28.json'),issuedAt:head.KAHRELUM_anchor.issued_at,type:'POST_CLOSE_EXIT_POLL_CONDITIONED_NOWCAST_NOT_PREELECTION'}
 },
 scoringLimitation:'The Oct 27 KAHRELUM estimate was generated after poll close and exit polls. Its lower seat error is not pre-election predictive skill. No calibrated pre-election KAHRELUM winner-probability score can be inferred. Government formation is unresolved.',
 checkedAtUtc:new Date().toISOString(),
 outcome:'Likud is the largest list with 27 certified seats; no bloc reaches 61 seats; official government formation is a separate event.'
};
const target=path.join(ROOT,'election','israel-certified-2026.json');fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({target,kahrelum:result.scores.kahrelumPostClose,thirdParty:result.scores.externalOctober26,parties:parties.length,checksum:sourceHash('HEAD_TO_HEAD_LOCK_2026-10-28.json')},null,2));
