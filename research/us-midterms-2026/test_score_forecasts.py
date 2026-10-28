"""Regression tests for score_forecasts.py. Run: python -m unittest discover -s research/us-midterms-2026 -p 'test_*.py'"""
import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).with_name("score_forecasts.py")
spec = importlib.util.spec_from_file_location("score_forecasts", SOURCE)
scoremod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scoremod)


def forecast(source, race, p, target="D", call="D", authenticated="VERIFIED"):
    office = race.split(":")[0]
    return {"source_id": source, "race_id": race, "office": office,
            "target_id": target, "call_id": call, "category": "",
            "p_target": str(p) if p is not None else "",
            "cutoff_auth": authenticated}


class ScoreTests(unittest.TestCase):
    def write_csv(self, path, rows):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)

    def test_paired_brier_and_call_accuracy(self):
        with tempfile.TemporaryDirectory() as d:
            pred = Path(d) / "forecasts.csv"
            out = Path(d) / "outcomes.csv"
            self.write_csv(pred, [
                forecast("KAHRELUM", "HOUSE:XY-01", .7, call="D"),
                forecast("RIVAL", "HOUSE:XY-01", .6, call="D"),
                forecast("KAHRELUM", "SENATE:AB", .2, call="R"),
                forecast("RIVAL", "SENATE:AB", .4, call="R"),
            ])
            self.write_csv(out, [
                {"race_id": "HOUSE:XY-01", "winner_id": "D", "status": "CERTIFIED"},
                {"race_id": "SENATE:AB", "winner_id": "R", "status": "CERTIFIED"},
            ])
            actual = scoremod.score(scoremod.load_predictions(str(pred)),
                                    scoremod.load_outcomes(str(out)))
            entrants = {x["source_id"]: x for x in actual["leaderboard"]}
            self.assertEqual(entrants["KAHRELUM"]["correct_called_rows"], 2)
            self.assertEqual(entrants["KAHRELUM"]["numeric_scored_rows"], 2)
            self.assertAlmostEqual(entrants["KAHRELUM"]["brier_score"], .065)
            self.assertAlmostEqual(entrants["RIVAL"]["brier_score"], .16)
            self.assertEqual(actual["head_to_heads"][0]["shared_numeric_scored_rows"], 2)
            self.assertAlmostEqual(actual["head_to_heads"][0]["delta_brier_kahrelum_minus_comparator"], -.095)
            self.assertIsNotNone(actual["head_to_heads"][0]["state_cluster_bootstrap_ci95"])

    def test_cutoff_and_tossup(self):
        with tempfile.TemporaryDirectory() as d:
            pred = Path(d) / "forecasts.csv"
            out = Path(d) / "outcomes.csv"
            self.write_csv(pred, [
                forecast("SAM", "GOVERNOR:G-XY", None, call="", authenticated="SOURCE_DATE_ONLY"),
                forecast("POLL", "GOVERNOR:G-XY", .55, call="D", authenticated="SOURCE_DATE_ONLY"),
            ])
            self.write_csv(out, [
                {"race_id": "GOVERNOR:G-XY", "winner_id": "D", "status": "CERTIFIED"},
            ])
            strict = scoremod.score(scoremod.load_predictions(str(pred)),
                                    scoremod.load_outcomes(str(out)))
            self.assertEqual(strict["leaderboard"][1]["numeric_scored_rows"], 0)
            provisional = scoremod.score(scoremod.load_predictions(str(pred), True),
                                         scoremod.load_outcomes(str(out)))
            self.assertEqual(provisional["leaderboard"][1]["numeric_scored_rows"], 1)
            self.assertEqual(provisional["leaderboard"][0]["decisive_called_rows"], 0)

    def test_invalid_probability(self):
        self.assertRaises(ValueError, scoremod.probability, "1.01")
        self.assertRaises(ValueError, scoremod.probability, "nan")
        self.assertIsNone(scoremod.probability(""))

    def test_duplicate_forecast_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            pred = Path(d) / "forecasts.csv"
            row = forecast("X", "HOUSE:XY-01", .4)
            self.write_csv(pred, [row, row])
            self.assertRaises(ValueError, scoremod.load_predictions, str(pred))

    def test_uncertified_result_excluded(self):
        preds = {("X", "SENATE:XY"): {
            **forecast("X", "SENATE:XY", .6), "probability": .6, "eligible": True,
        }}
        results = {"SENATE:XY": {"winner_id": "D", "status": "PENDING"}}
        s = scoremod.score(preds, results)
        self.assertEqual(s["leaderboard"][0]["numeric_scored_rows"], 0)
        self.assertIsNone(s["leaderboard"][0]["brier_score"])

    def test_state_clusters(self):
        self.assertEqual(scoremod.state_of("GOVERNOR:G-TX"), "TX")
        self.assertEqual(scoremod.state_of("HOUSE:AK-00"), "AK")
        self.assertEqual(scoremod.state_of("SENATE:FL-SPECIAL"), "FL")


if __name__ == "__main__":
    unittest.main()
