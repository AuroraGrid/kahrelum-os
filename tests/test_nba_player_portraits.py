import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("nba_portraits", ROOT / "scripts/build_nba_player_portraits.py")
nba = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nba)


class NbaPlayerPortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(nba.DEFAULT_CATALOG.read_text(encoding="utf-8"))
        cls.ledger = json.loads(nba.DEFAULT_OUTPUT.read_text(encoding="utf-8"))

    def test_complete_roster_snapshot_reproduces_with_separate_nba_identity(self):
        rebuilt = nba.build_ledger(self.catalog)
        self.assertEqual(rebuilt["coverage"]["teams"], 30)
        self.assertEqual(rebuilt["coverage"]["players"], sum(team["rosterListedPlayers"] for team in self.catalog["teams"]))
        self.assertEqual(rebuilt["coverage"]["players"], rebuilt["coverage"]["uniquePlayerIds"])
        self.assertEqual(rebuilt["coverage"]["identityConflicts"], 0)
        self.assertEqual(rebuilt["coverage"]["verifiedPortraits"] + rebuilt["coverage"]["missingPortraits"], rebuilt["coverage"]["players"])
        self.assertEqual(rebuilt["records"], self.ledger["records"])
        self.assertEqual(self.ledger["sourceCatalogSha256"], hashlib.sha256(nba.DEFAULT_CATALOG.read_bytes()).hexdigest())
        for row in rebuilt["records"]:
            self.assertEqual(row["id"], f"NBA-ESPN-{row['playerId']}")
            self.assertEqual(row["sourceUid"], f"s:40~l:46~a:{row['playerId']}")
            self.assertIsNone(row["portrait"]["license"])
            self.assertEqual(row["portrait"]["rightsStatus"], "RIGHTS_RETAINED_EXTERNAL_EDITORIAL")
            self.assertNotIn("injuries", row)
            self.assertNotIn("forecasts", row)
            self.assertNotIn("dateOfBirth", row)
            self.assertNotIn("contracts", row)

    def test_duplicate_team_and_player_id_fail(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["teams"][1] = copy.deepcopy(catalog["teams"][0])
        with self.assertRaisesRegex(ValueError, "30 unique team"):
            nba.build_ledger(catalog)
        catalog = copy.deepcopy(self.catalog)
        duplicate = copy.deepcopy(catalog["players"][0])
        duplicate["teamId"] = next(team["teamId"] for team in catalog["teams"] if team["teamId"] != duplicate["teamId"])
        catalog["players"].append(duplicate)
        with self.assertRaisesRegex(ValueError, "Duplicate player IDs"):
            nba.build_ledger(catalog)

    def test_source_image_id_and_profile_id_must_match_player(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["headshot"]["url"] = "https://a.espncdn.com/i/headshots/nba/players/full/999999999.png"
        with self.assertRaisesRegex(ValueError, "image URL do not match"):
            nba.build_ledger(catalog)
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["sourceUrl"] = "https://www.espn.com/nba/player/_/id/999999999/wrong-person"
        with self.assertRaisesRegex(ValueError, "profile URL do not match"):
            nba.build_ledger(catalog)

    def test_cross_league_id_and_image_are_rejected(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["sourceUid"] = "s:20~l:28~a:" + catalog["players"][0]["playerId"]
        with self.assertRaisesRegex(ValueError, "not an NBA ESPN source ID"):
            nba.build_ledger(catalog)
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["headshot"]["url"] = catalog["players"][0]["headshot"]["url"].replace("/nba/", "/nfl/")
        with self.assertRaisesRegex(ValueError, "NBA image URL do not match"):
            nba.build_ledger(catalog)

    def test_wrong_alt_and_check_url_are_rejected(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["headshot"]["alt"] = "Different Person"
        with self.assertRaisesRegex(ValueError, "alt text"):
            nba.build_ledger(catalog)
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["imageCheck"]["url"] = "https://a.espncdn.com/wrong.png"
        with self.assertRaisesRegex(ValueError, "different URL"):
            nba.build_ledger(catalog)

    def test_missing_and_unavailable_images_keep_roster_entries(self):
        catalog = copy.deepcopy(self.catalog)
        target = catalog["players"][0]
        target["headshot"] = {"url": None, "alt": None}
        target["imageCheck"] = {"url": None, "status": "SOURCE_IMAGE_MISSING", "checkedAtUtc": catalog["retrievedAtUtc"]}
        ledger = nba.build_ledger(catalog)
        record = next(row for row in ledger["records"] if row["playerId"] == target["playerId"])
        self.assertIsNone(record["portrait"]["url"])
        self.assertEqual(record["portrait"]["status"], "UNRESOLVED")
        self.assertEqual(record["portrait"]["reason"], "SOURCE_IMAGE_MISSING")
        self.assertEqual(ledger["coverage"]["players"], self.ledger["coverage"]["players"])
        catalog = copy.deepcopy(self.catalog)
        target = catalog["players"][0]
        target["imageCheck"]["contentType"] = "text/html"
        ledger = nba.build_ledger(catalog)
        record = next(row for row in ledger["records"] if row["playerId"] == target["playerId"])
        self.assertEqual(record["portrait"]["reason"], "IMAGE_AVAILABILITY_NOT_VERIFIED")
        self.assertIsNone(record["portrait"]["url"])

    def test_unexpected_team_and_missing_source_hash_fail(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["players"][0]["teamId"] = "999999"
        with self.assertRaisesRegex(ValueError, "team is absent"):
            nba.build_ledger(catalog)
        catalog = copy.deepcopy(self.catalog)
        catalog["teams"][0]["receipt"]["contentSha256"] = ""
        with self.assertRaisesRegex(ValueError, "source receipt"):
            nba.build_ledger(catalog)


if __name__ == "__main__":
    unittest.main()
