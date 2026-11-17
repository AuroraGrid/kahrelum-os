(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const escape=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const safeSource=u=>{try{const x=new URL(u);return x.protocol==='https:'&&x.hostname==='polling-desk.com'?x.href:null}catch{return null}};
 let all=[],snapshot=null,selectedState='',visible=50,stateNames={};
 function validate(x){
   if(!x||x.schema!=='KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1'||x.resultStatus!=='UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED')throw Error('Unsupported results schema');
   if(x.house.length!==435||x.senate.length!==35||x.governor.length!==36)throw Error('Incomplete 506-race results snapshot');
   if(new Set(x.house.map(r=>r.id)).size!==435||new Set(x.senate.map(r=>r.id)).size!==35||new Set(x.governor.map(r=>r.id)).size!==36)throw Error('Duplicate result IDs');
   for(const list of [x.house,x.senate,x.governor])for(const r of list)if(!['CALLED','COUNTING'].includes(r.status)||!['DEM','REP','OTH','IND','LIB','GRN'].includes(r.party))throw Error('Unexpected race status or party');
   const c=x.summary.house.calledByParty;
   if((c.DEM||0)+(c.REP||0)!==x.summary.house.called)throw Error('House calls do not reconcile');
   return true;
 }
 const counts=(items,office)=>{const x=items.filter(r=>r.office===office&&r.status==='CALLED');return{D:x.filter(r=>r.party==='DEM').length,R:x.filter(r=>r.party==='REP').length,other:x.filter(r=>!['DEM','REP'].includes(r.party)).length}};
 function renderNational(){
   const h=snapshot.summary.house,s=snapshot.summary.senate,g=snapshot.summary.governor;
   $('houseTotal').textContent=(h.calledByParty.DEM||0)+' D · '+(h.calledByParty.REP||0)+' R';
   $('houseDetail').textContent=h.counting+' of 435 counting · '+h.called+' called · 218 to control';
   $('senateTotal').textContent=(s.calledByParty.DEM||0)+' D · '+(s.calledByParty.REP||0)+' R';
   $('senateDetail').textContent=s.counting+' of 35 Senate contests counting · Only races on this ballot; not the full 100-seat Senate';
   $('govTotal').textContent=(g.calledByParty.DEM||0)+' D · '+(g.calledByParty.REP||0)+' R';
   $('govDetail').textContent=g.counting+' of 36 counting · '+g.called+' called';
   const age=Date.now()-Date.parse(snapshot.retrievalUtc);
   const stale=!Number.isFinite(age)||age>90*60*1000;
   $('updatedLine').textContent=(stale?'STALE SOURCE SNAPSHOT · captured data may lag GitHub. ':'')+'Source: Polling Desk / civicAPI · latest underlying race update '+new Date(snapshot.sourceLatestResultUpdatedUtc).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})+' UTC · captured '+new Date(snapshot.retrievalUtc).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})+' UTC · not certified';
 }
 function setState(code){selectedState=code||'';$('stateFilter').value=selectedState;visible=50;renderState();renderRows();}
 function renderState(){
   const items=selectedState?snapshot.house.filter(r=>r.state===selectedState):snapshot.house;
   const totals=counts(items,'house');const pending=items.filter(r=>r.status==='COUNTING').length;
   $('stateLabel').textContent=selectedState?stateNames[selectedState]+' ('+selectedState+')':'All 50 states';
   $('stateSummary').textContent='Called House seats: '+totals.D+' Democratic, '+totals.R+' Republican, '+totals.other+' other. '+pending+' still counting in this view.';
 }
 function renderMap(geo){
   const map=$('usMap');map.replaceChildren();
   if(!geo||geo.schema!=='KAHRELUM_US_STATES_MAP_v1.0'||!Array.isArray(geo.locations))throw Error('State map geometry not verified');
   geo.locations.forEach(state=>{
     const code=state.id.toUpperCase();stateNames[code]=state.name;
     const c=counts(snapshot.house.filter(r=>r.state===code),'house');
     const color=c.D>c.R?'#2b5689':c.R>c.D?'#a3443a':'#c7beb1';
     const node=document.createElementNS('http://www.w3.org/2000/svg','path');
     node.setAttribute('d',state.path);node.setAttribute('fill',color);node.setAttribute('tabindex','0');node.setAttribute('role','button');
     node.setAttribute('aria-label',state.name+': '+c.D+' Democratic and '+c.R+' Republican House seats called. Filter races.');
     const title=document.createElementNS('http://www.w3.org/2000/svg','title');
     title.textContent=state.name+': '+c.D+' D, '+c.R+' R called; click for races';node.appendChild(title);
     node.addEventListener('click',()=>setState(code));node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setState(code)}});
     map.appendChild(node);
   });
   const filter=$('stateFilter');filter.innerHTML='<option value="">All states</option>';
   Object.entries(stateNames).sort((a,b)=>a[1].localeCompare(b[1])).forEach(([code,name])=>{const opt=document.createElement('option');opt.value=code;opt.textContent=name;filter.appendChild(opt)});
 }
 function renderRows(){
   const term=$('query').value.trim().toLowerCase();const office=$('officeFilter').value;const status=$('statusFilter').value;
   const list=all.filter(r=>(!selectedState||r.state===selectedState)&&(!office||r.office===office)&&(!status||r.status===status)
      &&(!term||(r.id+' '+r.state+' '+(stateNames[r.state]||'')+' '+r.winnerOrLeader+' '+(r.candidates||[]).map(c=>c.name).join(' ')).toLowerCase().includes(term)));
   const items=list.slice(0,visible);
   const fmt=x=>Number.isInteger(x)?x.toLocaleString('en-US'):'Not reported';
   $('rows').innerHTML=items.map(r=>{
     const known=r.status==='CALLED';
     const votes=r.office==='house'?Object.entries(r.votes).filter(([,v])=>Number.isInteger(v)).map(([party,v])=>party+' '+fmt(v)).join(' · '):
       (r.candidates||[]).slice(0,2).map(c=>escape(c.party)+' '+fmt(c.votes)).join(' · ');
     const url=safeSource(r.sourceUrl);
     return '<tr><td><strong>'+escape(r.id)+'</strong><div class="small">'+escape(stateNames[r.state]||r.state)+'</div></td><td>'+escape(r.office)+'</td>'+
       '<td><span class="status'+(known?'':' pending')+'">'+(known?'Called':'Counting')+'</span></td>'+
       '<td>'+(known?'Winner: ':'Leader: ')+escape(r.winnerOrLeader)+'</td><td class="'+(r.party==='DEM'?'d':r.party==='REP'?'r':'')+'">'+escape(r.party)+'</td>'+
       '<td>'+votes+'</td><td>'+escape(r.percentReporting??'Unknown')+'%</td><td>'+(url?'<a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">Original results</a>':'Unavailable')+'</td></tr>';
   }).join('')||'<tr><td colspan="8">No race matches these filters.</td></tr>';
   $('rowCount').textContent='Showing '+items.length+' of '+list.length+' matching races · '+all.length+' covered nationwide';
   $('more').hidden=items.length>=list.length;
 }
 let mapGeometry=null;
 async function readSnapshot(){
   const response=await fetch('/election/results-2026-snapshot.json?refreshed='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('Results snapshot unavailable: HTTP '+response.status);
   const fresh=await response.json();validate(fresh);
   const prior=JSON.stringify(snapshot?.sourceSha256);
   const latest=JSON.stringify(fresh.sourceSha256);
   if(snapshot && prior===latest && snapshot.retrievalUtc===fresh.retrievalUtc)return false;
   snapshot=fresh;all=[...fresh.house,...fresh.senate,...fresh.governor];
   renderNational();
   if(mapGeometry){renderMap(mapGeometry);$('stateFilter').value=selectedState;}
   renderState();renderRows();return true;
 }
 async function refresh(){
   try{await readSnapshot()}
   catch(e){$('updatedLine').textContent='Last validated snapshot retained. Source refresh failed: '+e.message;}
 }
 async function init(){
   try{
     const mapResponse=await fetch('/assets/us-states-map.json',{cache:'force-cache'});
     if(!mapResponse.ok)throw Error('Verified map geometry unavailable');
     mapGeometry=await mapResponse.json();
     // The initial source load is verified before any calls or winner labels render.
     await readSnapshot();
     $('query').addEventListener('input',()=>{visible=50;renderRows()});
     $('officeFilter').addEventListener('change',()=>{visible=50;renderRows()});
     $('statusFilter').addEventListener('change',()=>{visible=50;renderRows()});
     $('stateFilter').addEventListener('change',e=>setState(e.target.value));
     $('reset').addEventListener('click',()=>{$('query').value='';$('officeFilter').value='';$('statusFilter').value='';setState('')});
     $('more').addEventListener('click',()=>{visible+=50;renderRows()});
     // The server publishes independently; browsers poll only same-origin approved snapshots.
     setInterval(()=>{if(!document.hidden)refresh()},900000);
     document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
   }catch(e){
     $('updatedLine').textContent='Race data unavailable: '+e.message;
     $('rows').innerHTML='<tr><td colspan="8">Verification failed; no race outcomes are displayed.</td></tr>';
   }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={validate,counts,safeSource};
 if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})();