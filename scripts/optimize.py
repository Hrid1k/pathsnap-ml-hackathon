from pathlib import Path
import argparse,json,time
import numpy as np,pandas as pd,optuna,joblib
from sklearn.model_selection import GroupKFold
from sklearn.metrics import f1_score
from pathsnap.models import make_model
F=['distance_m','segment_length_m','projection_fraction','endpoint_min_distance_m','bearing_diff_deg','gps_speed_mps','segment_bearing_sin','segment_bearing_cos','gps_bearing_sin','gps_bearing_cos','time_gap_s','point_displacement_m','midpoint_distance_m','candidate_rank']
def top1(df,p):
 x=df[['trip_id','obs_index','y']].copy(); x['p']=p; b=x.sort_values('p').groupby(['trip_id','obs_index']).tail(1); return b.y.mean()
ap=argparse.ArgumentParser(); ap.add_argument('--train',required=True); ap.add_argument('--test',required=True); ap.add_argument('--outdir',required=True); ap.add_argument('--trials',type=int,default=12); args=ap.parse_args()
tr=pd.read_pickle(args.train); te=pd.read_pickle(args.test); X=tr[F].values;y=tr.y.values;g=tr.trip_id.values; gkf=GroupKFold(3)
def objective(t):
 params={'max_iter':t.suggest_int('max_iter',80,220),'max_leaf_nodes':t.suggest_int('max_leaf_nodes',15,63),'learning_rate':t.suggest_float('learning_rate',0.03,0.15,log=True),'l2_regularization':t.suggest_float('l2_regularization',1e-3,10,log=True)}
 scores=[]
 for a,b in gkf.split(X,y,g):
  m=make_model('hist_gradient_boosting',{'model__max_iter':params['max_iter']} if False else {})
  from sklearn.ensemble import HistGradientBoostingClassifier
  m=HistGradientBoostingClassifier(**params,random_state=42)
  m.fit(X[a],y[a]); p=m.predict_proba(X[b])[:,1]; scores.append(f1_score(y[b],p>=0.5,average='macro'))
 return float(np.mean(scores))
study=optuna.create_study(direction='maximize',sampler=optuna.samplers.TPESampler(seed=42)); study.optimize(objective,n_trials=args.trials)
best=study.best_params; model=make_model('hist_gradient_boosting',best); model.fit(X,y); p=model.predict_proba(te[F].values)[:,1]
res={'best_value':study.best_value,'best_params':best,'student_top1':float(top1(te,p)),'student_macro_f1':float(f1_score(te.y.values,p>=0.5,average='macro'))}
out=Path(args.outdir);out.mkdir(parents=True,exist_ok=True);joblib.dump(model,out/'hist_gradient_boosting_bayesian.joblib');Path(out/'bayesian_summary.json').write_text(json.dumps(res,indent=2));study.trials_dataframe().to_csv(out/'bayesian_trials.csv',index=False);print(json.dumps(res,indent=2))
