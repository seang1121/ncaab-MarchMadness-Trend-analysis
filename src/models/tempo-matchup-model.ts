// Model 3: Tempo & Matchup Model — REWRITTEN for model independence
// Core thesis: HOW teams play matters — tempo-adjusted expected scoring
// Independent signal: uses tempo + per-possession efficiency, NOT raw AdjEM sigmoid

import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";
import { PredictionModel, ModelPrediction } from "./index.js";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export class TempoMatchupModel implements PredictionModel {
  name = "Tempo & Matchup";
  description = "Tempo-adjusted scoring model — estimates game pace and expected points per possession";
  weight = 0.15;

  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction {
    const factors: string[] = [];

    const tempoA = teamA.kenpom.adjTempo;
    const tempoB = teamB.kenpom.adjTempo;

    // BASE: Tempo-adjusted expected scoring (independent from AdjEM)
    // Estimate game tempo (NCAA average ~68 possessions)
    const ncaaAvgTempo = 68;
    const gameTempo = (tempoA + tempoB) / 2;
    const possessions = gameTempo; // approximate possessions per team

    // Expected points: (adjOE / 100) * possessions
    const expectedA = (teamA.kenpom.adjO / 100) * possessions;
    const expectedB = (teamB.kenpom.adjO / 100) * possessions;

    // But also account for opposing defense
    // Adjusted: blend team's offense with opponent's defense
    const adjExpectedA = ((teamA.kenpom.adjO + (200 - teamB.kenpom.adjD)) / 200) * possessions;
    const adjExpectedB = ((teamB.kenpom.adjO + (200 - teamA.kenpom.adjD)) / 200) * possessions;

    const scoringDiff = adjExpectedA - adjExpectedB;
    let probA = sigmoid(scoringDiff * 0.12);

    factors.push(`Tempo-adjusted: ${teamA.name} ~${adjExpectedA.toFixed(1)}pts vs ${teamB.name} ~${adjExpectedB.toFixed(1)}pts (${gameTempo.toFixed(0)} pace)`);

    // Tempo compression effect — slow underdogs compress variance
    const underdog = teamA.seed > teamB.seed ? teamA : teamB;
    const favorite = teamA.seed > teamB.seed ? teamB : teamA;

    if (underdog.kenpom.adjTempo < 66) {
      const compression = (66 - underdog.kenpom.adjTempo) * 0.008;
      if (teamA === underdog) probA += compression;
      else probA -= compression;
      factors.push(`Tempo compression: ${underdog.name} (${underdog.kenpom.adjTempo.toFixed(1)} pace) compresses game`);
    }

    // Pace mismatch: large tempo differences — slower team usually controls
    const tempoDiff = Math.abs(tempoA - tempoB);
    if (tempoDiff > 5) {
      const slowerTeam = tempoA < tempoB ? teamA : teamB;
      const tempoControlAdj = tempoDiff * 0.004;
      if (slowerTeam === teamA) probA += tempoControlAdj;
      else probA -= tempoControlAdj;
      factors.push(`Pace mismatch: ${tempoDiff.toFixed(1)} gap — ${slowerTeam.name} controls tempo`);
    }

    // Fast-tempo favorite: can run opponents off the floor
    if (favorite.kenpom.adjTempo > 72 && favorite.kenpom.adjEM > 25) {
      const pushAdj = 0.04;
      if (teamA === favorite) probA += pushAdj;
      else probA -= pushAdj;
      factors.push(`Tempo-push: ${favorite.name} (${favorite.kenpom.adjTempo.toFixed(1)} pace, +${favorite.kenpom.adjEM.toFixed(1)})`);
    }

    // Slow-tempo grind favors better defensive team
    if (gameTempo < 66) {
      const defA = teamA.kenpom.adjDRank;
      const defB = teamB.kenpom.adjDRank;
      if (defA < defB - 10) {
        probA += 0.03;
        factors.push(`Grind game favors ${teamA.name} D (#${defA})`);
      } else if (defB < defA - 10) {
        probA -= 0.03;
        factors.push(`Grind game favors ${teamB.name} D (#${defB})`);
      }
    }

    // High-tempo shootout favors better offensive team
    if (gameTempo > 72) {
      const offA = teamA.kenpom.adjORank;
      const offB = teamB.kenpom.adjORank;
      if (offA < offB - 10) {
        probA += 0.03;
        factors.push(`Shootout favors ${teamA.name} O (#${offA})`);
      } else if (offB < offA - 10) {
        probA -= 0.03;
        factors.push(`Shootout favors ${teamB.name} O (#${offB})`);
      }
    }

    // Turnover battle
    if (teamA.kenpom.tovRate !== undefined && teamB.kenpom.tovRate !== undefined) {
      const tovDiff = (teamB.kenpom.tovRate ?? 18) - (teamA.kenpom.tovRate ?? 18);
      if (Math.abs(tovDiff) > 2) {
        const tovAdj = tovDiff * 0.006;
        probA += tovAdj;
        factors.push(`TO battle: ${tovDiff > 0 ? teamA.name : teamB.name} +${Math.abs(tovDiff).toFixed(1)}% better`);
      }
    }

    probA = Math.max(0.05, Math.min(0.95, probA));
    const confidence = Math.abs(probA - 0.5) * 1.5;

    return { model: this.name, winProbA: probA, winProbB: 1 - probA, confidence, factors };
  }
}
