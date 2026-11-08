'use strict';
// CHIP-01 original editorial art custody. Both assets are original conceptual graphics,
// not photographs or documentary evidence of a chip transaction. Their exact hashes
// preserve the selected image rather than substituting the default generated card.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {makeCaseImage} = require('./case-social-pages.cjs');
const specs = Object.freeze([
  {path:'/assets/social/og-investigations-chip-01.png', id:'CHIP-01',
   title:'NVIDIA MEGASPEED: CHIP CUSTODY UNDER REVIEW',
   expectedSha256:'8be30ef7477710c54a5975e4ba9385ff77ab7b2a0d379e0df35c64b45d6a0bd6'},
  {path:'/assets/social/og-insights-nvidia-megaspeed-chip-custody.png', id:'INSIGHT-01',
   title:'WHO CAN TRACE THE AI CHIP SUPPLY CHAIN?',
   expectedSha256:'3da0c4e0ef1fd3dcbe26326060ae80669ca90ede3dfd54aea66da9702168eebc'},
]);
function buildChip01SocialArtifacts() {
  return specs.map(item => {
    const filename = path.join(__dirname, '..', item.path.slice(1));
    const approvedArt = fs.existsSync(filename);
    const image = approvedArt ? fs.readFileSync(filename) : makeCaseImage(item);
    if (image.subarray(1, 4).toString('ascii') !== 'PNG' ||
        image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630) {
      throw new Error('Invalid CHIP-01 social card dimensions: ' + item.path);
    }
    if (approvedArt &&
        crypto.createHash('sha256').update(image).digest('hex') !== item.expectedSha256) {
      throw new Error('CHIP-01 approved image changed without review: ' + item.path);
    }
    return {...item, image, approvedArt};
  });
}
module.exports = {buildChip01SocialArtifacts};
