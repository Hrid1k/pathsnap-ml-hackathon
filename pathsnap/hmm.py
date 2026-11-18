from __future__ import annotations
import numpy as np

def viterbi_decode(candidates, emissions, from_nodes, to_nodes, gap_penalty=2.0, disconnected_penalty=5.0):
    # candidates: list[np.ndarray] of global arc ids per observation
    # emissions: list[np.ndarray] probabilities aligned to candidates
    T=len(candidates)
    if T==0:return np.array([],dtype=int)
    dp=[np.log(np.maximum(emissions[0],1e-9))]
    back=[np.full(len(candidates[0]),-1,dtype=int)]
    for t in range(1,T):
        prev=candidates[t-1]; cur=candidates[t]
        prev_to=to_nodes[prev]; cur_from=from_nodes[cur]
        trans=np.full((len(prev),len(cur)),-disconnected_penalty,dtype=float)
        for j in range(len(cur)):
            trans[:,j]=np.where(prev_to==cur_from[j],0.0,np.where(prev==cur[j],-0.2,-gap_penalty))
        scores=dp[-1][:,None]+trans+np.log(np.maximum(emissions[t][None,:],1e-9))
        back.append(np.argmax(scores,axis=0))
        dp.append(np.max(scores,axis=0))
    idx=int(np.argmax(dp[-1])); path=[idx]
    for t in range(T-1,0,-1): idx=int(back[t][idx]); path.append(idx)
    path=path[::-1]
    return np.array([candidates[t][path[t]] for t in range(T)],dtype=int)
