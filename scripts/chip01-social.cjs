'use strict';
// Original, deterministic, distinct public social images produced at guarded release time.
// These are editorial graphics, NOT photographs, physical chip evidence or findings of wrongdoing.
const {makeCaseImage}=require('./case-social-pages.cjs');
const specs=Object.freeze([
  {path:'/assets/social/og-investigations-chip-01.png',id:'CHIP-01',title:'NVIDIA MEGASPEED: CHIP CUSTODY UNDER REVIEW'},
  {path:'/assets/social/og-insights-nvidia-megaspeed-chip-custody.png',id:'INSIGHT-01',title:'WHO CAN TRACE THE AI CHIP SUPPLY CHAIN?'},
]);
function buildChip01SocialArtifacts(){
 return specs.map(item=>({...item,image:makeCaseImage(item)}));
}
module.exports={buildChip01SocialArtifacts};
