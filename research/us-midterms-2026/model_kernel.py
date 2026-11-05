#!/usr/bin/env python3
"""KAHRELUM experimental source-neutral probability kernel.

Contains no real 2026 forecasts, candidate picks, or fitted parameters.
Requires authenticated evidence and an out-of-time calibration receipt.
"""
import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

CUTOFF=datetime(2026,11,3,17,0,tzinfo=timezone.utc)
COMPETITORS={
    "decisiondeskhq.com","cookpolitical.com","centerforpolitics.org",
    "sabatoscrystalball.substack.com","pollingforecast.com"
}
SOURCE_TYPES={
    "CERTIFIED_HISTORICAL_RESULT","FIRST_PARTY_RAW_POLL",
    "OFFICIAL_GEOGRAPHY","FIRST_PARTY_GENERIC_BALLOT"
}
MAP_VERIFIED={"VERIFIED_NO_MAP_CHANGE","VERIFIED_REBUILT_2026_GEOGRAPHY"}

def parse_utc(value):
    if not isinstance(value,str) or not value:raise ValueError("Timestamp absent")
    dt=datetime.fromisoformat(value.replace("Z","+00:00"))
    if dt.tzinfo is None:raise ValueError("Naive timestamp not accepted")
    return dt.astimezone(timezone.utc)

def number(value,name):
    try:x=float(value)
    except (ValueError,TypeError):raise ValueError("Not numerical: "+name)
    if not math.isfinite(x):raise ValueError("Nonfinite: "+name)
    return x

def params(source):
    for f in ("prior_margin_sd_pp","national_sd_pp","state_sd_pp","poll_sd_pp","validation_status","model_version","calibration_receipt"):
        if f not in source:raise ValueError("Config missing "+f)
    for f in ("prior_margin_sd_pp","national_sd_pp","state_sd_pp","poll_sd_pp"):
        if number(source[f],f)<=0:raise ValueError("Uncertainty must be >0")
    return source

def source_issue(receipts,cutoff):
    if not isinstance(receipts,list) or not receipts:return "MISSING_SOURCE_RECEIPTS"
    for r in receipts:
        if r.get("source_type") not in SOURCE_TYPES:return "UNAPPROVED_SOURCE_TYPE"
        u=urlparse(r.get("url",""))
        if u.scheme!="https" or not u.hostname:return "UNVERIFIABLE_SOURCE_URL"
        h=u.hostname.lower()
        if any(h==v or h.endswith("."+v) for v in COMPETITORS):
            return "COMPARATOR_CONTAMINATION"
        try:asof=parse_utc(r.get("published_at_utc"))
        except (ValueError,TypeError):return "SOURCE_TIMESTAMP_MISSING"
        if asof>cutoff:return "SOURCE_AFTER_CUTOFF"
        if not re.fullmatch("[0-9a-fA-F]{64}",str(r.get("content_sha256",""))):
            return "SOURCE_SHA256_MISSING"
    return None

def normal_cdf(z):
    if not math.isfinite(z):raise ValueError("Invalid normal quantile")
    return 0.5*math.erfc(-z/math.sqrt(2))

def calculate(case,config,cutoff=CUTOFF):
    """Calculate only with verifiable inputs; otherwise preserve explicit blockage."""
    rid=case.get("race_id","")
    base={"race_id":rid,"model_version":config["model_version"],"cutoff_utc":cutoff.isoformat()}
    def block(reason):
        return {**base,"status":"BLOCKED","reason":reason,"probability":None,"margin_mean_pp":None}
    if not isinstance(rid,str) or not re.fullmatch("(HOUSE|SENATE|GOVERNOR):[A-Z0-9-]+",rid):
        return block("INVALID_RACE_ID")
    if config["validation_status"]!="OUT_OF_TIME_VALIDATED" or not config["calibration_receipt"]:
        return block("CALIBRATION_NOT_VALIDATED")
    try:asof=parse_utc(case.get("asof_utc"))
    except (ValueError,TypeError):return block("EVIDENCE_TIMESTAMP_MISSING")
    if asof>cutoff:return block("EVIDENCE_AFTER_CUTOFF")
    if case.get("map_status") not in MAP_VERIFIED:return block("GEOGRAPHY_NOT_VERIFIED")
    if case.get("ballot_verified") is not True:return block("BALLOT_ID_NOT_VERIFIED")
    srcissue=source_issue(case.get("source_receipts"),cutoff)
    if srcissue:return block(srcissue)
    if case.get("baseline_margin_pp") is None:return block("BASELINE_NOT_VERIFIED")
    if case.get("national_adjustment_pp") is None:return block("NATIONAL_ENVIRONMENT_NOT_VERIFIED")
    try:
        prior=number(case["baseline_margin_pp"],"prior")
        national=number(case["national_adjustment_pp"],"national")
    except ValueError:return block("INVALID_NUMERIC_EVIDENCE")
    if abs(prior)>100 or abs(national)>100:return block("MARGIN_OUT_OF_RANGE")
    prior_variance=number(config["prior_margin_sd_pp"],"prior_sd")**2
    mean=prior+national
    var=prior_variance
    poll=case.get("local_poll_margin_pp")
    if poll is not None:
        if not any(r.get("source_type")=="FIRST_PARTY_RAW_POLL" for r in case["source_receipts"]):
            return block("LOCAL_POLL_MISSING_FIRST_PARTY_SOURCE")
        try:local=number(poll,"local_poll")
        except ValueError:return block("INVALID_LOCAL_POLL")
        if abs(local)>100:return block("LOCAL_POLL_OUT_OF_RANGE")
        poll_variance=number(config["poll_sd_pp"],"poll_sd")**2
        var=1/(1/prior_variance+1/poll_variance)
        mean=var*((mean/prior_variance)+(local/poll_variance))
    total_sd=math.sqrt(var+number(config["national_sd_pp"],"national_sd")**2+
                       number(config["state_sd_pp"],"state_sd")**2)
    p=normal_cdf(mean/total_sd)
    return {**base,"status":"CALCULATED","reason":None,"target":case.get("target","D"),
            "probability":round(p,9),"margin_mean_pp":round(mean,6),
            "margin_sd_pp":round(total_sd,6),
            "warning":"Independent prospective calibration/validation remains necessary"}

def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument("--evidence-json",type=Path,required=True)
    a.add_argument("--calibration-json",type=Path,required=True)
    a.add_argument("--output",type=Path,required=True)
    v=a.parse_args()
    conf=params(json.loads(v.calibration_json.read_text(encoding="utf-8")))
    cases=json.loads(v.evidence_json.read_text(encoding="utf-8"))
    if not isinstance(cases,list):raise SystemExit("Expected JSON array of cases")
    if len({c["race_id"] for c in cases})!=len(cases):raise SystemExit("Duplicate case IDs")
    results=[calculate(c,conf) for c in cases]
    out={"study_id":"KAH-US-MIDTERMS-2026-HEAD2HEAD-001",
         "model_version":conf["model_version"],
         "validation_status":conf["validation_status"],
         "cases":results,
         "counts":{"calculated":sum(r["status"]=="CALCULATED" for r in results),
                   "blocked":sum(r["status"]=="BLOCKED" for r in results)}}
    v.output.write_text(json.dumps(out,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out["counts"]))
if __name__=="__main__":main()
