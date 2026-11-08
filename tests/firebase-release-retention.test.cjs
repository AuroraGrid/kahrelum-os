'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('Firebase retention tooling is dry-run by default, never deletes live channel or files',()=>{
  const text=fs.readFileSync(path.join(root,'scripts/firebase-release-retention.cjs'),'utf8');
  assert.match(text,/--plan/);
  assert.match(text,/--apply/);
  assert.match(text,/--confirm-live-version/);
  assert.match(text,/retainedReleaseCount/);
  assert.doesNotMatch(text,/deleteChannel|deleteVersion|deleteFile/);
  assert.match(text,/version mismatch|live version changed/);
  assert.match(text,/deletion scheduled|scheduled for deletion/i);
});

test('retention keeps at least three rollback releases and binds to the exact live version',()=>{
  const {parseArgs,plan}=require('../scripts/firebase-release-retention.cjs');
  assert.throws(()=>parseArgs(['--apply','--keep','1','--confirm-live-version','x']),/3/);
  assert.throws(()=>parseArgs(['--apply','--keep','5']),/confirm-live-version/);
  const a=plan({name:'sites/kahrelum-public-hosting/channels/live',retainedReleaseCount:10,
    release:{version:{name:'projects/project-a/sites/kahrelum-public-hosting/versions/v123'}}},5);
  assert.equal(a.currentRetainedReleaseCount,10);
  assert.equal(a.targetRetainedReleaseCount,5);
  assert.equal(a.releaseVersion,'projects/project-a/sites/kahrelum-public-hosting/versions/v123');
  assert.equal(a.canApply,true);
  assert.equal(a.deletedLiveFiles,0);
});

test('separate manual workflow requires authenticated explicit apply mode, never a cron deletion',()=>{
 const yaml=fs.readFileSync(path.join(root,'.github/workflows/firebase-storage-maintenance.yml'),'utf8');
 assert.match(yaml,/workflow_dispatch/);
 assert.doesNotMatch(yaml,/schedule:/);
 assert.match(yaml,/KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON/);
 assert.match(yaml,/--plan --keep/);
 assert.match(yaml,/--apply --keep/);
 assert.match(yaml,/--confirm-live-version/);
 assert.doesNotMatch(yaml,/firebase deploy --only hosting/);
});
