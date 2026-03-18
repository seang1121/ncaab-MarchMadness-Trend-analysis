// CLI output formatting for backtest results

import { ROUNDS_IN_ORDER, Round } from "../types.js";
import { BacktestResult, OptimizationResult, ESPN_POINTS } from "./backtest-types.js";

export function formatBacktestResult(result: BacktestResult): string {
  const lines: string[] = [];

  lines.push(`\n=== BACKTEST: ${result.modelName} (${result.mode} mode) ===`);
  lines.push(`Years: ${result.years.join(", ")} (${result.years.length} tournaments)\n`);

  // Game-level results
  lines.push("--- GAME-LEVEL (isolated — each actual matchup tested independently) ---");
  lines.push(`Overall: ${result.gameLevel.correctPicks}/${result.gameLevel.totalGames} (${(result.gameLevel.accuracy * 100).toFixed(1)}%)`);
  lines.push(`ESPN Score: ${result.gameLevel.espnScore.toLocaleString()}\n`);

  lines.push("By Round:");
  lines.push("  Round          Correct  Total  Accuracy  Points/Game");
  lines.push("  " + "-".repeat(55));
  for (const r of ROUNDS_IN_ORDER) {
    const s = result.gameLevel.byRound[r as Round];
    if (s.total > 0) {
      lines.push(`  ${r.padEnd(15)} ${s.correct.toString().padStart(5)}  ${s.total.toString().padStart(5)}  ${(s.accuracy * 100).toFixed(1).padStart(7)}%  ${ESPN_POINTS[r as Round].toString().padStart(5)}`);
    }
  }

  // Bracket-mode results
  lines.push("\n--- BRACKET MODE (propagated — picks cascade through bracket) ---");
  lines.push(`Overall: ${result.bracketMode.correctPicks}/${result.bracketMode.totalGames} (${(result.bracketMode.accuracy * 100).toFixed(1)}%)`);
  lines.push(`ESPN Score: ${result.bracketMode.espnScore.toLocaleString()}\n`);

  lines.push("By Round:");
  lines.push("  Round          Correct  Total  Accuracy");
  lines.push("  " + "-".repeat(42));
  for (const r of ROUNDS_IN_ORDER) {
    const s = result.bracketMode.byRound[r as Round];
    if (s.total > 0) {
      lines.push(`  ${r.padEnd(15)} ${s.correct.toString().padStart(5)}  ${s.total.toString().padStart(5)}  ${(s.accuracy * 100).toFixed(1).padStart(7)}%`);
    }
  }

  // Per-year breakdown
  lines.push("\n--- PER YEAR ---");
  lines.push("  Year  ESPN Score  Game Accuracy");
  lines.push("  " + "-".repeat(35));
  const sortedYears = Object.entries(result.perYear).sort(([a], [b]) => parseInt(a) - parseInt(b));
  for (const [year, data] of sortedYears) {
    lines.push(`  ${year}  ${data.bracketEspn.toString().padStart(8)}  ${(data.gameAccuracy * 100).toFixed(1).padStart(10)}%`);
  }
  const avgEspn = sortedYears.reduce((s, [, d]) => s + d.bracketEspn, 0) / sortedYears.length;
  lines.push(`  ${"AVG".padEnd(4)}  ${avgEspn.toFixed(0).padStart(8)}  ${(result.bracketMode.accuracy * 100).toFixed(1).padStart(10)}%`);

  // Top seed matchups
  const seedMatchups = Object.entries(result.gameLevel.bySeedMatchup)
    .filter(([, v]) => v.total >= 5)
    .sort(([, a], [, b]) => b.accuracy - a.accuracy);
  if (seedMatchups.length > 0) {
    lines.push("\n--- TOP SEED MATCHUP ACCURACY (5+ games) ---");
    for (const [matchup, stats] of seedMatchups.slice(0, 10)) {
      lines.push(`  ${matchup.padEnd(8)} ${stats.correct}/${stats.total} (${(stats.accuracy * 100).toFixed(0)}%)`);
    }
  }

  return lines.join("\n");
}

