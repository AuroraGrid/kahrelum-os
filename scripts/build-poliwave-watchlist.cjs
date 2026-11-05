'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const map=require('../election-challenge-map.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const races=map.buildRaces(read('election/house-forecast-lock.json'),read('election/current-projections.json'));
assert.equal(races.length,470,'KAHRELUM election source roster changed; review before rebuilding');
const records=races.map(race=>{
  const poliwaveUrl=map.poliwaveRaceUrl(race);
  assert.ok(poliwaveUrl,'No Poliwave state/office link for '+race.contestId);
  return {
    contestId:race.contestId,office:'US_'+race.chamber.toUpperCase(),
    state:race.state,chamber:race.chamber,
    poliwaveUrl,resultStatus:'NOT_IMPORTED',officialCertification:'NOT_VERIFIED'
  };
});
assert.equal(new Set(records.map(r=>r.contestId)).size,470,'Expected unique contest IDs');
const watchlist={
 schema:'KAHRELUM_POLIWAVE_FIRST_LOOK_WATCHLIST_V1',
 electionDate:'2026-11-03',
 status:'LINK_REFERENCE_ONLY_NO_IMPORTED_POLIWAVE_DATA',
 primaryMonitoringReference:'Poliwave',
 primaryReferenceUrl:'https://www.poliwave.com/us/live/midterms-2026',
 licenseUrl:'https://www.poliwave.com/about/licensing',
 referenceScope:'All 470 KAHRELUM tracked US House and Senate contests, not a claim that Poliwave is certified or complete.',
 coverage:{house:records.filter(r=>r.chamber==='House').length,senate:records.filter(r=>r.chamber==='Senate').length},
 policy:{
  copiedVotes:false,automatedBulkExtraction:false,officialStateCertificationRequired:true,
  independentCallVerification:true,lockedForecastsImmutable:true,
  publicResultsUse:'External link only; numbers and calls are not imported or rehosted.',
  unavailableSourceHandling:'Record unavailable or delayed. Do not infer zero votes, an outcome, or a winner.'
 },
 records
};
const out=path.join(root,'election/poliwave-watchlist.json');
const encoded=JSON.stringify(watchlist,null,2)+'\n';
if(process.argv.includes('--write')){
 fs.writeFileSync(out,encoded);console.log('WROTE '+records.length+' first-look references at '+out);
}else if(process.argv.includes('--check')){
 assert.equal(fs.readFileSync(out,'utf8'),encoded,'Watchlist out of sync with source roster');
 console.log('CHECKED '+records.length+' reference-only race links');
}else {throw Error('Use --write or --check');}
