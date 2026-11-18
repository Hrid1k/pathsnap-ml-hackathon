from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import numpy as np

@dataclass
class Trip:
    trip_id: str
    partition: str
    track: np.ndarray      # lon, lat, timestamp
    nodes: np.ndarray      # lon, lat
    arcs: np.ndarray       # from_node, to_node
    route: np.ndarray | None
    base_lon: float
    base_lat: float

    @property
    def arc_count(self): return len(self.arcs)
    @property
    def track_count(self): return len(self.track)


def load_trip(trip_dir: str | Path, partition: str) -> Trip:
    p = Path(trip_dir)
    trip_id = p.name
    track = np.loadtxt(p / f"{trip_id}.track")
    nodes = np.loadtxt(p / f"{trip_id}.nodes")
    arcs = np.loadtxt(p / f"{trip_id}.arcs", dtype=np.int64)
    route_path = p / f"{trip_id}.route"
    route = np.loadtxt(route_path, dtype=np.int64) if route_path.exists() else None
    if track.ndim == 1: track = track[None, :]
    if nodes.ndim == 1: nodes = nodes[None, :]
    if arcs.ndim == 1: arcs = arcs[None, :]
    if route is not None and route.ndim == 0: route = route[None]
    base_lon = float(np.mean(track[:,0]))
    base_lat = float(np.mean(track[:,1]))
    return Trip(trip_id, partition, track, nodes, arcs, route, base_lon, base_lat)


def iter_partition(root: str | Path, partition: str):
    d = Path(root) / partition
    for trip_dir in sorted([p for p in d.iterdir() if p.is_dir()]):
        yield load_trip(trip_dir, partition)
