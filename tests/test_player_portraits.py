import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("player_portraits", ROOT / "scripts/build_player_portraits.py")
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)


class PlayerPortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(portraits.DEFAULT_CATALOG.read_text())
        cls.board = json.loads((ROOT / "nfl/trade-board.json").read_text())

    def test_complete_real_board_coverage_with_supplied_headshots(self):
        ledger = portraits.build_ledger(self.board, self.catalog)
        self.assertEqual(ledger["coverage"]["candidateRecords"], 124)
        self.assertEqual(ledger["coverage"]["verifiedPortraits"], 124)
        self.assertEqual(ledger["coverage"]["uniquePlayersWithPortraits"], 124)
        self.assertEqual(ledger["coverage"]["reachablePortraitUrls"], 124)
        self.assertEqual(ledger["unresolved"], [])
        captured = {p["sourcePlayerId"]: p for p in self.catalog["players"]}
        for record in ledger["records"]:
            self.assertEqual(record["url"], captured[record["sourcePlayerId"]]["url"])
            self.assertIsNone(record["license"])
            self.assertEqual(record["rightsStatus"], "RIGHTS_RETAINED_EXTERNAL_EDITORIAL")

    def test_wrong_team_or_position_cannot_reuse_a_person(self):
        player = {"name": "Daron Payne", "team": "WAS", "pos": "DT"}
        self.assertEqual(len(portraits.find_matches(player, self.catalog)), 1)
        self.assertEqual(portraits.find_matches({**player, "team": "MIA"}, self.catalog), [])
        self.assertEqual(portraits.find_matches({**player, "pos": "QB"}, self.catalog), [])

    def test_documented_aliases_and_reviewed_spelling_correction_only(self):
        for name, team, position, identity in [
            ("Marquise Brown", "PHI", "WR", "4241372"),
            ("Josh Palmer", "BUF", "WR", "4242433"),
            ("Khalil Benson", "KC", "OT", "4566190"),
            ("Kahlil Benson", "KC", "OT", "4566190"),
        ]:
            matches = portraits.find_matches({"name": name, "team": team, "pos": position}, self.catalog)
            self.assertEqual([m["sourcePlayerId"] for m in matches], [identity])
        self.assertEqual(portraits.find_matches({"name": "Khalil Bensen", "team": "KC", "pos": "OT"}, self.catalog), [])
        unreviewed = copy.deepcopy(self.catalog)
        unreviewed["aliases"] = []
        self.assertEqual(portraits.find_matches({"name": "Josh Palmer", "team": "BUF", "pos": "WR"}, unreviewed), [])

    def test_jack_jones_keeps_free_agent_state_and_release_provenance(self):
        ledger = portraits.build_ledger(self.board, self.catalog)
        jack = next(r for r in ledger["records"] if r["candidateId"] == "K26-062")
        self.assertEqual(jack["sourceTeam"], "FA")
        self.assertEqual(jack["sourceRosterStatus"], "FREE_AGENT")
        self.assertEqual(jack["statusEvidence"]["effectiveDate"], "2026-10-28")
        self.assertIn("49ers.com/news/", jack["statusEvidence"]["sourceUrl"])
        self.assertEqual(jack["sourcePlayerId"], "4035686")
        self.assertEqual(ledger["coverage"]["freeAgentPlayers"], 1)
        current = {"name": "Jack Jones", "team": "FA", "pos": "CB"}
        self.assertEqual(len(portraits.find_matches(current, self.catalog)), 1)

    def test_ambiguity_and_missing_image_are_not_silently_filled(self):
        candidate = self.board["candidates"][0]
        catalog = copy.deepcopy(self.catalog)
        identity = portraits.find_matches(candidate, catalog)[0]
        catalog["identityIndex"].append({**identity, "sourcePlayerId": "99999999"})
        ledger = portraits.build_ledger(self.board, catalog)
        self.assertEqual(next(r for r in ledger["unresolved"] if r["candidateId"] == candidate["id"])["reason"], "AMBIGUOUS_IDENTITY")
        catalog = copy.deepcopy(self.catalog)
        catalog["players"] = [p for p in catalog["players"] if p["sourcePlayerId"] != identity["sourcePlayerId"]]
        ledger = portraits.build_ledger(self.board, catalog)
        self.assertEqual(next(r for r in ledger["unresolved"] if r["candidateId"] == candidate["id"])["reason"], "NO_REVIEWED_IMAGE")

    def test_changed_headshot_identity_is_rejected(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["url"] = "https://a.espncdn.com/i/headshots/nfl/players/full/99999999.png"
        with self.assertRaisesRegex(ValueError, "Invalid source-supplied"):
            portraits.build_ledger(self.board, catalog)

    def test_photo_availability_check_must_belong_to_the_current_url(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["imageCheck"]["url"] = "https://example.com/different.png"
        ledger = portraits.build_ledger(self.board, catalog)
        self.assertEqual(ledger["coverage"]["verifiedPortraits"], 123)
        self.assertEqual(ledger["unresolved"][0]["reason"], "IMAGE_AVAILABILITY_NOT_VERIFIED")


if __name__ == "__main__":
    unittest.main()
