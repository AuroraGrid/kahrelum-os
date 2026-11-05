#!/usr/bin/env python3
"""Build a reproducible, credited, unofficial 2026 US results snapshot from licensed CSV sources.
Do not treat leaders as called winners or recast archived KAHRELUM probabilities.
"""
import csv, json, hashlib, datetime, pathlib, argparse, collections
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read_csv(path):
    raw=path.read_bytes()
    rows=list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
    return rows,hashlib.sha256(raw).hexdigest()
def number(x):
    try:return int(x) if str(x).strip() else None
    except ValueError:return None
def dec(x):
    try:return round(float(x),2) if str(x).strip() else None
    except ValueError:return None
def slim_candidate(row):
    return {"name":row["candidate"],"party":row["party"],"votes":number(row["votes"]),"percent":dec(row["percent"]),"calledWinner":row["winner"]=="yes"}
def result_group(office,rows):
    by={}
    for row in rows:
        if row["office"]==office:by.setdefault(row["race_key"],[]).append(row)
    output=[]
    for key,race in sorted(by.items()):
        ranks=sorted(race,key=lambda r:number(r["votes"]) or 0,reverse=True)
        winners=[r for r in race if r["winner"]=="yes"]
        if len(winners)>1:raise ValueError("Conflicting calls in "+key)
        top=winners[0] if winners else ranks[0]
        output.append({
            "id":key,"state":top["state"],"office":office,"title":top["race"],
            "status":"CALLED" if winners else "COUNTING",
            "winnerOrLeader":top["candidate"],"party":top["party"],
            "percentReporting":number(top["percent_reporting"]),
            "sourceUpdatedUtc":top["results_updated_utc"].replace(" ","T")+"Z",
            "candidates":[slim_candidate(r) for r in ranks[:5]],
            "sourceUrl":top["url"]
        })
    return output
def main():
    a=argparse.ArgumentParser()
    a.add_argument("--source-dir",type=pathlib.Path,required=True)
    a.add_argument("--check",action="store_true")
    o=a.parse_args()
    house,house_hash=read_csv(o.source_dir/"house-districts.csv")
    allrows,results_hash=read_csv(o.source_dir/"results.csv")
    if len(house)!=435 or len({r["district"] for r in house})!=435:raise ValueError("House source incomplete")
    if any(r["status"] not in ("called","counting") for r in house):raise ValueError("Unknown House status")
    h=[]
    for r in house:
        h.append({
            "id":r["district"],"state":r["state"],"office":"house",
            "status":"CALLED" if r["status"]=="called" else "COUNTING",
            "winnerOrLeader":r["winner_or_leader"],"party":r["party"],
            "votes":{"DEM":number(r["dem_votes"]),"REP":number(r["rep_votes"]),"OTHER":number(r["other_votes"])},
            "totalVotes":number(r["total_votes"]),"democraticMarginPoints":dec(r["dem_margin_points"]),
            "percentReporting":number(r["percent_reporting"]), "sourceUrl":r["url"]
        })
    sen=result_group("senate",allrows)
    gov=result_group("governor",allrows)
    if len(sen)!=35 or len(gov)!=36:raise ValueError("Non-House source incomplete")
    if len({x["id"] for x in sen})!=35:raise ValueError("Duplicated Senate contest")
    if len({x["id"] for x in gov})!=36:raise ValueError("Duplicated governors")
    def calls(items):return dict(collections.Counter(x["party"] for x in items if x["status"]=="CALLED"))
    dates=[r["results_updated_utc"] for r in allrows if r["results_updated_utc"]]
    summary={"house":{"called":sum(x["status"]=="CALLED" for x in h),"counting":sum(x["status"]=="COUNTING" for x in h),"calledByParty":calls(h)},
      "senate":{"called":sum(x["status"]=="CALLED" for x in sen),"counting":sum(x["status"]=="COUNTING" for x in sen),"calledByParty":calls(sen)},
      "governor":{"called":sum(x["status"]=="CALLED" for x in gov),"counting":sum(x["status"]=="COUNTING" for x in gov),"calledByParty":calls(gov)}}
    if summary["house"]["called"]+summary["house"]["counting"]!=435:raise ValueError("House totals bad")
    snapshot={
      "schema":"KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1",
      "sourceName":"Polling Desk / civicAPI", "sourcePermission":"Polling Desk press page: free to use with credit and link. Results remain unofficial until state certification.",
      "sourceTerms":"https://polling-desk.com/press",
      "sourceUrls":{"house":"https://polling-desk.com/house-districts.csv","results":"https://polling-desk.com/results.csv"},
      "sourceSha256":{"houseCsv":house_hash,"resultsCsv":results_hash},
      "sourceLatestResultUpdatedUtc":max(dates).replace(" ","T")+"Z",
      "retrievalUtc":datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00","Z"),
      "publishedAsOf":"Snapshot captured on 2026-11-05. Each non-House race includes its per-race source timestamp. Earlier race calls are not official state certifications.",
      "resultStatus":"UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED",
      "verificationPolicy":{"reportedLeadersAreWinners":False,"sourceMakesCalls":"civicAPI via Polling Desk","officialStateCertificationSeparate":True,"doesNotReplaceKahrelumLocks":True},
      "summary":summary,"house":h,"senate":sen,"governor":gov}
    path=ROOT/"election"/"results-2026-snapshot.json"
    encoded=json.dumps(snapshot,ensure_ascii=False,indent=2)+"\n"
    if o.check:
      if not path.exists():raise ValueError("Snapshot missing")
      existing=json.loads(path.read_text(encoding="utf-8"))
      for key in ("house","senate","governor","summary","sourceSha256"):
        if existing.get(key)!=snapshot.get(key):raise ValueError("Snapshot content mismatch "+key)
      print("PASS schema and 506 race records; original source SHA matched")
    else:
      path.write_text(encoded,encoding="utf-8",newline="\n")
      print(json.dumps({"path":str(path),"house":len(h),"senate":len(sen),"governors":len(gov),"summary":summary,"latestUpdate":snapshot["sourceLatestResultUpdatedUtc"],"bytes":len(encoded.encode())}))
if __name__=="__main__":main()
