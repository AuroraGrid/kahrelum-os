# AIR-02 | OSINT-to-official-record reconciliation
Version: v1.2 proposed November 14, 2026. Status: OPEN. Root cause: not independently established.
Scope: FAA nationwide ground stop of November 13, 2026. This is a dated addendum to AIR-02 v1 (November 13, 6:00 p.m. ET cutoff) and v1.1 (November 13, 11:27 p.m. ET cutoff), not a retroactive alteration of either record.

## Source custody and evidentiary classes

- **FAA PRIMARY:** official dated operational advisories and FAA statement. These establish what the agency ordered, recorded and initially reported, not an independently audited technical root cause.
- **OFFICIAL PRELIMINARY:** November 13 Department of Transportation briefing statements. Technical equipment and mechanism claims are attributed to officials and await equipment-level logs or a post-incident report.
- **INDEPENDENT AGENCY:** NWS radar/network status and NOAA space-weather products, which address their specific systems and must not be treated as FAA sensor-health attestations.
- **REPORTED OSINT / NOT YET REPRODUCED:** the OpenSky, adsb.lol, NEXRAD-station, aircraft GPS, callsign and military-aircraft counts supplied to KAHRELUM in a November 14 message. The original requests, responses, timestamps issued by servers, filters, raw payloads, hashes, and account-level data entitlements were not supplied. Recording these values now does not authenticate when they were originally collected or demonstrate a prediction before official remarks.
- **HYPOTHESIS:** a shared long-haul telecommunications dependency or cross-facility failure propagation path. Technically plausible, but the precise failing backbone, provider, route, component and failover history have not been established.

## Chronology (all Eastern Standard Time; add five hours for UTC)

- **3:36 p.m., November 13 (20:36 UTC):** Duffy subsequently said the FAA first experienced radar-data and communications instability at centers and TRACONs. This is an official retrospective timing claim, not a separately inspected system log.
- **3:53–3:54 p.m. (20:53–20:54 UTC):** FAA Advisory 111 lists event time 20:53 UTC and effective/signature time 20:54 UTC, ordering all departing flights ground stopped and inbound international flights handled case-by-case. The 17–18 minute difference from the 3:36 p.m. official account is different operational milestones, not a reason to overwrite either.
- **5:46 p.m. (22:46 UTC):** FAA Advisory 120 explicitly gave "COMMUNICATIONS FAILURE" as its reason and said departures could be coordinated as en-route facilities recovered.
- **6:01 p.m. (23:01 UTC):** NWS Central Operations said NWS radar data systems and network communications were operating normally. NWS repeated its radar-outage denial publicly on November 13.
- **6:36, 6:42, 6:49 p.m. (23:36, 23:42, 23:49 UTC):** the supplied OpenSky note reported 1,083; 1,035; and 990 aircraft respectively over the lower 48 under an unspecified sample/filter. Difference of 93 observed tracks, or approximately 8.6% of the first count, across 13 minutes. The figures have not been reproduced from archived raw responses.
- **Around 6:37 p.m. (23:37 UTC):** the supplied adsb.lol note reported within 30 miles: NYC/JFK 8 airborne versus 67 ground, LAX 14/40, DFW 7/36, DEN 13/29, ATL 5/25, ORD 9/24, DCA 8/22. These are reported regional receiver/algorithm outputs, not certified individual-airport movement records.
- **8:15 p.m. (01:15 UTC November 14):** Duffy said the national airspace had reopened, while cautioning that airlines would take time to restore schedules.
- **8:16–8:19 p.m. (01:16–01:19 UTC November 14):** FAA cancellation Advisory 005 lists event time 01:16 UTC and effective/signature time 01:19 UTC. The 8:15 briefing and advisory timestamps are distinct records.

## Claims reconciled

**A. Widespread ATC communications instability: SUPPORTED.**
The FAA said communications issues affected multiple ARTCCs. Advisory 120 identifies a communications failure. DOT stated that legacy time-division-multiplexing (TDM) switches/routers experienced overload and inconsistent radar and communications data. The DOT account is a preliminary official explanation; a final initiation mechanism remains open.
FAA statement: https://www.faa.gov/newsroom/faa-statement-nationwide-ground-stop
DOT briefing summary: https://www.transportation.gov/briefing-room/icymi-us-transportation-secretary-sean-p-duffy-announces-lifting-nationwide-ground
Advisory 111: https://www.fly.faa.gov/ois/oisedit/adv_oisedit_dis?day=11132026&number=111
Advisory 120: https://www.fly.faa.gov/ois/oisedit/adv_oisedit_dis?day=11132026&number=120
Advisory 005: https://www.fly.faa.gov/ois/oisedit/adv_oisedit_dis?day=11142026&number=5

**B. All 22 ARTCCs simultaneously lost long-haul communications: NOT ESTABLISHED; facility count requires correction.**
GAO's 2026 facility description identifies 21 en-route centers, not 22. Older FAA facility inventories additionally list four combined control facilities. The FAA initial statement says *multiple* ARTCCs were impacted; operational nationwide scope does not imply every center independently went offline. No facility-by-facility failure register or dependency map has been obtained.
GAO 2026 HTML: https://files.gao.gov/reports/GAO-26-107320/index.html
FAA facilities background: https://www.faa.gov/podcasts/the-air-up-there/how-air-traffic-works

