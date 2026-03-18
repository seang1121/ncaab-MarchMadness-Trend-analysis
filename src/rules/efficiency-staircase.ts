import { Team, Round, ROUNDS_IN_ORDER } from "../types.js";

interface RoundThreshold {
  round: Round;
  adjEMFloor: number;
  adjDRankCeiling: number | null;
  adjORankCeiling: number | null;
  description: string;
}

// Recalibrated from 14 tournaments (2011-2025)
// Key change: F4/Championship floors lowered for outliers
// 2014 UConn: AdjEM +18.7 won championship
// 2016 Syracuse: AdjEM +14.8 reached Final Four (10-seed)

const STAIRCASE: RoundThreshold[] = [
  {
    round: "R64",
    adjEMFloor: 8,
    adjDRankCeiling: null,
    adjORankCeiling: null,
    description: "Single-game variance dominant — AdjEM +8 floor",
  },
  {
    round: "R32",
    adjEMFloor: 14,
    adjDRankCeiling: 55,
    adjORankCeiling: null,
    description: "Preparation advantage kicks in — AdjEM +14, AdjD top 55",
  },
  {
    round: "S16",
    adjEMFloor: 20,
    adjDRankCeiling: 40,
    adjORankCeiling: 40,
    description: "Steepest cliff — AdjEM +20, defense + offense top 40",
  },
  {
    round: "E8",
    adjEMFloor: 18,
    adjDRankCeiling: 35,
    adjORankCeiling: 35,
    description: "Two-way competence required — AdjEM +18, both ends top 35",
  },
  {
    round: "F4",
    adjEMFloor: 14,
    adjDRankCeiling: 40,
    adjORankCeiling: null,
    description: "14-year data: outliers like 2016 Syracuse (+14.8) reach F4 — floor lowered",
  },
  {
    round: "Championship",
    adjEMFloor: 18,
    adjDRankCeiling: 25,
    adjORankCeiling: 40,
    description: "2014 UConn (+18.7) sets floor — AdjEM +18, AdjD top 25, AdjO top 40",
  },
];

export function getThreshold(round: Round): RoundThreshold {
  return STAIRCASE.find((s) => s.round === round)!;
}

export function meetsThreshold(team: Team, round: Round): { meets: boolean; violations: string[] } {
  const threshold = getThreshold(round);
  const violations: string[] = [];

  if (team.kenpom.adjEM < threshold.adjEMFloor) {
    violations.push(
      `AdjEM ${team.kenpom.adjEM.toFixed(1)} below ${round} floor of +${threshold.adjEMFloor}`
    );
  }

  if (threshold.adjDRankCeiling && team.kenpom.adjDRank > threshold.adjDRankCeiling) {
    violations.push(
      `AdjD rank #${team.kenpom.adjDRank} outside top ${threshold.adjDRankCeiling} for ${round}`
    );
  }

  if (threshold.adjORankCeiling && team.kenpom.adjORank > threshold.adjORankCeiling) {
    violations.push(
      `AdjO rank #${team.kenpom.adjORank} outside top ${threshold.adjORankCeiling} for ${round}`
    );
  }

  return { meets: violations.length === 0, violations };
}

export function maxViableRound(team: Team): Round {
  let maxRound: Round = "R64";

  for (const threshold of STAIRCASE) {
    const { meets } = meetsThreshold(team, threshold.round);
    if (!meets) break;
    maxRound = threshold.round;
  }

  return maxRound;
}

export function getStaircaseProfile(team: Team): string {
  const lines = [`${team.name} (${team.seed}-seed) — Efficiency Staircase`];
  const maxRound = maxViableRound(team);
  lines.push(`  Max viable round: ${maxRound}`);
  lines.push(`  AdjEM: ${team.kenpom.adjEM.toFixed(1)} | AdjO: #${team.kenpom.adjORank} | AdjD: #${team.kenpom.adjDRank}`);
  lines.push("");

  for (const threshold of STAIRCASE) {
    const { meets, violations } = meetsThreshold(team, threshold.round);
    const roundIdx = ROUNDS_IN_ORDER.indexOf(threshold.round);
    const maxIdx = ROUNDS_IN_ORDER.indexOf(maxRound);
    const marker = roundIdx <= maxIdx ? "[PASS]" : "[FAIL]";
    lines.push(`  ${marker} ${threshold.round}: ${threshold.description}`);
    violations.forEach((v) => lines.push(`         - ${v}`));
  }

  return lines.join("\n");
}
