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


def checked_capture(meta: dict) -> str:
    """Read an immutable review capture; never follow a catalog path outside it."""
    path = meta.get("path", "")
    if not path.startswith("research/candidate-portraits/review-2026-11-02/") or ".." in Path(path).parts:
        raise ValueError("Invalid review capture path")
    raw = (ROOT / path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != meta.get("sha256"):
        raise ValueError("Review capture digest mismatch")
    return raw.decode("utf-8")


def primary_identity(photo: dict) -> dict:
    """Bind every November 2 addition to captured first-party FEC evidence.

    A page-text capture is labeled as such, not represented as an HTTP archive.
    Registration supplies identity/office evidence, never ballot certification.
    """
    path = ROOT / "research/candidate-portraits/primary-identities-2026-11-02.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    if catalog.get("schema") != "KAHRELUM_PRIMARY_PORTRAIT_IDENTITIES_v1.0":
        raise ValueError("Unknown primary identity catalog")
    matches = [r for r in catalog["records"] if r["sourceCandidateId"] == photo["sourceCandidateId"]]
    if len(matches) != 1:
        raise ValueError("Missing or ambiguous first-party FEC identity")
    identity = matches[0]
    for key in ("sourceCandidateId", "candidateName", "state", "party", "chamber", "contestId"):
        if identity.get(key) != photo.get(key):
            raise ValueError("First-party candidate binding mismatch")
    fec = identity["fecCandidateId"]
    prefix = "H" if photo["chamber"] == "House" else "S" if photo["chamber"] == "Senate" else ""
    if (not prefix or not re.fullmatch(prefix + r"\d" + photo["state"] + r"\d{5}", fec)
            or identity.get("cycle") != 2026
            or identity["sourceUrl"] != f"https://www.fec.gov/data/candidate/{fec}/?cycle=2026"
            or identity["sourceParty"] != {"D": "DEMOCRATIC PARTY", "R": "REPUBLICAN PARTY"}.get(photo["party"])):
        raise ValueError("First-party FEC office, state or party mismatch")
    text = normalize_name(checked_capture(identity["capture"]))
    for term in (identity["fecName"], identity["sourceParty"], identity["stateName"], fec,
                 "Candidate for " + photo["chamber"], identity["sourceSeat"], "2026"):
        if normalize_name(term) not in text:
            raise ValueError("FEC capture does not substantiate the identity")
    expected_seat = identity["stateName"] + " " + photo["chamber"]
    if photo["chamber"] == "House":
        district = photo["contestId"].split("-")[-1]
        expected_seat += " District " + str(0 if district == "AL" else int(district))
    elif photo["contestId"] not in (photo["state"], photo["state"] + "-special"):
        raise ValueError("FEC Senate contest mismatch")
    if identity["sourceSeat"] != expected_seat:
        raise ValueError("FEC House district mismatch")
    family, separator, given = identity["fecName"].partition(",")
    words = photo["candidateName"].split()
    exact = separator and normalize_name(words[0]) == normalize_name(given.split()[0]) and normalize_name(" ".join(words[1:])) == normalize_name(family)
    alias = identity.get("documentedAliasCommittee", "")
    if not exact and not (alias and normalize_name(alias) in text and normalize_name(photo["candidateName"]) in normalize_name(alias)):
        raise ValueError("Undocumented first-party name alias")
    legal_name = given.split()[0].title() + " " + family.title()
    if photo.get("photoSubjectName") and normalize_name(photo["photoSubjectName"]) != normalize_name(legal_name):
        raise ValueError("Photo subject is not the documented legal identity")
    return {"fecCandidateId": fec, "identitySourceUrl": identity["sourceUrl"],
            "identitySourceSha256": identity["capture"]["sha256"],
            "identityEvidenceRepresentation": identity["captureRepresentation"],
            "identityVerifiedAtUtc": catalog["reviewedAtUtc"]}


def reviewed_local(current: dict, catalog: dict, admitted: list[dict]) -> list[dict]:
    """Admit source-page-verified, unchanged local Commons thumbnails.

    Separate from the API-based October 31 evidence class. Hashes bind the
    captured page and downloaded thumbnail; no upstream original SHA is claimed.
    """
    if catalog.get("schema") != "KAHRELUM_FEC_LOCAL_COMMONS_v1.0":
        raise ValueError("Unknown local Commons catalog")
    candidates = {r["sourceCandidateId"]: r for r in candidate_rows(current)}
    occupied = {r["sourceCandidateId"] for r in admitted}
    out, seen, fec_ids = [], set(), {r.get("fecCandidateId", r.get("identityId")) for r in admitted}
    for photo in catalog["records"]:
        sid = photo["sourceCandidateId"]
        if sid in occupied or sid in seen:
            raise ValueError("Local supplement cannot replace or duplicate a portrait")
        seen.add(sid)
        row = candidates.get(sid, {})
        for key in ("sourceCandidateId", "state", "party", "chamber", "contestId", "candidateName"):
            if photo.get(key) != row.get("name" if key == "candidateName" else key):
                raise ValueError("Local portrait roster binding mismatch")
        identity = primary_identity(photo)
        if photo.get("identityType") != "FEC_LOCAL_COMMONS" or photo.get("identityId") != identity["fecCandidateId"] or photo["identityId"] in fec_ids or photo.get("bioguideId"):
            raise ValueError("Local portrait FEC identity mismatch or duplicate")
        fec_ids.add(photo["identityId"])
        capture = checked_capture(photo["sourceCapture"])
        title = photo["commonsTitle"]
        revision = photo["commonsRevisionId"]
        if (not isinstance(revision, int) or revision <= 0 or f"oldid={revision}" not in capture
                or photo["sourceUrl"] != f"https://commons.wikimedia.org/w/index.php?oldid={revision}"
                or photo["sourcePageUrl"] != "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_")
                or title not in capture or photo["sourceThumbnailUrl"] not in capture
                or urlsplit(photo["sourceThumbnailUrl"]).hostname not in {"thumb.wikimedia.org", "upload.wikimedia.org"}):
            raise ValueError("Local photo page revision or source URL mismatch")
        summary = capture.split("Licensing", 1)[-1] if "## Summary" not in capture else capture.split("## Summary", 1)[1]
        subject = photo.get("photoSubjectName", photo["candidateName"])
        if normalize_name(subject) not in normalize_name(title + " " + summary):
            raise ValueError("Source page does not identify the exact photographic subject")
        # Inspect the per-image Licensing section, never the website footer's license.
        parts = re.split(r"(?m)^#{1,3} Licensing\s*$", capture)
        if len(parts) != 2:
            raise ValueError("Missing per-image licensing section")
        licensing = re.split(r"(?m)^#{1,3} File history", parts[1])[0]
        licensing = licensing.replace("(//creativecommons.org/", "(https://creativecommons.org/")
        license_name, license_url = photo["license"], photo["licenseUrl"]
        if license_name == "Copyrighted free use":
            if (photo["state"] != "IA" or photo.get("permissionTicket") != "2010030210041811"
                    or "2010030210041811" not in licensing or "Copyrighted free use" not in licensing
                    or "www.legis.iowa.gov" not in summary or photo["attribution"] != "Iowa General Assembly"
                    or "Iowa General Assembly" not in summary
                    or "may be accessed and used by the general public without authorization of any kind" not in licensing
                    or license_url != photo["sourceUrl"] + "#Licensing"):
                raise ValueError("Iowa portrait permission is missing or outside its scope")
        else:
            match = re.fullmatch(r"CC BY(-SA)? (2\.0|4\.0)", license_name)
            expected = f"https://creativecommons.org/licenses/{'by-sa' if match and match[1] else 'by'}/{match[2]}/deed.en" if match else None
            if not expected or license_url != expected or license_url not in licensing:
                raise ValueError("Source page lacks the specified reuse license")
        if not photo.get("attribution") or photo["attribution"] not in summary or not photo.get("rightsBasis"):
            raise ValueError("Source creator attribution is missing")
        digest = photo["imageSha256"]
        expected_path = f"assets/candidate-portraits/{sid}-{digest[:16]}.jpg"
        if not re.fullmatch(r"[a-f0-9]{64}", digest) or photo["url"] != "/" + expected_path:
            raise ValueError("Local image path is not identity/hash-bound")
        image = (ROOT / expected_path).read_bytes()
        if not image.startswith(b"\xff\xd8\xff") or hashlib.sha256(image).hexdigest() != digest or len(image) != photo["imageBytes"]:
            raise ValueError("Local image bytes differ from the capture")
        if photo["width"] != 250 or not 0 < photo["height"] <= 1000 or photo.get("status") != "ADMITTED" or not photo.get("reviewedAtUtc"):
            raise ValueError("Local thumbnail dimensions or review are missing")
        out.append({**photo, **identity})
    return out


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


