# March Madness Bracket Analyzer

NCAA Tournament bracket prediction system backed by 14 years of KenPom/BartTorvik efficiency data (2011-2025). Five independent prediction models, Monte Carlo simulation, backtesting engine, and champion-diversified bracket generation.

**2026 Backtested Accuracy: 77.0% game-level (calibrated ensemble) across 882 historical games.**

---

## Quick Start

```bash
npm install

# Fetch current season data
npx tsx src/cli.ts fetch-data -y 2026

# Run Monte Carlo simulation (10K brackets)
npx tsx src/cli.ts simulate -d data/teams-2026.json --sims 10000 --calibrated

# Generate 8 brackets with different champions for pool coverage
npx tsx src/cli.ts bracket-for -d data/teams-2026.json -n 8 --calibrated

# Backtest all models against 14 historical tournaments
npx tsx src/cli.ts backtest --model all --fetch
```

---

## Prediction Models

Five models, each providing an independent signal:

| Model | What It Does | Backtest Accuracy |
|-------|-------------|-------------------|
| KenPom Efficiency | AdjEM sigmoid + staircase + two-way balance | 74.6% |
| Defensive Identity | Four-factors defensive composite (eFG%, TO, boards, FT) | Independent signal |
| Market Intelligence | Seed-as-market-proxy + conference tiers + ATS edges | 76.9% |
| Tempo & Matchup | Tempo-adjusted expected scoring + pace dynamics | Independent signal |
| Seed & History | 14-year advancement rates + dead zones + Cinderella ceilings | 76.5% |
| **Calibrated Ensemble** | **Confidence-weighted blend of all 5** | **77.0%** |

The ensemble outperforms any single model by combining truly independent signals.

---

## CLI Commands

### Bracket Generation
| Command | Description |
|---------|-------------|
| `bracket-for -n 8` | Generate N brackets with different champions (pool coverage) |
| `simulate --sims 10000` | Monte Carlo — championship probabilities for every team |
| `scenarios` | Tiered scenario brackets (3 champs x 4 FF x 8 E8) |
| `generate -m balanced` | Single bracket (chalk/balanced/upset-heavy) |
| `generate-optimal` | Single bracket with optimized weights |

### Analysis
| Command | Description |
|---------|-------------|
| `backtest --model all --fetch` | Backtest all models against 14 tournaments with real BartTorvik data |
| `optimize --step 0.10` | Grid search for optimal model weights |
| `multi-evaluate --team1 X --team2 Y` | All 5 models + ensemble matchup prediction |
| `champion-gate` | Run 8-gate champion filter on all teams |
| `cinderellas` | Classify double-digit seeds by type and ceiling |

### Data
| Command | Description |
|---------|-------------|
| `fetch-data -y 2026` | Fetch team data from BartTorvik |
| `overview -n 30` | Top teams by AdjEM with max viable round |
| `recalibrate` | 14-year historical recalibration |

All commands accept `-d <path>` for custom team data and `--calibrated` for betting-analyzer-calibrated weights.

---

## Backtesting System

Tests models against all 14 historical tournaments (882 games) using real BartTorvik KenPom data:

- **Game-level mode**: Each actual matchup tested independently — pure prediction accuracy
- **Bracket mode**: Simulated bracket filling with pick propagation — ESPN scoring (10/20/40/80/160/320)
- **Per-round breakdown**: R64 through Championship accuracy
- **Weight optimization**: Grid search across weight space x generation modes

```bash
# Full backtest with real data
npx tsx src/cli.ts backtest --model all --fetch

# Optimize weights
npx tsx src/cli.ts optimize --fetch --step 0.10
```

---

## Monte Carlo Simulation

Runs thousands of bracket simulations with randomness proportional to win probability:

```bash
npx tsx src/cli.ts simulate -d data/teams-2026.json --sims 10000 --calibrated
```

Outputs:
- Championship probability for top 15 teams
- Final Four probability for top 20 teams
- Elite Eight probability by region
- Mode bracket (most common outcome at each slot)

---

## Champion-Diversified Brackets

The highest-value strategy for bracket pools: submit multiple brackets, each with a different champion.

```bash
# Generate 8 brackets covering ~71% of championship outcomes
npx tsx src/cli.ts bracket-for -d data/teams-2026.json -n 8 --calibrated
```

Each bracket locks in a specific champion and fills every other game using the ensemble model.

---

## Project Structure

```
src/
  cli.ts                          # CLI entry point (18 commands)
  types.ts                        # Core type definitions
  models/
    kenpom-model.ts               # KenPom efficiency model
    defensive-identity-model.ts   # Four-factors defensive composite
    market-model.ts               # Seed-as-market-proxy
    tempo-matchup-model.ts        # Tempo-adjusted scoring
    seed-history-model.ts         # Historical advancement rates
    ensemble-model.ts             # Confidence-weighted blend
    betting-insights.ts           # Calibration from 892 live picks
  engine/
    generator.ts                  # Bracket generation with custom predictor
    monte-carlo.ts                # Monte Carlo simulation engine
    champion-brackets.ts          # Champion-diversified bracket generator
    scenario-generator.ts         # Tiered scenario brackets
    matchup-evaluator.ts          # Single matchup evaluation
    analyzer.ts                   # Bracket analysis
  backtest/
    backtester.ts                 # Core backtest engine (game-level + bracket mode)
    weight-optimizer.ts           # Grid search weight optimization
    historical-fetcher.ts         # BartTorvik JSON API + name matching
    historical-brackets-*.ts      # 14 years of verified tournament results
    backtest-types.ts             # Types + ESPN scoring
    backtest-report.ts            # CLI output formatting
  rules/
    champion-gate.ts              # 8-gate champion filter (14-year calibrated)
    efficiency-staircase.ts       # AdjEM floors by round
    seed-patterns.ts              # Seed advancement rates
    cinderella.ts                 # Double-digit seed classification
  historical/
    tournament-data.ts            # Champions, Final Fours, deep runs
  data/
    stats-fetcher.ts              # BartTorvik scraper
data/
  teams-2026.json                 # Real 2026 bracket (64 teams, BartTorvik stats)
  historical/                     # Cached BartTorvik data for 14 years
```

---

## Tech Stack

- TypeScript (strict mode, ES2022)
- Node.js 20+ with tsx
- BartTorvik JSON API for team efficiency data
- No external ML dependencies — ensemble of rule-based models with calibrated weights

---

## License

MIT
