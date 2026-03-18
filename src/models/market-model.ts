// Model 2: Market Intelligence Model
// Core thesis: Vegas lines encode more information than any single stat model
// Source: Betting analyzer insight — implied_probability is #2 feature (12.62% importance)
//         Market-implied data captures injury info, public betting, sharp money
// Strength: Incorporates ALL public information efficiently (efficient market hypothesis)
// Weakness: Can be wrong when sharp money is on the wrong side, or when March Madness
//           creates unique dynamics (neutral site, single elimination) that regular season lines don't reflect
// NOTE: This model uses seed-as-proxy for market expectation when we don't have live lines

import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";
import { PredictionModel, ModelPrediction } from "./index.js";

// Betting analyzer data: moneyline accuracy 63.9% — the market's NCAAB edge
// Spread accuracy: 50.8% — near coin flip (market is efficient on spreads)
// March accuracy: 56.8% vs Feb 50.2% — market gets BETTER in tournament

export class MarketModel implements PredictionModel {
  name = "Market Intelligence";
  description = "Seed-as-market-proxy with conference strength adjustment — simulates what Vegas expects";
  weight = 0.20;

  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction {
    const factors: string[] = [];

    // Seed difference as market proxy
    // In tournament, seed IS the market's pre-tournament assessment
    const seedDiff = teamB.seed - teamA.seed; // positive = A is favored
    let probA = seedToProb(seedDiff);
    factors.push(`Seed-based: ${teamA.seed} vs ${teamB.seed} → ${(probA * 100).toFixed(1)}% for ${teamA.name}`);

    // Conference strength adjustment
    // Betting analyzer insight: conference_strength has meaningful edge detection weight (0.08)
    const confA = conferenceStrength(teamA.conference);
    const confB = conferenceStrength(teamB.conference);
    if (confA !== confB) {
      const confAdj = (confA - confB) * 0.03;
      probA += confAdj;
      factors.push(`Conference: ${teamA.conference} (tier ${confA}) vs ${teamB.conference} (tier ${confB})`);
    }

    // Win% proxy (betting analyzer: stat_win_pct = 1.78% importance)
    // Better record at same seed = undervalued by market
    // We don't have explicit record but KenPom rank relative to seed captures this
    const expectedRankA = teamA.seed * 4;
    const expectedRankB = teamB.seed * 4;
    const overperformA = expectedRankA - teamA.kenpom.rank; // positive = better than seed implies
    const overperformB = expectedRankB - teamB.kenpom.rank;
    if (Math.abs(overperformA - overperformB) > 5) {
      const adj = (overperformA - overperformB) * 0.002;
      probA += adj;
      if (overperformA > overperformB) {
        factors.push(`${teamA.name} overperforms seed by ${overperformA} KenPom spots`);
      } else {
        factors.push(`${teamB.name} overperforms seed by ${overperformB} KenPom spots`);
      }
    }

    // Tournament round adjustment
    // Betting analyzer: March accuracy (56.8%) > Feb (50.2%)
    // Market gets MORE accurate as tournament progresses — respect chalk more in later rounds
    const roundIdx = ROUNDS_IN_ORDER.indexOf(round);
    if (roundIdx >= 3 && probA > 0.5) {
      // Slight chalk boost in later rounds — market confidence increases
      probA += 0.02;
      factors.push(`Late-round market efficiency: chalk boosted in ${round}`);
    }

    // ATS insight from betting analyzer: 1-seeds overpriced in E8 (43.4% ATS)
    if (round === "E8" && (teamA.seed === 1 || teamB.seed === 1)) {
      const oneSeed = teamA.seed === 1 ? "A" : "B";
      if (oneSeed === "A") probA -= 0.04;
      else probA += 0.04;
      factors.push(`Market overprices 1-seeds in E8 (43.4% ATS) — adjusting`);
    }

    probA = Math.max(0.03, Math.min(0.97, probA));
    const confidence = Math.abs(probA - 0.5) * 1.8; // slightly lower confidence — seed is imperfect proxy

    return { model: this.name, winProbA: probA, winProbB: 1 - probA, confidence, factors };
  }
}

function seedToProb(seedDiff: number): number {
  // Sigmoid-like mapping from seed difference to win probability
  // Based on historical tournament data
  // seedDiff > 0 means teamA is lower seed (better)
  if (seedDiff === 0) return 0.5;
  return 1 / (1 + Math.exp(-seedDiff * 0.22));
}

function conferenceStrength(conf: string): number {
  // Tier system matching betting analyzer's conference edge detection
  const tiers: Record<string, number> = {
    "SEC": 4, "Big 12": 4, "Big Ten": 4,
    "ACC": 3, "Big East": 3,
    "MWC": 2, "AAC": 2, "WCC": 2,
  };
  return tiers[conf] ?? 1;
}
