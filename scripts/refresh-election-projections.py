#!/usr/bin/env python3
"""Fetch, validate and recompute the public KAHRELUM 2026 congressional map.

This creates a new dated research edition. It never edits the historical locks.
The model retains the documented KAHRELUM tier mapping and Senate dependence
assumption; source-listed people are discovery records, not official ballot
certification or portrait licenses.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from statistics import NormalDist


ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / ".election-refresh"
PUBLIC = ROOT / "election" / "current-projections.json"
HOUSE_URL = "https://www.270towin.com/2026-house-election/cook-political-report-2026-house-ratings"
SENATE_URL = "https://www.270towin.com/2026-senate-election/cook-political-report-2026-senate"
TIERS = {"0": "Toss Up", "1": "Solid D", "2": "Solid R", "3": "Likely D", "4": "Likely R", "5": "Lean D", "6": "Lean R"}
PROBS = {"Solid D": .99, "Likely D": .88, "Lean D": .70, "Toss Up": .50, "Lean R": .30, "Likely R": .12, "Solid R": .01}
NORMAL = NormalDist()
EXPECTED_HOUSE_RACES = 435
EXPECTED_SENATE_RACES = 35


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str) -> tuple[bytes, dict[str, str]]:
    request = urllib.request.Request(url, headers={
        "User-Agent": "KAHRELUM-Research/1.0 (+https://kahrelum.com/election-challenge)",
        "Accept": "text/html,application/xhtml+xml",
    })
    with urllib.request.urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f"{url} returned HTTP {response.status}")
        return response.read(), {key.lower(): value for key, value in response.headers.items()}


def parse_seats(raw: bytes) -> dict:
    text = raw.decode("utf-8")
    matches = list(re.finditer(r"map_d3\.seats\s*=\s*", text))
    for match in matches:
        try:
            value, _ = json.JSONDecoder().raw_decode(text[match.end():])
            if isinstance(value, dict):
                return value
        except ValueError:
            continue
    raise RuntimeError("No complete map_d3.seats object found")


def source_edition(raw: bytes) -> str:
    text = raw.decode("utf-8")
    description = re.search(r"map_d3\.description\s*=\s*'[^']+';", text)
    start = description.end() if description else 0
    found = re.search(r"As of (?:October|Oct\.) \d{1,2}, 2026", text[start:])
    if not found:
        raise RuntimeError("Publisher edition date was not found")
    return found.group(0).replace("As of ", "")


def clean_candidates(row: dict) -> list[dict]:
    seen: set[tuple[str, str]] = set()
    output = []
    for candidate in row.get("candidates") or []:
        name = str(candidate.get("full_name") or "").strip()
        party = str(candidate.get("party") or candidate.get("party_name") or "").strip()
        if not name:
            continue
        key = (name.casefold(), party.casefold())
        if key in seen:
            continue
        seen.add(key)
        output.append({
            "name": name,
            "party": party or "UNKNOWN",
            "incumbent": bool(candidate.get("is_incumbent")),
            "primaryActive": candidate.get("primary_active"),
            "generalElectionStatus": candidate.get("general_election_active"),
            "sourceCandidateId": candidate.get("id"),
        })
    return output


def house_projection(seats: dict) -> dict:
    districts = []
    for source_key, rows in seats.items():
        if not isinstance(rows, list) or len(rows) != 1:
            raise RuntimeError(f"House source key {source_key} did not contain one district")
        row = rows[0]
        state = row["state_abbr"]
        district = "AL" if source_key.endswith("00") else str(int(source_key[-2:]))
        tier = TIERS[str(row["map_code"])]
        districts.append({
            "contestId": f"{state}-{district}",
            "state": state,
            "tier": tier,
            "pDem": PROBS[tier],
            "sourceKey": source_key,
            "candidates": clean_candidates(row),
        })
    if len(districts) != EXPECTED_HOUSE_RACES or len({row["contestId"] for row in districts}) != EXPECTED_HOUSE_RACES:
        raise RuntimeError(f"House validation failed: expected {EXPECTED_HOUSE_RACES} unique districts")
    expected = sum(row["pDem"] for row in districts)
    p_control = .5 * math.erfc((217.5 - expected) / (8 * math.sqrt(2)))
    return {
        "raceCount": EXPECTED_HOUSE_RACES,
        "expectedDemocraticSeats": expected,
        "expectedRepublicanSeats": 435 - expected,
        "pDemocraticControl": p_control,
        "controlThreshold": 218,
        "assumedSeatSigma": 8,
        "interval80DemocraticSeats": [expected - 1.2815515655446004 * 8, expected + 1.2815515655446004 * 8],
        "districts": sorted(districts, key=lambda row: row["contestId"]),
    }


def senate_distribution(probabilities: list[float], off_ballot_dem: int = 34, rho: float = .15, samples: int = 2048) -> dict:
    inverse = [NORMAL.inv_cdf(value) for value in probabilities]
    unconditional = [0.0] * (len(probabilities) + 1)
    divisor = math.sqrt(1 - rho)
    root = math.sqrt(rho)
    for sample in range(samples):
        shock = NORMAL.inv_cdf((sample + .5) / samples)
        row = [1.0] + [0.0] * len(probabilities)
        for index, value in enumerate(inverse):
            probability = NORMAL.cdf((value + root * shock) / divisor)
            for count in range(index + 1, 0, -1):
                row[count] = row[count] * (1 - probability) + row[count - 1] * probability
            row[0] *= 1 - probability
        for count, probability in enumerate(row):
            unconditional[count] += probability / samples
    if abs(sum(unconditional) - 1) >= 1e-8:
        raise RuntimeError("Senate probability mass did not sum to one")
    mass = [{"democraticCaucusSeats": off_ballot_dem + index, "probability": value} for index, value in enumerate(unconditional)]
    expected = sum(row["democraticCaucusSeats"] * row["probability"] for row in mass)
    p_control = sum(row["probability"] for row in mass if row["democraticCaucusSeats"] >= 51)

    def quantile(target: float) -> int:
        cumulative = 0.0
        for row in mass:
            cumulative += row["probability"]
            if cumulative >= target:
                return row["democraticCaucusSeats"]
        return mass[-1]["democraticCaucusSeats"]

    return {
        "expectedDemocraticCaucusSeats": expected,
        "pDemocraticCaucusControl": p_control,
        "medianDemocraticCaucusSeats": quantile(.5),
        "interval80DemocraticCaucusSeats": [quantile(.1), quantile(.9)],
        "offBallotDemocraticCaucusSeatsAssumed": off_ballot_dem,
        "commonShockRho": rho,
        "quadratureSamples": samples,
        "seatProbabilityMass": mass,
    }


def senate_projection(seats: dict) -> dict:
    races = []
    for state_rows in seats.values():
        if not isinstance(state_rows, dict):
            raise RuntimeError("Senate state record was not an object")
        for row in state_rows.values():
            if row.get("seat_status") != "T":
                continue
            state = row["state_abbr"]
            contest_id = f"{state}-special" if row.get("special_election") else state
            tier = TIERS[str(row["map_code"])]
            races.append({
                "contestId": contest_id,
                "state": state,
                "tier": tier,
                "pDemocraticCaucus": PROBS[tier],
                "independentCandidateRisk": any(candidate.get("party") not in ("D", "R") for candidate in row.get("candidates") or []),
                "candidates": clean_candidates(row),
            })
    if len(races) != EXPECTED_SENATE_RACES or len({row["contestId"] for row in races}) != EXPECTED_SENATE_RACES:
        raise RuntimeError(f"Senate validation failed: expected {EXPECTED_SENATE_RACES} unique races")
    distribution = senate_distribution([row["pDemocraticCaucus"] for row in races])
    distribution.update({"raceCount": EXPECTED_SENATE_RACES, "races": sorted(races, key=lambda row: row["contestId"])})
    return distribution


def main() -> None:
    retrieved_at = datetime.now(timezone.utc)
    house_raw, house_headers = fetch(HOUSE_URL)
    senate_raw, senate_headers = fetch(SENATE_URL)
    house = house_projection(parse_seats(house_raw))
    senate = senate_projection(parse_seats(senate_raw))
    candidate_races = sum(bool(row["candidates"]) for row in house["districts"]) + sum(bool(row["candidates"]) for row in senate["races"])
    candidate_records = sum(len(row["candidates"]) for row in house["districts"]) + sum(len(row["candidates"]) for row in senate["races"])
    edition = {
        "schemaVersion": "1.0.0",
        "editionId": retrieved_at.strftime("KAH-US-2026-%Y%m%dT%H%M%SZ"),
        "computedAtUtc": retrieved_at.isoformat().replace("+00:00", "Z"),
        "status": "FRESH_EXECUTION_LATEST_ACCESSIBLE_SOURCE_EDITIONS",
        "modelStatus": "UNVALIDATED_PROBABILITY_MODEL_RESEARCH_ONLY",
        "sourceFreshness": "Retrieval is current; publisher rating edition dates may precede retrieval time.",
        "probabilityInputs": "KAHRELUM fixed tier mapping; no market prices or competitor probabilities used.",
        "candidateRosterStatus": "SOURCE_LISTED_DISCOVERY_NOT_OFFICIAL_BALLOT_CERTIFICATION",
        "portraitStatus": "ZERO_PORTRAITS_ADMITTED_PENDING_IDENTITY_AND_REUSE_RIGHTS",
        "sources": {
            "house": {"url": HOUSE_URL, "retrievedAtUtc": retrieved_at.isoformat().replace("+00:00", "Z"), "publisherEdition": source_edition(house_raw), "sha256": sha256(house_raw), "bytes": len(house_raw), "httpDate": house_headers.get("date")},
            "senate": {"url": SENATE_URL, "retrievedAtUtc": retrieved_at.isoformat().replace("+00:00", "Z"), "publisherEdition": source_edition(senate_raw), "sha256": sha256(senate_raw), "bytes": len(senate_raw), "httpDate": senate_headers.get("date")},
        },
        "coverage": {"houseRaces": EXPECTED_HOUSE_RACES, "senateRaces": EXPECTED_SENATE_RACES, "totalRaces": EXPECTED_HOUSE_RACES + EXPECTED_SENATE_RACES, "racesWithSourceListedCandidates": candidate_races, "sourceListedCandidateRecords": candidate_records, "admittedPortraits": 0},
        "house": house,
        "senate": senate,
        "limitations": [
            "Publisher mirrors are not official state ballot certification.",
            "Tier-to-probability conversions and House sigma are inherited subjective assumptions, not prospectively calibrated parameters.",
            "Senate off-ballot caucus alignment and independent-candidate caucusing remain conditional assumptions.",
            "Candidate discovery fields can include primary entrants, duplicates, withdrawals or non-general-election records; names are not nominee certification.",
            "No candidate portrait is admitted without verified identity and reuse rights."
        ]
    }
    raw_dir = PRIVATE / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    stamp = retrieved_at.strftime("%Y%m%dT%H%M%SZ")
    (raw_dir / f"house-{stamp}.html").write_bytes(house_raw)
    (raw_dir / f"senate-{stamp}.html").write_bytes(senate_raw)
    PRIVATE.mkdir(parents=True, exist_ok=True)
    (PRIVATE / "latest-run.json").write_text(json.dumps(edition, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.write_text(json.dumps(edition, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "editionId": edition["editionId"],
        "computedAtUtc": edition["computedAtUtc"],
        "housePublisherEdition": edition["sources"]["house"]["publisherEdition"],
        "senatePublisherEdition": edition["sources"]["senate"]["publisherEdition"],
        "houseExpectedDemocraticSeats": house["expectedDemocraticSeats"],
        "houseDemocraticControlProbability": house["pDemocraticControl"],
        "senateExpectedDemocraticCaucusSeats": senate["expectedDemocraticCaucusSeats"],
        "senateDemocraticControlProbability": senate["pDemocraticCaucusControl"],
        "coverage": edition["coverage"],
        "sourceHashes": {key: value["sha256"] for key, value in edition["sources"].items()},
    }, indent=2))


if __name__ == "__main__":
    main()
