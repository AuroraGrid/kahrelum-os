'use strict';
(()=>{const $=x=>document.getElementById(x);const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https=u=>{try{const o=new URL(u);return o.protocol==='https:'?o.href:null}catch{return null}};
const renderSource=(u,label)=>{const x=https(u);return x?'<a href="'+esc(x)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':esc(label)};
const dt=t=>{const x=new Date(t);return Number.isNaN(x.valueOf())?'Unverified time':x.toLocaleString('en-US',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})+' UTC'};
async function get(u){const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error(u+' HTTP '+r.status);return r.json()}
function dealCard(d){return '<article class="card"><span class="label">NFL official tracker / '+esc(d.date)+'</span><h3>'+esc(d.player)+' · '+esc(d.position)+'</h3><p><strong>'+esc(d.from)+' → '+esc(d.to)+'</strong></p><p>Sending club receives: '+esc(d.fromReceives)+'</p><p>Acquiring club receives: '+esc(d.toReceives)+'</p></article>'}
function watchCard(d){return '<article class="card"><span class="label pending">Reported / not official at check</span><h3>'+esc(d.player)+'</h3><p>'+esc(d.from)+' → '+esc(d.to)+'</p><p>'+esc(d.detail)+'</p><p>'+renderSource(d.sourceUrl,'Read original reporting')+'</p></article>'}
function approvedCard(d){const confirmed=d.transactionConfirmed===true;return '<article class="card"><span class="label '+(confirmed?'':'pending')+'">'+(confirmed?'Authenticated transaction':'Editorially published report')+'</span><h3>'+esc(d.headline)+'</h3><p>'+esc(d.claim)+'</p><p>'+renderSource(d.sourceUrl,'Read source')+' · reviewed '+esc(dt(d.reviewedAtUtc))+'</p></article>'}
async function run(){try{
 const [official,status,publicFeed,publishing]=await Promise.all([get('/nfl/official-trade-snapshot-2026.json'),get('/nfl/refresh-status.json'),get('/nfl/public-feed.json'),get('/nfl/publishing.json')]);
 if(official.schema!=='KAHRELUM_NFL_OFFICIAL_DEADLINE_SOURCE_SNAPSHOT_V1'||official.officialListedCount!==official.deals.length||official.status!=='DEADLINE_STILL_OPEN'||publishing.publishingAuthorized!==false)throw Error('Publication custody validation failed');
 if(!Array.isArray(publicFeed.publishedUpdates)||!Array.isArray(official.reportedUnconfirmed))throw Error('Missing source review structure');
 $('officialCount').textContent=String(official.deals.length);$('sourceCount').textContent=status.sourcesSucceeded+'/'+status.sourcesAttempted;
 $('sourceDetail').textContent=(status.sourcesFailed||0)+' source failures in last sweep';
 $('queueCount').textContent=String(status.reviewQueueCount??'Unknown');$('health').textContent=esc(status.feedFreshness);
 $('healthDetail').textContent='Last source check '+dt(status.lastSuccessfulSourceCheckAt);
 $('statusDetail').textContent='Last operational check '+dt(status.lastCompletedCheckAt||status.lastAttemptAt)+'; last fully successful sweep '+dt(status.lastFullySuccessfulSourceCheckAt)+'. '+(status.errors||[]).map(x=>x.sourceIntegrationId+': '+x.error).join(' ');
 $('deals').innerHTML=official.deals.map(dealCard).join('');
 $('pending').innerHTML=official.reportedUnconfirmed.map(watchCard).join('')||'<p>No pending reported deals in this particular source snapshot.</p>';
 $('published').innerHTML=publicFeed.publishedUpdates.map(approvedCard).join('')||'<p>No editorially published reports in this snapshot.</p>';
 $('publicationNotice').textContent='Source checked '+official.sourceCheckedDate+'. Last approved editorial update '+dt(status.lastPublishedUpdateAt)+'. New draft reports require review; unapproved reporting does not change this page.';
 $('officialSource').href=official.sourceUrl;
}catch(e){$('error').textContent='Live verification unavailable: '+e.message;$('deals').textContent='Result validation failed. No transaction claim is displayed.';}}
if(typeof module!=='undefined'&&module.exports)module.exports={dealCard,watchCard,approvedCard};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{run();setInterval(()=>{if(!document.hidden)run()},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});});
})();