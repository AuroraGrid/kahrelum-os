'use strict';
const assert=require('node:assert/strict');
const VERSION=/\/versions\/([a-f0-9]{16})$/;
const PREVIEW=/^safe-overlay-[a-f0-9]{12}$/;
function versionId(name){
 const id=(typeof name==='string'?name:'').match(VERSION)?.[1];
 if(!id)throw Error('Invalid Firebase version identity');
 return id;
}
async function reclaimPublishedPreviews({hosting,site,expectedLiveVersion,candidates,publishedVersionIds,historyComplete}){
 assert.equal(site,'kahrelum-public-hosting','Unexpected Hosting site');
 if(!expectedLiveVersion?.startsWith('projects/806087933597/sites/'+site+'/versions/'))throw Error('Unpinned live version');
 const expectedLiveId=versionId(expectedLiveVersion);
 if(historyComplete!==true || !(publishedVersionIds instanceof Set))throw Error('Live release history incomplete; refuse deletion');
 if(!Array.isArray(candidates)||candidates.length<1||candidates.length>12)throw Error('Invalid bounded preview candidates');
 const seen=new Set();
 for(const c of candidates){
  if(!c||!PREVIEW.test(c.id)||seen.has(c.id)||!versionId('/versions/'+c.versionId))throw Error('Preview not allowed');
  seen.add(c.id);
  if(!publishedVersionIds.has(c.versionId))throw Error('Preview was not previously published live: '+c.id);
 }
 const current=await hosting.getChannel('-',site,'live');
 if(current?.release?.version?.name!==expectedLiveVersion)throw Error('Current live version changed: refuse deletion');
 // Verify all targets before deleting any, fail closed on a changed preview.
 for(const c of candidates){
  const preview=await hosting.getChannel('-',site,c.id);
  if(!preview?.name?.endsWith('/sites/'+site+'/channels/'+c.id))throw Error('Preview channel identity changed: '+c.id);
  if(versionId(preview.release?.version?.name)!==c.versionId)throw Error('Preview version mismatch: '+c.id);
 }
 const deleted=[];
 for(const c of candidates){
  const liveAgain=await hosting.getChannel('-',site,'live');
  if(liveAgain?.release?.version?.name!==expectedLiveVersion)throw Error('Current live version changed during cleanup; refuse remaining deletion');
  const previewAgain=await hosting.getChannel('-',site,c.id);
  if(versionId(previewAgain.release?.version?.name)!==c.versionId)throw Error('Preview version mismatch before deletion');
  await hosting.deleteChannel('-',site,c.id);
  deleted.push(c.id);
  const liveAfter=await hosting.getChannel('-',site,'live');
  if(liveAfter?.release?.version?.name!==expectedLiveVersion)throw Error('Live version changed after preview deletion');
 }
 return {site,liveVersion:expectedLiveId,deleted:deleted.length,deletedChannelIds:deleted,deletedLiveFiles:0,note:'Historical promoted preview channels removed; associated storage may take 24 hours to reclaim.'};
}
module.exports={reclaimPublishedPreviews,versionId};
