// Weight optimizer: grid search for optimal model weights across all historical data
// Two strategies: static (one weight vector) and adaptive (per-round-group weights)

import { Round } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { getCalibratedWeights } from "../models/betting-insights.js";
import { OptimizationResult, ROUND_GROUPS } from "./backtest-types.js";
import { getAllHistoricalBrackets } from "./historical-brackets-index.js";
import { backtestGameLevel, backtestBracketMode } from "./backtester.js";
import { buildTeamsFromHistorical, fetchHistoricalTeams } from "./historical-fetcher.js";
import { Team } from "../types.js";

type Mode = "chalk" | "balanced" | "upset-heavy";

const MODEL_NAMES = [
  "KenPom Efficiency",
  "Defensive Identity",
  "Market Intelligence",
  "Tempo & Matchup",
  "Seed & History",
];

const MODES: Mode[] = ["chalk", "balanced", "upset-heavy"];

// Generate weight combinations that sum to 1.0 with given step size
function generateWeightCombos(step: number): Record<string, number>[] {
  const combos: Record<string, number>[] = [];
  const steps = Math.round(1 / step);

  // 5-model weight space: enumerate all combos where weights sum to 1.0
  // Each weight must be >= step (minimum 5% contribution)
  const minSteps = 1; // each model gets at least 1 step
  const remaining = steps - MODEL_NAMES.length * minSteps;

  if (remaining < 0) return combos;

  // Generate partitions of `remaining` into 5 buckets (0 to remaining each)
  function partition(buckets: number, total: number, current: number[]): void {
    if (buckets === 1) {
      current.push(total);
      const weights: Record<string, number> = {};
      for (let i = 0; i < MODEL_NAMES.length; i++) {
        weights[MODEL_NAMES[i]] = (current[i] + minSteps) * step;
      }
      combos.push(weights);
      current.pop();
      return;
    }

    const maxForThis = Math.min(total, steps - minSteps);
    for (let i = 0; i <= maxForThis; i++) {
      current.push(i);
      partition(buckets - 1, total - i, current);
      current.pop();
    }
  }

  partition(MODEL_NAMES.length, remaining, []);
  return combos;
}

function makePredictor(
  ensemble: EnsembleModel,
): (teamA: Team, teamB: Team, round: Round) => string {
  return (teamA, teamB, round) => {
    const pred = ensemble.predict(teamA, teamB, round);
    return pred.predictedWinner.name;
  };
}

interface ScoredCombo {
  weights: Record<string, number>;
  mode: string;
  espnScore: number;
  gameAccuracy: number;
}

export async function runStaticOptimization(
  step: number = 0.10,
  topN: number = 10,
  fetchData: boolean = false,
): Promise<OptimizationResult> {
  console.log("\n=== STATIC WEIGHT OPTIMIZATION ===");
  console.log(`Step size: ${step}, Models: ${MODEL_NAMES.length}`);

  const combos = generateWeightCombos(step);
  console.log(`Testing ${combos.length} weight combinations x ${MODES.length} modes = ${combos.length * MODES.length} configs`);

  // Load historical data
  const tournaments = getAllHistoricalBrackets();
  const teamsByYear = new Map<number, Team[]>();

  for (const tournament of tournaments) {
    if (fetchData) {
      const cached = await fetchHistoricalTeams(tournament.year);
      teamsByYear.set(tournament.year, buildTeamsFromHistorical(cached, tournament));
    } else {
      teamsByYear.set(tournament.year, buildPlaceholderTeams(tournament));
    }
  }

  // Test all combos
  const allResults: ScoredCombo[] = [];
  let tested = 0;

  for (const weights of combos) {
    for (const mode of MODES) {
      const ensemble = new EnsembleModel(weights);
      const predictor = makePredictor(ensemble);
      const gameLevel = backtestGameLevel(predictor, teamsByYear, tournaments);

      allResults.push({
        weights: { ...weights },
        mode,
        espnScore: gameLevel.espnScore,
        gameAccuracy: gameLevel.accuracy,
      });

      tested++;
      if (tested % 500 === 0) {
        console.log(`  Tested ${tested}/${combos.length * MODES.length}...`);
      }
    }
  }

  // Sort by ESPN score
  allResults.sort((a, b) => b.espnScore - a.espnScore);

  // Get default and calibrated baselines
  const defaultEnsemble = new EnsembleModel();
  const defaultPred = makePredictor(defaultEnsemble);
  const defaultGame = backtestGameLevel(defaultPred, teamsByYear, tournaments);

  const calibratedEnsemble = new EnsembleModel(getCalibratedWeights());
  const calibratedPred = makePredictor(calibratedEnsemble);
  const calibratedGame = backtestGameLevel(calibratedPred, teamsByYear, tournaments);

  const best = allResults[0];

  return {
    strategy: "static",
    bestWeights: best.weights,
    bestMode: best.mode as Mode,
    bestEspnScore: best.espnScore,
    bestGameAccuracy: best.gameAccuracy,
    top10: allResults.slice(0, topN),
    comparison: {
      default: { espnScore: defaultGame.espnScore, gameAccuracy: defaultGame.accuracy },
      calibrated: { espnScore: calibratedGame.espnScore, gameAccuracy: calibratedGame.accuracy },
      optimized: { espnScore: best.espnScore, gameAccuracy: best.gameAccuracy },
    },
  };
}

