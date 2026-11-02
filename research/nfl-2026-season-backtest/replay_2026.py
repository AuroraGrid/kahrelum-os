"""New 2026 retrospective re-execution of KAHRELUM v0.1 (research only).
No pregame provenance claim, betting authorization, or model promotion."""
from pathlib import Path
import datetime as dt, hashlib, io, json, zipfile, urllib.request
import numpy as np
import pandas as pd

HERE=Path(__file__).resolve().parent
PKG=Path(r'C:\Users\Asif Computer\Documents\Codex\2026-10-04\use-the-attached-kahrelum-nfl-betting\outputs\KAHRELUM_Numerical_Engine_v0.1_Research_Package.zip')
GAME_URL='https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv'
PBP_URL='https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.parquet'
HISTORICAL_END='2026-11-01'
PRE_MNF_END='2026-11-02'
METHOD_COMMIT='26f0234ae97a6d40b4d4b48d7c9bb1e9945736c3'

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def weighted_mean(prior,current):
    p=np.asarray(prior,float)
    c=np.asarray(current,float)
    if not len(c):return p.copy()
    if c.ndim==1:c=c.reshape(1,-1)
    count=np.isfinite(c).sum(0)
    means=np.where(count>0,np.nansum(c,axis=0)/np.maximum(count,1),p)
    return (8*p+len(c)*means)/(8+len(c))
def score_binary(prob,outcome):
    return (prob-float(outcome))**2
def is_settled_at_cutoff(gameday,away_score,home_score,cutoff):
    return str(gameday)<=cutoff and pd.notna(away_score) and pd.notna(home_score)
def fetch(url,dest):
    if dest.exists():return
    req=urllib.request.Request(url,headers={'User-Agent':'KAHRELUM-research-audit/1.0'})
    with urllib.request.urlopen(req,timeout=90) as r, open(str(dest)+'.part','wb') as f:
        while b:=r.read(1024*1024): f.write(b)
    Path(str(dest)+'.part').replace(dest)
def pull_aggregates(pbp):
    p=pbp[pbp.posteam.notna() & pbp.defteam.notna() & pbp.epa.notna() & pbp.play_type.isin(['pass','run'])].copy()
    p['explosive']=((p['pass'].eq(1)&p.yards_gained.ge(20))|(p.rush.eq(1)&p.yards_gained.ge(10))).astype(float)
    p['turnover']=p.interception.fillna(0)+p.fumble_lost.fillna(0)
    p['early_epa']=p.epa.where(p.down.le(2))
    p['pass_epa']=p.epa.where(p['pass'].eq(1))
    p['rush_epa']=p.epa.where(p.rush.eq(1))
    p['redzone_epa']=p.epa.where(p.yardline_100.le(20))
    p['neutral_pass']=p['pass'].where(p.qtr.le(3)&p.score_differential.abs().le(7))
    stats=['epa','success','early_epa','pass_epa','rush_epa','explosive','sack','turnover','redzone_epa','neutral_pass']
    off=p.groupby(['game_id','posteam'])[stats].mean().add_prefix('off_')
    de=p.groupby(['game_id','defteam'])[stats].mean().add_prefix('def_')
    de.index.names=off.index.names
    return off.join(de).reset_index().rename(columns={'posteam':'team'})
def read_pbp(path):
    import pyarrow.parquet as pq
    selected=['game_id','posteam','defteam','epa','success','down','pass','rush','yards_gained','sack','interception','fumble_lost','yardline_100','qtr','score_differential','play_type']
    found=pq.read_schema(path).names
    missing=set(selected)-set(found)
    if missing:raise RuntimeError('Missing PBP features '+str(sorted(missing)))
    return pd.read_parquet(path,columns=selected)
def novig(a,h):
    def implied(v):
        v=float(v)
        if not v:return np.nan
        return 100/(v+100) if v>0 else (-v)/((-v)+100)
    pa,ph=implied(a),implied(h)
    return ph/(pa+ph) if np.isfinite(pa+ph) and (pa+ph)>0 else np.nan

