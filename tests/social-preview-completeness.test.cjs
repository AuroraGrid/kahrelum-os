'use strict';
// The publisher must fix only the specific missing live social previews.
// Never republish a stale manifest or unrelated research records.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('historical case share release preserves current live generic social art and manifest',()=>{
 const text=read('scripts/firebase-overlay-release.cjs');
 const match=text.match(/  'case-share-cards': \{([\s\S]*?)\n  \},/);
 assert.ok(match,'case share release profile exists');
 assert.match(match[1],/overlayFiles: \[\]/,'do not overwrite older generic image or manifest from repository');
 assert.doesNotMatch(match[1],/social-manifest\.json/);
 assert.match(text,/buildCaseShareArtifacts\(/);
 assert.match(text,/Case share release attempted to replace an unrelated live Firebase path/);
});

test('legacy social repair is constrained to the only two missing live page images',()=>{
 const text=read('scripts/firebase-overlay-release.cjs');
 const match=text.match(/  'legacy-social-metadata': \{([\s\S]*?)\n  \},/);
 assert.ok(match,'distinct guarded release profile for missing legacy social tags');
 assert.match(match[1],/overlayFiles: \[\]/);
 assert.match(match[1],/legacySocialRoutes: \['\/pilot', '\/demo'\]/);
 assert.match(match[1],/sitemapRoutes: \[\]/);
 assert.match(match[1],/includeHomepage: false/);
 assert.match(text,/Legacy social metadata attempted to change an unrelated Firebase path/);
 assert.match(text,/if \(profile\.legacySocialRoutes\)/);
 assert.match(text,/replaceLegacySocialMetadata\(html, route, spec\)/);
});

test('legacy social repair validates Facebook and X meta tags and images during preview and readback',()=>{
 const text=read('scripts/firebase-overlay-release.cjs');
 assert.ok(text.includes("profileName === 'legacy-social-metadata'"));
 assert.match(text,/Legacy social metadata image mismatch/);
 assert.match(text,/og:image:width/);
 assert.match(text,/summary_large_image/);
 const yaml=read('.github/workflows/firebase-scoped-release.yml');
 assert.match(yaml,/legacy-social-metadata/);
 assert.doesNotMatch(yaml,/firebase deploy --only hosting/);
});
