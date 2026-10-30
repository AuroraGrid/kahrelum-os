import argparse
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sports_intelligence", ROOT / "scripts" / "sports_intelligence.py")
si = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(si)


RSS_ONE = b'''<?xml version="1.0"?><rss version="2.0"><channel><item><title>Example player trade inquiry reported</title><link>https://example.com/report?utm_source=test</link><pubDate>Fri, 30 Oct 2026 16:00:00 GMT</pubDate></item></channel></rss>'''
RSS_TWO = b'''<?xml version="1.0"?><rss version="2.0"><channel><item><title>Example player trade inquiry reported</title><link>https://example.com/report?utm_source=test</link><pubDate>Fri, 30 Oct 2026 16:00:00 GMT</pubDate></item><item><title>Team trades Example Player according to a feed headline</title><link>https://example.com/unverified-transaction</link><pubDate>Fri, 30 Oct 2026 17:00:00 GMT</pubDate></item></channel></rss>'''


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
            body = b"<!doctype html><html><title>NFL transactions</title></html>" if integration["type"] == "official_page" else RSS_ONE
            (self.fixtures / f"{integration['id']}.xml").write_bytes(body)

    def tearDown(self):
        self.tmp.cleanup()

    def read(self, name):
        return json.loads(si.PATHS[name].read_text(encoding="utf-8"))

    def test_controlled_change_is_detected_and_deduplicated(self):
        now = si.parse_time("2026-10-30T18:00:00Z")
        self.assertEqual(si.ingest(now, self.fixtures), 0)
        first = self.read("status")
        self.assertEqual(first["observationsNew"], 4)
        self.assertEqual(len(self.read("observations")["observations"]), 4)
        self.assertEqual(si.ingest(si.parse_time("2026-10-30T19:00:00Z"), self.fixtures), 0)
        self.assertEqual(self.read("status")["observationsNew"], 0)
        (self.fixtures / "ESPN_RSS.xml").write_bytes(RSS_TWO)
        self.assertEqual(si.ingest(si.parse_time("2026-10-30T20:00:00Z"), self.fixtures), 0)
        self.assertEqual(self.read("status")["observationsNew"], 1)
        self.assertEqual(len(self.read("observations")["observations"]), 5)

    def test_unverified_transaction_headline_cannot_become_fact(self):
        (self.fixtures / "ESPN_RSS.xml").write_bytes(RSS_TWO)
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

    def test_publishing_preserves_provenance_and_requires_review(self):
        public = self.read("public")
        public["publishedUpdates"] = [{"evidenceClass": "FACT", "headline": "Controlled verified update", "sourceUrl": "https://example.com/official"}]
        si.write_json(si.PATHS["public"], public)
        si.generate_publishing()
        output = self.read("publishing")
        self.assertIn("https://example.com/official", output["articleDraft"])
        self.assertFalse(output["publishingAuthorized"])

    def test_reviewed_report_keeps_original_url_and_social_stays_disabled(self):
        si.ingest(si.parse_time("2026-10-30T18:00:00Z"), self.fixtures)
        observation = self.read("observations")["observations"][0]
        args = argparse.Namespace(observation_id=observation["id"], evidence_class="REPORT", headline="Reviewed attributable report", claim="A reporter described an inquiry; no offer was established.", source_url=observation["originalUrl"], reviewed_at="2026-10-30T18:30:00Z", reviewed_by="TEST_REVIEWER", material=True)
        si.approve_observation(args)
        update = self.read("public")["publishedUpdates"][0]
        self.assertEqual(update["sourceUrl"], observation["originalUrl"])
        self.assertFalse(update["automaticallyPublished"])
        self.assertFalse(self.read("publishing")["publishingAuthorized"])
        self.assertEqual(len(self.read("public")["materialAlerts"]), 1)

    def test_scoring_uses_all_eligible_resolved_events(self):
        for event_id, player, probability, suffix in (("YES", "Yes Player", "0.80", "c"), ("NO", "No Player", "0.20", "d")):
            si.lock_forecast(argparse.Namespace(event_id=event_id, player=player, probability=probability, question=f"Will {player} be traded?", deadline="2026-11-10T21:00:00Z", cutoff="2026-10-30T18:00:00Z", published_at="2026-10-30T18:01:00Z", commit=suffix * 40, evidence=["https://example.com/report"], counterargument="No verified agreement"))
        si.resolve_forecast(argparse.Namespace(event_id="YES", outcome="1", source="https://www.nfl.com/transactions/", resolved_at="2026-11-10T21:10:00Z"))
        si.resolve_forecast(argparse.Namespace(event_id="NO", outcome="0", source="https://www.nfl.com/transactions/", resolved_at="2026-11-10T21:10:00Z"))
        audit = si.run_audit(si.parse_time("2026-11-12T15:00:00Z"))
        self.assertEqual(audit["eligibleForecasts"], 2)
        self.assertAlmostEqual(audit["brierScore"], 0.04)
        self.assertAlmostEqual(audit["allNoBaselineBrier"], 0.5)
        self.assertEqual(audit["correctTrades"], 1)
        self.assertEqual(audit["correctNonTrades"], 1)
        si.validate()


if __name__ == "__main__":
    unittest.main()
