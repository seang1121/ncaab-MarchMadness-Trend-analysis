// Model 4: Seed & Historical Pattern Model
// Core thesis: Seeds encode committee wisdom; historical patterns repeat
// Source: 14 years of tournament data (2011-2025) — seed advancement rates, dead zones, anomalies
// Strength: Captures structural bracket dynamics that stat models ignore
//           (committee seeding, bracket position, historical upset frequencies)
// Weakness: Treats all 5-seeds the same regardless of actual team quality

import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";
import { PredictionModel, ModelPrediction } from "./index.js";
import {
  seedAdvancementRate, r64UpsetRate, isDeadZone,
  is11SeedAnomaly, hasNeverReachedS16,
} from "../rules/seed-patterns.js";
import { classifyCinderella, isCinderella } from "../rules/cinderella.js";

export class SeedHistoryModel implements PredictionModel {
  name = "Seed & History";
  description = "Pure historical seed matchup rates with structural bracket pattern adjustments";
  weight = 0.15;

  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction {
    const factors: string[] = [];
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round);

    // Base: historical head-to-head seed win rate
    let probA: number;

    if (round === "R64") {
      // Use specific R64 upset rates
      if (teamA.seed < teamB.seed) {
        probA = 1 - r64UpsetRate(teamA.seed, teamB.seed);
      } else if (teamB.seed < teamA.seed) {
        probA = r64UpsetRate(teamB.seed, teamA.seed);
      } else {
        probA = 0.5;
      }
      factors.push(`R64 historical: ${teamA.seed}v${teamB.seed} → ${(probA * 100).toFixed(1)}% for lower seed`);
    } else {
      // Later rounds: use advancement rates as proxy
      const rateA = seedAdvancementRate(teamA.seed, round);
      const rateB = seedAdvancementRate(teamB.seed, round);
      probA = rateA + rateB > 0 ? rateA / (rateA + rateB) : 0.5;
      factors.push(`${round} advancement rates: ${teamA.seed}-seed (${(rateA * 100).toFixed(1)}%) vs ${teamB.seed}-seed (${(rateB * 100).toFixed(1)}%)`);
    }

    // 11-seed anomaly: they reach Sweet 16 EVERY year
    if (is11SeedAnomaly(teamA.seed) && roundIdx <= 2) {
      if (teamA.isPowerConference) {
        probA += 0.08;
        factors.push(`11-SEED ANOMALY: ${teamA.name} is power conference (${teamA.conference}) — reaches S16 every year in study`);
      } else {
        probA += 0.03;
        factors.push(`11-seed from ${teamA.conference} — mid-major 11s have lower ceiling`);
      }
    }
    if (is11SeedAnomaly(teamB.seed) && roundIdx <= 2) {
      if (teamB.isPowerConference) {
        probA -= 0.08;
        factors.push(`11-SEED ANOMALY: ${teamB.name} is power conference (${teamB.conference})`);
      } else {
        probA -= 0.03;
      }
    }

    // Dead zone penalty (seeds 6-9 in Sweet 16+)
    if (roundIdx >= 2) {
      if (isDeadZone(teamA.seed)) {
        probA -= 0.08;
        factors.push(`DEAD ZONE: ${teamA.seed}-seeds produce only 7.5% of Sweet 16 spots`);
      }
      if (isDeadZone(teamB.seed)) {
        probA += 0.08;
        factors.push(`DEAD ZONE: ${teamB.seed}-seeds produce only 7.5% of Sweet 16 spots`);
      }
    }

    // Seeds 13-14 never made Sweet 16 in 14-year study
    if (roundIdx >= 2) {
      if (hasNeverReachedS16(teamA.seed)) {
        probA = Math.min(probA, 0.05);
        factors.push(`${teamA.seed}-seed has NEVER reached ${round} in 14-year study`);
      }
      if (hasNeverReachedS16(teamB.seed)) {
        probA = Math.max(probA, 0.95);
        factors.push(`${teamB.seed}-seed has NEVER reached ${round} in 14-year study`);
      }
    }

    // Cinderella ceiling enforcement
    if (isCinderella(teamA) && roundIdx >= 2) {
      const assessment = classifyCinderella(teamA);
      const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
      if (roundIdx > ceilingIdx) {
        probA = Math.min(probA, 0.10);
        factors.push(`Cinderella ceiling: ${teamA.name} (${assessment.type}) maxes at ${assessment.ceiling}`);
      }
    }
    if (isCinderella(teamB) && roundIdx >= 2) {
      const assessment = classifyCinderella(teamB);
      const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
      if (roundIdx > ceilingIdx) {
        probA = Math.max(probA, 0.90);
        factors.push(`Cinderella ceiling: ${teamB.name} (${assessment.type}) maxes at ${assessment.ceiling}`);
      }
    }

    // 5v12 special: one of the most common upsets (33%)
    if (round === "R64") {
      if ((teamA.seed === 12 && teamB.seed === 5) || (teamA.seed === 5 && teamB.seed === 12)) {
        factors.push(`Classic 5v12 matchup: 12-seeds win 33% — one of the most reliable upset spots`);
      }
    }

    // Championship: seeds 1-8 historically (avg champion seed: 1.7)
    // 2014 UConn won as 7-seed, 2014 Kentucky reached final as 8-seed
    if (round === "Championship") {
      if (teamA.seed > 8) {
        probA = Math.min(probA, 0.05);
        factors.push(`No seed higher than 8 has reached championship in 14-year study — ${teamA.name} is a ${teamA.seed}-seed`);
      }
      if (teamB.seed > 8) {
        probA = Math.max(probA, 0.95);
        factors.push(`No seed higher than 8 has reached championship in 14-year study — ${teamB.name} is a ${teamB.seed}-seed`);
      }
    }

    probA = Math.max(0.02, Math.min(0.98, probA));
    const confidence = Math.abs(probA - 0.5) * 1.6;

    return { model: this.name, winProbA: probA, winProbB: 1 - probA, confidence, factors };
  }
}
