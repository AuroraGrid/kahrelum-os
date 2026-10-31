#!/usr/bin/env python3
"""Complete, attributable NFL forecast coverage and prospective cohort custody.

Generation does not establish a public lock. Admission requires a separately
retrieved immutable snapshot, publication receipt, and official pre-lock check.
"""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import importlib.util
import json
import math
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("_forecast_engine", ROOT / "scripts" / "sports_intelligence.py")
engine = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(engine)

SCHEMA = "KAHRELUM_CURRENT_NFL_FORECASTS_v1.0"
MODEL = "KAHRELUM_FULL_COVERAGE_v1.0"
METHOD_PATH = "research/nfl-2026-trade-deadline/FULL_COVERAGE_METHOD.md"
SNAPSHOT_PATH = "nfl/current-forecasts.json"
REPOSITORY = "AuroraGrid/kahrelum-os"
BASELINE_FEATURES = {"originalSourceNotCaptured": True}
INDEXED_SIGNAL_WEIGHT = 0.5
SOURCE_REVIEW_AT = "2026-10-31T04:15:24Z"
FOWLER_SOURCE_REVIEW_AT = "2026-10-31T04:17:38Z"
ROSTER_REVIEW_AT = "2026-10-31T04:22:49Z"
PAYNE_NOTE_COMMIT = "813a2d1c536f6b2fbbce1e5e830d43a1a9c948e0"
PAYNE_NOTE_AT = "2026-10-31T01:37:00Z"
PAYNE_NOTE_PATH = "research/nfl-2026-trade-deadline/SOURCE_CHECK_2026-10-30_DARON_PAYNE_FOOT_INJURY.md"
PAYNE_NOTE_URL = f"https://github.com/{REPOSITORY}/blob/{PAYNE_NOTE_COMMIT}/{PAYNE_NOTE_PATH}"
BREER_URL = "https://www.si.com/nfl/albert-breer-how-two-former-roommates-put-jeffery-simmons-trade-together"
FOWLER_URL = "https://abc7news.com/post/2026-nfl-trade-deadline-ranking-top-25-candidates-move-team-fits/19989132/"
ROSTER_EXCLUSIONS = {
    "K26-062": {
        "candidateId": "K26-062", "player": "Jack Jones", "reasonCode": "OFFICIAL_RELEASE_BEFORE_LOCK",
        "reason": "Officially released by San Francisco on October 28; the displayed zero is current-club trade eligibility status, not a forecast about a future signing and subsequent trade.",
        "sourceEventDate": "2026-10-28", "reviewedAtUtc": ROSTER_REVIEW_AT,
        "sourceUrls": ["https://www.49ers.com/news/the-49ers-acquire-dl-deforest-buckner",
                       "https://www.49ers.com/team/transactions/2026"],
    }
}

# A scenario describes what a category would mean IF its indexed claim holds.
# Indexed labels are never silently promoted to authenticated factual inputs.
TIER_SCENARIOS = {
    "ANALYST_RADAR": {},
    "ESPN_WATCHLIST": {},
    "REPORTED_MARKET": {"credibleReporterMarketSignal": True},
    "REPORTED_INQUIRY": {"verifiedInquiry": True},
    "COACH_CONFIRMED_PLAYER_REQUEST": {"confirmedTradeRequest": True},
    "TEAM_RESISTING": {"teamShutDownInquiriesOrNotAvailable": True},
    "OFF_MARKET_REPORTED": {"teamShutDownInquiriesOrNotAvailable": True, "retentionOrDeadCapConstraint": True},
}

