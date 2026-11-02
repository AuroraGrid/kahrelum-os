'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KahrelumScorecard = api;
})(typeof window === 'undefined' ? null : window, function () {
  const CONTROLS = Object.freeze([
    'Evidence at cutoff', 'Source provenance', 'Rule / policy trace',
    'Action authority', 'Missing inputs logged', 'Contrary evidence',
    'Record locked', 'Escalation gate'
  ]);
  const VALID = new Set(['PASS', 'GAP', 'UNKNOWN']);
  function triage(values) {
    if (!Array.isArray(values) || values.length !== CONTROLS.length) return 'NOT REVIEWED';
    const validValues = values.map(v => typeof v === 'string' ? v.trim() : '');
    if (validValues.includes('GAP')) return 'REVIEW / ESCALATE';
    if (validValues.includes('UNKNOWN')) return 'INCOMPLETE';
    if (validValues.every(v => v === 'PASS')) return 'NO GAP RECORDED';
    return 'NOT REVIEWED';
  }
  function csvCell(value) {
    let v = String(value ?? '');
    // Spreadsheet applications can execute cells beginning with formula prefixes.
    if (/^[\s]*[=+@\-\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function toCsv(rows) {
    const headers = ['Case ID', 'Decision / action', ...CONTROLS, 'Triage'];
    const output = [headers.map(csvCell).join(',')];
    for (const record of rows) {
      const vals = Array.isArray(record.controls) ? record.controls : [];
      const controls = CONTROLS.map((_, i) => VALID.has(vals[i]) ? vals[i] : '');
      output.push([record.id, record.action, ...controls, triage(controls)].map(csvCell).join(','));
    }
    return '\ufeff' + output.join('\r\n') + '\r\n';
  }
  function init() {
    const container = document.querySelector('[data-case-rows]');
    if (!container) return;
    const count = document.querySelector('[data-count]');
    const cards = [];
    const headings = [
      'Dated evidence existed before action', 'Source origin and capture traceable',
      'Applicable rule and policy recorded', 'Decision or tool action authorized',
      'Missing information explicitly logged', 'Contradictions and alternatives reviewed',
      'Original decision state preserved', 'Escalation and hold requirements honored'
    ];
    for (let n = 1; n <= 3; n++) {
      const article = document.createElement('article');
      article.className = 'case-card';
      const h = document.createElement('h3'); h.textContent = `Historical case ${n}`;
      article.appendChild(h);
      const pair = document.createElement('div'); pair.className = 'pair';
      const makeField = (label, placeholder) => {
        const wrap = document.createElement('label');
        wrap.className = 'entry';
        const txt = document.createElement('span'); txt.textContent = label;
        const input = document.createElement('input');
        input.type = 'text'; input.maxLength = 200; input.placeholder = placeholder;
        wrap.append(txt, input); pair.appendChild(wrap);
        return input;
      };
      const id = makeField('Anonymous case ID', `CASE-0${n}`);
      const action = makeField('Historical action (no sensitive details)', 'Approval, rejection, escalation...');
      article.appendChild(pair);
      const grid = document.createElement('div'); grid.className = 'control-grid';
      const selects = [];
      CONTROLS.forEach((name, i) => {
        const label = document.createElement('label'); label.className = 'control';
        const txt = document.createElement('span');txt.textContent = `${i+1}. ${name}`;
        const desc = document.createElement('small');desc.textContent = headings[i];
        const select = document.createElement('select');select.setAttribute('aria-label', `Case ${n}: ${name}`);
        [['','Not reviewed'],['PASS','PASS'],['GAP','GAP'],['UNKNOWN','UNKNOWN']].forEach(([value, label])=>{
          const option = document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);
        });
        selects.push(select);label.append(txt,desc,select);grid.appendChild(label);
      });
      article.appendChild(grid);
      const status = document.createElement('p');status.className='status';status.setAttribute('aria-live','polite');
      const run = () => {
        const val = triage(selects.map(s => s.value));
        status.textContent = 'Assessment: ' + val;
        status.dataset.status = val;
        if(count) count.textContent = `${cards.filter(c => c.selects.some(s => s.value)).length} / 3 started`;
      };
      selects.forEach(s => s.addEventListener('change',run));
      article.appendChild(status);container.appendChild(article);
      cards.push({id,action,selects,status,run});run();
    }
    const download = document.querySelector('[data-download]');
    if(download) download.addEventListener('click',() => {
      const rows=cards.map(c=>({id:c.id.value,action:c.action.value,controls:c.selects.map(s=>s.value)}));
      const data=toCsv(rows);
      const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8;'}));
      const link=document.createElement('a');link.href=url;link.download='KAHRELUM_Three_Case_Scorecard.csv';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const reset=document.querySelector('[data-reset]');
    if(reset) reset.addEventListener('click',() => {
      if(!window.confirm('Clear all three cases from this page? Download first if needed.')) return;
      cards.forEach(c=>{c.id.value='';c.action.value='';c.selects.forEach(s=>s.value='');c.run();});
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
    else init();
  }
  return {CONTROLS,triage,toCsv};
});