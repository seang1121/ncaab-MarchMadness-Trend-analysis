import {
  Team, Region, Round, Bracket, RegionBracket,
  GeneratedBracket, ROUNDS_IN_ORDER,
} from "../types.js";
import { evaluateMatchup } from "./matchup-evaluator.js";
import { evaluateChampionGate } from "../rules/champion-gate.js";
import { maxViableRound } from "../rules/efficiency-staircase.js";
import { seedAdvancementRate, isDeadZone, is11SeedAnomaly, hasNeverReachedS16 } from "../rules/seed-patterns.js";
import { classifyCinderella, isCinderella } from "../rules/cinderella.js";

type Mode = "chalk" | "balanced" | "upset-heavy";
export type Predictor = (teamA: Team, teamB: Team, round: Round) => Team;

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

// Standard bracket slots: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const R64_SEED_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export function generateBracket(teams: Team[], mode: Mode, predictor?: Predictor): GeneratedBracket {
  const regionTeams: Record<Region, Team[]> = { East: [], West: [], South: [], Midwest: [] };

  for (const team of teams) {
    if (team.seed > 0 && team.region) {
      regionTeams[team.region].push(team);
    }
  }

  const regionBrackets: Record<Region, RegionBracket> = {} as Record<Region, RegionBracket>;

  for (const region of REGIONS) {
    regionBrackets[region] = simulateRegion(regionTeams[region], region, mode, predictor);
  }

  // Final Four
  const e8Winners = REGIONS.map((r) => {
    const e8Pick = regionBrackets[r].picks.e8[0];
    return regionTeams[r].find((t) => t.name === e8Pick)!;
  });

  // Standard FF matchups: East vs West, South vs Midwest
  const semi1 = predictor
    ? predictor(e8Winners[0], e8Winners[1], "F4")
    : pickWinner(e8Winners[0], e8Winners[1], "F4", mode);
  const semi2 = predictor
    ? predictor(e8Winners[2], e8Winners[3], "F4")
    : pickWinner(e8Winners[2], e8Winners[3], "F4", mode);
  const champion = predictor
    ? predictor(semi1, semi2, "Championship")
    : pickWinner(semi1, semi2, "Championship", mode);

  const bracket: Bracket = {
    year: 2026,
    regions: regionBrackets,
    finalFour: {
      semi1: { team1Region: "East", team2Region: "West", winner: semi1.name },
      semi2: { team1Region: "South", team2Region: "Midwest", winner: semi2.name },
    },
    champion: champion.name,
  };

  // Count upsets
  let upsetCount = 0;
  for (const region of REGIONS) {
    const rb = regionBrackets[region];
    const rTeams = regionTeams[region];

    // Count R64 upsets
    for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
      const [highSeed] = R64_SEED_MATCHUPS[i];
      const winner = rTeams.find((t) => t.name === rb.picks.r64[i]);
      if (winner && winner.seed > highSeed) upsetCount++;
    }
  }

  return {
    mode,
    bracket,
    analysis: null as never, // filled by analyzer
    upsetCount,
  };
}

function simulateRegion(teams: Team[], region: Region, mode: Mode, predictor?: Predictor): RegionBracket {
  const teamBySeed: Record<number, Team> = {};
  for (const t of teams) teamBySeed[t.seed] = t;

  const pick = (a: Team, b: Team, round: Round): Team =>
    predictor ? predictor(a, b, round) : pickWinner(a, b, round, mode);

  // R64
  const r64Winners: Team[] = [];
  for (const [highSeed, lowSeed] of R64_SEED_MATCHUPS) {
    const a = teamBySeed[highSeed];
    const b = teamBySeed[lowSeed];
    if (!a || !b) {
      r64Winners.push(a || b);
      continue;
    }
    r64Winners.push(pick(a, b, "R64"));
  }

  // R32 (winners play in pairs: 0v1, 2v3, 4v5, 6v7)
  const r32Winners: Team[] = [];
  for (let i = 0; i < r64Winners.length; i += 2) {
    r32Winners.push(pick(r64Winners[i], r64Winners[i + 1], "R32"));
  }

  // S16
  const s16Winners: Team[] = [];
  for (let i = 0; i < r32Winners.length; i += 2) {
    s16Winners.push(pick(r32Winners[i], r32Winners[i + 1], "S16"));
  }

  // E8
  const e8Winner = pick(s16Winners[0], s16Winners[1], "E8");

  return {
    region,
    teams,
    picks: {
      r64: r64Winners.map((t) => t.name),
      r32: r32Winners.map((t) => t.name),
      s16: s16Winners.map((t) => t.name),
      e8: [e8Winner.name],
    },
  };
}

