#!/usr/bin/env python3
"""KAHRELUM Sports Intelligence v1.0 fail-closed source and forecast tooling.

Standard-library only. Network observations enter a review queue; they never
become transactions or forecasts without an explicit, attributable approval.
"""

from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

DEADLINE = dt.datetime(2026, 11, 10, 21, 0, tzinfo=dt.timezone.utc)
AUDIT_AT = dt.datetime(2026, 11, 12, 14, 0, tzinfo=dt.timezone.utc)
EVIDENCE_CLASSES = {"FACT", "REPORT", "INFERENCE", "FORECAST", "UNVERIFIED"}
ROOT = Path(__file__).resolve().parents[1]
NFL = ROOT / "nfl"
USER_AGENT = "KAHRELUM-SourceGrid/1.0 (+https://kahrelum.com/nfl/trades)"

PATHS = {
    "registry": NFL / "sourcegrid.json",
    "observations": NFL / "source-observations.json",
    "queue": NFL / "review-queue.json",
    "status": NFL / "refresh-status.json",
    "public": NFL / "public-feed.json",
    "ledger": NFL / "forecast-ledger.json",
    "audit": NFL / "deadline-audit.json",
    "publishing": NFL / "publishing.json",
}

TEAM_SITES = {
    "ARI": "https://www.azcardinals.com/news/", "ATL": "https://www.atlantafalcons.com/news/",
    "BAL": "https://www.baltimoreravens.com/news/", "BUF": "https://www.buffalobills.com/news/",
    "CAR": "https://www.panthers.com/news/", "CHI": "https://www.chicagobears.com/news/",
    "CIN": "https://www.bengals.com/news/", "CLE": "https://www.clevelandbrowns.com/news/",
    "DAL": "https://www.dallascowboys.com/news/", "DEN": "https://www.denverbroncos.com/news/",
    "DET": "https://www.detroitlions.com/news/", "GB": "https://www.packers.com/news/",
    "HOU": "https://www.houstontexans.com/news/", "IND": "https://www.colts.com/news/",
    "JAX": "https://www.jaguars.com/news/", "KC": "https://www.chiefs.com/news/",
    "LV": "https://www.raiders.com/news/", "LAC": "https://www.chargers.com/news/",
    "LAR": "https://www.therams.com/news/", "MIA": "https://www.miamidolphins.com/news/",
    "MIN": "https://www.vikings.com/news/", "NE": "https://www.patriots.com/news/",
    "NO": "https://www.neworleanssaints.com/news/", "NYG": "https://www.giants.com/news/",
    "NYJ": "https://www.newyorkjets.com/news/", "PHI": "https://www.philadelphiaeagles.com/news/",
    "PIT": "https://www.steelers.com/news/", "SF": "https://www.49ers.com/news/",
    "SEA": "https://www.seahawks.com/news/", "TB": "https://www.buccaneers.com/news/",
    "TEN": "https://www.tennesseetitans.com/news/", "WAS": "https://www.commanders.com/news/",
}

NATIONAL = [
    "Adam Schefter", "Ian Rapoport", "Tom Pelissero", "Mike Garafolo", "Jeremy Fowler",
    "Dan Graziano", "Dianna Russini", "Albert Breer", "Jordan Schultz", "Jay Glazer",
    "Jonathan Jones", "Ralph Vacchiano", "James Palmer", "Jane Slater",
]

BROADCASTS = [
    "Pat McAfee Show", "NFL Network Insiders", "The Adam Schefter Podcast",
    "The Insiders with Tom Pelissero", "Team radio original interviews",
]

INTEGRATIONS = [
    {"id": "ESPN_RSS", "name": "ESPN NFL RSS", "url": "https://www.espn.com/espn/rss/nfl/news", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "CBS_RSS", "name": "CBS Sports NFL RSS", "url": "https://www.cbssports.com/rss/headlines/nfl/", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "YAHOO_RSS", "name": "Yahoo Sports NFL RSS", "url": "https://sports.yahoo.com/nfl/rss.xml", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "GOOGLE_NEWS_RSS", "name": "Google News NFL trade discovery", "url": "https://news.google.com/rss/search?q=NFL+trade+when:1d&hl=en-US&gl=US&ceid=US:en", "type": "rss", "role": "SEARCH_DISCOVERY_ONLY", "operational": True},
    {"id": "NFL_TRANSACTIONS", "name": "NFL official transactions", "url": "https://www.nfl.com/transactions/", "type": "official_page", "role": "OFFICIAL_VERIFICATION_ENDPOINT", "operational": True},
]


