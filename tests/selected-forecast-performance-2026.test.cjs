'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const json=name=>JSON.parse(read(name));
test('selected portfolio discloses exactly thirty individually scored entries without claiming a full record',()=>{
  const d=json('forecasting/selected-30-results-2026.json');
  assert.equal(d.status,'SELECTED_PERFORMANCE_SHOWCASE_NOT_FULL_RECORD');
  assert.equal(d.records.length,30);
  assert.equal(new Set(d.records.map(x=>x.id)).size,30);
  const sourceCounts=Object.groupBy(d.records,x=>x.scoringSource);
  assert.equal(sourceCounts.GJO.length,21);
  assert.equal(sourceCounts.ARGON.length,7);
  assert.equal(sourceCounts.CAL_DRILL_005.length,2);
  for(const entry of d.records){
    assert.ok(typeof entry.label==='string'&&entry.label.length>5);
    assert.ok(Number.isFinite(entry.reportedBrier)&&entry.reportedBrier>=0&&entry.reportedBrier<=2,entry.id);
    assert.ok(typeof entry.evidenceBasis==='string'&&entry.evidenceBasis.length>12,entry.id);
  }
  const total=d.records.reduce((n,x)=>n+x.reportedBrier,0);
  assert.ok(Math.abs(total-4.4960)<0.00001,'Displayed Brier values sum to 4.4960');
  assert.ok(Math.abs(total/d.records.length-0.14986666666666667)<0.00001);
  assert.match(d.methodology.join(' '),/different|heterogeneous|not comparable/i);
  assert.match(d.selectionDisclosure,/selected|curated|excluded/i);
});
test('public selected-performance page exposes source boundaries and keeps original seven-case page intact',()=>{
  const page=read('forecasting/selected-forecast-performance-2026.html');
  for(const token of ['0.1499','30 selected','4.4960','not the overall','mixed scoring','21 Good Judgment','7 ARGON','2 CAL-DRILL','/forecasting/100-forecast-challenge','/insights/calibration-oct-nov-2026','/forecasting/selected-30-results-2026.json']) assert.ok(page.toLowerCase().includes(token.toLowerCase()),token);
  assert.match(page,/selected|curated/i);
  assert.match(page,/not a standardized|not a calibration/i);
  assert.ok(!/elite (?:certified|rank|status)/i.test(page));
  const original=read('insights/calibration-oct-nov-2026.html');
  assert.ok(original.includes('0.1444')&&original.includes('Every prospective case, including misses'));
});
test('updated challenge displays two independently verified resolutions without rewriting frozen v1.4 dataset',()=>{
  const html=read('forecasting/100-forecast-challenge.html');
  for(const needle of ['2 verified','98 pending','KAH-100-BIZ-007-V14','KAH-100-AIT-002-V14','0.0400','0.1521','NO','YES','https://www.sec.gov/Archives/edgar/data/1341439/000119312526470351/orcl-20261118.htm']) assert.ok(html.includes(needle),needle);
  const frozen=json('forecasting/100-forecast-v1.4.json');
  assert.equal(frozen.resolvedCount,0);
  assert.equal(frozen.records.length,100);
  assert.ok(html.includes('original frozen snapshot'));
  assert.ok(html.includes('Brier scores are not available'));
});
test('scoped publisher has gated selected-performance profile and preserves unrelated live files',()=>{
  const pub=read('scripts/firebase-overlay-release.cjs');
  const workflow=read('.github/workflows/firebase-scoped-release.yml');
  for(const part of ['selected-forecast-performance-2026','forecasting/selected-forecast-performance-2026.html','forecasting/selected-30-results-2026.json']) assert.ok(pub.includes(part)&&workflow.includes(part),part);
  assert.ok(pub.includes('verifiedLiveFile(live, \'/index.html\', \'/\')'));
  assert.ok(pub.includes('forecast-performance-2026-homepage'));
  assert.ok(read('forecasting.html').includes('/forecasting/selected-forecast-performance-2026'));
  assert.ok(read('sitemap.md').includes('/forecasting/selected-forecast-performance-2026'));
});
