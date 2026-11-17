'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {makeCaseImage}=require('./case-social-pages.cjs');
const ROOT=path.resolve(__dirname,'..');
function buildAir02Image(){
 const item={id:'AIR-02',title:'FAA Nationwide Ground Stop / Communications Failure Undetermined'};
 return makeCaseImage(item);
}
if(require.main===module){
 const bytes=buildAir02Image();
 fs.writeFileSync(path.join(ROOT,'assets/social/og-air02-v1.png'),bytes);
}
module.exports={buildAir02Image};
