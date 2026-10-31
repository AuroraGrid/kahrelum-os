#!/usr/bin/env python3
"""Rebuild candidate portraits from a captured, pinned public-domain source catalog.

No live requests and no fuzzy name matching. Refresh the reviewed source catalog
before importing a newer congressional identity or image edition.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "research/candidate-portraits/congressional-sources-2026-10-31.json"
PARTIES = {"Democrat": "D", "Republican": "R", "Independent": "I", "Libertarian": "L"}


def normalize_name(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", folded)


def documented_names(person: dict) -> dict[str, dict]:
    """Exact source fields and explicit variants, never a nickname dictionary.

    Suffixes and middle names are optional only within a unique state/party match.
    Parenthesized given names are explicit alternatives in the source CSV. The
    crosswalk's Wikipedia title is an independently recorded name alias, not a
    generated search result or a face-based inference.
    """
    variants = []
    first = person.get("first_name", "")
    given_names = [first]
    parenthetical = re.fullmatch(r"(.+?)\s*\(([^)]+)\)", first)
    if parenthetical:
        given_names = [part.strip() for part in parenthetical.groups()]
    if person.get("nickname"):
        given_names.append(person["nickname"])
    variants.append((person.get("full_name", ""), "full_name"))
    for given in given_names:
        for middle in ("", person.get("middle_name", "")):
            for suffix in ("", person.get("suffix", "")):
                variants.append((" ".join(filter(None, [given, middle, person["last_name"], suffix])), "documented_name_fields"))
    wikipedia_title = re.sub(r"\s*\([^)]*\)$", "", person.get("wikipedia_id", ""))
    variants.append((wikipedia_title, "documented_wikipedia_alias"))
    result = {}
    for name, field in variants:
        if not name:
            continue
        for variant in (name, re.sub(r",?\s+(?:Jr\.?|Sr\.?|II|III|IV)$", "", name, flags=re.I)):
            result.setdefault(normalize_name(variant), {"name": variant, "sourceField": field})
    return result


def candidate_rows(current: dict) -> list[dict]:
    rows = []
    for chamber, contests in (("House", current["house"]["districts"]), ("Senate", current["senate"]["races"])):
        for contest in contests:
            for candidate in contest.get("candidates", []):
                rows.append({**candidate, "state": contest["state"], "chamber": chamber, "contestId": contest["contestId"]})
    return rows


def identity_matches(candidate: dict, people: list[dict]) -> list[tuple[dict, dict]]:
    matches = []
    for person in people:
        if person["state"] != candidate["state"] or PARTIES.get(person["party"], person["party"]) != candidate["party"]:
            continue
        alias = documented_names(person).get(normalize_name(candidate["name"]))
        if alias:
            matches.append((person, alias))
    return matches


def build_ledger(current: dict, catalog: dict, reviewed_at: str) -> dict:
    if catalog.get("schema") != "KAHRELUM_CONGRESSIONAL_PORTRAIT_SOURCES_v1.0":
        raise ValueError("Unknown portrait source catalog schema")
    photo_source = catalog["photoSource"]
    if photo_source.get("license") != "Public domain" or not photo_source.get("licenseUrl") or not photo_source.get("licenseStatement"):
        raise ValueError("A captured public-domain declaration is required")
    for source in (photo_source, catalog["identitySource"]):
        if not re.fullmatch(r"[a-f0-9]{40}", source["commit"]):
            raise ValueError("Source editions must be pinned commits")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", reviewed_at):
        raise ValueError("Review timestamp must be UTC")
    images = {image["bioguideId"]: image for image in catalog["images"]}
    if len(images) != len(catalog["images"]):
        raise ValueError("Duplicate Bioguide image identities")
    people = catalog["people"]
    if len({person["bioguide_id"] for person in people}) != len(people):
        raise ValueError("Duplicate Bioguide identity records")
    candidates = candidate_rows(current)
    ids = [str(candidate["sourceCandidateId"]) for candidate in candidates]
    if len(set(ids)) != len(ids):
        raise ValueError("Repeated candidate IDs require an explicit contest-specific review")
    records, unresolved = [], []
    identity_count = 0
    image_base = f"https://raw.githubusercontent.com/{photo_source['repository']}/{photo_source['commit']}"
    source_base = f"https://github.com/{photo_source['repository']}/blob/{photo_source['commit']}"
    for candidate in candidates:
        binding = {"sourceCandidateId": candidate["sourceCandidateId"], "candidateName": candidate["name"], "state": candidate["state"], "party": candidate["party"], "contestId": candidate["contestId"], "chamber": candidate["chamber"]}
        matches = identity_matches(candidate, people)
        if len(matches) != 1:
            unresolved.append({**binding, "reason": "AMBIGUOUS_IDENTITY" if matches else "IDENTITY_NOT_VERIFIED"})
            continue
        person, alias = matches[0]
        identity_count += 1
        bioguide_id = person["bioguide_id"]
        image = images.get(bioguide_id)
        if image is None:
            unresolved.append({**binding, "bioguideId": bioguide_id, "reason": "NO_REVIEWED_IMAGE"})
            continue
        if image["path"] != f"congress/225x275/{bioguide_id}.jpg" or not re.fullmatch(r"[a-f0-9]{40}", image["blobSha"]):
            raise ValueError(f"Invalid image identity or blob: {bioguide_id}")
        records.append({
            **binding,
            "status": "ADMITTED",
            "bioguideId": bioguide_id,
            "matchedName": alias["name"],
            "matchMethod": "EXACT_DOCUMENTED_NAME_STATE_PARTY",
            "matchedSourceField": alias["sourceField"],
            "identitySourceUrl": catalog["identitySource"]["url"],
            "identityRole": {"chamber": "House" if person["type"] == "rep" else "Senate", "state": person["state"], "party": person["party"], "district": person["district"]},
            "url": f"{image_base}/{image['path']}",
            "width": image["width"], "height": image["height"],
            "imageBlobSha": image["blobSha"],
            "sourceUrl": f"{source_base}/{image.get('metadataPath', image['path'])}",
            "originalSourceUrl": image.get("originalSourceUrl") or f"{source_base}/{image.get('originalPath', image['path'])}",
            "originalSourceName": image.get("originalSourceName", "Congressional portrait archive"),
            "license": photo_source["license"],
            "licenseUrl": photo_source["licenseUrl"],
            "rightsBasis": "Public-domain declaration of the pinned congressional image corpus",
            "attribution": "U.S. Congress / unitedstates/images",
            "reviewedAtUtc": reviewed_at,
        })
    coverage = {
        "sourceListedCandidateRecords": len(candidates),
        "uniqueCandidateIds": len(set(ids)),
        "identityMatchedCandidates": identity_count,
        "admittedPortraits": len(records),
        "uniquePeopleWithPortraits": len({record["bioguideId"] for record in records}),
        "candidateCardsWithPortraits": len(records),
        "candidateCardsWithoutPortraits": len(unresolved),
        "unresolvedReasons": dict(sorted(Counter(row["reason"] for row in unresolved).items())),
    }
    return {
        "schema": "KAHRELUM_CANDIDATE_PORTRAITS_v1.0",
        "status": "PARTIAL_VERIFIED_COVERAGE" if unresolved else "VERIFIED_COVERAGE",
        "updatedAtUtc": reviewed_at,
        "admissionRule": "One exact documented name or explicit source alias, the same state and party, a unique Bioguide identity, an existing pinned image blob, and an explicit corpus public-domain declaration. No fuzzy name or facial matching. Photo identity does not certify nomination or ballot eligibility.",
        "sourceCatalog": "research/candidate-portraits/congressional-sources-2026-10-31.json",
        "sources": {"identity": catalog["identitySource"], "photos": {key: value for key, value in photo_source.items() if key != "licenseStatement"}},
        "coverage": coverage,
        "records": records,
        "unresolved": unresolved,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--current", type=Path, default=ROOT / "election/current-projections.json")
    parser.add_argument("--output", type=Path, default=ROOT / "election/candidate-portraits.json")
    parser.add_argument("--reviewed-at", help="UTC review timestamp; defaults to the captured catalog timestamp")
    parser.add_argument("--check", action="store_true", help="Verify the checked-in ledger is reproducible without writing")
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text())
    ledger = build_ledger(json.loads(args.current.read_text()), catalog, args.reviewed_at or catalog["retrievedAtUtc"])
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    rendered = json.dumps(ledger, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            raise SystemExit("Candidate portrait ledger is stale; rebuild it from the reviewed catalog")
    else:
        args.output.write_text(rendered)
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
