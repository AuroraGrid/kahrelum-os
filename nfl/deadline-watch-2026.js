'use strict';
(()=>{const $=x=>document.getElementById(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https=u=>{try{const o=new URL(u);return o.protocol==='https:'?o.href:null}catch{return null}};
const renderSource=(u,label)=>{const x=https(u);return x?'<a href="'+esc(x)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':esc(label)};
const dt=t=>{const x=new Date(t);return Number.isNaN(x.valueOf())?'Unverified time':x.toLocaleString('en-US',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})+' UTC'};
async function get(u){const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error(u+' HTTP '+r.status);return r.json()}
function dealCard(d){return '<article class="card"><span class="label">Source-confirmed / '+esc(d.date)+'</span><h3>'+esc(d.player)+'</h3><p><strong>'+esc(d.movement)+'</strong></p><p>'+esc(d.consideration)+'</p><p>'+renderSource(d.sourceUrl,'Original team or NFL record')+'</p></article>'}
function watchCard(d){return '<article class="card"><span class="label pending">Historical watchlist, not a current trade claim</span><h3>'+esc(d.player)+'</h3><p>'+esc(d.from)+' → '+esc(d.to)+'</p><p>'+esc(d.detail)+'</p><p>'+renderSource(d.sourceUrl,'Original reporting')+'</p></article>'}
function approvedCard(d){const confirmed=d.transactionConfirmed===true;return '<article class="card"><span class="label '+(confirmed?'':'pending')+'">'+(confirmed?'Archived confirmed transaction':'Archived editorial report')+'</span><h3>'+esc(d.headline)+'</h3><p>'+esc(d.claim)+'</p><p>'+renderSource(d.sourceUrl,'Read source')+' · reviewed '+esc(dt(d.reviewedAtUtc))+'</p></article>'}
function validateReconciliation(o){
 if(!o||o.schema!=='KAHRELUM_NFL_2026_POSTDEADLINE_AUDIT_V1'||o.status!=='POST_DEADLINE_RECONCILED'||o.deadlineUtc!=='2026-11-10T21:00:00Z')throw Error('Unsupported post-deadline source');
 if(!Array.isArray(o.confirmedTrades)||o.confirmedTrades.length!==17||o.tradeCountInSeason!==17||new Set(o.confirmedTrades.map(x=>x.player)).size!==17)throw Error('Post-deadline trade register incomplete or duplicated');
 if(o.clubAnnouncedNov10Count!==5||o.registerDatedNov10Count!==7||o.fc1VolumeScoreStatus!=='UNRESOLVED_DATE_BOUNDARY')throw Error('FC1 date-boundary evidence changed');
 if(o.fixedCohort?.eligibleForecasts!==123||o.fixedCohort?.positiveTrades!==8||o.fixedCohort?.brierScore!==0.077813821138)throw Error('Fixed cohort accounting mismatch');
 if(!o.confirmedTrades.every(x=>https(x.sourceUrl)))throw Error('Source provenance invalid');
 return o;
}
async function run(){try{
 const [official,status,publicFeed,publishing,outcome]=await Promise.all([
  get('/nfl/official-trade-snapshot-2026.json'),get('/nfl/refresh-status.json'),
  get('/nfl/public-feed.json'),get('/nfl/publishing.json'),get('/nfl/deadline-reconciled-2026.json')
 ]);
 // The November 5 seven-entry tracker is a historical source observation, NOT today's trade count.
 if(official.schema!=='KAHRELUM_NFL_OFFICIAL_DEADLINE_SOURCE_SNAPSHOT_V1'||official.officialListedCount!==official.deals.length||publishing.publishingAuthorized!==false)throw Error('Historical source custody validation failed');
 if(!Array.isArray(publicFeed.publishedUpdates)||!Array.isArray(official.reportedUnconfirmed))throw Error('Historical source schema incomplete');
 const current=validateReconciliation(outcome);
 $('officialCount').textContent=String(current.tradeCountInSeason);
 $('sourceCount').textContent=String(status.sourcesSucceeded)+'/'+String(status.sourcesAttempted);
 $('sourceDetail').textContent=(status.sourcesFailed||0)+' source failures in LAST PRE-DEADLINE sweep';
 $('queueCount').textContent=String(status.reviewQueueCount??'Unknown');
 $('health').textContent='ARCHIVED';
 $('healthDetail').textContent='Last pre-deadline source check '+dt(status.lastSuccessfulSourceCheckAt);
 $('statusDetail').textContent='This is an archived November 10 operational check (not a live FRESH badge). Last operational check '+dt(status.lastCompletedCheckAt||status.lastAttemptAt)+'; last fully successful sweep '+dt(status.lastFullySuccessfulSourceCheckAt)+'. New reports after the cutoff require a separate retrospective receipt.';
 $('deals').innerHTML=current.confirmedTrades.map(dealCard).join('');
 $('pending').innerHTML='<p><strong>Final correction:</strong> Daiyan Henley and Arnold Ebiketie were not completed deadline trades. Earlier reported proposals and the original November 5 snapshot are preserved as historical source records, not displayed as current pending deals.</p><p>'+renderSource('https://www.denverbroncos.com/news/statement-from-the-broncos','Broncos withdrawal statement')+' · '+renderSource('https://www.nfl.com/news/bengals-call-off-trade-eagles-arnold-ebiketie-compensatory-pick','NFL Ebiketie cancellation')+'</p>';
 $('published').innerHTML=publicFeed.publishedUpdates.map(approvedCard).join('')||'<p>No historical approved editorial reports.</p>';
 $('publicationNotice').textContent='Post-deadline reconciliation dated '+current.sourceAuditDate+'. The separate November 5 source snapshot remains historical. Last approved pre-deadline editorial item '+dt(status.lastPublishedUpdateAt)+'. No new automatic live-deadline or after-cutoff forecast is implied.';
 $('officialSource').href=current.sourceReport;
 $('officialSource').textContent='Read the 17-deal source and correction ledger';
 if($('fixedCohortScore'))$('fixedCohortScore').textContent='123-player fixed cohort: Brier 0.077813821138 vs all-NO 0.065040650407 (KAHRELUM worse). Six-trade FC1 outcome UNRESOLVED_DATE_BOUNDARY (five club-announced November 10 versus seven register-dated); no FC1 score.';
 $('error').textContent='';
}catch(e){$('error').textContent='Source validation unavailable: '+e.message;$('deals').textContent='No unverified trade totals shown. Read the source audit directly.';}}
if(typeof module!=='undefined'&&module.exports)module.exports={dealCard,watchCard,approvedCard,validateReconciliation};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{run();setInterval(()=>{if(!document.hidden)run()},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});});
})();
