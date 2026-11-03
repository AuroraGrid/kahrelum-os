import copy, json, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.build_candidate_portraits import build_ledger
def read(p):return json.loads((ROOT/p).read_text(encoding="utf-8"))
class SharedCommonsTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.current=read("election/current-projections.json")
  cls.catalog=read("research/candidate-portraits/congressional-sources-2026-10-31.json")
  cls.supplement=read("research/candidate-portraits/supplemental-sources-2026-10-31.json")
  cls.noncongress=read("research/candidate-portraits/noncongress-sources-2026-10-31.json")
  cls.licensed=read("research/candidate-portraits/licensed-sources-2026-11-02.json")
  cls.local=read("research/candidate-portraits/local-sources-2026-11-02.json")
  cls.aliases=read("research/candidate-portraits/documented-aliases-2026-11-03.json")
  cls.shared=read("research/candidate-portraits/shared-commons-sources-2026-11-03.json")
 def rebuilt(self,shared=None):
  return build_ledger(self.current,self.catalog,self.shared["reviewedAtUtc"],
    self.supplement,self.noncongress,self.licensed,self.local,self.aliases,shared=shared)
 def test_admits_26_while_preserving_all_432(self):
  before=self.rebuilt()
  after=self.rebuilt(self.shared)
  self.assertEqual(before["coverage"]["admittedPortraits"],432)
  self.assertEqual(after["coverage"]["admittedPortraits"],458)
  self.assertEqual(after["coverage"]["candidateCardsWithoutPortraits"],482)
  self.assertEqual(after["records"][:432],before["records"])
  self.assertEqual(len([x for x in after["records"] if x.get("identityType")=="FEC_ENWIKI_SHARED_COMMONS"]),26)
  self.assertIn(23489,{x["sourceCandidateId"] for x in after["unresolved"]})
 def test_tampered_original_image_hash_fails(self):
  src=copy.deepcopy(self.shared);src["records"][0]["imageSha256"]="0"*64
  with self.assertRaises(ValueError):self.rebuilt(src)
 def test_wrong_candidate_binding_fails(self):
  src=copy.deepcopy(self.shared);src["records"][0]["contestId"]="AA-0"
  with self.assertRaises(ValueError):self.rebuilt(src)
 def test_wrong_fec_source_identity_fails(self):
  src=copy.deepcopy(self.shared);src["records"][0]["fecCandidateId"]="H6ZZ00000"
  with self.assertRaises(ValueError):self.rebuilt(src)
 def test_license_tamper_fails(self):
  src=copy.deepcopy(self.shared);src["records"][0]["license"]="Fair use"
  with self.assertRaises(ValueError):self.rebuilt(src)
 def test_duplicate_record_fails(self):
  src=copy.deepcopy(self.shared);src["records"].append(copy.deepcopy(src["records"][0]))
  with self.assertRaises(ValueError):self.rebuilt(src)
if __name__=="__main__":unittest.main()
