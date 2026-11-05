"""Check engineering-packet consistency, never authenticity or merge authority."""
import argparse
import hashlib
import json
import re
from pathlib import Path


def validate(packet, root, expected_head):
    errors = []
    if not isinstance(packet, dict):
        return ["packet must be an object"]
    if not re.fullmatch(r"[0-9a-f]{40}", expected_head):
        errors.append("expected head must be a full Git SHA")
    if packet.get("head") != expected_head:
        errors.append("packet head does not match expected head")
    for field in ("task_id", "builder_run", "reviewer_run", "scope", "rollback"):
        if not isinstance(packet.get(field), str) or not packet[field].strip():
            errors.append(f"missing {field}")
    if packet.get("builder_run") == packet.get("reviewer_run"):
        errors.append("self-review is not independent")
    if not re.fullmatch(r"[0-9a-f]{40}", str(packet.get("base", ""))):
        errors.append("base must be a full Git SHA")
    if not isinstance(packet.get("changed_paths"), list) or not packet["changed_paths"] or not all(isinstance(p, str) and p.strip() for p in packet["changed_paths"]):
        errors.append("changed_paths must be a nonempty list of paths")

    artifacts = packet.get("artifacts")
    if not isinstance(artifacts, dict) or not artifacts:
        errors.append("missing evidence artifacts")
        artifacts = {}
    valid_artifacts = set()
    root = root.resolve()
    for name, entry in artifacts.items():
        try:
            if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
                raise ValueError("invalid artifact entry")
            relative = Path(entry["path"])
            path = (root / relative).resolve()
            if relative.is_absolute() or not path.is_relative_to(root):
                raise ValueError("artifact escapes packet directory")
            data = path.read_bytes()
            if not data or hashlib.sha256(data).hexdigest() != entry.get("sha256"):
                raise ValueError("empty or mismatched artifact")
            valid_artifacts.add(name)
        except (OSError, ValueError, TypeError, RuntimeError) as exc:
            errors.append(f"artifact {name}: {exc}")

    def evidence(value, label):
        if not isinstance(value, list) or not value or not all(isinstance(v, str) and v in valid_artifacts for v in value):
            errors.append(f"{label} needs valid attached evidence")

    checks = packet.get("checks", {})
    if not isinstance(checks, dict):
        checks = {}
    for name in ("findings", "ci", "conflicts", "independent_review"):
        check = checks.get(name, {})
        if not isinstance(check, dict):
            check = {}
        if check.get("status") != "PASS" or check.get("head") != expected_head or check.get("base") != packet.get("base"):
            errors.append(f"{name} is not clean for this head/base")
        evidence(check.get("evidence"), name)
    tests = packet.get("tests")
    if not isinstance(tests, list) or not tests:
        errors.append("missing executed tests")
        tests = []
    for item in tests:
        if not isinstance(item, dict):
            errors.append("invalid test entry")
            continue
        if not isinstance(item.get("command"), str) or not item["command"].strip() or type(item.get("exit_code")) is not int or item["exit_code"] != 0 or type(item.get("passed")) is not int or item["passed"] < 1:
            errors.append("test command, exit code or positive pass count missing")
        evidence(item.get("evidence"), "test")
    app = packet.get("working_app", {})
    if not isinstance(app, dict):
        app = {}
    if app.get("status") != "PASS" or app.get("head") != expected_head:
        errors.append("working app is not verified for this head")
    for field in ("url", "steps", "observed", "viewport"):
        if not isinstance(app.get(field), str) or not app[field].strip():
            errors.append(f"working app missing {field}")
    evidence(app.get("evidence"), "working app")
    evidence(app.get("screenshots"), "screenshots")
    unverified = packet.get("unverified")
    if not isinstance(unverified, list):
        errors.append("unverified items must be explicitly listed")
    else:
        for item in unverified:
            if not isinstance(item, dict) or type(item.get("blocking")) is not bool or not isinstance(item.get("item"), str) or not item["item"].strip():
                errors.append("invalid unverified item")
            elif item["blocking"]:
                errors.append(f"blocking unverified item: {item['item']}")
    if packet.get("founder_gate") != "REQUIRED":
        errors.append("founder approval gate must remain REQUIRED")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packet", type=Path)
    parser.add_argument("--head", required=True)
    args = parser.parse_args()
    try:
        packet = json.loads(args.packet.read_text(encoding="utf-8"))
        errors = validate(packet, args.packet.parent, args.head)
    except (OSError, ValueError, TypeError) as exc:
        errors = [str(exc)]
    print(json.dumps({"status": "BLOCKED" if errors else "STRUCTURE_VALID",
                      "independently_verified": False, "errors": errors}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