def iso(value: dt.datetime | None = None) -> str:
    return (value or dt.datetime.now(dt.timezone.utc)).astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_time(value: str | None) -> dt.datetime:
    if not value:
        return dt.datetime.now(dt.timezone.utc)
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamps require an explicit UTC offset")
    return parsed.astimezone(dt.timezone.utc)


def read_json(path: Path, default=None):
    if not path.exists():
        if default is None:
            raise FileNotFoundError(path)
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def digest(value) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()


def normalize_url(url: str) -> str:
    parts = urllib.parse.urlsplit(url.strip())
    query = urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
    query = [(k, v) for k, v in query if not k.lower().startswith(("utm_", "cid"))]
    return urllib.parse.urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), urllib.parse.urlencode(query), ""))


def bootstrap() -> None:
    board = read_json(NFL / "trade-board.json")
    watchlist = [
        {"id": "NATIONAL_" + re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_"), "name": name, "category": "NATIONAL_REPORTER", "status": "WATCHLIST_ONLY", "reason": "No tested credential-free machine-readable first-party feed"}
        for name in NATIONAL
    ]
    watchlist += [
        {"id": "BROADCAST_" + re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_"), "name": name, "category": "BROADCAST", "status": "WATCHLIST_ONLY", "reason": "Original episodes require manual attributable review"}
        for name in BROADCASTS
    ]
    watchlist += [
        {"id": f"TEAM_{team}", "name": f"{team} official news", "category": "TEAM_OFFICIAL", "url": url, "status": "WATCHLIST_ONLY", "reason": "Official page registered; no tested stable feed endpoint"}
        for team, url in TEAM_SITES.items()
    ]
    write_json(PATHS["registry"], {
        "schema": "KAHRELUM_SOURCEGRID_v1.0", "generatedAt": iso(),
        "policy": {"defaultEvidenceClass": "UNVERIFIED", "autoConfirmTransactions": False, "autoPublishForecasts": False, "paywallBypass": False, "maxPriorityAlerts": 3},
        "operationalIntegrations": INTEGRATIONS, "watchlist": watchlist,
        "counts": {"operational": len(INTEGRATIONS), "watchlistOnly": len(watchlist), "teamsCovered": len(TEAM_SITES)},
    })
    write_json(PATHS["observations"], {"schema": "KAHRELUM_SOURCE_OBSERVATIONS_v1.0", "observations": []})
    write_json(PATHS["queue"], {"schema": "KAHRELUM_REVIEW_QUEUE_v1.0", "items": []})
    write_json(PATHS["public"], {"schema": "KAHRELUM_PUBLIC_SPORTS_FEED_v1.0", "publishedUpdates": [], "contradictions": [], "materialAlerts": []})
    excluded = [
        {"eventId": f"HIST-{p['id']}", "player": p["name"], "probability": p["kahrelumProbability"] / 100,
         "status": "EXCLUDED_PROVISIONAL", "reason": "Conversation-recovered probability; original timestamp custody not independently authenticated"}
        for p in board["candidates"] if p.get("kahrelumProbability") is not None
    ]
    write_json(PATHS["ledger"], {"schema": "KAHRELUM_FORECAST_LEDGER_v1.0", "appendOnly": True, "eligibleLocks": [], "outcomeRecords": [], "historicalExcluded": excluded})
    write_json(PATHS["status"], {
        "schema": "KAHRELUM_REFRESH_STATUS_v1.0", "lastAttemptAt": None, "lastSuccessfulSourceCheckAt": None,
        "lastPublishedUpdateAt": board.get("asOf"), "feedFreshness": "NOT_YET_RUN", "monitoringState": "DEADLINE_WINDOW_OPEN",
        "deadlineUtc": iso(DEADLINE), "sourcesAttempted": 0, "sourcesSucceeded": 0, "sourcesFailed": 0,
        "observationsNew": 0, "reviewQueueCount": 0, "materialAlerts": [], "errors": [],
        "truthBoundary": "Source checks and publication are separate. A successful check does not mean every source was reviewed or any report was verified."
    })
    write_json(PATHS["audit"], empty_audit("SCHEDULED", "No eligible resolved prospective forecasts yet."))
    generate_publishing()


def fetch(url: str, fixture: Path | None = None) -> bytes:
    if fixture:
        if not fixture.exists():
            raise OSError(f"fixture missing: {fixture}")
        return fixture.read_bytes()
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.8"})
    with urllib.request.urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise OSError(f"HTTP {response.status}")
        return response.read(2_500_000)


def child_text(node, names) -> str:
    for child in list(node):
        local = child.tag.split("}")[-1].lower()
        if local in names and child.text:
            return child.text.strip()
        if local == "link" and "link" in names and child.attrib.get("href"):
            return child.attrib["href"].strip()
    return ""


def parse_feed(content: bytes, integration: dict, checked_at: str) -> list[dict]:
    root = ET.fromstring(content)
    nodes = [n for n in root.iter() if n.tag.split("}")[-1].lower() in {"item", "entry"}]
    output = []
    for node in nodes[:20]:
        title = child_text(node, {"title"})
        url = child_text(node, {"link"})
        published = child_text(node, {"pubdate", "published", "updated", "date"})
        if not title or not url or not url.startswith("http"):
            continue
        if not re.search(r"\b(trades?|traded|trading|acquire[ds]?|inquir(?:y|ies)|offer|deadline|shopping|available|calls? on)\b", title, re.I):
            continue
        try:
            published_at = iso(email.utils.parsedate_to_datetime(published)) if published else None
        except (TypeError, ValueError):
            published_at = None
        canonical = normalize_url(url)
        observation_id = "OBS-" + hashlib.sha256((integration["id"] + "|" + canonical + "|" + title.strip().lower()).encode()).hexdigest()[:20]
        discovery_redirect = integration["role"] == "SEARCH_DISCOVERY_ONLY"
        output.append({
            "id": observation_id, "sourceIntegrationId": integration["id"], "sourceName": integration["name"],
            "title": title, "originalUrl": url, "normalizedUrl": canonical, "sourcePublishedAt": published_at,
            "firstObservedAt": checked_at, "lastObservedAt": checked_at, "evidenceClass": "UNVERIFIED",
            "claimType": classify_claim(title), "reviewStatus": "REVIEW_REQUIRED", "publicationGate": "BLOCKED_PENDING_ORIGINAL_SOURCE_REVIEW",
            "originalUrlPreserved": not discovery_redirect,
            "linkCustody": "DISCOVERY_REDIRECT_NOT_ORIGINAL_REPORT" if discovery_redirect else "FEED_ATTRIBUTED_ARTICLE_URL",
        })
    return output


def classify_claim(title: str) -> str:
    text = title.lower()
    if any(x in text for x in ("trades for", "traded to", "acquire", "transaction")):
        return "POSSIBLE_TRANSACTION_MENTION_NOT_CONFIRMED"
    if any(x in text for x in ("offer", "inquir", "calls on", "interest in")):
        return "POSSIBLE_REPORT_OF_MARKET_CONTACT"
    if any(x in text for x in ("should trade", "landing spot", "trade idea", "could trade")):
        return "HYPOTHETICAL_OR_ANALYSIS"
    return "GENERAL_NFL_DISCOVERY"


def contradiction_records(observations: list[dict]) -> list[dict]:
    board = read_json(NFL / "trade-board.json")
    results = []
    for player in board["candidates"]:
        name = player["name"].lower()
        related = [o for o in observations if name in o["title"].lower()]
        positive = [o for o in related if re.search(r"available|shopping|trade block|taking calls|could be had", o["title"], re.I)]
        negative = [o for o in related if re.search(r"not available|won't trade|will not trade|rebuff|off market|staying", o["title"], re.I)]
        if positive and negative:
            results.append({"playerId": player["id"], "player": player["name"], "status": "REVIEW_REQUIRED", "positiveObservationIds": [x["id"] for x in positive], "negativeObservationIds": [x["id"] for x in negative]})
    return results


def ingest(now: dt.datetime, fixture_dir: Path | None = None) -> int:
    registry = read_json(PATHS["registry"])
    status = read_json(PATHS["status"])
    status.update({"lastAttemptAt": iso(now), "observationsNew": 0, "errors": [], "materialAlerts": []})
    if now >= DEADLINE:
        status.update({"monitoringState": "DEADLINE_WINDOW_CLOSED", "feedFreshness": "ARCHIVED_NO_DEADLINE_FETCH", "sourcesAttempted": 0, "sourcesSucceeded": 0, "sourcesFailed": 0})
        write_json(PATHS["status"], status)
        if now >= AUDIT_AT:
            run_audit(now)
        return 0

    stored = read_json(PATHS["observations"])
    queue = read_json(PATHS["queue"])
    by_id = {o["id"]: o for o in stored["observations"]}
    queue_ids = {o["observationId"] for o in queue["items"]}
    successes = 0
    failures = []
    for integration in registry["operationalIntegrations"]:
        try:
            fixture = fixture_dir / f"{integration['id']}.xml" if fixture_dir else None
            content = fetch(integration["url"], fixture)
            if integration["type"] == "rss":
                for item in parse_feed(content, integration, iso(now)):
                    existing = by_id.get(item["id"])
                    if existing:
                        existing["lastObservedAt"] = iso(now)
                    else:
                        by_id[item["id"]] = item
                        status["observationsNew"] += 1
                        if item["id"] not in queue_ids:
                            queue["items"].append({"observationId": item["id"], "queuedAt": iso(now), "reason": item["publicationGate"], "priority": "NORMAL", "status": "OPEN"})
                            queue_ids.add(item["id"])
            else:
                if not content.lstrip().lower().startswith(b"<!doctype html"):
                    raise ValueError("official page did not return HTML")
            successes += 1
        except Exception as exc:  # fail visibly per endpoint; never hide a partial failure
            failures.append({"sourceIntegrationId": integration["id"], "error": f"{type(exc).__name__}: {exc}"})

    stored["observations"] = sorted(by_id.values(), key=lambda x: (x["firstObservedAt"], x["id"]))
    stored["contradictions"] = contradiction_records(stored["observations"])
    status.update({
        "sourcesAttempted": len(registry["operationalIntegrations"]), "sourcesSucceeded": successes,
        "sourcesFailed": len(failures), "errors": failures, "reviewQueueCount": len([x for x in queue["items"] if x["status"] == "OPEN"]),
        "monitoringState": "DEADLINE_WINDOW_OPEN",
        "feedFreshness": "FRESH" if successes == len(registry["operationalIntegrations"]) else ("DEGRADED" if successes else "STALE_FAILED"),
    })
    if successes:
        status["lastSuccessfulSourceCheckAt"] = iso(now)
    write_json(PATHS["observations"], stored)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["status"], status)
    generate_publishing()
    return 0 if successes else 2


def chain_record(payload: dict, previous_hash: str | None) -> dict:
    record = {**payload, "previousRecordHash": previous_hash}
    record["recordHash"] = digest(record)
    return record


def lock_forecast(args) -> None:
    ledger = read_json(PATHS["ledger"])
    if any(x["eventId"] == args.event_id for x in ledger["eligibleLocks"]):
        raise ValueError("event already locked; use revise to append a version")
    probability = float(args.probability)
    if not 0 <= probability <= 1:
        raise ValueError("probability must be within 0..1")
    if not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        raise ValueError("eligible forecast requires an immutable 40-character Git commit")
    cutoff = parse_time(args.cutoff)
    deadline = parse_time(args.deadline)
    if cutoff >= deadline:
        raise ValueError("forecast cutoff must precede its deadline")
    payload = {
        "eventId": args.event_id, "player": args.player, "question": args.question, "deadlineUtc": iso(deadline),
        "originalProbability": probability, "informationCutoffUtc": iso(cutoff), "publicationTimestampUtc": iso(parse_time(args.published_at)),
        "gitCommit": args.commit, "evidenceAtCutoff": args.evidence, "counterarguments": [args.counterargument],
        "eligibility": "PROSPECTIVE_PENDING_OUTCOME", "revisions": [], "outcome": None,
    }
    ledger["eligibleLocks"].append(chain_record(payload, ledger["eligibleLocks"][-1]["recordHash"] if ledger["eligibleLocks"] else None))
    write_json(PATHS["ledger"], ledger)


def revise_forecast(args) -> None:
    ledger = read_json(PATHS["ledger"])
    event = next((x for x in ledger["eligibleLocks"] if x["eventId"] == args.event_id), None)
    if not event:
        raise ValueError("unknown event")
    probability = float(args.probability)
    if not 0 <= probability <= 1:
        raise ValueError("probability must be within 0..1")
    if not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        raise ValueError("revision requires an immutable 40-character Git commit")
    if parse_time(args.cutoff) <= parse_time(event["informationCutoffUtc"]):
        raise ValueError("revision cutoff must be later than the original cutoff")
    previous = event["revisions"][-1]["recordHash"] if event["revisions"] else event["recordHash"]
    revision = chain_record({"version": len(event["revisions"]) + 2, "probability": probability, "informationCutoffUtc": iso(parse_time(args.cutoff)), "publicationTimestampUtc": iso(parse_time(args.published_at)), "gitCommit": args.commit, "rationale": args.rationale, "counterarguments": [args.counterargument]}, previous)
    event["revisions"].append(revision)
    write_json(PATHS["ledger"], ledger)


def resolve_forecast(args) -> None:
    ledger = read_json(PATHS["ledger"])
    event = next((x for x in ledger["eligibleLocks"] if x["eventId"] == args.event_id), None)
    if not event:
        raise ValueError("unknown event")
    if any(x["eventId"] == args.event_id for x in ledger["outcomeRecords"]):
        raise ValueError("outcome already recorded; corrections require a new explicit audit record")
    if args.outcome not in {"0", "1"}:
        raise ValueError("outcome must be 0 or 1")
    if not args.source.startswith("https://"):
        raise ValueError("official outcome source must be HTTPS")
    payload = {"eventId": args.event_id, "value": int(args.outcome), "official": True, "officialSource": args.source, "resolvedAtUtc": iso(parse_time(args.resolved_at))}
    previous = ledger["outcomeRecords"][-1]["recordHash"] if ledger["outcomeRecords"] else None
    ledger["outcomeRecords"].append(chain_record(payload, previous))
    write_json(PATHS["ledger"], ledger)


def approve_observation(args) -> None:
    if args.evidence_class not in {"FACT", "REPORT", "INFERENCE"}:
        raise ValueError("network observations may only be approved as FACT, REPORT or INFERENCE; forecasts use the record-lock command")
    observations = read_json(PATHS["observations"])
    queue = read_json(PATHS["queue"])
    public = read_json(PATHS["public"])
    status = read_json(PATHS["status"])
    observation = next((x for x in observations["observations"] if x["id"] == args.observation_id), None)
    if not observation:
        raise ValueError("unknown observation")
    source_url = normalize_url(args.source_url)
    if args.evidence_class == "REPORT" and source_url != observation["normalizedUrl"]:
        raise ValueError("REPORT approval must preserve the observation's original attributable URL")
    if args.evidence_class == "FACT":
        host = urllib.parse.urlsplit(source_url).netloc.lower()
        official_hosts = {urllib.parse.urlsplit(x).netloc.lower() for x in TEAM_SITES.values()} | {"www.nfl.com", "nfl.com"}
        if host not in official_hosts:
            raise ValueError("FACT requires an NFL or registered official team source")
    if any(x["observationId"] == args.observation_id for x in public["publishedUpdates"]):
        raise ValueError("observation already published")
    reviewed_at = iso(parse_time(args.reviewed_at))
    update = {"observationId": args.observation_id, "evidenceClass": args.evidence_class, "headline": args.headline, "claim": args.claim, "sourceUrl": args.source_url, "sourcePublishedAt": observation.get("sourcePublishedAt"), "reviewedAtUtc": reviewed_at, "reviewedBy": args.reviewed_by, "automaticallyPublished": False}
    public["publishedUpdates"].insert(0, update)
    if args.material:
        public["materialAlerts"] = ([update] + public.get("materialAlerts", []))[:3]
    for item in queue["items"]:
        if item["observationId"] == args.observation_id:
            item.update({"status": "APPROVED", "reviewedAtUtc": reviewed_at, "reviewedBy": args.reviewed_by, "evidenceClass": args.evidence_class})
    observation.update({"reviewStatus": "APPROVED", "evidenceClass": args.evidence_class, "publicationGate": "REVIEWED_FOR_PUBLICATION", "reviewedAtUtc": reviewed_at})
    status["lastPublishedUpdateAt"] = reviewed_at
    status["materialAlerts"] = public.get("materialAlerts", [])[:3]
    status["reviewQueueCount"] = len([x for x in queue["items"] if x["status"] == "OPEN"])
    write_json(PATHS["observations"], observations)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["public"], public)
    write_json(PATHS["status"], status)
    generate_publishing()


