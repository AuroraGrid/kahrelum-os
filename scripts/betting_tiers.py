#!/usr/bin/env python3
"""KAHRELUM price-aware betting classification. Straight wagers only; no placement.

The displayed tier is not evidence of calibration. Only an independently reviewed
model and a positive price-adjusted edge can authorize a nonzero stake cap.
"""
from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation
import json
from pathlib import Path

POLICY_PATH = Path(__file__).resolve().parents[1] / 'sports' / 'betting-policy.json'


def _number(value, name: str) -> Decimal:
    if value is None or isinstance(value, bool):
        raise ValueError(f'{name} is required and must be numeric')
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f'{name} is not numeric') from None
    if not result.is_finite():
        raise ValueError(f'{name} must be finite')
    return result


def evaluate(probability_percent, american_odds, *, model_reviewed=False) -> dict:
    """Classify using full-precision implied odds and an explicit review gate.

    Inputs: win probability in percentage points (e.g. 54.5), American odds
    (e.g. -110 or '+120'). Returns EV and edge as percentages and stake cap
    in USD. Positive staking is NEVER returned for unreviewed estimates.
    """
    policy = json.loads(POLICY_PATH.read_text(encoding='utf-8'))
    p_pct = _number(probability_percent, 'probability_percent')
    odds = _number(american_odds, 'american_odds')
    if not Decimal('0') < p_pct <= 100:
        raise ValueError('probability_percent must be >0 and <=100')
    if odds != odds.to_integral_value() or abs(odds) < 100:
        raise ValueError('American odds must be an integer with absolute value >=100')
    if not isinstance(model_reviewed, bool):
        raise ValueError('model_reviewed must be a boolean')

    p = p_pct / 100
    if odds < 0:
        break_even = -odds / (100 - odds)
        net_win = 100 / -odds
    else:
        break_even = 100 / (odds + 100)
        net_win = odds / 100
    roi = p * net_win - (1 - p)
    edge_pp = (p - break_even) * 100
    actionable_edge = edge_pp >= Decimal(str(policy['minimumActionableEdgePercentagePoints'])) and \
        roi * 100 >= Decimal(str(policy['minimumActionableExpectedRoiPercent']))

    tier = 'NO_BET'
    conditional_stake_cap = 0
    if p_pct < Decimal(str(policy['friends']['minProbabilityPercent'])) or roi <= 0:
        tier = 'NO_BET'
    elif p_pct < Decimal(str(policy['friends']['maxProbabilityExclusivePercent'])):
        if (p_pct >= Decimal(str(policy['friends']['slightEdgeMinProbabilityPercent']))
                and actionable_edge):
            tier = 'FRIENDS_SLIGHT_EDGE'
        else:
            tier = 'FRIENDS'
    elif not actionable_edge:
        tier = 'PRICE_WATCH'
    elif p_pct < Decimal(str(policy['strongOptional']['maxProbabilityExclusivePercent'])):
        tier = 'STRONG_OPTIONAL'
        conditional_stake_cap = policy['strongOptional']['stakeCapUsd']
    else:
        tier = 'CERTIFIED'
        conditional_stake_cap = policy['certified']['stakeCapUsd']

    stake = conditional_stake_cap if model_reviewed else 0
    status = ('ELIGIBLE_REVIEWED' if stake else 'REVIEW_REQUIRED' if conditional_stake_cap
              else 'INFORMATION_ONLY' if tier.startswith('FRIENDS')
              else 'NO_ACTIONABLE_EDGE')
    return {
        'policyVersion': policy['schema'],
        'ticketAmericanOdds': int(odds),
        'modelProbabilityPercent': float(p_pct),
        'breakEvenPercent': float(break_even * 100),
        'edgePercentagePoints': float(edge_pp),
        'expectedRoiPercent': float(roi * 100),
        'tier': tier,
        'straightBetsOnly': True,
        'conditionalStakeCapUsd': conditional_stake_cap,
        'stakeUsd': stake,
        'wagerStatus': status,
        'modelReviewed': model_reviewed,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probability-percent', required=True, help='Win probability, e.g. 54.5')
    parser.add_argument('--odds', required=True, help='Exact American ticket odds, e.g. -110 or +120')
    parser.add_argument('--model-reviewed', action='store_true', help='Only after independent forecast review has been documented')
    args = parser.parse_args()
    try:
        result = evaluate(args.probability_percent, args.odds, model_reviewed=args.model_reviewed)
    except ValueError as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
