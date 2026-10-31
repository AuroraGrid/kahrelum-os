#!/usr/bin/env python3
"""Rebuild candidate portraits from captured public-domain source catalogs.

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
DEFAULT_SUPPLEMENT = ROOT / "research/candidate-portraits/supplemental-sources-2026-10-31.json"
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


def reviewed_supplement(supplement: dict, catalog: dict) -> tuple[list[dict], list[dict], dict]:
    """Validate captured additions without replacing any previously admitted photo.

    Former members use the same pinned congressional identity corpus. Local
    photographs require the captured Commons revision, an explicit federal
    public-domain declaration, official source, and exact downloaded bytes.
    """
    if supplement.get("schema") != "KAHRELUM_SUPPLEMENTAL_CANDIDATE_PORTRAIT_SOURCES_v1.0":
        raise ValueError("Unknown supplemental portrait catalog schema")
    for source in supplement["identitySources"].values():
        expected = f"https://raw.githubusercontent.com/{source['repository']}/{source['commit']}/{source['path']}"
        if (source["repository"] != catalog["identitySource"]["repository"]
                or source["commit"] != catalog["identitySource"]["commit"]
                or source["path"] != "legislators-historical.csv" or source["url"] != expected):
            raise ValueError("Supplemental identities must use the pinned historical congressional source")
    people = supplement["people"]
    for person in people:
        if person.get("identitySourceKey") not in supplement["identitySources"]:
            raise ValueError("Missing supplemental identity source")
        if person.get("reviewedAtUtc") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", person["reviewedAtUtc"]):
            raise ValueError("Supplemental identity review timestamp must be UTC")
    metadata_path = supplement["commonsMetadataFile"]
    if metadata_path != "research/candidate-portraits/commons-metadata-2026-10-31.json":
        raise ValueError("Unexpected Commons evidence path")
    raw_metadata = (ROOT / metadata_path).read_bytes()
    if hashlib.sha256(raw_metadata).hexdigest() != supplement["commonsMetadataSha256"]:
        raise ValueError("Commons evidence digest does not match")
    captured = json.loads(raw_metadata)
    pages = {page["title"]: page for page in captured["response"]["query"]["pages"].values()}
    commons_images = {}
    for photo in supplement["commonsImages"]:
        bioguide_id = photo["bioguideId"]
        digest = photo["imageSha256"]
        expected_path = f"assets/candidate-portraits/{bioguide_id}-{digest[:16]}.jpg"
        if (not re.fullmatch(r"[A-Z]\d{6}", bioguide_id)
                or not re.fullmatch(r"[a-f0-9]{64}", digest)
                or photo["path"] != expected_path):
            raise ValueError("Invalid local portrait path or digest")
        image_bytes = (ROOT / photo["path"]).read_bytes()
        if (hashlib.sha256(image_bytes).hexdigest() != digest
                or len(image_bytes) != photo["bytes"] or not image_bytes.startswith(b"\xff\xd8\xff")):
            raise ValueError("Local portrait bytes do not match the reviewed image")
        if not (0 < photo["width"] <= 1024 and 0 < photo["height"] <= 2048):
            raise ValueError("Invalid local portrait dimensions")
        page = pages.get(photo["commonsTitle"])
        if page is None:
            raise ValueError("Local photo has no captured Commons evidence")
        info = page["imageinfo"][0]
        rights = info["extmetadata"]
        if (photo["license"] != "Public domain" or photo.get("copyrighted") is not False
                or rights["LicenseShortName"]["value"] != "Public domain"
                or rights["Copyrighted"]["value"] != "False"
                or not set(photo["licenseCategories"]).intersection({"PD US Congress", "PD US Government"})
                or not set(photo["licenseCategories"]).issubset(set(rights["Categories"]["value"].split("|")))):
            raise ValueError("Missing per-image federal public-domain declaration")
        revision_url = f"https://commons.wikimedia.org/w/index.php?oldid={page['revisions'][0]['revid']}"
        if (photo["commonsRevisionId"] != page["revisions"][0]["revid"]
                or photo["sourceRevisionUrl"] != revision_url
                or photo["licenseUrl"] != revision_url + "#Licensing"
                or photo["sourceOriginalImageSha1"] != info["sha1"]
                or photo["sourceThumbnailUrl"] != info["thumburl"]
                or photo["sourceUrl"] != info["descriptionurl"]):
            raise ValueError("Local portrait provenance differs from captured evidence")
        if (not re.match(r"https://(?:[\w-]+\.)*(?:house|senate|congress)\.gov/", photo["originalSourceUrl"])
                or photo["originalSourceUrl"] not in rights["Credit"]["value"]
                or not photo["attribution"]):
            raise ValueError("Official image origin and attribution are required")
        if bioguide_id in commons_images:
            raise ValueError("Duplicate supplemental portrait identities")
        commons_images[bioguide_id] = photo
    return people, supplement["archiveImages"], commons_images


def build_ledger(current: dict, catalog: dict, reviewed_at: str, supplement: dict | None = None) -> dict:
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
    additional_people, additional_images, commons_images = reviewed_supplement(supplement, catalog) if supplement else ([], [], {})
    all_images = catalog["images"] + additional_images
    images = {image["bioguideId"]: image for image in all_images}
    if len(images) != len(all_images) or images.keys() & commons_images.keys():
        raise ValueError("Duplicate Bioguide image identities")
    people = catalog["people"] + additional_people
    if len({person["bioguide_id"] for person in people}) != len(people):
        raise ValueError("Duplicate Bioguide identity records")
    people_by_id = {person["bioguide_id"]: person for person in people}
    for bioguide_id, photo in commons_images.items():
        person = people_by_id.get(bioguide_id)
        if person is None or normalize_name(photo["bioguideName"]) not in documented_names(person):
            raise ValueError("Supplemental image identity is not documented in the pinned crosswalk")
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
        local_image = commons_images.get(bioguide_id)
        identity_source = (supplement["identitySources"][person["identitySourceKey"]]
                           if person.get("identitySourceKey") else catalog["identitySource"])
        if local_image:
            records.append({
                **binding,
                "status": "ADMITTED", "bioguideId": bioguide_id,
                "matchedName": alias["name"], "matchMethod": "EXACT_DOCUMENTED_NAME_STATE_PARTY",
                "matchedSourceField": alias["sourceField"], "identitySourceUrl": identity_source["url"],
                "identityRole": {"chamber": "House" if person["type"] == "rep" else "Senate", "state": person["state"], "party": person["party"], "district": person["district"]},
                "url": "/" + local_image["path"], "width": local_image["width"], "height": local_image["height"],
                "imageSha256": local_image["imageSha256"], "imageBytes": local_image["bytes"],
                "sourceUrl": local_image["sourceRevisionUrl"],
                "originalSourceUrl": local_image["originalSourceUrl"], "originalSourceName": local_image["originalSourceName"],
                "sourceOriginalImageSha1": local_image["sourceOriginalImageSha1"],
                "commonsRevisionId": local_image["commonsRevisionId"], "sourceImageUploadedAt": local_image["sourceImageUploadedAt"],
                "license": local_image["license"], "licenseUrl": local_image["licenseUrl"],
                "rightsBasis": local_image["rightsBasis"], "attribution": local_image["attribution"],
                "reviewedAtUtc": supplement["retrievedAtUtc"],
            })
            continue
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
            "identitySourceUrl": identity_source["url"],
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
            "reviewedAtUtc": (person.get("reviewedAtUtc", supplement["retrievedAtUtc"]) if person.get("identitySourceKey") else catalog["retrievedAtUtc"]) if supplement else reviewed_at,
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
    result = {
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
    if supplement:
        result["admissionRule"] += " Reviewed supplements may add exact identities from the same pinned historical CSV and official public-domain images captured from Wikimedia Commons; local image bytes and source revisions are verified before admission. Existing photos are never replaced by a supplement."
        result["supplementalSourceCatalog"] = "research/candidate-portraits/supplemental-sources-2026-10-31.json"
        result["sources"]["additionalIdentities"] = supplement["identitySources"]
        result["sources"]["additionalPhotos"] = {"provider": "Wikimedia Commons", "metadataFile": supplement["commonsMetadataFile"], "metadataSha256": supplement["commonsMetadataSha256"], "capturedAtUtc": supplement["retrievedAtUtc"], "localImages": len(commons_images)}
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--supplement", type=Path, default=DEFAULT_SUPPLEMENT)
    parser.add_argument("--current", type=Path, default=ROOT / "election/current-projections.json")
    parser.add_argument("--output", type=Path, default=ROOT / "election/candidate-portraits.json")
    parser.add_argument("--reviewed-at", help="UTC review timestamp; defaults to the captured catalog timestamp")
    parser.add_argument("--check", action="store_true", help="Verify the checked-in ledger is reproducible without writing")
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text())
    supplement = json.loads(args.supplement.read_text())
    reviewed_at = args.reviewed_at or max(catalog["retrievedAtUtc"], supplement["retrievedAtUtc"], supplement.get("updatedAtUtc", supplement["retrievedAtUtc"]))
    ledger = build_ledger(json.loads(args.current.read_text()), catalog, reviewed_at, supplement)
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    ledger["supplementalSourceCatalogSha256"] = hashlib.sha256(args.supplement.read_bytes()).hexdigest()
    rendered = json.dumps(ledger, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            raise SystemExit("Candidate portrait ledger is stale; rebuild it from the reviewed catalog")
    else:
        args.output.write_text(rendered)
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
