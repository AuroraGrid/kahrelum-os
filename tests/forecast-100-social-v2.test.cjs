'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const image='assets/social/og-100-forecast-challenge-v2.png';
const source='assets/social/og-100-forecast-challenge-v2.svg';
const page='forecasting/100-forecast-challenge.html';

test('100-Forecast v2 social preview is an English legible 1200x630 raster with no historical lock changes',()=>{
 const svg=read(source);
 assert.match(svg,/viewBox="0 0 1200 630"/);
 for(const label of ['KAHRELUM','100','FORECASTS','AUDIT PENDING','OUTCOMES OPEN']) assert.ok(svg.includes(label),'missing English label '+label);
 const buf=fs.readFileSync(path.join(root,image));
 assert.deepEqual(Array.from(buf.subarray(0,8)),[137,80,78,71,13,10,26,10]);
 assert.equal(buf.readUInt32BE(16),1200);
 assert.equal(buf.readUInt32BE(20),630);
 const html=read(page);
 for(const tag of ['property="og:image"','property="og:image:secure_url"','name="twitter:image"']){
  const m=html.match(new RegExp('<meta '+tag+' content="([^"]+)"'));
  assert.ok(m,'missing '+tag);
  assert.equal(m[1],'https://kahrelum.com/'+image);
 }
 assert.ok(html.includes('Historical v1.0 timestamps unverified'));
 assert.ok(html.includes('1c0124e4431e941dfaf2cd57dac339f9b7488891'));
});
test('only designated scoped publisher serves social-card refresh',()=>{
 const script=read('scripts/firebase-overlay-release.cjs');
 const match=script.match(/  'forecast-100-publication': \{([\s\S]*?)\n  \},/);
 assert.ok(match,'scoped profile is missing');
 assert.ok(match[1].includes(image),'new asset is not scoped');
 assert.ok(match[1].includes(page),'forecast page must be updated');
 assert.ok(match[1].includes('includeHomepage: false'));
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.ok(workflow.includes('forecast-100-publication'));
 assert.ok(workflow.includes('forecasting/100-forecast-challenge.html'));
});