# March Madness Bracket Analyzer

**NCAA Tournament bracket prediction system -- 5 independent models, calibrated ensemble achieving 77% game-level accuracy over 14-year backtest.**

![Status](https://img.shields.io/badge/status-active-green)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)
![Node](https://img.shields.io/badge/node-20%2B-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## What It Does

Predicts NCAA Tournament outcomes using five independent prediction models blended into a confidence-weighted ensemble. Backtested against 882 historical games across 14 tournaments (2011-2025), with Monte Carlo simulation for championship probabilities and a champion-diversified bracket strategy for pool coverage.

## Features

- **77% game-level accuracy** -- calibrated ensemble across 14-year backtest
- **5 prediction models** -- KenPom efficiency, defensive identity, market intelligence, tempo/matchup, seed/history
- **18 CLI commands** -- bracket generation, simulation, backtesting, optimization, matchup analysis
- **Monte Carlo simulation** -- 10K+ bracket simulations for championship probabilities
- **Champion-diversified brackets** -- generate N brackets with different champions for pool coverage
- **14-year backtest engine** -- game-level and bracket-mode testing with ESPN scoring
- **2026 brackets** -- real 64-team bracket with live BartTorvik stats
- **Weight optimization** -- grid search across model weight space

## Tech Stack

- **TypeScript** (strict mode, ES2022)
- **Node.js 20+** with tsx
- **BartTorvik JSON API** for team efficiency data
- **No external ML dependencies** -- ensemble of rule-based models with calibrated weights

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

## Prediction Models

| Model | What It Does | Backtest Accuracy |
|-------|-------------|-------------------|
| KenPom Efficiency | AdjEM sigmoid + staircase + two-way balance | 74.6% |
| Defensive Identity | Four-factors defensive composite | Independent signal |
| Market Intelligence | Seed-as-market-proxy + conference tiers + ATS edges | 76.9% |
| Tempo & Matchup | Tempo-adjusted expected scoring + pace dynamics | Independent signal |
| Seed & History | 14-year advancement rates + dead zones + ceilings | 76.5% |
| **Calibrated Ensemble** | **Confidence-weighted blend of all 5** | **77.0%** |

## CLI Commands

### Bracket Generation
| Command | Description |
|---------|-------------|
| `bracket-for -n 8` | Generate N brackets with different champions |
| `simulate --sims 10000` | Monte Carlo championship probabilities |
| `scenarios` | Tiered scenario brackets (3 champs x 4 FF x 8 E8) |
| `generate -m balanced` | Single bracket (chalk/balanced/upset-heavy) |

### Analysis
| Command | Description |
|---------|-------------|
| `backtest --model all --fetch` | Backtest all models against 14 tournaments |
| `optimize --step 0.10` | Grid search for optimal model weights |
| `multi-evaluate --team1 X --team2 Y` | All 5 models + ensemble matchup prediction |
| `champion-gate` | Run 8-gate champion filter on all teams |

### Data
| Command | Description |
|---------|-------------|
| `fetch-data -y 2026` | Fetch team data from BartTorvik |
| `overview -n 30` | Top teams by AdjEM with max viable round |
| `recalibrate` | 14-year historical recalibration |

## Architecture

```
src/
  cli.ts              # CLI entry point (18 commands)
  models/             # 5 prediction models + ensemble + calibration
  engine/             # Bracket generation, Monte Carlo, matchup evaluation
  backtest/           # 14-year backtest engine + weight optimizer
  rules/              # Champion gate, efficiency staircase, seed patterns
data/
  teams-2026.json     # Real 2026 bracket (64 teams, BartTorvik stats)
  historical/         # Cached BartTorvik data for 14 years
```

## License

MIT
