import numpy as np
import pytest
from nfc_east_post_sf_2026_11_15 import BASE, GAMES, TEAMS, MARKET_ANCHORS, game_probabilities, ratings, simulate

def test_finished_49ers_game_is_not_simulated_and_base_records_are_correct():
    assert len(GAMES)==27
    assert all((g['away'],g['home'])!=('SF','DAL') for g in GAMES)
    assert ('SF','DAL') not in MARKET_ANCHORS
    assert BASE['DAL']=={'w':4,'l':6,'t':0,'div_w':2,'div_l':1,'div_t':0,'conf_w':2,'conf_l':5,'conf_t':0}
    for team in TEAMS:
        remaining=sum(team in (g['home'],g['away']) for g in GAMES)
        assert BASE[team]['w']+BASE[team]['l']+BASE[team]['t']+remaining==17

def test_anchored_future_game_remains():
    probs=game_probabilities(GAMES,ratings)
    assert len(probs)==27 and np.all((probs>0)&(probs<1))
    assert next(p for g,p in zip(GAMES,probs) if g['away']=='JAX' and g['home']=='NYG')==pytest.approx(.31)

def test_all_four_probabilities_sum_and_repeat():
    a=simulate(draws=30000,seed=2026111501);b=simulate(draws=30000,seed=2026111501)
    assert a['division_odds']==b['division_odds']
    assert set(a['division_odds'])==set(TEAMS)
    assert sum(a['division_odds'].values())==pytest.approx(1)
    assert a['division_odds']['DAL']==pytest.approx(.1756,abs=.018)
    assert set(a['expected_records'])==set(TEAMS)
    assert 'DAL_win_division_given_SF_win' not in a['conditional']
    assert sum(a['sample_counts']['champions'].values())==30000
