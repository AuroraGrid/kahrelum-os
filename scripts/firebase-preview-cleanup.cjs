'use strict';
// Only remove a generated preview after exact live adoption and verified readback.
async function cleanupPromotedPreview(hosting, site, channel, version, options = {keepPreview: process.env.KAHRELUM_KEEP_PREVIEW === '1'}) {
  if (!/^safe-overlay-[a-f0-9]{12}$/.test(channel)) {
    throw new Error('Only generated safe-overlay previews may be reclaimed.');
  }
  if (!/^projects\/[^/]+\/sites\/[^/]+\/versions\/[a-zA-Z0-9_-]+$/.test(version) ||
      !version.includes('/sites/' + site + '/')) {
    throw new Error('Preview cleanup lacks a matching version identity.');
  }
  const live=await hosting.getChannel('-',site,'live');
  if (live?.release?.version?.name!==version) {
    throw new Error('Preview cleanup refused: live version is not the verified promoted version.');
  }
  const preview=await hosting.getChannel('-',site,channel);
  if (!preview) return {status:'ALREADY_ABSENT',channel,liveVersion:version};
  if (preview.release?.version?.name!==version) {
    throw new Error('Preview cleanup refused: preview version differs from verified release.');
  }
  // Process-only KAHRELUM_KEEP_PREVIEW=1 retains the verified preview; all identity guards still apply.
  if (options.keepPreview) return {status:'RETAINED',channel,liveVersion:version};
  await hosting.deleteChannel('-',site,channel);
  const after=await hosting.getChannel('-',site,'live');
  if (after?.release?.version?.name!==version) {
    throw new Error('Preview cleanup detected a concurrent live release; no rollback is inferred.');
  }
  return {status:'DELETED',channel,liveVersion:version};
}
module.exports={cleanupPromotedPreview};