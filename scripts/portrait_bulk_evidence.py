"""Offline validation of the November 2 remaining-candidate evidence batch.

FEC data binds identity to the roster; it never certifies ballot eligibility.
Search results are discovery only. Only individually reviewed source files are
accepted, with their own license, subject evidence, revision and exact bytes.
"""
import hashlib
import html
import json
import re
import struct
import unicodedata
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "research/candidate-portraits/remaining-2026-11-02/"


def norm(value):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower())


def plain(value):
    return " ".join(html.unescape(re.sub(r"<[^>]*>", " ", value)).split())


def names(fec_name):
    """Only recorded given names, parenthesized aliases and optional suffixes."""
    family, comma, given = fec_name.partition(",")
    if not comma:
        return {norm(fec_name)}
    suffix = re.search(r"\b(JR\.?|SR\.?|II|III|IV)\s*$", given, re.I)
    tails = ["", suffix[0]] if suffix else [""]
    words = re.sub(r"\([^)]*\)", "", given).split()
    firsts = [words[0]] if words else []
    firsts += re.findall(r"\(([^)]+)\)", given)
    variants = {norm(given + " " + family)}
    for first in firsts:
        for tail in tails:
            variants.add(norm(" ".join([first, family, tail])))
    # Preserve a recorded two-word given name (e.g. La Shawn); no nickname table.
    if len(words) > 1:
        variants.add(norm(" ".join(words[:2] + [family])))
    return variants


def identity_options(candidate, fec_rows, committees, aliases=None):
    district = candidate["contestId"].split("-")[-1] if candidate["chamber"] == "House" else "0"
    district = str(0 if district == "AL" else int(district))
    parties = {"D": {"DEM"}, "R": {"REP"}, "I": {"IND"}, "L": {"LIB"}}[candidate["party"]]
    if candidate["state"] == "MN" and candidate["party"] == "D":
        parties = {"DEM", "DFL"}
    eligible = [r for r in fec_rows if r["state"] == candidate["state"]
                and r["office"] == candidate["chamber"][0] and r["party"] in parties
                and r["electionYear"] == "2026" and str(int(r["district"] or 0)) == district]
    found = []
    for row in eligible:
        committee = committees.get(row["principalCommitteeId"], {})
        alias = (aliases or {}).get(str(candidate["sourceCandidateId"]))
        if norm(candidate["candidateName"]) in names(row["fecName"]):
            found.append((row, "EXACT_RECORDED_NAME"))
        elif (committee.get("candidateId") == row["fecCandidateId"]
              and norm(candidate["candidateName"]) in norm(committee.get("committeeName", ""))):
            found.append((row, "EXPLICIT_PRINCIPAL_COMMITTEE_ALIAS"))
        elif alias and alias.get("fecCandidateId") == row["fecCandidateId"]:
            source = capture(alias["capture"])
            text = norm(source["text"])
            if (alias.get("candidateName") != candidate["candidateName"] or alias.get("fecName") != row["fecName"]
                    or source["url"] != alias["sourceUrl"] or not alias.get("reviewNote")
                    or not alias.get("evidenceTerms") or not all(norm(t) in text for t in alias["evidenceTerms"])):
                raise ValueError("Documented alias does not match its first-party capture")
            if alias["method"] == "CAMPAIGN_PRINCIPAL_COMMITTEE_BRIDGE":
                if (committee.get("candidateId") != row["fecCandidateId"] or not committee.get("committeeName")
                        or norm(candidate["candidateName"]) not in text
                        or norm("paid for by " + committee["committeeName"]) not in text):
                    raise ValueError("Campaign alias lacks the exact FEC principal committee disclaimer")
            elif alias["method"] == "EXPLICIT_GOVERNMENT_NAME_ALIAS":
                host = urlsplit(source["url"]).hostname or ""
                if not (host.endswith(".gov") or host.endswith(".state.pa.us")):
                    raise ValueError("Government alias evidence is not on the recorded official domain")
                if not any(n in text for n in names(row["fecName"]) | {norm(row["fecName"])}):
                    raise ValueError("Government page does not identify the FEC legal name")
            else:
                raise ValueError("Unrecognized alias method")
            found.append((row, alias["method"]))
    return found


