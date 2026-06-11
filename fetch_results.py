"""Fetch World Cup 2026 match results from football-data.org and log them.

Runs daily via GitHub Actions. Appends new finished matches to
data/results_log.csv. Idempotent: re-running on the same day will not
duplicate rows.
"""

import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

TOKEN = os.environ.get("FOOTBALL_DATA_TOKEN")
if not TOKEN:
    print("ERROR: FOOTBALL_DATA_TOKEN environment variable not set")
    sys.exit(1)

# football-data.org competition ID for FIFA World Cup
COMPETITION_ID = "WC"
URL = f"https://api.football-data.org/v4/competitions/{COMPETITION_ID}/matches"

RESULTS_PATH = Path("data/results_log.csv")
HEADERS = [
    "match_id", "utc_date", "stage", "group", "matchday",
    "home_team", "away_team",
    "home_score", "away_score",
    "home_ht", "away_ht",
    "winner", "status",
    "fetched_at",
]


def fetch_matches():
    """Pull all World Cup matches from football-data.org."""
    r = requests.get(URL, headers={"X-Auth-Token": TOKEN}, timeout=30)
    r.raise_for_status()
    return r.json().get("matches", [])


def parse_match(m):
    """Extract the fields we care about from a single match dict."""
    score = m.get("score", {}) or {}
    ft = score.get("fullTime", {}) or {}
    ht = score.get("halfTime", {}) or {}
    return {
        "match_id":   m.get("id"),
        "utc_date":   m.get("utcDate"),
        "stage":      m.get("stage"),
        "group":      m.get("group"),
        "matchday":   m.get("matchday"),
        "home_team":  (m.get("homeTeam") or {}).get("name"),
        "away_team":  (m.get("awayTeam") or {}).get("name"),
        "home_score": ft.get("home"),
        "away_score": ft.get("away"),
        "home_ht":    ht.get("home"),
        "away_ht":    ht.get("away"),
        "winner":     score.get("winner"),
        "status":     m.get("status"),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def load_existing_ids():
    """Return the set of match_ids already in the log so we don't duplicate."""
    if not RESULTS_PATH.exists():
        return set()
    with RESULTS_PATH.open() as f:
        reader = csv.DictReader(f)
        return {row["match_id"] for row in reader if row.get("match_id")}


def write_rows(rows, exists):
    """Append new rows to the CSV, writing the header if the file is new."""
    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    mode = "a" if exists else "w"
    with RESULTS_PATH.open(mode, newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        if not exists:
            writer.writeheader()
        for r in rows:
            writer.writerow(r)


def main():
    matches = fetch_matches()
    print(f"[{datetime.now(timezone.utc).isoformat()}] fetched {len(matches)} matches from API")

    # Only log matches that are FINISHED (have a final score). Skip scheduled/in-play.
    finished = [parse_match(m) for m in matches if m.get("status") == "FINISHED"]
    print(f"  -> {len(finished)} finished, the rest are scheduled or in progress")

    existing = load_existing_ids()
    new_rows = [r for r in finished if str(r["match_id"]) not in existing]
    print(f"  -> {len(new_rows)} new (not yet logged)")

    if new_rows:
        write_rows(new_rows, exists=RESULTS_PATH.exists())
        for r in new_rows:
            print(f"     + {r['home_team']} {r['home_score']}-{r['away_score']} {r['away_team']} ({r['stage']})")
    else:
        print("  nothing new to write")


if __name__ == "__main__":
    main()