# These are paraphrases of original reporting read on SOURCE_REVIEW_AT, not
# claims of an accepted offer, official transaction, or verified contract audit.
REVIEWED_FEATURES = {
    "K26-020": ({"verifiedInquiry": True, "teamShutDownInquiriesOrNotAvailable": True, "retentionOrDeadCapConstraint": True}, BREER_URL, "Breer reports Miami rebuffed interest and values leadership."),
    "K26-030": ({"credibleReporterMarketSignal": True}, BREER_URL, "Breer identifies Jackson as a potential mover."),
    "K26-046": ({"originalAvailabilityReport": True, "expiringContract": True}, BREER_URL, "Breer reports potential availability and an expiring contract."),
    "K26-056": ({"credibleReporterMarketSignal": True}, BREER_URL, "Breer identifies Armstrong as potentially available."),
    "K26-058": ({"teamShutDownInquiriesOrNotAvailable": True, "retentionOrDeadCapConstraint": True}, BREER_URL, "Breer reports the Jets view Wilson as unavailable."),
    "K26-072": ({"reportedMoreLikelyToStay": True, "retentionOrDeadCapConstraint": True}, FOWLER_URL, "Fowler describes Cleveland retaining Jeudy unless offered substantial compensation."),
    "K26-079": ({"credibleReporterMarketSignal": True, "expiringContract": True}, BREER_URL, "Breer identifies Chaisson as a potential target on an expiring deal."),
    "K26-102": ({"teamShutDownInquiriesOrNotAvailable": True}, BREER_URL, "Breer reports the Chargers rejected veteran inquiries."),
    "K26-122": ({"verifiedInquiry": True, "teamShutDownInquiriesOrNotAvailable": True, "retentionOrDeadCapConstraint": True}, BREER_URL, "Breer reports Miami rebuffed interest and values leadership."),
}
FOWLER_FEATURES = {
    "K26-035": ({"sellerPosture": True, "buyerFitOrReducedRole": True}, FOWLER_URL, "Rebuild context and potential buyer fit."),
    "K26-039": ({"buyerFitOrReducedRole": True, "retentionOrDeadCapConstraint": True}, FOWLER_URL, "Buyer fit; depleted line supports retention."),
    "K26-040": ({"buyerFitOrReducedRole": True, "retentionOrDeadCapConstraint": True}, FOWLER_URL, "Buyer fit; salary complicates a deal."),
    "K26-055": ({"expiringContract": True, "buyerFitOrReducedRole": True, "teamShutDownInquiriesOrNotAvailable": True}, [FOWLER_URL, BREER_URL], "Expiring deal; broader team resistance applies."),
    "K26-063": ({"buyerFitOrReducedRole": True, "credibleReporterMarketSignal": True}, FOWLER_URL, "Reduced role with potential guard demand."),
    "K26-071": ({"credibleReporterMarketSignal": True, "sellerPosture": True, "retentionOrDeadCapConstraint": True}, FOWLER_URL, "Potential availability; coach relationship supports retention."),
    "K26-088": ({"buyerFitOrReducedRole": True, "reportedMoreLikelyToStay": True}, FOWLER_URL, "Potential fit; limited team selling plans."),
    "K26-090": ({"buyerFitOrReducedRole": True}, FOWLER_URL, "Potential guard fit; availability remains uncertain."),
    "K26-100": ({"expiringContract": True, "retentionOrDeadCapConstraint": True, "reportedMoreLikelyToStay": True}, FOWLER_URL, "Expiring deal; contender context supports retention."),
    "K26-103": ({"buyerFitOrReducedRole": True, "retentionOrDeadCapConstraint": True}, FOWLER_URL, "Limited role; thin receiver depth constrains."),
    "K26-108": ({"buyerFitOrReducedRole": True, "credibleReporterMarketSignal": True}, FOWLER_URL, "Reduced role and reported market attention."),
}
REVIEWED_FEATURES.update(FOWLER_FEATURES)


def parse_time(value: str) -> dt.datetime:
    result = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("Timestamps must include a timezone")
    return result.astimezone(dt.timezone.utc)


def iso(value: dt.datetime) -> str:
    if value.tzinfo is None:
        raise ValueError("Timestamps must include a timezone")
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def encoded(value: dict) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sensitivity(probability: float) -> dict:
    """A fixed +/-1.5 log-odds scenario range, NOT a confidence interval."""
    p = max(0.0001, min(0.9999, probability))
    log_odds = math.log(p / (1 - p))
    return {"low": round(1 / (1 + math.exp(-(log_odds - 1.5))), 2),
            "high": round(1 / (1 + math.exp(-(log_odds + 1.5))), 2),
            "kind": "SUBJECTIVE_LOG_ODDS_SENSITIVITY_NOT_CONFIDENCE_INTERVAL",
            "logOddsShift": 1.5}


