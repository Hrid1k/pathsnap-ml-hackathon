from pathlib import Path
import argparse,joblib,folium,numpy as np
from pathsnap.data import load_trip
from pathsnap.features import TripGeometry
from pathsnap.pipeline import MapMatcher

def line_for_arcs(trip, arcs):
 coords=[]
 for aid in arcs:
  a=trip.nodes[trip.arcs[aid,0]]; b=trip.nodes[trip.arcs[aid,1]]; coords.append([[float(a[1]),float(a[0])],[float(b[1]),float(b[0])]])
 return coords
ap=argparse.ArgumentParser();ap.add_argument('--data-root',required=True);ap.add_argument('--trip',required=True);ap.add_argument('--model',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
trip=load_trip(Path(args.data_root)/'student_test'/args.trip,'student_test'); model=joblib.load(args.model); matcher=MapMatcher(model); trip,geom,b,prob,base,pred=matcher.predict_trip(Path(args.data_root)/'student_test'/args.trip,True)
m=folium.Map(location=[trip.base_lat,trip.base_lon],zoom_start=13,control_scale=True)
fg=folium.FeatureGroup(name='GPS observations').add_to(m)
for lon,lat,_ in trip.track: folium.CircleMarker([lat,lon],radius=2,fill=True,fill_opacity=.65).add_to(fg)
fr=folium.FeatureGroup(name='Reference route').add_to(m)
for seg in line_for_arcs(trip,np.unique(trip.route)): folium.PolyLine(seg,weight=3,opacity=.7).add_to(fr)
fp=folium.FeatureGroup(name='HMM predicted route').add_to(m)
for seg in line_for_arcs(trip,pred): folium.PolyLine(seg,weight=5,opacity=.9).add_to(fp)
folium.LayerControl().add_to(m);m.save(args.out);print(args.out)
