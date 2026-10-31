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
        cls.supplement = json.loads(portraits.DEFAULT_SUPPLEMENT.read_text())
        cls.current = json.loads((ROOT / "election/current-projections.json").read_text())
        cls.ledger = json.loads((ROOT / "election/candidate-portraits.json").read_text())

    def test_real_roster_coverage_and_exact_card_binding(self):
        rebuilt = portraits.build_ledger(self.current, self.catalog, self.supplement["retrievedAtUtc"], self.supplement)
        self.assertEqual(rebuilt["records"], self.ledger["records"])
        self.assertEqual(rebuilt["coverage"]["sourceListedCandidateRecords"], 940)
        self.assertEqual(rebuilt["coverage"]["candidateCardsWithPortraits"], 397)
        self.assertEqual(rebuilt["coverage"]["candidateCardsWithoutPortraits"], 543)
        self.assertEqual(len({r["bioguideId"] for r in rebuilt["records"]}), 397)
        for record in rebuilt["records"]:
            self.assertEqual(record["license"], "Public domain")
            self.assertTrue(record["sourceUrl"].startswith("https://"))
            if record["url"].startswith("/"):
                self.assertTrue(record["licenseUrl"].endswith("#Licensing"))
                self.assertEqual(len(record["imageSha256"]), 64)
            else:
                self.assertIn(self.catalog["photoSource"]["commit"], record["url"])
                self.assertTrue(record["licenseUrl"].endswith("README.md#public-domain"))

    def test_all_previous_portraits_remain_identical(self):
        original = portraits.build_ledger(self.current, self.catalog, self.catalog["retrievedAtUtc"])
        combined = {r["sourceCandidateId"]: r for r in self.ledger["records"]}
        self.assertEqual(len(original["records"]), 373)
        for record in original["records"]:
            self.assertEqual(record, combined[record["sourceCandidateId"]])

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
        original = portraits.build_ledger(self.current, self.catalog, self.catalog["retrievedAtUtc"])
        blocked = next(r for r in original["unresolved"] if r["candidateName"] == "Nick Begich")
        self.assertEqual(blocked["reason"], "NO_REVIEWED_IMAGE")
        self.assertEqual(blocked["bioguideId"], "B001323")
        added = next(r for r in self.ledger["records"] if r["candidateName"] == "Nick Begich")
        self.assertEqual(added["bioguideId"], "B001323")
        self.assertTrue(added["url"].startswith("/assets/candidate-portraits/"))

    def test_former_members_have_distinct_pinned_identities(self):
        expected = {"Mary Peltola": ("AK", "P000619"), "Sherrod Brown": ("OH", "B000944"),
                    "Mike Rogers": ("MI", "R000572"), "John Sununu": ("NH", "S001078")}
        for name, (state, bioguide_id) in expected.items():
            record = next(r for r in self.ledger["records"] if r["candidateName"] == name and r["state"] == state)
            self.assertEqual(record["bioguideId"], bioguide_id)
            self.assertTrue(record["identitySourceUrl"].endswith("/legislators-historical.csv"))
        # Alabama's Mike Rogers is a different person, despite the exact same name.
        alabama = next(r for r in self.ledger["records"] if r["candidateName"] == "Mike Rogers" and r["state"] == "AL")
        self.assertNotEqual(alabama["bioguideId"], "R000572")

    def test_supplement_cannot_override_prior_portraits(self):
        supplement = copy.deepcopy(self.supplement)
        supplement["archiveImages"].append(copy.deepcopy(self.catalog["images"][0]))
        with self.assertRaisesRegex(ValueError, "Duplicate Bioguide image"):
            portraits.build_ledger(self.current, self.catalog, supplement["retrievedAtUtc"], supplement)

    def test_local_image_rights_bytes_and_provenance_are_required(self):
        for field, value, message in [
            ("license", "unknown", "public-domain declaration"),
            ("bytes", 1, "bytes do not match"),
            ("path", "../unrelated.jpg", "path or digest"),
            ("sourceOriginalImageSha1", "0" * 40, "provenance differs"),
            ("bioguideName", "Another Candidate", "identity is not documented"),
        ]:
            with self.subTest(field=field):
                supplement = copy.deepcopy(self.supplement)
                supplement["commonsImages"][0][field] = value
                with self.assertRaisesRegex(ValueError, message):
                    portraits.build_ledger(self.current, self.catalog, supplement["retrievedAtUtc"], supplement)

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
