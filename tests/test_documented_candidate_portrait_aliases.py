import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.build_candidate_portraits import build_ledger


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class DocumentedCongressionalAliasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.current = read("election/current-projections.json")
        cls.congress = read("research/candidate-portraits/congressional-sources-2026-10-31.json")
        cls.supplement = read("research/candidate-portraits/supplemental-sources-2026-10-31.json")
        cls.noncongress = read("research/candidate-portraits/noncongress-sources-2026-10-31.json")
        cls.licensed = read("research/candidate-portraits/licensed-sources-2026-11-02.json")
        cls.local = read("research/candidate-portraits/local-sources-2026-11-02.json")
        cls.aliases = read("research/candidate-portraits/documented-aliases-2026-11-03.json")

    def ledger(self, aliases=None):
        return build_ledger(self.current, self.congress, self.aliases["reviewedAtUtc"],
                            self.supplement, self.noncongress, self.licensed,
                            self.local, aliases=aliases)

    def test_three_first_party_aliases_increase_count_without_changing_429(self):
        prior = self.ledger()
        fresh = self.ledger(self.aliases)
        self.assertEqual(prior["coverage"]["admittedPortraits"], 429)
        self.assertEqual(fresh["coverage"]["admittedPortraits"], 432)
        self.assertEqual(fresh["coverage"]["candidateCardsWithoutPortraits"], 508)
        self.assertEqual(fresh["records"][:429], prior["records"])
        newcomers = {r["sourceCandidateId"]: r for r in fresh["records"][429:]}
        self.assertEqual(set(newcomers), {16266, 23012, 23094})
        self.assertEqual([newcomers[i]["bioguideId"] for i in (16266, 23012, 23094)],
                         ["K000398", "O000176", "L000598"])
        self.assertIn(23489, {r["sourceCandidateId"] for r in fresh["unresolved"]})
        self.assertNotIn("S001198", {r["bioguideId"] for r in newcomers.values()})

    def test_rejects_another_person_image(self):
        data = copy.deepcopy(self.aliases)
        data["records"][0]["bioguideId"] = "S001198"
        with self.assertRaises(ValueError):
            self.ledger(data)

    def test_rejects_changed_capture_receipt(self):
        data = copy.deepcopy(self.aliases)
        data["records"][1]["capture"]["sha256"] = "0" * 64
        with self.assertRaises(ValueError):
            self.ledger(data)

    def test_rejects_candidate_or_contest_switch(self):
        data = copy.deepcopy(self.aliases)
        data["records"][2]["contestId"] = "NY-2"
        with self.assertRaises(ValueError):
            self.ledger(data)

    def test_rejects_unsubstantiated_phrase(self):
        data = copy.deepcopy(self.aliases)
        data["records"][0]["evidencePhrases"].append("Anonymous unrelated person")
        with self.assertRaises(ValueError):
            self.ledger(data)


if __name__ == "__main__":
    unittest.main()
