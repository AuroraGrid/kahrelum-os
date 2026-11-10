'use strict';
// Operational status only. Never rewrites a locked forecast or simulates "live" trade totals.
(async ()=>{
 const status=document.getElementById('sourcegrid-state');
 const checked=document.getElementById('sourcegrid-checked');
 const published=document.getElementById('sourcegrid-published');
 if(!status||!checked||!published)return;
 const safe=x=>typeof x==='string'&&x.trim()?x:'Unavailable';
 const format=x=>{if(!x)return 'Unavailable';let d=new Date(x);return Number.isNaN(d.getTime())?'Unverified':d.toLocaleString('en-US',{timeZone:'America/New_York',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});};
 try{
   const res=await fetch('/nfl/refresh-status.json',{cache:'no-store'});
   if(!res.ok)throw new Error('SOURCE_STATUS_HTTP_'+res.status);
   const d=await res.json();
   const health=safe(d.feedFreshness);
   status.textContent='SourceGrid operational status: '+health;
   checked.textContent='Last completed source check: '+format(d.lastCompletedCheckAt);
   published.textContent='Last editorially published update: '+format(d.lastPublishedUpdateAt);
   if(health==='STALE_FAILED'||health==='DEGRADED')status.classList.add('stale');
 }catch(_){
   status.textContent='SourceGrid status unavailable';
   checked.textContent='The current feed could not be independently read.';
   published.textContent='No freshness or completion claim is inferred from this failure.';
 }
})();