def indexed_estimate(evidence_type: str) -> tuple[float, dict]:
    scenario = TIER_SCENARIOS.get(evidence_type, {})
    baseline = engine.structured_forecast_probability(BASELINE_FEATURES)
    conditional = engine.structured_forecast_probability({**BASELINE_FEATURES, **scenario})
    probability = round(baseline + INDEXED_SIGNAL_WEIGHT * (conditional - baseline), 2)
    return probability, {"baselineProbability": baseline, "baselineFeatures": BASELINE_FEATURES.copy(),
                         "conditionalScenarioFeatures": scenario.copy(), "conditionalProbability": conditional,
                         "indexedSignalWeight": INDEXED_SIGNAL_WEIGHT,
                         "claimStatus": "INDEXED_SIGNAL_NOT_FIRSTHAND_VERIFIED"}


def validate_decision(decision: dict, candidate_ids: set[str], now: dt.datetime) -> None:
    if decision.get("candidateId") not in candidate_ids:
        raise ValueError("Decision refers to an unknown candidate")
    if decision.get("candidateId") in ROSTER_EXCLUSIONS:
        raise ValueError("An excluded roster-status row requires a separate new eligibility review and cohort")
    p = decision.get("probability")
    if isinstance(p, bool) or not isinstance(p, (int, float)) or not 0 < p < 1:
        raise ValueError("A prospective probability must be strictly between zero and one")
    if decision.get("status") != "ACCEPTED_SOURCE_REVIEW":
        raise ValueError("Only explicitly accepted source reviews can alter forecasts")
    cutoff, reviewed = parse_time(decision["informationCutoffUtc"]), parse_time(decision["reviewedAtUtc"])
    if not cutoff <= reviewed <= now or reviewed >= engine.DEADLINE:
        raise ValueError("Decision timing is future-dated, reversed, or after the deadline")
    if not decision.get("rationale") or not decision.get("counterarguments"):
        raise ValueError("Decision requires rationale and counterarguments")
    if not decision.get("sourceUrls") or any(urlparse(url).scheme != "https" for url in decision["sourceUrls"]):
        raise ValueError("Decision requires HTTPS original-source links")


