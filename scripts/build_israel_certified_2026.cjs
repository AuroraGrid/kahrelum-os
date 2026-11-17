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
 goldStatus:'OFFICIAL_CEC_MEMORANDUM_AND_ANNEX_2026_11_04; PDF_BYTES_AND_PUBLICATION_HOUR_NOT_VERIFIED',
 goldSourceUrls:[
 'https://www.gov.il/BlobFolder/generalpage/mandates/he/Memorandum%20-%20Results%20of%20the%2026th%20Knesset%20Elections.pdf',
 'https://www.gov.il/BlobFolder/generalpage/mandates/he/results_Appendix_to_the_memorandum_26th%20Knesset%20Elections.pdf',
 'https://www.gov.il/he/pages/mandates',
 'https://www.president.gov.il/%D7%A0%D7%A9%D7%99%D7%90-%D7%94%D7%9E%D7%93%D7%99%D7%A0%D7%94-%D7%A7%D7%99%D7%91%D7%9C-%D7%9C%D7%99%D7%93%D7%99%D7%95-%D7%90%D7%AA-%D7%AA%D7%95%D7%A6%D7%90%D7%95%D7%AA-%D7%94%D7%91%D7%97%D7%99%D7%A8/',
 'https://main.knesset.gov.il/mk/elections/pages/electionsresults26.aspx'
 ],
 goldProvenance:'Original CEC November 4 signed memorandum and annex establish 5,691,426 valid votes, 25,971 invalid ballots, 5,717,397 total ballots and the official 120-seat outcome. Earlier unofficial Knesset page reports 5,691,396 valid votes (30 fewer), retained as an explicitly superseded source-version discrepancy. Exact PDF upload time and binary hashes not in custody.',
 certifiedValidVotes:5691426,
 certifiedInvalidVotes:25971,
 certifiedTotalBallots:5717397,
 certifiedEligibleVoters:7331981,
 c7:{status:'CLOSED',goldDocumentDate:'2026-11-04',
  caseRecordUrl:'https://github.com/AuroraGrid/kahrelum-os/blob/68e12a07b7998a0267c4a345f3df6ce22229d89f/research/israel-2026-election/C7_OFFICIAL_RESULT_AND_CALIBRATION_2026-11-05.md',
  process:{pass:6,miss:4,blockedSubsidiaryCustody:'PDF binary hashes and first official upload hour not verified'},
  proprietaryWinnerBrier:'NOT_EVALUABLE',
  calibrationBasis:'14-list externally attributed pre-election seat comparator; MAE/L1/RMSE preregistered before election',
  missedMilestones:['C1 13m23s late','C3 25% contemporaneous count','C4 50% contemporaneous count','C5 75% contemporaneous count'],
  c2ExitPoll:'external sampled projection; not counted ballots',
  c6b:'11 post-count provisional winning-list seats matched official results; not a pre-election forecast',
  sourceCustodyLimits:['original CEC PDF byte hashes unavailable','visual PDF signature inspection incomplete','precise November 4 official upload hour not verified'],
  archiveComplete:'2026-11-05'},
 partyAliasCrosswalk:'B’Yachad/Together, UTJ/United Torah Judaism, Raam/Ra’am, Yisrael Beiteinu/Yisrael Beytenu, Religious Zionism-Zehut/Religious Zionism are identified crosswalks. Others exact.',
 cohort:{lists:14,seats:120},blocs:{netanyahu:53,opposition:48,arabLed:19,majority:61,blocsUnofficial:true},
 results:parties,scores:{kahrelumPostClose:score('kahrelumPostCloseSeats'),externalOctober26:score('externalOctober26Seats')},
 forecastSources:{
  externalOriginal:{path:'research/israel-2026-election/BASELINE_LOCK_2026-10-26.md',sha256:sourceHash('BASELINE_LOCK_2026-10-26.md'),cutoff:'2026-10-26T21:33:42.393Z',type:'THIRD_PARTY_PRE_ELECTION_COMPARATOR'},
  kahrelum:{path:'research/israel-2026-election/HEAD_TO_HEAD_LOCK_2026-10-28.json',sha256:sourceHash('HEAD_TO_HEAD_LOCK_2026-10-28.json'),issuedAt:head.KAHRELUM_anchor.issued_at,type:'POST_CLOSE_EXIT_POLL_CONDITIONED_NOWCAST_NOT_PREELECTION'}
 },
 scoringLimitation:'C7 process audit 6 PASS / 4 MISS, not a proprietary electoral win rate. The October 26 fourteen-list forecast is from a third party (L1 20, MAE 1.428571, RMSE 2.070197). The Oct 27 KAHRELUM seat estimate was generated after poll close and exit polls: its lower descriptive seat error is not pre-election predictive skill. No prospectively frozen proprietary winner/event probability existed; KAHRELUM election-outcome Brier NOT EVALUABLE. Government formation remains separate.',
 checkedAtUtc:new Date().toISOString(),
 outcome:'Likud is the largest list with 27 certified seats; no bloc reaches 61 seats; official government formation is a separate event.'
};
const target=path.join(ROOT,'election','israel-certified-2026.json');fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({target,kahrelum:result.scores.kahrelumPostClose,thirdParty:result.scores.externalOctober26,parties:parties.length,checksum:sourceHash('HEAD_TO_HEAD_LOCK_2026-10-28.json')},null,2));
