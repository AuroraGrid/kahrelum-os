'use strict';
// Dry-run-first Firebase Hosting retention control. Does not remove live paths.
// A reduced retention count schedules older historical releases for reclamation;
// Firebase can take up to 24 hours to reclaim their content.
const fs = require('node:fs');
const path = require('node:path');

const SITE = 'kahrelum-public-hosting';
const livePrefix = 'projects/';
const versionPattern = /^projects\/[^/]+\/sites\/kahrelum-public-hosting\/versions\/[A-Za-z0-9_-]+$/;

function parseArgs(argv) {
  const modes = argv.filter(x => x === '--plan' || x === '--apply');
  if (modes.length > 1) throw new Error('Choose --plan or --apply');
  const mode = modes[0] || '--plan';
  const keepIndex = argv.indexOf('--keep');
  const keep = keepIndex === -1 ? 5 : Number(argv[keepIndex+1]);
  if (!Number.isInteger(keep) || keep < 3 || keep > 20) {
    throw new Error('At least 3 and at most 20 previous live releases must be retained.');
  }
  const idx = argv.indexOf('--confirm-live-version');
  const confirmVersion = idx < 0 ? null : argv[idx + 1];
  if (mode === '--apply' && (!confirmVersion || !versionPattern.test(confirmVersion))) {
    throw new Error('--apply requires --confirm-live-version with the full exact current Firebase version name.');
  }
  return {mode, keep, confirmVersion};
}

function plan(channel, target) {
  if (!channel || !/\/channels\/live$/.test(channel.name || '') || !channel.release?.version?.name ||
      !versionPattern.test(channel.release.version.name)) {
    throw new Error('Not the expected finalized live Hosting channel.');
  }
  const current = Number.isInteger(channel.retainedReleaseCount) ? channel.retainedReleaseCount : 10;
  if (current < 1 || current > 100) throw new Error('Unsupported existing retention value.');
  return {
    site: SITE,
    releaseVersion: channel.release.version.name,
    currentRetainedReleaseCount: current,
    targetRetainedReleaseCount: Math.min(current, target),
    canApply: current > target,
    deletedLiveFiles: 0,
    protectsCurrentRelease: true,
    // Storage reclaim occurs asynchronously after a retention update.
    note: current > target ? 'Old historical releases over target are scheduled for deletion, not instantly reclaimed.' :
      'No reduction needed; no releases deleted.',
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cliRoot = process.env.FIREBASE_TOOLS_ROOT;
  if (!cliRoot || !fs.existsSync(cliRoot)) throw new Error('Authenticated Firebase CLI module unavailable.');
  const firebase = require(cliRoot);
  const hosting = require(path.join(cliRoot,'lib/hosting/api'));
  const {Client} = require(path.join(cliRoot,'lib/apiv2'));
  const {hostingApiOrigin} = require(path.join(cliRoot,'lib/api'));
  await firebase.projects.list({json:true,nonInteractive:true});
  const client = new Client({urlPrefix:hostingApiOrigin(),apiVersion:'v1beta1',auth:true});
  const live = await hosting.getChannel('-', SITE, 'live');
  const proposal = plan(live,args.keep);
  if (args.mode === '--plan') {
    process.stdout.write(JSON.stringify({...proposal,mode:'PLAN',deletionScheduled:false},null,2)+'\n');
    return;
  }
  if (args.confirmVersion !== proposal.releaseVersion) {
    throw new Error('Current live version mismatch; rerun --plan before changing retention.');
  }
  if (!proposal.canApply) {
    process.stdout.write(JSON.stringify({...proposal,mode:'NO_CHANGE',deletionScheduled:false},null,2)+'\n');
    return;
  }
  const again = await hosting.getChannel('-', SITE, 'live');
  if (again?.release?.version?.name !== args.confirmVersion) {
    throw new Error('live version changed after preflight; refusing retention adjustment.');
  }
  const patch = await client.patch('/sites/'+SITE+'/channels/live',
    {retainedReleaseCount:args.keep},
    {queryParams:{updateMask:'retainedReleaseCount'}});
  if (!patch.body || patch.body.retainedReleaseCount !== args.keep) {
    throw new Error('Retention update was not confirmed by the Hosting API.');
  }
  const after = await hosting.getChannel('-',SITE,'live');
  if (after?.release?.version?.name !== args.confirmVersion ||
      after.retainedReleaseCount !== args.keep) {
    throw new Error('Retention readback mismatch; live metadata must be inspected.');
  }
  process.stdout.write(JSON.stringify({
    site:SITE,
    mode:'APPLIED',
    liveVersion:args.confirmVersion,
    retainedPreviousReleases:args.keep,
    deletionScheduled:true,
    deletedLiveFiles:0,
    note:'Old releases beyond the new retention limit are scheduled for deletion by Firebase, not immediately removed.',
  },null,2)+'\n');
}
if(require.main===module) main().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={parseArgs,plan};
