from __future__ import annotations
import numpy as np

EARTH_M_PER_DEG_LAT = 110540.0
EARTH_M_PER_DEG_LON = 111320.0

def project(lonlat: np.ndarray, base_lon: float, base_lat: float) -> np.ndarray:
    lonlat = np.asarray(lonlat, dtype=float)
    x = (lonlat[...,0] - base_lon) * EARTH_M_PER_DEG_LON * np.cos(np.deg2rad(base_lat))
    y = (lonlat[...,1] - base_lat) * EARTH_M_PER_DEG_LAT
    return np.stack([x,y], axis=-1)

def bearing_deg(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    d = b-a
    return (np.degrees(np.arctan2(d[...,0], d[...,1])) + 360) % 360

def angle_diff(a,b):
    return np.abs((a-b+180)%360-180)

def point_segment_distance(points, a, b):
    p = np.asarray(points); a=np.asarray(a); b=np.asarray(b)
    ab=b-a
    den=np.sum(ab*ab,axis=-1)
    den=np.maximum(den,1e-12)
    t=np.sum((p-a)*ab,axis=-1)/den
    t=np.clip(t,0,1)
    proj=a+t[...,None]*ab
    d=np.linalg.norm(p-proj,axis=-1)
    return d,t,proj
