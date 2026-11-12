'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('replayed NFL scoped publisher verifies an existing public receipt instead of pushing a divergent duplicate commit',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/firebase-scoped-release.yml'),'utf8');
 const begin=workflow.indexOf('      - name: Publicly custody compiled editorial assets in a clean Git commit');
 const end=workflow.indexOf('      - name: Publish scoped preview, then promote with exact production readback');
 assert.ok(begin>0&&end>begin);
 const segment=workflow.slice(begin,end);
 assert.match(segment,/remote_sha="\$\(git ls-remote origin "refs\/heads\/\$receipt_branch"/);
 assert.match(segment,/if \[\[ -n "\$remote_sha" \]\]; then/);
 assert.match(segment,/git fetch --no-tags origin "refs\/heads\/\$receipt_branch"/);
 assert.match(segment,/remote_tree="\$\(git rev-parse FETCH_HEAD\^\{tree\}\)"/);
 assert.match(segment,/local_tree="\$\(git rev-parse HEAD\^\{tree\}\)"/);
 assert.match(segment,/Existing public artifact receipt differs from regenerated source/);
 assert.match(segment,/else[\s\S]*git push origin "HEAD:refs\/heads\/\$receipt_branch"/);
 assert.match(segment,/Remote artifact custody readback failed/);
 assert.doesNotMatch(segment,/(?:--force|force-with-lease|git push origin HEAD:refs\/heads\/main)/);
});

test('November 12 NFL outcome description signals unresolved effective-date rules rather than a fabricated six-trade hit',()=>{
 const html=fs.readFileSync(path.join(root,'nfl/trade-volume-challenge-2026.html'),'utf8');
 assert.match(html,/<meta name="description" content="[^"]*November 12[^"]*date-boundary review[^"]*"/i);
 assert.match(html,/id="nfl-nov12-outcome-update"/);
 assert.match(html,/FC1 scoring held pending date-rule reconciliation/);
});