function pickWinner(teamA: Team, teamB: Team, round: Round, mode: Mode): Team {
  const pred = evaluateMatchup(teamA, teamB, round);
  const favorite = pred.winProbA >= 0.5 ? teamA : teamB;
  const underdog = pred.winProbA >= 0.5 ? teamB : teamA;
  const upsetProb = Math.min(pred.winProbA, pred.winProbB);

  switch (mode) {
    case "chalk":
      return favorite;

    case "balanced": {
      // Pick upsets only when they're historically plausible
      const shouldUpset = shouldPickUpset(underdog, favorite, round, upsetProb, "balanced");
      return shouldUpset ? underdog : favorite;
    }

    case "upset-heavy": {
      const shouldUpset = shouldPickUpset(underdog, favorite, round, upsetProb, "upset-heavy");
      return shouldUpset ? underdog : favorite;
    }

    default:
      return favorite;
  }
}

function shouldPickUpset(
  underdog: Team,
  favorite: Team,
  round: Round,
  upsetProb: number,
  mode: "balanced" | "upset-heavy"
): boolean {
  const roundIdx = ROUNDS_IN_ORDER.indexOf(round);

  // Never pick seeds 13-14 past R32
  if (hasNeverReachedS16(underdog.seed) && roundIdx >= 2) return false;

  // Cinderella ceiling check
  if (isCinderella(underdog)) {
    const assessment = classifyCinderella(underdog);
    const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
    if (roundIdx > ceilingIdx) return false;
  }

  // Dead zone teams rarely make S16
  if (isDeadZone(underdog.seed) && round === "S16") return false;

  // Champion must pass champion gate — don't upset someone who could be champion
  // if the underdog can't be champion (for late rounds)
  if (roundIdx >= 4) { // F4+
    const gate = evaluateChampionGate(underdog);
    if (gate.score < 6) return false;
  }

  // Threshold: how willing are we to pick upsets?
  const threshold = mode === "balanced" ? 0.35 : 0.22;

  // 11-seed anomaly: always pick at least one 11-seed upset in R64
  if (round === "R64" && is11SeedAnomaly(underdog.seed) && underdog.isPowerConference) {
    return upsetProb >= 0.20;
  }

  // KenPom inversion: lower seed ranks higher — not really an upset
  if (underdog.kenpom.rank < favorite.kenpom.rank) {
    return upsetProb >= threshold * 0.6;
  }

  // Efficiency-based: underdog's maxViableRound includes this round
  const maxRound = maxViableRound(underdog);
  const maxIdx = ROUNDS_IN_ORDER.indexOf(maxRound);
  if (maxIdx >= roundIdx && upsetProb >= threshold) {
    return true;
  }

  return upsetProb >= threshold;
}

export function formatGeneratedBracket(gen: GeneratedBracket): string {
  const { bracket, mode, upsetCount } = gen;
  const lines = [
    `=== ${mode.toUpperCase()} BRACKET (${upsetCount} upsets) ===`,
    "",
  ];

  for (const region of REGIONS) {
    const rb = bracket.regions[region];
    lines.push(`--- ${region} Region ---`);
    lines.push(`  R64 winners: ${rb.picks.r64.join(", ")}`);
    lines.push(`  R32 winners: ${rb.picks.r32.join(", ")}`);
    lines.push(`  Sweet 16: ${rb.picks.s16.join(", ")}`);
    lines.push(`  Elite 8: ${rb.picks.e8[0]}`);
    lines.push("");
  }

  lines.push("--- Final Four ---");
  lines.push(`  Semi 1 (East vs West): ${bracket.finalFour.semi1.winner}`);
  lines.push(`  Semi 2 (South vs Midwest): ${bracket.finalFour.semi2.winner}`);
  lines.push(`  CHAMPION: ${bracket.champion}`);

  return lines.join("\n");
}
