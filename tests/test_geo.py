import numpy as np
from pathsnap.geo import point_segment_distance

def test_point_segment_distance():
 d,t,p=point_segment_distance(np.array([[0.5,1.0]]),np.array([[0.,0.]]),np.array([[1.,0.]])); assert abs(d[0]-1)<1e-9; assert abs(t[0]-.5)<1e-9
