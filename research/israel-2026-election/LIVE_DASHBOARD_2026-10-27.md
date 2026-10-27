# KAHRELUM live election research dashboard — October 27, 2026 Eastern time

Live: https://kahrelum.com/election-live

New K-PREDICT v0.6 seat-space applications were actually issued at 2026-10-27T20:28:26.273653Z (frozen pre-election numerical inputs) and 2026-10-27T20:28:29.104520Z (exit-poll-conditioned nowcast). These are approximately 4:28 PM EDT, October 27 / 1:28 AM PKT, October 28. Both were issued after scheduled poll close and after exit polls were inspected. Neither is a pre-election prediction or a replacement for C0.

At the owner's request the interface also shows a 4:28 AM Eastern morning input cutoff (08:28 UTC), explicitly marked as reconstructed later. No evidence of a contemporaneous morning model issue is claimed. October 27 is EDT, UTC−4, rather than fixed EST.

The frozen-input model uses the preserved final October 23 N12, Channel 13 and Kan survey seat vectors, equally weighted. The current nowcast uses The Petek's explicitly labeled secondary exit-poll aggregate, whose live panel included Kan, N12, Channel 13, Channel 14 and i24. Data dependencies and changes in the source panel are disclosed. Neither model uses counted official results. The source response and hash are preserved locally; the public snapshot records source URL, label and hash.

Original v0.6 model, config and historical data are read-only. All 34 audited code/data/config SHA-256 identities match, and all 51 v0.6 model tests pass. The new adapter fits on historical D−2 residuals through 2022 and generates 12,000 draws for each of correlated Student, shrinkage Gaussian and fixed Gaussian. Every draw is nonnegative integer seats summing to 120. The primary Student specification and both Gaussian comparisons are retained. No outcome-based method selection was performed.

These are experimental, uncalibrated seat-space forecasts covering 14 poll-listed parties. The inherited three-seat hurdle and Hamilton redistribution are heuristics, not a genuine vote-share/Bader–Ofer simulation. Polling-error variance is reused for the exit-poll nowcast without validation that it describes exit-poll error. Means, ranges and model probabilities are conditional; no prime minister or coalition agreement is predicted.

The interface displays party-level expected seats, 90% ranges, source observations, provisional differences, strict-largest probabilities including ties, and fixed-party-group majority probabilities. Differences from exit-poll estimates are not final accuracy scores. Official count, percent-counted denominator and final scores remain unavailable until verified. The attempted votes26.bechirot.gov.il source returned 404. A changed source schema blocks automatic reinterpretation; the last valid snapshot is retained with a warning.

A background Windows task checks sources and publishes approximately every five minutes. Browser pages request new data every minute. A successful scheduled collection-and-deployment cycle was independently read back. The owner computer must stay awake, connected and authenticated. The page warns on missed heartbeats. Immutable snapshot/prediction filenames retain earlier records. The three original API routes and 20 existing non-homepage file hashes are retained; the homepage gains a dashboard link. A cache-control header applies only to the new election-data surface.

The dashboard includes an interactive 120-seat explanation: 60 is exactly half; 61 is an outright majority over the remaining 59. Coalition arithmetic is distinguished from being the largest party. Outside support and abstentions can allow a minority government.

UI checks verified forecast/model switching, the 60/61 slider, loaded totals, public data links and source labels. C0 blob b9adfe504c15def6e1804a78a8828e54ae5e93a5 and scoring-protocol blob ab0692085b63c90570065f602c005c409c3b72d5 were rechecked unchanged. Frozen runtime execution, calibrated probabilities and prospective superiority remain unestablished.
