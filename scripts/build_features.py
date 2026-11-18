from pathlib import Path
import argparse, json, numpy as np, pandas as pd
from pathsnap.data import iter_partition
from pathsnap.features import TripGeometry

ap=argparse.ArgumentParser(); ap.add_argument('--data-root',required=True); ap.add_argument('--out',required=True); ap.add_argument('--partition',default='train'); ap.add_argument('--k',type=int,default=12); args=ap.parse_args()
rows=[]
miss={}
for trip in iter_partition(args.data_root,args.partition):
    geom=TripGeometry(trip); b=geom.build(args.k); miss[trip.trip_id]=b.miss_rate
    df=pd.DataFrame(b.X,columns=__import__('pathsnap.features',fromlist=['FEATURE_NAMES']).FEATURE_NAMES)
    df['y']=b.y; df['trip_id']=b.trip_ids; df['obs_index']=b.obs_index; df['arc_id']=b.arc_ids
    rows.append(df)
out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True)
full=pd.concat(rows,ignore_index=True); full.to_pickle(out)
Path(str(out)+'.miss.json').write_text(json.dumps(miss,indent=2))
print('rows',len(full),'positive_rate',full.y.mean(),'miss_rate',np.mean(list(miss.values())))
