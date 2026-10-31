import argparse
import importlib.util
import json
import tempfile
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sports_intelligence", ROOT / "scripts" / "sports_intelligence.py")
si = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(si)


RSS_ONE = b'''<?xml version="1.0"?><rss version="2.0"><channel><item><title>Example player trade inquiry reported</title><link>https://example.com/report?utm_source=test</link><pubDate>Fri, 30 Oct 2026 16:00:00 GMT</pubDate></item></channel></rss>'''
RSS_TWO = b'''<?xml version="1.0"?><rss version="2.0"><channel><item><title>Example player trade inquiry reported</title><link>https://example.com/report?utm_source=test</link><pubDate>Fri, 30 Oct 2026 16:00:00 GMT</pubDate></item><item><title>Team trades Example Player according to a feed headline</title><link>https://example.com/unverified-transaction</link><pubDate>Fri, 30 Oct 2026 17:00:00 GMT</pubDate></item></channel></rss>'''
TRANSACTION_HTML = b'''<!doctype html><html><h2>October 2026</h2><table class="d3-o-table"><tbody><tr><td>Titans</td><td>Bears</td><td>10/29</td><td>Official Player</td><td>DT</td><td>Traded</td></tr></tbody></table></html>'''


class SportsIntelligenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        (root / "nfl").mkdir()
        board = json.loads((ROOT / "nfl" / "trade-board.json").read_text(encoding="utf-8"))
        (root / "nfl" / "trade-board.json").write_text(json.dumps(board), encoding="utf-8")
        si.ROOT = root
        si.NFL = root / "nfl"
        si.PATHS = {key: si.NFL / path.name for key, path in si.PATHS.items()}
        si.bootstrap()
        self.fixtures = root / "fixtures"
        self.fixtures.mkdir()
        for integration in si.INTEGRATIONS:
            body = TRANSACTION_HTML if integration["type"] == "official_transactions" else RSS_ONE
            (self.fixtures / f"{integration['id']}.xml").write_bytes(body)

    def tearDown(self):
        self.tmp.cleanup()

    def read(self, name):
        return json.loads(si.PATHS[name].read_text(encoding="utf-8"))

    def test_controlled_change_is_detected_and_deduplicated(self):
        now = si.parse_time("2026-10-30T18:00:00Z")
        self.assertEqual(si.ingest(now, self.fixtures), 0)
        first = self.read("status")
        self.assertEqual(first["observationsNew"], 2)
        self.assertEqual(first["duplicatesSuppressed"], 35)
        self.assertEqual(len(self.read("observations")["observations"]), 2)
        self.assertEqual(si.ingest(si.parse_time("2026-10-30T19:00:00Z"), self.fixtures), 0)
        self.assertEqual(self.read("status")["observationsNew"], 0)
        (self.fixtures / "NBC_PFT_RSS.xml").write_bytes(RSS_TWO)
        self.assertEqual(si.ingest(si.parse_time("2026-10-30T20:00:00Z"), self.fixtures), 0)
        self.assertEqual(self.read("status")["observationsNew"], 1)
        self.assertEqual(len(self.read("observations")["observations"]), 3)

    def test_unverified_transaction_headline_cannot_become_fact(self):
        (self.fixtures / "NBC_PFT_RSS.xml").write_bytes(RSS_TWO)
        si.ingest(si.parse_time("2026-10-30T20:00:00Z"), self.fixtures)
        observation = next(x for x in self.read("observations")["observations"] if "unverified-transaction" in x["originalUrl"])
        self.assertEqual(observation["evidenceClass"], "UNVERIFIED")
        self.assertEqual(observation["reviewStatus"], "REVIEW_REQUIRED")
        self.assertTrue(observation["publicationGate"].startswith("BLOCKED"))
        self.assertEqual(self.read("public")["publishedUpdates"], [])

    def test_failure_is_recorded_as_stale_not_success(self):
        si.ingest(si.parse_time("2026-10-30T18:00:00Z"), self.fixtures)
        successful = self.read("status")["lastSuccessfulSourceCheckAt"]
        empty = si.ROOT / "empty"
        empty.mkdir()
        self.assertEqual(si.ingest(si.parse_time("2026-10-30T19:00:00Z"), empty), 2)
        status = self.read("status")
        self.assertEqual(status["feedFreshness"], "STALE_FAILED")
        self.assertEqual(status["sourcesSucceeded"], 0)
        self.assertEqual(status["lastSuccessfulSourceCheckAt"], successful)

    def test_monitoring_rolls_to_november_and_accepts_verified_empty_month(self):
        (self.fixtures / "NFL_TRANSACTIONS.xml").write_bytes(b'<h2>November 2026</h2><table class="d3-o-table"></table>')
        self.assertEqual(si.ingest(si.parse_time("2026-11-01T12:00:00Z"), self.fixtures), 0)
        registry = self.read("registry")
        official = next(row for row in registry["operationalIntegrations"] if row["id"] == "NFL_TRANSACTIONS")
        self.assertTrue(official["url"].endswith("/2026/11"))
        self.assertEqual(self.read("status")["sourcesSucceeded"], 37)
        (self.fixtures / "NFL_TRANSACTIONS.xml").write_bytes(b'<h2>January 2026</h2><table class="d3-o-table"></table>')
        si.ingest(si.parse_time("2026-11-01T12:05:00Z"), self.fixtures)
        self.assertEqual(self.read("status")["sourcesFailed"], 1)

    def test_forecast_revision_preserves_original_lock(self):
        lock = argparse.Namespace(event_id="TEST-1", player="Example Player", probability="0.40", question="Will Example Player be traded before the deadline?", deadline="2026-11-10T21:00:00Z", cutoff="2026-10-30T18:00:00Z", published_at="2026-10-30T18:01:00Z", commit="a" * 40, evidence=["https://example.com/original"], counterargument="No verified offer")
        si.lock_forecast(lock)
        original = self.read("ledger")["eligibleLocks"][0].copy()
        revise = argparse.Namespace(event_id="TEST-1", probability="0.55", cutoff="2026-10-31T18:00:00Z", published_at="2026-10-31T18:01:00Z", commit="b" * 40, rationale="New attributable report", counterargument="Team may retain player")
        si.revise_forecast(revise)
        event = self.read("ledger")["eligibleLocks"][0]
        self.assertEqual(event["originalProbability"], 0.40)
        self.assertEqual(event["publicationTimestampUtc"], original["publicationTimestampUtc"])
        self.assertEqual(event["recordHash"], original["recordHash"])
        self.assertEqual(event["revisions"][0]["probability"], 0.55)
        self.assertEqual(event["revisions"][0]["previousRecordHash"], original["recordHash"])
        si.validate()

    def test_deadline_closes_monitoring_and_audit_remains_fail_closed(self):
        si.ingest(si.parse_time("2026-11-12T15:00:00Z"), self.fixtures)
        status = self.read("status")
        self.assertEqual(status["monitoringState"], "DEADLINE_WINDOW_CLOSED")
        self.assertEqual(status["sourcesAttempted"], 0)
        audit = self.read("audit")
        self.assertEqual(audit["status"], "INSUFFICIENT_ELIGIBLE_SAMPLE")
        self.assertIsNone(audit["brierScore"])

    def test_deadline_audit_requires_complete_official_tables_and_scores_non_trades(self):
        for event_id, player, probability, suffix in (("TRADE", "Official Player", "0.80", "a"), ("STAY", "Staying Player", "0.20", "b")):
            si.lock_forecast(argparse.Namespace(event_id=event_id, player=player, probability=probability, question=f"Will {player} be traded before the deadline?", deadline="2026-11-10T21:00:00Z", cutoff="2026-10-30T18:00:00Z", published_at="2026-10-30T18:01:00Z", commit=suffix * 40, evidence=["https://example.com/original"], counterargument="No verified agreement"))
        audit_fixtures = si.ROOT / "audit-fixtures"
        audit_fixtures.mkdir()
        (audit_fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML)
        (audit_fixtures / "NFL_TRANSACTIONS_2026_11.html").write_bytes(b"<h2>November 2026</h2>" + TRANSACTION_HTML.replace(b"10/29", b"11/04"))
        si.ingest(si.parse_time("2026-11-12T15:00:00Z"), audit_fixtures)
        audit = self.read("audit")
        outcomes = {item["eventId"]: item for item in self.read("ledger")["outcomeRecords"]}
        self.assertEqual(outcomes["TRADE"]["value"], 1)
        self.assertEqual(outcomes["STAY"]["value"], 0)
        self.assertEqual(audit["status"], "COMPLETE")
        self.assertEqual(audit["eligibleForecasts"], 2)
        self.assertAlmostEqual(audit["brierScore"], 0.04)
        self.assertEqual(len(audit["officialSources"]), 2)

    def test_deadline_audit_does_not_infer_negative_outcomes_from_partial_custody(self):
        si.lock_forecast(argparse.Namespace(event_id="PARTIAL", player="Staying Player", probability="0.20", question="Will Staying Player be traded before the deadline?", deadline="2026-11-10T21:00:00Z", cutoff="2026-10-30T18:00:00Z", published_at="2026-10-30T18:01:00Z", commit="f" * 40, evidence=["https://example.com/original"], counterargument="No verified agreement"))
        audit_fixtures = si.ROOT / "partial-audit-fixtures"
        audit_fixtures.mkdir()
        (audit_fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML)
        with self.assertRaises(si.FetchFailure):
            si.ingest(si.parse_time("2026-11-12T15:00:00Z"), audit_fixtures)
        self.assertEqual(self.read("ledger")["outcomeRecords"], [])
        self.assertEqual(self.read("audit")["status"], "FAILED_OFFICIAL_OUTCOME_RETRIEVAL")
        self.assertIsNone(self.read("audit")["brierScore"])

    def test_month_fallback_and_player_aliases_fail_safely(self):
        with self.assertRaises(ValueError):
            si.validate_transaction_calendar(b'<h2>January 2026</h2><table class="d3-o-table"></table>', "11", [])
        with self.assertRaises(ValueError):
            si.validate_transaction_calendar(b'<select><option>November 2026</option></select><h2>January 2026</h2>', "11", [])
        si.validate_transaction_calendar(b'<h2>November 2026</h2><table class="d3-o-table"></table>', "11", [])
        self.assertEqual(si.player_identity_key("Tariq Woolen"), si.player_identity_key("Riq Woolen"))
        self.assertEqual(si.player_identity_key("Jarvis Brownlee Jr."), si.player_identity_key("Jarvis Brownlee"))
        self.assertEqual(si.player_identity_key("Joshua Palmer"), si.player_identity_key("Josh Palmer"))
        self.assertNotEqual(si.player_identity_key("Jack Jones"), si.player_identity_key("Mac Jones"))

    def test_publishing_preserves_provenance_and_requires_review(self):
        public = self.read("public")
        public["publishedUpdates"] = [{"evidenceClass": "FACT", "headline": "Controlled verified update", "sourceUrl": "https://example.com/official"}]
        si.write_json(si.PATHS["public"], public)
        si.generate_publishing()
        output = self.read("publishing")
        self.assertIn("https://example.com/official", output["articleDraft"])
        self.assertFalse(output["publishingAuthorized"])

    def test_editorial_approval_and_publication_authorization_are_distinct(self):
        si.ingest(si.parse_time("2026-10-30T18:00:00Z"), self.fixtures)
        observation = next(x for x in self.read("observations")["observations"] if x["sourceIntegrationId"] == "NBC_PFT_RSS")
        args = argparse.Namespace(observation_id=observation["id"], evidence_class="REPORT", headline="Reviewed attributable report", claim="A reporter described an inquiry; no offer was established.", source_url=observation["originalUrl"], reviewed_at="2026-10-30T18:30:00Z", reviewed_by="TEST_REVIEWER", material=True)
        si.approve_observation(args)
        self.assertEqual(self.read("public")["publishedUpdates"], [])
        self.assertEqual(next(x for x in self.read("queue")["items"] if x["observationId"] == observation["id"])["status"], "EDITOR_APPROVED")
        si.publish_observation(argparse.Namespace(observation_id=observation["id"], published_at="2026-10-30T18:35:00Z", authorized_by="TEST_OWNER"))
        update = self.read("public")["publishedUpdates"][0]
        self.assertEqual(update["sourceUrl"], observation["originalUrl"])
        self.assertFalse(update["automaticallyPublished"])
        self.assertFalse(self.read("publishing")["publishingAuthorized"])
        self.assertEqual(len(self.read("public")["materialAlerts"]), 1)

    def test_official_transaction_table_is_fact_but_still_editor_gated(self):
        si.ingest(si.parse_time("2026-10-30T18:00:00Z"), self.fixtures)
        item = next(x for x in self.read("observations")["observations"] if x["sourceIntegrationId"] == "NFL_TRANSACTIONS")
        self.assertEqual(item["evidenceClass"], "FACT")
        self.assertEqual(item["claimType"], "OFFICIAL_COMPLETED_TRANSACTION")
        self.assertEqual(item["publicationGate"], "BLOCKED_PENDING_EDITOR_APPROVAL")
        self.assertEqual(self.read("public")["publishedUpdates"], [])

    def test_transient_202_is_retried_not_counted_as_success(self):
        class Response:
            def __init__(self, status, body):
                self.status = status
                self.body = body
                self.headers = {}
            def __enter__(self): return self
            def __exit__(self, *_): return False
            def read(self, *_): return self.body
        with mock.patch.object(si.urllib.request, "urlopen", side_effect=[Response(202, b""), Response(200, RSS_ONE)]):
            result = si.fetch("https://example.com/feed", sleeper=lambda _: None)
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["attempts"], 2)

    def test_forecast_proposal_probability_is_reproducible(self):
        features = {"confirmedTradeRequest": True, "sellerPosture": True, "expiringContract": True, "buyerFitOrReducedRole": True}
        self.assertEqual(si.structured_forecast_probability(features), 0.57)
        with self.assertRaises(ValueError):
            si.structured_forecast_probability({"inventedSignal": True})

    def test_late_or_wrong_deadline_forecast_lock_is_rejected(self):
        base = dict(event_id="LATE", player="Late Player", probability="0.40", question="Will Late Player be traded?", cutoff="2026-11-10T20:00:00Z", published_at="2026-11-10T21:01:00Z", commit="e" * 40, evidence=["https://example.com/report"], counterargument="No verified agreement")
        with self.assertRaises(ValueError):
            si.lock_forecast(argparse.Namespace(**base, deadline="2026-11-10T21:00:00Z"))
        base["published_at"] = "2026-11-10T20:01:00Z"
        with self.assertRaises(ValueError):
            si.lock_forecast(argparse.Namespace(**base, deadline="2026-11-10T20:00:00Z"))

    def test_scoring_uses_all_eligible_resolved_events(self):
        for event_id, player, probability, suffix in (("YES", "Yes Player", "0.80", "c"), ("NO", "No Player", "0.20", "d")):
            si.lock_forecast(argparse.Namespace(event_id=event_id, player=player, probability=probability, question=f"Will {player} be traded?", deadline="2026-11-10T21:00:00Z", cutoff="2026-10-30T18:00:00Z", published_at="2026-10-30T18:01:00Z", commit=suffix * 40, evidence=["https://example.com/report"], counterargument="No verified agreement"))
        audit_fixtures = si.ROOT / "all-cohort-fixtures"
        audit_fixtures.mkdir()
        (audit_fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML)
        (audit_fixtures / "NFL_TRANSACTIONS_2026_11.html").write_bytes(b"<h2>November 2026</h2>" + TRANSACTION_HTML.replace(b"10/29", b"11/04").replace(b"Official Player", b"Yes Player"))
        si.retrieve_official_outcomes(si.parse_time("2026-11-12T15:00:00Z"), audit_fixtures)
        audit = si.run_audit(si.parse_time("2026-11-12T15:00:00Z"))
        self.assertEqual(audit["eligibleForecasts"], 2)
        self.assertAlmostEqual(audit["brierScore"], 0.04)
        self.assertAlmostEqual(audit["allNoBaselineBrier"], 0.5)
        self.assertEqual(audit["correctTrades"], 1)
        self.assertEqual(audit["correctNonTrades"], 1)
        si.validate()

    def test_prelock_trade_is_not_a_prospective_win(self):
        si.lock_forecast(argparse.Namespace(event_id="EARLY", player="Official Player", probability="0.8", question="Future trade only", deadline=si.iso(si.DEADLINE), cutoff="2026-10-31T04:00:00Z", published_at="2026-10-31T04:01:00Z", commit="a" * 40, evidence=["https://www.nfl.com/transactions/"], counterargument="May stay"))
        fixtures = si.ROOT / "early-outcomes"
        fixtures.mkdir()
        (fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML)
        (fixtures / "NFL_TRANSACTIONS_2026_11.html").write_bytes(b'<h2>November 2026</h2><table class="d3-o-table"><tbody></tbody></table>')
        si.retrieve_official_outcomes(si.AUDIT_AT, fixtures)
        self.assertEqual(self.read("ledger")["outcomeRecords"][0]["value"], 0)

    def test_date_only_deadline_trade_and_partial_cohort_do_not_score(self):
        for event_id, player in (("BOUNDARY", "Official Player"), ("STAY", "Staying Player")):
            si.lock_forecast(argparse.Namespace(event_id=event_id, player=player, probability="0.2", question="Future trade only", deadline=si.iso(si.DEADLINE), cutoff="2026-10-31T04:00:00Z", published_at="2026-10-31T04:01:00Z", commit="a" * 40, evidence=["https://www.nfl.com/transactions/"], counterargument="May stay"))
        fixtures = si.ROOT / "boundary-outcomes"
        fixtures.mkdir()
        (fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML)
        (fixtures / "NFL_TRANSACTIONS_2026_11.html").write_bytes(b"<h2>November 2026</h2>" + TRANSACTION_HTML.replace(b"10/29", b"11/10"))
        si.retrieve_official_outcomes(si.AUDIT_AT, fixtures)
        audit = si.run_audit(si.AUDIT_AT)
        self.assertEqual(audit["status"], "PENDING_COMPLETE_COHORT")
        self.assertEqual(audit["resolvedForecasts"], 1)
        self.assertIsNone(audit["brierScore"])
        self.assertEqual(audit["unresolvedEventIds"], ["BOUNDARY"])
        si.resolve_forecast(argparse.Namespace(event_id="BOUNDARY", outcome="1", source="https://www.nfl.com/news/official-trade", resolved_at=si.iso(si.AUDIT_AT), transaction_at="2026-11-10T20:00:00Z"))
        self.assertEqual(si.run_audit(si.AUDIT_AT)["status"], "COMPLETE")

    def test_same_day_lock_boundary_remains_unresolved(self):
        si.lock_forecast(argparse.Namespace(event_id="SAME", player="Official Player", probability="0.2", question="Future trade only", deadline=si.iso(si.DEADLINE), cutoff="2026-10-31T04:00:00Z", published_at="2026-10-31T04:01:00Z", commit="a" * 40, evidence=["https://www.nfl.com/transactions/"], counterargument="May stay"))
        fixtures = si.ROOT / "same-day-outcomes"
        fixtures.mkdir()
        (fixtures / "NFL_TRANSACTIONS_2026_10.html").write_bytes(b"<h2>October 2026</h2>" + TRANSACTION_HTML.replace(b"10/29", b"10/31"))
        (fixtures / "NFL_TRANSACTIONS_2026_11.html").write_bytes(b'<h2>November 2026</h2><table class="d3-o-table"></table>')
        si.retrieve_official_outcomes(si.AUDIT_AT, fixtures)
        self.assertEqual(self.read("ledger")["outcomeRecords"], [])
        self.assertEqual(si.run_audit(si.AUDIT_AT)["status"], "PENDING_COMPLETE_COHORT")

    def test_scoring_and_manual_resolution_cannot_run_early(self):
        self.assertEqual(si.run_audit(si.DEADLINE)["status"], "PENDING_SCHEDULED_AUDIT")
        si.lock_forecast(argparse.Namespace(event_id="EARLY", player="Official Player", probability="0.8", question="Future trade only", deadline=si.iso(si.DEADLINE), cutoff="2026-10-31T04:00:00Z", published_at="2026-10-31T04:01:00Z", commit="a" * 40, evidence=["https://www.nfl.com/transactions/"], counterargument="May stay"))
        with self.assertRaises(ValueError):
            si.resolve_forecast(argparse.Namespace(event_id="EARLY", outcome="0", source="https://example.com/not-authority", resolved_at=si.iso(si.AUDIT_AT)))

    def test_live_desk_exposes_discovery_without_promoting_claims(self):
        si.ingest(si.parse_time("2026-10-30T20:00:00Z"), self.fixtures)
        desk = self.read("desk")
        self.assertEqual(desk["schema"], "KAHRELUM_NFL_DESK_LIVE_v1.0")
        self.assertGreater(len(desk["activity"]), 0)
        self.assertEqual(desk["publishedUpdates"], [])
        self.assertIsNone(desk["currentForecasts"])
        self.assertEqual(desk["board"]["asOf"], json.loads((ROOT / "nfl/trade-board.json").read_text())["asOf"])

    def test_resolved_historical_trade_arithmetic_stays_excluded(self):
        ledger = json.loads((ROOT / "nfl" / "forecast-ledger.json").read_text(encoding="utf-8"))
        board = json.loads((ROOT / "nfl" / "trade-board.json").read_text(encoding="utf-8"))
        expected = {
            "Marvin Harrison Jr.": (0.49, 0.2601),
            "Quenton Nelson": (0.39, 0.3721),
            "DeForest Buckner": (0.68, 0.1024),
        }
        records = {
            record["player"]: record
            for record in ledger["historicalExcluded"]
            if "provisionalBrierArithmetic" in record
        }
        self.assertEqual(set(records), set(expected))
        self.assertFalse(set(records) & {event["player"] for event in ledger["eligibleLocks"]})
        self.assertFalse({row["eventId"] for row in ledger["historicalExcluded"]} & {event["eventId"] for event in ledger["eligibleLocks"]})
        for player, (probability, brier) in expected.items():
            record = records[player]
            self.assertEqual(record["probability"], probability)
            self.assertEqual(record["outcome"], 1)
            self.assertFalse(record["scoringEligible"])
            self.assertAlmostEqual(record["provisionalBrierArithmetic"], (probability - 1) ** 2)
            self.assertAlmostEqual(record["provisionalBrierArithmetic"], brier)
            board_record = next(item for item in board["history"] if item["name"] == player)
            self.assertFalse(board_record["scorable"])
            self.assertAlmostEqual(board_record["provisionalBrierArithmetic"], brier)


if __name__ == "__main__":
    unittest.main()