def reviewed_licensed(current: dict, catalog: dict, admitted: list[dict]) -> list[dict]:
    """Admit exact roster/credit/race matches backed by pinned bytes and CC reuse rights.

    The independent site's 96px Commons derivative is kept byte-for-byte.
    No claimed government-issued ID or official ballot certification is inferred.
    """
    if catalog.get("schema") != "KAHRELUM_LICENSED_CANDIDATE_PORTRAITS_v1.0":
        raise ValueError("Unknown licensed photo schema")
    base = "research/candidate-portraits/licensed-2026-11-02/"
    evidence = {}
    for key in ("creditPage", "raceFeed", "bindingEvidence"):
        meta = catalog[key]
        path = meta["path"]
        if not path.startswith(base) or ".." in Path(path).parts:
            raise ValueError("Untrusted licensed evidence path")
        raw = (ROOT / path).read_bytes()
        if hashlib.sha256(raw).hexdigest() != meta["sha256"]:
            raise ValueError("Licensed evidence SHA mismatch")
        evidence[key] = raw
    if catalog["creditPage"]["url"] != "https://midtermsforecast.com/how-built":
        raise ValueError("Wrong photo credit page")
    if catalog["raceFeed"]["url"] != "https://midtermsforecast.com/data/forecast.json":
        raise ValueError("Wrong race identity feed")
    raw_credit = evidence["creditPage"].decode("utf-8")
    race_data = json.loads(evidence["raceFeed"])
    if race_data["schema"] != "mt26.forecast/1":
        raise ValueError("Unknown race source schema")
    race_by_id = {row["id"]: row for row in race_data["races"]}
    binding_rows = json.loads(evidence["bindingEvidence"])["records"]
    by_id = {row["sourceCandidateId"]: row for row in binding_rows}
    if len(by_id) != len(binding_rows):
        raise ValueError("Duplicate credit bindings")
    source_candidates = {str(row["sourceCandidateId"]): row for row in candidate_rows(current)}
    occupied = {str(row["sourceCandidateId"]) for row in admitted}
    seen, out = set(), []
    for photo in catalog["records"]:
        sid = str(photo["sourceCandidateId"])
        if sid in occupied or sid in seen:
            raise ValueError("Cannot replace or duplicate an admitted candidate portrait")
        seen.add(sid)
        candidate = source_candidates.get(sid)
        binding_fields = ("sourceCandidateId", "candidateName", "state", "party", "chamber", "contestId")
        expected = ({k: candidate["name"] if k == "candidateName" else candidate[k] for k in binding_fields}
                    if candidate else {})
        if any(photo.get(k) != expected.get(k) for k in binding_fields):
            raise ValueError("Roster binding mismatch for credited candidate")
        if photo["chamber"] != "Senate" or photo["contestId"] != photo["state"]:
            raise ValueError("Credited image is not a verified Senate contest")
        capture = by_id.get(photo["sourceCandidateId"])
        race_id = "S-" + photo["state"]
        race = race_by_id.get(race_id)
        if (capture is None or capture.get("sourceName") != photo["candidateName"]
                or capture.get("state") != photo["state"] or capture.get("party") != photo["party"]
                or capture.get("raceId") != race_id or capture.get("raceSide") != "left"
                or photo.get("raceSide") != "left" or photo.get("raceId") != race_id
                or race is None or race.get("state") != photo["state"]
                or race.get("left", {}).get("name") != photo["candidateName"]
                or race.get("left", {}).get("party") != photo["party"]):
            raise ValueError("Independent race feed/credit cannot establish identity")
        lic = photo.get("license")
        lic_url = {
            "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0",
            "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
        }.get(lic)
        if not lic_url or photo.get("licenseUrl") != lic_url:
            raise ValueError("Missing approved Commons reuse license")
        file_url = "https://commons.wikimedia.org/wiki/" + photo.get("identityId", "")
        actual_credit = re.findall(
            r"<li><b>" + re.escape(photo["candidateName"]) + r"</b>.*?</li>",
            raw_credit, flags=re.S,
        )
        author = photo.get("attribution", "").split(" / Wikimedia Commons")[0]
        if (len(actual_credit) != 1 or not author or not photo.get("rightsBasis")
                or not photo.get("attribution", "").endswith("photo cropped and resized by midtermsforecast.com")
                or file_url != photo.get("sourceUrl") or file_url != capture.get("commonsPageUrl")
                or photo.get("identityType") != "CREDITED_COMMONS_PHOTO"
                or file_url not in actual_credit[0] or author not in actual_credit[0]
                or lic not in actual_credit[0] or author not in capture.get("credit", "")
                or lic not in capture.get("credit", "")
                or photo["candidateName"] not in capture.get("creditHTML", "")):
            raise ValueError("Commons photo credit and identity evidence conflict")
        snapshot = capture["commonsSnapshotPath"]
        if not snapshot.startswith(base) or ".." in Path(snapshot).parts:
            raise ValueError("Commons snapshot path invalid")
        snapshot_bytes = (ROOT / snapshot).read_bytes()
        if hashlib.sha256(snapshot_bytes).hexdigest() != capture["commonsSnapshotSha256"]:
            raise ValueError("Commons image page capture was modified")
        commons = snapshot_bytes.decode("utf-8")
        if (photo["candidateName"].split()[-1].casefold() not in commons.casefold()
                or ("CC0" not in commons and "CC Zero" not in commons) if lic == "CC0" else
                (photo["candidateName"].split()[-1].casefold() not in commons.casefold()
                 or ("CC BY-SA" not in commons and "Attribution-ShareAlike" not in commons))):
            raise ValueError("Commons source does not substantiate the licensed subject")
        image = photo.get("imagePath", "")
        digest = photo.get("imageSha256", "")
        expected_path = f"assets/candidate-portraits/{sid}-{digest[:16]}.jpg"
        expected_url = f"https://midtermsforecast.com/img/cand/{race_id}_left.jpg"
        if (not re.fullmatch(r"[a-f0-9]{64}", digest)
                or image != expected_path or photo.get("url") != "/" + image
                or photo.get("sourceImageUrl") != expected_url
                or photo.get("width") != 96 or photo.get("height") != 96):
            raise ValueError("Source photo binding, path, or dimensions invalid")
        raw_image = (ROOT / image).read_bytes()
        if (not raw_image.startswith(bytes.fromhex("ffd8ff"))
                or hashlib.sha256(raw_image).hexdigest() != digest
                or len(raw_image) != photo["imageBytes"]):
            raise ValueError("Image bytes are not the reviewed capture")
        out.append({**photo, **primary_identity(photo)})
    return out



