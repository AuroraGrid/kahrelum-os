import copy
import hashlib
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("candidate_portraits", ROOT / "scripts/build_candidate_portraits.py")
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)


class NonCongressPortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.current = json.loads((ROOT / "election/current-projections.json").read_text())
        cls.catalog = json.loads(portraits.DEFAULT_NONCONGRESS.read_text())
        cls.congressional = json.loads(portraits.DEFAULT_CATALOG.read_text())
        cls.supplement = json.loads(portraits.DEFAULT_SUPPLEMENT.read_text())
        cls.previous = portraits.build_ledger(cls.current, cls.congressional, cls.supplement["retrievedAtUtc"], cls.supplement)

    def test_all_397_prior_records_preserved_and_new_records_have_real_fec_ids(self):
        combined = portraits.build_ledger(self.current, self.congressional, self.catalog["reviewedAtUtc"], self.supplement, self.catalog)
        self.assertEqual(len(self.previous["records"]), 397)
        self.assertEqual(combined["records"][:397], self.previous["records"])
        self.assertEqual(combined["records"], json.loads((ROOT / "election/candidate-portraits.json").read_text())["records"])
        self.assertEqual(combined["coverage"]["admittedPortraits"], 397 + len(self.catalog["records"]))
        self.assertEqual(combined["coverage"]["candidateCardsWithoutPortraits"], 543 - len(self.catalog["records"]))
        for record in combined["records"][397:]:
            self.assertEqual(record["identityType"], "FEC_CANDIDATE")
            self.assertRegex(record["identityId"], r"^[HS]\d[A-Z]{2}\d{5}$")
            self.assertNotIn("bioguideId", record)

    def test_wrong_name_state_party_chamber_contest_or_source_id_rejected(self):
        for field in ("candidateName", "state", "party", "chamber", "contestId", "sourceCandidateId"):
            catalog = copy.deepcopy(self.catalog)
            catalog["records"][0][field] = "wrong"
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "binding"):
                portraits.reviewed_noncongress(self.current, catalog, [])

    def test_fec_identity_swap_duplicate_and_override_rejected(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["records"][0]["identityId"] = catalog["records"][1]["identityId"]
        with self.assertRaisesRegex(ValueError, "FEC identity"):
            portraits.reviewed_noncongress(self.current, catalog, [])
        catalog = copy.deepcopy(self.catalog)
        catalog["records"].append(copy.deepcopy(catalog["records"][0]))
        with self.assertRaisesRegex(ValueError, "replace or duplicate"):
            portraits.reviewed_noncongress(self.current, catalog, [])
        with self.assertRaisesRegex(ValueError, "replace or duplicate"):
            portraits.reviewed_noncongress(self.current, self.catalog, [self.catalog["records"][0]])

    def test_rights_creator_revision_and_exact_image_url_required(self):
        for field, value in (("license", "Fair use"), ("licenseUrl", "https://example.com/"), ("attribution", ""),
                             ("sourceOriginalImageSha1", "0" * 40), ("url", "https://upload.wikimedia.org/wrong-person.jpg"),
                             ("commonsRevisionId", 1), ("rightsBasis", ""), ("bioguideId", "F999999")):
            catalog = copy.deepcopy(self.catalog)
            catalog["records"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                portraits.reviewed_noncongress(self.current, catalog, [])

    def mutate_evidence(self, key, mutate, expected):
        catalog = copy.deepcopy(self.catalog)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for evidence in catalog["evidenceFiles"].values():
                dest = root / evidence["path"]
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / evidence["path"], dest)
            evidence = catalog["evidenceFiles"][key]
            path = root / evidence["path"]
            data = json.loads(path.read_text())
            mutate(data)
            path.write_text(json.dumps(data))
            evidence["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
            with patch.object(portraits, "ROOT", root), self.assertRaisesRegex(ValueError, expected):
                portraits.reviewed_noncongress(self.current, catalog, [])

    def test_namesake_and_undocumented_alias_fail_even_with_reviewed_roster_binding(self):
        def wrong_legal_name(data):
            data["records"][0]["fecName"] = "EL-SAYED, SOMEONE ELSE"
        self.mutate_evidence("identities", wrong_legal_name, "FEC identity evidence")
        def remove_alias(data):
            record = next(r for r in data["records"] if r["candidateBinding"]["candidateName"] == "Peggy Flanagan")
            record.pop("aliasEvidence")
        self.mutate_evidence("identities", remove_alias, "alias is not documented")

    def test_missing_captured_license_cannot_be_replaced_by_a_catalog_claim(self):
        title = self.catalog["records"][0]["commonsTitle"]
        def remove_rights(data):
            for page in data["result"]["query"]["pages"].values():
                if page["title"] == title:
                    page["imageinfo"][0]["extmetadata"].pop("LicenseShortName")
        self.mutate_evidence("senateCommons", remove_rights, "reuse license")

    def test_house_district_must_match_the_captured_fec_seat(self):
        def wrong_district(data):
            record = next(r for r in data["records"] if r["candidateBinding"]["candidateName"] == "Scott Wiener")
            record["district"] = "12"
        self.mutate_evidence("identities", wrong_district, "House district")


if __name__ == "__main__":
    unittest.main()
