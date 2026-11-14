'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');

test('case share cards gain an authenticated GitHub hosted release without needing the offline Dell',()=>{
 const x=read('.github/workflows/firebase-scoped-release.yml');
 for(const value of ['workflow_dispatch:','push:','case-share-cards','KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_APPLICATION_CREDENTIALS','firebase-tools@15.34.2','--plan --profile','--preview --profile','--promote --profile']) assert.ok(x.includes(value),value);
 assert.match(x,/refs\/heads\/main|branches:\s*\[main\]/);
 assert.match(x,/case-social-pages\.cjs/);
 assert.doesNotMatch(x,/firebase deploy --only hosting/);
 assert.match(x,/verified readback|production readback/i);
});

test('only approved scopes can be sent to guarded publisher and missing credentials fail',()=>{
 const x=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(x,/^\s+if \[\[ -z "\$KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON" \]\]; then/m);
 assert.match(x,/exit 1/);
 for(const scope of ['case-share-cards','us-results-ui','nfl-sourcegrid-data','us-results-data','air02-publication']) assert.ok(x.includes(scope),scope);
 assert.match(x,/concurrency:/);
});

test('AIR-02 source reconciliation remains a release-allowed document without broadening live publication scope',()=>{
 const source=read('.github/workflows/firebase-scoped-release.yml');
 const gate=source.match(/elif grep -Fqx 'investigations\\/air-02\\.html' <<< "\\$changed"; then[\\s\\S]*?profiles="air02-publication"/);
 assert.ok(gate,'source-to-profile gate');
 assert.match(gate[0],/evidence\\/AIR-02_OSINT_RECONCILIATION_2026-11-14\\.md/);
 assert.match(gate[0],/\\*\\) echo "::error::AIR-02 publication includes unrelated path/);
 const release=read('scripts/firebase-overlay-release.cjs');
 const profile=release.match(/'air02-publication': \\{([\\s\\S]*?)\\n  \\},/);
 assert.ok(profile);
 assert.match(profile[0],/investigations\\/air-02\\.html/);
 assert.doesNotMatch(profile[0],/evidence\\/AIR-02_OSINT_RECONCILIATION_2026-11-14\\.md/);
});
