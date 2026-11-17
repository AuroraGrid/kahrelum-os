const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../scripts/firebase-overlay-release.cjs'),'utf8');
test('MQA plan never fetches an unpublished article; live verification belongs after preview creation',async()=>{
 const plan=source.slice(source.indexOf('async function buildOverlay'),source.indexOf('async function captureApiHashes'));
 const block=plan.match(/  if \(profileName === 'mqa001-review'\) \{([\s\S]*?)\n  \}/)[1];
 assert.ok(!/\borigin\b|\bchecks\b|fetchBytes/.test(block));
 const run=new Function('RELEASE_PROFILES','changedPaths','fail',block);
 const profiles={'mqa001-review':{overlayFiles:['insights/morgan-dollar-quote.html']}};
 run(profiles,['/insights/morgan-dollar-quote.html'],m=>{throw Error(m)});
 assert.throws(()=>run(profiles,['/index.html'],m=>{throw Error(m)}),/unrelated/);
 const verify=source.slice(source.indexOf('async function verifySurface'),source.indexOf('function canonicalVersionName'));
 assert.ok(verify.includes("fetchBytes(origin + route)"));
 assert.ok(verify.includes('MQA-001 evidence boundary missing'));
 assert.ok(verify.includes('MQA-001 social image readback failed'));
 assert.ok(verify.includes("? ['/insights/morgan-dollar-quote', '/insights']"));
});