**C. Remote radio links are a credible architecture; their failure is HYPOTHESIS.**
FAA Aeronautical Information Manual section 5-3-1 describes Remote Center Air/Ground sites linked to ARTCCs over landlines or microwave, and backup arrangements for ordinary frequency outages. That proves the architecture exists, *not* that a particular long-haul trunk, nationwide common backbone, or all remote sites failed on November 13.
FAA AIM: https://www.faa.gov/air_traffic/publications/aim_html/chap5_section_3.html

**D. Airspace drained and airport surface traffic accumulated: DIRECTIONAL OSINT, NOT AUTHENTICATED COUNTS.**
The supplied OpenSky sample moves downward and the adsb.lol hub ratios show more tracked ground than airborne aircraft under the supplied filters. Because unarchived ADS-B/Mode S public receiver feeds have incomplete and variable coverage, these are not a nationwide aircraft census, verified aircraft departures, or direct FAA ATC-facility health measures. A point-in-time track that is low and climbing does not establish an authorized takeoff or that it was flying VFR. Flight-plan and ATC clearances are not directly inferable from ADS-B position, altitude or callsign alone.
OpenSky REST documentation and data constraints: https://github.com/openskynetwork/opensky-api/blob/master/docs/free/rest.rst

**E. Emergency and special-flight interpretations: UNVERIFIED.**
The note reported zero emergency transponder squawks in its sample, named three apparent international widebodies (DAL281, DAL156, AFR71E), and described a Coast Guard/military helicopter near Tampa. None has a preserved response or independent flight-history validation here. A lack of sampled codes does not establish zero emergencies, and callsign/altitude alone cannot prove exemption category or clearance. The note does not give a numeric total of aircraft observed taking off despite the sentence that introduces one.

**F. NWS weather radar: independently CONFIRMED operational; the specific 199/208 count is UNVERIFIED.**
NWS Central Operations reported normal radar-data systems/network communications on November 13 at 23:01 UTC. The NWS separately rejected reports of a nationwide radar outage. The analyst's 199 fresh scans out of 208 sites, sampled within 15 minutes, cannot be certified without the site list, product type, query and denominator definition. Weather radar observations do not establish the health of FAA aircraft-surveillance or radar-data distribution systems.
NWS official statement: https://bsky.app/profile/nws.noaa.gov/post/3n2a4fos73p2e
NWS administrative messages (dynamic listing): https://www.nco.ncep.noaa.gov/status/messages/

**G. Space weather: no significant geomagnetic storm indicated; exact Kp=0 UNVERIFIED.**
A NOAA/SWPC three-day forecast issued November 14 at 00:30 UTC reported the greatest observed three-hour Kp over the preceding 24 hours as 1, below storm scale, and expected no geomagnetic storm. This supports a quiet geomagnetic context, but is not the same as validating the exact claimed Kp=0 at the analyst's sampling instant. Nor does quiet planetary Kp exclude all localized radio, GNSS or avionics interference.
NOAA via NWS forecast product (versioned/dynamic presentation): https://forecast.weather.gov/product.php?format=TXT&glossary=0&issuedby=TDF&product=DAY&site=PPG&version=1

**H. GPS, local radar/towers and Microsoft 365: NOT ESTABLISHED by the supplied material.**
The analyst described normal sampled aircraft GPS accuracy and local transmissions, but supplied neither sensor/quality distributions nor archived FAA facility status. A live broadcast or aircraft position cannot independently attest to ATC operational continuity. No common technical dependency tying Microsoft 365 to this FAA event has been established. Officials explicitly said not all FAA radar or telecom was lost.

**I. Cyber intrusion: NO INDICATION REPORTED, NOT FORENSICALLY EXCLUDED.**
DHS stated there was no indication of a cyberattack at the briefing, while acknowledging continued investigation. Record this as a preliminary official assessment, not as proof that cyber interference occurred or was definitively impossible.

## Current disposition and next falsifiers

- Confirmed: nationwide operational ground stop and cancellation; communications-failure categorization; problems at multiple FAA centers; independent NWS radar/network normal-status message.
- Attributed official explanation: overloaded legacy switches and routers, with newer IP equipment reportedly unaffected. No published technical log chain yet.
- Reported but unverified raw-feed values: OpenSky 1,083/1,035/990; seven hub area counts; individual callsigns, aircraft classifications, emergency squawks, 199/208 radar stations and exact Kp=0.
- Rejected as presently unsupported conclusions: every one of "22" ARTCCs lost comms; a single shared national backbone was the proven point of failure; all radar/GPS/towers were functioning normally; zero emergency flights nationwide; a cyberattack was confirmed or categorically ruled out.

Priority evidence for closure: FAA or provider root-cause report; affected-facility and network-topology map; switch and router telemetry; change/deployment logs; failure propagation and failover events; independent cybersecurity findings; timestamped raw OpenSky and adsb.lol API responses plus exact queries and SHA-256 digests; preserved NOAA/NWS products; and evidence differentiating FAA radar sensors from transmission/data-processing defects.

## Integrity and revision rule

This v1.2 reconciliation is new analysis prepared after the dated earlier reports, not independent proof of an earlier prediction. Preserve the original supplied text as a reported assertion; corrections are forward-only and the original AIR-02 v1 and v1.1 must remain readable and unchanged. The Git commit/PR time authenticates this reconciliation's publication to the repository, not the collection time of unarchived feeds.