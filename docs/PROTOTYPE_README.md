# PathSnap — GPS Trajectory Map Matching & Route Recovery

PathSnap is a browser-based demonstration of GPS trajectory map matching. It generates a synthetic road network and a noisy GPS trip, then compares independent nearest-road matching with a context-aware HMM/Viterbi decoder. It reconstructs connected road paths, visualises the results, and exports experiment data.

> **Submission status:** This repository currently contains the JavaScript prototype supplied to the team. It is not yet the complete ML-hackathon submission described in `docs/DELIVERABLE_1_STATUS.md`. In particular, the supplied ZIP does not contain the real hackathon dataset, five trained ML models, Bayesian optimisation, a Python/FastAPI backend, or Folium maps. Do not describe the synthetic demo results as results on the official student-testing dataset.

## What is implemented

- Synthetic connected grid-road network and GPS trip generation.
- Seeded Gaussian GPS noise.
- GPS CSV import and road-network JSON import.
- Nearest-road baseline.
- Candidate-road scoring with HMM-style Viterbi decoding.
- Connected route reconstruction using shortest paths.
- Browser UI with map layers, fix inspection, metrics and exports.
- Synthetic noise/sampling benchmark sweeps.
- Automated Node.js tests.

## Technology

- JavaScript ES modules
- HTML and CSS
- Node.js 20+ for tests, examples and build
- No third-party npm packages are required by this prototype

## Repository layout

```text
pathsnap-ml-hackathon/
├── index.html                 # Main browser application
├── PathSnap.html              # Standalone built demo
├── style.css                  # UI styling
├── package.json               # Node scripts and version requirement
├── src/
│   ├── data.js                # Synthetic data and GPS CSV parsing
│   ├── roads.js               # Road graph, projection and routing
│   ├── noise.js               # GPS noise generation
│   ├── matching.js            # Nearest-road and HMM/Viterbi matching
│   ├── evaluation.js          # Metrics and synthetic benchmarks
│   ├── export.js              # CSV/JSON exports
│   ├── visualization.js       # Map and chart rendering
│   ├── experiment-worker.js   # Background benchmark worker
│   └── ui.js                  # Browser UI interactions
├── examples/                  # Synthetic example inputs and outputs
├── scripts/build.js           # Builds standalone PathSnap.html
├── tests/matching.test.js     # Automated tests
└── docs/
    └── DELIVERABLE_1_STATUS.md
```

## Requirements

- A modern desktop browser.
- Python 3 (only if you want to serve the files locally).
- Node.js 20+ (only for tests, regenerating examples and building the standalone page).

## Run the application on Windows

1. Download or clone this repository.
2. Open the project folder in File Explorer.
3. Click the address bar, type `powershell`, and press Enter.
4. Start a local static web server:

```powershell
python -m http.server 8765
```

5. Open `http://localhost:8765` in Chrome or Edge.

You can also open `PathSnap.html` directly for the standalone demo.

## Run tests and build

Open PowerShell in the repository folder:

```powershell
npm test
npm run example
npm run build
```

`npm test` runs the automated tests. `npm run example` regenerates the bundled synthetic example data. `npm run build` regenerates `PathSnap.html`.

## Using your own GPS and road files

In the application, expand **Load GPS and roads**.

GPS CSV must contain these columns:

```csv
latitude,longitude,timestamp
12.9716,77.5946,2026-01-01T10:00:00Z
12.9717,77.5947,2026-01-01T10:00:05Z
```

Use decimal-degree coordinates and strictly increasing ISO 8601 timestamps with a timezone. The current loader accepts 2–1,000 observations.

Road JSON must contain `nodes` with `id`, `latitude`, and `longitude`, and `edges` with `id`, `from`, and `to`. The current implementation treats edges as straight, two-way segments.

## Understanding the demo metrics

The bundled example is a **synthetic generated trip**, not an official dataset result. Its seeded example results are:

| Metric | Nearest road | HMM |
|---|---:|---:|
| Point accuracy | 45.8% | 54.2% |
| Segment recall | 100.0% | 100.0% |
| Segment precision | 42.1% | 72.7% |
| Ordered route similarity | 29.6% | 72.7% |
| Mean GPS residual | 10.53 m | 27.22 m |
| Recovered distance | 1,789.7 m | 700.0 m |

These values describe only the included synthetic trip and seed. They must not be presented as student-test performance.

## Team contributions

All three team members should contribute through their own GitHub accounts. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the beginner-friendly branch and pull-request workflow. Add the actual GitHub usernames of both teammates to the repository's Collaborators settings before they start pushing.

## Hackathon deliverable checklist

See [`docs/DELIVERABLE_1_STATUS.md`](docs/DELIVERABLE_1_STATUS.md) for the required components and what is still missing before this repository can honestly be called a complete Deliverable 1 submission.

## Academic integrity

Only report results generated from the official permitted dataset and reproducible code. Do not invent metrics, training curves, maps, model weights or optimisation results. Keep evaluator-test labels and secrets out of the public repository. Follow the event's AI-use and disclosure rules.
