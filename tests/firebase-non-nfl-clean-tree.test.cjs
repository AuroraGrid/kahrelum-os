'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('CHIP-01 scoped publisher restores only generated editorial test bytes, not the source custody gate',()=>{
 const yaml=read('.github/workflows/firebase-scoped-release.yml');
 const start=yaml.indexOf('name: Restore clean Git tree after non-NFL art tests');
 const end=yaml.indexOf('name: Publicly custody compiled editorial assets in a clean Git commit');
 assert.ok(start>0 && end>start,'post-test non-NFL cleanup must precede NFL artifact custody');
 const bounded=yaml.slice(start,end);
 assert.match(bounded,/!contains\(steps\.scope\.outputs\.profiles, 'nfl-editorial-v2'\)/);
 assert.match(bounded,/git status --porcelain=v1 --untracked-files=all/);
 assert.match(bounded,/Unexpected changed\/untracked path/);
 assert.match(bounded,/git restore --source=HEAD --/);
 assert.match(bounded,/rm -f --/);
 assert.match(bounded,/Repo is still dirty after approved test-output cleanup/);
 for(const asset of [
  'og-nfl-trade-volume-challenge-2026-v2.png','og-nfl-trades-v2.png',
  'og-nfl-film-room-v2.png','og-nfl-analysis-v2.png','og-sports-v2.png',
  'og-nfl-deadline-watch-2026-v2.png','og-nfl-weekly-brief-v2.png',
  'og-insights-nfl-brier-accountability-v2.png','nfl-editorial-v2-manifest.json'
 ])assert.ok(bounded.includes(asset),'approved deterministic build asset required: '+asset);
 assert.match(yaml,/if: contains\(steps\.scope\.outputs\.profiles, 'nfl-editorial-v2'\)/);
 const publisher=read('scripts/firebase-overlay-release.cjs');
 assert.match(publisher,/Preview requires a clean Git working tree/);
 assert.match(publisher,/CHIP-01 publication attempted to change an unrelated live Firebase path/);
});
