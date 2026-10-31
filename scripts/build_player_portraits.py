#!/usr/bin/env python3
"""Bind reviewed public ESPN headshots to the NFL board without guessing image IDs."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "research/player-portraits/espn-sources-2026-10-31.json"


def normalize_name(value: str) -> str:
    value = re.sub(r",?\s+(?:Jr\.?|Sr\.?|II|III|IV)$", "", value, flags=re.I)
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", value)


def position_family(position: str) -> str:
    if position in {"C", "G", "OG", "OT", "OL", "T"}:
        return "OFFENSIVE_LINE"
    if position in {"EDGE", "DE", "OLB", "LB", "ILB"}:
        return "FRONT_SEVEN"
    return position


def find_matches(candidate: dict, catalog: dict) -> list[dict]:
    matched = {}
    aliases = {}
    for alias in catalog.get("aliases", []):
        if alias.get("sourceUrl") and alias.get("reviewedAtUtc"):
            aliases.setdefault(alias["sourcePlayerId"], []).append(alias["alias"])
    for identity in catalog["identityIndex"]:
        names = identity["names"] + aliases.get(identity["sourcePlayerId"], [])
        if normalize_name(candidate["name"]) not in {normalize_name(name) for name in names}:
            continue
        known_teams = {identity["team"]}
        # An official release plus the source's free-agent status can confirm
        # the same player under the old board team; it never confirms an active
        # tradeable roster slot. The output keeps that status correction visible.
        if identity.get("rosterStatus") == "FREE_AGENT" and identity.get("lastTeam"):
            known_teams.add(identity["lastTeam"])
        if candidate["team"] not in known_teams:
            continue
        if position_family(candidate["pos"]) != position_family(identity["position"]):
            continue
        matched[identity["sourcePlayerId"]] = identity
    return list(matched.values())


def build_ledger(board: dict, catalog: dict) -> dict:
    if catalog.get("schema") != "KAHRELUM_NFL_PORTRAIT_SOURCES_v1.0":
        raise ValueError("Unknown player portrait source catalog")
    candidates = board["candidates"]
    if len({candidate["id"] for candidate in candidates}) != len(candidates):
        raise ValueError("Duplicate board candidate IDs")
    details = {player["sourcePlayerId"]: player for player in catalog["players"]}
    if len(details) != len(catalog["players"]):
        raise ValueError("Duplicate source player IDs")
    records, unresolved = [], []
    for candidate in candidates:
        matches = find_matches(candidate, catalog)
        if len(matches) != 1:
            unresolved.append({"candidateId": candidate["id"], "playerName": candidate["name"], "reason": "AMBIGUOUS_IDENTITY" if matches else "IDENTITY_NOT_VERIFIED"})
            continue
        identity = matches[0]
        player = details.get(identity["sourcePlayerId"])
        if player is None:
            unresolved.append({"candidateId": candidate["id"], "playerName": candidate["name"], "reason": "NO_REVIEWED_IMAGE"})
            continue
        image = urlparse(player["url"])
        # The href must be copied from the captured source, with its own ID.
        # This is validation of supplied URLs, never construction by name.
        if image.scheme != "https" or image.netloc != "a.espncdn.com" or not image.path.endswith(f"/{player['sourcePlayerId']}.png"):
            raise ValueError(f"Invalid source-supplied player headshot: {player['sourcePlayerId']}")
        if urlparse(player["sourceUrl"]).scheme != "https":
            raise ValueError("A secure source profile URL is required")
        if normalize_name(player["headshotAlt"]) not in {normalize_name(player["fullName"]), normalize_name(player["displayName"])}:
            raise ValueError("Headshot source alt text does not match athlete identity")
        image_check = player.get("imageCheck", {})
        if image_check.get("status") != "AVAILABLE" or image_check.get("url") != player["url"] or not image_check.get("checkedAtUtc"):
            unresolved.append({"candidateId": candidate["id"], "playerName": candidate["name"], "reason": "IMAGE_AVAILABILITY_NOT_VERIFIED"})
            continue
        aliases = [alias for alias in catalog.get("aliases", []) if alias["sourcePlayerId"] == player["sourcePlayerId"]]
        match_names = list(dict.fromkeys([candidate["name"], player["fullName"], player["displayName"], *[alias["alias"] for alias in aliases]]))
        free_agent = player.get("rosterStatus") == "FREE_AGENT"
        if free_agent and not player.get("statusEvidence", {}).get("sourceUrl"):
            raise ValueError("A former-team free-agent match needs official status evidence")
        record = {
            "candidateId": candidate["id"],
            "playerName": player["displayName"],
            "boardNameAtReview": candidate["name"],
            "matchNames": match_names,
            "boardTeamAtReview": candidate["team"],
            "sourceTeam": player["team"],
            "position": candidate["pos"],
            "sourcePosition": player["position"],
            "sourcePlayerId": player["sourcePlayerId"],
            "sourceProvider": "ESPN",
            "status": "VERIFIED_EXTERNAL",
            "url": player["url"],
            "sourceUrl": player["sourceUrl"],
            "rosterSourceUrl": player["rosterSourceUrl"],
            "sourceRosterTimestamp": player["sourceRosterTimestamp"],
            "sourceRosterStatus": player["rosterStatus"],
            "attribution": "Photo: ESPN",
            "rights": "Rights retained by their respective owners; externally hosted editorial portrait.",
            "rightsStatus": "RIGHTS_RETAINED_EXTERNAL_EDITORIAL",
            "license": None,
            "matchMethod": "EXACT_NAME_VERIFIED_FORMER_TEAM_FREE_AGENT" if free_agent else ("DOCUMENTED_ALIAS_NAME_TEAM" if aliases else "EXACT_NAME_TEAM"),
            "reviewedAtUtc": catalog["retrievedAtUtc"],
            "imageAvailability": image_check,
        }
        if aliases:
            record["identityAliases"] = aliases
        if free_agent:
            record["lastTeam"] = player["lastTeam"]
            record["statusEvidence"] = player["statusEvidence"]
        records.append(record)
    return {
        "schema": "KAHRELUM_PLAYER_PORTRAITS_v1.0",
        "status": "VERIFIED_COVERAGE" if not unresolved else "PARTIAL_VERIFIED_COVERAGE",
        "updatedAtUtc": catalog["retrievedAtUtc"],
        "coverage": {
            "candidateRecords": len(candidates),
            "verifiedPortraits": len(records),
            "uniquePlayersWithPortraits": len({record["sourcePlayerId"] for record in records}),
            "reachablePortraitUrls": len(records),
            "rosterListedPlayers": sum(record["sourceRosterStatus"] == "ROSTER_LISTED" for record in records),
            "freeAgentPlayers": sum(record["sourceRosterStatus"] == "FREE_AGENT" for record in records),
            "unresolvedPlayers": len(unresolved),
        },
        "admissionRule": "Exact source name or individually documented alias, compatible position, matching team or officially verified former-team/free-agent state, unique source athlete ID, and the headshot href supplied by that source. No generated faces or inferred image URLs.",
        "sourceCatalog": "research/player-portraits/espn-sources-2026-10-31.json",
        "sourceIndexUrl": catalog["sourceIndexUrl"],
        "rightsNotice": catalog["rights"]["notice"],
        "displayPolicy": "Use a small externally hosted player portrait with linked source attribution, explicit dimensions, lazy loading, name alt text, and initials fallback. Photo identity does not establish forecast eligibility or active roster status.",
        "records": records,
        "unresolved": unresolved,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--board", type=Path, default=ROOT / "nfl/trade-board.json")
    parser.add_argument("--output", type=Path, default=ROOT / "nfl/player-portraits.json")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    ledger = build_ledger(json.loads(args.board.read_text()), json.loads(args.catalog.read_text()))
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    rendered = json.dumps(ledger, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            raise SystemExit("Player portrait ledger is stale; rebuild from the reviewed source catalog")
    else:
        args.output.write_text(rendered)
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
