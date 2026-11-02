import unittest
import numpy as np
from replay_2026 import weighted_mean, score_binary, is_settled_at_cutoff

class TestRetroReplay(unittest.TestCase):
    def test_eight_game_prior_weight_and_two_current(self):
        prior=np.array([10.0, 4.0])
        recent=np.array([[20.0, 8.0], [40.0, 10.0]])
        np.testing.assert_allclose(weighted_mean(prior,recent), [14.0, 5.0])
    def test_no_current_games_preserves_prior(self):
        np.testing.assert_allclose(weighted_mean(np.array([3.5]),np.empty((0,1))),[3.5])
    def test_missing_current_column_falls_back_to_prior(self):
        np.testing.assert_allclose(weighted_mean(np.array([3.0,7.0]),np.array([[np.nan,8.0]])),[3.0,64.0/9.0])
    def test_brier_and_direction(self):
        self.assertAlmostEqual(score_binary(.8,1),.04)
        self.assertAlmostEqual(score_binary(.8,0),.64)
    def test_future_and_missing_outcomes_excluded(self):
        self.assertFalse(is_settled_at_cutoff('2026-11-02',None,None,'2026-11-01'))
        self.assertTrue(is_settled_at_cutoff('2026-11-01',27,10,'2026-11-01'))
        self.assertFalse(is_settled_at_cutoff('2026-11-02',27,10,'2026-11-01'))

if __name__=='__main__':
    unittest.main(verbosity=2)
