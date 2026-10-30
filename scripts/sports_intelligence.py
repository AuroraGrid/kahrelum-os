#!/usr/bin/env python3
"""KAHRELUM Sports Intelligence v1.1 fail-closed source and forecast tooling.

Standard-library only. Network observations enter a review queue; they never
become transactions or forecasts without an explicit, attributable approval.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import email.utils
import hashlib
import html.parser
import json
import math
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

DEADLINE = dt.datetime(2026, 11, 10, 21, 0, tzinfo=dt.timezone.utc)
AUDIT_AT = dt.datetime(2026, 11, 12, 14, 0, tzinfo=dt.timezone.utc)
OFFICIAL_AUDIT_URLS = [
    "https://www.nfl.com/transactions/league/trades/2026/10",
    "https://www.nfl.com/transactions/league/trades/2026/11",
]
EVIDENCE_CLASSES = {"FACT", "REPORT", "INFERENCE", "FORECAST", "UNVERIFIED"}
REVIEW_DISPOSITIONS = {"APPROVAL_CANDIDATE", "ARCHIVE_ONLY", "HOLD_ORIGINAL_SOURCE", "DUPLICATE", "REJECT"}
ROOT = Path(__file__).resolve().parents[1]
NFL = ROOT / "nfl"
USER_AGENT = "KAHRELUM-SourceGrid/1.1 (+https://kahrelum.com/nfl/trades)"
TRANSIENT_HTTP_STATUSES = {202, 408, 425, 429, 500, 502, 503, 504}
MAX_FETCH_ATTEMPTS = 3
FORECAST_MODEL_VERSION = "KAHRELUM_STRUCTURED_JUDGMENT_v1.1"
FORECAST_BASE_LOG_ODDS = -1.7346010553881064  # 15% reference rate; governance prior, not a fitted league estimate.
FORECAST_FEATURE_WEIGHTS = {
    "confirmedTradeRequest": 1.10,
    "originalAvailabilityReport": 0.80,
    "verifiedInquiry": 0.60,
    "credibleReporterMarketSignal": 0.50,
    "sellerPosture": 0.40,
    "expiringContract": 0.30,
    "buyerFitOrReducedRole": 0.20,
    "teamShutDownInquiriesOrNotAvailable": -1.10,
    "retentionOrDeadCapConstraint": -0.50,
    "originalSourceNotCaptured": -0.40,
    "reportedMoreLikelyToStay": -0.30,
}

PATHS = {
    "registry": NFL / "sourcegrid.json",
    "observations": NFL / "source-observations.json",
    "queue": NFL / "review-queue.json",
    "status": NFL / "refresh-status.json",
    "public": NFL / "public-feed.json",
    "ledger": NFL / "forecast-ledger.json",
    "audit": NFL / "deadline-audit.json",
    "publishing": NFL / "publishing.json",
    "health": NFL / "source-health.json",
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
    {"id": "NBC_PFT_RSS", "name": "NBC Sports ProFootballTalk RSS", "url": "https://profootballtalk.nbcsports.com/feed/", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "CBS_RSS", "name": "CBS Sports NFL RSS", "url": "https://www.cbssports.com/rss/headlines/nfl/", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "YAHOO_RSS", "name": "Yahoo Sports NFL RSS", "url": "https://sports.yahoo.com/nfl/rss.xml", "type": "rss", "role": "SECONDARY_DISCOVERY", "operational": True},
    {"id": "GOOGLE_NEWS_RSS", "name": "Google News NFL trade discovery", "url": "https://news.google.com/rss/search?q=NFL+trade+when:1d&hl=en-US&gl=US&ceid=US:en", "type": "rss", "role": "SEARCH_DISCOVERY_ONLY", "operational": True},
    {"id": "NFL_TRANSACTIONS", "name": "NFL official transactions", "url": "https://www.nfl.com/transactions/league/trades/2026/10", "type": "official_transactions", "role": "OFFICIAL_VERIFICATION_ENDPOINT", "operational": True},
]

INTEGRATIONS += [
    {
        "id": f"TEAM_{team}_RSS",
        "name": f"{team} official news RSS",
        "url": urllib.parse.urljoin(url, "/rss/news"),
        "type": "rss",
        "role": "OFFICIAL_TEAM_DISCOVERY",
        "team": team,
        "operational": True,
    }
    for team, url in TEAM_SITES.items()
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
    watchlist.append({"id": "ENDPOINT_ESPN_RSS", "name": "ESPN NFL RSS", "category": "UNSTABLE_ENDPOINT", "status": "WATCHLIST_ONLY", "reason": "Removed from operational automation after repeated HTTP 202 responses on GitHub Actions; use only for manual source discovery until runner reliability is re-established"})
    write_json(PATHS["registry"], {
        "schema": "KAHRELUM_SOURCEGRID_v1.1", "generatedAt": iso(),
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
        "schema": "KAHRELUM_REFRESH_STATUS_v1.1", "lastAttemptAt": None, "lastCompletedCheckAt": None,
        "lastSuccessfulSourceCheckAt": None, "lastFullySuccessfulSourceCheckAt": None,
        "lastPublishedUpdateAt": board.get("asOf"), "feedFreshness": "NOT_YET_RUN", "monitoringState": "DEADLINE_WINDOW_OPEN",
        "deadlineUtc": iso(DEADLINE), "sourcesAttempted": 0, "sourcesSucceeded": 0, "sourcesFailed": 0,
        "observationsNew": 0, "duplicatesSuppressed": 0, "reviewQueueCount": 0, "materialAlerts": [],
        "sourceFailureAlerts": [], "errors": [],
        "truthBoundary": "Source checks and publication are separate. lastSuccessfulSourceCheckAt means at least one source succeeded; lastFullySuccessfulSourceCheckAt requires every registered operational source to succeed."
    })
    write_json(PATHS["health"], {
        "schema": "KAHRELUM_SOURCE_HEALTH_v1.1",
        "generatedAt": iso(),
        "sources": [
            {
                "sourceIntegrationId": item["id"], "name": item["name"], "url": item["url"],
                "status": "NOT_YET_RUN", "lastAttemptAt": None, "lastSuccessAt": None,
                "lastHttpStatus": None, "itemsParsed": 0, "observationsNew": 0,
                "retries": 0, "consecutiveFailures": 0, "error": None,
            }
            for item in INTEGRATIONS
        ],
    })
    write_json(PATHS["audit"], empty_audit("SCHEDULED", "No eligible resolved prospective forecasts yet."))
    generate_publishing()


def migrate_v11() -> None:
    """Upgrade SourceGrid registration and telemetry without touching evidence or forecast records."""
    registry = read_json(PATHS["registry"])
    watchlist = [item for item in registry.get("watchlist", []) if item.get("category") != "TEAM_OFFICIAL"]
    watchlist = [item for item in watchlist if item.get("id") != "ENDPOINT_ESPN_RSS"]
    watchlist.append({"id": "ENDPOINT_ESPN_RSS", "name": "ESPN NFL RSS", "category": "UNSTABLE_ENDPOINT", "status": "WATCHLIST_ONLY", "reason": "Removed from operational automation after repeated HTTP 202 responses on GitHub Actions; use only for manual source discovery until runner reliability is re-established"})
    registry.update({
        "schema": "KAHRELUM_SOURCEGRID_v1.1", "generatedAt": iso(),
        "operationalIntegrations": INTEGRATIONS, "watchlist": watchlist,
        "counts": {"operational": len(INTEGRATIONS), "watchlistOnly": len(watchlist), "teamsCovered": len(TEAM_SITES)},
    })
    status = read_json(PATHS["status"])
    status.update({
        "schema": "KAHRELUM_REFRESH_STATUS_v1.1",
        "lastCompletedCheckAt": status.get("lastCompletedCheckAt") or status.get("lastAttemptAt"),
        "lastFullySuccessfulSourceCheckAt": status.get("lastFullySuccessfulSourceCheckAt"),
        "duplicatesSuppressed": status.get("duplicatesSuppressed", 0),
        "sourceFailureAlerts": status.get("sourceFailureAlerts", []),
        "truthBoundary": "Source checks and publication are separate. lastSuccessfulSourceCheckAt means at least one source succeeded; lastFullySuccessfulSourceCheckAt requires every registered operational source to succeed.",
    })
    old_health = read_json(PATHS["health"], {"sources": []})
    old_by_id = {item["sourceIntegrationId"]: item for item in old_health.get("sources", [])}
    health = initial_health(registry)
    health["sources"] = [old_by_id.get(item["id"], fresh) for item, fresh in zip(INTEGRATIONS, health["sources"])]
    write_json(PATHS["registry"], registry)
    write_json(PATHS["status"], status)
    write_json(PATHS["health"], health)


class FetchFailure(OSError):
    def __init__(self, message: str, *, status: int | None = None, attempts: int = 1):
        super().__init__(message)
        self.status = status
        self.attempts = attempts


def fetch(url: str, fixture: Path | None = None, *, sleeper=time.sleep) -> dict:
    if fixture:
        if not fixture.exists():
            raise FetchFailure(f"fixture missing: {fixture}")
        return {"content": fixture.read_bytes(), "status": 200, "attempts": 1, "contentType": "application/xml"}
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, text/html;q=0.7",
        },
    )
    last_status = None
    last_error = None
    for attempt in range(1, MAX_FETCH_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                last_status = response.status
                content = response.read(2_500_000)
                content_type = response.headers.get("Content-Type", "")
                retry_after = response.headers.get("Retry-After")
            if last_status == 200:
                return {"content": content, "status": last_status, "attempts": attempt, "contentType": content_type}
            last_error = f"HTTP {last_status}"
            if last_status not in TRANSIENT_HTTP_STATUSES or attempt == MAX_FETCH_ATTEMPTS:
                break
            delay = min(5.0, float(retry_after)) if retry_after and retry_after.isdigit() else min(2 ** (attempt - 1), 5)
            sleeper(delay)
        except urllib.error.HTTPError as error:
            last_status = error.code
            last_error = f"HTTPError: HTTP {error.code}"
            if error.code not in TRANSIENT_HTTP_STATUSES or attempt == MAX_FETCH_ATTEMPTS:
                break
            retry_after = error.headers.get("Retry-After") if error.headers else None
            delay = min(5.0, float(retry_after)) if retry_after and retry_after.isdigit() else min(2 ** (attempt - 1), 5)
            sleeper(delay)
        except (OSError, TimeoutError) as error:
            last_error = f"{type(error).__name__}: {error}"
            if attempt == MAX_FETCH_ATTEMPTS:
                break
            sleeper(min(2 ** (attempt - 1), 5))
    raise FetchFailure(last_error or "source retrieval failed", status=last_status, attempts=attempt)


class TransactionTableParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.table_depth = 0
        self.in_row = False
        self.in_cell = False
        self.cell_text = []
        self.cells = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table" and "d3-o-table" in attrs.get("class", ""):
            self.table_depth += 1
        elif self.table_depth and tag == "table":
            self.table_depth += 1
        if self.table_depth and tag == "tr":
            self.in_row = True
            self.cells = []
        elif self.in_row and tag == "td":
            self.in_cell = True
            self.cell_text = []

    def handle_endtag(self, tag):
        if self.in_cell and tag == "td":
            value = " ".join("".join(self.cell_text).split())
            midpoint = len(value) // 2
            if len(value) % 2 == 0 and value[:midpoint] == value[midpoint:]:
                value = value[:midpoint]
            self.cells.append(value)
            self.in_cell = False
        elif self.in_row and tag == "tr":
            if len(self.cells) >= 6:
                self.rows.append(self.cells[:6])
            self.in_row = False
        if self.table_depth and tag == "table":
            self.table_depth -= 1

    def handle_data(self, data):
        if self.in_cell:
            self.cell_text.append(data)


def parse_transaction_rows(content: bytes) -> list[dict]:
    parser = TransactionTableParser()
    parser.feed(content.decode("utf-8", errors="replace"))
    output: list[dict] = []
    for from_team, to_team, date_text, player, position, action in parser.rows:
        if action.casefold() != "traded" or not player or not re.fullmatch(r"\d{1,2}/\d{1,2}", date_text):
            continue
        month, day = (int(value) for value in date_text.split("/"))
        output.append({
            "fromTeam": from_team, "toTeam": to_team, "player": player, "position": position,
            "transactionDate": date_text, "transactionTimestampUtc": iso(dt.datetime(2026, month, day, tzinfo=dt.timezone.utc)),
            "action": action,
        })
    return output


def parse_official_transactions(content: bytes, integration: dict, checked_at: str) -> list[dict]:
    output = []
    for fields in parse_transaction_rows(content):
        date_text = fields["transactionDate"]
        player = fields["player"]
        from_team = fields["fromTeam"]
        to_team = fields["toTeam"]
        title = f"{player}: {from_team} to {to_team} — Traded (NFL transaction record {date_text}/2026)"
        identity = f"{integration['id']}|{date_text}|{player}|{from_team}|{to_team}"
        output.append({
            "id": "OBS-" + hashlib.sha256(identity.encode()).hexdigest()[:20],
            "sourceIntegrationId": integration["id"], "sourceName": integration["name"],
            "title": title, "originalUrl": integration["url"], "normalizedUrl": normalize_url(integration["url"]),
            "sourcePublishedAt": fields["transactionTimestampUtc"], "firstObservedAt": checked_at, "lastObservedAt": checked_at,
            "evidenceClass": "FACT", "claimType": "OFFICIAL_COMPLETED_TRANSACTION",
            "reviewStatus": "REVIEW_REQUIRED", "publicationGate": "BLOCKED_PENDING_EDITOR_APPROVAL",
            "originalUrlPreserved": True, "linkCustody": "OFFICIAL_NFL_TRANSACTION_TABLE",
            "officialFields": fields,
        })
    if not output:
        raise ValueError("official transaction table contained no traded rows")
    return output


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
    for node in nodes[:50]:
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
        fingerprint = content_fingerprint(title)
        output.append({
            "id": observation_id, "sourceIntegrationId": integration["id"], "sourceName": integration["name"],
            "title": title, "originalUrl": url, "normalizedUrl": canonical, "sourcePublishedAt": published_at,
            "firstObservedAt": checked_at, "lastObservedAt": checked_at, "evidenceClass": "UNVERIFIED",
            "claimType": classify_claim(title), "reviewStatus": "REVIEW_REQUIRED", "publicationGate": "BLOCKED_PENDING_ORIGINAL_SOURCE_REVIEW",
            "originalUrlPreserved": not discovery_redirect,
            "linkCustody": "DISCOVERY_REDIRECT_NOT_ORIGINAL_REPORT" if discovery_redirect else "FEED_ATTRIBUTED_ARTICLE_URL",
            "contentFingerprint": fingerprint,
        })
    return output


def content_fingerprint(title: str) -> str:
    normalized = re.sub(r"\s+-\s+(?:Yahoo Sports|ESPN|CBS Sports|NFL\.com|Bleacher Report|Sports Illustrated|FOX Sports)$", "", title, flags=re.I)
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized.casefold()).strip()
    return hashlib.sha256(normalized.encode()).hexdigest()[:20]


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


def initial_health(registry: dict) -> dict:
    return {
        "schema": "KAHRELUM_SOURCE_HEALTH_v1.1", "generatedAt": iso(),
        "sources": [
            {
                "sourceIntegrationId": item["id"], "name": item["name"], "url": item["url"],
                "status": "NOT_YET_RUN", "lastAttemptAt": None, "lastSuccessAt": None,
                "lastHttpStatus": None, "itemsParsed": 0, "observationsNew": 0,
                "retries": 0, "consecutiveFailures": 0, "error": None,
            }
            for item in registry["operationalIntegrations"]
        ],
    }


def probe_integration(integration: dict, checked_at: str, fixture_dir: Path | None) -> dict:
    try:
        fixture = fixture_dir / f"{integration['id']}.xml" if fixture_dir else None
        response = fetch(integration["url"], fixture)
        if integration["type"] == "rss":
            items = parse_feed(response["content"], integration, checked_at)
        elif integration["type"] == "official_transactions":
            items = parse_official_transactions(response["content"], integration, checked_at)
        else:
            raise ValueError(f"unsupported integration type: {integration['type']}")
        return {"integration": integration, "ok": True, "items": items, **{k: response[k] for k in ("status", "attempts", "contentType")}}
    except Exception as error:
        return {
            "integration": integration, "ok": False, "items": [],
            "status": getattr(error, "status", None), "attempts": getattr(error, "attempts", 1),
            "contentType": None, "error": f"{type(error).__name__}: {error}",
        }


def ingest(now: dt.datetime, fixture_dir: Path | None = None) -> int:
    registry = read_json(PATHS["registry"])
    status = read_json(PATHS["status"])
    status.update({"lastAttemptAt": iso(now), "observationsNew": 0, "duplicatesSuppressed": 0, "errors": [], "sourceFailureAlerts": []})
    if now >= DEADLINE:
        status.update({"lastCompletedCheckAt": iso(now), "monitoringState": "DEADLINE_WINDOW_CLOSED", "feedFreshness": "ARCHIVED_NO_DEADLINE_FETCH", "sourcesAttempted": 0, "sourcesSucceeded": 0, "sourcesFailed": 0})
        write_json(PATHS["status"], status)
        if now >= AUDIT_AT:
            ledger = read_json(PATHS["ledger"])
            if ledger.get("eligibleLocks"):
                retrieve_official_outcomes(now, fixture_dir)
            run_audit(now)
        return 0

    stored = read_json(PATHS["observations"])
    queue = read_json(PATHS["queue"])
    by_id = {o["id"]: o for o in stored["observations"]}
    queue_ids = {o["observationId"] for o in queue["items"]}
    fingerprints = {o.get("contentFingerprint") or content_fingerprint(o["title"]): o["id"] for o in stored["observations"]}
    health = read_json(PATHS["health"], initial_health(registry))
    health_by_id = {item["sourceIntegrationId"]: item for item in health.get("sources", [])}
    successes = 0
    failures = []
    integrations = registry["operationalIntegrations"]
    if fixture_dir:
        results = [probe_integration(item, iso(now), fixture_dir) for item in integrations]
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(lambda item: probe_integration(item, iso(now), None), integrations))
    for result in results:
        integration = result["integration"]
        source_health = health_by_id.get(integration["id"], {
            "sourceIntegrationId": integration["id"], "name": integration["name"], "url": integration["url"],
            "lastSuccessAt": None, "consecutiveFailures": 0,
        })
        source_health.update({
            "name": integration["name"], "url": integration["url"], "lastAttemptAt": iso(now),
            "lastHttpStatus": result.get("status"), "retries": max(0, result.get("attempts", 1) - 1),
            "itemsParsed": len(result["items"]), "observationsNew": 0,
        })
        if result["ok"]:
            for item in result["items"]:
                existing = by_id.get(item["id"])
                if existing:
                    existing["lastObservedAt"] = iso(now)
                    continue
                if item.get("claimType") == "OFFICIAL_COMPLETED_TRANSACTION":
                    for prior in by_id.values():
                        if (prior.get("sourceIntegrationId") == "NFL_TRANSACTIONS" and
                                prior.get("officialFields", {}).get("player") == item["officialFields"]["player"] and
                                prior.get("officialFields", {}).get("transactionDate") == item["officialFields"]["transactionDate"] and
                                prior["id"] != item["id"]):
                            prior.update({"reviewStatus": "SUPERSEDED_PARSER_CORRECTION", "publicationGate": "BLOCKED_SUPERSEDED", "supersededByObservationId": item["id"]})
                            for queued in queue["items"]:
                                if queued["observationId"] == prior["id"] and queued["status"] == "OPEN":
                                    queued.update({"status": "SUPERSEDED", "supersededByObservationId": item["id"]})
                fingerprint = item.get("contentFingerprint") or content_fingerprint(item["title"])
                if fingerprint in fingerprints:
                    status["duplicatesSuppressed"] += 1
                    continue
                by_id[item["id"]] = item
                fingerprints[fingerprint] = item["id"]
                status["observationsNew"] += 1
                source_health["observationsNew"] += 1
                if item["id"] not in queue_ids:
                    priority = "HIGH" if item["claimType"] == "OFFICIAL_COMPLETED_TRANSACTION" else "NORMAL"
                    queue["items"].append({"observationId": item["id"], "queuedAt": iso(now), "reason": item["publicationGate"], "priority": priority, "status": "OPEN"})
                    queue_ids.add(item["id"])
            source_health.update({"status": "FRESH", "lastSuccessAt": iso(now), "consecutiveFailures": 0, "error": None})
            successes += 1
        else:  # fail visibly per endpoint; never hide a partial failure
            source_health.update({"status": "FAILED", "consecutiveFailures": source_health.get("consecutiveFailures", 0) + 1, "error": result["error"]})
            failures.append({"sourceIntegrationId": integration["id"], "httpStatus": result.get("status"), "attempts": result.get("attempts"), "error": result["error"]})
        health_by_id[integration["id"]] = source_health

    stored["observations"] = sorted(by_id.values(), key=lambda x: (x["firstObservedAt"], x["id"]))
    stored["contradictions"] = contradiction_records(stored["observations"])
    source_failure_alerts = [
        {
            "sourceIntegrationId": failure["sourceIntegrationId"], "status": "MATERIAL_SOURCE_FAILURE",
            "reason": failure["error"], "observedAtUtc": iso(now),
        }
        for failure in failures
        if failure["sourceIntegrationId"] == "NFL_TRANSACTIONS" or health_by_id[failure["sourceIntegrationId"]].get("consecutiveFailures", 0) >= 2
    ][:3]
    status.update({
        "lastCompletedCheckAt": iso(now), "sourcesAttempted": len(integrations), "sourcesSucceeded": successes,
        "sourcesFailed": len(failures), "errors": failures, "reviewQueueCount": len([x for x in queue["items"] if x["status"] == "OPEN"]),
        "sourceFailureAlerts": source_failure_alerts,
        "monitoringState": "DEADLINE_WINDOW_OPEN",
        "feedFreshness": "FRESH" if successes == len(integrations) else ("DEGRADED" if successes else "STALE_FAILED"),
    })
    if successes:
        status["lastSuccessfulSourceCheckAt"] = iso(now)
    if successes == len(integrations):
        status["lastFullySuccessfulSourceCheckAt"] = iso(now)
    health.update({"generatedAt": iso(now), "sources": [health_by_id[item["id"]] for item in integrations]})
    write_json(PATHS["observations"], stored)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["status"], status)
    write_json(PATHS["health"], health)
    generate_publishing()
    return 0 if successes else 2


def chain_record(payload: dict, previous_hash: str | None) -> dict:
    record = {**payload, "previousRecordHash": previous_hash}
    record["recordHash"] = digest(record)
    return record


def structured_forecast_probability(features: dict) -> float:
    unknown = set(features) - set(FORECAST_FEATURE_WEIGHTS)
    if unknown:
        raise ValueError(f"unknown forecast features: {sorted(unknown)}")
    if any(value not in {True, False, 0, 1} for value in features.values()):
        raise ValueError("forecast features must be binary")
    log_odds = FORECAST_BASE_LOG_ODDS + sum(FORECAST_FEATURE_WEIGHTS[name] for name, enabled in features.items() if enabled)
    return round(1 / (1 + math.exp(-log_odds)), 2)


def validate_forecast_proposals(proposal_file: Path) -> dict:
    payload = read_json(proposal_file)
    if payload.get("modelVersion") != FORECAST_MODEL_VERSION or payload.get("authorizationStatus") != "PENDING_OWNER_APPROVAL_NOT_LOCKED":
        raise ValueError("forecast proposal model or authorization boundary is invalid")
    proposals = payload.get("proposals", [])
    if not proposals or len({item.get("eventId") for item in proposals}) != len(proposals):
        raise ValueError("forecast proposals must be nonempty with unique event identifiers")
    for item in proposals:
        if parse_time(item["resolutionDeadlineUtc"]) != DEADLINE:
            raise ValueError(f"invalid deadline for {item['eventId']}")
        if parse_time(item["informationCutoffUtc"]) >= DEADLINE:
            raise ValueError(f"late information cutoff for {item['eventId']}")
        expected = structured_forecast_probability(item["features"])
        if item.get("proposedProbability") != expected:
            raise ValueError(f"probability/model mismatch for {item['eventId']}: expected {expected}")
        if not item.get("supportingSources") or not all(source.startswith("https://") for source in item["supportingSources"]):
            raise ValueError(f"HTTPS supporting sources required for {item['eventId']}")
        if not item.get("counterarguments") or not item.get("resolutionQuestion"):
            raise ValueError(f"rationale fields missing for {item['eventId']}")
    return {"status": "VALID_PROPOSAL_COHORT_NOT_LOCKED", "count": len(proposals), "modelVersion": FORECAST_MODEL_VERSION}


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
    published_at = parse_time(args.published_at)
    if deadline != DEADLINE:
        raise ValueError(f"NFL 2026 trade forecasts require the exact deadline {iso(DEADLINE)}")
    if cutoff >= deadline or published_at < cutoff or published_at >= deadline:
        raise ValueError("forecast cutoff and publication must be prospective and precede the deadline")
    payload = {
        "eventId": args.event_id, "player": args.player, "question": args.question, "deadlineUtc": iso(deadline),
        "originalProbability": probability, "informationCutoffUtc": iso(cutoff), "publicationTimestampUtc": iso(published_at),
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
    revision_cutoff = parse_time(args.cutoff)
    revision_published = parse_time(args.published_at)
    if revision_published < revision_cutoff or revision_published >= DEADLINE:
        raise ValueError("revision cutoff and publication must be prospective and precede the deadline")
    previous = event["revisions"][-1]["recordHash"] if event["revisions"] else event["recordHash"]
    revision = chain_record({"version": len(event["revisions"]) + 2, "probability": probability, "informationCutoffUtc": iso(revision_cutoff), "publicationTimestampUtc": iso(revision_published), "gitCommit": args.commit, "rationale": args.rationale, "counterarguments": [args.counterargument]}, previous)
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
    reviewed_at = iso(parse_time(args.reviewed_at))
    decision = {"evidenceClass": args.evidence_class, "headline": args.headline, "claim": args.claim, "sourceUrl": args.source_url, "reviewedAtUtc": reviewed_at, "reviewedBy": args.reviewed_by, "material": bool(args.material)}
    for item in queue["items"]:
        if item["observationId"] == args.observation_id:
            item.update({"status": "EDITOR_APPROVED", "reviewedAtUtc": reviewed_at, "reviewedBy": args.reviewed_by, "evidenceClass": args.evidence_class, "editorialDecision": decision})
    observation.update({"reviewStatus": "EDITOR_APPROVED", "evidenceClass": args.evidence_class, "publicationGate": "BLOCKED_PENDING_PUBLICATION_AUTHORIZATION", "reviewedAtUtc": reviewed_at})
    status["reviewQueueCount"] = len([x for x in queue["items"] if x["status"] == "OPEN"])
    write_json(PATHS["observations"], observations)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["status"], status)
    generate_publishing()


def apply_review_batch(batch_file: Path) -> None:
    batch = read_json(batch_file)
    if batch.get("publicationAuthorized") is not False:
        raise ValueError("review batch must explicitly keep publication unauthorized")
    decisions = batch.get("decisions", [])
    if not decisions or len({x.get("observationId") for x in decisions}) != len(decisions):
        raise ValueError("review batch decisions must be nonempty and unique")
    observations = read_json(PATHS["observations"])
    queue = read_json(PATHS["queue"])
    status = read_json(PATHS["status"])
    observations_by_id = {item["id"]: item for item in observations["observations"]}
    queue_by_id = {item["observationId"]: item for item in queue["items"]}
    for decision in decisions:
        observation_id = decision["observationId"]
        if observation_id not in observations_by_id or observation_id not in queue_by_id:
            raise ValueError(f"review decision references unknown observation: {observation_id}")
        if decision.get("proposedEvidenceClass") not in EVIDENCE_CLASSES | {"REJECTED_INSUFFICIENT_EVIDENCE", "DUPLICATE"}:
            raise ValueError(f"invalid proposed evidence class for {observation_id}")
        if decision.get("disposition") not in REVIEW_DISPOSITIONS:
            raise ValueError(f"invalid review disposition for {observation_id}")
        proposal = {**decision, "batchId": batch["batchId"], "reviewedAtUtc": batch["reviewedAtUtc"]}
        queue_by_id[observation_id].update({"status": "PROPOSAL_READY", "reviewProposal": proposal})
        observations_by_id[observation_id].update({
            "reviewStatus": "PROPOSAL_READY", "publicationGate": "BLOCKED_PENDING_OWNER_EDITORIAL_DECISION",
            "reviewProposalBatchId": batch["batchId"],
        })
    status["reviewQueueCount"] = len([x for x in queue["items"] if x["status"] == "OPEN"])
    status["reviewProposalCount"] = len([x for x in queue["items"] if x["status"] == "PROPOSAL_READY"])
    write_json(PATHS["observations"], observations)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["status"], status)


def publish_observation(args) -> None:
    observations = read_json(PATHS["observations"])
    queue = read_json(PATHS["queue"])
    public = read_json(PATHS["public"])
    status = read_json(PATHS["status"])
    observation = next((x for x in observations["observations"] if x["id"] == args.observation_id), None)
    item = next((x for x in queue["items"] if x["observationId"] == args.observation_id), None)
    if not observation or not item:
        raise ValueError("unknown observation")
    if observation.get("reviewStatus") != "EDITOR_APPROVED" or item.get("status") != "EDITOR_APPROVED":
        raise ValueError("publication requires a separate completed editorial approval")
    if any(x["observationId"] == args.observation_id for x in public["publishedUpdates"]):
        raise ValueError("observation already published")
    decision = item["editorialDecision"]
    published_at = iso(parse_time(args.published_at))
    update = {
        "observationId": args.observation_id, "evidenceClass": decision["evidenceClass"],
        "headline": decision["headline"], "claim": decision["claim"], "sourceUrl": decision["sourceUrl"],
        "sourcePublishedAt": observation.get("sourcePublishedAt"), "reviewedAtUtc": decision["reviewedAtUtc"],
        "reviewedBy": decision["reviewedBy"], "publishedAtUtc": published_at,
        "publicationAuthorizedBy": args.authorized_by, "automaticallyPublished": False,
    }
    public["publishedUpdates"].insert(0, update)
    if decision.get("material"):
        public["materialAlerts"] = ([update] + public.get("materialAlerts", []))[:3]
    item.update({"status": "PUBLISHED", "publishedAtUtc": published_at, "publicationAuthorizedBy": args.authorized_by})
    observation.update({"reviewStatus": "PUBLISHED", "publicationGate": "PUBLISHED_WITH_EXPLICIT_AUTHORIZATION", "publishedAtUtc": published_at})
    status["lastPublishedUpdateAt"] = published_at
    status["materialAlerts"] = public.get("materialAlerts", [])[:3]
    status["reviewQueueCount"] = len([x for x in queue["items"] if x["status"] == "OPEN"])
    write_json(PATHS["observations"], observations)
    write_json(PATHS["queue"], queue)
    write_json(PATHS["public"], public)
    write_json(PATHS["status"], status)
    generate_publishing()


def empty_audit(status: str, limitation: str) -> dict:
    return {"schema": "KAHRELUM_NFL_DEADLINE_AUDIT_v1.0", "scheduledForUtc": iso(AUDIT_AT), "status": status, "officialOutcomeCutoffUtc": iso(DEADLINE), "confirmedTransactions": [], "eligibleForecasts": 0, "correctTrades": 0, "correctNonTrades": 0, "incorrect": 0, "brierScore": None, "allNoBaselineBrier": None, "excludedHistoricalForecasts": 20, "limitations": [limitation]}


def retrieve_official_outcomes(now: dt.datetime, fixture_dir: Path | None = None) -> None:
    """Resolve the cohort only after both official monthly tables are in custody."""
    if now < AUDIT_AT:
        raise ValueError("official deadline outcomes cannot be retrieved before the scheduled audit")
    ledger = read_json(PATHS["ledger"])
    if not ledger.get("eligibleLocks"):
        return
    retrieved, records = [], []
    try:
        for url in OFFICIAL_AUDIT_URLS:
            month = url.rsplit("/", 1)[-1]
            fixture = fixture_dir / f"NFL_TRANSACTIONS_2026_{month}.html" if fixture_dir else None
            response = fetch(url, fixture)
            rows = parse_transaction_rows(response["content"])
            # October must contain trades; November may legitimately contain none.
            if month == "10" and not rows:
                raise ValueError("official October transaction table contained no traded rows")
            retrieved.append({"url": url, "httpStatus": response["status"], "retrievedAtUtc": iso(now), "records": len(rows)})
            records.extend(rows)
    except Exception as error:
        audit = empty_audit("FAILED_OFFICIAL_OUTCOME_RETRIEVAL", "Complete official October and November transaction custody was not established; no outcomes or scores were recorded.")
        audit.update({"generatedAt": iso(now), "officialSources": retrieved, "retrievalError": f"{type(error).__name__}: {error}"})
        write_json(PATHS["audit"], audit)
        raise

    existing = {item["eventId"] for item in ledger.get("outcomeRecords", [])}
    official_by_player = {}
    for record in records:
        if parse_time(record["transactionTimestampUtc"]) <= DEADLINE:
            official_by_player.setdefault(record["player"].casefold().strip(), []).append(record)
    for event in ledger["eligibleLocks"]:
        if event["eventId"] in existing:
            continue
        matches = official_by_player.get(event["player"].casefold().strip(), [])
        matched_month = matches[0]["transactionDate"].split("/")[0] if matches else "11"
        source_url = OFFICIAL_AUDIT_URLS[1] if matched_month == "11" else OFFICIAL_AUDIT_URLS[0]
        payload = {
            "eventId": event["eventId"], "value": int(bool(matches)), "official": True,
            "officialSource": source_url, "officialSourceSet": OFFICIAL_AUDIT_URLS,
            "officialRecordsRetrievedAtUtc": iso(now), "matchedOfficialTransactions": matches,
            "resolvedAtUtc": iso(now),
            "resolutionMethod": "EXACT_PLAYER_MATCH_IN_COMPLETE_2026_OCTOBER_NOVEMBER_NFL_TRADE_TABLES",
        }
        previous = ledger["outcomeRecords"][-1]["recordHash"] if ledger["outcomeRecords"] else None
        ledger["outcomeRecords"].append(chain_record(payload, previous))
    write_json(PATHS["ledger"], ledger)
    audit = read_json(PATHS["audit"], empty_audit("PENDING", "Official outcome scoring has not run."))
    audit.update({"officialSources": retrieved, "officialRecordsRetrievedAtUtc": iso(now)})
    write_json(PATHS["audit"], audit)


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
    previous_audit = read_json(PATHS["audit"], {})
    audit = empty_audit("COMPLETE", "Scores cover only preregistered events resolved from the complete official October and November NFL trade tables.")
    audit.update({"generatedAt": iso(now), "eligibleForecasts": len(resolved), "correctTrades": correct_yes, "correctNonTrades": correct_no, "incorrect": incorrect, "brierScore": sum(errors) / len(errors), "allNoBaselineBrier": sum(all_no) / len(all_no), "confirmedTransactions": [record for outcome in outcomes.values() for record in outcome.get("matchedOfficialTransactions", [])], "officialSources": previous_audit.get("officialSources", []), "officialRecordsRetrievedAtUtc": previous_audit.get("officialRecordsRetrievedAtUtc")})
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
    health = read_json(PATHS["health"])
    assert registry["counts"]["teamsCovered"] == 32
    assert registry["counts"]["operational"] == len(registry["operationalIntegrations"])
    assert all(x["operational"] for x in registry["operationalIntegrations"])
    assert len({x["id"] for x in registry["operationalIntegrations"]}) == len(registry["operationalIntegrations"])
    assert len(health["sources"]) == len(registry["operationalIntegrations"])
    assert {x["sourceIntegrationId"] for x in health["sources"]} == {x["id"] for x in registry["operationalIntegrations"]}
    assert len(board["candidates"]) >= 124 and len(board["deals"]) >= 7
    assert len(ledger["historicalExcluded"]) == len([x for x in board["candidates"] if x.get("kahrelumProbability") is not None])
    assert all(x["status"] == "EXCLUDED_PROVISIONAL" for x in ledger["historicalExcluded"])
    assert len(public.get("materialAlerts", [])) <= 3
    assert status["feedFreshness"] in {"NOT_YET_RUN", "FRESH", "DEGRADED", "STALE_FAILED", "ARCHIVED_NO_DEADLINE_FETCH"}
    previous_event_hash = None
    event_ids = set()
    for event in ledger["eligibleLocks"]:
        assert event["eventId"] not in event_ids
        event_ids.add(event["eventId"])
        assert parse_time(event["deadlineUtc"]) == DEADLINE
        assert parse_time(event["informationCutoffUtc"]) <= parse_time(event["publicationTimestampUtc"]) < DEADLINE
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
            assert parse_time(revision["informationCutoffUtc"]) <= parse_time(revision["publicationTimestampUtc"]) < DEADLINE
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
    sub.add_parser("migrate-v11")
    ingest_p = sub.add_parser("ingest"); ingest_p.add_argument("--now"); ingest_p.add_argument("--fixture-dir", type=Path)
    sub.add_parser("validate")
    sub.add_parser("audit").add_argument("--now")
    sub.add_parser("publish-drafts")
    review_batch = sub.add_parser("apply-review-batch"); review_batch.add_argument("--file", type=Path, required=True)
    forecast_proposals = sub.add_parser("validate-forecast-proposals"); forecast_proposals.add_argument("--file", type=Path, required=True)
    lock = sub.add_parser("lock"); lock.add_argument("--event-id", required=True); lock.add_argument("--player", required=True); lock.add_argument("--probability", required=True); lock.add_argument("--question", required=True); lock.add_argument("--deadline", required=True); lock.add_argument("--cutoff", required=True); lock.add_argument("--published-at", required=True); lock.add_argument("--commit", required=True); lock.add_argument("--evidence", action="append", required=True); lock.add_argument("--counterargument", required=True)
    revise = sub.add_parser("revise"); revise.add_argument("--event-id", required=True); revise.add_argument("--probability", required=True); revise.add_argument("--cutoff", required=True); revise.add_argument("--published-at", required=True); revise.add_argument("--commit", required=True); revise.add_argument("--rationale", required=True); revise.add_argument("--counterargument", required=True)
    resolve = sub.add_parser("resolve"); resolve.add_argument("--event-id", required=True); resolve.add_argument("--outcome", required=True); resolve.add_argument("--source", required=True); resolve.add_argument("--resolved-at", required=True)
    approve = sub.add_parser("approve"); approve.add_argument("--observation-id", required=True); approve.add_argument("--evidence-class", required=True); approve.add_argument("--headline", required=True); approve.add_argument("--claim", required=True); approve.add_argument("--source-url", required=True); approve.add_argument("--reviewed-at", required=True); approve.add_argument("--reviewed-by", required=True); approve.add_argument("--material", action="store_true")
    publish = sub.add_parser("publish"); publish.add_argument("--observation-id", required=True); publish.add_argument("--published-at", required=True); publish.add_argument("--authorized-by", required=True)
    args = parser.parse_args()
    if args.command == "bootstrap": bootstrap()
    elif args.command == "migrate-v11": migrate_v11()
    elif args.command == "ingest": return ingest(parse_time(args.now), args.fixture_dir)
    elif args.command == "validate": validate()
    elif args.command == "audit": print(json.dumps(run_audit(parse_time(args.now)), indent=2))
    elif args.command == "publish-drafts": generate_publishing()
    elif args.command == "apply-review-batch": apply_review_batch(args.file)
    elif args.command == "validate-forecast-proposals": print(json.dumps(validate_forecast_proposals(args.file), indent=2))
    elif args.command == "lock": lock_forecast(args)
    elif args.command == "revise": revise_forecast(args)
    elif args.command == "resolve": resolve_forecast(args)
    elif args.command == "approve": approve_observation(args)
    elif args.command == "publish": publish_observation(args)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {type(error).__name__}: {error}", file=sys.stderr)
        raise SystemExit(1)
