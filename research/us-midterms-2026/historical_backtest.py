#!/usr/bin/env python3
"""Historical-only House margin baseline backtest (no forecasts for 2026).

Walk-forward folds are 2004->2006, 2008->2010, 2012->2014,
2016->2018, 2022->2024. Changed 2026 maps are not used as current inputs.
"""
import argparse
import json
import math
import random
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from history_import import parse_file
from model_kernel import normal_cdf

PAIRS=[(2004,2006),(2008,2010),(2012,2014),(2016,2018),(2022,2024)]

def historical_pairs(root):
    data,receipts={},{}
    for year in sorted({y for pair in PAIRS for y in pair}):
        file=Path(root)/f"house_{year}.csv"
        data[year],receipts[year]=parse_file(file,year)
    out={}
    for base,target in PAIRS:
        eligible=[]
        for rid in sorted(set(data[base])&set(data[target])):
            old,new=data[base][rid],data[target][rid]
            if old["flags"] or new["flags"]:continue
            if old["margin"] is None or new["margin"] is None:continue
            if any(v<=0 for v in (old["D"],old["R"],new["D"],new["R"])):continue
            eligible.append({"race_id":rid,"source_year":base,"target_year":target,
                             "prior_margin_pp":old["margin"],"actual_margin_pp":new["margin"],
                             "margin_change_pp":new["margin"]-old["margin"],
                             "actual_D":1 if new["margin"]>0 else 0})
        out[target]=eligible
    return out,receipts

def rmse(rows):
    if len(rows)<30:raise ValueError("At least 30 eligible training cases needed")
    return math.sqrt(statistics.mean(x["margin_change_pp"]**2 for x in rows))

def cluster_ci(rows,bootstrap=1000):
    groups=defaultdict(list)
    for r in rows:
        state=r["race_id"].split(":")[1][:2]
        groups[(r["target_year"],state)].append(r["brier"])
    keys=sorted(groups)
    if len(keys)<5:return None
    rng=random.Random(20261028);means=[]
    for _ in range(bootstrap):
        picked=[rng.choice(keys) for _ in keys]
        vals=[x for key in picked for x in groups[key]]
        means.append(statistics.mean(vals))
    means.sort()
    return [round(means[int(.025*(bootstrap-1))],8),round(means[int(.975*(bootstrap-1))],8)]

def evaluate(root):
    pairs,receipts=historical_pairs(root)
    folds=[];all_scored=[]
    for i,(base,target) in enumerate(PAIRS):
        if i==0:continue  # First fold is for initial scale fitting only.
        training=[r for _,year in PAIRS[:i] for r in pairs[year]]
        test=pairs[target]
        sigma=rmse(training)
        scored=[]
        for row in test:
            p=normal_cdf(row["prior_margin_pp"]/sigma)
            scored.append({**row,"brier":(p-row["actual_D"])**2})
        all_scored.extend(scored)
        folds.append({"heldout_year":target,"training_years":[y for _,y in PAIRS[:i]],
                      "training_rows":len(training),"heldout_rows":len(test),
                      "sigma_pp":round(sigma,6),
                      "heldout_brier":round(statistics.mean(x["brier"] for x in scored),8) if scored else None})
    all_pairs=[r for _,year in PAIRS for r in pairs[year]]
    report={
        "study_id":"KAH-US-MIDTERMS-2026-HEAD2HEAD-001",
        "created_utc":datetime.now(timezone.utc).isoformat(),
        "status":"HISTORICAL_DIAGNOSTIC_ONLY",
        "forecasts_for_2026_generated":False,
        "source":"MIT Election Data + Science Lab via electiondata.dev",
        "source_sha256_by_year":{str(y):m["sha256"] for y,m in receipts.items()},
        "pairs":{str(y):len(pairs[y]) for _,y in PAIRS},
        "folds":folds,
        "aggregate_heldout_brier":round(statistics.mean(x["brier"] for x in all_scored),8) if all_scored else None,
        "state_year_cluster_ci95":cluster_ci(all_scored),
        "historical_margin_change_rmse_pp":round(rmse(all_pairs),6),
        "limitations":[
            "Historical district geometry not independently audited for every mid-cycle change",
            "No current generic-ballot, district polls, fundraising or candidate features",
            "No Senate or governor calibration",
            "Excludes unopposed, unusual tabulations, missing and unofficial source rows",
            "This simple persistence baseline does not authenticate or validate a 2026 election forecast",
            "These figures are not evidence of superiority over any named forecaster"
        ]}
    return report

def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument("--input-dir",required=True,type=Path)
    a.add_argument("--output",required=True,type=Path)
    v=a.parse_args()
    report=evaluate(v.input_dir)
    v.output.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"pairs":report["pairs"],"heldout_brier":report["aggregate_heldout_brier"],
                      "status":report["status"]}))
if __name__=="__main__":main()
