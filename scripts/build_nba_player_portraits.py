#!/usr/bin/env python3
"""Capture ESPN's NBA roster portraits, then reproduce the minimized ledger offline.

Default and --check are deterministic and make no network requests. --capture
explicitly refreshes the 30-team source catalog and checks source-supplied images.
Images stay externally hosted; a public URL is not an open copyright license.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "research/nba-player-portraits/espn-sources-2026-10-31.json"
DEFAULT_OUTPUT = ROOT / "sports/nba-player-portraits.json"
TEAM_INDEX_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=100"
ROSTER_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams"
EXPECTED_TEAMS = 30
USER_AGENT = "KAHRELUM-Research/1.0 (+https://kahrelum.com/sports/nba)"
RIGHTS_NOTICE = "Rights retained by their respective owners; externally hosted editorial player portraits. Public availability does not establish an open license."


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def validate_utc(value: str) -> None:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("A UTC source or check timestamp is required")
    datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower())


def require_https_host(value: str, hosts: set[str]) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.hostname not in hosts or parsed.username or parsed.password:
        raise ValueError("Unexpected or insecure source URL")


def fetch_json(url: str) -> tuple[dict, dict]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read()
        if response.status != 200:
            raise ValueError(f"Source returned HTTP {response.status}")
        receipt = {
            "url": url,
            "retrievedAtUtc": utc_now(),
            "httpStatus": response.status,
            "httpDate": response.headers.get("Date"),
            "contentType": response.headers.get("Content-Type"),
            "contentSha256": hashlib.sha256(raw).hexdigest(),
            "bytes": len(raw),
        }
    return json.loads(raw), receipt


def select_profile(athlete: dict) -> str | None:
    return next((link["href"] for link in athlete.get("links", [])
                 if "playercard" in link.get("rel", []) and link.get("href", "").startswith("https://www.espn.com/nba/player/")), None)


def check_image(url: str) -> dict:
    """Use supplied URLs only. HEAD verifies availability and media type without copying images."""
    last_error = None
    for method in ("HEAD", "GET"):
        headers = {"User-Agent": USER_AGENT, "Accept": "image/*"}
        if method == "GET":
            headers["Range"] = "bytes=0-1023"
        request = urllib.request.Request(url, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                media_type = (response.headers.get("Content-Type") or "").split(";", 1)[0].lower()
                result = {
                    "url": url,
                    "finalUrl": response.url,
                    "status": "AVAILABLE" if response.status in (200, 206) and media_type.startswith("image/") else "NOT_AN_IMAGE_RESPONSE",
                    "method": method,
                    "httpStatus": response.status,
                    "contentType": media_type,
                    "checkedAtUtc": utc_now(),
                }
                if result["status"] == "AVAILABLE":
                    return result
                last_error = result
        except (OSError, ValueError) as error:
            last_error = {"url": url, "status": "UNAVAILABLE", "method": method, "checkedAtUtc": utc_now(), "error": f"{type(error).__name__}: {error}"}
    return last_error


def minimize_roster(index_team: dict) -> tuple[dict, list[dict]]:
    team_id = str(index_team["id"])
    source_url = f"{ROSTER_BASE_URL}/{team_id}/roster"
    data, receipt = fetch_json(source_url)
    team = data["team"]
    if str(team["id"]) != team_id or team["abbreviation"] != index_team["abbreviation"]:
        raise ValueError(f"Roster returned the wrong team: {team_id}")
    athletes = data["athletes"]
    if not isinstance(athletes, list) or not athletes:
        raise ValueError(f"Roster returned no player records: {team_id}")
    metadata = {
        "teamId": team_id,
        "teamName": team["displayName"],
        "teamAbbreviation": team["abbreviation"],
        "sourceUid": index_team["uid"],
        "sourceUrl": next((link["href"] for link in index_team.get("links", []) if "roster" in link.get("rel", []) and link.get("href", "").startswith("https://")), source_url),
        "rosterSourceUrl": source_url,
        "sourceRosterTimestamp": data["timestamp"],
        "season": {key: data["season"].get(key) for key in ("year", "displayName", "type", "name")},
        "receipt": receipt,
        "rosterListedPlayers": len(athletes),
    }
    players = []
    for athlete in athletes:
        headshot = athlete.get("headshot") or {}
        players.append({
            "playerId": str(athlete["id"]),
            "sourceUid": athlete["uid"],
            "displayName": athlete["displayName"],
            "fullName": athlete.get("fullName") or athlete["displayName"],
            "teamId": team_id,
            "position": (athlete.get("position") or {}).get("abbreviation") or "",
            "jersey": str(athlete.get("jersey") or ""),
            "sourceUrl": select_profile(athlete),
            "headshot": {"url": headshot.get("href"), "alt": headshot.get("alt")},
        })
    return metadata, players


def capture_catalog() -> dict:
    started = utc_now()
    index, index_receipt = fetch_json(TEAM_INDEX_URL)
    league = index["sports"][0]["leagues"][0]
    index_teams = [row["team"] for row in league["teams"]]
    if len(index_teams) != EXPECTED_TEAMS or len({str(team["id"]) for team in index_teams}) != EXPECTED_TEAMS:
        raise ValueError("Team index must contain exactly 30 unique NBA teams")
    teams, players = [], []
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(minimize_roster, team): str(team["id"]) for team in index_teams}
        for future in as_completed(futures):
            team, roster_players = future.result()
            teams.append(team)
            players.extend(roster_players)
    print(json.dumps({"stage": "ROSTERS_CAPTURED", "teams": len(teams), "players": len(players)}), flush=True)
    image_urls = {player["headshot"]["url"] for player in players if player["headshot"]["url"]}
    for url in image_urls:
        require_https_host(url, {"a.espncdn.com"})
    checks = {}
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(check_image, url): url for url in image_urls}
        for number, future in enumerate(as_completed(futures), 1):
            url = futures[future]
            checks[url] = future.result()
            if number % 100 == 0 or number == len(image_urls):
                print(json.dumps({"stage": "IMAGE_CHECKS", "checked": number, "total": len(image_urls)}), flush=True)
    for player in players:
        url = player["headshot"]["url"]
        player["imageCheck"] = checks.get(url) if url else {"url": None, "status": "SOURCE_IMAGE_MISSING", "checkedAtUtc": utc_now()}
    result = {
        "schema": "KAHRELUM_NBA_PORTRAIT_SOURCES_v1.0",
        "provider": "ESPN",
        "league": "NBA",
        "captureStartedAtUtc": started,
        "retrievedAtUtc": utc_now(),
        "sourceIndexUrl": TEAM_INDEX_URL,
        "indexReceipt": index_receipt,
        "rightsNotice": RIGHTS_NOTICE,
        "dataMinimization": "Only athlete identity, roster membership, position, jersey, supplied photo/profile URLs and source receipts are retained. No birth dates, salaries, injuries, statistics or forecasts are stored.",
        "teams": sorted(teams, key=lambda row: row["teamName"]),
        "players": sorted(players, key=lambda row: (row["teamId"], row["displayName"], row["playerId"])),
    }
    # A conflicting team or player snapshot must not replace the reviewed catalog.
    build_ledger(result)
    return result


def build_ledger(catalog: dict) -> dict:
    if catalog.get("schema") != "KAHRELUM_NBA_PORTRAIT_SOURCES_v1.0" or catalog.get("league") != "NBA" or catalog.get("provider") != "ESPN":
        raise ValueError("Unknown NBA portrait source catalog")
    validate_utc(catalog["retrievedAtUtc"])
    if catalog.get("sourceIndexUrl") != TEAM_INDEX_URL:
        raise ValueError("Unexpected NBA team index source")
    teams = catalog["teams"]
    if len(teams) != EXPECTED_TEAMS or len({row["teamId"] for row in teams}) != EXPECTED_TEAMS:
        raise ValueError("Exactly 30 unique team records are required")
    if len({row["teamAbbreviation"] for row in teams}) != EXPECTED_TEAMS:
        raise ValueError("Duplicate team abbreviations")
    team_map = {team["teamId"]: team for team in teams}
    for team in teams:
        if not re.fullmatch(r"\d+", team["teamId"]) or team["sourceUid"] != f"s:40~l:46~t:{team['teamId']}":
            raise ValueError("Team identity is not an NBA ESPN source ID")
        if team["rosterSourceUrl"] != f"{ROSTER_BASE_URL}/{team['teamId']}/roster":
            raise ValueError("Team ID and roster source URL do not match")
        validate_utc(team["sourceRosterTimestamp"])
        receipt = team["receipt"]
        if receipt["url"] != team["rosterSourceUrl"] or not re.fullmatch(r"[0-9a-f]{64}", receipt["contentSha256"]):
            raise ValueError("Missing or mismatched roster source receipt")
    players = catalog["players"]
    if len({row["playerId"] for row in players}) != len(players):
        duplicates = sorted({row["playerId"] for row in players if sum(other["playerId"] == row["playerId"] for other in players) > 1})
        raise ValueError(f"Duplicate player IDs across team snapshot: {duplicates}")
    records, unresolved = [], []
    for player in players:
        player_id = player["playerId"]
        if not re.fullmatch(r"\d+", player_id) or player["sourceUid"] != f"s:40~l:46~a:{player_id}":
            raise ValueError("Player identity is not an NBA ESPN source ID")
        if player["teamId"] not in team_map:
            raise ValueError("Player team is absent from the reviewed snapshot")
        team = team_map[player["teamId"]]
        if not player.get("displayName") or not player.get("fullName"):
            raise ValueError("A source-listed player name is required")
        source_url = player.get("sourceUrl")
        if source_url:
            require_https_host(source_url, {"www.espn.com", "espn.com"})
            if not urlparse(source_url).path.startswith(f"/nba/player/_/id/{player_id}/"):
                raise ValueError("Player ID and profile URL do not match")
        image = player["headshot"]
        image_url = image.get("url")
        reason = None
        if not image_url:
            reason = "SOURCE_IMAGE_MISSING"
        else:
            require_https_host(image_url, {"a.espncdn.com"})
            if not re.fullmatch(rf"/i/headshots/nba/players/[^/]+/{player_id}\.png", urlparse(image_url).path):
                raise ValueError("Player ID and source-supplied NBA image URL do not match")
            if normalize_name(image.get("alt") or "") not in {normalize_name(player["displayName"]), normalize_name(player["fullName"])}:
                raise ValueError("Image alt text does not match the source athlete identity")
        check = player.get("imageCheck") or {}
        if not reason:
            validate_utc(check.get("checkedAtUtc"))
            if check.get("url") != image_url:
                raise ValueError("Image availability check belongs to a different URL")
            if not source_url:
                reason = "SOURCE_PROFILE_MISSING"
            elif check.get("status") != "AVAILABLE" or check.get("httpStatus") not in (200, 206) or not check.get("contentType", "").startswith("image/"):
                reason = "IMAGE_AVAILABILITY_NOT_VERIFIED"
        record = {
            "id": f"NBA-ESPN-{player_id}",
            "playerId": player_id,
            "sourceUid": player["sourceUid"],
            "displayName": player["displayName"],
            "fullName": player["fullName"],
            "teamId": team["teamId"],
            "teamName": team["teamName"],
            "teamAbbreviation": team["teamAbbreviation"],
            "position": player["position"],
            "jersey": player["jersey"],
            "sourceUrl": source_url,
            "rosterSourceUrl": team["rosterSourceUrl"],
            "sourceRosterTimestamp": team["sourceRosterTimestamp"],
            "rosterStatus": "SOURCE_ROSTER_LISTED",
            "portrait": {
                "url": image_url if reason is None else None,
                "alt": player["displayName"],
                "sourceUrl": source_url,
                "status": "VERIFIED_EXTERNAL" if reason is None else "UNRESOLVED",
                "reason": reason,
                "imageCheck": check,
                "attribution": "Photo: ESPN",
                "rightsStatus": "RIGHTS_RETAINED_EXTERNAL_EDITORIAL",
                "license": None,
            },
        }
        records.append(record)
        if reason:
            unresolved.append({"id": record["id"], "playerId": player_id, "displayName": player["displayName"], "teamId": team["teamId"], "reason": reason})
    team_summaries = []
    for team in teams:
        members = [row for row in records if row["teamId"] == team["teamId"]]
        if len(members) != team["rosterListedPlayers"] or not members:
            raise ValueError("Team roster record count does not match the captured source")
        team_summaries.append({key: team[key] for key in ("teamId", "teamName", "teamAbbreviation", "sourceUrl", "rosterSourceUrl", "sourceRosterTimestamp", "season")})
        team_summaries[-1].update({"players": len(members), "verifiedPortraits": sum(row["portrait"]["status"] == "VERIFIED_EXTERNAL" for row in members)})
    return {
        "schema": "KAHRELUM_NBA_PLAYER_PORTRAITS_v1.0",
        "status": "VERIFIED_ROSTER_AND_PORTRAIT_SNAPSHOT" if not unresolved else "PARTIAL_PORTRAIT_COVERAGE",
        "league": "NBA",
        "provider": "ESPN",
        "updatedAtUtc": catalog["retrievedAtUtc"],
        "sourceIndexUrl": TEAM_INDEX_URL,
        "coverage": {"teams": len(teams), "players": len(records), "uniquePlayerIds": len({row["playerId"] for row in records}), "verifiedPortraits": len(records) - len(unresolved), "missingPortraits": len(unresolved), "identityConflicts": 0},
        "scope": "Roster-listed player identity and externally hosted portrait snapshot only; not NBA trade, injury, game or forecast coverage.",
        "rightsNotice": RIGHTS_NOTICE,
        "sourceCatalog": "research/nba-player-portraits/espn-sources-2026-10-31.json",
        "identityRule": "Source-supplied NBA athlete UID, exact source name, team roster membership, supplied profile/headshot URLs with matching numeric ID, matching image alt text and a recorded image response. No cross-league or fuzzy identity matching.",
        "teams": sorted(team_summaries, key=lambda row: row["teamName"]),
        "records": sorted(records, key=lambda row: (row["teamName"], row["displayName"], row["playerId"])),
        "unresolved": unresolved,
    }


def render(value: dict) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--capture", action="store_true", help="Refresh public source catalog and image availability checks before rebuilding")
    mode.add_argument("--check", action="store_true", help="Reproduce the committed ledger offline without writing")
    args = parser.parse_args()
    if args.capture:
        catalog = capture_catalog()
        args.catalog.parent.mkdir(parents=True, exist_ok=True)
        args.catalog.write_text(render(catalog), encoding="utf-8")
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    ledger = build_ledger(catalog)
    try:
        ledger["sourceCatalog"] = args.catalog.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        ledger["sourceCatalog"] = str(args.catalog.resolve())
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    rendered = render(ledger)
    if args.check:
        if not args.output.exists() or args.output.read_text(encoding="utf-8") != rendered:
            raise SystemExit("NBA portrait ledger is stale; rebuild it from the reviewed catalog")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
