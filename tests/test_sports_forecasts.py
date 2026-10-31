import copy
import datetime as dt
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sports_forecasts", ROOT / "scripts" / "sports_forecasts.py")
sf = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sf)


class CompleteForecastTests(unittest.TestCase):
    def setUp(self):
        self.board = json.loads((ROOT / "nfl" / "trade-board.json").read_text(encoding="utf-8"))
        self.now = sf.parse_time("2026-10-31T05:00:00Z")
        self.snapshot = sf.build_current_forecasts(self.board, self.now)
        self.rows = {row["candidateId"]: row for row in self.snapshot["forecasts"]}
        historical = json.loads((ROOT / "nfl" / "forecast-ledger.json").read_text(encoding="utf-8"))["historicalExcluded"]
        self.ledger = {"schema": "KAHRELUM_FORECAST_LEDGER_v1.0", "appendOnly": True,
                       "eligibleLocks": [], "outcomeRecords": [], "historicalExcluded": historical}

    def receipt(self):
        return {"repositoryFullName": sf.REPOSITORY, "snapshotPath": sf.SNAPSHOT_PATH,
                "gitCommit": "a" * 40, "commitTimestampUtc": "2026-10-31T05:01:00Z",
                "publiclyObservedAtUtc": "2026-10-31T05:02:00Z", "remoteBytesVerified": True,
                "snapshotSha256": hashlib.sha256(sf.encoded(self.snapshot)).hexdigest(),
                "officialPrelockCheck": {"status": "COMPLETE", "checkedAtUtc": "2026-10-31T05:02:00Z",
                                         "candidateIds": sorted(self.rows), "completedBeforeLockCandidateIds": [],
                                         "eligibleCandidateIds": sorted(key for key, row in self.rows.items() if row["cohortEligible"]),
                                         "excludedCandidateIds": ["K26-062"],
                                         "sourceUrls": ["https://www.nfl.com/transactions/league/trades/2026/10"]}}

    def admit(self, receipt=None, snapshot_bytes=None, ledger=None):
        return sf.admit_public_snapshot(snapshot_bytes or sf.encoded(self.snapshot), receipt or self.receipt(),
                                        self.ledger if ledger is None else ledger, set(self.rows),
                                        sf.parse_time("2026-10-31T05:03:00Z"))

    def test_every_candidate_has_bounded_probability_and_explicit_basis(self):
        self.assertEqual(len(self.rows), 124)
        self.assertEqual(set(self.rows), {row["id"] for row in self.board["candidates"]})
        self.assertEqual(self.snapshot["coverage"]["unpriced"], 0)
        self.assertEqual(self.snapshot["coverage"]["byBasis"], {
            "CARRIED_FORWARD_JUDGMENT": 19, "LOW_INFORMATION_BASELINE": 83,
            "SOURCE_BACKED_JUDGMENT_REVISION": 1, "SOURCE_REVIEWED_STRUCTURED_JUDGMENT": 20,
            "ROSTER_STATUS_NOT_FORECAST": 1})
        self.assertEqual(self.snapshot["eligibleForecastCount"], 123)
        for row in self.rows.values():
            self.assertTrue(0 < row["probability"] < 1 if row["cohortEligible"] else row["probability"] == 0)
            self.assertLessEqual(row["sensitivity"]["low"], row["probability"])
            self.assertGreaterEqual(row["sensitivity"]["high"], row["probability"])
            if row["cohortEligible"]:
                self.assertIn("NOT_CONFIDENCE_INTERVAL", row["sensitivity"]["kind"])
            else:
                self.assertEqual(row["probabilityKind"], "CURRENT_CLUB_TRADE_ELIGIBILITY_STATUS")
            self.assertIsNone(row["outcome"])

    def test_historical_probabilities_preserved_and_payne_revision_is_explicit(self):
        before = copy.deepcopy(self.board)
        sf.build_current_forecasts(self.board, self.now)
        self.assertEqual(before, self.board)
        for candidate in self.board["candidates"]:
            row = self.rows[candidate["id"]]
            self.assertEqual(row["historicalProbabilityPercent"], candidate["kahrelumProbability"])
            if candidate["kahrelumProbability"] is not None and candidate["id"] != "K26-001":
                self.assertEqual(row["probabilityPercent"], candidate["kahrelumProbability"])
                self.assertEqual(row["researchFreshness"], "CARRY_FORWARD_REQUIRES_REVIEW")
        payne = self.rows["K26-001"]
        self.assertEqual(payne["probability"], .02)
        self.assertEqual(payne["historicalProbabilityPercent"], 61)
        self.assertEqual(payne["change"]["percentagePoints"], -59)
        self.assertEqual(payne["factors"]["researchCommit"], sf.PAYNE_NOTE_COMMIT)
        self.assertEqual(payne["informationCutoffUtc"], sf.PAYNE_NOTE_AT)

    def test_external_probability_values_never_influence_kahrelum(self):
        changed = copy.deepcopy(self.board)
        for index, candidate in enumerate(changed["candidates"]):
            candidate["espnProbability"] = 100 if index % 2 else 0
        self.assertEqual(self.snapshot, sf.build_current_forecasts(changed, self.now))

    def test_original_reporting_creates_distinct_estimates_and_traceable_factors(self):
        self.assertGreater(self.rows["K26-046"]["probability"], self.rows["K26-058"]["probability"])
        self.assertNotEqual(self.rows["K26-079"]["probability"], self.rows["K26-030"]["probability"])
        for candidate_id in sf.REVIEWED_FEATURES:
            row = self.rows[candidate_id]
            self.assertIn("features", row["factors"])
            self.assertEqual(row["factors"]["claimStatus"], "ORIGINAL_REPORT_READ_NOT_OFFICIAL_OUTCOME")
            self.assertTrue(row["lastSourceReviewAtUtc"])

    def test_indexed_categories_are_discounted_scenarios_not_verified_features(self):
        market, market_basis = sf.indexed_estimate("REPORTED_MARKET")
        radar, radar_basis = sf.indexed_estimate("ANALYST_RADAR")
        resisting, resisting_basis = sf.indexed_estimate("TEAM_RESISTING")
        self.assertGreater(market, radar)
        self.assertLess(resisting, radar)
        self.assertLess(market, market_basis["conditionalProbability"])
        self.assertGreater(resisting, resisting_basis["conditionalProbability"])
        self.assertEqual(radar_basis["conditionalScenarioFeatures"], {})
        self.assertEqual(sf.indexed_estimate("UNKNOWN")[0], radar)
        self.assertEqual(market_basis["claimStatus"], "INDEXED_SIGNAL_NOT_FIRSTHAND_VERIFIED")

    def test_polling_does_not_renew_research_or_create_a_forecast_edition(self):
        later = sf.build_current_forecasts(self.board, self.now + dt.timedelta(hours=8), previous=self.snapshot)
        self.assertEqual(sf.encoded(later), sf.encoded(self.snapshot))
        self.assertLess(sf.parse_time(self.rows["K26-002"]["informationCutoffUtc"]), self.now)

    def test_accepted_evidence_changes_estimate_and_survives_later_poll(self):
        candidate = next(row for row in self.rows.values() if row["basis"] == "LOW_INFORMATION_BASELINE")
        decision = {"candidateId": candidate["candidateId"], "probability": .31,
                    "status": "ACCEPTED_SOURCE_REVIEW", "informationCutoffUtc": "2026-10-31T06:00:00Z",
                    "reviewedAtUtc": "2026-10-31T06:05:00Z", "sourceUrls": ["https://www.nfl.com/news/test-source"],
                    "rationale": "Controlled newly reviewed report changes the market assessment.",
                    "counterarguments": ["No completed deal or authenticated offer."]}
        revised = sf.build_current_forecasts(self.board, self.now + dt.timedelta(hours=2), self.snapshot, [decision])
        row = next(row for row in revised["forecasts"] if row["candidateId"] == candidate["candidateId"])
        self.assertEqual(row["probability"], .31)
        self.assertEqual(row["change"]["percentagePoints"], 20)
        self.assertTrue(row["change"]["material"])
        self.assertEqual(row["sourceStatus"], "ACCEPTED_SOURCE_REVIEW")
        again = sf.build_current_forecasts(self.board, self.now + dt.timedelta(hours=3), previous=revised)
        self.assertEqual(sf.encoded(revised), sf.encoded(again))
        self.assertEqual(candidate["probability"], .11)

    def test_unreviewed_or_future_evidence_cannot_change_estimates(self):
        decision = {"candidateId": "K26-021", "probability": .31, "status": "PROPOSAL_READY",
                    "informationCutoffUtc": "2026-10-31T06:00:00Z", "reviewedAtUtc": "2026-10-31T06:05:00Z",
                    "sourceUrls": ["https://www.nfl.com/news/test-source"], "rationale": "A test report.",
                    "counterarguments": ["No completed trade."]}
        with self.assertRaises(ValueError):
            sf.build_current_forecasts(self.board, self.now, self.snapshot, [decision])
        decision["status"] = "ACCEPTED_SOURCE_REVIEW"
        with self.assertRaises(ValueError):
            sf.build_current_forecasts(self.board, self.now, self.snapshot, [decision])

    def test_admission_keeps_full_denominator_and_all_historical_exclusions(self):
        before = copy.deepcopy(self.ledger)
        result = self.admit()
        self.assertEqual(self.ledger, before)
        self.assertEqual(result["historicalExcluded"], before["historicalExcluded"])
        self.assertEqual(result["outcomeRecords"], [])
        self.assertEqual(len(result["eligibleLocks"]), 123)
        self.assertEqual([row["candidateId"] for row in result["cohortExclusions"]], ["K26-062"])
        self.assertFalse(result["cohortExclusions"][0]["scoringEligible"])
        self.assertNotIn("K26-062", {row["candidateId"] for row in result["eligibleLocks"]})
        previous_hash = None
        for event in result["eligibleLocks"]:
            self.assertEqual(event["previousRecordHash"], previous_hash)
            self.assertEqual(event["recordHash"], sf.engine.digest({key: value for key, value in event.items() if key != "recordHash"}))
            self.assertEqual(event["publicationTimestampUtc"], "2026-10-31T05:02:00Z")
            self.assertEqual(event["cohortSize"], 123)
            self.assertEqual(event["snapshotCandidateCount"], 124)
            self.assertFalse(event["historicalForecastAuthenticated"])
            self.assertIsNone(event["outcome"])
            previous_hash = event["recordHash"]

    def test_release_is_status_only_and_cannot_be_promoted_by_a_forecast_decision(self):
        jones = self.rows["K26-062"]
        self.assertEqual(jones["team"], "FA")
        self.assertEqual(jones["probabilityPercent"], 0)
        self.assertFalse(jones["cohortEligible"])
        self.assertEqual(jones["scoringStatus"], "EXCLUDED_OFFICIAL_RELEASE_BEFORE_LOCK")
        self.assertIn("not a forecast", jones["rationale"])
        with self.assertRaisesRegex(ValueError, "eligibility review"):
            sf.validate_decision({"candidateId": "K26-062"}, set(self.rows), self.now)
        receipt = self.receipt()
        receipt["officialPrelockCheck"]["eligibleCandidateIds"].append("K26-062")
        receipt["officialPrelockCheck"]["excludedCandidateIds"] = []
        with self.assertRaisesRegex(ValueError, "partition"):
            self.admit(receipt=receipt)

    def test_admission_rejects_modified_bytes_and_unverified_remote_snapshot(self):
        with self.assertRaisesRegex(ValueError, "bytes"):
            self.admit(snapshot_bytes=sf.encoded(self.snapshot) + b" ")
        receipt = self.receipt()
        receipt["remoteBytesVerified"] = False
        with self.assertRaisesRegex(ValueError, "remote bytes"):
            self.admit(receipt=receipt)

    def test_admission_rejects_incomplete_cohort_and_prelock_completed_player(self):
        receipt = self.receipt()
        receipt["officialPrelockCheck"]["candidateIds"].pop()
        with self.assertRaisesRegex(ValueError, "entire cohort"):
            self.admit(receipt=receipt)
        receipt = self.receipt()
        receipt["officialPrelockCheck"]["completedBeforeLockCandidateIds"] = ["K26-001"]
        with self.assertRaisesRegex(ValueError, "pre-lock"):
            self.admit(receipt=receipt)
        incomplete = copy.deepcopy(self.snapshot)
        incomplete["forecasts"].pop()
        incomplete["candidateCount"] -= 1
        with self.assertRaisesRegex(ValueError, "denominator"):
            sf.validate_snapshot(incomplete, set(self.rows))

    def test_admission_rejects_backdating_future_publication_and_stale_check(self):
        for key, value in [("commitTimestampUtc", "2026-10-30T05:01:00Z"),
                           ("publiclyObservedAtUtc", "2026-11-10T21:00:00Z"),
                           ("publiclyObservedAtUtc", "2026-10-31T06:00:00Z")]:
            receipt = self.receipt()
            receipt[key] = value
            with self.assertRaises(ValueError):
                self.admit(receipt=receipt)
        receipt = self.receipt()
        receipt["officialPrelockCheck"]["checkedAtUtc"] = "2026-10-29T05:00:00Z"
        with self.assertRaisesRegex(ValueError, "stale"):
            self.admit(receipt=receipt)

    def test_admission_rejects_duplicate_player_locks_and_nonofficial_check(self):
        admitted = self.admit()
        with self.assertRaisesRegex(ValueError, "admitted twice"):
            self.admit(ledger=admitted)
        receipt = self.receipt()
        receipt["officialPrelockCheck"]["sourceUrls"] = ["https://nfl.com.example.org/transactions"]
        with self.assertRaisesRegex(ValueError, "original NFL"):
            self.admit(receipt=receipt)


if __name__ == "__main__":
    unittest.main()
