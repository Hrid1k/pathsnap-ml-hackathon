# Deliverable 1 — Repository completion tracker

This checklist is based on the PathSnap technical report and submission guidelines supplied by the team.

## What the supplied project archive actually contains

The supplied `GPS_Trajectory_Map_Matching.zip` is a JavaScript browser prototype. It includes synthetic data generation, a road graph, nearest-road matching, HMM-style Viterbi decoding, route reconstruction, synthetic evaluation, a browser UI, examples and automated tests.

Local verification performed while preparing this repository:
- `npm test`: **5 tests passed, 0 failed**.
- `npm run example`: completed successfully.
- `npm run build`: completed successfully.

These tests validate the supplied JavaScript prototype only. They do not validate performance on the hackathon's official dataset.

## Required components

| Requirement from the PDF | Current status | What the team still needs to do |
|---|---|---|
| Data processing for the raw dataset | Partial | Add scripts that load, inspect, clean and preprocess the official GPS/road data. The current app accepts CSV/JSON but generates its main example synthetically. |
| Feature engineering | Missing for the official ML pipeline | Add the actual feature extraction code and explain each feature. |
| Training scripts/notebooks for every model | Missing | Add training code for at least five models actually trained. |
| Model comparison and evaluation metrics | Partial | The JavaScript demo compares nearest-road and HMM on synthetic data. Add official model comparisons and required metrics on the prescribed partitions. |
| Bayesian hyperparameter optimisation | Missing | Add the search code, configuration, trial count, objective and actual best results for the selected model. |
| HMM and Viterbi route reconstruction | Partial | The supplied JS prototype has an HMM-style Viterbi decoder. Adapt/validate it against the official dataset and document disconnected roads, missing candidates and GPS gaps. |
| Complete backend API | Missing | Add the real API endpoints, request/response schemas and model-loading code. |
| Evaluator UI | Partial | A browser UI exists, but it is not yet verified against the official backend/API. |
| Deployment/configuration/dependencies | Partial | Add reproducible setup and deployment instructions for the final complete system. |
| Folium geographical visualisations | Missing | Add Folium map-generation code and at least one actual generated map showing GPS fixes, roads, reference route (if available) and predicted route. |
| Supporting results | Partial | Current examples/benchmark are synthetic. Add actual CSVs, experiment logs and result summaries from official experiments. |
| Saved model weights | Missing | Add the selected trained model and required config, subject to repository size limits. |
| README | Present | Keep it accurate and update it as the real pipeline is implemented. |

## Important data-partition rule

The existing README in the initial GitHub repository referred to 80 training trips and 10 student-test trips. The supplied ZIP does not contain those dataset files, so that split has not been independently verified here. Confirm the exact split and folder names against the dataset supplied by the organisers before using them. Do not place evaluator-test labels in the public repository or UI.

## Before calling Deliverable 1 complete

- [ ] Add the official dataset processing and feature-engineering source code.
- [ ] Train and document at least five real models using the permitted partitions.
- [ ] Save actual evaluation metrics, comparison tables and plots.
- [ ] Add Bayesian optimisation for the chosen model and its real trial outputs.
- [ ] Validate classifier-only versus HMM/Viterbi decoding.
- [ ] Add the complete API and evaluator UI integration.
- [ ] Generate real Folium HTML maps from the implementation.
- [ ] Add model weights and required configuration files.
- [ ] Test setup instructions from a fresh clone.
- [ ] Ensure the GitHub repository is public and contains no passwords, API keys or private credentials.
- [ ] Check that every result in the technical report can be reproduced from the repository.

Do not tick a box until the relevant code/output exists and has been checked.
