// Dashboard data source configuration.
//
// DATA_BASE is the URL prefix the dashboard prepends to data paths like
// "data/odds_log.csv". Two common setups:
//
//   1. Deploy the WHOLE repo to Cloudflare Pages (output dir = repo root).
//      The dashboard lives at /dashboard/ and the data at /data/, so use a
//      relative base that climbs one level out of /dashboard/:
//          window.DATA_BASE = "../";
//
//   2. Deploy ONLY the dashboard/ folder, and read live data straight from
//      GitHub raw (updates as the Actions pipeline commits new odds):
//          window.DATA_BASE = "https://raw.githubusercontent.com/turingfp/worldcup2026-market-efficiency/main/";
//
// The default below uses GitHub raw so the dashboard shows live odds even when
// deployed on its own. Change the branch ("main") if your pipeline pushes
// elsewhere.
window.DATA_BASE =
  "https://raw.githubusercontent.com/turingfp/worldcup2026-market-efficiency/main/";
