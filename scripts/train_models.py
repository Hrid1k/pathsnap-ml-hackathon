from pathlib import Path
import argparse,json,time
import numpy as np,pandas as pd
from sklearn.model_selection import GroupKFold
from sklearn.metrics import f1_score, accuracy_score, log_loss
from pathsnap.models import make_model

FEATURES=['distance_m','segment_length_m','projection_fraction','endpoint_min_distance_m','bearing_diff_deg','gps_speed_mps','segment_bearing_sin','segment_bearing_cos','gps_bearing_sin','gps_bearing_cos','time_gap_s','point_displacement_m','midpoint_distance_m','candidate_rank']

def eval_obs(df, prob):
    tmp=df[['trip_id','obs_index','y']].copy(); tmp['p']=prob
    best=tmp.sort_values('p').groupby(['trip_id','obs_index']).tail(1)
    return float(best.y.mean())

def run_one(name, train, test, folds=3):
    X=train[FEATURES].values; y=train.y.values; groups=train.trip_id.values
    gkf=GroupKFold(n_splits=folds); cv=[]; t0=time.perf_counter()
    for tr,va in gkf.split(X,y,groups):
        m=make_model(name); m.fit(X[tr],y[tr]); p=m.predict_proba(X[va])[:,1]
        cv.append({'macro_f1':float(f1_score(y[va],p>=0.5,average='macro')),'top1':eval_obs(train.iloc[va].reset_index(drop=True),p)})
    model=make_model(name); t1=time.perf_counter(); model.fit(X,y); train_time=time.perf_counter()-t1
    p=model.predict_proba(test[FEATURES].values)[:,1]; infer_start=time.perf_counter(); _=model.predict_proba(test[FEATURES].values); infer_time=time.perf_counter()-infer_start
    res={'model':name,'cv_macro_f1':float(np.mean([x['macro_f1'] for x in cv])),'cv_top1':float(np.mean([x['top1'] for x in cv])), 'student_top1':eval_obs(test.reset_index(drop=True),p), 'student_macro_f1':float(f1_score(test.y.values,p>=0.5,average='macro')), 'student_log_loss':float(log_loss(test.y.values,np.column_stack([1-p,p]),labels=[0,1])),'train_time_s':train_time,'inference_time_s':infer_time,'cv_folds':cv}
    return model,res

ap=argparse.ArgumentParser(); ap.add_argument('--train',required=True); ap.add_argument('--test',required=True); ap.add_argument('--outdir',required=True); args=ap.parse_args()
out=Path(args.outdir); out.mkdir(parents=True,exist_ok=True)
train=pd.read_pickle(args.train); test=pd.read_pickle(args.test)
results=[]
for name in ['logistic','random_forest','extra_trees','hist_gradient_boosting','mlp']:
    print('training',name,flush=True); model,res=run_one(name,train,test); results.append(res)
    import joblib; joblib.dump(model,out/f'{name}.joblib')
Path(out/'model_comparison.json').write_text(json.dumps(results,indent=2))
pd.DataFrame(results).to_csv(out/'model_comparison.csv',index=False)
print(pd.DataFrame(results).to_string(index=False))
