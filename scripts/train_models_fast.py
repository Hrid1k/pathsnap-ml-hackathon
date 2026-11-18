from pathlib import Path
import argparse,json,time
import numpy as np,pandas as pd
from sklearn.model_selection import GroupKFold
from sklearn.metrics import f1_score,log_loss
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression,SGDClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import ExtraTreesClassifier,HistGradientBoostingClassifier
F=['distance_m','segment_length_m','projection_fraction','endpoint_min_distance_m','bearing_diff_deg','gps_speed_mps','segment_bearing_sin','segment_bearing_cos','gps_bearing_sin','gps_bearing_cos','time_gap_s','point_displacement_m','midpoint_distance_m','candidate_rank']

def make(name):
 if name=='logistic': return Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=120,class_weight='balanced',random_state=42))])
 if name=='decision_tree': return DecisionTreeClassifier(max_depth=14,min_samples_leaf=3,class_weight='balanced',random_state=42)
 if name=='extra_trees': return ExtraTreesClassifier(n_estimators=35,max_depth=14,min_samples_leaf=2,class_weight='balanced',n_jobs=-1,random_state=42)
 if name=='hist_gradient_boosting': return HistGradientBoostingClassifier(max_iter=80,max_leaf_nodes=31,learning_rate=.08,l2_regularization=1.0,random_state=42)
 if name=='sgd_log': return Pipeline([('scale',StandardScaler()),('model',SGDClassifier(loss='log_loss',alpha=1e-4,max_iter=40,early_stopping=True,class_weight='balanced',random_state=42))])
 raise KeyError(name)
def top1(df,p):
 x=df[['trip_id','obs_index','y']].copy();x['p']=p;b=x.sort_values('p').groupby(['trip_id','obs_index']).tail(1);return float(b.y.mean())
def sample(df,n,seed=42):
 if len(df)<=n:return df
 rng=np.random.default_rng(seed);idx=[]
 for tid,g in df.groupby('trip_id',sort=False):
  take=min(len(g),max(800,n//df.trip_id.nunique()));idx.extend(rng.choice(g.index,size=take,replace=False).tolist())
 if len(idx)>n:idx=rng.choice(idx,size=n,replace=False).tolist()
 return df.loc[idx].reset_index(drop=True)
ap=argparse.ArgumentParser();ap.add_argument('--train',required=True);ap.add_argument('--test',required=True);ap.add_argument('--outdir',required=True);ap.add_argument('--rows',type=int,default=150000);args=ap.parse_args();out=Path(args.outdir);out.mkdir(parents=True,exist_ok=True)
tr=sample(pd.read_pickle(args.train),args.rows);te=pd.read_pickle(args.test);tr.to_pickle(out/'training_sample.pkl');X=tr[F].values;y=tr.y.values;g=tr.trip_id.values;res=[]
for name in ['logistic','decision_tree','extra_trees','hist_gradient_boosting','sgd_log']:
 print('training',name,flush=True);t0=time.perf_counter();folds=[]
 for a,b in GroupKFold(3).split(X,y,g):
  m=make(name);m.fit(X[a],y[a]);p=m.predict_proba(X[b])[:,1];folds.append({'macro_f1':float(f1_score(y[b],p>=.5,average='macro')),'top1':top1(tr.iloc[b].reset_index(drop=True),p)})
 model=make(name);model.fit(X,y);p=model.predict_proba(te[F].values)[:,1];r={'model':name,'cv_macro_f1':float(np.mean([f['macro_f1'] for f in folds])),'cv_top1':float(np.mean([f['top1'] for f in folds])),'student_top1':top1(te.reset_index(drop=True),p),'student_macro_f1':float(f1_score(te.y.values,p>=.5,average='macro')),'student_log_loss':float(log_loss(te.y.values,np.column_stack([1-p,p]),labels=[0,1])),'training_time_s':time.perf_counter()-t0,'cv_folds':folds};res.append(r);import joblib;joblib.dump(model,out/f'{name}.joblib');print(r,flush=True)
Path(out/'model_comparison.json').write_text(json.dumps(res,indent=2));pd.DataFrame(res).to_csv(out/'model_comparison.csv',index=False);print(pd.DataFrame(res).to_string(index=False))
