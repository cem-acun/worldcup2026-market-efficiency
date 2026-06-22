# Data folder

## `odds_log.csv.gz`

Live odds snapshots from [the-odds-api.com](https://the-odds-api.com), pulled hourly by
the `collect-odds.yml` workflow. Gzipped to stay under GitHub's 100 MB per-file limit.

Schema: `captured_at, match_id, commence_time, home, away, bookmaker, team, odds`

### Known gap

There is a ~5-hour gap on **22 June 2026**, between approximately 00:00 UTC and
05:00 UTC. During this window the workflow continued to fetch odds successfully
from the API, but the resulting file exceeded GitHub's 100 MB file-size limit
(plain CSV had grown to 100.11 MB after 10 days of hourly snapshots) and every
push was rejected with `pre-receive hook declined`.

The fix was to switch to gzipped storage (`odds_log.csv.gz`), which compresses the
same data ~95%. The gap is not recoverable: the snapshots existed only on the
GitHub Actions runner's ephemeral disk and were not preserved when the push failed.

The impact on the analysis is small: this 5-hour window falls between match days
(no match was kicking off during the gap), so the missing snapshots are not
closing-line data points for any prediction.

## `results_log.csv`

Final match results from [football-data.org](https://www.football-data.org), pulled
daily by the `fetch-results.yml` workflow. Plain CSV (small file).

Schema: `match_id, utc_date, stage, group, matchday, home_team, away_team, home_score,
away_score, home_ht, away_ht, winner, status, fetched_at`
