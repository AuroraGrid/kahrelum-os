#!/usr/bin/env python3
"""Rebuild candidate portraits from captured, identity-bound source catalogs.

No live requests and no fuzzy name matching. Refresh the reviewed source catalog
before importing a newer congressional identity or image edition.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "research/candidate-portraits/congressional-sources-2026-10-31.json"
DEFAULT_SUPPLEMENT = ROOT / "research/candidate-portraits/supplemental-sources-2026-10-31.json"
DEFAULT_NONCONGRESS = ROOT / "research/candidate-portraits/noncongress-sources-2026-10-31.json"
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


def plain_text(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]*>", " ", value)).split())


def reviewed_noncongress(current: dict, catalog: dict, admitted: list[dict]) -> list[dict]:
    """Admit exact FEC identities and reviewed Commons reuse licenses.

    FEC registration identifies a person and filing; it is not ballot or nominee
    certification. This adapter never invents congressional identifiers and
    cannot override any existing portrait. Every field is bound to captured
    first-party identity evidence and a specific Commons image revision.
    """
    if catalog.get("schema") != "KAHRELUM_NONCONGRESS_CANDIDATE_PORTRAIT_SOURCES_v1.0":
        raise ValueError("Unknown non-Congress portrait source schema")
    evidence = {}
    for key, capture in catalog["evidenceFiles"].items():
        path = capture["path"]
        if not path.startswith("research/candidate-portraits/noncongress/") or ".." in Path(path).parts:
            raise ValueError("Unexpected non-Congress evidence path")
        raw = (ROOT / path).read_bytes()
        if hashlib.sha256(raw).hexdigest() != capture["sha256"]:
            raise ValueError("Non-Congress evidence digest does not match")
        evidence[key] = json.loads(raw)
    identities = evidence["identities"]["records"]
    identity_by_id = {row["fecCandidateId"]: row for row in identities}
    if len(identity_by_id) != len(identities):
        raise ValueError("Duplicate FEC identity evidence")
    pages = {}
    for key in catalog["commonsEvidenceKeys"]:
        data = evidence[key]
        data = data.get("result", data.get("response", data))
        for page in data["query"]["pages"].values():
            pages[page["title"]] = page
    candidates = {str(row["sourceCandidateId"]): row for row in candidate_rows(current)}
    occupied = {str(row["sourceCandidateId"]) for row in admitted}
    seen, seen_fec, records = set(), set(), []
    party_codes = {"DEMOCRATIC PARTY": "D", "DEMOCRATIC-FARMER-LABOR": "D", "REPUBLICAN PARTY": "R", "INDEPENDENT": "I", "LIBERTARIAN PARTY": "L"}
    binding_fields = ("sourceCandidateId", "candidateName", "state", "party", "chamber", "contestId")
    for photo in catalog["records"]:
        source_id, fec_id = str(photo["sourceCandidateId"]), photo["identityId"]
        if source_id in occupied or source_id in seen or fec_id in seen_fec:
            raise ValueError("Non-Congress portraits cannot replace or duplicate an admitted identity")
        seen.add(source_id); seen_fec.add(fec_id)
        candidate = candidates.get(source_id)
        binding = ({key: candidate["name"] if key == "candidateName" else candidate[key] for key in binding_fields}
                   if candidate else {})
        if any(photo.get(key) != binding.get(key) for key in binding_fields):
            raise ValueError("Non-Congress candidate binding differs from the current roster")
        identity = identity_by_id.get(fec_id)
        expected_prefix = "H" if photo["chamber"] == "House" else "S"
        expected_identity_url = f"https://www.fec.gov/data/candidate/{fec_id}/?cycle=2026"
        if (photo.get("identityType") != "FEC_CANDIDATE" or photo.get("bioguideId")
                or not re.fullmatch(expected_prefix + r"\d" + photo["state"] + r"\d{5}", fec_id)
                or identity is None or any(identity["candidateBinding"].get(key) != binding[key] for key in binding_fields)
                or identity.get("identitySourceUrl") != expected_identity_url
                or photo.get("identitySourceUrl") != expected_identity_url
                or identity.get("httpStatus") != 200 or identity.get("cycle") != 2026
                or identity.get("state") != photo["state"] or identity.get("chamber") != photo["chamber"]
                or party_codes.get(identity.get("sourceParty")) != photo["party"]):
            raise ValueError("First-party FEC identity does not match the candidate binding")
        source_text = identity.get("sourceExcerpt", "")
        source_normalized = normalize_name(source_text)
        if (not re.fullmatch(r"[a-f0-9]{64}", identity.get("captureSha256", ""))
                or hashlib.sha256(source_text.encode()).hexdigest() != identity.get("sourceExcerptSha256")
                or not all(normalize_name(identity[key]) in source_normalized for key in ("fecName", "stateName", "sourceParty", "fecCandidateId"))
                or normalize_name("Candidate for " + photo["chamber"]) not in source_normalized):
            raise ValueError("Captured FEC identity evidence is incomplete")
        if photo["chamber"] == "House":
            district = str(identity.get("district", ""))
            if (not district.isdigit() or photo["contestId"] != f"{photo['state']}-{int(district) if int(district) else 'AL'}"
                    or identity.get("sourceSeat") != f"{identity['stateName']} House District {int(district)}"
                    or normalize_name(identity["sourceSeat"]) not in source_normalized):
                raise ValueError("First-party House district does not match the contest binding")
        family, separator, given = identity["fecName"].partition(",")
        candidate_words = photo["candidateName"].split()
        exact_name = (separator and given.split() and normalize_name(candidate_words[0]) == normalize_name(given.split()[0])
                      and normalize_name(" ".join(candidate_words[1:])) == normalize_name(family))
        documented_alias = (identity.get("aliasEvidence") and normalize_name(photo["candidateName"]) in normalize_name(identity.get("principalCommitteeName", ""))
                            and normalize_name(identity.get("principalCommitteeName", "")) in source_normalized)
        office_alias = identity.get("officialAliasEvidence", {})
        alias_excerpt = office_alias.get("sourceExcerpt", "")
        if office_alias and separator and given.split():
            documented_alias = documented_alias or (identity.get("aliasEvidence")
                and urlsplit(office_alias.get("sourceUrl", "")).scheme == "https"
                and (urlsplit(office_alias["sourceUrl"]).hostname or "").endswith(".gov")
                and hashlib.sha256(alias_excerpt.encode()).hexdigest() == office_alias.get("sourceExcerptSha256")
                and re.fullmatch(r"[a-f0-9]{64}", office_alias.get("captureSha256", ""))
                and normalize_name(photo["candidateName"]) in normalize_name(alias_excerpt)
                and normalize_name(given.split()[0]) in normalize_name(alias_excerpt)
                and normalize_name(family) in normalize_name(alias_excerpt))
        if not exact_name and not documented_alias:
            raise ValueError("Candidate name or explicit primary-source alias is not documented")
        page = pages.get(photo["commonsTitle"])
        if not page or not page.get("imageinfo") or not page.get("revisions"):
            raise ValueError("Missing captured Commons image evidence")
        info = page["imageinfo"][0]
        metadata = info["extmetadata"]
        subject = plain_text(page["title"] + " " + metadata.get("ImageDescription", {}).get("value", "")).replace("_", " ")
        subject_words = set(re.findall(r"[a-z0-9]+", unicodedata.normalize("NFKD", subject).encode("ascii", "ignore").decode().lower()))
        name_words = set(re.findall(r"[a-z0-9]+", unicodedata.normalize("NFKD", photo["candidateName"]).encode("ascii", "ignore").decode().lower()))
        if not name_words.issubset(subject_words):
            raise ValueError("Commons caption does not identify the exact candidate name")
        license_name = metadata.get("LicenseShortName", {}).get("value", "")
        revision = page["revisions"][0]["revid"]
        source_url = f"https://commons.wikimedia.org/w/index.php?oldid={revision}"
        if license_name == "Public domain":
            if metadata.get("Copyrighted", {}).get("value") != "False":
                raise ValueError("Missing explicit Commons public-domain declaration")
            license_url = source_url + "#Licensing"
        elif license_name == "CC0" or re.fullmatch(r"CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0)", license_name):
            license_url = metadata.get("LicenseUrl", {}).get("value", "").replace("http://creativecommons.org/", "https://creativecommons.org/")
            license_pattern = (r"https://creativecommons\.org/publicdomain/zero/1\.0(?:/deed\.[a-z]+)?/?" if license_name == "CC0" else
                               r"https://creativecommons\.org/licenses/" + ("by-sa" if "BY-SA" in license_name else "by") + "/" + re.escape(license_name.rsplit(" ", 1)[1]) + r"(?:/deed\.[a-z]+)?/?")
            if not re.fullmatch(license_pattern, license_url):
                raise ValueError("Commons reuse license URL is missing or inconsistent")
        else:
            raise ValueError("Missing an admitted public-domain or Creative Commons reuse license")
        author = plain_text(metadata.get("Attribution", metadata.get("Artist", {})).get("value", ""))
        image_url = info.get("thumburl") or info["url"]
        if (not author or photo.get("license") != license_name or photo.get("licenseUrl") != license_url
                or photo.get("attribution") != author or photo.get("sourceUrl") != source_url
                or photo.get("commonsRevisionId") != revision or photo.get("sourceOriginalImageSha1") != info["sha1"]
                or photo.get("sourceOriginalImageUrl") != info["url"]
                or not re.fullmatch(r"[a-f0-9]{40}", info["sha1"])
                or photo.get("url") != image_url or photo.get("sourceThumbnailUrl") != image_url
                or urlsplit(image_url).scheme != "https" or urlsplit(image_url).hostname not in {"upload.wikimedia.org", "thumb.wikimedia.org"}):
            raise ValueError("Image revision, path, rights or attribution differs from captured Commons evidence")
        if (photo.get("imageCheck", {}).get("httpStatus") != 200
                or not photo["imageCheck"].get("contentType", "").startswith("image/")
                or not re.fullmatch(r"[a-f0-9]{64}", photo.get("imageSha256", ""))
                or photo.get("width", 0) <= 0 or photo.get("height", 0) <= 0
                or not photo.get("reviewedAtUtc") or not photo.get("rightsBasis")):
            raise ValueError("Verified image retrieval and rights review are required")
        records.append({**photo, "status": "ADMITTED", "identitySourceSha256": identity["captureSha256"],
                        "identitySourceParty": identity["sourceParty"], "matchMethod": "EXACT_REVIEWED_FEC_AND_SOURCE_CANDIDATE_BINDING"})
    return records


def build_ledger(current: dict, catalog: dict, reviewed_at: str, supplement: dict | None = None, noncongress: dict | None = None) -> dict:
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
    if noncongress:
        additions = reviewed_noncongress(current, noncongress, records)
        added_ids = {row["sourceCandidateId"] for row in additions}
        identity_count += sum(row["sourceCandidateId"] in added_ids and row["reason"] != "NO_REVIEWED_IMAGE" for row in unresolved)
        records.extend(additions)
        unresolved = [row for row in unresolved if row["sourceCandidateId"] not in added_ids]
    coverage = {
        "sourceListedCandidateRecords": len(candidates),
        "uniqueCandidateIds": len(set(ids)),
        "identityMatchedCandidates": identity_count,
        "admittedPortraits": len(records),
        "uniquePeopleWithPortraits": len({record.get("bioguideId") or "FEC:" + record["identityId"] for record in records}),
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
    if noncongress:
        result["admissionRule"] += " Non-Congress candidates use an explicit FEC_CANDIDATE identity, exact source-candidate/contest binding and captured first-party name/state/party evidence; Commons public-domain, CC0, CC BY or CC BY-SA images require their exact revision, source hash, creator attribution and license. Existing 397 congressional portraits are preserved. FEC registration does not certify ballot eligibility."
        result["noncongressSourceCatalog"] = "research/candidate-portraits/noncongress-sources-2026-10-31.json"
        result["sources"]["noncongress"] = {"identityProvider": "Federal Election Commission", "photoProvider": "Wikimedia Commons", "capturedAtUtc": noncongress["reviewedAtUtc"], "evidenceFiles": noncongress["evidenceFiles"]}
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--supplement", type=Path, default=DEFAULT_SUPPLEMENT)
    parser.add_argument("--noncongress", type=Path, default=DEFAULT_NONCONGRESS)
    parser.add_argument("--current", type=Path, default=ROOT / "election/current-projections.json")
    parser.add_argument("--output", type=Path, default=ROOT / "election/candidate-portraits.json")
    parser.add_argument("--reviewed-at", help="UTC review timestamp; defaults to the captured catalog timestamp")
    parser.add_argument("--check", action="store_true", help="Verify the checked-in ledger is reproducible without writing")
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text())
    supplement = json.loads(args.supplement.read_text())
    noncongress = json.loads(args.noncongress.read_text()) if args.noncongress.exists() else None
    reviewed_at = args.reviewed_at or max(catalog["retrievedAtUtc"], supplement["retrievedAtUtc"], supplement.get("updatedAtUtc", supplement["retrievedAtUtc"]))
    if noncongress and not args.reviewed_at:
        reviewed_at = max(reviewed_at, noncongress["reviewedAtUtc"])
    ledger = build_ledger(json.loads(args.current.read_text()), catalog, reviewed_at, supplement, noncongress)
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    ledger["supplementalSourceCatalogSha256"] = hashlib.sha256(args.supplement.read_bytes()).hexdigest()
    if noncongress:
        ledger["noncongressSourceCatalogSha256"] = hashlib.sha256(args.noncongress.read_bytes()).hexdigest()
    rendered = json.dumps(ledger, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            raise SystemExit("Candidate portrait ledger is stale; rebuild it from the reviewed catalog")
    else:
        args.output.write_text(rendered)
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
