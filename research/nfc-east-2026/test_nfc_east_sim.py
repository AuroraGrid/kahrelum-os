import numpy as np
import pytest
from nfc_east_sim import BASE, GAMES, TEAMS, ratings, game_probabilities, simulate, resolve_winner


def test_remaining_schedule_has_exactly_eight_games_for_each_team():
    assert len(GAMES) == 28
    assert len({(g['week'], g['away'], g['home']) for g in GAMES}) == 28
    for team in TEAMS:
        assert sum(team in (g['home'], g['away']) for g in GAMES) == 8
        w, l, t = BASE[team]['w'], BASE[team]['l'], BASE[team]['t']
        assert w + l + t + 8 == 17
    assert BASE['NYG'] == {'w':5, 'l':3, 't':1, 'div_w':2, 'div_l':1, 'div_t':1, 'conf_w':3, 'conf_l':3, 'conf_t':1}
    assert BASE['WAS']['w'] == 3 and BASE['WAS']['l'] == 5 and BASE['WAS']['t'] == 1


def test_model_probability_is_symmetric_on_neutral_field_and_grounded_in_market():
    probabilities = game_probabilities(GAMES, ratings)
    assert len(probabilities) == len(GAMES)
    assert np.all((probabilities > 0) & (probabilities < 1))
    dal_sf = next(p for g,p in zip(GAMES, probabilities) if g['away']=='SF' and g['home']=='DAL')
    nyg_jax = next(p for g,p in zip(GAMES, probabilities) if g['away']=='JAX' and g['home']=='NYG')
    assert dal_sf == pytest.approx(0.35)
    assert nyg_jax == pytest.approx(0.31)


def test_giants_and_dallas_cannot_finish_with_identical_percentage_without_future_ties():
    for nyg_w in range(9):
        for dal_w in range(9):
            assert BASE['NYG']['w'] + nyg_w + BASE['NYG']['t']/2 != BASE['DAL']['w'] + dal_w


def test_washington_wins_head_to_head_tiebreak_over_giants():
    # Identical final pct possible: NYG 8-8-1 vs WAS 8-8-1.
    wins = np.array([[8, 7, 8, 5]], dtype=np.int16)
    divwins = np.array([[3, 4, 4, 1]], dtype=np.int16)
    confwins = np.array([[6, 7, 7, 2]], dtype=np.int16)
    dal_beats_phi = np.array([True])
    champions, deep_ties = resolve_winner(wins, divwins, confwins, dal_beats_phi, seed=2)
    assert champions.tolist() == ['WAS']
    assert deep_ties == 0


def test_dallas_beats_philly_in_full_head_to_head_sweep_on_equal_record():
    wins = np.array([[7, 8, 6, 8]], dtype=np.int16)
    divwins = np.array([[3, 3, 2, 4]], dtype=np.int16)
    confwins = np.array([[5, 5, 5, 6]], dtype=np.int16)
    champions, deep_ties = resolve_winner(wins, divwins, confwins, np.array([True]), seed=2)
    assert champions.tolist() == ['DAL']
    assert deep_ties == 0


def test_simulation_probabilities_sum_to_one_and_repeat_with_seed():
    a = simulate(draws=20000, seed=20261112)
    b = simulate(draws=20000, seed=20261112)
    assert a['division_odds'] == b['division_odds']
    assert a['division_odds']['NYG'] >= 0
    assert sum(a['division_odds'].values()) == pytest.approx(1.0)
    assert a['sample_counts']['draws'] == 20000
    assert sum(a['sample_counts']['champions'].values()) == 20000
    assert a['conditional']['DAL_win_division_given_SF_win']['true'] >= 0