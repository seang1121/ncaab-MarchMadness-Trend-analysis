import { Team, Round, MatchupPrediction, ROUNDS_IN_ORDER } from "../types.js";
import { meetsThreshold } from "../rules/efficiency-staircase.js";
import { seedAdvancementRate, r64UpsetRate } from "../rules/seed-patterns.js";
import { classifyCinderella, isCinderella, isExtremeTeam } from "../rules/cinderella.js";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function evaluateMatchup(teamA: Team, teamB: Team, round: Round): MatchupPrediction {
  const factors: string[] = [];

  // Base probability from AdjEM difference
  const emDiff = teamA.kenpom.adjEM - teamB.kenpom.adjEM;
  let probA = sigmoid(emDiff * 0.07);
  factors.push(`AdjEM diff: ${emDiff > 0 ? "+" : ""}${emDiff.toFixed(1)} → base ${(probA * 100).toFixed(1)}% for ${teamA.name}`);

  // KenPom inversion bonus (lower seed ranks higher on KenPom)
  if (teamA.seed > teamB.seed && teamA.kenpom.rank < teamB.kenpom.rank) {
    probA += 0.05;
    factors.push(`KenPom inversion: ${teamA.name} (#${teamA.kenpom.rank}) ranks above ${teamB.name} (#${teamB.kenpom.rank}) despite higher seed`);
  } else if (teamB.seed > teamA.seed && teamB.kenpom.rank < teamA.kenpom.rank) {
    probA -= 0.05;
    factors.push(`KenPom inversion: ${teamB.name} (#${teamB.kenpom.rank}) ranks above ${teamA.name} (#${teamA.kenpom.rank}) despite higher seed`);
  }

  // Seed-history adjustment for R64
  if (round === "R64" && teamA.seed !== teamB.seed) {
    const higher = Math.min(teamA.seed, teamB.seed);
    const lower = Math.max(teamA.seed, teamB.seed);
    const upsetRate = r64UpsetRate(higher, lower);
    const seedProb = teamA.seed < teamB.seed ? 1 - upsetRate : upsetRate;
    probA = probA * 0.75 + seedProb * 0.25;
    factors.push(`R64 seed history (${higher}v${lower}): ${((1 - upsetRate) * 100).toFixed(0)}% favorite win rate`);
  }

  // Efficiency staircase check
  const roundIdx = ROUNDS_IN_ORDER.indexOf(round);
  if (roundIdx >= 2) { // S16+
    const checkA = meetsThreshold(teamA, round);
    const checkB = meetsThreshold(teamB, round);
    if (!checkA.meets && checkB.meets) {
      probA -= 0.08;
      factors.push(`${teamA.name} below ${round} efficiency staircase: ${checkA.violations[0]}`);
    } else if (checkA.meets && !checkB.meets) {
      probA += 0.08;
      factors.push(`${teamB.name} below ${round} efficiency staircase: ${checkB.violations[0]}`);
    }
  }

  // Extreme team penalty
  const extremeA = isExtremeTeam(teamA);
  const extremeB = isExtremeTeam(teamB);
  if (extremeA.isExtreme) {
    probA -= 0.06;
    factors.push(`EXTREME TEAM: ${teamA.name} — ${extremeA.reason}`);
  }
  if (extremeB.isExtreme) {
    probA += 0.06;
    factors.push(`EXTREME TEAM: ${teamB.name} — ${extremeB.reason}`);
  }

  // Cinderella ceiling enforcement
  if (isCinderella(teamA)) {
    const assessment = classifyCinderella(teamA);
    const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
    if (roundIdx > ceilingIdx) {
      probA = Math.min(probA, 0.15);
      factors.push(`Cinderella ceiling: ${teamA.name} (${assessment.type}) capped at ${assessment.ceiling}`);
    }
  }
  if (isCinderella(teamB)) {
    const assessment = classifyCinderella(teamB);
    const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
    if (roundIdx > ceilingIdx) {
      probA = Math.max(probA, 0.85);
      factors.push(`Cinderella ceiling: ${teamB.name} (${assessment.type}) capped at ${assessment.ceiling}`);
    }
  }

  // First Four winner bonus in R64
  if (round === "R64") {
    if (teamA.isFirstFourWinner) {
      probA += 0.03;
      factors.push(`First Four winner bonus: ${teamA.name} (92.1% ATS historically)`);
    }
    if (teamB.isFirstFourWinner) {
      probA -= 0.03;
      factors.push(`First Four winner bonus: ${teamB.name} (92.1% ATS historically)`);
    }
  }

  // Tempo compression for underdogs (slow tempo = fewer possessions = more variance)
  if (teamA.seed > teamB.seed && teamA.kenpom.adjTempo < 66) {
    probA += 0.03;
    factors.push(`Tempo compression: ${teamA.name} plays slow (${teamA.kenpom.adjTempo.toFixed(1)}) — compresses game for upset`);
  } else if (teamB.seed > teamA.seed && teamB.kenpom.adjTempo < 66) {
    probA -= 0.03;
    factors.push(`Tempo compression: ${teamB.name} plays slow (${teamB.kenpom.adjTempo.toFixed(1)}) — compresses game for upset`);
  }

  // Clamp probability
  probA = Math.max(0.02, Math.min(0.98, probA));
  const probB = 1 - probA;

  const predictedWinner = probA >= 0.5 ? teamA : teamB;
  const confidence = Math.max(probA, probB);

  return {
    teamA,
    teamB,
    winProbA: probA,
    winProbB: probB,
    predictedWinner,
    confidence,
    factors,
  };
}

export function formatPrediction(pred: MatchupPrediction): string {
  const lines = [
    `${pred.teamA.name} (${pred.teamA.seed}) vs ${pred.teamB.name} (${pred.teamB.seed})`,
    `  Winner: ${pred.predictedWinner.name} (${(pred.confidence * 100).toFixed(1)}% confidence)`,
    `  ${pred.teamA.name}: ${(pred.winProbA * 100).toFixed(1)}% | ${pred.teamB.name}: ${(pred.winProbB * 100).toFixed(1)}%`,
    "",
    "  Factors:",
  ];

  pred.factors.forEach((f) => lines.push(`    - ${f}`));
  return lines.join("\n");
}
