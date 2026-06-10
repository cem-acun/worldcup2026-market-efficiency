# 2026 FIFA World Cup — Market Efficiency Analysis

A live, end-to-end data science project that pits a probabilistic football model against the betting market during the 2026 FIFA World Cup. The goal is not to "beat the bookies" — it is to measure how efficient the market is, where it disagrees with a rigorous model, and how well-calibrated each side turns out to be by the end of the tournament.

The pipeline runs autonomously: a GitHub Actions workflow polls live betting odds every two hours throughout the tournament, while the model produces probabilities that can be evaluated against the same matches as they finish.

## Headline results so far

**Elo model backtest** (3,572 international matches, 2023–2026):

| Metric              | Model  | Baseline | Notes                                              |
| ------------------- | ------ | -------- | -------------------------------------------------- |
| Accuracy            | 60.5%  | 47.2%    | Baseline = always predict home win                 |
| Brier score         | 0.5155 | 0.6667   | Lower is better (uniform 1/3-each = 0.667)         |
| Log loss            | 0.8824 | 1.0986   | Lower is better (uniform 1/3-each = ln 3 ≈ 1.099)  |

Calibration is near-perfect on home wins, with a known and documented weakness on draws — Elo is a strength-comparison model and does not directly capture the tactical conditions that produce draws. See [`data/processed/calibration.png`](data/processed/calibration.png).

**Monte Carlo group-stage forecast** (10,000 simulated tournaments):

![Group advancement probabilities](data/processed/group_advancement.png)

The model's clearest convictions: Spain (98.7%) and Argentina (97.0%) almost certainly advance from their groups. Group D is the most chaotic, with no team above 80% — even host USA sits at 57.1%. The most striking model–market disagreements are likely in Group E (Ecuador 92.7% vs Germany 92.2%, roughly tied) and Group F (Japan 90.3% vs Netherlands 89.8%).

## How it works

```
┌──────────────────────────────────────────────────────────────┐
│  GitHub Actions (cron)  →  the-odds-api.com                  │
│  every 2 hours          →  appends to data/odds_log.csv      │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│  Elo model (src/, notebooks/)                                │
│  trained on 32,260 international matches (1990–2026)         │
│  tournament-weighted K-factor + home-advantage adjustment    │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│  Monte Carlo tournament simulator                            │
│  10,000 runs → per-team advancement / progression probs      │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│  Evaluation: model vs. market vs. actual outcomes            │
│  Brier · log loss · calibration · vig-adjusted "edge"        │
└──────────────────────────────────────────────────────────────┘
```

## Data sources

- **Historical international results** — 49,450 matches from 1872 to present, from [martj42/international_results](https://github.com/martj42/international_results) (CC0).
- **Live betting odds** — [the-odds-api.com](https://the-odds-api.com), free tier (500 credits/month), Europe region, 1X2 (head-to-head) markets across ~13 bookmakers including Pinnacle and Betfair Exchange.
- **Match results during the tournament** — [football-data.org](https://www.football-data.org), free tier (added during group stage).

## Repo layout

```
worldcup2026-market-efficiency/
├── .github/workflows/collect-odds.yml   # scheduled odds collector
├── collect_odds.py                      # the script the workflow runs
├── src/
│   └── groups.py                        # 2026 World Cup group draw
├── notebooks/
│   ├── 01_explore_data.ipynb            # data exploration + Elo training
│   ├── 02_backtest.ipynb                # leakage-free backtest + calibration
│   └── 03_monte_carlo.ipynb             # tournament simulation
└── data/
    ├── raw/                             # source CSVs (not modified)
    ├── processed/                       # model outputs, plots, metrics
    └── odds_log.csv                     # live odds history (auto-updated)
```

## Methodology notes

- **No look-ahead leakage.** Each match in the backtest is scored against the Elo rating *as it stood the day before the match*, not the post-tournament rating. This is why the matches data is saved with `home_elo_before` / `away_elo_before` columns.
- **K-factor weights tournaments by importance.** A friendly moves Elo by ⅓ as much as a World Cup match, following the World Football Elo Ratings convention.
- **Home advantage is venue-aware** — applied only when the match is not at a neutral venue (which is most of the World Cup).
- **The collector cron is offset to `:13` minutes past the hour**, because GitHub's own documentation warns that scheduled workflows are silently dropped during top-of-hour load spikes. This recovered the great majority of previously-missed runs.

## What's next

- **Knockout-bracket simulation** for full champion probabilities (Faz 2B).
- **Daily fixture results pull** from football-data.org once the group stage begins.
- **Calibration vs market** — once ~15 matches have been played, compare both sides' Brier and log loss on the same fixtures.
- **Streamlit dashboard** — live "model vs market" view for the knockout rounds.

## License

MIT.