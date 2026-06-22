import os, csv, datetime, gzip, requests

# --- Configuration ---
API_KEY = os.environ["ODDS_API_KEY"]                  # provided via GitHub secret
SPORT   = os.environ.get("SPORT_KEY", "soccer_fifa_world_cup")  # verify via /v4/sports
URL     = f"https://api.the-odds-api.com/v4/sports/{SPORT}/odds/"
PARAMS  = {"apiKey": API_KEY, "regions": "eu",        # single region = 1 credit per call
           "markets": "h2h", "oddsFormat": "decimal"} # h2h = match result (1X2)

# Gzipped CSV: ~95% smaller than plain CSV on this data (lots of repeated
# bookmaker names + similar odds). Stays well under GitHub's 100 MB file limit
# even after weeks of hourly snapshots. pandas reads .csv.gz transparently.
OUTFILE = "data/odds_log.csv.gz"


def main():
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        r = requests.get(URL, params=PARAMS, timeout=30)
        r.raise_for_status()
        events = r.json()
    except Exception as e:
        print(f"[{ts}] request failed: {e}")
        return  # don't crash the workflow; it will retry on the next tick

    # Track remaining free credits (500/month)
    print(f"[{ts}] credits remaining: {r.headers.get('x-requests-remaining')} | "
          f"used: {r.headers.get('x-requests-used')}")

    os.makedirs("data", exist_ok=True)
    new = not os.path.exists(OUTFILE)
    rows = 0

    # gzip.open with "at" = append text (gzipped CSV)
    with gzip.open(OUTFILE, "at", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["captured_at", "match_id", "commence_time",
                        "home", "away", "bookmaker", "team", "odds"])
        for ev in events:
            for bk in ev.get("bookmakers", []):
                for mk in bk.get("markets", []):
                    if mk["key"] != "h2h":
                        continue
                    for oc in mk["outcomes"]:
                        w.writerow([ts, ev["id"], ev["commence_time"],
                                    ev["home_team"], ev["away_team"],
                                    bk["key"], oc["name"], oc["price"]])
                        rows += 1

    print(f"[{ts}] logged {len(events)} matches, {rows} odds rows")


if __name__ == "__main__":
    main()
