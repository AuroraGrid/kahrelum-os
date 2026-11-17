'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Windows refresh daemon is bounded, non-interactive, auditable and preserves publisher task',()=>{
 const ps=file('scripts/refresh_us_results_task.ps1');
 assert.match(ps,/election\/results-2026-snapshot\.json|election\\results-2026-snapshot\.json/);
 assert.match(ps,/KAHRELUM-Israel-Live-2026/);
 assert.match(ps,/Disable-ScheduledTask/);
 assert.match(ps,/Enable-ScheduledTask/);
 assert.match(ps,/finally/);
 assert.match(ps,/GitSource|sourceSha256|sourceHash/);
 assert.match(ps,/LASTEXITCODE|ExitCode/);
 assert.match(ps,/Plan/); assert.match(ps,/Preview/); assert.match(ps,/Promote/);
 assert.match(ps,/AutoResults/);
 assert.doesNotMatch(ps,/--only hosting|firebase deploy --only/);
});
test('source daemon rejects called-winner regressions, stale input and skips no-op releases',()=>{
 const ps=file('scripts/refresh_us_results_task.ps1');
 assert.match(ps,/CALLED/);
 assert.match(ps,/COUNTING/);
 assert.match(ps,/sourceSha256/);
 assert.match(ps,/NO_CHANGE/);
 assert.match(ps,/log|receipt/i);
 assert.match(ps,/sourceLatestResultUpdatedUtc/);
});
test('automatic publisher updates only the US results snapshot, never frozen forecasts',()=>{
 const src=file('scripts/firebase-overlay-release.cjs');
 const m=src.match(/'us-results-data':\s*\{([\s\S]*?)\n\s*\},/);
 assert.ok(m);
 assert.match(m[1],/overlayFiles:\s*\['election\/results-2026-snapshot\.json'\]/);
 assert.match(m[1],/includeHomepage:\s*false/);
 assert.match(src,/profileName === 'us-results-data'/);
 assert.match(src,/item !== '\/election\/results-2026-snapshot.json'/);
});

test('scheduled task executes an out-of-tree, Git-hash-verified runner rather than removing its own tracked source',()=>{
 const installer=file('scripts/install_us_results_task.ps1');
 const runner=file('scripts/run_us_results_safe.ps1');
 const worker=file('scripts/refresh_us_results_task.ps1');
 assert.match(installer,/run_us_results_safe\.ps1/);
 assert.match(installer,/Copy-Item/);
 assert.match(runner,/Get-FileHash/);
 assert.match(runner,/git(?:\.exe)?\s+-C\s+\$Repo\s+rev-parse|git\s+-C\s+\$repo\s+rev-parse/);
 assert.match(runner,/scripts[\\/]refresh_us_results_task\.ps1|refresh_us_results_task\.ps1/);
 assert.match(runner,/Start-Process/);
 assert.match(runner,/RepoRoot/);
 assert.match(runner,/RedirectStandardError/);
 assert.match(runner,/ExitCode/);
 assert.match(worker,/param\(\[switch\]\$DryRun,\s*\[string\]\$RepoRoot\)/);
 assert.match(worker,/Resolve-Path.*RepoRoot/);
});
