[English](README.md) | **Deutsch**

# WM 2026 — Marktineffizienz-Analyse

Ein End-to-End Data Science Projekt, das ein probabilistisches Fußballmodell während der WM 2026 gegen den Live-Wettmarkt antreten lässt. Das Ziel ist nicht, "die Buchmacher zu schlagen"; sondern zu messen, wie effizient der Markt ist, wo er mit einem rigorosen Modell uneins ist und wie gut kalibriert beide Seiten am Ende des Turniers tatsächlich sind.

Die Pipeline läuft autonom: Geplante Jobs erfassen Live-Wettquoten während des gesamten Turniers, während das Modell Wahrscheinlichkeiten erzeugt, die anhand derselben Spiele bewertet werden können, sobald diese beendet sind.

> 🚧 **Live-Dashboard in Kürze.** Eine Streamlit-Webapp, mit der man zwei beliebige Mannschaften vergleichen, Turnierwahrscheinlichkeiten durchstöbern und die Modell-vs-Markt-Kalibrierungstabelle Spiel für Spiel wachsen sehen kann. Der Link erscheint hier, sobald die App deployed ist.

> **Über dieses Projekt.** Erstellt von [Cem Acun](https://github.com/cem-acun) als Portfolio-Projekt während meines Studiums Applied Data Science an der Jade Hochschule, Deutschland. Ich arbeite Teilzeit in einem Wettbüro, um mein Studium zu finanzieren. Der tägliche Einblick darin, wie sich Quoten bewegen und wo Buchmacher ihre Linien falsch bepreisen, ist der Grund, warum ich dieses Projekt überhaupt bauen wollte.

## Hauptergebnisse

**Elo-Modell Backtest** (3.572 internationale Spiele, 2023–2026):

| Metrik         | Modell | Baseline | Hinweise                                              |
| -------------- | ------ | -------- | ----------------------------------------------------- |
| Genauigkeit    | 60.5%  | 47.2%    | Baseline = immer Heimsieg vorhersagen                 |
| Brier-Score    | 0.5155 | 0.6667   | Niedriger ist besser (uniformer 1/3-Tipp = 0.667)     |
| Log Loss       | 0.8824 | 1.0986   | Niedriger ist besser (uniformer 1/3-Tipp = ln 3 ≈ 1.099) |

Die Kalibrierung ist nahezu perfekt bei Heimsiegen, mit einer bekannten und dokumentierten Schwäche bei Unentschieden. Elo ist ein Stärkevergleichsmodell und erfasst die taktischen Bedingungen, die zu Unentschieden führen, nicht direkt. Siehe [data/processed/calibration.png](data/processed/calibration.png).

**Monte-Carlo-Prognose Gruppenphase** (10.000 simulierte Turniere):

![Gruppenphasen-Weiterkommens-Wahrscheinlichkeiten](data/processed/group_advancement.png)

Die deutlichsten Überzeugungen des Modells: Spanien (98.7%) und Argentinien (97.0%) kommen so gut wie sicher aus ihrer Gruppe. Gruppe D ist am chaotischsten, mit keiner Mannschaft über 80%; selbst Gastgeber USA liegt nur bei 57.1%. Die auffälligsten Modell-Markt-Diskrepanzen sind wahrscheinlich in Gruppe E (Ecuador 92.7% vs. Deutschland 92.2%, etwa gleichauf) und Gruppe F (Japan 90.3% vs. Niederlande 89.8%): beides Gruppen, in denen die Buchmacher mit ziemlicher Sicherheit die europäische Seite bevorzugen werden.

**Vollständige Turnier-Monte-Carlo-Prognose** (10.000 simulierte Turniere mit dem offiziellen Bracket 2026):

![Meisterschaftswahrscheinlichkeiten](data/processed/championship_probabilities.png)

Das Modell hat zwei klare Titelfavoriten: **Spanien (24.4%)** und **Argentinien (20.5%)**, die zusammen fast die Hälfte aller simulierten Meisterschaften ausmachen. Das Verfolgerfeld: Frankreich (9.9%), England (6.5%), Kolumbien (4.8%), Brasilien (4.7%) liegt deutlich dahinter. Brasiliens Meisterschaftswahrscheinlichkeit erscheint angesichts des Rufes niedrig, spiegelt aber wider, was die aktuellen Elo-Daten tatsächlich sagen: ihre Wahrscheinlichkeit, aus der Gruppe zu kommen (92%), ist stark, aber sie sind in derselben Bracket-Hälfte wie Spanien platziert. Der Bracket-Effekt zählt: Spaniens Weg ins Halbfinale führt durch schwächere Gegner als Argentiniens, weshalb Spanien trotz geringerer Elo-Differenz in der Titelwahrscheinlichkeit führt.

Die Simulation verwendet FIFAs offizielle Round-of-32-Paarungen und die 495 Platzierungskombinationen für Gruppendritte, definiert in Anhang C der Turnierregeln.

### Erster Live-Test: das Eröffnungsspiel

Die WM 2026 wurde am 11. Juni mit Mexiko vs. Südafrika in Mexiko-Stadt eröffnet. Stunden vor dem Anpfiff legten sich sowohl das Modell als auch der Buchmacher-Konsens (23 Buchmacher, vig-bereinigt) auf eine Vorhersage fest. Der vollständige Eintrag liegt in [`data/processed/opener_pregame_prediction.json`](data/processed/opener_pregame_prediction.json), zeitgestempelt und vor dem Spiel in Git eingecheckt.

| Ausgang      | Modell | Markt  | Edge      |
| ------------ | ------ | ------ | --------- |
| Mexiko       | 77.4%  | 67.9%  | **+9.5pp** |
| Unentschieden | 11.9% | 21.3%  | −9.4pp    |
| Südafrika    | 10.7%  | 10.8%  | −0.1pp    |

**Tatsächliches Ergebnis: Mexiko 2–0 Südafrika.** Beide Seiten wählten den richtigen Sieger. Bei diesem einzelnen Spiel betrug der Brier-Score des Modells (0.0765) weniger als die Hälfte des Marktes (0.1602): Es war zuversichtlicher bei Mexiko, und diese Zuversicht wurde belohnt.

Ein Spiel ist kein Beweis für ein probabilistisches Modell. Aber die Pipeline, die diesen Vergleich erzeugt hat, läuft autonom für jedes WM-Spiel bis zum Finale, sodass dieselbe Punktetabelle für 100+ Spiele existiert, wenn das Turnier endet.

## Wie man dieses Repo liest

Wenn du über meinen Lebenslauf-Link hier bist und eine 60-Sekunden-Tour möchtest:

1. **Beginne mit dieser README** — die Hauptergebnisse und das Eröffnungsspiel-Ergebnis oben sagen dir, was das Modell kann und wie es im Vergleich zum Wettmarkt abschneidet.
2. **Öffne `notebooks/03_monte_carlo.ipynb`** für die zentrale Analyse: wie Spanien (24.4%) und Argentinien (20.5%) aus 10.000 simulierten Turnieren mit FIFAs offiziellem Bracket als gemeinsame Titelfavoriten hervorgingen.
3. **`notebooks/04_opening_match.ipynb`** zeigt den Live-Workflow in Aktion: Quoten von 23 Buchmachern abrufen, mit dem Modell vergleichen und eine zeitgestempelte Vorhersage vor dem Anpfiff festhalten.
4. **`notebooks/02_backtest.ipynb`** ist der Glaubwürdigkeitstest: 3.572 internationale Spiele, Kalibrierungsplots, keine Look-Ahead-Leckage.
5. **`notebooks/01_explore_data.ipynb`** ist die Grundlage: wie das Elo-Modell auf 32.260 Spielen mit turnier-gewichteten Updates trainiert wurde.

Alle Notebooks haben Abschnittsüberschriften auf Englisch und Deutsch.

## Wie es funktioniert

```
+----------------------------------------------------------+
|  Externer Scheduler (cron-job.org)                       |
|  stündlich, 20 von 24 Stunden -> the-odds-api.com        |
|  -> repository_dispatch -> hängt an data/odds_log.csv an |
+----------------------------------------------------------+
            |
            v
+----------------------------------------------------------+
|  Elo-Modell (src/, notebooks/)                           |
|  trainiert auf 32.260 internationalen Spielen (1990-2026)|
|  turnier-gewichteter K-Faktor + Heimvorteil              |
+----------------------------------------------------------+
            |
            v
+----------------------------------------------------------+
|  Monte-Carlo-Turnier-Simulator                           |
|  10.000 Läufe -> Weiterkommens-Wahrscheinlichkeiten      |
+----------------------------------------------------------+
            |
            v
+----------------------------------------------------------+
|  Auswertung: Modell vs. Markt vs. tatsächliche Ergebnisse|
|  Brier - Log Loss - Kalibrierung - vig-bereinigte Edge   |
+----------------------------------------------------------+
```

## Repo-Aufbau

```
worldcup2026-market-efficiency/
├── .github/workflows/
│   ├── collect-odds.yml                 # Dispatch-getriggerter Quoten-Sammler
│   └── fetch-results.yml                # Tägliche Spielergebnisse von football-data.org
├── collect_odds.py                      # Quoten-Sammler-Skript
├── fetch_results.py                     # Ergebnis-Abrufer-Skript
├── src/
│   ├── groups.py                        # WM-2026-Gruppenauslosung
│   └── bracket.py                       # FIFA Anhang C: offizielle R32-Paarungen + 495 Kombinationen
├── notebooks/
│   ├── 01_explore_data.ipynb            # Datenexploration + Elo-Training
│   ├── 02_backtest.ipynb                # leckagefreier Backtest + Kalibrierung
│   ├── 03_monte_carlo.ipynb             # Turniersimulation (Gruppenphase + volles Bracket)
│   └── 04_opening_match.ipynb           # Eröffnungsspiel: Modell vs. Markt, zeitgestempelte Vorhersage
└── data/
    ├── raw/                             # Quell-CSVs (nicht verändert)
    ├── processed/                       # Modell-Ausgaben, Plots, Metriken
    ├── odds_log.csv                     # Live-Quoten-Verlauf (automatisch aktualisiert)
    └── results_log.csv                  # Spielergebnis-Verlauf (automatisch aktualisiert)
```
## Methodische Hinweise

- **Keine Look-Ahead-Leckage.** Jedes Spiel im Backtest wird gegen die Elo-Bewertung *vom Tag vor dem Spiel* bewertet, nicht gegen die Bewertung nach dem Turnier. Deshalb enthält die verarbeitete Spieldatei die Spalten `home_elo_before` / `away_elo_before`.
 
- **K-Faktor gewichtet Turniere nach Wichtigkeit.** Ein Freundschaftsspiel bewegt das Elo etwa um ein Drittel so stark wie ein WM-Spiel, gemäß der Konvention der World Football Elo Ratings.
 
- **Heimvorteil ist platzabhängig**, wird nur angewendet, wenn das Spiel nicht auf neutralem Platz stattfindet (was bei der WM meistens der Fall ist).
 
- **Zuverlässige Planung über einen externen Trigger.** Geplante GitHub-Actions-Workflows werden während Lastspitzen zur vollen Stunde stillschweigend verworfen laut GitHubs eigener Dokumentation und empirisch bestätigt: in 24 Stunden Beobachtung feuerte der native Cron nur 2 von erwarteten 12 Malen, selbst nachdem der Zeitplan auf :13 nach der Stunde verschoben wurde. Die robuste Lösung war, den nativen Cron komplett zu entfernen und einen externen dedizierten Scheduler (cron-job.org) zu verwenden, der GitHubs `repository_dispatch`-API stündlich zur vollen Stunde aufruft. Der Zeitplan konzentriert sich auf das 20-Stunden-Fenster, in dem nordamerikanische Anpfiffzeiten und europäische Abend-Handelsaktivitäten stattfinden (UTC 00–07 und 12–23, das Tot-Fenster UTC 08–11 wird übersprungen). Dies bleibt deutlich innerhalb des Gratis-API-Budgets (20 Aufrufe pro Tag × 21 Tage im Juni ≈ 420 von 500 Credits) und liefert gleichzeitig 6–10 Quoten-Snapshots pro Spiel im kritischen Sechs-Stunden-Fenster vor dem Anpfiff.
 
- **Tordifferenz-Multiplikator in Elo-Updates.** Gemäß der Formel der World Football Elo Ratings: 1-Tor-Differenzen bewegen die Bewertung normal, 2-Tor-Differenzen 1,5x, größere Differenzen skalieren mit `(11 + |gd|) / 8`. Dadurch werden klare Siege höher gewichtet, ohne dass Kantersiege dominieren.
- **Datenintegritäts-Log.** Pipeline-Vorfälle und bekannte Datenlücken sind in [`data/README.md`](data/README.md) dokumentiert. Die Pipeline ist so gebaut, dass sie laut scheitert und transparent wiederherstellt, statt Daten stillschweigend zu verlieren.
- **Datenintegritäts-Log.** Pipeline-Vorfälle und bekannte Datenlücken sind in [`data/README.md`](data/README.md) dokumentiert. Die Pipeline ist so gebaut, dass sie laut scheitert und transparent wiederherstellt, statt Daten stillschweigend zu verlieren.

## Was als Nächstes kommt

- **Kalibrierung vs. Markt über das gesamte Turnier**: den Einzelspiel-Vergleich des Eröffnungsspiels auf alle 104 Spiele ausweiten, sobald diese beendet sind, mit laufendem Brier-Score und Log Loss für beide Seiten. Die ersten ~15 Spiele werden die erste aussagekräftige Stichprobe sein.
- **Live Streamlit-Dashboard** *(in Arbeit)*: eine interaktive Web-App mit vier Seiten:
  - **Spielvorhersage**: zwei beliebige der 326 Nationalmannschaften im Modell auswählen, Spielort festlegen, und sofort die Elo-basierten Sieg/Unentschieden/Niederlage-Wahrscheinlichkeiten erhalten, samt dem Live-Buchmacher-Konsens, sofern Quoten verfügbar sind.
  - **Turnierprognose**: Live-Meisterschaftswahrscheinlichkeiten und Gruppenphasen-Weiterkommen, aktualisiert aus der neuesten Simulation.
  - **Modell-Performance**: Backtest-Metriken und eine Kalibrierungstabelle, die Spiel für Spiel wächst.
  - **Methodik**: wie das Elo-Modell funktioniert, was hinter den Zahlen steckt und welche Datenquellen verwendet werden.

  Der Link erscheint hier, sobald die App deployed ist.

## Reproduzieren

```bash
git clone https://github.com/cem-acun/worldcup2026-market-efficiency.git
cd worldcup2026-market-efficiency
python3 -m venv worldcup-env
source worldcup-env/bin/activate
pip install pandas numpy matplotlib jupyter requests
jupyter notebook notebooks/
```

Dann `01_explore_data.ipynb` öffnen und von oben nach unten ausführen. Die rohe CSV-Datei mit internationalen Ergebnissen in `data/raw/` ist eingecheckt, sodass das Notebook eigenständig läuft.

## Quellen

### Daten

- **Historische internationale Ergebnisse.** Jurisoo, M. (2026). *International football results from 1872 to 2026.* [github.com/martj42/international_results](https://github.com/martj42/international_results) (CC0). 49.450 Spiele, der mit Abstand wichtigste Datensatz in diesem Projekt.
- **Live-Wettquoten.** [the-odds-api.com](https://the-odds-api.com), Gratis-Tier (500 Credits / Monat), Europa-Region, 1X2-Märkte über etwa 13 Buchmacher, darunter Pinnacle und Betfair Exchange. Alle in diesem Repository angezeigten oder gespeicherten Live-Quotendaten stammen von und gehören the-odds-api.com; sie werden hier ausschließlich für die nicht-kommerzielle akademische Analyse unter deren veröffentlichten Nutzungsbedingungen verwendet. Es werden keine Daten als eigenständiges Produkt weiterverteilt.
- **Spielergebnisse während des Turniers.** [football-data.org](https://www.football-data.org), Gratis-Tier. Wird täglich durch einen geplanten GitHub-Actions-Workflow in `data/results_log.csv` abgerufen.
- **Gruppenauslosung und Spielplan.** Offizielle FIFA-Endauslosung (5. Dezember 2025), gegengeprüft mit ESPN und Yahoo Sports.

### Python-Bibliotheken

- McKinney, W. (2010). *Data Structures for Statistical Computing in Python.* [pandas.pydata.org](https://pandas.pydata.org/)
- Harris, C. R. et al. (2020). *Array programming with NumPy.* Nature. [numpy.org](https://numpy.org/)
- Hunter, J. D. (2007). *Matplotlib: A 2D Graphics Environment.* [matplotlib.org](https://matplotlib.org/)
- Requests HTTP Library. [requests.readthedocs.io](https://requests.readthedocs.io/)
- Project Jupyter. [jupyter.org](https://jupyter.org/)

### Methodische Referenzen

- Elo, A. E. (1978). *The Rating of Chessplayers, Past and Present.* Die grundlegende Quelle für das Elo-System.
- World Football Elo Ratings Methodik. [eloratings.net/about](https://www.eloratings.net/about) (turnier-gewichteter K-Faktor und Tordifferenz-Multiplikator).

### Infrastruktur

- [GitHub Actions](https://docs.github.com/en/actions) für die Workflows.
- [cron-job.org](https://cron-job.org) als primärer externer Scheduler.

### KI-Unterstützung

Ich habe [Claude](https://www.anthropic.com/claude) (Anthropic) und [ChatGPT](https://openai.com/chatgpt) (OpenAI) während des gesamten Projekts als Sparringspartner verwendet — um Architekturentscheidungen auf den Prüfstand zu stellen, Boilerplate zu beschleunigen, Bugs schneller zu finden und Referenzen aufzuspüren, die ich vielleicht übersehen hätte (Elos ursprüngliche Formel, Kalibrierungsplot-Konventionen). Die Methodik, die Entscheidung, was gebaut wird, und jede Interpretation in dieser README stammen von mir. 2026 ist es selbstverständlich, KI als ernsthaftes Werkzeug zu verwenden, und das explizit zu sagen fühlt sich ehrlicher an als die Alternative.

## Autor

**Cem Acun**
B.Eng. Applied Data Science (in Bearbeitung), Jade Hochschule, Deutschland
[github.com/cem-acun](https://github.com/cem-acun)

## Lizenz

MIT.
