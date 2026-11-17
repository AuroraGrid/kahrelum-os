'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const KEY='dedc67db0c224b1c9a4be1379f7937f5';
const KEY_FILE=KEY+'.txt';

test('IndexNow key matches its root filename and is precisely 32 characters',()=>{
  assert.equal(read(KEY_FILE),KEY);
  assert.match(KEY,/^[0-9a-f]{32}$/);
});

test('Firebase has a single-path, cleanUrl-safe, readback-verified IndexNow profile',()=>{
  const code=read('scripts/firebase-overlay-release.cjs');
  const profile=code.match(/  'indexnow-key': \{([\s\S]*?)\n  \},/);
  assert.ok(profile,'separate authenticated release profile');
  assert.match(profile[1],/overlayFiles: \[INDEXNOW_KEY_FILE\]/);
  assert.match(profile[1],/sitemapRoutes: \[\]/);
  assert.match(profile[1],/includeHomepage: false/);
  assert.match(code,/const INDEXNOW_KEY_FILE = 'dedc67db0c224b1c9a4be1379f7937f5\.txt'/);
  assert.match(code,/IndexNow key file content does not match its basename/);
  assert.match(code,/IndexNow release attempted to change a path outside its exact key file/);
  assert.match(code,/IndexNow key readback failed/);
  assert.match(code,/profileName === 'indexnow-key'/);
});

test('IndexNow sitemap parsing rejects foreign, duplicate, invalid and redaction-restricted URLs',()=>{
  const {extractEligibleSitemapUrls}=require('../scripts/indexnow-notify.cjs');
  const valid='<urlset><url><loc>https://kahrelum.com/</loc></url><url><loc>https://kahrelum.com/investigations/chip-01</loc></url></urlset>';
  assert.deepEqual(extractEligibleSitemapUrls(valid),['https://kahrelum.com/','https://kahrelum.com/investigations/chip-01']);
  assert.throws(()=>extractEligibleSitemapUrls(valid.replace('https://kahrelum.com/</loc>','https://elsewhere.test/</loc>')),/off-host/i);
  assert.throws(()=>extractEligibleSitemapUrls(valid.replace('investigations/chip-01','investigations/court-01')),/restricted/i);
  assert.throws(()=>extractEligibleSitemapUrls(valid.replace('investigations/chip-01','investigations/court-05')),/restricted/i);
  assert.throws(()=>extractEligibleSitemapUrls(valid.replace('investigations/chip-01','')),/duplicate/i);
  assert.throws(()=>extractEligibleSitemapUrls('<urlset/>'),/empty/i);
});

test('IndexNow submission requires key proof on the public site before POST',()=>{
  const script=read('scripts/indexnow-notify.cjs');
  assert.match(script,/--submit/);
  assert.match(script,/indexnow\.org\/indexnow/);
  assert.match(script,/fetch\(keyUrl/);
  assert.match(script,/fetch\(SITEMAP_URL/);
  assert.match(script,/keyLocation/);
  assert.match(script,/response\.status === 200 \|\| response\.status === 202/);
  assert.match(script,/Do not claim indexing/);
  assert.doesNotMatch(script,/court-01.*urlList|court-05.*urlList/);
});
