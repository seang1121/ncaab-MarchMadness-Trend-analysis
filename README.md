> **77% accuracy | 14-year backtest | Beats chalk by 26 pts/year | 2026 brackets ready**

# March Madness Bracket Predictor

![Accuracy](https://img.shields.io/badge/accuracy-77%25-brightgreen)
![Tournaments](https://img.shields.io/badge/backtested-14_tournaments-blue)
![Models](https://img.shields.io/badge/models-5_ensemble-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

A tournament prediction system that generates optimized NCAA brackets using 5 independent statistical models, Monte Carlo simulation, and expected-value upset selection. Backtested against 882 games across 14 historical tournaments (2011-2025).

## Results

Tested against all 14 tournaments (2011-2025) using real BartTorvik KenPom data fetched via JSON API:

| Method | Avg ESPN Score/Year |
|--------|-------------------|
| Smart Builder (safe) | **1066** |
| Pure Chalk | 1041 |
| Smart Builder (balanced) | 953 |
| Smart Builder (contrarian) | 822 |

Smart safe beats chalk by +26 pts/year on average, with much larger margins in upset-heavy years (2016: +560 pts).

<details>
<summary><strong>2026 Tournament Brackets</strong></summary>

### 2026 Tournament Brackets

6 brackets generated for the 2026 NCAA Tournament with injury adjustments and cross-validated picks:

| # | Champion | Strategy | Upsets | Unique R64 Upset |
|---|----------|----------|--------|-----------------|
| 1 | Arizona | Safe — analytically best team, under-picked | 6 | Cleanest |
| 2 | Michigan | Safe — #1 defense, model's math pick | 7 | South Florida over Louisville |
| 3 | Duke | Safe — #1 overall seed | 7 | VCU over North Carolina |
| 4 | Florida | Balanced — defending champion | 11 | TCU over Ohio St., Texas A&M over Saint Mary's |
| 5 | Houston | Contrarian — best 2-seed | 14 | Texas over BYU, Akron over Texas Tech |
| 6 | Illinois | Contrarian — #1 offense, 3-seed sleeper | 15 | UCF over UCLA, Santa Clara over Kentucky |

**6 unique champions covering ~59% of outcomes. 21 unique upsets. No two brackets identical.**

Picks cross-validated against Nate Silver (COOPER model), KenPom rankings, Rithmm AI, and CBS/ESPN expert panels.

Injuries factored: Duke center (OUT), Louisville Brown Jr (OUT), Texas Tech Toppin (ACL), Tennessee Ament (hobbled), North Carolina Wilson (OUT).

### Fill In Your Brackets

Open `brackets-2026.html` in your browser for an interactive pick sheet with checkboxes. Use it side-by-side with [ESPN Tournament Challenge](https://fantasy.espn.com/games/tournament-challenge-bracket-2026).

Or regenerate picks:
```bash
npx tsx scripts/final-brackets-v5.ts
```

</details>

## How It Works

### 5 Prediction Models

Each model provides an independent signal. The ensemble blends them with confidence-weighted averaging.

| Model | Signal | Backtest Accuracy |
|-------|--------|-------------------|
| **KenPom Efficiency** | AdjEM difference + two-way balance + staircase thresholds | 74.6% |
| **Defensive Identity** | Four-factors composite: shot contesting, TO creation, boards, FT prevention | Independent |
| **Market Intelligence** | Seed-as-market-proxy + conference tiers + overperformance detection | 76.9% |
| **Tempo & Matchup** | Tempo-adjusted expected scoring + pace dynamics + grind-game detection | Independent |
| **Seed & History** | 14-year advancement rates + dead zones + Cinderella ceilings + 11-seed anomaly | 76.5% |
| **Calibrated Ensemble** | **Confidence-weighted blend of all 5** | **77.0%** |

The ensemble outperforms any single model. Individual models that score lower (Defensive, Tempo) still contribute unique information that improves the blend.

### Monte Carlo Simulation

Runs 10,000 complete tournament simulations. Each game flips a weighted coin based on the ensemble's win probability. Produces:
- Championship probability for every team
- Advancement probabilities per round (S16, E8, FF)
- Mode bracket (most common outcome at each slot)

### Smart Bracket Builder

Instead of picking every favorite (chalk) or flipping random coins (Monte Carlo), the smart builder calculates **Expected Value** for each pick:

```
EV(pick) = P(team wins this game) × ESPN points + future round value
```

Upsets are picked only when the underdog's EV exceeds the favorite's EV. Three modes:
- **Safe** (~6 upsets) — pure EV maximization for small pools
- **Balanced** (~11 upsets) — matches historical upset average
- **Contrarian** (~15 upsets) — aggressive differentiation for large pools

### Backtesting

See [Results](#results) above for the full backtest comparison. Smart safe beats chalk by +26 pts/year on average across 14 tournaments.

### Data Pipeline

- **BartTorvik JSON API** — adjOE, adjDE, tempo, eFG%, FT rate, TO rate, SOS for ~350 teams per year
- **Levenshtein name matching** — 64/64 tournament teams matched to BartTorvik data (was 70% before fix)
- **14-year historical cache** — real KenPom data for every tournament team from 2011-2025
- **Injury adjustments** — manual AdjO/AdjD modifications based on confirmed injury reports

## Quick Start

```bash
npm install

# Generate 2026 brackets (injuries pre-applied)
npx tsx scripts/final-brackets-v5.ts

# Run Monte Carlo simulation
npx tsx src/cli.ts simulate -d data/teams-2026.json --sims 10000 --calibrated

# Build a single smart bracket
npx tsx src/cli.ts smart-bracket -d data/teams-2026.json --pool balanced --calibrated

# Backtest all models against 14 historical tournaments
npx tsx src/cli.ts backtest --model all --fetch

# Optimize model weights
npx tsx src/cli.ts optimize --fetch --step 0.10

# Check which upsets we might be missing
npx tsx scripts/missed-upsets.ts

# Verify model picks for specific matchups
npx tsx scripts/verify-picks.ts
```

## CLI Commands

### Bracket Generation
| Command | Description |
|---------|-------------|
| `smart-bracket --pool balanced` | EV-optimized bracket with justified upsets |
| `bracket-for -n 6` | N brackets with different champions (MC-sampled) |
| `simulate --sims 10000` | Monte Carlo championship probabilities |
| `scenarios` | Tiered scenario brackets (3 champs x 4 FF x 8 E8) |
| `generate -m balanced` | Single bracket (chalk / balanced / upset-heavy) |
| `generate-optimal` | Single bracket with optimized weights |

### Analysis & Backtesting
| Command | Description |
|---------|-------------|
| `backtest --model all --fetch` | Backtest all models against 14 tournaments with real data |
| `compare-methods --fetch` | Compare chalk vs smart builder across all years |
| `optimize --step 0.10` | Grid search for optimal model weights |
| `multi-evaluate --team1 X --team2 Y` | All 5 models + ensemble matchup prediction |
| `champion-gate` | 8-gate champion filter (14-year calibrated) |
| `cinderellas` | Classify double-digit seeds by type and ceiling |
| `recalibrate` | 14-year historical recalibration |

### Data
| Command | Description |
|---------|-------------|
| `fetch-data -y 2026` | Fetch team data from BartTorvik |
| `overview -n 30` | Top teams by AdjEM |
| `models` | Show all prediction models and weights |
| `insights` | Betting analyzer cross-reference findings |

## Architecture

```
src/
  cli.ts                          # 20+ CLI commands
  types.ts                        # Core types (Team, Round, Region, Bracket)
  models/
    kenpom-model.ts               # AdjEM efficiency model
    defensive-identity-model.ts   # Four-factors defensive composite
    market-model.ts               # Seed-as-market-proxy
    tempo-matchup-model.ts        # Tempo-adjusted expected scoring
    seed-history-model.ts         # Historical advancement rates
    ensemble-model.ts             # Confidence-weighted blend with round-specific weights
    betting-insights.ts           # Calibration from 892 live NCAAB picks
  engine/
    smart-builder.ts              # EV-based bracket construction
    monte-carlo.ts                # 10K-sim Monte Carlo with advancement tracking
    champion-brackets.ts          # MC-sampled champion-diversified brackets
    scenario-generator.ts         # Tiered scenario brackets
    generator.ts                  # Bracket generation with custom predictor
    matchup-evaluator.ts          # Single matchup evaluation
    analyzer.ts                   # Bracket analysis
  backtest/
    backtester.ts                 # Game-level + bracket-mode backtesting
    bracket-scorer.ts             # Score brackets against actual results
    weight-optimizer.ts           # Grid search weight optimization
    historical-fetcher.ts         # BartTorvik JSON API + Levenshtein matching
    historical-brackets-*.ts      # 14 years of verified tournament results
    backtest-types.ts             # ESPN scoring constants
  rules/
    champion-gate.ts              # 8-gate champion filter
    efficiency-staircase.ts       # AdjEM floors by round
    seed-patterns.ts              # 14-year seed advancement rates
    cinderella.ts                 # Double-digit seed classification
  historical/
    tournament-data.ts            # Champions, Final Fours, deep runs (14 years)
scripts/
  final-brackets-v5.ts           # Generate 6 final 2026 brackets
  espn-pick-sheets.ts            # ESPN-formatted pick sheets
  build-2026-bracket.ts          # Build team data from real bracket
  verify-picks.ts                # Verify model predictions for key matchups
  missed-upsets.ts               # Find upsets the model didn't pick
  check-taint.ts                 # Detect weight-bias in ensemble picks
  s16-probs.ts                   # Sweet 16 advancement probabilities
data/
  teams-2026.json                # Real 2026 bracket (64 teams, BartTorvik stats)
  historical/                    # Cached BartTorvik data (14 years, ~350 teams each)
brackets-2026.html               # Interactive pick sheet for ESPN Tournament Challenge
```

## Research Files

Original statistical analysis that informed the model design:

| File | Coverage |
|------|----------|
| `COMPLETE_MARCH_MADNESS_ANALYSIS.md` | Full analysis — every round, champion profiles, betting appendix |
| `R64_R32_ANALYSIS.md` | First two rounds — upsets, Cinderella case studies, ATS |
| `SWEET16_ANALYSIS.md` | Sweet 16 — the efficiency cliff, dead zones |
| `ELITE8_FINAL4_ANALYSIS.md` | Elite 8 through championship — two-way requirements |

## Generate Your Own Brackets (Any Year)

```bash
# 1. Clone and install
git clone https://github.com/seang1121/ncaab-MarchMadness-Trend-analysis.git
cd ncaab-MarchMadness-Trend-analysis && npm install

# 2. Fetch current year data
npx tsx src/cli.ts fetch-data -y 2027

# 3. After Selection Sunday, build bracket file with real seeds
npx tsx scripts/build-2026-bracket.ts  # (modify year/seeds)

# 4. Run Monte Carlo
npx tsx src/cli.ts simulate -d data/teams-2027.json --sims 10000

# 5. Generate smart brackets
npx tsx src/cli.ts smart-bracket -d data/teams-2027.json --pool balanced
```

## Tech Stack

- TypeScript (strict mode, ES2022)
- Node.js 20+ with tsx
- BartTorvik JSON API for team efficiency data
- No external ML dependencies — ensemble of rule-based models with calibrated weights

## Related Projects

- **[Sports Betting MCP Server](https://github.com/seang1121/sports-betting-mcp)** — The first MCP server for sports betting. 9 tools, live odds, AI picks, 59.6% win rate.
- **[Multi-Lender Mortgage Rate Lookup](https://github.com/seang1121/Multi-Lender-Mortgage-Rate-Lookup)** — One command, 10 lenders, sorted best to worst. Stealth-browser mortgage rate comparison.
- **[Agent Command Center](https://github.com/seang1121/acc-agent-command-center)** — Dashboard that auto-discovers MCP servers, agents, hooks, cron jobs, and repos.

## License

MIT
