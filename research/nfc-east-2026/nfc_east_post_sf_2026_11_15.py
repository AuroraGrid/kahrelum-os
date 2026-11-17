"""KAHRELUM NFC East 2026 scenario simulation, 2026-11-15 post-SF 46 DAL 40.

Transparent analyst prototype, *not* an official KAHRELUM model release.
Uses 27 remaining games, unchanged Nov 9 Pete Ratings, a 1.1 pt HFA,
a disclosed uncalibrated 7.0-point logistic margin conversion, and two
short-horizon market consensus anchors. Does not model future tied games.

Run: python nfc_east_post_sf_2026_11_15.py --draws 1000000 --seed 2026111501
Test: python -m pytest -q test_nfc_east_post_sf_2026_11_15.py
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import numpy as np

TEAMS = ('NYG', 'DAL', 'WAS', 'PHI')
NFC = {'NYG','DAL','WAS','PHI','SF','SEA','LAR','ARI','MIN','DET','ATL','GB','CHI','CAR','TB','NO'}

# Current *after* 2026-11-15 SF 46, DAL 40 (Cowboys official recap).
# All other division records remain at the Nov 12 post-WAS/NYG snapshot.
BASE = {
    'NYG': {'w':5, 'l':3, 't':1, 'div_w':2, 'div_l':1, 'div_t':1, 'conf_w':3, 'conf_l':3, 'conf_t':1},
    'DAL': {'w':4, 'l':6, 't':0, 'div_w':2, 'div_l':1, 'div_t':0, 'conf_w':2, 'conf_l':5, 'conf_t':0},
    'WAS': {'w':3, 'l':5, 't':1, 'div_w':2, 'div_l':2, 'div_t':1, 'conf_w':3, 'conf_l':4, 'conf_t':1},
    'PHI': {'w':2, 'l':7, 't':0, 'div_w':1, 'div_l':3, 'div_t':0, 'conf_w':1, 'conf_l':6, 'conf_t':0},
}

# Neutral-field point ratings: https://www.peteratings.com/nfl/rankings/
# Through NFL games Nov 9 (Nov 12 result not represented in ratings).
ratings = {
    'JAX':8.4, 'SF':5.5, 'SEA':4.6, 'LAR':3.8, 'CIN':3.1,
    'HOU':2.8, 'DET':2.2, 'MIN':2.2, 'PIT':1.7,
    'DAL':-0.7, 'NYG':-1.0, 'ATL':-2.1, 'IND':-2.6,
    'WAS':-3.0, 'CLE':-3.5, 'PHI':-4.0, 'ARI':-4.2, 'TEN':-5.9,
}

# Each real scheduled game exactly once. Matchups are (away @ home).
# Sources:
# https://www.nfl.com/schedules/2026/by-team/new-york-giants
# https://www.nfl.com/schedules/2026/by-team/dallas-cowboys
# https://www.nfl.com/schedules/2026/by-team/washington-commanders
# https://www.nfl.com/schedules/2026/by-team/philadelphia-eagles
SCHEDULE = (
 (11,'JAX','NYG'),(11,'TEN','DAL'),(11,'CIN','WAS'),(11,'PIT','PHI'),
 (12,'NYG','IND'),(12,'PHI','DAL'),(12,'WAS','ARI'),
 (13,'SF','NYG'),(13,'DAL','SEA'),(13,'WAS','TEN'),(13,'PHI','ARI'),
 (14,'NYG','SEA'),(14,'HOU','WAS'),(14,'IND','PHI'),
 (15,'CLE','NYG'),(15,'DAL','LAR'),(15,'ATL','WAS'),(15,'SEA','PHI'),
 (16,'NYG','DET'),(16,'JAX','DAL'),(16,'WAS','MIN'),(16,'HOU','PHI'),
 (17,'NYG','DAL'),(17,'WAS','JAX'),(17,'PHI','SF'),
 (18,'PHI','NYG'),(18,'DAL','WAS'),
)
GAMES = [{'week':w,'away':a,'home':h} for w,a,h in SCHEDULE]

# Disclosed two near-term market anchors, rounded:
# JAX@NYG line-implied NYG 31% (2026-11-12; eDraft spread -6 consensus).
MARKET_ANCHORS = {('JAX','NYG'):0.31}
DEFAULT_SCALE = 7.0
HOME_FIELD_POINTS = 1.1


def game_probabilities(games, rating_map, home_field=HOME_FIELD_POINTS,
                       scale=DEFAULT_SCALE, market_anchors=MARKET_ANCHORS):
    """Probability home team wins, using logistic link plus disclosed anchors."""
    odds = []
    for g in games:
        k = (g['away'], g['home'])
        if k in market_anchors:
            p = market_anchors[k]
        else:
            diff = rating_map[g['home']] + home_field - rating_map[g['away']]
            p = float(1 / (1 + np.exp(-diff / scale)))
        odds.append(p)
    return np.array(odds, dtype=np.float64)


def resolve_winner(wins, divwins, confwins, dal_beats_phi, *, seed=42,
                   nyg_was_head_to_head='WAS'):
    """Two-club NFL division tiebreakers applicable to no-future-tie scenario.

    NYG/WAS have 1 tie each, so can match percentage and WAS holds actual 2026
    H2H 1-0-1. DAL/PHI have no ties; they can tie with each other. NYG/DAL
    cannot tie in standings unless some *future* game is tied. For the DAL/PHI
    pair, check head-to-head, divisional wins, then conference wins. A
    possible remaining tie after those steps uses 50/50 stochastic allocation,
    flagged in report instead of falsely claiming official resolution.
    """
    n = len(wins)
    if not (wins.shape == divwins.shape == confwins.shape == (n,4)):
        raise ValueError('records must have shape [draws, 4]')
    # Using total W+0.5*T points avoids floating discrepancy with 17 total games.
    points = wins + np.array([BASE[t]['t'] / 2 for t in TEAMS])
    leaders = np.argmax(points, axis=1).astype(np.int8)
    high = points.max(axis=1)

    # NYG/WAS only same-half-win finishers; 2026 H2H is already resolved.
    tie_nyg_was = (points[:,0] == high) & (points[:,2] == high)
    leaders[tie_nyg_was] = 2 if nyg_was_head_to_head == 'WAS' else 0

    # DAL/PHI both integer win total; DAL holds Wk7 win vs PHI.
    tie_dal_phi = (points[:,1] == high) & (points[:,3] == high)
    leaders[tie_dal_phi] = 1  # DAL wins H2H if beats PHI in Wk12.
    split = tie_dal_phi & (~dal_beats_phi)
    phi_better_div = split & (divwins[:,3] > divwins[:,1])
    leaders[phi_better_div] = 3
    equal_div = split & (divwins[:,3] == divwins[:,1])
    phi_better_conf = equal_div & (confwins[:,3] > confwins[:,1])
    leaders[phi_better_conf] = 3
    unresolved = equal_div & (confwins[:,3] == confwins[:,1])
    rng = np.random.default_rng(seed)
    leaders[unresolved] = np.where(rng.random(int(np.sum(unresolved))) < 0.5, 1, 3)
    return np.array(TEAMS)[leaders], int(np.sum(unresolved))


def simulate(*, draws=1_000_000, seed=2026111501, base=None, rating_delta=None,
             home_field=HOME_FIELD_POINTS, scale=DEFAULT_SCALE,
             market_anchors=MARKET_ANCHORS, nyg_was_head_to_head='WAS'):
    """Simulate outcomes once per *actual* game, preserving head-to-head dependence."""
    if draws < 1:
        raise ValueError('draws must be >=1')
    b = BASE if base is None else base
    r = dict(ratings)
    for k,v in (rating_delta or {}).items():
        r[k] += v
    probs = game_probabilities(GAMES, r, home_field, scale, market_anchors)
    rng = np.random.default_rng(seed)
    wins = np.tile([b[t]['w'] for t in TEAMS], (draws,1)).astype(np.int16)
    division_wins = np.tile([b[t]['div_w'] for t in TEAMS], (draws,1)).astype(np.int16)
    conference_wins = np.tile([b[t]['conf_w'] for t in TEAMS], (draws,1)).astype(np.int16)
    game_home_wins = {}

    for i, (g,p) in enumerate(zip(GAMES, probs)):
        a,h = g['away'], g['home']
        home_wins = rng.random(draws) < p
        game_home_wins[(a,h)] = home_wins
        if h in TEAMS:
            col = TEAMS.index(h)
            wins[:,col] += home_wins
            if a in TEAMS:
                division_wins[:,col] += home_wins
            if a in NFC:
                conference_wins[:,col] += home_wins
        if a in TEAMS:
            col = TEAMS.index(a)
            away_wins = ~home_wins
            wins[:,col] += away_wins
            if h in TEAMS:
                division_wins[:,col] += away_wins
            if h in NFC:
                conference_wins[:,col] += away_wins

    champions, deep_ties = resolve_winner(
        wins, division_wins, conference_wins,
        game_home_wins[('PHI','DAL')], seed=seed + 1,
        nyg_was_head_to_head=nyg_was_head_to_head
    )
    counts = Counter(champions)
    division_odds = {t:round(counts.get(t,0)/draws,8) for t in TEAMS}

    def conditioned(event, winner):
        truth = np.count_nonzero(event)
        false = len(event) - truth
        return {
            'true': round(float(np.mean(champions[event] == winner)), 8) if truth else None,
            'false': round(float(np.mean(champions[~event] == winner)), 8) if false else None,
            'n_true': int(truth), 'n_false': int(false)
        }

    win_summary = {}
    for j,t in enumerate(TEAMS):
        final_wins = wins[:,j]
        win_summary[t] = {
            'mean_wins': round(float(np.mean(final_wins)), 4),
            'wins_10th_percentile': float(np.quantile(final_wins, 0.10)),
            'wins_90th_percentile': float(np.quantile(final_wins, 0.90)),
            'mean_win_equivalents': round(float(np.mean(final_wins) + b[t]['t']/2), 4),
            'prob_9plus_wins': round(float(np.mean(final_wins >= 9)), 6),
            'prob_10plus_wins': round(float(np.mean(final_wins >= 10)), 6),
        }
    schedule = []
    for g,p in zip(GAMES, probs):
        schedule.append({**g, 'p_home':round(float(p),6), 'p_away':round(float(1-p),6),
                         'market_anchored':(g['away'],g['home']) in market_anchors})
    return {
        'division_odds': division_odds,
        'expected_records': win_summary,
        'conditional': {
            'DAL_win_division_given_DAL_win_NYG_game': conditioned(game_home_wins[('NYG','DAL')], 'DAL'),
            'NYG_win_division_given_DAL_win_NYG_game': conditioned(game_home_wins[('NYG','DAL')], 'NYG'),
            'NYG_win_division_given_NYG_win_JAX': conditioned(game_home_wins[('JAX','NYG')], 'NYG'),
        },
        'schedule': schedule,
        'sample_counts': {'draws':int(draws), 'champions':{t:int(counts.get(t,0)) for t in TEAMS},
                          'deep_unresolved_ties_allocated_50_50':deep_ties},
        'model_assumptions': {
            'no_future_tie_games':True,
            'rating_source':'Pete Ratings NFL 2026 through 2026-11-09',
            'rating_scale':'neutral-field point differential',
            'home_field_points':home_field, 'logistic_spread_scale_points':scale,
            'market_probability_anchors':{f'{a}@{h}':p for (a,h),p in market_anchors.items()},
            'rating_shifts':rating_delta or {},
            'nyg_was_head_to_head_tiebreak_winner':nyg_was_head_to_head,
            'seed':seed,
        }
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--draws',type=int,default=1_000_000)
    parser.add_argument('--seed',type=int,default=2026111501)
    parser.add_argument('--output',default='nfc-east-title-2026-11-15-post-sf.json')
    args=parser.parse_args()
    if args.draws!=1_000_000 or args.seed!=2026111501:
        raise ValueError("Fixed published snapshot requires one million draws, seed 2026111501")
    result=simulate(draws=args.draws,seed=args.seed)
    old={'NYG':0.663737,'DAL':0.233978,'WAS':0.09714,'PHI':0.005145}
    sensitivity={}
    for label,kw in {
      'NYG_plus_2_rating_points':{'rating_delta':{'NYG':2}},
      'NYG_minus_2_rating_points':{'rating_delta':{'NYG':-2}},
      'DAL_plus_2_rating_points':{'rating_delta':{'DAL':2}},
      'DAL_minus_2_rating_points':{'rating_delta':{'DAL':-2}},
      'scale_6':{'scale':6.0},'scale_9':{'scale':9.0}
    }.items():
        sensitivity[label]=simulate(draws=150_000,seed=args.seed+11,**kw)['division_odds']
    report={
      'name':'KAHRELUM NFC East 2026 division title forecast after SF 46, DAL 40',
      'analysis_status':'independent experimental scenario simulation; not certified or backtested',
      'generated_at_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
      'as_of_nfl_eastern':'2026-11-15 final SF 46, DAL 40',
      'trigger':{'date':'2026-11-15','away':'SF','home':'DAL','away_score':46,'home_score':40,'status':'final'},
      'previous_snapshot':'nfc-east-title-2026-11-12.json',
      'forecast_method':'1,000,000 seeded independent Monte Carlo draws over 27 unique remaining NFC East-relevant games, head-to-head dependencies and disclosed incomplete tiebreak allocation',
      'original_division_odds':old,'main':result,
      'change_percentage_points':{t:round(100*(result['division_odds'][t]-old[t]),4) for t in TEAMS},
      'base_records_after_final':BASE,'base_ratings':ratings,'sensitivity':sensitivity,
      'sources':['https://www.dallascowboys.com/news/game-recap-explosive-plays-doom-dallas-46-40',
                 'https://www.49ers.com/news/49ers-outlast-the-dallas-cowboys-in-46-40-shootout-takeaways-from-sfvsdal',
                 'https://www.nfl.com/standings/division/2026/REG',
                 'https://www.nfl.com/standings/tie-breaking-procedures',
                 'https://www.peteratings.com/nfl/rankings/'],
      'limitations':[
        'This is a postgame recomputation of division-title probabilities, not calibration against resolved division titles.',
        'Only verified SF 46 DAL 40 final changes the November 12 state; no independent 2026-11-15 fresh ratings, injuries, or market prices were introduced.',
        'Pete Ratings inputs remain dated 2026-11-09. Future ties, major injuries or lineup changes and future market repricing are not modeled.',
        'Remaining JAX@NYG 31% market anchor is a November 12 snapshot, not a current quote.',
        'Rare Dallas-Philadelphia deep ties are split 50/50 after modeled tiebreak steps, with count disclosed.',
        'Model parameter uncertainty dominates Monte Carlo sampling error; percentage-point changes are scenario-dependent.'
      ]
    }
    payload=json.dumps(report,indent=2,sort_keys=True,ensure_ascii=False).encode('utf8')+b'\n'
    dest=Path(args.output);dest.write_bytes(payload)
    sha=hashlib.sha256(payload).hexdigest()
    dest.with_suffix(dest.suffix+'.sha256').write_text(sha+'  '+dest.name+'\n')
    print(json.dumps({'odds':result['division_odds'],'draws':args.draws,'seed':args.seed,'sha256':sha},indent=2))

if __name__ == '__main__':
    main()
