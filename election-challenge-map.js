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
  let races = [];
  let selectedState = 'ALL';
  let displayLimit = 40;
  let seatProjectionData = null;
  let currentProjectionData = null;
  let challengerData = null;
  let seatComparisonMode = 'house';

  const byId = (id) => document.getElementById(id);
  const pct = (value) => `${Math.round(value * 100)}%`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function renderChamberTracker(targetId,title,value,total,threshold,seatType) {
    const opposing = total - value;
    const valueWidth = (value / total) * 100;
    const thresholdPosition = (threshold / total) * 100;
    byId(targetId).innerHTML = `<h4>${escapeHtml(title)}</h4><div class="seat-total"><strong>${value.toFixed(2)}</strong><span>Democratic${title === 'Senate' ? '-caucus' : ''} seats</span></div><div class="chamber-seat-bar" aria-label="${value.toFixed(2)} Democratic seats and ${opposing.toFixed(2)} Republican${title === 'Senate' ? '-aligned' : ''} seats"><i class="democratic" style="width:${valueWidth.toFixed(3)}%"></i><i class="majority-line" style="left:${thresholdPosition.toFixed(3)}%" title="Control threshold: ${threshold}"></i></div><div class="seat-split"><span>D ${value.toFixed(2)}</span><span>Control ${threshold}</span><span>R ${opposing.toFixed(2)}</span></div><p class="fine">${escapeHtml(seatType)} · fresh execution</p>`;
  }

  function renderSeatTracker(data) {
    renderChamberTracker('houseSeatTracker','House',data.house.expectedDemocraticSeats,435,data.house.controlThreshold,'expected seats');
    renderChamberTracker('senateSeatTracker','Senate',data.senate.expectedDemocraticCaucusSeats,100,51,'expected caucus seats');
  }

  function renderSeatComparison() {
    const chamber = seatProjectionData[seatComparisonMode];
    const [minimum,maximum] = chamber.chartRange;
    const threshold = seatComparisonMode === 'house' ? chamber.democraticControlThreshold : chamber.democraticCaucusControlThreshold;
    const thresholdPosition = ((threshold - minimum) / (maximum - minimum)) * 100;
    const rows = chamber.observations.map((item) => {
      const position = Math.max(0,Math.min(100,((item.democraticSeats - minimum) / (maximum - minimum)) * 100));
      const precision = Number.isInteger(item.democraticSeats) ? item.democraticSeats.toFixed(0) : item.democraticSeats.toFixed(2).replace(/0$/,'');
      return `<div class="comparison-row"><div class="comparison-provider"><a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.provider)}</a><small>${escapeHtml(item.edition)}</small></div><div class="comparison-bar" aria-label="${escapeHtml(item.provider)}: ${precision} Democratic seats, ${escapeHtml(item.seatType)}"><i style="width:${position.toFixed(3)}%"></i><span class="control-mark" style="left:${thresholdPosition.toFixed(3)}%" title="Control threshold: ${threshold}"></span></div><div class="comparison-value"><strong>${precision}</strong><small>${escapeHtml(item.seatType)}</small></div></div>`;
    }).join('');
    byId('seatComparisonChart').innerHTML = `<div class="comparison-axis"><span>Publisher / edition</span><div><span>${minimum} D seats</span><span>Control ${threshold}</span><span>${maximum} D seats</span></div><span>Statistic</span></div>${rows}`;
  }

  function formatControlProbability(value) {
    if (value === null || value === undefined) return '<span class="missing">Not verified</span>';
    const precision = Number.isInteger(value) ? value.toFixed(1) : value.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
    return `${precision}%`;
  }

  function renderChallengerTable() {
    const rows = challengerData.records.map((record) => {
      const unpriced = record.houseDemocraticControlPct === null && record.senateDemocraticControlPct === null;
      const provider = record.provider === 'KAHRELUM' ? `<strong>${escapeHtml(record.provider)}</strong>` : `<a href="${escapeHtml(record.sourceUrl)}">${escapeHtml(record.provider)}</a>`;
      return `<tr${unpriced ? ' class="source-unpriced"' : ''}><td data-label="Provider / edition">${provider} / ${escapeHtml(record.edition)}</td><td data-label="House D control">${formatControlProbability(record.houseDemocraticControlPct)}</td><td data-label="Senate D control">${formatControlProbability(record.senateDemocraticControlPct)}</td><td data-label="Publisher edition">${escapeHtml(record.sourceEdition)}</td><td data-label="Evidence note">${escapeHtml(record.note)} <span class="fine">${escapeHtml(record.retrievalStatus)}</span></td></tr>`;
    }).join('');
    byId('challengerRows').innerHTML = rows;
    byId('challengerCheckStatus').textContent = `Fresh source check: ${new Date(challengerData.checkedAtUtc).toLocaleString()} · ${challengerData.challengersWithAtLeastOneVerifiedControlProbability} of ${challengerData.challengersChecked} challengers have at least one verified control probability; ${challengerData.unpricedChallengers} fully unpriced entries are listed last.`;
  }

  function buildRaces(houseLock, current) {
    const originalIds = new Set(houseLock.competitive_districts.map((item) => item.district));
    const houseRaces = current.house.districts.map((item) => ({
      id:item.contestId,state:item.state,chamber:'House',tier:item.tier,pDem:item.pDem,
      sourceDate:current.sources.house.publisherEdition,event:'Democratic nominee wins district',coverage:'current',
      originalLock:originalIds.has(item.contestId),candidates:item.candidates || []
    }));
    const senateRaces = current.senate.races.map((item) => ({
      id:`${item.state} Senate${item.contestId.endsWith('-special') ? ' special' : ''}`,state:item.state,
      chamber:'Senate',tier:item.tier,pDem:item.pDemocraticCaucus,sourceDate:current.sources.senate.publisherEdition,
      event:'Democratic-caucus candidate wins seat',coverage:'current',originalLock:true,candidates:item.candidates || [],
      independentCandidateRisk:item.independentCandidateRisk
    }));
    return [...houseRaces, ...senateRaces];
  }

  function stateSummary(code) {
    const stateRaces = races.filter((race) => race.state === code);
    const house = stateRaces.filter((race) => race.chamber === 'House');
    const senate = stateRaces.filter((race) => race.chamber === 'Senate');
    const average = stateRaces.length ? stateRaces.reduce((sum,race) => sum + race.pDem,0) / stateRaces.length : null;
    const projectedDem = stateRaces.filter((race) => race.pDem > .5).length;
    const projectedRep = stateRaces.filter((race) => race.pDem < .5).length;
    const tossups = stateRaces.filter((race) => race.pDem === .5).length;
    const expectedHouseDem = house.reduce((sum,race) => sum + race.pDem,0);
    return {stateRaces,house,senate,average,projectedDem,projectedRep,tossups,expectedHouseDem};
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
      button.setAttribute('aria-label', `${name}: ${summary.projectedDem} Democratic-leaning calls, ${summary.projectedRep} Republican-leaning calls, ${summary.tossups} toss-ups across ${summary.stateRaces.length} contests`);
      button.innerHTML = `<strong>${code}</strong><small>D${summary.projectedDem} R${summary.projectedRep}${summary.tossups ? ` T${summary.tossups}` : ''}</small>`;
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
      panel.innerHTML = `<p class="eyebrow">National projection</p><h3>Choose a state</h3><div class="state-code">USA</div><p>The current KAHRELUM edition prices all 470 congressional contests. Each tile shows D-leaning, R-leaning and toss-up race calls.</p><dl><div><dt>Expected Democratic House seats</dt><dd>${currentProjectionData.house.expectedDemocraticSeats.toFixed(2)}</dd></div><div><dt>Democratic House control</dt><dd>${pct(currentProjectionData.house.pDemocraticControl)}</dd></div><div><dt>Expected D-caucus Senate seats</dt><dd>${currentProjectionData.senate.expectedDemocraticCaucusSeats.toFixed(2)}</dd></div><div><dt>Democratic Senate control</dt><dd>${pct(currentProjectionData.senate.pDemocraticCaucusControl)}</dd></div></dl><div class="boundary">Map colors summarize KAHRELUM probabilities from the latest accessible rating editions, not votes counted or certified results.</div>`;
      return;
    }
    const summary = stateSummary(selectedState);
    const averageText = `${pct(summary.average)} average D probability`;
    panel.innerHTML = `<p class="eyebrow">State projection file</p><h3>${escapeHtml(stateByCode[selectedState])}</h3><div class="state-code">${selectedState}</div><p>Current KAHRELUM race-level projection for every House and Senate contest in this state.</p><dl><div><dt>House expected D seats</dt><dd>${summary.expectedHouseDem.toFixed(2)} / ${summary.house.length}</dd></div><div><dt>Senate races</dt><dd>${summary.senate.length}</dd></div><div><dt>D / R / toss-up calls</dt><dd>${summary.projectedDem} / ${summary.projectedRep} / ${summary.tossups}</dd></div><div><dt>Model signal</dt><dd>${averageText}</dd></div><div><dt>Admitted candidate portraits</dt><dd>0</dd></div></dl><div class="boundary">Names below are source-listed discovery records, not official nominee certification. Portraits remain withheld pending identity and reuse-rights verification.</div>`;
  }

  function candidateCards(race) {
    if (!race.candidates.length) return '<p class="roster-warning">No source-listed candidate record was returned for this race.</p>';
    return `<div class="nominee-grid">${race.candidates.map((candidate) => {
      const party = candidate.party || 'UNKNOWN';
      const label = `${party}${candidate.incumbent ? ' · incumbent' : ''}`;
      return `<div class="nominee"><span class="nominee-avatar" aria-hidden="true">${escapeHtml(party.slice(0,1) || '?')}</span><div><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(label)} · source-listed; portrait not admitted</small></div></div>`;
    }).join('')}</div>`;
  }

  function raceCard(race) {
    const dem = pct(race.pDem);
    const rep = pct(1 - race.pDem);
    return `<article class="race-record">
      <div><div class="race-id">${escapeHtml(race.id)}</div><div class="race-tier">${escapeHtml(race.chamber)} · ${escapeHtml(race.tier)}</div><p class="fine">Publisher rating edition: ${escapeHtml(race.sourceDate)}${race.originalLock ? ' · also present in original lock' : ''}</p></div>
      <div><div class="race-tier">KAHRELUM party-outcome probability</div><div class="probability-pair"><div><strong>${dem}</strong><span>Democratic side</span></div><div><strong>${rep}</strong><span>Republican side</span></div></div><div class="probability-track" aria-label="${dem} Democratic probability and ${rep} Republican probability"><i style="width:${dem}"></i></div><p class="fine">Event: ${escapeHtml(race.event)}. This is not a named-candidate probability.</p></div>
      <div><div class="race-tier">Source-listed candidate file</div>${candidateCards(race)}<p class="roster-warning">Discovery roster only; official ballot identity and portrait rights remain unverified.</p></div>
    </article>`;
  }

  function matchesBand(race, band) {
    if (band === 'original') return race.originalLock;
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
      (!query || `${race.id} ${stateByCode[race.state]} ${race.tier} ${race.chamber} ${race.candidates.map((candidate) => candidate.name).join(' ')}`.toLowerCase().includes(query))
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
      const [houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse] = await Promise.all([
        fetch('/election/house-forecast-lock.json'),fetch('/election/senate-forecast-lock.json'),fetch('/election/current-projections.json'),fetch('/election/seat-projections.json'),fetch('/election/challenger-source-checks.json')
      ]);
      if (![houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse].every((response) => response.ok)) throw new Error('One or more forecast files could not be loaded.');
      const [house,senate,current,seats,challengers] = await Promise.all([houseResponse.json(),senateResponse.json(),currentResponse.json(),seatsResponse.json(),challengerResponse.json()]);
      seatProjectionData = seats;
      currentProjectionData = current;
      challengerData = challengers;
      races = buildRaces(house,current);
      if (races.length !== 470 || current.house.raceCount !== 435 || current.senate.raceCount !== 35 || current.coverage.racesWithSourceListedCandidates !== 470 || house.competitive_districts.length !== 81 || challengers.records.length !== 15 || challengers.unpricedChallengers !== 4) throw new Error('Fresh election projection did not pass race, candidate and challenger validation.');
      byId('mapHouseCount').textContent = current.house.raceCount;
      byId('mapSenateCount').textContent = current.senate.raceCount;
      byId('mapCandidateCount').textContent = current.coverage.sourceListedCandidateRecords;
      byId('mapPortraitCount').textContent = current.coverage.admittedPortraits;
      byId('currentEditionLine').textContent = `Fresh retrieval and computation: ${new Date(current.computedAtUtc).toLocaleString()} · House publisher rating edition: ${current.sources.house.publisherEdition} · Senate publisher rating edition: ${current.sources.senate.publisherEdition}.`;
      byId('mapLoadStatus').hidden = true;
      populateStateFilter(); renderMap(); renderStateBrief(); renderRaces(); renderSeatTracker(current); renderSeatComparison(); renderChallengerTable();
      const resetAndRender = () => {displayLimit=40;renderRaces();};
      byId('raceSearch').addEventListener('input',resetAndRender);
      byId('raceChamber').addEventListener('change',resetAndRender);
      byId('raceBand').addEventListener('change',resetAndRender);
      byId('raceState').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;renderMap();renderStateBrief();renderRaces();});
      byId('loadMoreRaces').addEventListener('click',() => {displayLimit+=40;renderRaces();});
      byId('houseComparisonButton').addEventListener('click',() => {seatComparisonMode='house';byId('houseComparisonButton').setAttribute('aria-pressed','true');byId('senateComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
      byId('senateComparisonButton').addEventListener('click',() => {seatComparisonMode='senate';byId('senateComparisonButton').setAttribute('aria-pressed','true');byId('houseComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
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
