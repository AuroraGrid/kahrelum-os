"use strict";
(function(){
  const BASE="/election-data/";
  const METHODS=["correlated_student","shrinkage_gaussian","fixed_gaussian"];
  const METHOD_LABELS={"correlated_student":"Correlated Student","shrinkage_gaussian":"Shrinkage Gaussian","fixed_gaussian":"Fixed Gaussian"};
  const ROLES=[["cabinet","Cabinet"],["support","Outside support"],["abstain","Abstain"],["opponent","Opponent"]];
  const CODE={"cabinet":"C","support":"S","abstain":"A","opponent":"O"};
  const FROM_CODE={"C":"cabinet","S":"support","A":"abstain","O":"opponent"};
  const refs={
    c0:"https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/BASELINE_LOCK_2026-10-26.md",
    protocol:"https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/SCORING_PROTOCOL_2026-10-26.md",
    cutoff:"https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/K_PREDICT_V06_CUTOFFS_2026-10-27.csv",
    methods:"https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/K_PREDICT_V06_METHODS_2026-10-27.md"
  };
  const state={feed:null,coalitions:null,roster:null,snapshot:"current_nowcast",method:"correlated_student",drawPackage:null,rolesA:{},rolesB:{},absentYes:0,absentNo:0,switchers:0,party:"Likud",lastResultA:null,lastResultB:null,loading:false};
  const $=id=>document.getElementById(id);
  const E=(tag,text,cls)=>{
    const node=document.createElement(tag);
    if(text!==undefined&&text!==null)node.textContent=String(text);
    if(cls)node.className=cls;
    return node;
  };
  const link=(name,url)=>{
    const a=E("a",name);
    try{let p=new URL(url,location.origin);if(!["https:","http:"].includes(p.protocol))return E("span",name);a.href=p.href;}catch(_){return E("span",name);}
    a.target="_blank";a.rel="noopener noreferrer";return a;
  };
  const safeDate=value=>{
    if(!value)return "Not available";
    const d=new Date(value);return Number.isNaN(d.valueOf())?"Not available":d.toLocaleString("en-GB",{timeZone:"Asia/Jerusalem",year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZoneName:"short"});
  };
  const pct=value=>Number.isFinite(value)?(100*value).toFixed(1)+"%":"Unknown";
  const num=value=>Number.isFinite(value)?value.toFixed(1):"Unknown";
  const subtitle=(id,text)=>{$(id).textContent=text;};
  function notice(text,kind){
    const n=$("notice");n.textContent=text;n.dataset.kind=kind||"info";n.hidden=!text;
  }
  async function getData(file){
    if(!/^(latest|coalitions|competition|competition-lock)\.json$/.test(file)&& !/^coalition-draws\/[a-f0-9]{16}\.json$/.test(file))throw Error("Resource name rejected.");
    for(const url of [BASE+file,"/api/election-feed?file="+encodeURIComponent(file)]){
      try{
        const res=await fetch(url,{cache:"no-store",headers:{"Accept":"application/json"}});
        if(!res.ok)continue;
        const json=await res.json();
        if(json&&typeof json==="object"&&!Array.isArray(json)&&!json.error)return json;
      }catch(_){}
    }
    throw Error("Could not retrieve verified source "+file+". Data not substituted.");
  }
  function records(){return state.coalitions?.records?.[state.snapshot]||null;}
  function prediction(){return state.feed?.[state.snapshot]||null;}
  function draws(method){
    const pkg=state.drawPackage, list=pkg?.draws_by_method?.[method];
    if(!Array.isArray(list)||!list.length)throw Error("Joint draws unavailable for "+method);
    return list;
  }
  function names(){return state.drawPackage?.parties||[];}
  function defaults(target,which){
    const list=records()?.scenarios?.[state.method]||[];
    const base=which==="A"?list.find(x=>x.id==="net-core"):(list.find(x=>x.id==="eis-arab-support")||list.find(x=>(x.name||"").toLowerCase().includes("outside")));
    const preset=base||(which==="A"?list[0]:list[Math.min(4,list.length-1)]);
    if(!preset)return;
    applyPreset(which,preset);
  }
  function applyPreset(which,preset){
    const target=which==="A"?state.rolesA:state.rolesB;
    for(const party of names())target[party]="opponent";
    for(const party of preset.cabinet||[])if(party in target)target[party]="cabinet";
    for(const party of preset.support||[])if(party in target)target[party]="support";
    for(const party of preset.abstain||[])if(party in target)target[party]="abstain";
    const menu=$("preset"+which);if(menu)menu.value=preset.id;
    const note=$("preset"+which+"-note");if(note)note.textContent=(preset.note||"")+" Political status: "+(preset.status||"unverified");
    renderRoles();render();
  }
  function initialRoles(){
    const params=new URLSearchParams(location.search);
    const values=[["A",state.rolesA,params.get("a")],["B",state.rolesB,params.get("b")]];
    let restored=false;
    for(const [key,object,encoded] of values){
      if(typeof encoded==="string"&&encoded.length===names().length&&/^[CSAO]+$/.test(encoded)){
        names().forEach((name,i)=>object[name]=FROM_CODE[encoded[i]]);restored=true;
      }else defaults(object,key);
    }
    const party=params.get("party");if(names().includes(party))state.party=party;
    return restored;
  }
  function quantile(arr,p){
    if(!arr.length)return 0;
    const index=Math.max(0,Math.min(arr.length-1,Math.floor((arr.length-1)*p)));
    const sorted=[...arr].sort((a,b)=>a-b);return sorted[index];
  }
  function analyze(method,roles,settings){
    const all=draws(method),partyNames=names(),counts=[],expected=[0,0,0],seats=[];
    let cabinetHit=0,withHit=0,confidenceHit=0;
    for(const row of all){
      let cabinet=0,support=0,abstain=0,valid=true,total=0;
      for(let i=0;i<partyNames.length;i++){
        const n=row[i];if(!Number.isInteger(n)||n<0){valid=false;break;}total+=n;
        const role=roles[partyNames[i]]||"opponent";
        if(role==="cabinet")cabinet+=n;
        else if(role==="support")support+=n;
        else if(role==="abstain")abstain+=n;
      }
      if(!valid||total!==120)throw Error("Rejected incoherent joint seat draw. Cannot score.");
      const yes=cabinet+support,no=120-yes-abstain;
      const transfers=Number(settings.switchers)||0;
      const adjustedYes=Math.max(0,Math.min(120,yes+transfers));
      const adjustedNo=Math.max(0,Math.min(120-adjustedYes,no-transfers));
      const castYes=Math.max(0,adjustedYes-(Number(settings.absentYes)||0));
      const castNo=Math.max(0,adjustedNo-(Number(settings.absentNo)||0));
      cabinetHit+=Number(cabinet>=61);
      withHit+=Number(yes>=61);
      confidenceHit+=Number(castYes>castNo);
      counts.push(cabinet);seats.push({cabinet,withSupport:yes,yes:castYes,no:castNo});
      expected[0]+=cabinet;expected[1]+=yes;expected[2]+=castYes-castNo;
    }
    const n=all.length;
    return {n,cabinetP:cabinetHit/n,withP:withHit/n,confidenceP:confidenceHit/n,meanCab:expected[0]/n,meanWith:expected[1]/n,meanMargin:expected[2]/n,low:quantile(counts,0.05),high:quantile(counts,0.95),cabinetCounts:counts,seats};
  }
  function drawHistogram(containerId,values,threshold,title){
    const root=$(containerId);root.replaceChildren();
    if(!values.length){root.append(E("p","No recorded draws.","small"));return;}
    const frequencies=new Map();for(const n of values)frequencies.set(n,(frequencies.get(n)||0)+1);
    const unique=[...frequencies.keys()].sort((a,b)=>a-b);
    let min=Math.min(unique[0],threshold??unique[0]),max=Math.max(unique[unique.length-1],threshold??unique[unique.length-1]);
    if(max-min>95){min=Math.max(0,quantile(values,0.005)-5);max=Math.min(120,quantile(values,.995)+5);if(threshold!==null&&threshold!==undefined){min=Math.min(min,threshold);max=Math.max(max,threshold);}}
    const width=640,height=204,left=37,right=10,top=17,bottom=31,maxFreq=Math.max(...frequencies.values()),plotWidth=width-left-right;
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 640 204");svg.setAttribute("role","img");svg.setAttribute("aria-label",title);
    const S=(name,attrs,text)=>{
      const n=document.createElementNS("http://www.w3.org/2000/svg",name);for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));
      if(text!==undefined)n.textContent=String(text);svg.append(n);return n;
    };
    S("line",{x1:left,y1:height-bottom,x2:width-right,y2:height-bottom,stroke:"#72849d"});
    const count=max-min+1,band=plotWidth/count;
    for(let seat=min;seat<=max;seat++){
      const amount=frequencies.get(seat)||0;const bh=(height-bottom-top)*amount/maxFreq;
      S("rect",{x:left+(seat-min)*band+band*.06,y:height-bottom-bh,width:Math.max(.8,band*.86),height:bh,rx:Math.min(2,band*.2),fill:seat>=61?"#57d8aa":"#7194f2",opacity:.86});
    }
    for(let tick=0;tick<5;tick++){
      const s=Math.round(min+(max-min)*tick/4),x=left+(s-min+.5)*band;
      S("text",{x,y:height-9,"text-anchor":"middle","font-size":11,fill:"#aab9cc"},s);
    }
    if(threshold!==null&&threshold!==undefined&&threshold>=min&&threshold<=max){
      const x=left+(threshold-min)*band;
      S("line",{x1:x,y1:top-4,x2:x,y2:height-bottom,stroke:"#f0b978","stroke-width":2,"stroke-dasharray":"5 4"});
      S("text",{x:x+4,y:11,"font-size":12,fill:"#f0b978"},"61-seat line");
    }
    root.append(svg);
  }
  function settings(){return{absentYes:state.absentYes,absentNo:state.absentNo,switchers:state.switchers};}
  function scoreBox(which,result){
    const lower=which.toLowerCase();
    subtitle("pct-"+lower+"-cab",pct(result.cabinetP));
    subtitle("pct-"+lower+"-sup",pct(result.withP));
    subtitle("pct-"+lower+"-yes",pct(result.confidenceP));
    subtitle("detail-"+lower,"Expected cabinet seats "+num(result.meanCab)+" | 90% simulated range "+result.low+"–"+result.high+" | "+result.n.toLocaleString()+" coherent seat draws.");
    drawHistogram("chart-"+lower,result.cabinetCounts,61,"Simulated cabinet seat count distribution, scenario "+which+", 61-seat line");
  }
  function updatePresetOptions(){
    for(const which of ["A","B"]){
      const element=$("preset"+which),list=records()?.scenarios?.[state.method]||[];
      element.replaceChildren(E("option","Choose a documented preset"));
      element.firstChild.value="";
      for(const preset of list){const o=E("option",preset.name);o.value=preset.id;element.append(o);}
    }
  }
  function renderRoles(){
    const body=$("party-roles");body.replaceChildren();
    for(const party of names()){
      const row=E("tr");const nameCell=E("th",party);nameCell.scope="row";row.append(nameCell);
      for(const which of ["A","B"]){
        const sel=E("select");sel.setAttribute("aria-label",party+" role in scenario "+which);
        for(const [value,label] of ROLES){const o=E("option",label);o.value=value;sel.append(o);}
        const roles=which==="A"?state.rolesA:state.rolesB;
        sel.value=roles[party]||"opponent";sel.addEventListener("change",()=>{
          roles[party]=sel.value;
          $("preset"+which).value="";
          render();
        });const cell=E("td");cell.append(sel);row.append(cell);
      }
      body.append(row);
    }
  }
  function renderComparison(){
    const body=$("model-comparison");body.replaceChildren();
    for(const method of METHODS){
      const a=analyze(method,state.rolesA,settings()),b=analyze(method,state.rolesB,settings());
      const row=E("tr");row.append(E("th",METHOD_LABELS[method]));
      for(const v of [a.cabinetP,a.withP,a.confidenceP,b.cabinetP,b.withP,b.confidenceP])row.append(E("td",pct(v)));
      if(method===state.method)row.classList.add("selected");
      body.append(row);
    }
  }
  function renderParty(){
    const list=names(),selection=$("party-select");
    if(selection.options.length!==list.length){selection.replaceChildren();for(const name of list){const opt=E("option",name);opt.value=name;selection.append(opt);}}
    if(!list.includes(state.party))state.party=list[0];
    selection.value=state.party;
    const idx=list.indexOf(state.party),all=draws(state.method),seats=all.map(r=>r[idx]),mean=seats.reduce((a,b)=>a+b,0)/seats.length;
    const range=[quantile(seats,.05),quantile(seats,.95)],represented=seats.filter(x=>x>0).length/all.length;
    subtitle("party-metrics","Mean "+num(mean)+" seats · 90% range "+range.join("–")+" · P(seats > 0) "+pct(represented)+". This is a seat-space representation event, not a statutory vote-threshold probability.");
    drawHistogram("party-chart",seats,null,state.party+" seat probability distribution");
  }
  function renderTimeline(){
    const rail=$("timeline-rail");rail.replaceChildren();
    const steps=[
      ["C0","26 Oct","Original external-comparator lock",refs.c0,"Pre-election lock, not an issued proprietary outcome forecast"],
      ["C1","27 Oct 04:43Z","Late pre-open observation","https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/C1_PREOPEN_2026-10-27.md","Archived 13m23s after its registered cutoff"],
      ["C2","27 Oct 20:50Z","Exit-poll capture","https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/C2_POLLCLOSE_2026-10-27.md","External exit polls, not counted ballots"],
      ["C6","27 Oct","First largest-list projection","https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/C6_PROJECTED_LIST_2026-10-27.md","External projection, not certified result"],
      ["P1",safeDate(state.feed?.frozen_prediction?.issued_at),"Frozen-input seat model",null,"Post-close run using older poll inputs, NOT issued pre-election"],
      ["P2",safeDate(state.feed?.current_nowcast?.issued_at),"Exit-informed nowcast",null,"Experimental model run; no calibrated claim"],
      ["C3–C5","Pending","Valid-vote count thresholds",refs.protocol,"Await numerator and compatible denominator"],
      ["C7","Pending","Certified final seats / proper scoring",refs.protocol,"Not scored without authoritative final gold"]
    ];
    for(const [tag,when,title,url,note] of steps){
      const item=E("article",null,"timeline-item");
      item.append(E("span",tag,"timemark"),E("span",when,"small"),E("strong",title),E("p",note,"small"));
      if(url)item.append(link("View record",url));
      rail.append(item);
    }
  }
  function renderAudit(){
    const root=$("source-ledger");root.replaceChildren();
    const rows=[
      ["Prediction identity",prediction()?.id||"Unknown",null],
      ["Issued at (Israel)",safeDate(prediction()?.issued_at),null],
      ["Source checked at (Israel)",safeDate(state.feed?.checked_at),null],
      ["Selected evidence class",state.feed?.observation?.source_type||"Unknown",null],
      ["Underlying source publication",safeDate(state.feed?.observation?.source_published_at),state.feed?.observation?.source_url],
      ["Source-clock caveat",state.feed?.observation?.source_time_basis||"Not supplied",null],
      ["Source content SHA-256",state.feed?.observation?.raw_sha256||"Unavailable",null],
      ["Official count status",state.feed?.official?.status||"Unknown",state.feed?.official?.source_url],
      ["Verified counted ballots",state.feed?.official?.votes==null?"UNKNOWN":"Consult official source",null],
      ["Valid-count denominator", "UNKNOWN unless first-party compatible totals verified",null],
      ["Source collection stage",state.feed?.stage||"Unknown",null],
      ["Model uncertainty",prediction()?.research_status||"Uncalibrated",refs.methods],
      ["Research protocol","Original scoring protocol, unchanged",refs.protocol]
    ];
    for(const [label,value,url] of rows){
      const dl=E("div",null,"audit-row");
      dl.append(E("dt",label),E("dd",null));
      dl.lastChild.append(url?link(value,url):E("span",value));
      root.append(dl);
    }
    const statements=$("position-ledger");statements.replaceChildren();
    const sources=state.coalitions?.sources||{};
    for(const [id,source] of Object.entries(sources)){
      const box=E("article",null,"position");
      const title=E("strong",id.toUpperCase());box.append(title,E("span",source.reported_date||"Date unverified","small"),E("p",source.claim||"No authenticated position."));
      if(source.url)box.append(link("Attributed report",source.url));
      statements.append(box);
    }
  }
  function renderRoster(){
    const table=$("roster-rows");table.replaceChildren();
    const term=$("roster-search").value.trim().toLowerCase();
    const lists=state.roster?.lists||[];
    const filtered=lists.filter(p=>[p.name,p.hebrew,p.ballot,p.lead_candidate].some(k=>String(k||"").toLowerCase().includes(term)));
    for(const p of filtered){
      const row=E("tr");
      row.append(E("td",p.ballot),E("td",p.name),E("td",p.lead_candidate),E("td",p.model_name||"Not in 14-list model"));
      const s=E("td");s.append(link("CEC record",p.official_candidate_list_url));row.append(s);table.append(row);
    }
    subtitle("roster-summary",filtered.length+" of "+lists.length+" operational contesting lists shown. Source as-of Oct 27; Achi and Blue and White withdrawn. Most CEC bodies were not directly rechecked. 14-list model coverage is NOT the same as full-ballot coverage.");
  }
  function render(){
    if(!state.drawPackage)return;
    try{
      const a=analyze(state.method,state.rolesA,settings()),b=analyze(state.method,state.rolesB,settings());
      state.lastResultA=a;state.lastResultB=b;
      scoreBox("A",a);scoreBox("B",b);
      subtitle("scenario-context","Same "+METHOD_LABELS[state.method]+" model, "+state.snapshot.replaceAll("_"," ")+", same "+a.n.toLocaleString()+" joint draws. All percentages conditional on chosen roles, not political agreements.");
      subtitle("legal-caveat","Outright 61 measures an absolute parliamentary majority. Yes > no is a role-and-attendance arithmetic scenario and is NOT a calibrated probability of investiture or government formation. No-confidence and investiture have distinct legal requirements. Defections/absence controls are hypothetical deterministic switches, not fitted behavioral forecasts.");
      renderComparison();renderParty();renderAudit();
    }catch(e){notice(e.message,"error");}
  }
  async function loadSnapshot(){
    const predictionData=prediction();if(!predictionData||!/^([a-f0-9]{16})$/.test(predictionData.id||""))throw Error("Invalid frozen prediction identity.");
    const pkg=await getData("coalition-draws/"+predictionData.id+".json");
    if(pkg.prediction_id!==predictionData.id||!Array.isArray(pkg.parties)||pkg.parties.length!==14)throw Error("Draw identity or 14-list universe mismatch.");
    for(const method of METHODS){
      const rr=pkg.draws_by_method?.[method];
      if(!Array.isArray(rr)||rr.length!==12000||!rr.every(row=>Array.isArray(row)&&row.length===14&&row.every(x=>Number.isInteger(x)&&x>=0)&&row.reduce((a,b)=>a+b,0)===120))throw Error("Failed draw coherence validation: "+method);
    }
    state.drawPackage=pkg;updatePresetOptions();initialRoles();renderRoles();
    $("snapshot-select").value=state.snapshot;$("method-select").value=state.method;
    $("party-select").value=state.party;
    render();renderTimeline();
    subtitle("last-updated","Source check: "+safeDate(state.feed.checked_at));
  }
  async function reloadData(){
    if(state.loading)return;state.loading=true;notice("Loading documented forecast feeds and verifying all joint seat draws…","info");
    try{
      const [feed,coalitions,roster]=await Promise.all([getData("latest.json"),getData("coalitions.json"),fetch("/election-lab-roster.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Roster resource not present.");return r.json();})]);
      if(feed.case_id!=="KAH-IL26-PROSPECTIVE-001"||!coalitions.records||roster.active_list_count!==36)throw Error("Release evidence identity failed.");
      state.feed=feed;state.coalitions=coalitions;state.roster=roster;
      $("method-select").value=state.method;
      await loadSnapshot();
      renderRoster();
      const minutes=(Date.now()-Date.parse(feed.checked_at))/60000;
      if(Number.isFinite(minutes)&&minutes>15)notice("WARNING: Published collector data is stale by "+Math.floor(minutes)+" minutes. Results are the last documented prediction, not a current count.","warning");
      else notice("Verified joint seat archive loaded. These are uncalibrated conditional model percentages, not government-formation probabilities.","success");
      const official=feed.official||{};
      subtitle("count-status",official.final===true?"Official final supplied. Verify authenticated gold before scoring.":"Official final seats: NOT VERIFIED. Counted ballots and compatible denominator remain UNKNOWN.");
    }catch(e){notice("DATA GATE BLOCKED: "+e.message+" No synthetic or substituted official results.","error");}
    finally{state.loading=false;}
  }
  function exportData(format){
    if(!state.lastResultA||!state.lastResultB)return notice("No authenticated scenario draws loaded.","error");
    const description=(which,result,roles)=>({name:which,roles,metrics:{cabinet61:result.cabinetP,withSupport61:result.withP,yesGreaterNo:result.confidenceP,meanCabinetSeats:result.meanCab,interval90:[result.low,result.high],jointDraws:result.n}});
    const value={case_id:"KAH-IL26-PROSPECTIVE-001",exported_at:new Date().toISOString(),model:"K-PREDICT v0.6 experimental seat space",prediction_id:prediction()?.id,model_issued_at:prediction()?.issued_at,method:state.method,feed_checked_at:state.feed?.checked_at,source_sha256:state.feed?.observation?.raw_sha256,assumptions:settings(),scenarios:[description("A",state.lastResultA,state.rolesA),description("B",state.lastResultB,state.rolesB)],warning:"Seat availability only. NOT actual government formation. No pre-election v0.6 forecast was issued; probabilities uncalibrated and exit-informed."};
    let body,mime,ext;
    if(format==="csv"){
      body="scenario,prediction_id,method,event,probability,joint_draws\n";
      for(const sc of value.scenarios)for(const [event,p] of Object.entries({cabinet61:sc.metrics.cabinet61,withSupport61:sc.metrics.withSupport61,yesGreaterNo:sc.metrics.yesGreaterNo}))body+=[sc.name,value.prediction_id,value.method,event,p,sc.metrics.jointDraws].join(",")+"\n";
      mime="text/csv;charset=utf-8";ext="csv";
    }else{body=JSON.stringify(value,null,2);mime="application/json";ext="json";}
    const blob=new Blob([body],{type:mime}),url=URL.createObjectURL(blob);
    const a=E("a");a.href=url;a.download="KAHRELUM-coalition-"+value.prediction_id+"."+ext;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function updateShare(){
    const u=new URL(location.href);
    u.searchParams.set("snapshot",state.snapshot);u.searchParams.set("method",state.method);
    u.searchParams.set("a",names().map(k=>CODE[state.rolesA[k]||"opponent"]).join(""));
    u.searchParams.set("b",names().map(k=>CODE[state.rolesB[k]||"opponent"]).join(""));
    u.searchParams.set("party",state.party);
    navigator.clipboard?.writeText(u.href).then(()=>notice("Scenario comparison link copied. Predictions are tied to this page's selected snapshot, but the current-nowcast feed can change.","success")).catch(()=>notice("Copy was blocked by browser permissions. Use: "+u.href,"warning"));
  }
  function listen(){
    $("method-select").addEventListener("change",()=>{state.method=$("method-select").value;updatePresetOptions();render();});
    $("snapshot-select").addEventListener("change",async()=>{state.snapshot=$("snapshot-select").value;state.drawPackage=null;await reloadData();});
    for(const which of ["A","B"])$("preset"+which).addEventListener("change",()=>{
      const preset=(records()?.scenarios?.[state.method]||[]).find(x=>x.id===$("preset"+which).value);
      if(preset)applyPreset(which,preset);
      $("preset"+which+"-note").textContent=preset?(preset.note||"")+" Political status: "+(preset.status||"unverified"):"Edit individual roles below.";
    });
    for(const [key,field] of [["absentYes","absent-yes"],["absentNo","absent-no"],["switchers","switchers"]]){
      $(field).addEventListener("input",()=>{
        let v=Number($(field).value);
        if(!Number.isInteger(v))v=0;v=Math.max(key==="switchers"?-5:0,Math.min(key==="switchers"?5:10,v));
        state[key]=v;render();
      });
    }
    $("roster-search").addEventListener("input",renderRoster);
    $("party-select").addEventListener("change",()=>{state.party=$("party-select").value;renderParty();});
    $("refresh").addEventListener("click",reloadData);
    $("export-json").addEventListener("click",()=>exportData("json"));
    $("export-csv").addEventListener("click",()=>exportData("csv"));
    $("copy-link").addEventListener("click",updateShare);
    $("print-card").addEventListener("click",()=>window.print());
  }
  async function boot(){
    listen();
    const q=new URLSearchParams(location.search);
    if(METHODS.includes(q.get("method")))state.method=q.get("method");
    if(["current_nowcast","frozen_prediction"].includes(q.get("snapshot")))state.snapshot=q.get("snapshot");
    $("method-select").value=state.method;$("snapshot-select").value=state.snapshot;
    await reloadData();
    setInterval(async()=>{
      if(document.visibilityState!=="visible"||state.loading)return;
      try{
        const fresh=await getData("latest.json");
        if(fresh.checked_at===state.feed?.checked_at)return;
        const oldId=prediction()?.id;state.feed=fresh;
        if(prediction()?.id!==oldId){state.drawPackage=null;await loadSnapshot();}
        else {renderTimeline();renderAudit();}
        const minutes=(Date.now()-Date.parse(fresh.checked_at))/60000;
        notice(minutes>15?"Published feed is stale; last valid prediction retained.":"Latest source check updated, previous issued model outputs preserved.",minutes>15?"warning":"success");
        subtitle("last-updated","Source check: "+safeDate(fresh.checked_at));
      }catch(_){notice("Source refresh failed; retained prior validated snapshot and its issue time.","warning");}
    },60000);
  }
  boot();
})();