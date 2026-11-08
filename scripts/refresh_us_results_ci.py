#!/usr/bin/env python3
"""Fail-closed Linux/GitHub refresh of credited, unofficial US election source files.

Never silently change an already called winner or historical forecast lock.
Git custody and guarded Firebase publication remain separate, verifiable steps.
"""
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "election/results-2026-snapshot.json"
SOURCE_ROOT = "https://polling-desk.com/"
SOURCES = ("house-districts.csv", "results.csv")
MAX_BYTES = 12 * 1024 * 1024


def parse_time(value):
    return dt.datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(dt.timezone.utc)


def download_csv(name, destination):
    if name not in SOURCES:
        raise ValueError("Unapproved source file")
    url = SOURCE_ROOT + name
    request = urllib.request.Request(url, headers={
        "User-Agent": "KAHRELUM-source-custody/2026 (+https://kahrelum.com/election-results-2026)",
        "Cache-Control": "no-cache",
    })
    with urllib.request.urlopen(request, timeout=35) as response:
        if response.geturl().split("?")[0] != url:
            raise ValueError("Unexpected source redirect: " + name)
        payload = response.read(MAX_BYTES + 1)
    if not (10_000 <= len(payload) <= MAX_BYTES):
        raise ValueError("Source CSV is suspiciously short or oversized: " + name)
    destination.write_bytes(payload)


def require_no_called_regressions(old, candidate):
    if candidate.get("schema") != "KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1" or (
            candidate.get("resultStatus") != "UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED"):
        raise ValueError("Result schema or unofficial label was changed")
    for office, expected in (("house", 435), ("senate", 35), ("governor", 36)):
        prior = {str(x["id"]): x for x in old[office]}
        updated = {str(x["id"]): x for x in candidate[office]}
        if len(prior) != expected or len(updated) != expected or prior.keys() != updated.keys():
            raise ValueError("Source race identity/coverage changed: " + office)
        for race_id, row in updated.items():
            previous = prior[race_id]
            if previous["status"] == "CALLED" and row["status"] == "COUNTING":
                raise ValueError("CALLED to COUNTING regression: " + race_id)
            if previous["status"] == "CALLED" and (
                    previous["party"] != row["party"] or previous["winnerOrLeader"] != row["winnerOrLeader"]):
                raise ValueError("previous winner changed; needs human verification: " + race_id)
    new_time = parse_time(candidate["sourceLatestResultUpdatedUtc"])
    old_time = parse_time(old["sourceLatestResultUpdatedUtc"])
    if new_time > dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=30):
        raise ValueError("Future-dated election source")
    if new_time <= old_time:
        raise ValueError("Source timestamps are stale or regressed")


def verify_public_snapshot(candidate):
    url = "https://kahrelum.com/election/results-2026-snapshot.json"
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=25) as response:
        if response.geturl().split("?")[0] != url:
            raise ValueError("Public results URL redirected unexpectedly")
        published = json.load(response)
    if published.get("schema") != "KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1":
        raise ValueError("Unexpected live US result schema")
    return published.get("sourceSha256") != candidate["sourceSha256"]


def write_output(key, value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as stream:
            stream.write(f"{key}={str(value).lower()}\n")


def main():
    original = SNAPSHOT.read_bytes()
    old = json.loads(original)
    changed = False
    try:
        with tempfile.TemporaryDirectory(prefix="kahrelum-us-results-") as folder:
            source_dir = Path(folder)
            for name in SOURCES:
                download_csv(name, source_dir / name)
            subprocess.run([sys.executable, "scripts/build_election_results_snapshot.py",
                            "--source-dir", str(source_dir)], cwd=ROOT, check=True)
        candidate = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        changed = candidate["sourceSha256"] != old["sourceSha256"]
        if changed:
            require_no_called_regressions(old, candidate)
        else:
            SNAPSHOT.write_bytes(original)
            candidate = old
        public_needs_refresh = verify_public_snapshot(candidate)
    except Exception:
        SNAPSHOT.write_bytes(original)
        raise
    write_output("changed", changed)
    write_output("needs_publish", changed or public_needs_refresh)
    print(json.dumps({
        "status": "VALIDATED_CHANGED" if changed else "UNCHANGED",
        "sourceLatestResultUpdatedUtc": candidate["sourceLatestResultUpdatedUtc"],
        "needsPublish": changed or public_needs_refresh,
        "sourceSha256": candidate["sourceSha256"],
    }))


if __name__ == "__main__":
    main()
