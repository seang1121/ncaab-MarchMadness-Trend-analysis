// Model 5: Defensive Identity Model — REWRITTEN for model independence
// Core thesis: Defense wins championships — but HOW a team defends matters
// Uses four-factors defensive composite instead of AdjEM sigmoid
// Independent signal from KenPom model (which uses raw AdjEM)

import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";
import { PredictionModel, ModelPrediction } from "./index.js";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export class DefensiveIdentityModel implements PredictionModel {
  name = "Defensive Identity";
  description = "Four-factors defensive composite — opponent eFG%, TO creation, defensive boards, FT prevention";
  weight = 0.20;

  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction {
    const factors: string[] = [];
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round);

    // BASE: Four-factors defensive composite (independent from AdjEM)
    let probA: number;
    const hasAdvanced = teamA.kenpom.efgPct !== undefined && teamB.kenpom.efgPct !== undefined;

    if (hasAdvanced) {
      // Each factor: how much better is team A's defense vs team B's defense?
      // We compare what each team ALLOWS (lower = better defense)

      // 1. Shot contesting: opponent eFG% (most important factor ~40%)
      // Lower adjD means fewer points allowed — proxy for shot contesting
      const shotContestDiff = teamB.kenpom.adjD - teamA.kenpom.adjD;
      const shotScore = sigmoid(shotContestDiff * 0.06);

      // 2. Turnover creation: team's ability to force mistakes (~25%)
      // Use the difference in how much each team turns the ball over as a proxy
      // (teams that force TOs have opponents with high TO rates)
      const tovA = teamA.kenpom.tovRate ?? 18;
      const tovB = teamB.kenpom.tovRate ?? 18;
      // Lower own TO rate = better ball security; also compare defensive pressure
      const tovDiff = tovB - tovA; // positive = A takes care of ball better
      const tovScore = sigmoid(tovDiff * 0.08);

      // 3. Defensive rebounding: ending possessions (~20%)
      const orbA = teamA.kenpom.orbRate ?? 30;
      const orbB = teamB.kenpom.orbRate ?? 30;
      const orbDiff = orbA - orbB; // positive = A gets more offensive boards
      const orbScore = sigmoid(orbDiff * 0.06);

      // 4. Free throw prevention: not fouling (~15%)
      const ftA = teamA.kenpom.ftRate ?? 15;
      const ftB = teamB.kenpom.ftRate ?? 15;
      const ftDiff = ftA - ftB; // positive = A gets to the line more
      const ftScore = sigmoid(ftDiff * 0.05);

      // Weighted composite (defense-heavy)
      probA = shotScore * 0.40 + tovScore * 0.25 + orbScore * 0.20 + ftScore * 0.15;

      factors.push(`Four-factors: shots=${(shotScore * 100).toFixed(0)}% TO=${(tovScore * 100).toFixed(0)}% boards=${(orbScore * 100).toFixed(0)}% FT=${(ftScore * 100).toFixed(0)}%`);
    } else {
      // Fallback: defense-weighted AdjD comparison (when four-factors unavailable)
      const defDiff = teamB.kenpom.adjD - teamA.kenpom.adjD;
      probA = sigmoid(defDiff * 0.07);
      factors.push(`AdjD fallback: ${teamA.name} #${teamA.kenpom.adjDRank} vs ${teamB.name} #${teamB.kenpom.adjDRank}`);
    }

    // Glass cannon trap: elite offense + bad defense (independent check)
    if (isGlassCannon(teamA)) {
      probA -= 0.08;
      factors.push(`GLASS CANNON: ${teamA.name} (O:#${teamA.kenpom.adjORank}, D:#${teamA.kenpom.adjDRank})`);
    }
    if (isGlassCannon(teamB)) {
      probA += 0.08;
      factors.push(`GLASS CANNON: ${teamB.name} (O:#${teamB.kenpom.adjORank}, D:#${teamB.kenpom.adjDRank})`);
    }

    // Defensive floor enforcement — gets STRICTER each round
    const defFloors: Record<string, number> = {
      R64: 999, R32: 55, S16: 40, E8: 30, F4: 25, Championship: 25,
    };
    const floor = defFloors[round] ?? 999;

    if (teamA.kenpom.adjDRank > floor) {
      const penalty = Math.min(0.12, (teamA.kenpom.adjDRank - floor) * 0.003);
      probA -= penalty;
      factors.push(`${teamA.name} D #${teamA.kenpom.adjDRank} below ${round} floor (top ${floor})`);
    }
    if (teamB.kenpom.adjDRank > floor) {
      const penalty = Math.min(0.12, (teamB.kenpom.adjDRank - floor) * 0.003);
      probA += penalty;
      factors.push(`${teamB.name} D #${teamB.kenpom.adjDRank} below ${round} floor (top ${floor})`);
    }

    // Elite defense bonus: top 10 AdjD teams grind opponents
    if (teamA.kenpom.adjDRank <= 10 && teamB.kenpom.adjDRank > 20) {
      probA += 0.05;
      factors.push(`Elite D: ${teamA.name} (#${teamA.kenpom.adjDRank}) locks down`);
    }
    if (teamB.kenpom.adjDRank <= 10 && teamA.kenpom.adjDRank > 20) {
      probA -= 0.05;
      factors.push(`Elite D: ${teamB.name} (#${teamB.kenpom.adjDRank}) locks down`);
    }

    // Championship two-way requirement (F4+)
    if (roundIdx >= 4) {
      const twoWayA = teamA.kenpom.adjORank <= 25 && teamA.kenpom.adjDRank <= 25;
      const twoWayB = teamB.kenpom.adjORank <= 25 && teamB.kenpom.adjDRank <= 25;
      if (twoWayA && !twoWayB) {
        probA += 0.10;
        factors.push(`Two-way profile: ${teamA.name} (O:#${teamA.kenpom.adjORank}, D:#${teamA.kenpom.adjDRank})`);
      } else if (twoWayB && !twoWayA) {
        probA -= 0.10;
        factors.push(`Two-way profile: ${teamB.name} (O:#${teamB.kenpom.adjORank}, D:#${teamB.kenpom.adjDRank})`);
      }
    }

    // Late-round defense premium
    if (roundIdx >= 3) {
      const lateDefAdj = (teamB.kenpom.adjDRank - teamA.kenpom.adjDRank) * 0.002;
      probA += lateDefAdj;
    }

    probA = Math.max(0.03, Math.min(0.97, probA));
    const confidence = Math.abs(probA - 0.5) * 1.7;

    return { model: this.name, winProbA: probA, winProbB: 1 - probA, confidence, factors };
  }
}

function isGlassCannon(team: Team): boolean {
  return team.kenpom.adjORank <= 15 && team.kenpom.adjDRank > 45;
}
