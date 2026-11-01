"""Executable contract for KAHRELUM price-aware straight-bet tiers."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('betting_tiers', ROOT / 'scripts' / 'betting_tiers.py')


class BettingTierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(cls.module)

    def evaluate(self, probability, odds, reviewed=False):
        return self.module.evaluate(probability, odds, model_reviewed=reviewed)

    def test_minus_110_break_even_is_52_38095_percent(self):
        row = self.evaluate(52.38095238095238, -110)
        self.assertAlmostEqual(row['breakEvenPercent'], 52.38095238, places=6)
        self.assertAlmostEqual(row['expectedRoiPercent'], 0, places=8)
        self.assertEqual(row['tier'], 'NO_BET')

    def test_friends_lower_bound_and_information_only(self):
        row = self.evaluate(52.5, -110, reviewed=True)
        self.assertEqual(row['tier'], 'FRIENDS')
        self.assertEqual(row['stakeUsd'], 0)
        self.assertGreater(row['expectedRoiPercent'], 0)
        self.assertAlmostEqual(row['expectedRoiPercent'], 0.227272727, places=5)

    def test_friends_54_49_is_not_slight(self):
        self.assertEqual(self.evaluate(54.49, -110)['tier'], 'FRIENDS')

    def test_friends_54_5_is_slight_and_information_only(self):
        row = self.evaluate(54.5, -110, reviewed=True)
        self.assertEqual(row['tier'], 'FRIENDS_SLIGHT_EDGE')
        self.assertEqual(row['stakeUsd'], 0)
        self.assertGreaterEqual(row['edgePercentagePoints'], 2)
        self.assertGreaterEqual(row['expectedRoiPercent'], 3)

    def test_strong_and_certified_at_standard_price(self):
        strong = self.evaluate(55, -110, reviewed=True)
        cert = self.evaluate(58, -110, reviewed=True)
        self.assertEqual((strong['tier'], strong['stakeUsd']), ('STRONG_OPTIONAL', 25))
        self.assertEqual((cert['tier'], cert['stakeUsd']), ('CERTIFIED', 50))

    def test_review_gate_blocks_stake_despite_eligible_model_tier(self):
        row = self.evaluate(60, -110)
        self.assertEqual(row['tier'], 'CERTIFIED')
        self.assertEqual(row['stakeUsd'], 0)
        self.assertEqual(row['conditionalStakeCapUsd'], 50)
        self.assertEqual(row['wagerStatus'], 'REVIEW_REQUIRED')

    def test_expensive_odds_can_erase_the_edge(self):
        row = self.evaluate(58, -150, reviewed=True)
        self.assertEqual(row['tier'], 'NO_BET')
        self.assertEqual(row['stakeUsd'], 0)
        self.assertLess(row['expectedRoiPercent'], 0)

    def test_positive_ev_but_insufficient_buffer_does_not_qualify_for_wager(self):
        row = self.evaluate(55, -120, reviewed=True)
        self.assertEqual(row['tier'], 'PRICE_WATCH')
        self.assertEqual(row['stakeUsd'], 0)
        self.assertGreater(row['expectedRoiPercent'], 0)
        self.assertLess(row['edgePercentagePoints'], 2)

    def test_slight_edge_requires_both_roi_and_probability_buffer(self):
        row = self.evaluate(54.6, -118, reviewed=True)
        self.assertEqual(row['tier'], 'FRIENDS')
        self.assertEqual(row['stakeUsd'], 0)

    def test_positive_odds_evaluate_independently(self):
        row = self.evaluate(55, +110, reviewed=True)
        self.assertAlmostEqual(row['breakEvenPercent'], 47.6190476, places=5)
        self.assertEqual(row['tier'], 'STRONG_OPTIONAL')
        self.assertEqual(row['stakeUsd'], 25)

    def test_no_wager_below_friends_floor_even_when_plus_odds_have_ev(self):
        row = self.evaluate(52.49, +110, reviewed=True)
        self.assertEqual(row['tier'], 'NO_BET')
        self.assertEqual(row['stakeUsd'], 0)

    def test_never_accept_unpriced_or_invalid_tickets(self):
        for odds in (None, 0, 50, -99, 'even', 110.5):
            with self.subTest(odds=odds), self.assertRaises(ValueError):
                self.evaluate(56, odds)
        for probability in (None, -1, 0, 101, float('nan')):
            with self.subTest(probability=probability), self.assertRaises(ValueError):
                self.evaluate(probability, -110)

    def test_policy_is_source_of_truth_and_site_release_includes_it(self):
        policy = json.loads((ROOT / 'sports' / 'betting-policy.json').read_text(encoding='utf-8'))
        self.assertEqual(policy['friends']['minProbabilityPercent'], 52.5)
        self.assertEqual(policy['friends']['slightEdgeMinProbabilityPercent'], 54.5)
        self.assertEqual(policy['strongOptional']['stakeCapUsd'], 25)
        self.assertEqual(policy['certified']['stakeCapUsd'], 50)
        self.assertTrue(policy['straightBetsOnly'])
        self.assertTrue(policy['ticketOddsRequired'])
        overlay = (ROOT / 'scripts' / 'firebase-overlay-release.cjs').read_text(encoding='utf-8')
        self.assertGreaterEqual(overlay.count("'sports/betting-policy.json'"), 2)
        self.assertIn('52.5%', (ROOT / 'sports.html').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