def build_current_forecasts(board: dict, now: dt.datetime, previous: dict | None = None,
                            decisions: list[dict] | None = None) -> dict:
    """Build from the historical board without mutating it or excluded records."""
    if now >= engine.DEADLINE:
        raise ValueError("No new prospective estimates can be created after the deadline")
    if now < parse_time(ROSTER_REVIEW_AT):
        raise ValueError("This edition cannot predate its actual original-source review")
    candidates = board["candidates"]
    candidate_ids = {row["id"] for row in candidates}
    if len(candidate_ids) != len(candidates):
        raise ValueError("Duplicate candidate identity")
    source_map = {source["id"]: source for source in board.get("sources", [])}
    previous_rows = {row["candidateId"]: row for row in (previous or {}).get("forecasts", [])}
    accepted = copy.deepcopy((previous or {}).get("acceptedDecisions", []))
    for decision in decisions or []:
        validate_decision(decision, candidate_ids, now)
        if decision not in accepted:
            accepted.append(copy.deepcopy(decision))
    for decision in accepted:
        validate_decision(decision, candidate_ids, now)
    accepted.sort(key=lambda item: (item["reviewedAtUtc"], item["candidateId"]))
    latest_decisions = {item["candidateId"]: item for item in accepted}
    board_cutoff = iso(parse_time(board["asOf"]))
    rows = []
    for candidate in candidates:
        cid, name = candidate["id"], candidate["name"]
        old_percent = candidate.get("kahrelumProbability")
        source_ids = candidate.get("sourceIds", [])
        source_urls = list(dict.fromkeys(source_map[sid]["url"] for sid in source_ids if sid in source_map))
        cutoff = board_cutoff
        reviewed_at = None
        factors = {}
        counterarguments = ["Interest or availability can end without a completed trade; price, roster plans, and negotiations remain uncertain."]
        if old_percent is not None:
            probability = old_percent / 100
            basis = "CARRIED_FORWARD_JUDGMENT"
            rationale = "Retained historical KAHRELUM judgment; individual inputs were not recovered, so this is not a new evidence-based recalculation."
            source_status = "HISTORICAL_INDEX_NOT_REVERIFIED"
            counterarguments.append("The old private creation time and feature rationale are unverified. New public custody begins only with the prospective snapshot.")
        elif cid in REVIEWED_FEATURES:
            features, reviewed_urls, rationale = REVIEWED_FEATURES[cid]
            if isinstance(reviewed_urls, str):
                reviewed_urls = [reviewed_urls]
            probability = engine.structured_forecast_probability(features)
            factors = {"features": features.copy(), "claimStatus": "ORIGINAL_REPORT_READ_NOT_OFFICIAL_OUTCOME"}
            basis = "SOURCE_REVIEWED_STRUCTURED_JUDGMENT"
            source_urls = list(dict.fromkeys(reviewed_urls + source_urls))
            cutoff = reviewed_at = FOWLER_SOURCE_REVIEW_AT if cid in FOWLER_FEATURES else SOURCE_REVIEW_AT
            source_status = "ORIGINAL_ARTICLE_READ_OTHER_INDEXED_LINKS_UNVERIFIED"
        else:
            probability, factors = indexed_estimate(candidate.get("evidenceType", "UNKNOWN"))
            basis = "INDEXED_SIGNAL_ESTIMATE" if factors["conditionalScenarioFeatures"] else "LOW_INFORMATION_BASELINE"
            rationale = ("A discounted indexed evidence category adjusts the governance prior; the original claim remains unverified."
                         if basis == "INDEXED_SIGNAL_ESTIMATE" else
                         "No admitted individual market evidence; this is the disclosed governance baseline for an analyst/watchlist candidate.")
            source_status = "INDEXED_ONLY_NOT_FIRSTHAND_VERIFIED"
            counterarguments.append("A watchlist entry or analyst fit is not proof of an inquiry, offer, availability, or seller intent.")
        if cid == "K26-001":
            probability = 0.02
            basis = "SOURCE_BACKED_JUDGMENT_REVISION"
            rationale = "Applied the committed Payne injury research revision: significant reported foot injury sharply constrains the near-term market."
            cutoff = reviewed_at = PAYNE_NOTE_AT
            source_urls = [PAYNE_NOTE_URL,
                           "https://www.commanders.com/news/game-status-commanders-eagles-week-8",
                           "https://www.foxsports.com/articles/nfl/commanders-defensive-tackle-daron-payne-suffers-foot-injury-ap-source-says"]
            source_status = "COMMITTED_ORIGINAL_SOURCE_RESEARCH_NOTE"
            factors = {"method": "EDITORIAL_OVERRIDE", "constraint": "SIGNIFICANT_REPORTED_FOOT_INJURY",
                       "researchCommit": PAYNE_NOTE_COMMIT, "researchPublishedAtUtc": PAYNE_NOTE_AT}
            counterarguments = ["Injury does not prohibit a trade; medical evaluation and buyer willingness remain uncertain.",
                                "Likely injured reserve is reported, not confirmed placement; no current offer or final off-market decision is authenticated."]
        if cid in latest_decisions:
            decision = latest_decisions[cid]
            probability = decision["probability"]
            basis = "ACCEPTED_SOURCE_REVIEW_REVISION"
            rationale = decision["rationale"]
            source_urls = list(decision["sourceUrls"])
            cutoff, reviewed_at = decision["informationCutoffUtc"], decision["reviewedAtUtc"]
            factors = copy.deepcopy(decision.get("factors", {"method": "ATTRIBUTED_EDITORIAL_JUDGMENT"}))
            counterarguments = list(decision["counterarguments"])
            source_status = "ACCEPTED_SOURCE_REVIEW"
        previous_row = previous_rows.get(cid)
        reference_probability = previous_row["probability"] if previous_row else (old_percent / 100 if old_percent is not None else None)
        change = None if reference_probability is None else round((probability - reference_probability) * 100, 2)
        row = {
            "candidateId": cid, "eventId": f"NFL-2026-TRADE-{cid}-FC1", "player": name,
            "team": candidate["team"], "position": candidate["pos"],
            "probability": probability, "probabilityPercent": round(probability * 100),
            "basis": basis, "modelVersion": MODEL, "probabilityEngineVersion": engine.FORECAST_MODEL_VERSION,
            "historicalProbabilityPercent": old_percent, "historicalCustody": candidate.get("kahrelumIntegrity"),
            "evidenceType": candidate.get("evidenceType", "UNKNOWN"), "sourceIds": list(source_ids),
            "sourceUrls": source_urls, "sourceStatus": source_status,
            "informationCutoffUtc": cutoff, "lastSourceReviewAtUtc": reviewed_at,
            "researchFreshness": "CARRY_FORWARD_REQUIRES_REVIEW" if basis == "CARRIED_FORWARD_JUDGMENT" else
                                 "LOW_INFORMATION_INDEX_ONLY" if basis in {"LOW_INFORMATION_BASELINE", "INDEXED_SIGNAL_ESTIMATE"} else "DATED_SOURCE_REVIEW",
            "factors": factors, "rationale": rationale, "counterarguments": counterarguments,
            "sensitivity": sensitivity(probability),
            "change": {"previousProbability": reference_probability, "percentagePoints": change,
                       "kind": "NEW_COVERAGE" if reference_probability is None else "REVISED" if change else "UNCHANGED",
                       "material": change is not None and abs(change) >= 5, "reason": rationale},
            "question": f"Will {name} be officially traded to another NFL club after this snapshot's public lock and by November 10, 2026, 4:00 p.m. EST?",
            "deadlineUtc": iso(engine.DEADLINE), "outcome": None,
            "scoringStatus": "REQUIRES_SEPARATE_PUBLIC_CUSTODY_RECEIPT",
            "cohortEligible": True, "probabilityKind": "PROSPECTIVE_TRADE_FORECAST",
        }
        if cid in ROSTER_EXCLUSIONS:
            exclusion = ROSTER_EXCLUSIONS[cid]
            row.update({
                "team": "FA", "previousTeam": "SF", "probability": 0.0, "probabilityPercent": 0,
                "basis": "ROSTER_STATUS_NOT_FORECAST", "probabilityKind": "CURRENT_CLUB_TRADE_ELIGIBILITY_STATUS",
                "sourceUrls": list(exclusion["sourceUrls"]), "sourceStatus": "OFFICIAL_TEAM_RELEASE_CONFIRMED",
                "informationCutoffUtc": ROSTER_REVIEW_AT, "lastSourceReviewAtUtc": ROSTER_REVIEW_AT,
                "researchFreshness": "DATED_OFFICIAL_ROSTER_REVIEW", "factors": {"officialReleaseDate": exclusion["sourceEventDate"]},
                "rationale": exclusion["reason"],
                "counterarguments": ["A future signing could create a new tradable contract; that would require a new prospective eligibility decision, not retroactive scoring."],
                "sensitivity": {"low": 0.0, "high": 0.0, "kind": "ROSTER_STATUS_NOT_A_PROBABILITY_INTERVAL"},
                "change": {"previousProbability": reference_probability, "percentagePoints": None,
                           "kind": "ROSTER_STATUS_CORRECTION", "material": True, "reason": exclusion["reason"]},
                "question": "Is Jack Jones currently on San Francisco's roster and eligible for a trade by that club?",
                "cohortEligible": False, "eligibilityExclusion": copy.deepcopy(exclusion),
                "scoringStatus": "EXCLUDED_OFFICIAL_RELEASE_BEFORE_LOCK",
            })
        # Keep the last meaningful change and edition date on an unchanged poll.
        if previous_row and all(row[key] == previous_row.get(key) for key in
                                ("probability", "basis", "informationCutoffUtc", "sourceUrls", "factors", "rationale")):
            row["change"] = copy.deepcopy(previous_row["change"])
            row["forecastUpdatedAtUtc"] = previous_row["forecastUpdatedAtUtc"]
        else:
            row["forecastUpdatedAtUtc"] = iso(now)
        rows.append(row)
    snapshot = {
        "schema": SCHEMA, "modelVersion": MODEL, "generatedAtUtc": iso(now),
        "cohortId": "NFL-2026-DEADLINE-FULL-COVERAGE-20261031", "candidateCount": len(rows),
        "deadlineUtc": iso(engine.DEADLINE), "historicalBoardAsOf": board["asOf"],
        "coverage": {"priced": len(rows), "unpriced": 0, "forecastProbabilities": sum(row["cohortEligible"] for row in rows),
                     "statusValues": sum(not row["cohortEligible"] for row in rows),
                     "byBasis": dict(sorted(Counter(row["basis"] for row in rows).items()))},
        "eligibleForecastCount": sum(row["cohortEligible"] for row in rows),
        "scoringExclusions": [copy.deepcopy(row["eligibilityExclusion"]) for row in rows if not row["cohortEligible"]],
        "methodUrl": f"https://github.com/{REPOSITORY}/blob/main/{METHOD_PATH}",
        "calibrationStatus": "SUBJECTIVE_UNCALIBRATED_NO_EMPIRICAL_ACCURACY_CLAIM",
        "sourceCoverageNotice": "Every row has a numeric value: prospective estimates for active candidates, and explicitly excluded current-roster status for a released player. Evidence depth differs; polling does not refresh research dates.",
        "baselinePolicy": {"engine": engine.FORECAST_MODEL_VERSION, "governancePrior": 0.15,
                           "features": BASELINE_FEATURES.copy(), "probability": engine.structured_forecast_probability(BASELINE_FEATURES),
                           "indexedSignalWeight": INDEXED_SIGNAL_WEIGHT, "tierScenarios": copy.deepcopy(TIER_SCENARIOS)},
        "scoringPolicy": {"eventStart": "FIRST_PUBLIC_OBSERVATION_OF_IMMUTABLE_SNAPSHOT", "deadlineUtc": iso(engine.DEADLINE),
                          "versionSelection": "LATEST_PUBLIC_VERSION_BEFORE_EVENT_AND_DEADLINE", "oneForecastPerPlayer": True,
                          "denominator": "ALL_ADMITTED_COHORT_MEMBERS_INCLUDING_NON_TRADES", "historicalExclusionsPreserved": True,
                          "outcomeRule": "Official completed trade inside the event window = 1; complete official records with no such trade = 0; uncertain ordering or incomplete records remain unresolved."},
        "acceptedDecisions": accepted, "forecasts": rows,
    }
    # A poll alone must not create a spurious new forecast edition.
    if previous and {k: v for k, v in snapshot.items() if k != "generatedAtUtc"} == {k: v for k, v in previous.items() if k != "generatedAtUtc"}:
        snapshot["generatedAtUtc"] = previous["generatedAtUtc"]
    validate_snapshot(snapshot, expected_ids=candidate_ids)
    return snapshot


