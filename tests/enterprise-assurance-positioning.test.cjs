'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('commercial homepage leads with evidence-to-decision assurance and keeps fixed-scope offers', () => {
  const home = read('index.html');
  assert.match(home, /Your AI made a decision\. Can the evidence defend it\?/);
  assert.match(home, /href="\/decision-assurance-samples"/);
  assert.match(home, /US\$750/);
  assert.match(home, /US\$2,500/);
  assert.match(home, /v2\.3\.4 FINAL/);
  assert.match(home, /no production (?:or live third-party )?(?:system )?access|not a certification/i);
});

test('buyer pages point at the industry sample without changing the published prices or manual inquiry', () => {
  for (const name of ['assurance.html','pilot.html']) {
    const html = read(name);
    assert.match(html, /href="\/decision-assurance-samples"/, name);
    assert.match(html, /\$750/, name);
    assert.match(html, /\$2,500/, name);
    assert.match(html, /No production access|no live third-party system access/i, name);
  }
  const pilot = read('pilot.html');
  assert.match(pilot, /id="pilotInquiry"/);
  assert.match(pilot, /mailto:hasan@kahrelum\.com/);
});

test('five distinct synthetic sectors have inspectable uniform decision records', () => {
  const page = read('decision-assurance-samples.html');
  const manifest = JSON.parse(read('data/assurance/synthetic-reviews-v0.1.json'));
  assert.equal(manifest.schema_version, 'kahrelum.synthetic-review.v0.1');
  assert.equal(manifest.synthetic, true);
  assert.equal(manifest.live_execution, false);
  assert.equal(manifest.cases.length, 5);
  assert.match(page, /SYNTHETIC.*NOT A LIVE RUN/is);
  assert.match(page, /href="\/data\/assurance\/synthetic-reviews-v0\.1\.json"/);
  assert.match(page, /href="\/pilot#request"/);
  assert.doesNotMatch(read('index.html'), /\$500|five.case diagnostic/i);
  const sectors = ['clinical-documentation','clinical-inbox','patient-context','editorial-attribution','automated-experimentation'];
  assert.deepEqual(manifest.cases.map(record => record.sector_id), sectors);
  for (const record of manifest.cases) {
    assert.equal(record.synthetic, true);
    for (const key of ['case_id','sector_id','workflow','decision_at_cutoff','source_snapshot','policy_at_cutoff','gap_found','counterargument','review_disposition','required_next_evidence','limitations']) {
      assert.ok(record[key], 'Missing '+key+' in '+record.case_id);
    }
    assert.match(page, new RegExp(record.case_id));
    assert.ok(['HOLD','REVIEW','CORRECT'].includes(record.review_disposition));
  }
  for (const brand of ['Berry Street','Commure','Elsevier','LVMH','INFevo','XtalPi']) {
    assert.ok(!page.includes(brand), 'Do not imply customer use or identified third-party defects: '+brand);
  }
});

test('roadmap distinguishes current retrospective service from unbuilt API and live governance capabilities', () => {
  const guide = read('commercial/enterprise-product-path-20261118.md');
  assert.match(guide, /CURRENT:.*operator-assisted/i);
  assert.match(guide, /PROPOSED:.*vendor evaluation/i);
  assert.match(guide, /FUTURE:.*governance/i);
  assert.match(guide, /not.*(?:live|production).*(?:API|monitoring|SaaS)/i);
  assert.match(guide, /schema|audit record/i);
  assert.match(read('llms.txt'), /decision-assurance-samples/);
});
