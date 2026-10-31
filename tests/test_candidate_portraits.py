import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("candidate_portraits", ROOT / "scripts/build_candidate_portraits.py")
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)


class CandidatePortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(portraits.DEFAULT_CATALOG.read_text())
        cls.current = json.loads((ROOT / "election/current-projections.json").read_text())
        cls.ledger = json.loads((ROOT / "election/candidate-portraits.json").read_text())

    def test_real_roster_coverage_and_exact_card_binding(self):
        rebuilt = portraits.build_ledger(self.current, self.catalog, self.catalog["retrievedAtUtc"])
        self.assertEqual(rebuilt["records"], self.ledger["records"])
        self.assertEqual(rebuilt["coverage"]["sourceListedCandidateRecords"], 940)
        self.assertEqual(rebuilt["coverage"]["candidateCardsWithPortraits"], 373)
        self.assertEqual(rebuilt["coverage"]["candidateCardsWithoutPortraits"], 567)
        self.assertEqual(len({r["bioguideId"] for r in rebuilt["records"]}), 373)
        for record in rebuilt["records"]:
            self.assertIn(self.catalog["photoSource"]["commit"], record["url"])
            self.assertEqual(record["license"], "Public domain")
            self.assertTrue(record["sourceUrl"].startswith("https://"))
            self.assertTrue(record["licenseUrl"].endswith("README.md#public-domain"))

    def test_wrong_state_or_party_does_not_match(self):
        candidate = {"name": "Robert Aderholt", "state": "AL", "party": "R"}
        self.assertEqual(len(portraits.identity_matches(candidate, self.catalog["people"])), 1)
        self.assertEqual(portraits.identity_matches({**candidate, "state": "AK"}, self.catalog["people"]), [])
        self.assertEqual(portraits.identity_matches({**candidate, "party": "D"}, self.catalog["people"]), [])

    def test_typo_is_not_a_match_and_explicit_alias_is(self):
        self.assertEqual(portraits.identity_matches({"name": "Pramilia Jayapal", "state": "WA", "party": "D"}, self.catalog["people"]), [])
        matches = portraits.identity_matches({"name": "Greg Steube", "state": "FL", "party": "R"}, self.catalog["people"])
        self.assertEqual(matches[0][0]["bioguide_id"], "S001214")
        self.assertEqual(matches[0][1]["sourceField"], "documented_wikipedia_alias")
        self.assertEqual(len(portraits.identity_matches({"name": "Gabriel Vasquez", "state": "NM", "party": "D"}, self.catalog["people"])), 1)

    def test_ambiguous_identity_remains_unresolved(self):
        catalog = copy.deepcopy(self.catalog)
        original = next(p for p in catalog["people"] if p["bioguide_id"] == "A000055")
        catalog["people"].append({**original, "bioguide_id": "A999999"})
        ledger = portraits.build_ledger(self.current, catalog, catalog["retrievedAtUtc"])
        blocked = next(r for r in ledger["unresolved"] if r["candidateName"] == "Robert Aderholt")
        self.assertEqual(blocked["reason"], "AMBIGUOUS_IDENTITY")
        self.assertNotIn("Robert Aderholt", [r["candidateName"] for r in ledger["records"]])

    def test_identity_without_image_is_not_admitted(self):
        blocked = next(r for r in self.ledger["unresolved"] if r["candidateName"] == "Nick Begich")
        self.assertEqual(blocked["reason"], "NO_REVIEWED_IMAGE")
        self.assertEqual(blocked["bioguideId"], "B001323")

    def test_rights_missing_or_reused_candidate_ids_fail(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["photoSource"].pop("licenseStatement")
        with self.assertRaisesRegex(ValueError, "public-domain declaration"):
            portraits.build_ledger(self.current, catalog, catalog["retrievedAtUtc"])
        current = copy.deepcopy(self.current)
        current["house"]["districts"][0]["candidates"].append(current["house"]["districts"][0]["candidates"][0])
        with self.assertRaisesRegex(ValueError, "Repeated candidate IDs"):
            portraits.build_ledger(current, self.catalog, self.catalog["retrievedAtUtc"])


if __name__ == "__main__":
    unittest.main()
