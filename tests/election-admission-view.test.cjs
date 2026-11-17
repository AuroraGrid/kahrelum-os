'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const {admissionView,renderAdmission} = require('../election-challenge-map.js');
const original = JSON.parse(fs.readFileSync(path.join(root,'election/comparator-admission.json'),'utf8'));

function fixture(locked=false) {
  const data = structuredClone(original);
  const commit = 'b'.repeat(40);
  data.status = locked ? 'PROSPECTIVE_COHORT_LOCKED' : 'READY_FOR_PUBLIC_LOCK';
  data.publicLock = locked ? {
    status:'VERIFIED_PUBLIC_COMMIT',commit,
    url:`https://github.com/AuroraGrid/kahrelum-os/commit/${commit}`,
    committedAtUtc:'2026-10-31T04:30:00Z'
  } : {status:'PENDING_PUBLIC_COMMIT'};
  for(const chamber of ['house','senate']) {
    for(const provider of data.providers) {
      const row=provider[chamber];
      row.admitted=locked && row.admissionReady;
      row.status=row.admissionReady ? (locked?'ADMITTED_PROSPECTIVE':'READY_PENDING_PUBLIC_LOCK') : 'EXCLUDED';
    }
    data.counts.byChamber[chamber].admitted=locked ? data.counts.byChamber[chamber].admissionReady : 0;
  }
  return data;
}

test('pending public evidence never renders the 13 ready House records as admitted',()=>{
  const view=admissionView(fixture());
  assert.equal(view.locked,false);
  assert.equal(view.totals.house.ready,13);
  assert.equal(view.totals.house.admitted,0);
  assert.equal(view.totals.senate.admitted,0);
  assert.match(view.rows,/Ready · public lock pending/);
  assert.doesNotMatch(view.rows,/Prospectively admitted/);
});

test('a verified anchored fixture renders 13 House admissions while retaining every exclusion',()=>{
  const view=admissionView(fixture(true));
  assert.equal(view.totals.house.admitted,13);
  assert.equal(view.totals.house.excluded,1);
  assert.equal(view.totals.senate.excluded,14);
  assert.equal((view.rows.match(/<tr>/g)||[]).length,14);
  assert.match(view.rows,/93% \/ 92%/);
  assert.match(view.rows,/No captured probability/);
  assert.match(view.publicProof,/immutable commit bbbbbbbbbbbb/);
});

test('the real DOM hooks show new probabilities and keep the historical count separate',()=>{
  const elements=new Map();
  const html=fs.readFileSync(path.join(root,'election-challenge.html'),'utf8');
  global.document={getElementById(id){
    assert.match(html,new RegExp(`id="${id}"`),`Missing HTML target ${id}`);
    if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',href:''});
    return elements.get(id);
  }};
  try{
    renderAdmission(fixture(true));
    assert.equal(elements.get('houseAdmissionCount').textContent,'13 admitted');
    assert.equal(elements.get('senateAdmissionCount').textContent,'0 admitted');
    assert.equal(elements.get('historicalAdmissionCount').textContent,'0 admitted');
    const rows=elements.get('admissionRows').innerHTML;
    assert.match(rows,/>72\.0%<\/div>/); // Fresh Datum House, not the earlier 70.
    assert.match(rows,/>90\.0%<\/div>/); // Fresh On Point Senate, not the earlier 86.
    assert.match(rows,/>70\.85%<\/div>/); // Current COYNTOSS release.
    assert.match(rows,/>72\.5%<\/div>/); // Exact fresh ElectIndex CSV.
    assert.match(elements.get('admissionKahrelumReference').innerHTML,/original House lock remains 91%/);
    assert.match(elements.get('admissionEvidenceLink').href,/\/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\/research\//);
  }finally{delete global.document;}
});

test('record publication claims cannot bypass the missing public anchor',()=>{
  const data=fixture();
  data.providers[0].house.admitted=true;
  data.providers[0].house.status='ADMITTED_PROSPECTIVE';
  assert.throws(()=>admissionView(data),/Publication status/);
});

test('misstated admission counts fail closed',()=>{
  const data=fixture(true);
  data.counts.byChamber.house.admitted=14;
  assert.throws(()=>admissionView(data),/totals do not match/);
});

test('provider evidence cannot inject markup or a non-HTTPS link',()=>{
  const data=fixture();
  data.providers[0].provider='<img src=x onerror=alert(1)>';
  data.providers[0].primarySourceUrl='javascript:alert(1)';
  data.providers[0].house.reason='<script>malicious()</script>';
  const view=admissionView(data);
  assert.match(view.rows,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(view.rows,/&lt;script&gt;malicious\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(view.rows,/<img|<script|href="javascript:/);
});
