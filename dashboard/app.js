"use strict";

// ---------------------------------------------------------------------------
// Data loading helpers
// ---------------------------------------------------------------------------
const BASE = (window.DATA_BASE || "../").replace(/\/?$/, "/");
const url = (p) => BASE + p;

const statusEl = document.getElementById("status");
function setStatus(msg, isErr) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("err", !!isErr);
}

async function fetchText(path) {
  const r = await fetch(url(path), { cache: "no-store" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.text();
}
async function fetchJSON(path) {
  return JSON.parse(await fetchText(path));
}

// Minimal CSV parser (handles quoted fields and embedded commas).
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const pct = (x) => (x * 100).toFixed(1) + "%";
const signedPct = (x) => (x >= 0 ? "+" : "") + (x * 100).toFixed(1);

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ---------------------------------------------------------------------------
// Elo model: client-side 1X2 estimate (see method note in index.html)
// ---------------------------------------------------------------------------
// The odds feed and the Elo table occasionally spell a country differently.
const ELO_ALIASES = {
  "USA": "United States",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
};
const eloFor = (elo, team) => elo[team] ?? elo[ELO_ALIASES[team]];

function eloProbs(rHome, rAway) {
  const eHome = 1 / (1 + Math.pow(10, (rAway - rHome) / 400));
  const pDraw = 0.30 * (1 - Math.abs(2 * eHome - 1));
  const rest = 1 - pDraw;
  return { home: rest * eHome, draw: pDraw, away: rest * (1 - eHome) };
}

// De-vig a set of decimal odds into normalised probabilities.
function devig(decimalOdds) {
  const raw = decimalOdds.map((o) => (o > 0 ? 1 / o : 0));
  const sum = raw.reduce((a, b) => a + b, 0);
  return sum > 0 ? raw.map((p) => p / sum) : raw;
}

// ---------------------------------------------------------------------------
// LIVE: model vs market
// ---------------------------------------------------------------------------
function buildLive(oddsRows, elo) {
  const container = document.getElementById("live-matches");

  // Latest snapshot only.
  let latestTs = "";
  for (const r of oddsRows) if (r.captured_at > latestTs) latestTs = r.captured_at;

  // Group latest-snapshot rows by match.
  const matches = new Map();
  for (const r of oddsRows) {
    if (r.captured_at !== latestTs) continue;
    if (!matches.has(r.match_id)) {
      matches.set(r.match_id, {
        home: r.home, away: r.away, commence: r.commence_time,
        // per-outcome: array of decimal odds across bookmakers
        prices: { home: [], away: [], draw: [] },
      });
    }
    const m = matches.get(r.match_id);
    const odds = parseFloat(r.odds);
    if (!isFinite(odds)) continue;
    if (r.team === r.home) m.prices.home.push(odds);
    else if (r.team === r.away) m.prices.away.push(odds);
    else m.prices.draw.push(odds); // "Draw"
  }

  const now = Date.now();
  const list = [...matches.values()]
    .sort((a, b) => new Date(a.commence) - new Date(b.commence));

  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

  let cards = "";
  let shown = 0;
  for (const m of list) {
    // Skip matches that kicked off more than 3h ago.
    if (new Date(m.commence).getTime() < now - 3 * 3600 * 1000) continue;

    const haveDraw = m.prices.draw.length > 0;
    const oddsList = haveDraw
      ? [avg(m.prices.home), avg(m.prices.draw), avg(m.prices.away)]
      : [avg(m.prices.home), avg(m.prices.away)];
    const mk = devig(oddsList);
    const market = haveDraw
      ? { home: mk[0], draw: mk[1], away: mk[2] }
      : { home: mk[0], draw: 0, away: mk[1] };

    const rH = eloFor(elo, m.home), rA = eloFor(elo, m.away);
    const model = rH != null && rA != null ? eloProbs(rH, rA) : null;

    const kick = new Date(m.commence).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const outcomes = haveDraw
      ? [["home", m.home], ["draw", "Draw"], ["away", m.away]]
      : [["home", m.home], ["away", m.away]];

    const rows = outcomes.map(([key, label]) => {
      const mkP = market[key];
      const moP = model ? model[key] : null;
      const edge = model ? moP - mkP : null;
      const edgeCls = edge == null ? "" : edge >= 0 ? "pos" : "neg";
      return `<div class="row">
        <span>${label}</span>
        <span class="num market">${pct(mkP)}</span>
        <span class="num">${moP == null ? "—" : pct(moP)}</span>
        <span class="num edge ${edgeCls}">${edge == null ? "—" : signedPct(edge)}</span>
      </div>`;
    }).join("");

    cards += `<div class="card">
      <div class="teams">${m.home} <span style="color:var(--muted)">vs</span> ${m.away}</div>
      <div class="kick">${kick}</div>
      <div class="row head"><span>Outcome</span><span class="num">Market</span><span class="num">Model</span><span class="num">Edge</span></div>
      ${rows}
      <div class="meta">${m.prices.home.length} bookmakers${model ? "" : " · no Elo for one side"}</div>
    </div>`;
    shown++;
  }

  container.innerHTML = shown
    ? cards
    : `<p class="note">No upcoming matches in the latest odds snapshot. Once the pipeline
       logs odds for fixtures that haven't kicked off, they'll appear here.</p>`;

  return latestTs;
}

// ---------------------------------------------------------------------------
// CHAMPIONSHIP
// ---------------------------------------------------------------------------
function buildChampionship(rows) {
  rows = rows
    .map((r) => ({ team: r.team, p: parseFloat(r.p_champ) }))
    .filter((r) => isFinite(r.p))
    .sort((a, b) => b.p - a.p);

  const top = rows.slice(0, 16);
  new Chart(document.getElementById("champ-chart"), {
    type: "bar",
    data: {
      labels: top.map((r) => r.team),
      datasets: [{ label: "P(champion)", data: top.map((r) => r.p * 100), backgroundColor: "#238636" }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9198a1", callback: (v) => v + "%" }, grid: { color: "#283039" } },
        y: { ticks: { color: "#e6edf3" }, grid: { display: false } },
      },
    },
  });

  document.getElementById("champ-table").innerHTML =
    `<table><thead><tr><th>Team</th><th class="num">Champion</th></tr></thead><tbody>` +
    rows.map((r) => `<tr><td>${r.team}</td><td class="num">${pct(r.p)}</td></tr>`).join("") +
    `</tbody></table>`;
}

// ---------------------------------------------------------------------------
// GROUPS
// ---------------------------------------------------------------------------
function buildGroups(rows) {
  const groups = {};
  for (const r of rows) {
    const g = r.group || "?";
    (groups[g] = groups[g] || []).push({ team: r.team, p: parseFloat(r.p_advance) });
  }
  const grid = document.getElementById("group-grid");
  grid.innerHTML = Object.keys(groups).sort().map((g) => {
    const teams = groups[g].sort((a, b) => b.p - a.p);
    const bars = teams.map((t) => `
      <div class="bar-row">
        <div><div>${t.team}</div><div class="bar"><span style="width:${(t.p * 100).toFixed(0)}%"></span></div></div>
        <div class="num">${pct(t.p)}</div>
      </div>`).join("");
    return `<div class="group-card"><h3>Group ${g}</h3>${bars}</div>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// MODEL QUALITY
// ---------------------------------------------------------------------------
function buildMetrics(m) {
  const cards = [
    { l: "Accuracy", v: pct(m.accuracy), b: `baseline ${pct(m.baseline_accuracy_always_home)} (always home)` },
    { l: "Brier score", v: m.brier_score.toFixed(4), b: `uniform baseline ${m.brier_uniform_baseline.toFixed(4)} · lower better` },
    { l: "Log loss", v: m.log_loss.toFixed(4), b: `uniform baseline ${m.log_loss_uniform_baseline.toFixed(4)} · lower better` },
    { l: "Backtest matches", v: m.n_matches.toLocaleString(), b: `${m.date_range[0]} → ${m.date_range[1]}` },
  ];
  document.getElementById("metrics").innerHTML = cards.map((c) =>
    `<div class="metric"><div class="v">${c.v}</div><div class="l">${c.l}</div><div class="b">${c.b}</div></div>`
  ).join("");
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
let champBuilt = false; // championship/group/metrics are static — build once
async function main() {
  document.getElementById("data-source").textContent = "Source: " + BASE;
  const results = await Promise.allSettled([
    fetchText("data/odds_log.csv"),
    fetchJSON("data/processed/elo_ratings.json"),
    fetchText("data/processed/full_tournament_simulation.csv"),
    fetchText("data/processed/group_stage_simulation.csv"),
    fetchJSON("data/processed/backtest_metrics.json"),
  ]);
  const [odds, elo, champ, groups, metrics] = results;
  let latestTs = null;

  try {
    if (odds.status === "fulfilled" && elo.status === "fulfilled") {
      latestTs = buildLive(parseCSV(odds.value), elo.value);
    }
    if (!champBuilt) {
      if (champ.status === "fulfilled") buildChampionship(parseCSV(champ.value));
      if (groups.status === "fulfilled") buildGroups(parseCSV(groups.value));
      if (metrics.status === "fulfilled") buildMetrics(metrics.value);
      champBuilt = true;
    }
  } catch (e) {
    setStatus("Error rendering: " + e.message, true);
    return;
  }

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length === results.length) {
    setStatus("Could not load any data. Check DATA_BASE in config.js.", true);
  } else if (latestTs) {
    setStatus("Latest odds snapshot: " + new Date(latestTs).toLocaleString());
  } else {
    setStatus("Loaded. (No live odds available yet.)");
  }
}

// Initial load, then auto-refresh the live data every 5 minutes so the page
// stays current without a manual reload. Charts on other tabs build once.
main();
setInterval(main, 5 * 60 * 1000);
