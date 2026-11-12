'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {reclaimPublishedPreviews}=require('../scripts/firebase-safe-preview-reclaim.cjs');
const site='kahrelum-public-hosting';
const prefix='projects/806087933597/sites/'+site+'/versions/';
const live=prefix+'aaaaaaaaaaaaaaaa';
const candidates=[
 {id:'safe-overlay-111111111111',versionId:'bbbbbbbbbbbbbbbb'},
 {id:'safe-overlay-222222222222',versionId:'aaaaaaaaaaaaaaaa'},
];
function setup({actualLive=live,changePreview=false}={}){
 const channels=new Map([
  ['safe-overlay-111111111111',prefix+(changePreview?'dddddddddddddddd':'bbbbbbbbbbbbbbbb')],
  ['safe-overlay-222222222222',live],
  ['archive-recovery-123',prefix+'cccccccccccccccc'],
 ]);
 const deletions=[];
 const hosting={
  getChannel:async(_project,actualSite,id)=>{
   assert.equal(actualSite,site);
   if(id==='live')return {name:'projects/806087933597/sites/'+site+'/channels/live',release:{version:{name:actualLive}}};
   const v=channels.get(id);
   if(!v)throw Error('404 Not Found');
   return {name:'projects/806087933597/sites/'+site+'/channels/'+id,release:{version:{name:v}}};
  },
  deleteChannel:async(_project,actualSite,id)=>{
   assert.equal(actualSite,site);
   if(id==='live'||!channels.has(id))throw Error('would delete forbidden channel');
   deletions.push(id);channels.delete(id);
  }
 };
 return {hosting,channels,deletions};
}
const args={site,expectedLiveVersion:live,candidates,historyComplete:true,publishedVersionIds:new Set(['aaaaaaaaaaaaaaaa','bbbbbbbbbbbbbbbb'])};
test('deletes only exact, historically live generated previews and preserves live and archives',async()=>{
 const {hosting,channels,deletions}=setup();
 const result=await reclaimPublishedPreviews({...args,hosting});
 assert.deepEqual(deletions,candidates.map(x=>x.id));
 assert.equal(result.deleted,2);
 assert.ok(channels.has('archive-recovery-123'));
});
test('requires complete verified promotion history, not just a preview name',async()=>{
 const {hosting,deletions}=setup();
 await assert.rejects(reclaimPublishedPreviews({...args,hosting,historyComplete:false}),/incomplete/i);
 assert.equal(deletions.length,0);
});
test('live version change fails closed before any deletion',async()=>{
 const {hosting,deletions}=setup({actualLive:prefix+'dddddddddddddddd'});
 await assert.rejects(reclaimPublishedPreviews({...args,hosting}),/live version/i);
 assert.equal(deletions.length,0);
});
test('mismatched preview aborts all deletes, including otherwise safe previews',async()=>{
 const {hosting,deletions}=setup({changePreview:true});
 await assert.rejects(reclaimPublishedPreviews({...args,hosting}),/preview version/i);
 assert.equal(deletions.length,0);
});
test('unpublished versions and recovery archive names are never deleted',async()=>{
 for(const override of [
  {candidates:[{id:'archive-recovery-123',versionId:'cccccccccccccccc'}],publishedVersionIds:new Set(['cccccccccccccccc'])},
  {publishedVersionIds:new Set(['aaaaaaaaaaaaaaaa'])}
 ]){
  const {hosting,deletions}=setup();
  await assert.rejects(reclaimPublishedPreviews({...args,hosting,...override}),/not allowed|not previously published/i);
  assert.equal(deletions.length,0);
 }
});
