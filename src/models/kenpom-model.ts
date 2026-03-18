// Model 1: KenPom Efficiency Model
// Core thesis: AdjEM difference is the single best predictor of tournament outcomes
// Source: 6 years of march-madness research — efficiency staircase, champion gate
// Strength: Best at identifying who SHOULD win based on season-long performance
// Weakness: Doesn't account for matchup-specific dynamics, momentum, or market info

import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";
import { PredictionModel, ModelPrediction } from "./index.js";
import { meetsThreshold } from "../rules/efficiency-staircase.js";
import { isExtremeTeam } from "../rules/cinderella.js";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export class KenPomModel implements PredictionModel {
  name = "KenPom Efficiency";
  description = "Pure efficiency-based: AdjEM difference drives prediction, modified by staircase thresholds and two-way balance";
  weight = 0.30; // highest single-model weight — proven strongest predictor

  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction {
    const factors: string[] = [];

    // Core: AdjEM difference (coefficient tuned to KenPom's predictive power)
    const emDiff = teamA.kenpom.adjEM - teamB.kenpom.adjEM;
    let probA = sigmoid(emDiff * 0.07);
    factors.push(`AdjEM gap: ${emDiff > 0 ? "+" : ""}${emDiff.toFixed(1)} (${teamA.kenpom.adjEM.toFixed(1)} vs ${teamB.kenpom.adjEM.toFixed(1)})`);

    // Two-way balance bonus: teams elite on both ends get a bump
    const aBalanced = teamA.kenpom.adjORank <= 30 && teamA.kenpom.adjDRank <= 30;
    const bBalanced = teamB.kenpom.adjORank <= 30 && teamB.kenpom.adjDRank <= 30;
    if (aBalanced && !bBalanced) {
      probA += 0.04;
      factors.push(`${teamA.name} has two-way balance (O:#${teamA.kenpom.adjORank}, D:#${teamA.kenpom.adjDRank})`);
    } else if (bBalanced && !aBalanced) {
      probA -= 0.04;
      factors.push(`${teamB.name} has two-way balance (O:#${teamB.kenpom.adjORank}, D:#${teamB.kenpom.adjDRank})`);
    }

    // Extreme team penalty (top-10 one end, outside top-50 other)
    const extA = isExtremeTeam(teamA);
    const extB = isExtremeTeam(teamB);
    if (extA.isExtreme) {
      probA -= 0.07;
      factors.push(`EXTREME: ${teamA.name} — ${extA.reason}`);
    }
    if (extB.isExtreme) {
      probA += 0.07;
      factors.push(`EXTREME: ${teamB.name} — ${extB.reason}`);
    }

    // Staircase compliance in later rounds
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round);
    if (roundIdx >= 2) {
      const checkA = meetsThreshold(teamA, round);
      const checkB = meetsThreshold(teamB, round);
      if (!checkA.meets && checkB.meets) {
        probA -= 0.06;
        factors.push(`${teamA.name} below ${round} staircase: ${checkA.violations[0]}`);
      } else if (checkA.meets && !checkB.meets) {
        probA += 0.06;
        factors.push(`${teamB.name} below ${round} staircase: ${checkB.violations[0]}`);
      }
    }

    // KenPom rank inversion (lower seed ranks higher)
    if (teamA.seed > teamB.seed && teamA.kenpom.rank < teamB.kenpom.rank) {
      probA += 0.05;
      factors.push(`KenPom inversion: ${teamA.name} #${teamA.kenpom.rank} > ${teamB.name} #${teamB.kenpom.rank}`);
    } else if (teamB.seed > teamA.seed && teamB.kenpom.rank < teamA.kenpom.rank) {
      probA -= 0.05;
      factors.push(`KenPom inversion: ${teamB.name} #${teamB.kenpom.rank} > ${teamA.name} #${teamA.kenpom.rank}`);
    }

    probA = Math.max(0.03, Math.min(0.97, probA));
    const confidence = Math.abs(probA - 0.5) * 2;

    return { model: this.name, winProbA: probA, winProbB: 1 - probA, confidence, factors };
  }
}
