from __future__ import annotations
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, log_loss, precision_score, recall_score

def candidate_metrics(y_true, prob, obs):
    pred=(prob>=0.5).astype(int)
    return {
      'accuracy':float(accuracy_score(y_true,pred)),
      'precision':float(precision_score(y_true,pred,zero_division=0)),
      'recall':float(recall_score(y_true,pred,zero_division=0)),
      'f1':float(f1_score(y_true,pred,zero_division=0)),
      'log_loss':float(log_loss(y_true,np.column_stack([1-prob,prob]),labels=[0,1])) if len(np.unique(y_true))==2 else np.nan
    }

def observation_top1(y_true, prob, obs):
    best={}
    for i,p in enumerate(prob):
        o=int(obs[i])
        if o not in best or p>best[o][0]: best[o]=(float(p),int(y_true[i]))
    vals=np.array([v[1] for v in best.values()])
    return float(vals.mean()) if len(vals) else 0.0

def route_continuity(pred_arcs, arc_from, arc_to):
    if len(pred_arcs)<2: return 1.0
    ok=0
    for a,b in zip(pred_arcs[:-1],pred_arcs[1:]):
        ok += int(a==b or arc_to[a]==arc_from[b])
    return ok/(len(pred_arcs)-1)
