'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../scripts/firebase-overlay-release.cjs'),'utf8');
test('publisher checks the selected JSON resource as JSON, never as a canonical HTML page',()=>{
  const start=source.indexOf("profileName === 'selected-forecast-performance-2026'\n    ? [");
  assert.ok(start>=0,'selected-performance verifiedRoutes branch exists');
  const end=source.indexOf("\n    : profileName === 'forecast-100-publication'", start);
  assert.ok(end>start,'HTML route list has a clear boundary');
  const routes=source.slice(start,end);
  assert.ok(!routes.includes("'/forecasting/selected-30-results-2026.json'"),'JSON resource must not get HTML canonical/meta checks');
  assert.ok(source.includes("fetchBytes(origin + '/forecasting/selected-30-results-2026.json')"),'JSON has independent explicit readback');
  assert.ok(source.includes("JSON.parse((await fetchBytes(origin + '/forecasting/selected-30-results-2026.json'))"),'JSON payload parsed and validated');
});