def reviewed_documented_aliases(current: dict, catalog: dict, admitted: list[dict], aliases: dict) -> list[dict]:
    """Admit manually reviewed first-party aliases to pinned congressional images.

    This is a closed, candidate-ID-bound evidence register, not a nickname or face
    matching algorithm. Captured official-source excerpts are hashed and checked.
    """
    if aliases.get("schema") != "KAHRELUM_DOCUMENTED_CONGRESSIONAL_ALIASES_v1.0":
        raise ValueError("Unknown documented congressional alias catalog schema")
    reviewed_at = aliases.get("reviewedAtUtc", "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", reviewed_at):
        raise ValueError("Documented alias review timestamp must be UTC")
    people = {p["bioguide_id"]: p for p in catalog["people"]}
    images = {p["bioguideId"]: p for p in catalog["images"]}
    candidates = {p["sourceCandidateId"]: p for p in candidate_rows(current)}
    occupied = {p["sourceCandidateId"] for p in admitted}
    seen_candidates, seen_bioguides, out = set(), set(), []
    base = (ROOT / "research/candidate-portraits/alias-captures-2026-11-03").resolve()

    for alias in aliases["records"]:
        sid = alias["sourceCandidateId"]
        candidate = candidates.get(sid)
        fields = ("sourceCandidateId", "candidateName", "state", "party", "chamber", "contestId")
        expected = ({field: candidate["name"] if field == "candidateName" else candidate[field]
                     for field in fields} if candidate else {})
        if any(alias.get(field) != expected.get(field) for field in fields):
            raise ValueError("Documented alias source roster binding mismatch")
        if sid in occupied or sid in seen_candidates:
            raise ValueError("Documented alias would replace or duplicate a portrait")
        seen_candidates.add(sid)
        bioguide = alias["bioguideId"]
        if bioguide in seen_bioguides:
            raise ValueError("Duplicate Bioguide identity among documented aliases")
        seen_bioguides.add(bioguide)
        person = people.get(bioguide)
        img = images.get(bioguide)
        if not person or not img or not re.fullmatch(r"[A-Z]\d{6}", bioguide):
            raise ValueError("Documented alias lacks pinned congressional identity and photograph")
        state = alias["state"]
        party = PARTIES.get(person["party"], person["party"])
        district = alias["contestId"].split("-", 1)[-1]
        if (alias["chamber"] != "House" or person["type"] != "rep"
                or person["state"] != state or party != alias["party"]
                or person["district"] != district or not alias["contestId"].startswith(state + "-")):
            raise ValueError("Congressional photo state/party/chamber/district identity mismatch")
        if (img["path"] != f"congress/225x275/{bioguide}.jpg"
                or not re.fullmatch(r"[0-9a-f]{40}", img["blobSha"])):
            raise ValueError("Pinned image blob does not match Bioguide archive")
        url = alias.get("firstPartySourceUrl", "")
        parsed = urlsplit(url)
        hostname = (parsed.hostname or "").lower()
        if (parsed.scheme != "https" or not (hostname.endswith(".gov") or hostname == "usna.edu")
                or parsed.username or parsed.password):
            raise ValueError("Documented identity evidence must use official HTTPS source")
        capture = alias.get("capture", {})
        relpath = capture.get("path", "")
        path = (ROOT / relpath).resolve()
        if not path.is_relative_to(base) or path.suffix != ".txt":
            raise ValueError("Documented alias capture outside reviewed directory")
        excerpt = path.read_bytes()
        if (not re.fullmatch(r"[a-f0-9]{64}", capture.get("sha256", ""))
                or hashlib.sha256(excerpt).hexdigest() != capture["sha256"]
                or not re.fullmatch(r"[a-f0-9]{64}", alias.get("sourceHtmlSha256", ""))):
            raise ValueError("Documented first-party source capture digest mismatch")
        body = excerpt.decode("utf-8")
        phrases = alias.get("evidencePhrases", [])
        if (not isinstance(phrases, list) or not 1 <= len(phrases) <= 4
                or any(not isinstance(phrase, str) or len(phrase) < 20 or phrase not in body for phrase in phrases)):
            raise ValueError("Documented alias official identity phrases are missing")
        evidence = normalize_name(" ".join(phrases))
        given = re.sub(r"[^A-Za-z]", "", alias["candidateName"].split()[0])
        family = person["last_name"]
        crosswalk_given = {normalize_name(person["first_name"].split()[0]),
                           normalize_name(person.get("wikipedia_id", "").split()[0])}
        if (any(normalize_name(token) not in evidence for token in (given, family))
                or not any(token and token in evidence for token in crosswalk_given)):
            raise ValueError("First-party alias evidence lacks candidate and documented crosswalk names")
        image_base = f"https://raw.githubusercontent.com/{catalog['photoSource']['repository']}/{catalog['photoSource']['commit']}"
        source_base = f"https://github.com/{catalog['photoSource']['repository']}/blob/{catalog['photoSource']['commit']}"
        out.append({
            **{field: alias[field] for field in fields},
            "status": "ADMITTED", "bioguideId": bioguide,
            "matchedName": person["full_name"],
            "matchMethod": "EXACT_REVIEWED_FIRST_PARTY_ALIAS_STATE_PARTY_DISTRICT",
            "matchedSourceField": "documented_alias_capture_2026_11_03",
            "identitySourceUrl": catalog["identitySource"]["url"],
            "identityRole": {"chamber": "House", "state": state, "party": person["party"], "district": person["district"]},
            "url": f"{image_base}/{img['path']}", "width": img["width"], "height": img["height"],
            "imageBlobSha": img["blobSha"],
            "sourceUrl": f"{source_base}/{img.get('metadataPath',img['path'])}",
            "originalSourceUrl": img.get("originalSourceUrl") or f"{source_base}/{img.get('originalPath',img['path'])}",
            "originalSourceName": img.get("originalSourceName", "Congressional portrait archive"),
            "license": catalog["photoSource"]["license"],
            "licenseUrl": catalog["photoSource"]["licenseUrl"],
            "rightsBasis": "Public-domain declaration of the pinned congressional image corpus",
            "attribution": "U.S. Congress / unitedstates/images",
            "reviewedAtUtc": alias["reviewedAtUtc"],
            "aliasEvidence": {"firstPartySourceUrl": url,
                "capturePath": relpath, "captureSha256": capture["sha256"],
                "sourceHtmlSha256": alias["sourceHtmlSha256"]},
        })
    return out


