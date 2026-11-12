'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const route='/insights/calibration-oct-nov-2026';
const card='assets/social/og-calibration-oct-nov-2026.png';
test('calibration article presents verified arithmetic, seven prospective cases and separate gate drill',()=>{
 const html=read('insights/calibration-oct-nov-2026.html');
 for(const token of ['0.1444','71.4%','5 of 7','42.2%','0.2500','0.1264','CAL-DRILL-002-CASE-1','CAL-DRILL-002-CASE-2','CAL-DRILL-002-CASE-3','CAL-DRILL-003','PROD-MISSION-001','PROD-MISSION-002','PROD-MISSION-003']) assert.ok(html.includes(token),token);
 assert.match(html,/seven prospective|seven live/i);
 assert.match(html,/small cohort|small sample/i);
 assert.match(html,/Gate drill/i);
 assert.match(html,/October 20.*(missed|did not run|failed)/is);
 assert.match(html,/uncertainty|adjudication/i);
 assert.ok(html.includes('https://docs.google.com/spreadsheets/d/1pB9SF6Cj7D-Ch0wW92QZfP2YuHT69Wq8QNAbGAVjL30/edit'));
});
test('new article has distinct complete Open Graph and X social image',()=>{
 const html=read('insights/calibration-oct-nov-2026.html');
 assert.ok(html.includes('href="https://kahrelum.com'+route+'"'));
 for(const t of ['property="og:image" content="https://kahrelum.com/'+card+'"',
   'name="twitter:image" content="https://kahrelum.com/'+card+'"',
   'property="og:image:width" content="1200"',
   'property="og:image:height" content="630"','name="twitter:card" content="summary_large_image"']) assert.ok(html.includes(t),t);
 const b=fs.readFileSync(path.join(root,card));
 assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]); assert.equal(b.readUInt32BE(16),1200);assert.equal(b.readUInt32BE(20),630);
 assert.ok(!html.includes('og-nfl-trade-volume-challenge-2026-v2.png'));
});
test('site and NFL challenge link to article without falsely certifying FC1',()=>{
 const forecasting=read('forecasting.html'), insights=read('insights.html'), nfl=read('nfl/trade-volume-challenge-2026.html');
 for(const html of [forecasting,insights,nfl]) assert.ok(html.includes(route));
 for(const t of ['OUTCOME NOT YET ADJUDICATED','five club-date','seven register-date','0.077813821138','0.065040650407']) assert.ok(nfl.toLowerCase().includes(t.toLowerCase()),t);
});
test('dedicated Firebase profile is tightly scoped and retains NFL preview',()=>{
 const script=read('scripts/firebase-overlay-release.cjs');
 const match=script.match(/  'calibration-nfl-2026': \{([\s\S]*?)\n  \},/);assert.ok(match,'Publisher must support dedicated profile');
 for(const token of ['forecasting.html','insights.html','nfl/trade-volume-challenge-2026.html',card,'insights/calibration-oct-nov-2026.html']) assert.ok(match[1].includes(token),token);
 assert.doesNotMatch(match[1],/forecast-ledger|sourcegrid|current-forecasts|desk-live/i);
 assert.ok(match[1].includes('includeHomepage: false'));
 const workflow=read('.github/workflows/firebase-scoped-release.yml');
 assert.ok(workflow.includes('calibration-nfl-2026'));
 assert.ok(workflow.includes('insights/calibration-oct-nov-2026.html'));
 assert.ok(read('sitemap.md').includes(route));
});