def main():
    if not PKG.exists():raise FileNotFoundError('Original 2025 research package missing')
    games_path=HERE/'games_2026_capture.csv';pbp_path=HERE/'play_by_play_2026_capture.parquet'
    fetch(GAME_URL,games_path);fetch(PBP_URL,pbp_path)
    with zipfile.ZipFile(PKG) as z:
        names=set(z.namelist())
        needed={'artifacts/team_game_aggregates.parquet','artifacts/fitted_model.json','artifacts/paired_oos_residuals.npy'}
        if not needed.issubset(names):raise RuntimeError('Missing original model artifact: '+str(needed-names))
        past=pd.read_parquet(io.BytesIO(z.read('artifacts/team_game_aggregates.parquet')))
        models=json.loads(z.read('artifacts/fitted_model.json').decode('utf-8'))
        residuals=np.load(io.BytesIO(z.read('artifacts/paired_oos_residuals.npy')))
    assert len(models)==2 and {m['target'] for m in models}=={'margin','total'}
    assert len(residuals)>=256 and residuals.shape[1]==2
    res=residuals-residuals.mean(axis=0)
    games=pd.read_csv(games_path)
    g25=games[(games.season==2025)&(games.game_type=='REG')].dropna(subset=['home_score','away_score']).sort_values(['gameday','game_id']).copy()
    g26=games[(games.season==2026)&(games.game_type=='REG')&(games.gameday<=PRE_MNF_END)].sort_values(['gameday','game_id']).copy()
    assert len(g25)>=260 and len(g26)>=115,(len(g25),len(g26))
    assert g26.game_id.is_unique
    prior_stats=[c for c in past.columns if c not in ['game_id','team']]
    history25={t:[] for t in set(g25.home_team)|set(g25.away_team)}
    past_index=past.set_index(['game_id','team'])
    for g in g25.itertuples(index=False):
        for t,pf,pa in [(g.home_team,g.home_score,g.away_score),(g.away_team,g.away_score,g.home_score)]:
            if (g.game_id,t) not in past_index.index:raise RuntimeError('2025 aggregate missing '+str((g.game_id,t)))
            rec=past_index.loc[(g.game_id,t),prior_stats].to_dict()
            rec.update(points_for=float(pf),points_against=float(pa))
            history25.setdefault(t,[]).append(rec)
    names=prior_stats+['points_for','points_against']
    priors={}
    for team,lst in history25.items():
        if not lst:continue
        mat=np.array([[rec[n] for n in names] for rec in lst],float)
        cnt=np.isfinite(mat).sum(0)
        priors[team]=np.where(cnt>0,np.nansum(mat,axis=0)/np.maximum(cnt,1),0.0)
    current={team:[] for team in priors}
    p26=read_pbp(pbp_path)
    agg=pull_aggregates(p26)
    idx=agg.set_index(['game_id','team'])
    print('CAPTURED',len(g26),'scheduled through Monday',len(p26),'PBP rows',len(agg),'team-game aggregates',flush=True)
    pre=[]; outcome_later={}
    for g in g26.itertuples(index=False):
        if g.home_team not in priors or g.away_team not in priors:
            raise RuntimeError('Missing 2025 prior: '+str((g.game_id,g.away_team,g.home_team)))
        eligible=is_settled_at_cutoff(g.gameday,g.away_score,g.home_score,HISTORICAL_END)
        if not eligible and str(g.gameday)!=PRE_MNF_END:raise RuntimeError('Unsettled earlier game '+g.game_id)
        if not np.isfinite([g.home_rest,g.away_rest]).all():raise RuntimeError('Rest missing for '+g.game_id)
        def features(t):
            rows=current[t][-8:]
            mat=np.array([[rec[n] for n in names] for rec in rows],float) if rows else np.empty((0,len(names)))
            return weighted_mean(priors[t],mat)
        h=features(g.home_team);a=features(g.away_team)
        f={**{f'diff_{k}':float(v) for k,v in zip(names,h-a)},
           **{f'sum_{k}':float(v) for k,v in zip(names,h+a)},
           'home_field':float(g.location=='Home'),
           'rest_diff':float(np.clip(g.home_rest-g.away_rest,-10,10)),
           'rest_sum':float(np.clip(g.home_rest,4,14)+np.clip(g.away_rest,4,14))}
        pred={}
        for m in models:
            x=np.array([f[n] for n in m['features']],float)
            if not np.isfinite(x).all():raise RuntimeError('Missing feature '+g.game_id)
            pred[m['target']]=float(m['intercept']+((x-np.array(m['means']))/np.array(m['scales']))@np.array(m['coefficients_standardized']))
        p_home=float(np.mean(pred['margin']+res[:,0]>0))
        model_pick=g.home_team if p_home>=.5 else g.away_team
        pre.append(dict(game_id=g.game_id,week=int(g.week),gameday=str(g.gameday),
                        away=g.away_team,home=g.home_team,
                        model_home_p=p_home,model_pick=model_pick,model_pick_p=max(p_home,1-p_home),
                        K_home_margin=pred['margin'],K_total=pred['total'],
                        home_games_before=len(current[g.home_team]),
                        away_games_before=len(current[g.away_team]),
                        cohort='RETROSPECTIVE_MODEL_REPLAY_V01' if eligible else 'NEW_PRE_MNF_RESEARCH_ONLY',
                        historic_lock_claim='NO',market_used_as_feature='NO'))
        if eligible:
            outcome_later[g.game_id]=(int(g.away_score),int(g.home_score))
            for t,pf,pa in [(g.home_team,g.home_score,g.away_score),(g.away_team,g.away_score,g.home_score)]:
                if (g.game_id,t) not in idx.index:raise RuntimeError('2026 PBP aggregate missing '+str((g.game_id,t)))
                rec=idx.loc[(g.game_id,t),prior_stats].to_dict()
                rec.update(points_for=float(pf),points_against=float(pa))
                current[t].append(rec)
    ptab=pd.DataFrame(pre)
    pfile=HERE/'REPLAY_PREDICTIONS_MARKET_BLIND.csv'
    ptab.to_csv(pfile,index=False,float_format='%.12g')
    p_sha=sha(pfile)
    # Scores and odds are only joined AFTER generating and SHA-freezing model predictions.
    market_cols=['game_id','home_moneyline','away_moneyline']
    missing_mkt=set(market_cols)-set(games.columns)
    mg=games[market_cols].set_index('game_id') if not missing_mkt else None
    grades=[]
    for row in pre:
        if row['game_id'] not in outcome_later:continue
        away_score,home_score=outcome_later[row['game_id']]
        win=row['home'] if home_score>away_score else row['away'] if away_score>home_score else 'TIE'
        ph=row['model_home_p']
        market_ph=np.nan
        if mg is not None:
            q=mg.loc[row['game_id']]
            if pd.notna(q.home_moneyline) and pd.notna(q.away_moneyline):
                market_ph=novig(q.away_moneyline,q.home_moneyline)
        market_favorite=row['home'] if market_ph>=.5 else row['away'] if np.isfinite(market_ph) else None
        grades.append({**row,'actual_away_score':away_score,'actual_home_score':home_score,
          'actual_winner':win,'grade':'PUSH_TIE' if win=='TIE' else ('WIN' if row['model_pick']==win else 'LOSS'),
          'brier_home':score_binary(ph,int(win==row['home'])) if win!='TIE' else np.nan,
          'market_home_p_from_current_schedule_archive':market_ph,
          'market_pick':market_favorite,
          'market_grade':('WIN' if market_favorite==win else 'LOSS') if market_favorite and win!='TIE' else 'UNAVAILABLE',
          'market_brier':score_binary(market_ph,int(win==row['home'])) if np.isfinite(market_ph) and win!='TIE' else np.nan})
    df=pd.DataFrame(grades)
    gfile=HERE/'REPLAY_GRADED_AFTER_PREDICTION_LOCK.csv'
    df.to_csv(gfile,index=False,float_format='%.12g')
    byweek=[]
    for week,part in df.groupby('week'):
        s=part[part.grade.isin(['WIN','LOSS'])]
        ms=part[part.market_grade.isin(['WIN','LOSS'])]
        byweek.append(dict(week=int(week),games=len(part),resolved=len(s),
            wins=int((s.grade=='WIN').sum()),losses=int((s.grade=='LOSS').sum()),
            win_rate=float((s.grade=='WIN').mean()) if len(s) else None,
            model_brier=float(s.brier_home.mean()) if len(s) else None,
            market_games=len(ms),market_wins=int((ms.market_grade=='WIN').sum()),
            market_brier=float(ms.market_brier.mean()) if len(ms) else None))
    non_tied=df[df.grade.isin(['WIN','LOSS'])]
    comparable=df[df.market_grade.isin(['WIN','LOSS'])]
    summary=dict(captured_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
        model='KAHRELUM numerical v0.1 original frozen Oct4 fitted coefficients',
        status='RETROSPECTIVE_REEXECUTION_NOT_ORIGINAL_PREGAME_CALLS;RESEARCH_ONLY;NO_BETS',
        pred_prejoin_sha256=p_sha, all_results_sha256=sha(gfile), n=len(df),
        ties=int((df.grade=='PUSH_TIE').sum()),wins=int((non_tied.grade=='WIN').sum()),
        losses=int((non_tied.grade=='LOSS').sum()),
        accuracy=float((non_tied.grade=='WIN').mean()),
        brier=float(non_tied.brier_home.mean()),
        market_matched=len(comparable),
        market_favorites_wins=int((comparable.market_grade=='WIN').sum()),
        market_brier=float(comparable.market_brier.mean()) if len(comparable) else None,
        prospective_research_picks=[r for r in pre if r['cohort']=='NEW_PRE_MNF_RESEARCH_ONLY'],
        weekly=byweek, failed_promotion_preserved=True, no_market_predictors=True,
        model_history_cutoff='training through 2025, produced Oct4 2026',
        vintage='2026 source PBP downloaded AFTER Sept-Oct games; strict point-in-time not established')
    sumfile=HERE/'REPLAY_SCOREBOARD.json'
    sumfile.write_text(json.dumps(summary,indent=2,allow_nan=False),encoding='utf-8')
    manifest=dict(freeze_at_utc=summary['captured_utc'],method_lock_commit=METHOD_COMMIT,
        source_uris=[GAME_URL,PBP_URL],
        files={p.name:sha(p) for p in [PKG,games_path,pbp_path,pfile,gfile,sumfile]},
        source_data_retrospective=True, original_snapshot_unchanged=True,
        status='SHA256_MANIFEST;NOT_PREGAME_TIMESTAMPS;NO_ACTUAL_BETS')
    (HERE/'MANIFEST_SHA256.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print('FINAL_SUMMARY',json.dumps(summary,allow_nan=False),flush=True)
    print('SHA256_MANIFEST',json.dumps(manifest,allow_nan=False),flush=True)

if __name__=='__main__':
    main()
