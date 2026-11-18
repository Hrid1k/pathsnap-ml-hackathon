from pathlib import Path
import json,numpy as np,pandas as pd
from pathsnap.data import iter_partition
root=Path(__file__).resolve().parents[1]/'data'; out=Path(__file__).resolve().parents[1]/'experiments';out.mkdir(exist_ok=True)
rows=[]
for part in ['train','student_test']:
 for t in iter_partition(root,part):
  dt=np.diff(t.track[:,2]) if len(t.track)>1 else np.array([])
  rows.append({'partition':part,'trip_id':t.trip_id,'gps_points':len(t.track),'nodes':len(t.nodes),'arcs':len(t.arcs),'route_arcs':len(t.route) if t.route is not None else 0,'min_dt':float(dt.min()) if len(dt) else None,'max_dt':float(dt.max()) if len(dt) else None,'median_dt':float(np.median(dt)) if len(dt) else None,'lon_min':float(t.track[:,0].min()),'lon_max':float(t.track[:,0].max()),'lat_min':float(t.track[:,1].min()),'lat_max':float(t.track[:,1].max())})
df=pd.DataFrame(rows);df.to_csv(out/'dataset_summary.csv',index=False);print(df.groupby('partition').agg({'trip_id':'count','gps_points':['min','max','mean'],'nodes':'mean','arcs':'mean','route_arcs':'mean'}))
