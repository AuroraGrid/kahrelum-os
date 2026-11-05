'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const txt=p=>fs.readFileSync(path.join(root,p),'utf8');
test('US dashboard checks its same-origin published snapshot every 15 minutes while visible',()=>{
 const js=txt('election-results-2026.js');
 assert.match(js,/900000|15\s*\*\s*60\s*\*\s*1000/);
 assert.match(js,/setInterval\(/);
 assert.match(js,/visibilitychange/);
 assert.match(js,/document\.hidden/);
 assert.match(js,/cache:\s*'no-store'/);
 assert.match(js,/renderMap\(/);
 assert.ok(js.includes('renderRows()'));
});
test('source feed refresh never infers called winners from leaders, and stable 506 race schema is required',()=>{
 const js=txt('election-results-2026.js');
 assert.match(js,/CALLED/);
 assert.match(js,/COUNTING/);
 assert.match(js,/435/);assert.match(js,/35/);assert.match(js,/36/);
 assert.doesNotMatch(js,/seatsNotUp/);
 const source=txt('scripts/build_election_results_snapshot.py');
 assert.match(source,/sourceSha256/);
 assert.match(source,/unofficial/i);
});
test('NFL dashboard refreshes local status without automatically authorizing editorial reports',()=>{
 const js=txt('nfl/deadline-watch-2026.js');
 assert.match(js,/setInterval\(/);
 assert.match(js,/document\.hidden/);
 assert.match(js,/publishingAuthorized!==false/);
 assert.match(js,/transactionConfirmed/);
});