def capture(meta):
    path = meta.get("path", "")
    if not path.startswith(PREFIX) or ".." in Path(path).parts:
        raise ValueError("Evidence path is outside this review batch")
    data = (ROOT / path).read_bytes()
    if hashlib.sha256(data).hexdigest() != meta.get("sha256"):
        raise ValueError("Evidence capture hash mismatch")
    return json.loads(data)


def dimensions(data, extension):
    """Read encoded dimensions without adding an imaging-library build dependency."""
    if extension == "png":
        return struct.unpack(">II", data[16:24])
    if extension == "webp":
        if data[12:16] == b"VP8X":
            return int.from_bytes(data[24:27], "little") + 1, int.from_bytes(data[27:30], "little") + 1
        if data[12:16] == b"VP8L" and data[20] == 0x2f:
            bits = int.from_bytes(data[21:25], "little")
            return (bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1
        if data[12:16] == b"VP8 " and data[23:26] == b"\x9d\x01\x2a":
            return int.from_bytes(data[26:28], "little") & 0x3fff, int.from_bytes(data[28:30], "little") & 0x3fff
    if extension == "jpg":
        pos = 2
        while pos + 4 < len(data):
            if data[pos] != 0xff:
                break
            while data[pos] == 0xff:
                pos += 1
            marker = data[pos]
            pos += 1
            size = int.from_bytes(data[pos:pos + 2], "big")
            if marker in {0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf}:
                return int.from_bytes(data[pos + 5:pos + 7], "big"), int.from_bytes(data[pos + 3:pos + 5], "big")
            if size < 2:
                break
            pos += size
    raise ValueError("Unsupported or malformed thumbnail dimension header")


def review(current, catalog, admitted):
    if catalog.get("schema") != "KAHRELUM_FEC_BULK_COMMONS_v1.0":
        raise ValueError("Unknown bulk portrait evidence schema")
    master = capture(catalog["candidateMaster"])
    committees = capture(catalog["committeeMaster"])
    if (master["sourceUrl"] != "https://www.fec.gov/files/bulk-downloads/2026/cn26.zip"
            or committees["sourceUrl"] != "https://www.fec.gov/files/bulk-downloads/2026/cm26.zip"):
        raise ValueError("FEC bulk evidence must be first-party")
    cm = {r["committeeId"]: r for r in committees["rows"]}
    roster = {}
    for chamber, contests in [("House", current["house"]["districts"]), ("Senate", current["senate"]["races"])]:
        for contest in contests:
            for row in contest.get("candidates", []):
                roster[row["sourceCandidateId"]] = {"sourceCandidateId": row["sourceCandidateId"], "candidateName": row["name"],
                    "chamber": chamber, "contestId": contest["contestId"], "state": contest["state"], "party": row["party"]}
    seen = {r["sourceCandidateId"] for r in admitted}
    fec_seen = {r.get("fecCandidateId") for r in admitted}
    output = []
    for photo in catalog["records"]:
        sid = photo["sourceCandidateId"]
        if sid in seen or sid not in roster or any(photo.get(k) != v for k, v in roster[sid].items()):
            raise ValueError("Portrait would replace, duplicate or mismatch a source record")
        seen.add(sid)
        options = identity_options(roster[sid], master["rows"], cm, catalog.get("identityAliases"))
        if len(options) != 1 or options[0][0]["fecCandidateId"] != photo.get("fecCandidateId"):
            raise ValueError("FEC name, party, office, district or uniqueness mismatch")
        fec, method = options[0]
        if photo.get("identityMatchMethod") != method or photo.get("identityType") != "FEC_BULK_COMMONS":
            raise ValueError("Identity method mismatch")
        if photo["fecCandidateId"] in fec_seen or photo.get("identityId") != photo["fecCandidateId"] or photo.get("bioguideId"):
            raise ValueError("Duplicate or invalid FEC identity")
        fec_seen.add(photo["fecCandidateId"])
        if (photo.get("identitySourceUrl") != f"https://www.fec.gov/data/candidate/{photo['fecCandidateId']}/?cycle=2026"
                or photo.get("identitySourceSha256") != catalog["candidateMaster"]["sha256"]):
            raise ValueError("Identity evidence URL or hash mismatch")
        evidence = capture(photo["sourceCapture"])
        pages = evidence["response"]["query"]["pages"].values()
        matches = [p for p in pages if p["title"] == photo["commonsTitle"]]
        if len(matches) != 1:
            raise ValueError("Missing unique captured Commons file")
        page = matches[0]
        info = page["imageinfo"][0]
        rights = info["extmetadata"]
        wikitext = page["revisions"][0]["slots"]["main"]["*"]
        if re.search(r"\{\{\s*(?:permission pending|no permission|copyvio|delete|speedy|no source|no license|npd|nsd|nld)\b", wikitext, re.I):
            raise ValueError("File permission or copyright review is unresolved")
        revision = page["revisions"][0]["revid"]
        source_url = f"https://commons.wikimedia.org/w/index.php?oldid={revision}"
        if (photo.get("commonsRevisionId") != revision or photo.get("sourceUrl") != source_url
                or photo.get("sourceThumbnailUrl") != info["thumburl"]
                or photo.get("sourceOriginalImageSha1") != info["sha1"]
                or urlsplit(info["thumburl"]).hostname not in {"upload.wikimedia.org", "thumb.wikimedia.org"}):
            raise ValueError("Image edition or thumbnail differs from captured source")
        description = plain(rights.get("ImageDescription", {}).get("value", ""))
        subject = photo.get("subjectReview", {})
        searchable = plain(page["title"] + " " + description + " " + rights.get("Categories", {}).get("value", ""))
        if (not subject.get("reviewNote") or not subject.get("evidenceTerms")
                or not all(norm(term) in norm(searchable) for term in subject["evidenceTerms"])
                or subject.get("decision") != "EXPLICIT_TEXT_IDENTITY_MATCH_NO_FACIAL_INFERENCE"):
            raise ValueError("Missing reviewed photographic subject evidence")
        license_name = rights["LicenseShortName"]["value"]
        if photo.get("license") != license_name or photo.get("attribution") != plain(rights["Artist"]["value"]):
            raise ValueError("Per-image rights or creator credit mismatch")
        if not photo["attribution"] or re.search(r"unknown|anonymous", photo["attribution"], re.I):
            raise ValueError("Unresolved creator attribution")
        cc = re.fullmatch(r"CC BY(-SA)? (1\.0|2\.0|2\.5|3\.0|4\.0)", license_name)
        if cc:
            license_url = f"https://creativecommons.org/licenses/{'by-sa' if cc[1] else 'by'}/{cc[2]}/"
            captured_url = rights.get("LicenseUrl", {}).get("value", "").replace("http://", "https://")
            if not captured_url.startswith(license_url.rstrip("/")):
                raise ValueError("Captured CC license URL mismatch")
        elif license_name == "CC0":
            license_url = "https://creativecommons.org/publicdomain/zero/1.0/"
            if not re.search(r"(?:cc-zero|\{\{\s*cc0\b)", wikitext, re.I):
                raise ValueError("Missing per-image CC0 grant")
        elif license_name == "Public domain":
            license_url = source_url + "#Licensing"
            template = photo.get("publicDomainTemplate", "")
            allowed = {"PD-USGov", "PD-USGov-Congress", "PD-USGov-POTUS", "PD-USGov-Military", "PD-USGov-Military-Navy",
                       "PD-USGov-Military-Marines", "PD-USMC", "PD-USAF", "PD-USGov-Military-National Guard", "PD-USGov-Military-Army", "PD-USGov-Military-Air Force", "PD-USGov-NASA",
                       "PD-CAGov", "PD-FLGov", "PD-GAHoR", "PD-OK-LSBPD", "PD-NCGov-legislator photo", "PD-author-FlickrPDM", "PD-author"}
            if template not in allowed or not re.search(r"\{\{\s*" + re.escape(template) + r"\s*[|}]", wikitext, re.I):
                raise ValueError("Unreviewed public-domain basis; text/shape rules cannot license a portrait")
        else:
            raise ValueError("No accepted per-image reuse permission")
        if photo.get("licenseUrl") != license_url or not photo.get("rightsBasis"):
            raise ValueError("Rights link or explanation mismatch")
        digest = photo.get("imageSha256", "")
        extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(info.get("thumbmime", info["mime"]))
        expected = f"/assets/candidate-portraits/{sid}-{digest[:16]}.{extension}"
        if not extension or not re.fullmatch(r"[a-f0-9]{64}", digest) or photo.get("url") != expected:
            raise ValueError("Local image path is not identity/hash bound")
        data = (ROOT / expected.lstrip("/")).read_bytes()
        magic = data.startswith(b"\xff\xd8\xff") if extension == "jpg" else data.startswith(b"\x89PNG\r\n\x1a\n") if extension == "png" else data[:4] == b"RIFF" and data[8:12] == b"WEBP"
        if not magic or hashlib.sha256(data).hexdigest() != digest or len(data) != photo.get("imageBytes"):
            raise ValueError("Portrait bytes differ from reviewed image")
        original = ((photo.get("width"), photo.get("height")) == (info["width"], info["height"])
                    and hashlib.sha1(data).hexdigest() == info["sha1"]
                    and photo.get("thumbnailDimensionNote") == "Commons returned the unchanged original because it is smaller than the requested thumbnail.")
        thumbnail = (photo.get("width") == info["thumbwidth"] and abs(photo.get("height", 0) - info["thumbheight"]) <= 1
                     and (photo["height"] == info["thumbheight"] or photo.get("thumbnailDimensionNote") == "Commons API rounds the nominal height; stored dimensions are decoded from the unchanged image bytes."))
        if (dimensions(data, extension) != (photo.get("width"), photo.get("height"))
                or not (original or thumbnail)
                or not 0 < photo["width"] <= 250 or not 0 < photo["height"] <= 1000
                or photo.get("status") != "ADMITTED" or photo.get("reviewedAtUtc") != catalog["reviewedAtUtc"]):
            raise ValueError("Portrait dimensions or review timestamp mismatch")
        output.append(photo)
    return output


def unresolved_review(catalog, unresolved):
    audit = capture(catalog["reviewAudit"])
    if audit.get("schema") != "KAHRELUM_REMAINING_PORTRAIT_REVIEW_v1.0" or audit.get("scope") != 511:
        raise ValueError("Remaining-candidate audit has an invalid scope")
    rows = audit["records"]
    by_id = {r["sourceCandidateId"]: r for r in rows}
    if len(rows) != 511 or len(by_id) != len(rows):
        raise ValueError("Remaining-candidate audit is incomplete or duplicated")
    added = {r["sourceCandidateId"] for r in catalog["records"]}
    if {r["sourceCandidateId"] for r in rows if r["decision"] == "ADMITTED"} != added:
        raise ValueError("Audit admission decisions disagree with validated photos")
    if {r["sourceCandidateId"] for r in unresolved} | added != set(by_id):
        raise ValueError("Audit does not preserve all original unresolved candidates")
    output = []
    for r in unresolved:
        checked = by_id[r["sourceCandidateId"]]
        if checked["decision"] != "UNRESOLVED" or any(checked.get(k) != v for k, v in r.items() if k != "reason"):
            raise ValueError("Unresolved audit roster mismatch")
        output.append({**r, "originalReason": r["reason"], "reason": checked["reason"],
                       "reviewNote": checked["note"], "primaryIdentityStatus": checked["primaryIdentity"]["status"]})
    return output
