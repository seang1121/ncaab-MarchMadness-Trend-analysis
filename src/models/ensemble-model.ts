// Ensemble Model: Blends all 5 models with confidence-weighted averaging
// Inspired by betting analyzer's multi-agent architecture:
//   - Agent agreement = 2.51% importance
//   - Agent score spread = 6.25% importance (2nd most important meta-feature!)
// When models disagree strongly, that's a FLAG — not something to average away

import { Team, Round } from "../types.js";
import { PredictionModel, ModelPrediction, EnsemblePrediction } from "./index.js";
import { KenPomModel } from "./kenpom-model.js";
import { MarketModel } from "./market-model.js";
import { TempoMatchupModel } from "./tempo-matchup-model.js";
import { SeedHistoryModel } from "./seed-history-model.js";
import { DefensiveIdentityModel } from "./defensive-identity-model.js";

export class EnsembleModel {
  private models: PredictionModel[];
  private roundWeights: Map<string, Record<string, number>> = new Map();

  constructor(customWeights?: Partial<Record<string, number>>) {
    this.models = [
      new KenPomModel(),
      new MarketModel(),
      new TempoMatchupModel(),
      new SeedHistoryModel(),
      new DefensiveIdentityModel(),
    ];

    // Allow custom weight overrides
    if (customWeights) {
      for (const model of this.models) {
        if (customWeights[model.name] !== undefined) {
          model.weight = customWeights[model.name]!;
        }
      }
    }

    // Normalize weights to sum to 1
    const totalWeight = this.models.reduce((sum, m) => sum + m.weight, 0);
    for (const model of this.models) {
      model.weight /= totalWeight;
    }
  }

  getModels(): PredictionModel[] {
    return [...this.models];
  }

  setRoundWeights(round: Round, weights: Record<string, number>): void {
    this.roundWeights.set(round, weights);
  }

  predict(teamA: Team, teamB: Team, round: Round): EnsemblePrediction {
    const predictions = this.models.map((model) => model.predict(teamA, teamB, round));

    // Check for round-specific weight overrides
    const roundOverride = this.roundWeights.get(round);

    // Confidence-weighted average
    let weightedProbA = 0;
    let totalConfWeight = 0;

    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      const pred = predictions[i];
      const baseWeight = roundOverride?.[model.name] ?? model.weight;
      const effectiveWeight = baseWeight * (0.5 + pred.confidence * 0.5);
      weightedProbA += pred.winProbA * effectiveWeight;
      totalConfWeight += effectiveWeight;
    }

    const finalProbA = totalConfWeight > 0 ? weightedProbA / totalConfWeight : 0.5;
    const finalProbB = 1 - finalProbA;

    // Model agreement analysis (inspired by betting analyzer's agent_agreement feature)
    const probAs = predictions.map((p) => p.winProbA);
    const allAgreeOnWinner = probAs.every((p) => p > 0.5) || probAs.every((p) => p < 0.5);
    const agreement = allAgreeOnWinner ? 1 - stdDev(probAs) : 0;

    // Score spread (betting analyzer's #5 most important feature at 6.25%)
    const spread = stdDev(probAs);

    const factors: string[] = [];

    // Summary factors
    const predictedWinner = finalProbA >= 0.5 ? teamA : teamB;
    const winProb = Math.max(finalProbA, finalProbB);

    factors.push(`Ensemble: ${predictedWinner.name} at ${(winProb * 100).toFixed(1)}% (${this.models.length} models)`);

    if (allAgreeOnWinner) {
      factors.push(`All ${this.models.length} models agree on winner (agreement: ${(agreement * 100).toFixed(0)}%)`);
    } else {
      const dissenting = predictions
        .filter((p, i) => (p.winProbA >= 0.5) !== (finalProbA >= 0.5))
        .map((p) => p.model);
      factors.push(`MODEL DISAGREEMENT: ${dissenting.join(", ")} favor the other side (spread: ${(spread * 100).toFixed(1)}%)`);
    }

    // Flag high-spread matchups — these are the most uncertain games
    if (spread > 0.12) {
      factors.push(`HIGH UNCERTAINTY: Model spread ${(spread * 100).toFixed(1)}% — this game is hard to call`);
    }

    // Per-model breakdown
    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      const pred = predictions[i];
      const winner = pred.winProbA >= 0.5 ? teamA.name : teamB.name;
      const prob = Math.max(pred.winProbA, pred.winProbB);
      factors.push(`  ${model.name} (${(model.weight * 100).toFixed(0)}%): ${winner} ${(prob * 100).toFixed(1)}%`);
    }

    return {
      teamA,
      teamB,
      round,
      finalProbA,
      finalProbB,
      predictedWinner,
      confidence: winProb - 0.5, // 0 = coin flip, 0.5 = certain
      modelPredictions: predictions,
      agreement,
      factors,
    };
  }

  // Generate bracket using ensemble predictions
  getModelNames(): string[] {
    return this.models.map((m) => `${m.name} (${(m.weight * 100).toFixed(0)}%)`);
  }
}

function stdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / values.length);
}

export function formatEnsemblePrediction(pred: EnsemblePrediction): string {
  const lines = [
    `=== ${pred.teamA.name} (${pred.teamA.seed}) vs ${pred.teamB.name} (${pred.teamB.seed}) — ${pred.round} ===`,
    "",
    `PREDICTION: ${pred.predictedWinner.name} (${(Math.max(pred.finalProbA, pred.finalProbB) * 100).toFixed(1)}%)`,
    `Confidence: ${pred.confidence > 0.3 ? "HIGH" : pred.confidence > 0.15 ? "MEDIUM" : "LOW"} (${(pred.confidence * 100).toFixed(1)}%)`,
    `Model Agreement: ${(pred.agreement * 100).toFixed(0)}%`,
    "",
  ];

  for (const factor of pred.factors) {
    lines.push(factor);
  }

  lines.push("");
  lines.push("--- Key Factors from Each Model ---");
  for (const mp of pred.modelPredictions) {
    lines.push(`\n[${mp.model}]`);
    mp.factors.slice(0, 3).forEach((f) => lines.push(`  ${f}`));
  }

  return lines.join("\n");
}
