# Contributing to PathSnap

We have three team members. Use separate branches so two people do not overwrite each other's work.

## One-time setup for each teammate

1. The repository owner opens the GitHub repository.
2. Go to **Settings → Collaborators → Add people**.
3. Enter the teammate's exact GitHub username and send the invitation.
4. The teammate accepts the invitation.
5. Each teammate installs Git and clones the repository:

```powershell
git clone https://github.com/Hrid1k/pathsnap-ml-hackathon.git
cd pathsnap-ml-hackathon
```

## The safe way to work

Never have all three people edit and push directly to `main`.

Each task gets its own branch. Example:

```powershell
git switch main
git pull origin main
git switch -c feature/data-preprocessing
```

After editing files:

```powershell
git status
git add .
git commit -m "Add GPS data preprocessing"
git push -u origin feature/data-preprocessing
```

Then open GitHub in the browser. GitHub will show **Compare & pull request**. Create a pull request from your branch into `main`. Ask another teammate to review it. After checking the files and tests, merge the pull request.

## Suggested split for three people

Agree on the split together and change the names below to the real GitHub usernames.

| Person | Suggested responsibility | Example branch |
|---|---|---|
| Team member 1 (repository owner) | Integration, data pipeline and final review | `feature/data-pipeline` |
| Team member 2 | Model training, model comparison and Bayesian optimisation | `feature/model-experiments` |
| Team member 3 | HMM/Viterbi validation, API, UI and Folium maps | `feature/route-api-visuals` |

These are suggested work areas, not claims that those components are already implemented.

## Before merging a pull request

Run the checks relevant to your changes. For the supplied JavaScript prototype:

```powershell
npm test
npm run build
```

In the pull request description, explain:
- What files you changed.
- What you implemented.
- Which commands/tests you ran.
- Any known limitations.

## Keep secrets and large files safe

- Never commit passwords, API keys, access tokens or `.env` files.
- Do not upload private organiser data or evaluator labels unless the rules explicitly permit it.
- Check repository size limits before committing large datasets or model weights.
- If a file is too large, use an approved storage method and document how evaluators can access it.
