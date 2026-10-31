# Desk refresh and outcome resolution — October 31, 2026

The desk now reads a single versioned `nfl/desk-live.json` bundle from the public repository. It checks every 60 seconds while the browser tab is visible and supports a manual refresh. Search, team, evidence filters and opened explanation panels are retained. A dated deployed fallback is used if repository delivery is unavailable; an older or incomplete bundle never replaces a newer complete view.

The official NFL endpoint rolls from October to November automatically; a month/year heading and matching row dates are required. A generic January fallback is a failed check, while a properly identified empty November table is a valid no-new-trades result.

Source collection requests five-minute GitHub Actions runs, offset from the top of the hour and limited to the remaining October/November deadline dates. The workflow has an explicit 2026 lifecycle gate. The actual last completed check, per-source failures and delays are visible; the requested interval is not a real-time delivery guarantee. See [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Source activity consists of attributed discovery headlines with original links, source publication time when supplied and first observation time. Discovery does not promote an item into a completed trade or a reviewed editorial claim. Reviewed publications remain separately labeled. Forecast research dates do not advance merely because collection succeeds.

Current estimates overlay the historical board. The full forecast file records each estimate’s basis, actual evidence cutoff, sensitivity scenarios, counterarguments and sources. Old conversation-recovered probabilities and their excluded score arithmetic remain unchanged. The released Jack Jones is a roster-status exception, disclosed before cohort admission; his status value is not a prospective trade forecast. His release is documented by the [49ers announcement](https://www.49ers.com/news/the-49ers-acquire-dl-deforest-buckner).

## Outcome corrections

The event starts after the verified public snapshot observation, not at an old research date. The audit checks both official October and November NFL transaction tables. A pre-lock trade cannot become a YES. Trade dates with no exact time are represented as a conservative civil-date interval, because the table does not establish a timezone. A row overlapping publication or the deadline stays unresolved until an exact first-party completion record is reviewed.

Every admitted member remains in the denominator, including non-trades. The mean Brier score stays null until the entire cohort is resolved and the documented November 12 audit time has arrived. Both outcome records and the live bundle are committed by the workflow. A failed custody validation prevents publication. Revisions are chronological, preserve the original probability, and the scored version must precede the completion event as well as the deadline.

The `resolve` command is restricted to official NFL/registered club HTTPS sources, complete monthly-table custody and an explicitly reviewed completion timestamp. It is for resolving boundary ambiguity, not arbitrary manual outcome assertions. Neither a release nor a signing is a completed trade.

## Guarded production release

The new `desk-upgrade` release profile limits the Firebase overlay to the NFL desk, election comparison/map and their data files. It preserves the existing Plan → Preview → verified preview → Promote workflow, original API-body hashes, production-drift checks and dedicated publisher authentication. The separate `social-previews` profile and concurrent repository changes are retained.
