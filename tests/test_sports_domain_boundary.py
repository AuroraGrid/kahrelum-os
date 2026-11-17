"""Keep wager and fantasy decision rules outside the KAHRELUM commercial site.

This test intentionally excludes the separate sports brand and preserves the
independent NFL trade-intelligence desk as its own reviewed research product.
"""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SeparateSportsBrandBoundaryTests(unittest.TestCase):
    def read(self, path):
        return (ROOT / path).read_text(encoding="utf-8")

    def test_commercial_sports_page_does_not_publish_wager_tiers(self):
        page = self.read("sports.html")
        self.assertNotIn('<section id="betting">', page)
        self.assertNotIn('<a href="#betting">', page)
        self.assertNotIn("FRIENDS + SLIGHT EDGE", page)
        self.assertNotIn("/sports/betting-policy.json", page)

    def test_guarded_firebase_release_does_not_publish_betting_policy(self):
        release = self.read("scripts/firebase-overlay-release.cjs")
        self.assertNotIn("'sports/betting-policy.json'", release)
        self.assertNotIn("'sports/betting_tiers.py'", release)
        self.assertIn("'sports/module-registry.json'", release)

    def test_canonical_module_registry_excludes_betting(self):
        registry = json.loads(self.read("sports/module-registry.json"))
        self.assertNotIn("SPORTS_BETTING_DECISION_RULES", {module["id"] for module in registry["modules"]})
        self.assertIn("NFL_TRADE_DEADLINE_2026", {module["id"] for module in registry["modules"]})

    def test_betting_source_moved_out_of_main_business_repository(self):
        for path in ("sports/betting-policy.json", "scripts/betting_tiers.py", "tests/test_betting_tiers.py"):
            with self.subTest(path=path):
                self.assertFalse((ROOT / path).exists(), path)

    def test_canonical_readme_does_not_promote_wagers(self):
        readme = self.read("README.md")
        self.assertNotIn("**Sports straight-bet policy (2026-11-01):**", readme)
        self.assertNotIn("[Public tiers](https://kahrelum.com/sports#betting)", readme)


if __name__ == "__main__":
    unittest.main()
