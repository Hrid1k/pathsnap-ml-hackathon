from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from scipy.spatial import cKDTree
from .geo import project, bearing_deg, angle_diff
from .data import Trip

FEATURE_NAMES = [
    'distance_m','segment_length_m','projection_fraction','endpoint_min_distance_m',
    'bearing_diff_deg','gps_speed_mps','segment_bearing_sin','segment_bearing_cos',
    'gps_bearing_sin','gps_bearing_cos','time_gap_s','point_displacement_m',
    'midpoint_distance_m','candidate_rank'
]

@dataclass
class CandidateBatch:
    X: np.ndarray
    y: np.ndarray
    trip_ids: np.ndarray
    obs_index: np.ndarray
    arc_ids: np.ndarray
    miss_rate: float
    n_observations: int

class TripGeometry:
    def __init__(self, trip: Trip):
        self.trip=trip
        self.xy_nodes=project(trip.nodes, trip.base_lon, trip.base_lat)
        self.from_xy=self.xy_nodes[trip.arcs[:,0]]
        self.to_xy=self.xy_nodes[trip.arcs[:,1]]
        self.mid_xy=(self.from_xy+self.to_xy)/2
        self.length=np.linalg.norm(self.to_xy-self.from_xy,axis=1)
        self.bearing=bearing_deg(self.from_xy,self.to_xy)
        self.mid_tree=cKDTree(self.mid_xy)
        self.route_set=np.unique(trip.route).astype(int) if trip.route is not None else None
        if self.route_set is not None and len(self.route_set):
            self.route_mid=self.mid_xy[self.route_set]
            self.route_tree=cKDTree(self.route_mid)

    @staticmethod
    def _point_segment(points,a,b):
        ab=b-a
        den=np.sum(ab*ab,axis=-1)
        den=np.maximum(den,1e-12)
        t=np.sum((points-a)*ab,axis=-1)/den
        t=np.clip(t,0,1)
        proj=a+t[...,None]*ab
        d=np.linalg.norm(points-proj,axis=-1)
        return d,t

    def true_arc_for_observations(self, track_xy):
        if self.route_set is None or len(self.route_set)==0:
            return np.full(len(track_xy),-1,dtype=int)
        k=min(8,len(self.route_set))
        _, idx=self.route_tree.query(track_xy,k=k)
        if k==1: idx=idx[:,None]
        cand=self.route_set[idx]
        p=track_xy[:,None,:]
        a=self.from_xy[cand]; b=self.to_xy[cand]
        d,_=self._point_segment(p,a,b)
        return cand[np.arange(len(track_xy)),np.argmin(d,axis=1)]

    def build(self, k=12):
        txy=project(self.trip.track[:,:2],self.trip.base_lon,self.trip.base_lat)
        n=len(txy); k=min(k,len(self.trip.arcs))
        mid_d,cand_idx=self.mid_tree.query(txy,k=k)
        if k==1: cand_idx=cand_idx[:,None]; mid_d=mid_d[:,None]
        true=self.true_arc_for_observations(txy)
        p=txy[:,None,:]; a=self.from_xy[cand_idx]; b=self.to_xy[cand_idx]
        ab=b-a; den=np.maximum(np.sum(ab*ab,axis=2),1e-12)
        proj_t=np.clip(np.sum((p-a)*ab,axis=2)/den,0,1)
        proj=p-proj_t[...,None]*ab-a
        d=np.linalg.norm(proj,axis=2)
        ep=np.minimum(np.linalg.norm(p-a,axis=2),np.linalg.norm(p-b,axis=2))
        seg_b=self.bearing[cand_idx]
        gps_b=np.zeros(n)
        speed=np.zeros(n)
        gap=np.ones(n)
        disp=np.zeros(n)
        if n>1:
            delta=txy[1:]-txy[:-1]; dd=np.linalg.norm(delta,axis=1); dt=np.maximum(np.diff(self.trip.track[:,2]),1e-3)
            speed[1:]=dd/dt; gps_b[1:]=bearing_deg(txy[:-1],txy[1:]); gap[1:]=dt; disp[1:]=dd
        bd=angle_diff(seg_b,gps_b[:,None])
        X=np.column_stack([
            d.ravel(),self.length[cand_idx].ravel(),proj_t.ravel(),ep.ravel(),bd.ravel(),
            np.repeat(speed,k),np.sin(np.deg2rad(seg_b)).ravel(),np.cos(np.deg2rad(seg_b)).ravel(),
            np.repeat(np.sin(np.deg2rad(gps_b)),k),np.repeat(np.cos(np.deg2rad(gps_b)),k),
            np.repeat(gap,k),np.repeat(disp,k),mid_d.ravel(),np.tile(np.arange(k,dtype=float),n)
        ])
        arc_ids=cand_idx.ravel(); obs=np.repeat(np.arange(n),k); y=(arc_ids==np.repeat(true,k)).astype(np.int8)
        miss=float(np.mean(~np.any(cand_idx==true[:,None],axis=1)))
        tids=np.repeat(self.trip.trip_id,len(arc_ids))
        return CandidateBatch(X,y,tids,obs,arc_ids,miss,n)
