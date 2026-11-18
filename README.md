# PathSnap — GPS Trajectory Map Matching & Route Reconstruction

This repository implements the PathSnap challenge as an end-to-end system: raw GPS trajectory processing, candidate road generation, supervised candidate scoring, five-model experimentation, Bayesian hyperparameter optimisation, HMM/Viterbi route decoding, FastAPI inference, and evaluator UI.

## Problem
Given noisy GPS observations and a connected directed road network, recover the most likely road sequence travelled.

## Architecture
`raw .track/.nodes/.arcs/.route → preprocessing → candidate generation → candidate features → model score → HMM/Viterbi → route → API → UI`

## Dataset
The provided dataset is partitioned into 80 training trips and 10 student-test trips. The project deliberately keeps evaluator-test data out of development. Put the supplied dataset under `data/` with `train/` and `student_test/` folders. Do not add evaluator labels to the client UI.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Explore data
```bash
python scripts/inspect_dataset.py
```

## Build candidate features
```bash
python scripts/build_features.py --data-root data --partition train --out experiments/train_candidates.pkl
python scripts/build_features.py --data-root data --partition student_test --out experiments/student_candidates.pkl
```

## Train five models
```bash
python scripts/train_models.py --train experiments/train_candidates.pkl --test experiments/student_candidates.pkl --outdir artifacts/models
```

The five required models are Logistic Regression, Random Forest, Extra Trees, HistGradientBoosting and MLP.

## Bayesian optimisation
```bash
python scripts/optimize.py --train experiments/train_candidates.pkl --test experiments/student_candidates.pkl --outdir artifacts/bayes --trials 12
```

## Final model
Copy the selected/tuned model to `artifacts/final_model.joblib` and run:
```bash
python scripts/evaluate_final.py --data-root data --model artifacts/final_model.joblib --out experiments/student_test_final.csv
```

## Folium map
```bash
python scripts/make_maps.py --data-root data --trip 00000001 --model artifacts/final_model.joblib --out experiments/pathsnap_trip_00000001.html
```

## API
Laptop 1:
```bash
PATHSNAP_DATA=./data PATHSNAP_MODEL=./artifacts/final_model.joblib uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Endpoints:
- `GET /health`
- `GET /trips`
- `GET /predict/{trip_id}`

## UI
Laptop 2 can open `frontend/index.html` and set the API base URL with:
```js
localStorage.setItem('pathsnap_api','http://<LAPTOP-1-IP>:8000')
```
Then open the HTML file in a browser. For a local demo, the API also serves it at `/ui/`.

## Academic-integrity note
This repository contains code and experiment tooling. Reported metrics must come from the generated experiment files. Do not fabricate results, and keep evaluator-test labels server-side.
