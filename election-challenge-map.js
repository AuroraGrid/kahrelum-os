(() => {
  'use strict';

  const states = [
    ['AK','Alaska',2,1],['AL','Alabama',7,7],['AR','Arkansas',6,5],['AZ','Arizona',6,2],['CA','California',5,1],
    ['CO','Colorado',5,3],['CT','Connecticut',3,11],['DE','Delaware',5,10],['FL','Florida',8,9],['GA','Georgia',7,8],
    ['HI','Hawaii',7,1],['IA','Iowa',4,5],['ID','Idaho',3,2],['IL','Illinois',4,6],['IN','Indiana',4,7],
    ['KS','Kansas',6,4],['KY','Kentucky',5,6],['LA','Louisiana',7,5],['MA','Massachusetts',2,12],['MD','Maryland',5,9],
    ['ME','Maine',1,12],['MI','Michigan',3,7],['MN','Minnesota',3,5],['MO','Missouri',5,5],['MS','Mississippi',7,6],
    ['MT','Montana',3,3],['NC','North Carolina',6,7],['ND','North Dakota',3,4],['NE','Nebraska',5,4],['NH','New Hampshire',2,11],
    ['NJ','New Jersey',4,10],['NM','New Mexico',6,3],['NV','Nevada',4,2],['NY','New York',3,10],['OH','Ohio',4,8],
    ['OK','Oklahoma',7,4],['OR','Oregon',4,1],['PA','Pennsylvania',4,9],['RI','Rhode Island',3,12],['SC','South Carolina',6,8],
    ['SD','South Dakota',4,4],['TN','Tennessee',6,6],['TX','Texas',8,4],['UT','Utah',5,2],['VA','Virginia',5,8],
    ['VT','Vermont',2,10],['WA','Washington',3,1],['WI','Wisconsin',3,6],['WV','West Virginia',5,7],['WY','Wyoming',4,3]
  ];
  const stateByCode = Object.fromEntries(states.map(([code,name]) => [code,name]));
  const houseSeats = {AL:7,AK:1,AZ:9,AR:4,CA:52,CO:8,CT:5,DE:1,FL:28,GA:14,HI:2,ID:2,IL:17,IN:9,IA:4,KS:4,KY:6,LA:6,ME:2,MD:8,MA:9,MI:13,MN:8,MS:4,MO:8,MT:2,NE:3,NV:4,NH:2,NJ:12,NM:3,NY:26,NC:14,ND:1,OH:15,OK:5,OR:6,PA:17,RI:2,SC:7,SD:1,TN:9,TX:38,UT:4,VT:1,VA:11,WA:10,WV:2,WI:8,WY:1};
  const tierProbability = {'Solid D':.99,'Likely D':.88,'Lean D':.70,'Toss Up':.50,'Lean R':.30,'Likely R':.12,'Solid R':.01};
  let races = [];
  let selectedState = 'ALL';
  let displayLimit = 40;

  const byId = (id) => document.getElementById(id);
  const pct = (value) => `${Math.round(value * 100)}%`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function buildRaces(house, senateRatings) {
    const explicitHouse = house.competitive_districts.map((item) => ({
      id:item.district, state:item.district.split('-')[0], chamber:'House', tier:item.tier,
      pDem:item.p_dem, sourceDate:'2026-10-23', event:'Democratic nominee wins district', coverage:'explicit'
    }));
    const explicitById = Object.fromEntries(explicitHouse.map((race) => [race.id,race]));
    const houseRaces = Object.entries(houseSeats).flatMap(([state,count]) => Array.from({length:count},(_,index) => {
      const id = `${state}-${count === 1 ? 'AL' : index + 1}`;
      return explicitById[id] || {id,state,chamber:'House',tier:'Aggregate-only solid seat',pDem:null,sourceDate:'2026-10-29',event:'No district-level forecast preserved',coverage:'aggregate'};
    }));
    const senateRaces = [];
    Object.entries(senateRatings.races_by_rating).forEach(([tier, entries]) => {
      entries.forEach((entry) => {
        const special = entry.endsWith('-special');
        const state = entry.replace('-special','');
        senateRaces.push({id:`${state} Senate${special ? ' special' : ''}`,state,chamber:'Senate',tier,pDem:tierProbability[tier],sourceDate:senateRatings.source_as_of,event:'Democratic-caucus nominee wins seat',coverage:'explicit'});
      });
    });
    return [...houseRaces, ...senateRaces];
  }

  function stateSummary(code) {
    const stateRaces = races.filter((race) => race.state === code);
    const house = stateRaces.filter((race) => race.chamber === 'House');
    const senate = stateRaces.filter((race) => race.chamber === 'Senate');
    const explicit = stateRaces.filter((race) => race.coverage === 'explicit');
    const average = explicit.length ? explicit.reduce((sum,race) => sum + race.pDem,0) / explicit.length : null;
    return {stateRaces,house,senate,explicit,average};
  }

  function mapClass(summary) {
    if (summary.average === null) return 'unmodeled';
    if (Math.abs(summary.average - .5) < .001) return 'toss';
    return summary.average > .5 ? 'dem' : 'rep';
  }

  function renderMap() {
    const map = byId('challengeUsMap');
    map.textContent = '';
    states.forEach(([code,name,row,column]) => {
      const summary = stateSummary(code);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `state-tile ${mapClass(summary)}`;
      button.style.gridRow = row;
      button.style.gridColumn = column;
      button.dataset.state = code;
      button.setAttribute('aria-pressed', selectedState === code ? 'true' : 'false');
      button.setAttribute('aria-label', `${name}: ${summary.stateRaces.length} congressional contests, ${summary.explicit.length} explicit KAHRELUM race forecasts`);
      button.innerHTML = `<strong>${code}</strong><small>${summary.explicit.length}/${summary.stateRaces.length}</small>`;
      button.addEventListener('click', () => selectState(code));
      map.appendChild(button);
    });
  }

  function selectState(code) {
    selectedState = selectedState === code ? 'ALL' : code;
    displayLimit = 40;
    byId('raceState').value = selectedState;
    renderMap();
    renderStateBrief();
    renderRaces();
    if (selectedState !== 'ALL' && window.matchMedia('(max-width: 900px)').matches) byId('stateBrief').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderStateBrief() {
    const panel = byId('stateBrief');
    if (selectedState === 'ALL') {
      panel.innerHTML = `<p class="eyebrow">National coverage</p><h3>Choose a state</h3><div class="state-code">USA</div><p>The map covers all 470 congressional contests. Each tile shows explicit forecasts divided by total contests in that state.</p><dl><div><dt>House contests</dt><dd>435</dd></div><div><dt>Senate contests</dt><dd>35</dd></div><div><dt>Explicit race forecasts</dt><dd>116</dd></div><div><dt>Aggregate-only House seats</dt><dd>354</dd></div></dl><div class="boundary">A dashed state still has elections; it means no race in that state received an explicit identifier in the original KAHRELUM lock.</div>`;
      return;
    }
    const summary = stateSummary(selectedState);
    const averageText = summary.average === null ? 'Not modeled' : `${pct(summary.average)} average D probability`;
    panel.innerHTML = `<p class="eyebrow">State intelligence file</p><h3>${escapeHtml(stateByCode[selectedState])}</h3><div class="state-code">${selectedState}</div><p>${summary.explicit.length ? 'At least one race-level probability is available from the preserved KAHRELUM locks.' : 'The state is inventoried, but no explicit race identifier appears in the preserved KAHRELUM lock.'}</p><dl><div><dt>House contests</dt><dd>${summary.house.length}</dd></div><div><dt>Senate contests</dt><dd>${summary.senate.length}</dd></div><div><dt>Explicit forecasts</dt><dd>${summary.explicit.length}</dd></div><div><dt>Model signal</dt><dd>${averageText}</dd></div><div><dt>Verified candidate portraits</dt><dd>0</dd></div></dl><div class="boundary">Candidate names and photographs are withheld until an official ballot roster and a reusable portrait source are verified. Current officeholders are not treated as nominees.</div>`;
  }

  function raceCard(race) {
    if (race.coverage === 'aggregate') {
      return `<article class="race-record">
        <div><div class="race-id">${escapeHtml(race.id)}</div><div class="race-tier">House · inventory record</div><p class="fine">The contest exists; its original district-level forecast does not.</p></div>
        <div><div class="race-tier">Aggregate-only coverage</div><p><strong>No recoverable district probability</strong></p><p class="fine">The original House lock preserved 354 solid-seat counts in aggregate but did not identify which districts occupied those tiers. No party or percentage is inferred here.</p></div>
        <div><div class="race-tier">Candidate file</div><div class="nominee-grid"><div class="nominee"><span class="nominee-avatar" aria-hidden="true">D</span><div><strong>Democratic nominee</strong><small>Identity and portrait not admitted</small></div></div><div class="nominee"><span class="nominee-avatar" aria-hidden="true">R</span><div><strong>Republican nominee</strong><small>Identity and portrait not admitted</small></div></div></div><p class="roster-warning">No placeholder person, incumbent, or unlicensed portrait has been substituted.</p></div>
      </article>`;
    }
    const dem = pct(race.pDem);
    const rep = pct(1 - race.pDem);
    return `<article class="race-record">
      <div><div class="race-id">${escapeHtml(race.id)}</div><div class="race-tier">${escapeHtml(race.chamber)} · ${escapeHtml(race.tier)}</div><p class="fine">Input edition: ${escapeHtml(race.sourceDate)}</p></div>
      <div><div class="race-tier">KAHRELUM party-outcome probability</div><div class="probability-pair"><div><strong>${dem}</strong><span>Democratic side</span></div><div><strong>${rep}</strong><span>Republican side</span></div></div><div class="probability-track" aria-label="${dem} Democratic probability and ${rep} Republican probability"><i style="width:${dem}"></i></div><p class="fine">Event: ${escapeHtml(race.event)}. This is not a named-candidate probability.</p></div>
      <div><div class="race-tier">Candidate file</div><div class="nominee-grid"><div class="nominee"><span class="nominee-avatar" aria-hidden="true">D</span><div><strong>Democratic nominee</strong><small>Identity and portrait not admitted</small></div></div><div class="nominee"><span class="nominee-avatar" aria-hidden="true">R</span><div><strong>Republican nominee</strong><small>Identity and portrait not admitted</small></div></div></div><p class="roster-warning">No placeholder person, incumbent, or unlicensed portrait has been substituted.</p></div>
    </article>`;
  }

  function matchesBand(race, band) {
    if (band === 'explicit') return race.coverage === 'explicit';
    if (band === 'aggregate') return race.coverage === 'aggregate';
    if (race.pDem === null) return band === 'ALL';
    if (band === 'competitive') return race.pDem >= .3 && race.pDem <= .7;
    if (band === 'dem') return race.pDem > .5;
    if (band === 'rep') return race.pDem < .5;
    if (band === 'toss') return race.pDem === .5;
    return true;
  }

  function renderRaces() {
    const chamber = byId('raceChamber').value;
    const band = byId('raceBand').value;
    const query = byId('raceSearch').value.trim().toLowerCase();
    const filtered = races.filter((race) =>
      (selectedState === 'ALL' || race.state === selectedState) &&
      (chamber === 'ALL' || race.chamber === chamber) && matchesBand(race,band) &&
      (!query || `${race.id} ${stateByCode[race.state]} ${race.tier} ${race.chamber}`.toLowerCase().includes(query))
    );
    const displayed = filtered.slice(0,displayLimit);
    byId('raceResultCount').textContent = `Showing ${displayed.length} of ${filtered.length} matching contests · ${races.length} nationwide`;
    byId('raceList').innerHTML = displayed.length ? displayed.map(raceCard).join('') : '<div class="map-status">No contest matches these filters.</div>';
    byId('loadMoreRaces').hidden = displayed.length >= filtered.length;
  }

  function populateStateFilter() {
    const select = byId('raceState');
    states.slice().sort((a,b) => a[1].localeCompare(b[1])).forEach(([code,name]) => {
      const option = document.createElement('option'); option.value = code; option.textContent = `${name} (${code})`; select.appendChild(option);
    });
  }

  async function init() {
    try {
      const [houseResponse,senateResponse,ratingsResponse] = await Promise.all([
        fetch('/election/house-forecast-lock.json'),fetch('/election/senate-forecast-lock.json'),fetch('/election/senate-ratings-source.json')
      ]);
      if (![houseResponse,senateResponse,ratingsResponse].every((response) => response.ok)) throw new Error('One or more locked forecast files could not be loaded.');
      const [house,senate,ratings] = await Promise.all([houseResponse.json(),senateResponse.json(),ratingsResponse.json()]);
      races = buildRaces(house,ratings);
      const explicitCount = races.filter((race) => race.coverage === 'explicit').length;
      const aggregateCount = races.filter((race) => race.coverage === 'aggregate').length;
      if (races.length !== 470 || explicitCount !== 116 || aggregateCount !== 354 || house.competitive_districts.length !== 81 || ratings.ballot_seats !== 35) throw new Error('Election inventory did not match the preserved custody record.');
      byId('mapHouseCount').textContent = races.filter((race) => race.chamber === 'House').length;
      byId('mapSenateCount').textContent = ratings.ballot_seats;
      byId('mapExplicitCount').textContent = explicitCount;
      byId('mapAggregateCount').textContent = aggregateCount;
      byId('mapLoadStatus').hidden = true;
      populateStateFilter(); renderMap(); renderStateBrief(); renderRaces();
      const resetAndRender = () => {displayLimit=40;renderRaces();};
      byId('raceSearch').addEventListener('input',resetAndRender);
      byId('raceChamber').addEventListener('change',resetAndRender);
      byId('raceBand').addEventListener('change',resetAndRender);
      byId('raceState').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;renderMap();renderStateBrief();renderRaces();});
      byId('loadMoreRaces').addEventListener('click',() => {displayLimit+=40;renderRaces();});
      document.querySelectorAll('[data-map-chamber]').forEach((button) => button.addEventListener('click',() => {
        document.querySelectorAll('[data-map-chamber]').forEach((item) => item.setAttribute('aria-pressed','false'));
        button.setAttribute('aria-pressed','true'); byId('raceChamber').value=button.dataset.mapChamber; displayLimit=40; renderRaces();
      }));
      byId('nationalMapButton').addEventListener('click',() => selectState(selectedState));
      void senate;
    } catch (error) {
      byId('mapLoadStatus').hidden = false;
      byId('mapLoadStatus').textContent = `Map unavailable: ${error.message} The headline forecast record remains visible below.`;
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();