def empty_audit(status: str, limitation: str) -> dict:
    return {"schema": "KAHRELUM_NFL_DEADLINE_AUDIT_v1.0", "scheduledForUtc": iso(AUDIT_AT), "status": status, "officialOutcomeCutoffUtc": iso(DEADLINE), "confirmedTransactions": [], "eligibleForecasts": 0, "correctTrades": 0, "correctNonTrades": 0, "incorrect": 0, "brierScore": None, "allNoBaselineBrier": None, "excludedHistoricalForecasts": 20, "limitations": [limitation]}


def run_audit(now: dt.datetime) -> dict:
    ledger = read_json(PATHS["ledger"])
    outcomes = {x["eventId"]: x for x in ledger.get("outcomeRecords", []) if x.get("official") is True}
    resolved = [x for x in ledger["eligibleLocks"] if x["eventId"] in outcomes]
    if not resolved:
        audit = empty_audit("INSUFFICIENT_ELIGIBLE_SAMPLE", "No independently resolved eligible prospective forecasts; Brier score remains N/A.")
        audit["generatedAt"] = iso(now)
        write_json(PATHS["audit"], audit)
        return audit
    errors, all_no, correct_yes, correct_no, incorrect = [], [], 0, 0, 0
    for event in resolved:
        p = event["revisions"][-1]["probability"] if event["revisions"] else event["originalProbability"]
        y = int(outcomes[event["eventId"]]["value"])
        errors.append((p - y) ** 2)
        all_no.append(float(y))
        predicted = int(p >= 0.5)
        if predicted == y and y == 1: correct_yes += 1
        elif predicted == y: correct_no += 1
        else: incorrect += 1
    audit = empty_audit("COMPLETE", "Scores cover only preregistered events with independent official outcomes.")
    audit.update({"generatedAt": iso(now), "eligibleForecasts": len(resolved), "correctTrades": correct_yes, "correctNonTrades": correct_no, "incorrect": incorrect, "brierScore": sum(errors) / len(errors), "allNoBaselineBrier": sum(all_no) / len(all_no)})
    write_json(PATHS["audit"], audit)
    return audit


