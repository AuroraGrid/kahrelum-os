#!/usr/bin/env python3
"""Neutral, retrospective scorer for the KAHRELUM 2026 midterms challenge.

This program computes accuracy of *submitted forecasts*. It does not predict elections.
Dependencies: Python 3.9+ standard library only.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import random
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

EXPECTED_UNIVERSE = {"HOUSE": 435, "SENATE": 35, "GOVERNOR": 36}
EXPECTED_TOTAL = sum(EXPECTED_UNIVERSE.values())
CUTOFF_OK = "VERIFIED"


def rows_from(path: str) -> List[dict]:
    with open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def clean(value: object) -> str:
    return str(value or "").strip()


def probability(value: object) -> Optional[float]:
    s = clean(value)
    if not s:
        return None
    p = float(s)
    if not math.isfinite(p) or p < 0 or p > 1:
        raise ValueError(f"Invalid probability: {s!r}; required finite value in [0,1]")
    return p


def load_predictions(path: str, include_provisional: bool = False) -> Dict[Tuple[str, str], dict]:
    predictions = {}
    for n, row in enumerate(rows_from(path), start=2):
        source = clean(row.get("source_id"))
        race = clean(row.get("race_id"))
        office = clean(row.get("office"))
        if not source or not race or not office:
            raise ValueError(f"row {n}: missing model/race/office")
        if office not in EXPECTED_UNIVERSE or not race.startswith(office + ":"):
            raise ValueError(f"row {n}: invalid office/race_id match: {office}, {race}")
        key = (source, race)
        if key in predictions:
            raise ValueError(f"row {n}: duplicate forecast for {source} / {race}")
        row["source_id"] = source
        row["race_id"] = race
        row["office"] = office
        row["target_id"] = clean(row.get("target_id")).upper()
        row["call_id"] = clean(row.get("call_id")).upper()
        row["category"] = clean(row.get("category"))
        row["probability"] = probability(row.get("p_target"))
        row["eligible"] = (
            clean(row.get("cutoff_auth")).upper() == CUTOFF_OK or include_provisional
        )
        if row["probability"] is not None and not row["target_id"]:
            raise ValueError(f"row {n}: probability has no named outcome target")
        predictions[key] = row
    return predictions


def load_outcomes(path: Optional[str]) -> Dict[str, dict]:
    if not path:
        return {}
    outcomes = {}
    for n, row in enumerate(rows_from(path), start=2):
        race = clean(row.get("race_id"))
        if not race or race in outcomes:
            raise ValueError(f"outcomes row {n}: missing/duplicate race_id")
        row["winner_id"] = clean(row.get("winner_id")).upper()
        row["status"] = clean(row.get("status")).upper()
        # Entries not certified (including uncalled and runoffs) have no score.
        if row["status"] == "CERTIFIED" and not row["winner_id"]:
            raise ValueError(f"outcomes row {n}: certified result missing winner_id")
        outcomes[race] = row
    return outcomes


def stats(values: List[float]) -> Optional[float]:
    return round(sum(values) / len(values), 8) if values else None


def brier(row: dict, outcome: dict) -> float:
    y = float(outcome["winner_id"] == row["target_id"])
    return (row["probability"] - y) ** 2


def calibrate(scored: List[Tuple[float, int]]) -> List[dict]:
    bins = []
    for k in range(5):
        selected = [(p, y) for p, y in scored
                    if (k / 5 <= p < (k + 1) / 5) or (k == 4 and p == 1)]
        if selected:
            bins.append({"range": [k / 5, (k + 1) / 5],
                         "n": len(selected),
                         "average_probability": stats([p for p, _ in selected]),
                         "observed_frequency": stats([float(y) for _, y in selected])})
    return bins


def state_of(race: str) -> str:
    # Canonical race IDs: HOUSE:AK-00, SENATE:AK, SENATE:FL-SPECIAL, GOVERNOR:G-AK.
    part = race.split(":", 1)[1]
    if part.startswith("G-"):
        part = part[2:]
    state = part[:2]
    if not state.isalpha() or len(state) != 2:
        raise ValueError(f"Cannot identify state cluster for {race}")
    return state


def cluster_ci(pairs: List[Tuple[str, float]], reps: int = 1000) -> Optional[List[float]]:
    if len(pairs) < 2:
        return None
    groups: Dict[str, List[float]] = defaultdict(list)
    for race, delta in pairs:
        groups[state_of(race)].append(delta)
    states = sorted(groups)
    if len(states) < 2:
        return None
    rnd = random.Random(20261103)
    boot = []
    for _ in range(reps):
        sample = [rnd.choice(states) for _ in states]
        all_diffs = [x for state in sample for x in groups[state]]
        boot.append(sum(all_diffs) / len(all_diffs))
    boot.sort()
    return [round(boot[int(.025 * (reps - 1))], 8),
            round(boot[int(.975 * (reps - 1))], 8)]


def score(predictions: Dict[Tuple[str, str], dict], outcomes: Dict[str, dict]) -> dict:
    sources = sorted(set(source for source, _ in predictions))
    leaderboard = []
    for source in sources:
        rs = [row for (s, _), row in predictions.items() if s == source]
        rs_good = [r for r in rs if r["eligible"]]
        resolved = [r for r in rs_good
                    if r["race_id"] in outcomes and outcomes[r["race_id"]]["status"] == "CERTIFIED"]
        called = [r for r in resolved if r["call_id"] and r["call_id"] not in ("TOSSUP", "TOSS-UP", "TOSS UP")]
        numeric = [r for r in resolved if r["probability"] is not None]
        scored = [(r["probability"], int(outcomes[r["race_id"]]["winner_id"] == r["target_id"]))
                  for r in numeric]
        briers = [brier(r, outcomes[r["race_id"]]) for r in numeric]
        out = {
            "source_id": source,
            "registered_rows": len(rs),
            "eligible_cutoff_authenticated_rows": len(rs_good),
            "not_cutoff_authenticated": len(rs) - len(rs_good),
            "registered_by_office": {o: sum(r["office"] == o for r in rs)
                                     for o in EXPECTED_UNIVERSE},
            "certified_resolved_rows": len(resolved),
            "decisive_called_rows": len(called),
            "correct_called_rows": sum(r["call_id"] == outcomes[r["race_id"]]["winner_id"]
                                       for r in called),
            "call_accuracy": stats([float(r["call_id"] == outcomes[r["race_id"]]["winner_id"])
                                   for r in called]),
            "numeric_scored_rows": len(numeric),
            "brier_score": stats(briers),
            "calibration": calibrate(scored),
        }
        leaderboard.append(out)

    # Pairwise comparison must share race ID, target outcome, certified resolution
    # and authenticated cutoff. Do not compare across different case subsets.
    head_to_heads = []
    for competitor in [s for s in sources if s != "KAHRELUM"]:
        pairs = []
        for (source, race), left in predictions.items():
            if source != "KAHRELUM" or (competitor, race) not in predictions:
                continue
            right = predictions[(competitor, race)]
            outcome = outcomes.get(race)
            if not outcome or outcome["status"] != "CERTIFIED":
                continue
            if not left["eligible"] or not right["eligible"]:
                continue
            if left["probability"] is None or right["probability"] is None:
                continue
            if not left["target_id"] or left["target_id"] != right["target_id"]:
                continue
            pairs.append((race, brier(left, outcome) - brier(right, outcome)))
        head_to_heads.append({
            "against": competitor,
            "shared_numeric_scored_rows": len(pairs),
            "delta_brier_kahrelum_minus_comparator": stats([x for _, x in pairs]),
            "state_cluster_bootstrap_ci95": cluster_ci(pairs),
            "interpretation": "negative delta favors KAHRELUM on matched resolved cases only"
        })
    return {
        "scope": EXPECTED_UNIVERSE,
        "registered_unique_races": len({race for _, race in predictions}),
        "certified_outcomes": sum(x["status"] == "CERTIFIED" for x in outcomes.values()),
        "leaderboard": leaderboard,
        "head_to_heads": head_to_heads,
        "disclaimer": ("Retrospective accuracy scoring only. No election predictions are "
                       "generated by this program. Provisional forecasts are withheld "
                       "unless --include-provisional is explicitly supplied.")
    }


def score_seats(path: Optional[str]) -> List[dict]:
    if not path:
        return []
    out = []
    for row in rows_from(path):
        if clean(row.get("status")).upper() != "CERTIFIED":
            continue
        try:
            predicted, actual = float(row["projected_seats"]), float(row["actual_seats"])
        except (KeyError, ValueError) as exc:
            raise ValueError(f"Invalid seat entry: {row}") from exc
        if not math.isfinite(predicted) or not math.isfinite(actual):
            raise ValueError("Nonfinite seat count")
        out.append({"source_id": clean(row.get("source_id")),
                    "office": clean(row.get("office")),
                    "projected_seats": predicted,
                    "actual_seats": actual,
                    "absolute_error": abs(predicted - actual)})
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--predictions", required=True, help="CSV forecast snapshot")
    parser.add_argument("--outcomes", help="CSV certified outcomes; omit for pre-election inventory")
    parser.add_argument("--seats", help="Optional CSV source_id,office,projected_seats,actual_seats,status")
    parser.add_argument("--include-provisional", action="store_true",
                        help="DEVELOPMENT ONLY: score records with unauthenticated cutoff")
    parser.add_argument("--output", help="Write JSON report to a file rather than stdout")
    args = parser.parse_args()
    preds = load_predictions(args.predictions, args.include_provisional)
    outcomes = load_outcomes(args.outcomes)
    result = score(preds, outcomes)
    result["seat_counts"] = score_seats(args.seats)
    report = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(report, encoding="utf-8")
    else:
        print(report, end="")


if __name__ == "__main__":
    main()