export function formatModelComparison(results: BacktestResult[]): string {
  const lines: string[] = [];

  lines.push("\n" + "=".repeat(80));
  lines.push("  MODEL COMPARISON ACROSS ALL 14 TOURNAMENTS");
  lines.push("=".repeat(80));

  lines.push("\n  Model                    Mode        Game Acc  ESPN Score  Bracket Acc");
  lines.push("  " + "-".repeat(75));

  const sorted = [...results].sort((a, b) => b.gameLevel.espnScore - a.gameLevel.espnScore);
  for (const r of sorted) {
    lines.push(
      `  ${r.modelName.padEnd(25)} ${r.mode.padEnd(12)} ${(r.gameLevel.accuracy * 100).toFixed(1).padStart(6)}%  ${r.gameLevel.espnScore.toString().padStart(9)}  ${(r.bracketMode.accuracy * 100).toFixed(1).padStart(8)}%`
    );
  }

  // Best model per metric
  const bestGame = sorted.reduce((best, r) => r.gameLevel.accuracy > best.gameLevel.accuracy ? r : best);
  const bestEspn = sorted.reduce((best, r) => r.gameLevel.espnScore > best.gameLevel.espnScore ? r : best);
  const bestBracket = sorted.reduce((best, r) => r.bracketMode.espnScore > best.bracketMode.espnScore ? r : best);

  lines.push(`\n  Best game-level accuracy: ${bestGame.modelName} (${(bestGame.gameLevel.accuracy * 100).toFixed(1)}%)`);
  lines.push(`  Best ESPN score (game):   ${bestEspn.modelName} (${bestEspn.gameLevel.espnScore})`);
  lines.push(`  Best ESPN score (bracket): ${bestBracket.modelName} (${bestBracket.bracketMode.espnScore})`);

  return lines.join("\n");
}

export function formatOptimizationResult(result: OptimizationResult): string {
  const lines: string[] = [];

  lines.push("\n" + "=".repeat(80));
  lines.push(`  OPTIMIZATION RESULTS (${result.strategy.toUpperCase()} strategy)`);
  lines.push("=".repeat(80));

  lines.push("\n--- BEST CONFIGURATION ---");
  lines.push(`  Mode: ${result.bestMode}`);
  lines.push(`  ESPN Score: ${result.bestEspnScore.toLocaleString()}`);
  lines.push(`  Game Accuracy: ${(result.bestGameAccuracy * 100).toFixed(1)}%`);
  lines.push("\n  Weights:");
  for (const [model, weight] of Object.entries(result.bestWeights)) {
    lines.push(`    ${model.padEnd(25)} ${(weight * 100).toFixed(1)}%`);
  }

  // Round-group weights for adaptive
  if (result.roundGroupWeights) {
    lines.push("\n--- ROUND-GROUP WEIGHTS (adaptive) ---");
    for (const [group, weights] of Object.entries(result.roundGroupWeights)) {
      lines.push(`\n  ${group.toUpperCase()} rounds:`);
      for (const [model, weight] of Object.entries(weights)) {
        lines.push(`    ${model.padEnd(25)} ${(weight * 100).toFixed(1)}%`);
      }
    }
  }

  // Top 10
  lines.push("\n--- TOP 10 CONFIGURATIONS ---");
  lines.push("  Rank  Mode          ESPN Score  Game Acc  Weights");
  lines.push("  " + "-".repeat(75));
  for (let i = 0; i < Math.min(10, result.top10.length); i++) {
    const cfg = result.top10[i];
    const wStr = Object.entries(cfg.weights).map(([m, w]) => `${m.slice(0, 3)}:${(w * 100).toFixed(0)}`).join(" ");
    lines.push(
      `  ${(i + 1).toString().padStart(4)}  ${cfg.mode.padEnd(14)} ${cfg.espnScore.toString().padStart(9)}  ${(cfg.gameAccuracy * 100).toFixed(1).padStart(6)}%  ${wStr}`
    );
  }

  // Comparison
  lines.push("\n--- DEFAULT vs CALIBRATED vs OPTIMIZED ---");
  lines.push("  Config      ESPN Score  Game Accuracy");
  lines.push("  " + "-".repeat(40));
  lines.push(`  Default     ${result.comparison.default.espnScore.toString().padStart(9)}  ${(result.comparison.default.gameAccuracy * 100).toFixed(1).padStart(10)}%`);
  lines.push(`  Calibrated  ${result.comparison.calibrated.espnScore.toString().padStart(9)}  ${(result.comparison.calibrated.gameAccuracy * 100).toFixed(1).padStart(10)}%`);
  lines.push(`  Optimized   ${result.comparison.optimized.espnScore.toString().padStart(9)}  ${(result.comparison.optimized.gameAccuracy * 100).toFixed(1).padStart(10)}%`);

  const improvement = result.comparison.optimized.espnScore - result.comparison.default.espnScore;
  lines.push(`\n  Improvement: +${improvement} ESPN points (${((improvement / result.comparison.default.espnScore) * 100).toFixed(1)}% over default)`);

  return lines.join("\n");
}