def reviewed_shared_commons(current: dict, catalog: dict, admitted: list[dict]) -> list[dict]:
    """Verify 2026 FEC source IDs and byte-identical, openly reusable Commons thumbnails.

    Commons metadata is captured through the English Wikipedia shared-image API:
    no Commons revision claim or inference from visual appearance is made.
    """
    if catalog.get("schema") != "KAHRELUM_FEC_ENWIKI_SHARED_COMMONS_v1.0":
        raise ValueError("Unrecognized shared Commons catalog")
    if not re.fullmatch(r"[a-f0-9]{64}", catalog.get("fecBulkZipSha256", "")):
        raise ValueError("Missing FEC bulk source receipt")
    if catalog.get("fecBulkSourceUrl") != "https://www.fec.gov/files/bulk-downloads/2026/cn26.zip":
        raise ValueError("FEC bulk edition not recognized")
    meta_path = catalog.get("wikipediaImageinfoCatalog", "")
    if meta_path != "research/candidate-portraits/enwiki-imageinfo-2026-11-03.json":
        raise ValueError("Unexpected shared Commons evidence location")
    metadata = json.loads((ROOT / meta_path).read_text(encoding="utf-8"))
    pages = {p["title"].replace("_", " "): p for p in metadata["imagePages"]}
    fec_path = catalog.get("fecCaptureCatalog", "")
    if fec_path != "research/candidate-portraits/fec-master-evidence-2026-11-03.json":
        raise ValueError("Unexpected FEC evidence location")
    fec_capture = json.loads((ROOT / fec_path).read_text(encoding="utf-8"))
    if (fec_capture.get("schema") != "KAHRELUM_2026_FEC_MASTER_CAPTURE_v1"
            or fec_capture.get("sourceZipSha256") != catalog["fecBulkZipSha256"]):
        raise ValueError("FEC primary source digest mismatch")
    fec_entries = {r["fecCandidateId"]: r for r in fec_capture["reducedSourceRecords"]}
    roster = {r["sourceCandidateId"]: r for r in candidate_rows(current)}
    used = {r["sourceCandidateId"] for r in admitted}
    ids = {r.get("fecCandidateId", r.get("identityId")) for r in admitted}
    seen, new = set(), []
    def strip_markup(s):
        return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())
    for photo in catalog["records"]:
        sid = photo["sourceCandidateId"]
        candidate = roster.get(sid)
        if sid in seen or sid in used:
            raise ValueError("Shared Commons portrait would replace or duplicate a candidate")
        seen.add(sid)
        for key in ("sourceCandidateId", "candidateName", "state", "party", "chamber", "contestId"):
            if photo.get(key) != (candidate.get("name" if key == "candidateName" else key) if candidate else None):
                raise ValueError("Shared Commons photo does not match the source candidate record")
        fid = photo["fecCandidateId"]
        if photo.get("identityType") != "FEC_ENWIKI_SHARED_COMMONS" or photo.get("identityId") != fid or fid in ids:
            raise ValueError("Shared Commons candidate identity is invalid or reused")
        ids.add(fid)
        chamber = photo["chamber"]
        prefix = "H" if chamber == "House" else "S" if chamber == "Senate" else ""
        if not prefix or not re.fullmatch(prefix + r"\d" + photo["state"] + r"\d{5}", fid):
            raise ValueError("Shared photo lacks valid FEC office and state")
        if photo["fecBulkSourceUrl"] != catalog["fecBulkSourceUrl"] or photo["fecBulkZipSha256"] != catalog["fecBulkZipSha256"]:
            raise ValueError("Shared photo has mismatched FEC source edition")
        fec = fec_entries.get(fid)
        if (not fec or fec["fecName"] != photo["fecName"]
                or fec["fecState"] != photo["state"] or fec["fecOffice"] != prefix
                or str(fec["fecElectionYear"]) != "2026"):
            raise ValueError("Captured FEC candidate identity differs")
        if "sourceFullRecordSha256" in fec:
            if not re.fullmatch(r"[0-9a-f]{64}", fec["sourceFullRecordSha256"]):
                raise ValueError("FEC source row receipt malformed")
            if fec["fecParty"] not in ({"D": ("DEM", "DFL"), "R": ("REP",), "I": ("IND",), "L": ("LIB",)}.get(photo["party"], ())):
                raise ValueError("FEC party differs")
            expected_district = photo["contestId"].split("-")[-1] if prefix == "H" else "00"
            expected_district = "00" if expected_district == "AL" else expected_district.zfill(2)
            if (fec["fecDistrict"] or "00") != expected_district:
                raise ValueError("FEC House district differs")
        else:
            # Precisely two manually captured FEC web profiles with compound/alias names.
            if fid not in {"H6AZ05190", "H6IA03268"}:
                raise ValueError("Undocumented FEC alias")
            source = f"https://www.fec.gov/data/candidate/{fid}/?cycle=2026"
            if (fec.get("sourceUrl") != source
                    or not re.fullmatch(r"[0-9a-f]{64}", fec.get("sourceHtmlSha256", ""))):
                raise ValueError("Missing first-party candidate receipt")
            fragment = ROOT / fec["firstPartyExcerptPath"]
            if (not fragment.resolve().is_relative_to((ROOT / "research/candidate-portraits").resolve())
                    or hashlib.sha256(fragment.read_bytes()).hexdigest() != fec["firstPartyExcerptSha256"]
                    or fid not in fragment.read_text(encoding="utf-8")):
                raise ValueError("Primary FEC profile excerpt integrity failure")
            if fec["fecDistrict"] != photo["contestId"].split("-")[-1]:
                raise ValueError("FEC special candidate district differs")
        legal = normalize_name(photo["fecName"])
        first, last = photo["candidateName"].split()[0], photo["candidateName"].split()[-1]
        if not (normalize_name(last) in legal and (normalize_name(first) in legal or
              (sid == 19129 and "thomasjamesfeely" in normalize_name(photo["wikipediaIntro"])))):
            raise ValueError("Candidate has no documented exact FEC name or Jay Feely alias")
        if (not photo["sourceWikipediaArticle"].startswith("https://en.wikipedia.org/wiki/")
                or normalize_name(photo["wikipediaTitle"]) != normalize_name(photo["candidateName"])
                or len(photo.get("wikipediaIntro", "")) < 40
                or not isinstance(photo["sourceWikipediaPageId"], int)):
            raise ValueError("Missing exact-title Wikipedia identity source")
        pg = pages.get(photo["commonsTitle"].replace("_", " "))
        if not pg or not pg.get("imageinfo"):
            raise ValueError("Commons image metadata is missing")
        info = pg["imageinfo"][0]
        met = info["extmetadata"]
        lic = strip_markup(met["LicenseShortName"]["value"])
        artist = strip_markup(met["Artist"]["value"])
        description = strip_markup(met.get("ImageDescription", {}).get("value", ""))
        permitted = lic == "Public domain" and met.get("Copyrighted", {}).get("value") == "False"
        permitted = permitted or bool(re.fullmatch(r"CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)", lic))
        permitted = permitted or lic == "CC0"
        if lic == "Copyrighted free use":
            permitted = (sid == 20332 and photo["state"] == "IA"
                         and photo.get("permissionTicket") == "2010030210041811"
                         and "VRTS permission confirmed" in met.get("Categories", {}).get("value", "")
                         and artist == "Iowa General Assembly")
        if not permitted or photo["license"] != lic or artist != photo["attribution"] or not artist:
            raise ValueError("Commons subject image has no supported and captured reuse permission")
        license_url = met.get("LicenseUrl", {}).get("value", "") or info["descriptionurl"] + "#Licensing"
        if photo["licenseUrl"] != license_url or not photo["rightsBasis"]:
            raise ValueError("Commons reuse license URL or rights record mismatch")
        if (photo["sourceMetadataDescription"] != description
                or photo["sourceUrl"] != info["descriptionurl"]
                or photo["commonsImageSha1"] != info["sha1"]
                or photo["commonsOriginalBytes"] != info["size"]
                or photo["sourceImageUploadedAt"] != info["timestamp"]):
            raise ValueError("Commons source identity and image receipt mismatch")
        image_url = info.get("thumburl") or info.get("url")
        if photo["sourceThumbnailUrl"] != image_url or photo["sourceImageUrl"] != image_url:
            raise ValueError("Commons original thumbnail URL mismatch")
        sha = photo["imageSha256"]
        ext = ".png" if photo["imageFormat"] == "PNG" else ".jpg" if photo["imageFormat"] == "JPEG" else ""
        path = f"assets/candidate-portraits/{sid}-{sha[:16]}{ext}"
        if (not ext or not re.fullmatch(r"[a-f0-9]{64}", sha)
                or photo["imagePath"] != path or photo["url"] != "/" + path):
            raise ValueError("Shared thumbnail path is not content-addressed")
        data = (ROOT / path).read_bytes()
        if (hashlib.sha256(data).hexdigest() != sha or len(data) != photo["imageBytes"]
                or (not data.startswith(b"\xff\xd8\xff") if ext == ".jpg" else not data.startswith(b"\x89PNG\r\n\x1a\n"))):
            raise ValueError("Shared thumbnail bytes do not match reviewed source")
        check = photo.get("sourceImageCheck", {})
        if (check.get("httpStatus") != 200 or check.get("sha256") != sha
                or check.get("bytes") != len(data) or not check.get("contentType", "").startswith("image/")
                or photo.get("status") != "ADMITTED"):
            raise ValueError("Source byte check is incomplete")
        actual_width = info.get("thumbwidth", info.get("width"))
        actual_height = info.get("thumbheight", info.get("height"))
        provider_rounding_ok = photo["width"] == actual_width and abs(photo["height"] - actual_height) <= 1
        original_small_ok = (photo["width"] == info.get("width")
                             and photo["height"] == info.get("height") and photo["width"] <= 250)
        if not (provider_rounding_ok or original_small_ok):
            raise ValueError("Shared photo dimensions not confirmed by source")
        new.append(photo)
    return new

