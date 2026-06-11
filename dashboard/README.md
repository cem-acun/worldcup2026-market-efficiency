# Live dashboard — Model vs Market

A zero-build static dashboard for the 2026 World Cup model-vs-market analysis.
It is **read-only**: it fetches the CSV/JSON that the data pipeline commits to
the repo and renders four views — live model-vs-market for upcoming matches,
championship probabilities, group-stage advancement, and backtest metrics.

No server, no secrets, no build step. Just static files plus Chart.js from a CDN.

## Run locally

```bash
# from the repo root, so /data is reachable at ../data
cd dashboard
python3 -m http.server 8000
# open http://localhost:8000
```

By default the dashboard reads live data from **GitHub raw** (see `config.js`),
so it works even served on its own. To read the local working copy instead,
set in `config.js`:

```js
window.DATA_BASE = "../";
```

## Deploy to GitHub Pages (fully automated)

The repo includes `.github/workflows/deploy-dashboard.yml`, which publishes the
`dashboard/` folder to GitHub Pages on every push to `main`.

One-time setup:
1. Merge this to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The "Deploy dashboard" workflow runs and the site goes live at
   `https://<user>.github.io/<repo>/`.

After that it's hands-off: the dashboard reads live odds from GitHub raw
(default `config.js`) and **auto-refreshes its data every 5 minutes** in the
browser, so an open tab stays current as the pipeline logs new snapshots — no
redeploy or reload needed.

## Deploy to Cloudflare Pages

Two supported layouts — pick one.

### Option A — deploy the whole repo (recommended)
The dashboard reads the same `data/` that the GitHub Actions pipeline keeps
fresh, all from one origin.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
   pick this repository.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repo root)
3. In `dashboard/config.js` set `window.DATA_BASE = "../";`
4. Deploy. The dashboard lives at `https://<project>.pages.dev/dashboard/`.

Every time the pipeline commits new odds to `main`, Pages redeploys
automatically and the dashboard shows the new snapshot.

### Option B — deploy only `dashboard/`, read live data from GitHub raw
Keeps the deployed site tiny; data is pulled from GitHub at runtime.

1. Same as above, but set **Build output directory:** `dashboard`.
2. Leave `config.js` on its default GitHub-raw `DATA_BASE` (edit the branch if
   your pipeline pushes somewhere other than `main`).
3. The dashboard lives at `https://<project>.pages.dev/`.

> Note: GitHub raw is cached for ~5 minutes, so live odds lag by up to that.
> Option A (redeploy on commit) is fresher.

### Wrangler CLI alternative
```bash
npx wrangler pages deploy dashboard --project-name worldcup2026-dashboard
```

## How the "model" column is computed
The live tab's model probabilities are a transparent client-side Elo estimate
from `data/processed/elo_ratings.json` (neutral ground; a draw mass is removed
and the rest split by expected score — see the method note in the app). The
headline championship/group probabilities come from the full 10,000-run Monte
Carlo simulation in the notebooks.
