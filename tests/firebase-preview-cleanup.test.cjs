'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {cleanupPromotedPreview}=require('../scripts/firebase-preview-cleanup.cjs');
const site='kahrelum-public-hosting', channel='safe-overlay-123456789abc',version='projects/806087933597/sites/kahrelum-public-hosting/versions/a1';
const channelState=(name,versionName)=>({name:'projects/806087933597/sites/'+site+'/channels/'+name,
  release:{version:{name:versionName}}});
function makeHosting({liveVersion=version,previewVersion=version}={}) {
 const calls=[];
 const api={
  getChannel:async(project,target,id)=>{calls.push(['get',id]);assert.equal(target,site);
    return id==='live'?channelState('live',liveVersion):channelState(channel,previewVersion)},
  deleteChannel:async(project,target,id)=>{calls.push(['delete',id]);assert.equal(id,channel);},
 };
 return {api,calls};
}
test('after verified promotion, redundant safe-overlay preview is deleted and live version stays pinned',async()=>{
 const {api,calls}=makeHosting();
 const out=await cleanupPromotedPreview(api,site,channel,version);
 assert.deepEqual(out,{status:'DELETED',channel,liveVersion:version});
 assert.deepEqual(calls.filter(x=>x[0]==='delete'),[['delete',channel]]);
 assert.deepEqual(calls.map(x=>x[1]),['live',channel,channel,'live']);
});
test('never delete a preview unless live has adopted that exact version',async()=>{
 const {api,calls}=makeHosting({liveVersion:'different-live-version'});
 await assert.rejects(cleanupPromotedPreview(api,site,channel,version),/live version/i);
 assert.equal(calls.filter(x=>x[0]==='delete').length,0);
});
test('never delete a renamed/mismatched preview or an archive channel',async()=>{
 const mismatch=makeHosting({previewVersion:'different-preview-version'});
 await assert.rejects(cleanupPromotedPreview(mismatch.api,site,channel,version),/preview version/i);
 assert.equal(mismatch.calls.filter(x=>x[0]==='delete').length,0);
 const holder=makeHosting();
 for(const id of ['live','archive-recovery-0123456789','safe-overlay-not-a-hash']) {
  await assert.rejects(cleanupPromotedPreview(holder.api,site,id,version),/safe-overlay/i);
 }
 assert.equal(holder.calls.filter(x=>x[0]==='delete').length,0);
});
test('production lifecycle triggers preview cleanup only after the release file map and verification pass',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../scripts/firebase-overlay-release.cjs'),'utf8');
 const verify=src.indexOf('const verification = await verifySurface(DOMAIN');
 const cleanup=src.indexOf('await cleanupPromotedPreview(hosting');
 assert.ok(verify>0 && cleanup>verify,'cleanup must follow production verification');
 assert.match(src,/previewCleanupWarning/);
 assert.match(src,/writeJson\(PRODUCTION_RECEIPT, productionReceipt\)/);
});