def validate_snapshot(snapshot: dict, expected_ids: set[str] | None = None) -> None:
    if snapshot.get("schema") != SCHEMA or snapshot.get("modelVersion") != MODEL:
        raise ValueError("Unknown snapshot schema or model")
    rows = snapshot.get("forecasts", [])
    ids = [row["candidateId"] for row in rows]
    if not rows or len(ids) != len(set(ids)) or len(rows) != snapshot["candidateCount"]:
        raise ValueError("Incomplete or duplicate cohort")
    if len({row["eventId"] for row in rows}) != len(rows) or len({row["player"].casefold() for row in rows}) != len(rows):
        raise ValueError("Duplicate player or event identity")
    if expected_ids is not None and set(ids) != expected_ids:
        raise ValueError("Snapshot does not cover the exact current candidate denominator")
    eligible = [row for row in rows if row.get("cohortEligible") is True]
    excluded = [row for row in rows if row.get("cohortEligible") is False]
    if len(eligible) + len(excluded) != len(rows) or snapshot.get("eligibleForecastCount") != len(eligible):
        raise ValueError("Eligible and excluded rows must partition the full candidate denominator")
    if snapshot.get("scoringExclusions") != [row.get("eligibilityExclusion") for row in excluded]:
        raise ValueError("Cohort exclusions must be explicit in the immutable snapshot")
    generated = parse_time(snapshot["generatedAtUtc"])
    if parse_time(snapshot["deadlineUtc"]) != engine.DEADLINE or generated >= engine.DEADLINE:
        raise ValueError("Snapshot is not prospective for the documented deadline")
    for row in rows:
        p = row["probability"]
        status_only = row.get("basis") == "ROSTER_STATUS_NOT_FORECAST" and row.get("cohortEligible") is False
        if isinstance(p, bool) or not isinstance(p, (int, float)) or not (p == 0 if status_only else 0 < p < 1):
            raise ValueError("Invalid prospective point probability")
        if status_only and row.get("eligibilityExclusion") != ROSTER_EXCLUSIONS.get(row["candidateId"]):
            raise ValueError("A status-only zero requires documented official roster exclusion")
        if row["probabilityPercent"] != round(p * 100) or row["outcome"] is not None or parse_time(row["deadlineUtc"]) != engine.DEADLINE:
            raise ValueError("A snapshot cannot include resolved outcomes or inconsistent percentages")
        if parse_time(row["informationCutoffUtc"]) > parse_time(row["forecastUpdatedAtUtc"]) or parse_time(row["forecastUpdatedAtUtc"]) > generated:
            raise ValueError("Forecast timing is reversed")
        if not row["sourceUrls"] or not row["counterarguments"] or not row["rationale"]:
            raise ValueError("Every row needs source basis, rationale, and uncertainty")
        if any(urlparse(url).scheme != "https" for url in row["sourceUrls"]):
            raise ValueError("Invalid source URL")


