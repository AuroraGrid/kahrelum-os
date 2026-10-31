(() => {
  'use strict';

  // Keep the projection shell and its data dependencies on one release generation.
  // The query token prevents an already-open production browser from pairing a new
  // HTML shell with an older cached map bundle or projection payload.
  const ASSET_VERSION = '20261031-3';
  const readJson = (assetPath) => fetch(`${assetPath}?v=${ASSET_VERSION}`, { cache: 'no-store' });

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
  let mapChamber = 'ALL';
  let mapGeometry = null;
  let portraitCoverage = { matchedCards: 0, uniquePeople: 0, available: false };

  const byId = (id) => document.getElementById(id);
  const pct = (value) => `${Math.round(value * 100)}%`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function renderChamberTracker(targetId,title,value,total,threshold,seatType) {
    const opposing = total - value;
    const valueWidth = (value / total) * 100;
    const thresholdPosition = (threshold / total) * 100;
    byId(targetId).innerHTML = `<h4>${escapeHtml(title)}</h4><div class="seat-total"><strong>${value.toFixed(2)}</strong><span>Democratic${title === 'Senate' ? '-caucus' : ''} seats</span></div><div class="chamber-seat-bar" aria-label="${value.toFixed(2)} Democratic seats and ${opposing.toFixed(2)} Republican${title === 'Senate' ? '-aligned' : ''} seats"><i class="democratic" style="width:${valueWidth.toFixed(3)}%"></i><i class="republican" style="width:${(100 - valueWidth).toFixed(3)}%"></i><i class="majority-line" style="left:${thresholdPosition.toFixed(3)}%" title="Control threshold: ${threshold}"></i></div><div class="seat-split"><span class="party-dem">D ${value.toFixed(2)}</span><span>Control ${threshold}</span><span class="party-rep">R ${opposing.toFixed(2)}</span></div><p class="fine">${escapeHtml(seatType)} · mapped edition</p>`;
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
      const provider = record.provider === 'KAHRELUM' ? `<strong>${escapeHtml(record.provider)}</strong>` : `<a href="${escapeHtml(record.sourceUrl)}">${escapeHtml(record.provider)}</a>`;
      return `<tr><td data-label="Provider / edition">${provider} / ${escapeHtml(record.edition)}</td><td data-label="House D control">${formatControlProbability(record.houseDemocraticControlPct)}</td><td data-label="Senate D control">${formatControlProbability(record.senateDemocraticControlPct)}</td><td data-label="Publisher edition">${escapeHtml(record.sourceEdition)}</td><td data-label="Evidence note">${escapeHtml(record.note)} <span class="fine">${escapeHtml(record.retrievalStatus)}</span></td></tr>`;
    }).join('');
    byId('challengerRows').innerHTML = rows;
    byId('challengerCheckStatus').textContent = `Earlier source-check snapshot: ${formatUtc(challengerData.checkedAtUtc)} · ${challengerData.challengersWithAtLeastOneVerifiedControlProbability} numerical challengers. Preserved for audit; the prospective cohort above contains the newer captured probability review.`;
  }

  function formatUtc(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Time not recorded' : `${date.toLocaleString('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})} UTC`;
  }

  function sourceLink(url,label) {
    return httpsUrl(url) ? `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>` : escapeHtml(label);
  }

  function admissionView(data) {
    if (data?.schemaVersion !== '1.0.0' || !Array.isArray(data.providers) || data.providers.length !== 14 || new Set(data.providers.map((provider) => provider.id)).size !== 14 || data.commonUnderlyingInputCutoff !== false || data.historicalStrictCohort?.admittedChamberRecords !== 0) throw new Error('Admission ledger did not pass cohort validation.');
    const locked = data.publicLock?.status === 'VERIFIED_PUBLIC_COMMIT' && /^[0-9a-f]{40}$/.test(data.publicLock.commit || '') && data.publicLock.url === `https://github.com/AuroraGrid/kahrelum-os/commit/${data.publicLock.commit}` && data.status === 'PROSPECTIVE_COHORT_LOCKED';
    const totals = {house:{ready:0,admitted:0,excluded:0},senate:{ready:0,admitted:0,excluded:0}};
    data.providers.forEach((provider) => ['house','senate'].forEach((chamber) => {
      const record = provider[chamber];
      if (!record || typeof record.reason !== 'string' || typeof record.admitted !== 'boolean' || typeof record.admissionReady !== 'boolean') throw new Error('A chamber admission record is incomplete.');
      const value = record.probabilityPercent;
      if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) throw new Error('A captured probability is invalid.');
      const expectedStatus = record.admissionReady ? (locked ? 'ADMITTED_PROSPECTIVE' : 'READY_PENDING_PUBLIC_LOCK') : 'EXCLUDED';
      if (record.admitted !== (locked && record.admissionReady) || record.status !== expectedStatus) throw new Error('Publication status and chamber admission disagree.');
      totals[chamber].ready += record.admissionReady ? 1 : 0;
      totals[chamber].admitted += record.admitted ? 1 : 0;
      totals[chamber].excluded += record.admissionReady ? 0 : 1;
    }));
    ['house','senate'].forEach((chamber) => {
      const reported = data.counts?.byChamber?.[chamber];
      if (!reported || reported.admitted !== totals[chamber].admitted || reported.admissionReady !== totals[chamber].ready || reported.excluded !== totals[chamber].excluded) throw new Error('Admission totals do not match the provider records.');
    });
    function probabilityCell(record) {
      const conflict = record.conflictingProbabilitiesPercent || [];
      const probability = conflict.length ? conflict.map((value) => `${escapeHtml(value)}%`).join(' / ') : formatControlProbability(record.probabilityPercent);
      const label = record.admitted ? 'Prospectively admitted' : record.admissionReady ? 'Ready · public lock pending' : record.probabilityPercent === null ? 'No captured probability' : 'Excluded from scoring';
      return `<div class="admission-probability">${probability}</div><span class="status ${record.admitted ? 'verified' : 'pending'}">${label}</span>`;
    }
    const rows = data.providers.map((provider) => {
      const sources = [...new Set([...(provider.house.sourceUrls || []),...(provider.senate.sourceUrls || [])])];
      const evidenceLinks = sources.map((url,index) => sourceLink(url,`Source ${index + 1}`)).join(' · ');
      const notes = provider.notes.length ? `<p class="fine">${provider.notes.map(escapeHtml).join(' ')}</p>` : '';
      return `<tr><td data-label="Provider / edition">${sourceLink(provider.primarySourceUrl,provider.provider)}<small>${escapeHtml(provider.edition)}</small></td><td data-label="House control / admission">${probabilityCell(provider.house)}</td><td data-label="Senate control / admission">${probabilityCell(provider.senate)}</td><td data-label="Review and source edition"><p><strong>House:</strong> ${escapeHtml(provider.house.reason)}</p><p><strong>Senate:</strong> ${escapeHtml(provider.senate.reason)}</p><details><summary>Source edition and evidence</summary><p class="fine">${escapeHtml(provider.house.sourcePublicationLabel)}</p><p class="fine">${evidenceLinks}</p>${notes}</details></td></tr>`;
    }).join('');
    const publicProof = locked ? `Publicly locked ${escapeHtml(formatUtc(data.publicLock.committedAtUtc))} · ${sourceLink(data.publicLock.url,`immutable commit ${data.publicLock.commit.slice(0,12)}`)}. The commit anchors factual observations and tool-representation digests; it is not an HTTP-wire archive.` : `${totals.house.ready + totals.senate.ready} chamber records passed source and event review. Their prospective admission starts only after a verified public commit anchors the factual receipts.`;
    return {locked,totals,rows,publicProof};
  }

  function renderAdmission(data) {
    const view = admissionView(data);
    const house = view.totals.house;
    const senate = view.totals.senate;
    byId('houseAdmissionCount').textContent = view.locked ? `${house.admitted} admitted` : `${house.ready} ready`;
    byId('houseAdmissionDetail').textContent = view.locked ? `${house.excluded} excluded · prospective House cohort` : `${house.excluded} excluded · public lock pending`;
    byId('senateAdmissionCount').textContent = `${senate.admitted} admitted`;
    byId('senateAdmissionDetail').textContent = `${senate.excluded} provider slots held · caucus and source rules`;
    byId('historicalAdmissionCount').textContent = `${data.historicalStrictCohort.admittedChamberRecords} admitted`;
    byId('admissionSnapshotStatus').textContent = `Capture window: ${formatUtc(data.captureWindow.startAtUtc)} to ${formatUtc(data.captureWindow.endAtUtc)} · ${data.counts.providers} providers reviewed · ${data.counts.numericalObservations} numerical chamber observations.`;
    byId('admissionPublicLock').innerHTML = view.publicProof;
    byId('admissionRows').innerHTML = view.rows;
    byId('admissionKahrelumReference').innerHTML = `KAHRELUM reference observed in this window: <strong>${formatControlProbability(data.kahrelumReference.houseControlProbability * 100)} House</strong> and <strong>${formatControlProbability(data.kahrelumReference.senateControlProbability * 100)} Senate</strong>, from edition ${escapeHtml(data.kahrelumReference.editionId)}. The original House lock remains 91%; Senate comparison remains held for independent-caucus mapping.`;
    const ref = view.locked ? data.publicLock.commit : 'main';
    byId('admissionEvidenceLink').href = `https://github.com/AuroraGrid/kahrelum-os/tree/${ref}/research/election-challenge-2026`;
  }

  async function loadAdmission() {
    try {
      const response = await readJson('/election/comparator-admission.json');
      if (!response.ok) throw new Error('The admission ledger could not be loaded.');
      renderAdmission(await response.json());
    } catch (error) {
      byId('admissionSnapshotStatus').textContent = `Admission status unavailable: ${error.message}`;
      byId('houseAdmissionCount').textContent = 'Unverified here';
      byId('senateAdmissionCount').textContent = 'Unverified here';
      byId('houseAdmissionDetail').textContent = 'Read the public evidence record for the last verified status.';
      byId('senateAdmissionDetail').textContent = 'No admission is inferred from a failed load.';
      byId('admissionPublicLock').textContent = 'Public-lock status could not be verified in this view. Original forecast records remain visible.';
      byId('admissionRows').innerHTML = '<tr><td colspan="4">The admission ledger is unavailable. No provider is shown as admitted without its publication record.</td></tr>';
    }
  }

  function buildRaces(houseLock, current) {
    const originalIds = new Set(houseLock.competitive_districts.map((item) => item.district));
    const houseRaces = current.house.districts.map((item) => ({
      id:item.contestId,contestId:item.contestId,state:item.state,chamber:'House',tier:item.tier,pDem:item.pDem,
      sourceDate:current.sources.house.publisherEdition,event:'Democratic nominee wins district',coverage:'current',
      originalLock:originalIds.has(item.contestId),candidates:item.candidates || []
    }));
    const senateRaces = current.senate.races.map((item) => ({
      id:`${item.state} Senate${item.contestId.endsWith('-special') ? ' special' : ''}`,contestId:item.contestId,state:item.state,
      chamber:'Senate',tier:item.tier,pDem:item.pDemocraticCaucus,sourceDate:current.sources.senate.publisherEdition,
      event:'Democratic-caucus candidate wins seat',coverage:'current',originalLock:true,candidates:item.candidates || [],
      independentCandidateRisk:item.independentCandidateRisk
    }));
    return [...houseRaces, ...senateRaces];
  }

  function normalizePortraitName(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  }

  function httpsUrl(value) {
    try { return new URL(value).protocol === 'https:'; } catch (_) { return false; }
  }

  function admittedPortrait(candidate) {
    const portrait = candidate.portrait;
    if (!portrait || portrait.status !== 'ADMITTED' || !httpsUrl(portrait.sourceUrl) || !httpsUrl(portrait.licenseUrl) || !portrait.license || !portrait.bioguideId || !portrait.reviewedAtUtc) return null;
    const localImage = /^[A-Z][0-9]{6}$/.test(portrait.bioguideId) && /^[a-f0-9]{64}$/.test(portrait.imageSha256 || '') && portrait.url === `/assets/candidate-portraits/${portrait.bioguideId}-${portrait.imageSha256.slice(0,16)}.jpg`;
    if (!httpsUrl(portrait.url) && !localImage) return null;
    return portrait;
  }

  function applyPortraitLedger(raceRecords,portraitLedger) {
    // Bind a picture to this exact discovery record. Candidate IDs alone are not
    // enough when source rosters change, and duplicate IDs are never resolved by
    // whichever record happens to be last in the file.
    raceRecords.forEach((race) => race.candidates.forEach((candidate) => { delete candidate.portrait; }));
    if (portraitLedger?.schema !== 'KAHRELUM_CANDIDATE_PORTRAITS_v1.0' || !Array.isArray(portraitLedger.records)) return { matchedCards:0,uniquePeople:0,available:false };
    const admitted = new Map();
    const duplicates = new Set();
    portraitLedger.records.forEach((record) => {
      if (!record || typeof record !== 'object') return;
      const id = String(record.sourceCandidateId);
      if (admitted.has(id)) duplicates.add(id);
      admitted.set(id,record);
    });
    const people = new Set();
    let matchedCards = 0;
    raceRecords.forEach((race) => race.candidates.forEach((candidate) => {
      const id = String(candidate.sourceCandidateId);
      const portrait = admitted.get(id);
      if (!portrait || duplicates.has(id) || portrait.state !== race.state || portrait.party !== candidate.party || portrait.contestId !== race.contestId || portrait.chamber !== race.chamber || normalizePortraitName(portrait.candidateName) !== normalizePortraitName(candidate.name) || !admittedPortrait({portrait})) return;
      candidate.portrait = portrait;
      matchedCards += 1;
      people.add(portrait.bioguideId);
    }));
    return {matchedCards,uniquePeople:people.size,available:true};
  }

  function handlePortraitError(event) {
    const image = event.target;
    if (!image?.classList?.contains('nominee-photo')) return;
    // The initials sit underneath the image and are already sized, so a remote
    // failure cannot leave a broken icon or move the candidate's name.
    image.remove();
  }

  function portraitCount(raceRecords) {
    return raceRecords.reduce((total,race) => total + race.candidates.filter(admittedPortrait).length,0);
  }

  function stateSummary(code) {
    const stateRaces = races.filter((race) => race.state === code && (mapChamber === 'ALL' || race.chamber === mapChamber));
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
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',mapGeometry.viewBox);
    svg.setAttribute('role','img');
    svg.setAttribute('aria-labelledby','usMapTitle usMapDescription');
    svg.classList.add('us-map-svg');
    const title = document.createElementNS('http://www.w3.org/2000/svg','title');
    title.id = 'usMapTitle';
    title.textContent = `United States ${mapChamber === 'ALL' ? 'congressional' : mapChamber} forecast map`;
    const description = document.createElementNS('http://www.w3.org/2000/svg','desc');
    description.id = 'usMapDescription';
    description.textContent = 'Select a state to filter the race files. Blue indicates a Democratic average edge, red a Republican average edge, and gold an even average.';
    svg.append(title,description);
    mapGeometry.locations.forEach((location) => {
      const code = location.id.toUpperCase();
      const name = stateByCode[code];
      if (!name) return;
      const summary = stateSummary(code);
      const state = document.createElementNS('http://www.w3.org/2000/svg','path');
      state.setAttribute('d',location.path);
      state.setAttribute('class',`state-shape ${mapClass(summary)}`);
      state.setAttribute('data-state',code);
      state.setAttribute('tabindex','0');
      state.setAttribute('role','button');
      state.setAttribute('aria-pressed',selectedState === code ? 'true' : 'false');
      state.setAttribute('aria-label',`${name}: ${summary.projectedDem} Democratic-leaning calls, ${summary.projectedRep} Republican-leaning calls, ${summary.tossups} toss-ups across ${summary.stateRaces.length} ${mapChamber === 'ALL' ? 'congressional' : mapChamber} contests`);
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg','title');
      tooltip.textContent = `${name} — D ${summary.projectedDem}, R ${summary.projectedRep}, toss-up ${summary.tossups}`;
      state.appendChild(tooltip);
      state.addEventListener('click',() => selectState(code));
      state.addEventListener('keydown',(event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectState(code); }
      });
      svg.appendChild(state);
    });
    map.appendChild(svg);
    const chamberLabel = mapChamber === 'ALL' ? 'all House and Senate contests' : `${mapChamber} contests`;
    const stateLabel = selectedState === 'ALL' ? 'National view' : stateByCode[selectedState];
    byId('mapViewSummary').textContent = `${stateLabel} · ${chamberLabel}. Select a state on the map or use the state menu.`;
  }

  function selectState(code) {
    selectedState = selectedState === code ? 'ALL' : code;
    displayLimit = 40;
    byId('raceState').value = selectedState;
    byId('mapStateJump').value = selectedState;
    renderMap();
    renderStateBrief();
    renderRaces();
    if (selectedState !== 'ALL' && window.matchMedia('(max-width: 900px)').matches) byId('stateBrief').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderStateBrief() {
    const panel = byId('stateBrief');
    if (selectedState === 'ALL') {
      panel.innerHTML = `<p class="eyebrow">National projection</p><h3>Choose a state</h3><div class="state-code">USA</div><p>This published KAHRELUM map covers all 470 congressional contests. Each state shape summarizes D-leaning, R-leaning and toss-up race calls for the selected chamber.</p><dl><div><dt>Expected Democratic House seats</dt><dd>${currentProjectionData.house.expectedDemocraticSeats.toFixed(2)}</dd></div><div><dt>Democratic House control</dt><dd>${pct(currentProjectionData.house.pDemocraticControl)}</dd></div><div><dt>Expected D-caucus Senate seats</dt><dd>${currentProjectionData.senate.expectedDemocraticCaucusSeats.toFixed(2)}</dd></div><div><dt>Democratic Senate control</dt><dd>${pct(currentProjectionData.senate.pDemocraticCaucusControl)}</dd></div></dl><div class="boundary">Map colors summarize KAHRELUM probabilities from the displayed rating editions, not votes counted or certified results.</div>`;
      return;
    }
    const summary = stateSummary(selectedState);
    const averageText = summary.average === null ? `No ${mapChamber} contest on the current file` : `${pct(summary.average)} average D probability`;
    panel.innerHTML = `<p class="eyebrow">State projection file</p><h3>${escapeHtml(stateByCode[selectedState])}</h3><div class="state-code">${selectedState}</div><p>Current KAHRELUM race-level projection for the selected ${mapChamber === 'ALL' ? 'House and Senate' : mapChamber} view in this state.</p><dl><div><dt>House expected D seats</dt><dd>${summary.expectedHouseDem.toFixed(2)} / ${summary.house.length}</dd></div><div><dt>Senate races</dt><dd>${summary.senate.length}</dd></div><div><dt>D / R / toss-up calls</dt><dd>${summary.projectedDem} / ${summary.projectedRep} / ${summary.tossups}</dd></div><div><dt>Model signal</dt><dd>${averageText}</dd></div><div><dt>Verified portraits in this view</dt><dd>${portraitCount(summary.stateRaces)} / ${summary.stateRaces.reduce((total,race) => total + race.candidates.length,0)}</dd></div></dl><div class="boundary">Names are source-listed discovery records, not official nominee certification. Photos have recorded identity and public-domain provenance; initials mark records without a verified photo.</div>`;
  }

  function candidateCards(race) {
    if (!race.candidates.length) return '<p class="roster-warning">No source-listed candidate record was returned for this race.</p>';
    const partyOrder = {D:0,R:1,I:2,L:3};
    const orderedCandidates = [...race.candidates].sort((a,b) => (partyOrder[a.party] ?? 9) - (partyOrder[b.party] ?? 9));
    return `<div class="nominee-grid">${orderedCandidates.map((candidate) => {
      const party = candidate.party || 'UNKNOWN';
      const label = `${party}${candidate.incumbent ? ' · incumbent' : ''}`;
      const portrait = admittedPortrait(candidate);
      const initials = candidate.name.split(/\s+/).map((part) => part[0]).join('').slice(0,2) || '?';
      const fallback = `<span class="nominee-avatar party-${escapeHtml(party.toLowerCase())}" aria-hidden="true">${escapeHtml(initials)}</span>`;
      const visual = `<span class="nominee-visual">${fallback}${portrait ? `<img class="nominee-photo" src="${escapeHtml(portrait.url)}" alt="${escapeHtml(candidate.name)}" width="56" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}</span>`;
      const custody = portrait ? `<a class="portrait-source" href="${escapeHtml(portrait.sourceUrl)}" title="${escapeHtml(portrait.attribution)}">Photo source</a> · <a class="portrait-source" href="${escapeHtml(portrait.licenseUrl)}">${escapeHtml(portrait.license)}</a>` : 'Photo not yet verified';
      return `<div class="nominee">${visual}<div><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(label)}</small><small class="portrait-credit">${custody}</small></div></div>`;
    }).join('')}</div>`;
  }

  function raceCard(race) {
    const dem = pct(race.pDem);
    const rep = pct(1 - race.pDem);
    return `<article class="race-record">
      <div><div class="race-id">${escapeHtml(race.id)}</div><div class="race-tier">${escapeHtml(race.chamber)} · ${escapeHtml(race.tier)}</div><p class="fine">Publisher rating edition: ${escapeHtml(race.sourceDate)}${race.originalLock ? ' · also present in original lock' : ''}</p></div>
      <div><div class="race-tier">KAHRELUM party-outcome probability</div><div class="probability-pair"><div class="party-dem"><strong>${dem}</strong><span>Democratic side</span></div><div class="party-rep"><strong>${rep}</strong><span>Republican side</span></div></div><div class="probability-track" aria-label="${dem} Democratic probability and ${rep} Republican probability"><i class="democratic" style="width:${dem}"></i><i class="republican" style="width:${rep}"></i></div><p class="fine">Event: ${escapeHtml(race.event)}. This is not a named-candidate probability.</p></div>
      <div><div class="race-tier">Source-listed candidate file</div>${candidateCards(race)}<p class="roster-warning">Discovery roster; candidate listing and photo identity do not certify ballot eligibility.</p></div>
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
      byId('mapStateJump').appendChild(option.cloneNode(true));
    });
  }

  function populateSearchSuggestions() {
    const suggestions = byId('raceSearchSuggestions');
    const fragment = document.createDocumentFragment();
    races.forEach((race) => {
      const raceOption = document.createElement('option');
      raceOption.value = race.id;
      raceOption.label = `${stateByCode[race.state]} · ${race.chamber} · ${race.tier}`;
      fragment.appendChild(raceOption);
      race.candidates.forEach((candidate) => {
        const candidateOption = document.createElement('option');
        candidateOption.value = candidate.name;
        candidateOption.label = `${candidate.party || 'unknown party'} · ${race.id} · source-listed`;
        fragment.appendChild(candidateOption);
      });
    });
    suggestions.appendChild(fragment);
  }

  function setMapChamber(chamber) {
    mapChamber = chamber;
    byId('raceChamber').value = chamber;
    document.querySelectorAll('[data-map-chamber]').forEach((item) => item.setAttribute('aria-pressed',String(item.dataset.mapChamber === chamber)));
    displayLimit = 40;
    renderMap(); renderStateBrief(); renderRaces();
  }

  function resetNationalView() {
    selectedState = 'ALL';
    byId('raceState').value = 'ALL';
    byId('mapStateJump').value = 'ALL';
    renderMap(); renderStateBrief(); renderRaces();
  }

  async function init() {
    // Admission has its own failure state, so an unavailable cohort cannot hide
    // the map or identity-checked candidate photographs.
    void loadAdmission();
    try {
      const [houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse,mapResponse,portraitResponse] = await Promise.all([
        readJson('/election/house-forecast-lock.json'),readJson('/election/senate-forecast-lock.json'),readJson('/election/current-projections.json'),readJson('/election/seat-projections.json'),readJson('/election/challenger-source-checks.json'),readJson('/assets/us-states-map.json'),readJson('/election/candidate-portraits.json').catch(() => null)
      ]);
      if (![houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse,mapResponse].every((response) => response.ok)) throw new Error('One or more forecast files or the geographic map could not be loaded.');
      const [house,senate,current,seats,challengers,geometry,portraits] = await Promise.all([houseResponse.json(),senateResponse.json(),currentResponse.json(),seatsResponse.json(),challengerResponse.json(),mapResponse.json(),portraitResponse?.ok ? portraitResponse.json().catch(() => null) : null]);
      seatProjectionData = seats;
      currentProjectionData = current;
      challengerData = challengers;
      mapGeometry = geometry;
      races = buildRaces(house,current);
      portraitCoverage = applyPortraitLedger(races,portraits);
      if (races.length !== 470 || current.house.raceCount !== 435 || current.senate.raceCount !== 35 || current.coverage.racesWithSourceListedCandidates !== 470 || house.competitive_districts.length !== 81 || challengers.records.length !== 15 || challengers.challengersChecked !== 14 || challengers.unpricedChallengers !== 0 || challengers.records.some((record) => record.houseDemocraticControlPct === null && record.senateDemocraticControlPct === null) || geometry.schema !== 'KAHRELUM_US_STATES_MAP_v1.0' || geometry.locations.length !== 50) throw new Error('Fresh election projection did not pass race, candidate, map and challenger validation.');
      byId('mapHouseCount').textContent = current.house.raceCount;
      byId('mapSenateCount').textContent = current.senate.raceCount;
      byId('mapCandidateCount').textContent = current.coverage.sourceListedCandidateRecords;
      byId('mapPortraitCount').textContent = portraitCoverage.available ? portraitCoverage.matchedCards : '—';
      byId('mapPortraitCount').title = portraitCoverage.available ? `${portraitCoverage.matchedCards} of ${current.coverage.sourceListedCandidateRecords} source-listed candidate records have an identity-matched public-domain photo.` : 'Portrait ledger unavailable; candidate names and initials remain visible.';
      byId('currentEditionLine').textContent = `Mapped edition computed: ${new Date(current.computedAtUtc).toLocaleString()} · House publisher rating edition: ${current.sources.house.publisherEdition} · Senate publisher rating edition: ${current.sources.senate.publisherEdition}.`;
      byId('mapLoadStatus').hidden = true;
      byId('raceList').addEventListener('error',handlePortraitError,true);
      populateStateFilter(); populateSearchSuggestions(); renderMap(); renderStateBrief(); renderRaces(); renderSeatTracker(current); renderSeatComparison(); renderChallengerTable();
      const resetAndRender = () => {displayLimit=40;renderRaces();};
      byId('raceSearch').addEventListener('input',resetAndRender);
      byId('raceChamber').addEventListener('change',(event) => setMapChamber(event.target.value));
      byId('raceBand').addEventListener('change',resetAndRender);
      byId('raceState').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;byId('mapStateJump').value=selectedState;renderMap();renderStateBrief();renderRaces();});
      byId('mapStateJump').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;byId('raceState').value=selectedState;renderMap();renderStateBrief();renderRaces();});
      byId('loadMoreRaces').addEventListener('click',() => {displayLimit+=40;renderRaces();});
      byId('houseComparisonButton').addEventListener('click',() => {seatComparisonMode='house';byId('houseComparisonButton').setAttribute('aria-pressed','true');byId('senateComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
      byId('senateComparisonButton').addEventListener('click',() => {seatComparisonMode='senate';byId('senateComparisonButton').setAttribute('aria-pressed','true');byId('houseComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
      document.querySelectorAll('[data-map-chamber]').forEach((button) => button.addEventListener('click',() => setMapChamber(button.dataset.mapChamber)));
      byId('nationalMapButton').addEventListener('click',resetNationalView);
      void senate;
    } catch (error) {
      byId('mapLoadStatus').hidden = false;
      byId('mapLoadStatus').textContent = `Map unavailable: ${error.message} The headline forecast record remains visible below.`;
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {normalizePortraitName,applyPortraitLedger,admittedPortrait,candidateCards,handlePortraitError,buildRaces,portraitCount,admissionView,renderAdmission,formatUtc};
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded',init);
})();

