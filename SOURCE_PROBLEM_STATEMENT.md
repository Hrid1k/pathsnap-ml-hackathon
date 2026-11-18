# Problem statement derived from the supplied video

## Core problem
Given a sequence of noisy GPS measurements recorded at regular intervals and a connected road network, recover the actual road route travelled.

## Video progression
GPS Trajectory
→ GPS Measurement Noise
→ Noisy points over a connected road network
→ “Which road was taken?”
→ Map Matching
→ Recover the Route

## Concepts established by the video
1. GPS trajectory
2. GPS measurement noise
3. Connected road network
4. Map matching
5. Route recovery

The implementation in this repository extends that problem statement with the required dataset, model experimentation, Bayesian optimisation, HMM/Viterbi decoding, API and UI described in the supplied PathSnap supporting documents.
