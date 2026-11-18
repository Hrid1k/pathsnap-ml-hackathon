from pathlib import Path
import argparse,json,joblib,numpy as np,pandas as pd,time
from pathsnap.data import iter_partition
from pathsnap.features import TripGeometry
from pathsnap.hmm import viterbi_decode
from pathsnap.metrics import route_continuity
ap=argparse.ArgumentParser();ap.add_argument('--data-root',required=True);ap.add_argument('--model',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
model=joblib.load(args.model); rows=[]
for trip in iter_partition(args.data_root,'student_test'):
 g=TripGeometry(trip);b=g.build(8);p=model.predict_proba(b.X)[:,1]; candidates=[];em=[];base=[]
 for i in range(b.n_observations):
  m=b.obs_index==i;c=b.arc_ids[m];q=p[m];candidates.append(c);em.append(q);base.append(c[np.argmax(q)])
 base=np.array(base);pred=viterbi_decode(candidates,em,trip.arcs[:,0],trip.arcs[:,1]);true=g.true_arc_for_observations(__import__('pathsnap.geo',fromlist=['project']).project(trip.track[:,:2],trip.base_lon,trip.base_lat));rows.append({'trip_id':trip.trip_id,'baseline_top1':np.mean(base==true),'hmm_top1':np.mean(pred==true),'baseline_continuity':route_continuity(base,trip.arcs[:,0],trip.arcs[:,1]),'hmm_continuity':route_continuity(pred,trip.arcs[:,0],trip.arcs[:,1]),'candidate_miss_rate':b.miss_rate})
pd.DataFrame(rows).to_csv(args.out,index=False);print(pd.DataFrame(rows).to_string(index=False));print('MEAN');print(pd.DataFrame(rows).mean(numeric_only=True))
