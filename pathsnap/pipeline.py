from __future__ import annotations
from pathlib import Path
import json, time
import joblib
import numpy as np
from .data import load_trip
from .features import TripGeometry
from .hmm import viterbi_decode

class MapMatcher:
    def __init__(self, model, candidate_k=8):
        self.model=model; self.candidate_k=candidate_k
    def predict_trip(self, trip_dir, use_hmm=True):
        trip=load_trip(trip_dir,'inference'); geom=TripGeometry(trip)
        batch=geom.build(self.candidate_k)
        prob=self.model.predict_proba(batch.X)[:,1]
        candidates=[]; emissions=[]; point_preds=[]
        for i in range(batch.n_observations):
            mask=batch.obs_index==i
            c=batch.arc_ids[mask]; p=prob[mask]
            candidates.append(c); emissions.append(p); point_preds.append(int(c[np.argmax(p)]))
        point_preds=np.array(point_preds,dtype=int)
        if use_hmm:
            pred=viterbi_decode(candidates,emissions,trip.arcs[:,0],trip.arcs[:,1])
        else: pred=point_preds
        return trip,geom,batch,prob,point_preds,pred

def save_artifact(model, metadata, out):
    out=Path(out); out.parent.mkdir(parents=True,exist_ok=True)
    joblib.dump(model,out)
    out.with_suffix('.json').write_text(json.dumps(metadata,indent=2))