def admit_public_snapshot(snapshot_bytes: bytes, receipt: dict, ledger: dict,
                          expected_ids: set[str], now: dt.datetime) -> dict:
    """Return a new ledger after checking a caller-retrieved publication receipt.

    The caller must fetch the exact file from GitHub at receipt.gitCommit and
    preserve that response. This offline function does not claim to authenticate
    remote GitHub metadata or the factual completeness of official source checks.
    """
    snapshot = json.loads(snapshot_bytes)
    validate_snapshot(snapshot, expected_ids)
    commit = receipt.get("gitCommit", "")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("A complete immutable commit SHA is required")
    if receipt.get("repositoryFullName") != REPOSITORY or receipt.get("snapshotPath") != SNAPSHOT_PATH:
        raise ValueError("Receipt does not identify the expected repository snapshot")
    sha256 = hashlib.sha256(snapshot_bytes).hexdigest()
    if receipt.get("snapshotSha256") != sha256:
        raise ValueError("Published bytes do not match the receipt")
    published = parse_time(receipt["publiclyObservedAtUtc"])
    committed = parse_time(receipt["commitTimestampUtc"])
    if not parse_time(snapshot["generatedAtUtc"]) <= committed <= published <= now or published >= engine.DEADLINE:
        raise ValueError("Publication is future-dated, reversed, or not prospective")
    if receipt.get("remoteBytesVerified") is not True:
        raise ValueError("Exact immutable remote bytes must be verified before admission")
    check = receipt.get("officialPrelockCheck", {})
    if check.get("status") != "COMPLETE" or check.get("candidateIds") != sorted(expected_ids):
        raise ValueError("Official pre-lock check must cover the entire cohort")
    eligible_rows = [row for row in snapshot["forecasts"] if row["cohortEligible"]]
    eligible_ids = {row["candidateId"] for row in eligible_rows}
    excluded_ids = expected_ids - eligible_ids
    if check.get("eligibleCandidateIds") != sorted(eligible_ids) or check.get("excludedCandidateIds") != sorted(excluded_ids):
        raise ValueError("Pre-lock eligibility partition does not match the immutable snapshot")
    checked = parse_time(check["checkedAtUtc"])
    if not published - dt.timedelta(hours=6) <= checked <= now:
        raise ValueError("Official pre-lock check is missing, future-dated, or stale")
    official_urls = check.get("sourceUrls", [])
    if not official_urls or any(urlparse(url).scheme != "https" or urlparse(url).hostname not in {"nfl.com", "www.nfl.com"} for url in official_urls):
        raise ValueError("Pre-lock check requires original NFL transaction sources")
    if check.get("completedBeforeLockCandidateIds") != []:
        raise ValueError("A completed pre-lock candidate makes this proposed cohort ineligible")
    existing_events = ledger.get("eligibleLocks", [])
    cohort_ids = {row["eventId"] for row in eligible_rows}
    if any(event["eventId"] in cohort_ids or event["player"].casefold() in {row["player"].casefold() for row in eligible_rows} for event in existing_events):
        raise ValueError("An existing player lock must be revised, not admitted twice")
    result = copy.deepcopy(ledger)
    immutable_url = f"https://github.com/{REPOSITORY}/blob/{commit}/{SNAPSHOT_PATH}"
    previous_hash = existing_events[-1]["recordHash"] if existing_events else None
    for row in eligible_rows:
        payload = {
            "eventId": row["eventId"], "candidateId": row["candidateId"], "player": row["player"],
            "question": f"Will {row['player']} be officially traded to another NFL club after {iso(published)} and by November 10, 2026, 4:00 p.m. EST?",
            "deadlineUtc": snapshot["deadlineUtc"], "originalProbability": row["probability"],
            "informationCutoffUtc": row["informationCutoffUtc"], "publicationTimestampUtc": iso(published),
            "gitCommit": commit, "evidenceAtCutoff": [immutable_url] + row["sourceUrls"],
            "counterarguments": row["counterarguments"], "eligibility": "PROSPECTIVE_PENDING_OUTCOME",
            "revisions": [], "outcome": None, "cohortId": snapshot["cohortId"], "cohortSize": len(eligible_ids),
            "snapshotCandidateCount": len(expected_ids),
            "snapshotSha256": sha256, "modelVersion": MODEL, "forecastBasis": row["basis"],
            "historicalForecastAuthenticated": False,
        }
        event = engine.chain_record(payload, previous_hash)
        result.setdefault("eligibleLocks", []).append(event)
        previous_hash = event["recordHash"]
    for exclusion in snapshot["scoringExclusions"]:
        result.setdefault("cohortExclusions", []).append({**copy.deepcopy(exclusion), "cohortId": snapshot["cohortId"],
                                                         "gitCommit": commit, "snapshotSha256": sha256,
                                                         "publicationTimestampUtc": iso(published), "scoringEligible": False})
    result.setdefault("cohortReceipts", []).append(copy.deepcopy(receipt))
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["generate", "validate", "admit"])
    parser.add_argument("--board", type=Path, default=ROOT / "nfl" / "trade-board.json")
    parser.add_argument("--snapshot", type=Path, default=ROOT / SNAPSHOT_PATH)
    parser.add_argument("--decisions", type=Path, help="JSON list of explicitly accepted source reviews")
    parser.add_argument("--receipt", type=Path)
    parser.add_argument("--ledger", type=Path, default=ROOT / "nfl" / "forecast-ledger.json")
    parser.add_argument("--output", type=Path, help="Required for admission; never implicitly overwrites the ledger")
    parser.add_argument("--at", "--now", dest="at", help="Explicit UTC generation/check time; defaults to current UTC")
    args = parser.parse_args()
    now = parse_time(args.at) if args.at else dt.datetime.now(dt.timezone.utc)
    board = read_json(args.board)
    expected_ids = {row["id"] for row in board["candidates"]}
    if args.command == "generate":
        previous = read_json(args.snapshot) if args.snapshot.exists() else None
        decisions = read_json(args.decisions) if args.decisions else None
        snapshot = build_current_forecasts(board, now, previous, decisions)
        args.snapshot.write_bytes(encoded(snapshot))
        print(json.dumps({"status": "GENERATED", "candidateCount": len(snapshot["forecasts"]), "coverage": snapshot["coverage"], "generatedAtUtc": snapshot["generatedAtUtc"], "sha256": hashlib.sha256(encoded(snapshot)).hexdigest()}))
    elif args.command == "validate":
        validate_snapshot(read_json(args.snapshot), expected_ids)
        print(json.dumps({"status": "VALID", "candidateCount": len(expected_ids)}))
    else:
        if not args.receipt or not args.output:
            parser.error("admit requires --receipt and an explicit --output path")
        result = admit_public_snapshot(args.snapshot.read_bytes(), read_json(args.receipt), read_json(args.ledger), expected_ids, now)
        args.output.write_bytes(encoded(result))
        print(json.dumps({"status": "ADMITTED", "newLocks": result["eligibleLocks"][-1]["cohortSize"], "output": str(args.output)}))


if __name__ == "__main__":
    main()
