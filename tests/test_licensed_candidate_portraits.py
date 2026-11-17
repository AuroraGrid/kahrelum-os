import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("candidate_portraits",ROOT/"scripts/build_candidate_portraits.py")
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class LicensedPortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.current=json.loads((ROOT/"election/current-projections.json").read_text(encoding="utf-8"))
        cls.existing=json.loads((ROOT/"election/candidate-portraits.json").read_text(encoding="utf-8"))
        cls.catalog=json.loads((ROOT/"research/candidate-portraits/licensed-sources-2026-11-02.json").read_text(encoding="utf-8"))

    def test_three_exact_new_identifiable_portraits_are_admitted(self):
        result=builder.reviewed_licensed(self.current,self.catalog,self.existing["records"][:421])
        self.assertEqual({x["sourceCandidateId"] for x in result},{20269,20159,17006})
        self.assertTrue(all(x["status"]=="ADMITTED" and x["url"].startswith("/assets/") for x in result))
        self.assertTrue(all(x["imageSha256"] for x in result))

    def test_wrong_roster_binding_cannot_be_admitted(self):
        for field,bad in [("candidateName","Not Hallie"),("state","CA"),("party","R"),("chamber","House"),("contestId","AR-01"),("sourceCandidateId",99999)]:
            changed=copy.deepcopy(self.catalog)
            changed["records"][0][field]=bad
            with self.subTest(field=field),self.assertRaises(ValueError):
                builder.reviewed_licensed(self.current,changed,self.existing["records"][:421])

    def test_bad_licenses_image_hash_and_source_urls_are_rejected(self):
        for field,bad in [("license","All rights reserved"),("licenseUrl","https://example.com"),("imageSha256","0"*64),("sourceUrl","https://example.org/photo.jpg"),("sourceImageUrl","https://example.org/bad.jpg"),("url","/wrong.jpg"),("attribution","")]:
            changed=copy.deepcopy(self.catalog)
            changed["records"][0][field]=bad
            with self.subTest(field=field),self.assertRaises(ValueError):
                builder.reviewed_licensed(self.current,changed,self.existing["records"][:421])

    def test_duplicate_record_and_credit_evidence_tampering_are_rejected(self):
        changed=copy.deepcopy(self.catalog)
        changed["records"].append(copy.deepcopy(changed["records"][0]))
        with self.assertRaises(ValueError):
            builder.reviewed_licensed(self.current,changed,self.existing["records"][:421])
        changed=copy.deepcopy(self.catalog)
        changed["bindingEvidence"]["sha256"]="0"*64
        with self.assertRaises(ValueError):
            builder.reviewed_licensed(self.current,changed,self.existing["records"][:421])

    def test_cannot_replace_previously_admitted_portrait(self):
        changed=copy.deepcopy(self.catalog)
        already=self.existing["records"][0]
        changed["records"][0]["sourceCandidateId"]=already["sourceCandidateId"]
        with self.assertRaises(ValueError):
            builder.reviewed_licensed(self.current,changed,self.existing["records"][:421])

if __name__=="__main__":
    unittest.main()
