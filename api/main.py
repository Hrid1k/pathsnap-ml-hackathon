from pathlib import Path
import os,joblib,numpy as np
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathsnap.pipeline import MapMatcher
from pathsnap.data import load_trip
from pathsnap.features import TripGeometry
from pathsnap.metrics import route_continuity

ROOT=Path(__file__).resolve().parents[1]; DATA=Path(os.getenv('PATHSNAP_DATA',ROOT/'data')); MODEL=Path(os.getenv('PATHSNAP_MODEL',ROOT/'artifacts/final_model.joblib'))
app=FastAPI(title='PathSnap API',version='1.0.0'); app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
matcher=MapMatcher(joblib.load(MODEL),candidate_k=8)
@app.get('/health')
def health(): return {'status':'ok','model':MODEL.name}
@app.get('/trips')
def trips():
 d=DATA/'student_test'; return {'trips':sorted([p.name for p in d.iterdir() if p.is_dir()])}
@app.get('/predict/{trip_id}')
def predict(trip_id:str):
 p=DATA/'student_test'/trip_id
 if not p.exists(): raise HTTPException(404,'Trip not found')
 trip,geom,b,prob,base,pred=matcher.predict_trip(p,True)
 from pathsnap.geo import project
 true=geom.true_arc_for_observations(project(trip.track[:,:2],trip.base_lon,trip.base_lat))
 point_acc=float(np.mean(base==true)); hmm_acc=float(np.mean(pred==true)); cont=float(route_continuity(pred,trip.arcs[:,0],trip.arcs[:,1]))
 coords=[[float(trip.nodes[a,1]),float(trip.nodes[a,0])] for a in []]
 def arcs_coords(ids):
  out=[]
  for aid in ids: out.append([[float(trip.nodes[trip.arcs[aid,1],1]),float(trip.nodes[trip.arcs[aid,1],0])]])
  return out
 return {'trip_id':trip_id,'n_observations':len(trip.track),'baseline_point_accuracy':point_acc if trip.route is not None else None,'hmm_point_accuracy':hmm_acc if trip.route is not None else None,'hmm_route_continuity':cont,'gps':trip.track[:,:2].tolist(),'predicted_arc_ids':pred.tolist(),'nodes':trip.nodes.tolist(),'arcs':trip.arcs.tolist()}
app.mount('/ui',StaticFiles(directory=ROOT/'frontend',html=True),name='ui')
