import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/validate_engineering_proof.py"
SPEC = importlib.util.spec_from_file_location("proof", SCRIPT)
proof = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(proof)
HEAD = "a" * 40
BASE = "b" * 40


class ProofTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        data = b"Synthetic fixture only; not an actual engineering receipt.\n"
        (self.root / "fixture.txt").write_bytes(data)
        self.packet = {
            "task_id": "SYNTHETIC-TEST", "head": HEAD, "base": BASE,
            "builder_run": "fixture-builder", "reviewer_run": "fixture-reviewer",
            "scope": "synthetic unit test", "rollback": "discard fixture",
            "changed_paths": ["example.txt"], "founder_gate": "REQUIRED",
            "artifacts": {"fixture": {"path": "fixture.txt", "sha256": hashlib.sha256(data).hexdigest()}},
            "checks": {name: {"status": "PASS", "head": HEAD, "base": BASE, "evidence": ["fixture"]}
                       for name in ("findings", "ci", "conflicts", "independent_review")},
            "tests": [{"command": "synthetic fixture", "exit_code": 0, "passed": 1, "evidence": ["fixture"]}],
            "working_app": {"status": "PASS", "head": HEAD, "url": "http://localhost/fixture",
                            "steps": "synthetic", "observed": "synthetic", "viewport": "synthetic",
                            "evidence": ["fixture"], "screenshots": ["fixture"]},
            "unverified": []}

    def test_valid_structure_does_not_authenticate_evidence(self):
        self.assertEqual(proof.validate(self.packet, self.root, HEAD), [])

    def test_missing_stale_or_failed_four_checks_block(self):
        for name in self.packet["checks"]:
            for change in ({"status": "UNVERIFIED"}, {"head": "c" * 40}, {"base": "d" * 40}, {"evidence": []}):
                with self.subTest(name=name, change=change):
                    packet = copy.deepcopy(self.packet)
                    packet["checks"][name].update(change)
                    self.assertTrue(proof.validate(packet, self.root, HEAD))

    def test_self_review_and_wrong_head_block(self):
        self.packet["reviewer_run"] = self.packet["builder_run"]
        self.assertTrue(proof.validate(self.packet, self.root, HEAD))
        self.packet["reviewer_run"] = "other"
        self.assertTrue(proof.validate(self.packet, self.root, "c" * 40))

    def test_tampering_missing_and_path_escape_block(self):
        for path in ("absent.txt", "../outside.txt", str(self.root / "fixture.txt")):
            self.packet["artifacts"]["fixture"]["path"] = path
            self.assertTrue(proof.validate(self.packet, self.root, HEAD))
        self.packet["artifacts"]["fixture"]["path"] = "fixture.txt"
        (self.root / "fixture.txt").write_text("changed")
        self.assertTrue(proof.validate(self.packet, self.root, HEAD))

    def test_missing_app_screenshot_and_blocking_unknown_block(self):
        for field in ("screenshots", "evidence"):
            packet = copy.deepcopy(self.packet)
            packet["working_app"][field] = []
            self.assertTrue(proof.validate(packet, self.root, HEAD))
        self.packet["unverified"] = [{"item": "native review missing", "blocking": True}]
        self.assertTrue(proof.validate(self.packet, self.root, HEAD))

    def test_symlink_loop_returns_blocked_json(self):
        link = self.root / "loop"
        try:
            link.symlink_to("loop")
        except OSError:
            self.skipTest("symlinks unavailable in this environment")
        self.packet["artifacts"]["fixture"]["path"] = "loop"
        path = self.root / "packet.json"
        path.write_text(json.dumps(self.packet))
        result = subprocess.run([sys.executable, str(SCRIPT), str(path), "--head", HEAD], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)["status"], "BLOCKED")
        self.assertNotIn("Traceback", result.stderr)

    def test_zero_tests_and_failure_exit_block(self):
        for change in ({"passed": 0}, {"exit_code": 1}, {"passed": True}, {"exit_code": False}):
            packet = copy.deepcopy(self.packet)
            packet["tests"][0].update(change)
            self.assertTrue(proof.validate(packet, self.root, HEAD))

    def test_malformed_inputs_block_without_traceback(self):
        for value in (None, [], {"checks": None}, {"artifacts": []}, {"tests": [None]}):
            self.assertTrue(proof.validate(value, self.root, HEAD))

    def test_cli_success_is_structural_and_negative_control_exits_one(self):
        path = self.root / "packet.json"
        path.write_text(json.dumps(self.packet))
        success = subprocess.run([sys.executable, str(SCRIPT), str(path), "--head", HEAD], capture_output=True, text=True)
        self.assertEqual(success.returncode, 0)
        result = json.loads(success.stdout)
        self.assertEqual(result["status"], "STRUCTURE_VALID")
        self.assertFalse(result["independently_verified"])
        self.packet["working_app"]["screenshots"] = []
        path.write_text(json.dumps(self.packet))
        blocked = subprocess.run([sys.executable, str(SCRIPT), str(path), "--head", HEAD], capture_output=True, text=True)
        self.assertEqual(blocked.returncode, 1)
        self.assertEqual(json.loads(blocked.stdout)["status"], "BLOCKED")


if __name__ == "__main__":
    unittest.main()