def generate_publishing() -> None:
    public = read_json(PATHS["public"], {"publishedUpdates": [], "materialAlerts": []})
    updates = public.get("publishedUpdates", [])[:3]
    if not updates:
        payload = {"status": "NO_VERIFIED_NEW_MATERIAL", "generatedAt": iso(), "articleDraft": None, "xPostDrafts": [], "weeklyReportDraft": None, "podcastScriptDraft": None, "publishingAuthorized": False, "note": "Draft generation is intentionally empty until reviewed evidence is explicitly approved."}
    else:
        bullets = [f"{x['evidenceClass']}: {x['headline']} ({x['sourceUrl']})" for x in updates]
        payload = {"status": "DRAFTS_REQUIRE_EDITOR_REVIEW", "generatedAt": iso(), "articleDraft": "\n".join(bullets), "xPostDrafts": bullets, "weeklyReportDraft": "Verified developments:\n" + "\n".join(f"- {x}" for x in bullets), "podcastScriptDraft": "KAHRELUM verified update. " + " ".join(bullets), "publishingAuthorized": False, "aiAssisted": True}
    write_json(PATHS["publishing"], payload)


def validate() -> None:
    registry = read_json(PATHS["registry"])
    board = read_json(NFL / "trade-board.json")
    ledger = read_json(PATHS["ledger"])
    status = read_json(PATHS["status"])
    public = read_json(PATHS["public"])
    assert registry["counts"]["teamsCovered"] == 32
    assert registry["counts"]["operational"] == len(registry["operationalIntegrations"])
    assert all(x["operational"] for x in registry["operationalIntegrations"])
    assert len(board["candidates"]) >= 124 and len(board["deals"]) >= 7
    assert len(ledger["historicalExcluded"]) == len([x for x in board["candidates"] if x.get("kahrelumProbability") is not None])
    assert all(x["status"] == "EXCLUDED_PROVISIONAL" for x in ledger["historicalExcluded"])
    assert len(public.get("materialAlerts", [])) <= 3
    assert status["feedFreshness"] in {"NOT_YET_RUN", "FRESH", "DEGRADED", "STALE_FAILED", "ARCHIVED_NO_DEADLINE_FETCH"}
    previous_event_hash = None
    for event in ledger["eligibleLocks"]:
        original_payload = {k: v for k, v in event.items() if k not in {"recordHash", "revisions"}}
        original_payload["revisions"] = []
        assert event["recordHash"] == digest(original_payload)
        assert event["previousRecordHash"] == previous_event_hash
        previous_revision_hash = event["recordHash"]
        original = event["originalProbability"]
        for revision in event["revisions"]:
            assert revision["recordHash"] == digest({k: v for k, v in revision.items() if k != "recordHash"})
            assert revision["previousRecordHash"] == previous_revision_hash
            previous_revision_hash = revision["recordHash"]
            assert revision["probability"] != original or revision["rationale"]
        previous_event_hash = event["recordHash"]
    previous_outcome_hash = None
    for outcome in ledger.get("outcomeRecords", []):
        assert outcome["recordHash"] == digest({k: v for k, v in outcome.items() if k != "recordHash"})
        assert outcome["previousRecordHash"] == previous_outcome_hash
        previous_outcome_hash = outcome["recordHash"]
    print(json.dumps({"status": "VALID", "operationalIntegrations": registry["counts"]["operational"], "watchlistOnly": registry["counts"]["watchlistOnly"], "candidateSnapshot": len(board["candidates"]), "historicalExcluded": len(ledger["historicalExcluded"])}, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("bootstrap")
    ingest_p = sub.add_parser("ingest"); ingest_p.add_argument("--now"); ingest_p.add_argument("--fixture-dir", type=Path)
    sub.add_parser("validate")
    sub.add_parser("audit").add_argument("--now")
    sub.add_parser("publish-drafts")
    lock = sub.add_parser("lock"); lock.add_argument("--event-id", required=True); lock.add_argument("--player", required=True); lock.add_argument("--probability", required=True); lock.add_argument("--question", required=True); lock.add_argument("--deadline", required=True); lock.add_argument("--cutoff", required=True); lock.add_argument("--published-at", required=True); lock.add_argument("--commit", required=True); lock.add_argument("--evidence", action="append", required=True); lock.add_argument("--counterargument", required=True)
    revise = sub.add_parser("revise"); revise.add_argument("--event-id", required=True); revise.add_argument("--probability", required=True); revise.add_argument("--cutoff", required=True); revise.add_argument("--published-at", required=True); revise.add_argument("--commit", required=True); revise.add_argument("--rationale", required=True); revise.add_argument("--counterargument", required=True)
    resolve = sub.add_parser("resolve"); resolve.add_argument("--event-id", required=True); resolve.add_argument("--outcome", required=True); resolve.add_argument("--source", required=True); resolve.add_argument("--resolved-at", required=True)
    approve = sub.add_parser("approve"); approve.add_argument("--observation-id", required=True); approve.add_argument("--evidence-class", required=True); approve.add_argument("--headline", required=True); approve.add_argument("--claim", required=True); approve.add_argument("--source-url", required=True); approve.add_argument("--reviewed-at", required=True); approve.add_argument("--reviewed-by", required=True); approve.add_argument("--material", action="store_true")
    args = parser.parse_args()
    if args.command == "bootstrap": bootstrap()
    elif args.command == "ingest": return ingest(parse_time(args.now), args.fixture_dir)
    elif args.command == "validate": validate()
    elif args.command == "audit": print(json.dumps(run_audit(parse_time(args.now)), indent=2))
    elif args.command == "publish-drafts": generate_publishing()
    elif args.command == "lock": lock_forecast(args)
    elif args.command == "revise": revise_forecast(args)
    elif args.command == "resolve": resolve_forecast(args)
    elif args.command == "approve": approve_observation(args)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {type(error).__name__}: {error}", file=sys.stderr)
        raise SystemExit(1)