export async function runAdaptiveOptimization(
  step: number = 0.10,
  topN: number = 10,
  fetchData: boolean = false,
): Promise<OptimizationResult> {
  console.log("\n=== ADAPTIVE (ROUND-GROUP) WEIGHT OPTIMIZATION ===");
  console.log(`Step size: ${step}, Round groups: early/mid/late`);

  const combos = generateWeightCombos(step);
  console.log(`Testing ${combos.length} weight combos per round group`);

  // Load historical data
  const tournaments = getAllHistoricalBrackets();
  const teamsByYear = new Map<number, Team[]>();

  for (const tournament of tournaments) {
    if (fetchData) {
      const cached = await fetchHistoricalTeams(tournament.year);
      teamsByYear.set(tournament.year, buildTeamsFromHistorical(cached, tournament));
    } else {
      teamsByYear.set(tournament.year, buildPlaceholderTeams(tournament));
    }
  }

  // For each round group, find best weights independently
  const roundGroupWeights: Record<string, Record<string, number>> = {};
  const roundGroupBest: Record<string, ScoredCombo> = {};

  for (const [groupName, rounds] of Object.entries(ROUND_GROUPS)) {
    console.log(`\n  Optimizing ${groupName} rounds (${rounds.join(", ")})...`);
    let bestScore = -1;
    let bestCombo: Record<string, number> = {};

    for (const weights of combos) {
      const ensemble = new EnsembleModel(weights);
      const predictor = makePredictor(ensemble);

      // Only count games in this round group
      let groupCorrect = 0;
      let groupTotal = 0;
      let groupEspn = 0;

      const gameLevel = backtestGameLevel(predictor, teamsByYear, tournaments);
      for (const round of rounds) {
        const stats = gameLevel.byRound[round as Round];
        groupCorrect += stats.correct;
        groupTotal += stats.total;
        groupEspn += stats.correct * (gameLevel.espnScore > 0 ? 1 : 0); // simplified
      }

      const score = groupTotal > 0 ? groupCorrect / groupTotal : 0;
      if (score > bestScore) {
        bestScore = score;
        bestCombo = { ...weights };
      }
    }

    roundGroupWeights[groupName] = bestCombo;
    roundGroupBest[groupName] = {
      weights: bestCombo,
      mode: "chalk",
      espnScore: 0,
      gameAccuracy: bestScore,
    };
    console.log(`  Best ${groupName} accuracy: ${(bestScore * 100).toFixed(1)}%`);
  }

  // Build adaptive ensemble with per-round weights
  const bestMode: Mode = "chalk"; // test all modes with adaptive weights
  let bestEspn = 0;
  let bestModeResult: Mode = "chalk";

  for (const mode of MODES) {
    const ensemble = new EnsembleModel();
    // Set round-specific weights
    for (const [groupName, rounds] of Object.entries(ROUND_GROUPS)) {
      for (const round of rounds) {
        ensemble.setRoundWeights(round as Round, roundGroupWeights[groupName]);
      }
    }

    const predictor = makePredictor(ensemble);
    const gameLevel = backtestGameLevel(predictor, teamsByYear, tournaments);

    if (gameLevel.espnScore > bestEspn) {
      bestEspn = gameLevel.espnScore;
      bestModeResult = mode;
    }
  }

  // Final adaptive result
  const adaptiveEnsemble = new EnsembleModel();
  for (const [groupName, rounds] of Object.entries(ROUND_GROUPS)) {
    for (const round of rounds) {
      adaptiveEnsemble.setRoundWeights(round as Round, roundGroupWeights[groupName]);
    }
  }
  const adaptivePred = makePredictor(adaptiveEnsemble);
  const adaptiveGame = backtestGameLevel(adaptivePred, teamsByYear, tournaments);

  // Baselines
  const defaultEnsemble = new EnsembleModel();
  const defaultGame = backtestGameLevel(makePredictor(defaultEnsemble), teamsByYear, tournaments);
  const calibratedEnsemble = new EnsembleModel(getCalibratedWeights());
  const calibratedGame = backtestGameLevel(makePredictor(calibratedEnsemble), teamsByYear, tournaments);

  return {
    strategy: "adaptive",
    bestWeights: roundGroupWeights["early"], // primary weights
    bestMode: bestModeResult,
    bestEspnScore: adaptiveGame.espnScore,
    bestGameAccuracy: adaptiveGame.accuracy,
    roundGroupWeights,
    top10: [{ weights: roundGroupWeights["early"], mode: bestModeResult, espnScore: adaptiveGame.espnScore, gameAccuracy: adaptiveGame.accuracy }],
    comparison: {
      default: { espnScore: defaultGame.espnScore, gameAccuracy: defaultGame.accuracy },
      calibrated: { espnScore: calibratedGame.espnScore, gameAccuracy: calibratedGame.accuracy },
      optimized: { espnScore: adaptiveGame.espnScore, gameAccuracy: adaptiveGame.accuracy },
    },
  };
}

// Reuse from backtester
function buildPlaceholderTeams(tournament: { regions: Record<string, { seeds: Record<number, string> }> }): Team[] {
  const teams: Team[] = [];
  for (const [regionName, region] of Object.entries(tournament.regions)) {
    for (const [seedStr, teamName] of Object.entries(region.seeds)) {
      const seed = parseInt(seedStr);
      teams.push({
        name: teamName as string,
        seed,
        region: regionName as any,
        conference: "Unknown",
        isPowerConference: false,
        isFirstFourWinner: false,
        kenpom: {
          rank: seed * 18,
          adjEM: Math.max(-5, 35 - seed * 2.5),
          adjO: 115 - seed * 0.8,
          adjORank: seed * 18,
          adjD: 95 + seed * 0.8,
          adjDRank: seed * 18,
          adjTempo: 68,
          adjTempoRank: 150,
          sosRank: seed * 12,
        },
      });
    }
  }
  return teams;
}