def build_ledger(current: dict, catalog: dict, reviewed_at: str, supplement: dict | None = None, noncongress: dict | None = None, licensed: dict | None = None, local: dict | None = None, aliases: dict | None = None, shared: dict | None = None) -> dict:
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
    if licensed:
        new_photos = reviewed_licensed(current, licensed, records)
        new_ids = {row["sourceCandidateId"] for row in new_photos}
        identity_count += len(new_photos)
        records.extend(new_photos)
        unresolved = [row for row in unresolved if row["sourceCandidateId"] not in new_ids]
    if local:
        additions = reviewed_local(current, local, records)
        added_ids = {r["sourceCandidateId"] for r in additions}
        records.extend(additions)
        identity_count += len(additions)
        unresolved = [r for r in unresolved if r["sourceCandidateId"] not in added_ids]
    if aliases:
        additions = reviewed_documented_aliases(current, catalog, records, aliases)
        added_ids = {r["sourceCandidateId"] for r in additions}
        records.extend(additions)
        identity_count += len(additions)
        unresolved = [r for r in unresolved if r["sourceCandidateId"] not in added_ids]
    if shared:
        photos = reviewed_shared_commons(current, shared, records)
        added_ids = {p["sourceCandidateId"] for p in photos}
        records.extend(photos)
        identity_count += len(photos)
        unresolved = [r for r in unresolved if r["sourceCandidateId"] not in added_ids]
    coverage = {
        "sourceListedCandidateRecords": len(candidates),
        "uniqueCandidateIds": len(set(ids)),
        "identityMatchedCandidates": identity_count,
        "admittedPortraits": len(records),
        "uniquePeopleWithPortraits": len({record.get("bioguideId") or "FEC:" + record.get("fecCandidateId", record["identityId"]) for record in records}),
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
    if licensed:
        result["admissionRule"] += " Additional candidate portraits use exact source-roster/race/Commons credit identity matches, captured CC reuse rights, and byte-verified self-hosted thumbnails. They do not certify ballot eligibility."
        result["licensedSourceCatalog"] = "research/candidate-portraits/licensed-sources-2026-11-02.json"
        result["sources"]["licensed"] = {"photoCreditPage": licensed["creditPage"], "raceFeed": licensed["raceFeed"], "capturedAtUtc": licensed["reviewedAtUtc"], "count": len(licensed["records"])}
    if licensed or local:
        result["primaryIdentityCatalog"] = "research/candidate-portraits/primary-identities-2026-11-02.json"
        result["primaryIdentityCatalogSha256"] = hashlib.sha256((ROOT / result["primaryIdentityCatalog"]).read_bytes()).hexdigest()
    if local:
        result["localSourceCatalog"] = "research/candidate-portraits/local-sources-2026-11-02.json"
        result["admissionRule"] += " November 2 additions also require first-party FEC name/state/party/office evidence. Local Commons source-page captures retain exact per-image licenses, creator and revision; Iowa legislative portraits retain their specific reviewed reuse permission. Source-page evidence is not represented as Commons API metadata."
    if aliases:
        result["admissionRule"] += " Exact first-party name aliases may bind a previously unresolved candidate to an existing pinned congressional Bioguide portrait only after unique state, party, chamber, district, document and source capture checks. Ambiguous homonyms remain unresolved."
        result["aliasSourceCatalog"] = "research/candidate-portraits/documented-aliases-2026-11-03.json"
        result["aliasesSourceCatalogSha256"] = hashlib.sha256((ROOT / result["aliasSourceCatalog"]).read_bytes()).hexdigest()
    if shared:
        result["admissionRule"] += " First-party FEC 2026 candidate records and captured Wikimedia shared-file metadata through Wikipedia tie each approved thumbnail to a uniquely reviewed named candidate, original Wikimedia image SHA1, byte-checked thumbnail and per-image reuse rights. No face matching or ballot certification."
        result["sharedSourceCatalog"] = "research/candidate-portraits/shared-commons-sources-2026-11-03.json"
        result["sharedSourceCatalogSha256"] = hashlib.sha256((ROOT / result["sharedSourceCatalog"]).read_bytes()).hexdigest()
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--supplement", type=Path, default=DEFAULT_SUPPLEMENT)
    parser.add_argument("--noncongress", type=Path, default=DEFAULT_NONCONGRESS)
    parser.add_argument("--licensed", type=Path, default=ROOT / "research/candidate-portraits/licensed-sources-2026-11-02.json")
    parser.add_argument("--local", type=Path, default=ROOT / "research/candidate-portraits/local-sources-2026-11-02.json")
    parser.add_argument("--aliases", type=Path, default=ROOT / "research/candidate-portraits/documented-aliases-2026-11-03.json")
    parser.add_argument("--shared", type=Path, default=ROOT / "research/candidate-portraits/shared-commons-sources-2026-11-03.json")
    parser.add_argument("--current", type=Path, default=ROOT / "election/current-projections.json")
    parser.add_argument("--output", type=Path, default=ROOT / "election/candidate-portraits.json")
    parser.add_argument("--reviewed-at", help="UTC review timestamp; defaults to the captured catalog timestamp")
    parser.add_argument("--check", action="store_true", help="Verify the checked-in ledger is reproducible without writing")
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    supplement = json.loads(args.supplement.read_text(encoding="utf-8"))
    noncongress = json.loads(args.noncongress.read_text(encoding="utf-8")) if args.noncongress.exists() else None
    licensed = json.loads(args.licensed.read_text(encoding="utf-8")) if args.licensed.exists() else None
    local = json.loads(args.local.read_text(encoding="utf-8")) if args.local.exists() else None
    aliases = json.loads(args.aliases.read_text(encoding="utf-8")) if args.aliases.exists() else None
    shared = json.loads(args.shared.read_text(encoding="utf-8")) if args.shared.exists() else None
    reviewed_at = args.reviewed_at or max(catalog["retrievedAtUtc"], supplement["retrievedAtUtc"], supplement.get("updatedAtUtc", supplement["retrievedAtUtc"]))
    if noncongress and not args.reviewed_at:
        reviewed_at = max(reviewed_at, noncongress["reviewedAtUtc"])
    if licensed and not args.reviewed_at:
        reviewed_at = max(reviewed_at, licensed["reviewedAtUtc"])
    if local and not args.reviewed_at:
        reviewed_at = max(reviewed_at, local["reviewedAtUtc"])
    if aliases and not args.reviewed_at:
        reviewed_at = max(reviewed_at, aliases["reviewedAtUtc"])
    if shared and not args.reviewed_at:
        reviewed_at = max(reviewed_at, shared["reviewedAtUtc"])
    ledger = build_ledger(json.loads(args.current.read_text(encoding="utf-8")), catalog, reviewed_at, supplement, noncongress, licensed, local, aliases, shared)
    ledger["sourceCatalogSha256"] = hashlib.sha256(args.catalog.read_bytes()).hexdigest()
    ledger["supplementalSourceCatalogSha256"] = hashlib.sha256(args.supplement.read_bytes()).hexdigest()
    if noncongress:
        ledger["noncongressSourceCatalogSha256"] = hashlib.sha256(args.noncongress.read_bytes()).hexdigest()
    if local:
        ledger["localSourceCatalogSha256"] = hashlib.sha256(args.local.read_bytes()).hexdigest()
    if licensed:
        ledger["licensedSourceCatalogSha256"] = hashlib.sha256(args.licensed.read_bytes()).hexdigest()
    rendered = json.dumps(ledger, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text(encoding="utf-8") != rendered:
            raise SystemExit("Candidate portrait ledger is stale; rebuild it from the reviewed catalog")
    else:
        args.output.write_text(rendered, encoding="utf-8", newline="\n")
    print(json.dumps(ledger["coverage"], indent=2))


if __name__ == "__main__":
    main()
