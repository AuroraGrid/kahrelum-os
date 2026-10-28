"""KAHRELUM U.S. election source and model tests. All modeled races here are FICTIONAL.

Run: python -m unittest discover -s research/us-midterms-2026 -p 'test_*.py'
"""
import csv
import tempfile
import unittest
from pathlib import Path
from history_import import parse_file, merge, party_of
from model_kernel import params, calculate, normal_cdf
from historical_backtest import rmse

class TestSources(unittest.TestCase):
    columns=["year","state_po","district","stage","special","runoff","candidate","party",
             "candidatevotes","unofficial","mode"]
    def write(self,root,year,rows):
        p=root/(str(year)+".csv")
        with p.open("w",newline="",encoding="utf-8") as f:
            w=csv.DictWriter(f,fieldnames=self.columns);w.writeheader()
            for row in rows:
                w.writerow({"year":str(year),"state_po":"NY","district":"1","stage":"GEN",
                            "special":"false","runoff":"false","candidate":"A",
                            "party":"DEMOCRAT","candidatevotes":"100","unofficial":"false",
                            "mode":"TOTAL",**row})
        return p
    def test_fusion(self):
        with tempfile.TemporaryDirectory() as d:
            rows=[{"candidate":"A","party":"DEMOCRAT","candidatevotes":"80"},
                  {"candidate":"A","party":"WORKING FAMILIES","candidatevotes":"20"},
                  {"candidate":"B","party":"REPUBLICAN","candidatevotes":"90"},
                  {"candidate":"B","party":"CONSERVATIVE","candidatevotes":"10"}]
            records,_=parse_file(self.write(Path(d),2024,rows),2024)
            self.assertEqual(records["HOUSE:NY-01"]["margin"],0)
            self.assertEqual(records["HOUSE:NY-01"]["flags"],[])
    def test_alaska_ranked_choice_review(self):
        with tempfile.TemporaryDirectory() as d:
            rows=[{"state_po":"AK","district":"0","candidate":"R1","party":"REPUBLICAN"},
                  {"state_po":"AK","district":"0","candidate":"R2","party":"REPUBLICAN"},
                  {"state_po":"AK","district":"0","candidate":"D","party":"DEMOCRAT"}]
            records,_=parse_file(self.write(Path(d),2024,rows),2024)
            flags=records["HOUSE:AK-00"]["flags"]
            self.assertIn("RCV_FINAL_ROUND_REVIEW",flags)
            self.assertIn("MULTIPLE_SAME_PARTY_CANDIDATES",flags)
    def test_unopposed_not_a_hundred_point_margin(self):
        with tempfile.TemporaryDirectory() as d:
            records,_=parse_file(self.write(Path(d),2024,[{"candidate":"B","party":"REPUBLICAN"}]),2024)
            self.assertIsNone(records["HOUSE:NY-01"]["margin"])
            self.assertIn("NO_TWO_PARTY_CONTEST",records["HOUSE:NY-01"]["flags"])
    def test_delegate_excluded(self):
        with tempfile.TemporaryDirectory() as d:
            records,meta=parse_file(self.write(Path(d),2024,[{"state_po":"DC","district":"0"}]),2024)
            self.assertFalse(records)
            self.assertEqual(meta["excluded"]["non_state"],1)
    def test_mismatched_year_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            file=self.write(Path(d),2024,[{"year":"2026"}])
            with self.assertRaises(ValueError):parse_file(file,2024)
    def test_geography_gate(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            rows=[{"state_po":"TX","candidate":"A","party":"DEMOCRAT"},
                  {"state_po":"TX","candidate":"B","party":"REPUBLICAN"}]
            a=self.write(root,2022,rows);b=self.write(root,2024,rows)
            facts,manifest=merge(a,b)
            self.assertEqual(facts[0]["forecast_readiness"],"BLOCKED_REVIEW_REQUIRED")
            self.assertEqual(facts[0]["map_2026_status"],"REBUILD_REQUIRED")
    def test_party_parser(self):
        self.assertEqual(party_of("DEMOCRATIC FARMER LABOR"),"D")
        self.assertEqual(party_of("REPUBLICAN, LIBERTARIAN"),"R")
        self.assertEqual(party_of("DEMOCRAT REPUBLICAN"),"AMBIGUOUS")

class TestKernel(unittest.TestCase):
    def setUp(self):
        self.conf=params({"prior_margin_sd_pp":6,"national_sd_pp":3,"state_sd_pp":2,"poll_sd_pp":4,
                          "validation_status":"OUT_OF_TIME_VALIDATED","model_version":"TEST_FICTION",
                          "calibration_receipt":"synthetic-test-only"})
        self.raw={"source_type":"CERTIFIED_HISTORICAL_RESULT","url":"https://electionlab.mit.edu/data",
                  "published_at_utc":"2026-01-01T00:00:00Z","content_sha256":"a"*64}
        self.e={"race_id":"HOUSE:XY-01","asof_utc":"2026-10-28T00:00:00Z",
                "map_status":"VERIFIED_NO_MAP_CHANGE","ballot_verified":True,"baseline_margin_pp":1.5,
                "national_adjustment_pp":.5,"source_receipts":[self.raw]}
    def test_fictional_probability_math(self):
        r=calculate(self.e,self.conf)
        self.assertEqual(r["status"],"CALCULATED")
        self.assertTrue(.5<r["probability"]<1)
        self.assertEqual(normal_cdf(0),.5)
    def test_calibration_gate(self):
        c={**self.conf,"validation_status":"HISTORICAL_DIAGNOSTIC_ONLY"}
        self.assertEqual(calculate(self.e,c)["reason"],"CALIBRATION_NOT_VALIDATED")
    def test_source_after_cutoff(self):
        x={**self.e,"source_receipts":[{**self.raw,"published_at_utc":"2026-11-04T00:00:00Z"}]}
        self.assertEqual(calculate(x,self.conf)["reason"],"SOURCE_AFTER_CUTOFF")
    def test_evidence_after_cutoff(self):
        x={**self.e,"asof_utc":"2026-11-04T12:00:00Z"}
        self.assertEqual(calculate(x,self.conf)["reason"],"EVIDENCE_AFTER_CUTOFF")
    def test_comparator_contamination(self):
        x={**self.e,"source_receipts":[{**self.raw,"url":"https://votes.decisiondeskhq.com/forecast/2026/house"}]}
        self.assertEqual(calculate(x,self.conf)["reason"],"COMPARATOR_CONTAMINATION")
    def test_redrawn_maps_blocked(self):
        x={**self.e,"map_status":"REBUILD_REQUIRED"}
        self.assertEqual(calculate(x,self.conf)["reason"],"GEOGRAPHY_NOT_VERIFIED")
    def test_unverified_ballot(self):
        x={**self.e,"ballot_verified":False}
        self.assertEqual(calculate(x,self.conf)["reason"],"BALLOT_ID_NOT_VERIFIED")
    def test_local_poll_requires_first_party(self):
        x={**self.e,"local_poll_margin_pp":3}
        self.assertEqual(calculate(x,self.conf)["reason"],"LOCAL_POLL_MISSING_FIRST_PARTY_SOURCE")
        x["source_receipts"]=[self.raw,{**self.raw,"source_type":"FIRST_PARTY_RAW_POLL",
                                       "url":"https://www.ipsos.com/poll-release"}]
        self.assertEqual(calculate(x,self.conf)["status"],"CALCULATED")
    def test_no_naive_timestamps(self):
        x={**self.e,"asof_utc":"2026-10-28T00:00:00"}
        self.assertEqual(calculate(x,self.conf)["reason"],"EVIDENCE_TIMESTAMP_MISSING")
    def test_nonfinite_rejected(self):
        x={**self.e,"baseline_margin_pp":float("nan")}
        self.assertEqual(calculate(x,self.conf)["reason"],"INVALID_NUMERIC_EVIDENCE")

class TestBacktest(unittest.TestCase):
    def test_rmse(self):
        self.assertEqual(rmse([{"margin_change_pp":3} for _ in range(30)]),3.0)
    def test_no_tiny_training_sample(self):
        with self.assertRaises(ValueError):rmse([{"margin_change_pp":2}])
if __name__=="__main__":unittest.main()
