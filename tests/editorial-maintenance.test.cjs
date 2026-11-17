const test=require('node:test'),assert=require('node:assert/strict');
const {patchHomepageC7}=require('../scripts/release3-live-patches.cjs');
const {patchCompletionPage}=require('../scripts/site-completion.cjs');
test('current election source receipt checkout keeps canonical LF hash bytes',()=>{
 const cp=require('node:child_process');
 const result=cp.execFileSync('git',['check-attr','eol','--','research/election-challenge-2026/current-sources/vote-predictor-20261112T124414Z.json'],{cwd:require('node:path').join(__dirname,'..'),encoding:'utf8'});
 assert.match(result,/: eol: lf/);
});
const updated='The November 4 Israeli CEC result and November 5 KAHRELUM C7 audit are complete; see the dated certified-result comparison and limitations.';
test('C7 patch consumes the complete pending sentence without an orphaned suffix',()=>{
 const before='<p>Experimental, post-close forecasts. Official results and final accuracy remain pending until verified.</p>';
 const after=patchHomepageC7(before,'Israel 2026 election: C7 completed');
 assert.equal(after,'<p>Experimental, post-close forecasts. '+updated+'</p>');
 assert.equal(patchHomepageC7(after,'Israel 2026 election: C7 completed'),after);
});
test('C7 patch repairs the exact observed production orphan without touching surrounding evidence',()=>{
 const before='<p>'+updated+' until verified.</p><p>Original forecast lock</p>';
 assert.equal(patchHomepageC7(before,'Israel 2026 election: C7 completed'),'<p>'+updated+'</p><p>Original forecast lock</p>');
});
test('completion patch also repairs observed live suffix idempotently',()=>{
 const prefix='<head><link rel="canonical" href="https://kahrelum.com/"></head>';
 const source=prefix+'<main><h1>Evidence</h1></main>';
 const before=prefix+'<main><p>'+updated+' until verified.</p></main>';
 const after=patchCompletionPage(before,source,'/');
 assert.ok(!after.includes('until verified.'));assert.ok(after.includes(updated));
 assert.equal(patchCompletionPage(after,source,'/'),after);
});
test('unexpected duplicate C7 claim blocks rather than making a partial correction',()=>{
 assert.throws(()=>patchHomepageC7('Official results and final accuracy remain pending '.repeat(2),'Israel 2026 election: C7 completed'));
});

test('scoped Firebase publication accepts only the audited homepage maintenance files',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/firebase-scoped-release.yml'),'utf8');
 const head="elif grep -Fqx 'scripts/site-completion.cjs'";
 const begin=workflow.indexOf(head);
 assert.ok(begin>=0,'site-completion release gate exists');
 const end=workflow.indexOf('profiles="site-completion"',begin);
 assert.ok(end>begin,'site-completion profile decision exists');
 const gate=workflow.slice(begin,end);
 for(const p of ['.gitattributes','scripts/release3-live-patches.cjs','tests/editorial-maintenance.test.cjs','research/website-editorial-ops/*']){
  assert.ok(gate.includes(p),'explicit audited source path allowed: '+p);
 }
 assert.ok(!gate.includes('research/*')&&!gate.includes('*.html'),'no broad research or html allowlist');
});
