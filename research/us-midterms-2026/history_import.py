#!/usr/bin/env python3
"""KAHRELUM: source-only historical U.S. House fact importer. No forecasts.

MIT Election Data + Science Lab via electiondata.dev (CC0).
Preserves fusion ballot lines, special/RCV exceptions and 2026 geography gates.
"""
import argparse
import csv
import hashlib
import io
import json
import re
from collections import defaultdict, Counter
from datetime import datetime, timezone
from pathlib import Path

STATES=set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split())
MAP_CHANGED=set("AL CA FL LA NC OH TN TX UT".split())
RCV_STATES={"AK","ME"}
CENSUS="https://www.census.gov/programs-surveys/decennial-census/about/rdo/congressional-districts.html"
SOURCE="https://api.electiondata.dev/v1/house-results/table/{year}.csv"
FIELDS=["race_id","state","district","votes_d_2022","votes_r_2022","margin_d_pp_2022",
        "flags_2022","votes_d_2024","votes_r_2024","margin_d_pp_2024",
        "flags_2024","map_2026_status","forecast_readiness","source_2022","source_2024"]

def party_of(label):
    terms=set(re.sub("[^A-Z]+"," ",label.upper()).split())
    d=bool({"DEMOCRAT","DEMOCRATIC"}&terms)
    r="REPUBLICAN" in terms
    return "AMBIGUOUS" if d and r else "D" if d else "R" if r else ""

def parse_file(path, expected_year):
    raw=Path(path).read_bytes()
    digest=hashlib.sha256(raw).hexdigest()
    reader=csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    necessary={"year","state_po","district","stage","special","runoff","candidate","party","candidatevotes","unofficial","mode"}
    if not necessary.issubset(reader.fieldnames or []):
        raise ValueError("Missing MEDSL input columns")
    groups=defaultdict(list); excluded=Counter(); n=0
    for record in reader:
        n+=1
        if record["year"].strip()!=str(expected_year):
            raise ValueError("Historical input row has mismatched election year")
        state=record["state_po"].strip().upper()
        if state not in STATES:
            excluded["non_state"]=excluded["non_state"]+1
            continue
        # In legacy MEDSL rows the GEN runoff field is often blank, not true.
        if record["stage"]!="GEN" or record["special"].lower()!="false" or record["runoff"].strip().lower() not in ("false",""):
            excluded["other_election_type"]+=1; continue
        if record["mode"]!="TOTAL":
            excluded["other_vote_mode"]+=1; continue
        district=int(record["district"])
        if not 0<=district<=53:
            raise ValueError("Invalid district")
        groups[f"HOUSE:{state}-{district:02d}"].append(record)
    norm={}
    for rid, lines in sorted(groups.items()):
        cand=defaultdict(lambda:{"votes":0,"parties":set()})
        issues=set()
        state=rid.split(":")[1][:2]
        for row in lines:
            if row["unofficial"].lower()=="true":issues.add("UNOFFICIAL_SOURCE")
            name=" ".join(row["candidate"].upper().split())
            if not name or name in {"BLANK","VOID","WRITEIN","WRITE IN","SCATTERING","OVERVOTES","OVER VOTES","BLANK VOTES"}:
                continue
            p=party_of(row["party"])
            if p=="AMBIGUOUS":issues.add("AMBIGUOUS_PARTY")
            if p:cand[name]["parties"].add(p)
            if not row["candidatevotes"].strip():
                issues.add("MISSING_VOTES");continue
            v=int(row["candidatevotes"])
            if v<0:raise ValueError("Negative candidate votes")
            cand[name]["votes"]+=v
        totals={"D":0,"R":0}; nominees=Counter()
        for data in cand.values():
            if len(data["parties"])>1:
                issues.add("CONFLICTING_CANDIDATE_PARTY_LINES");continue
            if data["parties"]:
                p=next(iter(data["parties"]))
                if p in totals:
                    nominees[p]+=1
                    totals[p]+=data["votes"]
        if nominees["D"]>1 or nominees["R"]>1:issues.add("MULTIPLE_SAME_PARTY_CANDIDATES")
        if not totals["D"] or not totals["R"]:issues.add("NO_TWO_PARTY_CONTEST")
        if state in RCV_STATES:issues.add("RCV_FINAL_ROUND_REVIEW")
        denom=totals["D"]+totals["R"]
        margin=round(100*(totals["D"]-totals["R"])/denom,6) if min(totals.values())>0 else None
        norm[rid]={"D":totals["D"],"R":totals["R"],"margin":margin,"flags":sorted(issues)}
    meta={"year":expected_year,"source_url":SOURCE.format(year=expected_year),"sha256":digest,
          "raw_rows":n,"house_races":len(norm),"excluded":dict(excluded),
          "license":"CC0-1.0","provenance":"MIT Election Data + Science Lab via electiondata.dev"}
    return norm,meta

def merge(p22,p24):
    a,meta22=parse_file(p22,2022)
    b,meta24=parse_file(p24,2024)
    rows=[]; reasons=Counter()
    for rid in sorted(set(a)|set(b)):
        state,dist=rid.split(":")[1].split("-")
        old=a.get(rid);new=b.get(rid)
        flags=set((old or {}).get("flags",[])) | set((new or {}).get("flags",[]))
        if not old:flags.add("MISSING_2022")
        if not new:flags.add("MISSING_2024")
        if state in MAP_CHANGED:flags.add("2026_MAP_REQUIRES_REBUILD")
        for flag in flags:reasons[flag]+=1
        def value(obj,field):
            return "" if obj is None or obj.get(field) is None else obj[field]
        rows.append({
            "race_id":rid,"state":state,"district":dist,
            "votes_d_2022":value(old,"D"),"votes_r_2022":value(old,"R"),"margin_d_pp_2022":value(old,"margin"),
            "flags_2022":";".join((old or {}).get("flags",[])),
            "votes_d_2024":value(new,"D"),"votes_r_2024":value(new,"R"),"margin_d_pp_2024":value(new,"margin"),
            "flags_2024":";".join((new or {}).get("flags",[])),
            "map_2026_status":"REBUILD_REQUIRED" if state in MAP_CHANGED else "CENSUS_NO_STATEWIDE_CHANGE",
            "forecast_readiness":"BLOCKED_REVIEW_REQUIRED" if flags else "HISTORY_ONLY_NOT_A_2026_FORECAST",
            "source_2022":meta22["source_url"],"source_2024":meta24["source_url"]})
    manifest={"kind":"HISTORICAL_RETURNS_NOT_ELECTION_FORECASTS",
              "created_utc":datetime.now(timezone.utc).isoformat(),
              "inputs":[meta22,meta24],"census_reference":CENSUS,
              "changed_2026_states":sorted(MAP_CHANGED),"house_races":len(rows),
              "readiness":dict(Counter(x["forecast_readiness"] for x in rows)),
              "review_flags":dict(reasons),
              "independence_note":"No rival model probabilities or seats imported"}
    return rows,manifest

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--house-2022",type=Path,required=True)
    p.add_argument("--house-2024",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--manifest",type=Path,required=True)
    args=p.parse_args()
    rows,manifest=merge(args.house_2022,args.house_2024)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open("w",encoding="utf-8",newline="") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS);w.writeheader();w.writerows(rows)
    args.manifest.write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"house_races":len(rows),"readiness":manifest["readiness"],
                      "review_flags":manifest["review_flags"]}))
if __name__=="__main__":main()
