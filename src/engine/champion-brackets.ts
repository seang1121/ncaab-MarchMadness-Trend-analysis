// Generate one bracket per champion candidate
// Each bracket locks in a specific champion and optimizes the rest around that path

import { Team, Region, Round, Bracket, RegionBracket, GeneratedBracket } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { monteCarloSimulate, MonteCarloResult } from "./monte-carlo.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];
const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export interface ChampionBracket {
  champion: { name: string; seed: number; region: string; champProb: number };
  bracket: GeneratedBracket;
  ffTeams: string[];
  upsetCount: number;
}

// Simulate a region, forcing the champion through if they're in this region
function simRegion(
  teams: Team[],
  region: Region,
  ensemble: EnsembleModel,
  forceWinner?: string,
): RegionBracket {
  const teamBySeed: Record<number, Team> = {};
  for (const t of teams) if (t.region === region) teamBySeed[t.seed] = t;

  function pick(a: Team, b: Team, round: Round): Team {
    if (forceWinner) {
      if (a.name === forceWinner) return a;
      if (b.name === forceWinner) return b;
    }
    const pred = ensemble.predict(a, b, round);
    return pred.predictedWinner;
  }

  const r64Winners: Team[] = [];
  for (const [high, low] of R64_SEED_MATCHUPS) {
    const a = teamBySeed[high];
    const b = teamBySeed[low];
    if (!a || !b) { r64Winners.push(a || b); continue; }
    r64Winners.push(pick(a, b, "R64"));
  }

  const r32Winners: Team[] = [];
  for (let i = 0; i < r64Winners.length; i += 2) {
    r32Winners.push(pick(r64Winners[i], r64Winners[i + 1], "R32"));
  }

  const s16Winners: Team[] = [];
  for (let i = 0; i < r32Winners.length; i += 2) {
    s16Winners.push(pick(r32Winners[i], r32Winners[i + 1], "S16"));
  }

  const e8Winner = pick(s16Winners[0], s16Winners[1], "E8");

  return {
    region, teams: teams.filter((t) => t.region === region),
    picks: {
      r64: r64Winners.map((t) => t.name),
      r32: r32Winners.map((t) => t.name),
      s16: s16Winners.map((t) => t.name),
      e8: [e8Winner.name],
    },
  };
}

export function generateChampionBrackets(
  teams: Team[],
  ensemble: EnsembleModel,
  numChampions: number = 6,
  mcSims: number = 10000,
): ChampionBracket[] {
  // Run Monte Carlo to get champion probabilities
  console.log(`  Running ${mcSims.toLocaleString()} Monte Carlo sims to rank champions...`);
  const mc = monteCarloSimulate(teams, ensemble, mcSims);

  const topChamps = mc.champProbs.slice(0, numChampions);
  console.log(`  Top ${numChampions} champions: ${topChamps.map((c) => `${c.team} (${(c.prob * 100).toFixed(1)}%)`).join(", ")}`);

  const allTeams = teams.filter((t) => t.seed > 0);
  const teamMap = new Map(allTeams.map((t) => [t.name, t]));

  const results: ChampionBracket[] = [];

  for (const champ of topChamps) {
    const champTeam = teamMap.get(champ.team);
    if (!champTeam) continue;

    const champRegion = champTeam.region;

    // Simulate all 4 regions — force champion through their region
    const regionBrackets: Record<Region, RegionBracket> = {} as Record<Region, RegionBracket>;
    for (const region of REGIONS) {
      const forceWinner = region === champRegion ? champ.team : undefined;
      regionBrackets[region] = simRegion(allTeams, region, ensemble, forceWinner);
    }

    // Final Four: E vs W, S vs MW
    const e8Winners = REGIONS.map((r) => {
      const name = regionBrackets[r].picks.e8[0];
      return teamMap.get(name)!;
    });

    // Force champion through FF and Championship
    let semi1: Team, semi2: Team, champion: Team;

    // Semi 1: East(0) vs West(1)
    if (e8Winners[0].name === champ.team || e8Winners[1].name === champ.team) {
      semi1 = champTeam;
    } else {
      const pred = ensemble.predict(e8Winners[0], e8Winners[1], "F4");
      semi1 = pred.predictedWinner;
    }

    // Semi 2: South(2) vs Midwest(3)
    if (e8Winners[2].name === champ.team || e8Winners[3].name === champ.team) {
      semi2 = champTeam;
    } else {
      const pred = ensemble.predict(e8Winners[2], e8Winners[3], "F4");
      semi2 = pred.predictedWinner;
    }

    champion = champTeam;

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
      const rTeams = allTeams.filter((t) => t.region === region);
      for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
        const [highSeed] = R64_SEED_MATCHUPS[i];
        const winner = rTeams.find((t) => t.name === rb.picks.r64[i]);
        if (winner && winner.seed > highSeed) upsetCount++;
      }
    }

    const ffTeams = [semi1.name, semi2.name,
      e8Winners.find((t) => t.name !== semi1.name && (t === e8Winners[0] || t === e8Winners[1]))?.name || "",
      e8Winners.find((t) => t.name !== semi2.name && (t === e8Winners[2] || t === e8Winners[3]))?.name || "",
    ].filter(Boolean);

    results.push({
      champion: { name: champ.team, seed: champ.seed, region: champRegion, champProb: champ.prob },
      bracket: { mode: "balanced", bracket, analysis: null as never, upsetCount },
      ffTeams,
      upsetCount,
    });
  }

  return results;
}

export function formatChampionBrackets(brackets: ChampionBracket[]): string {
  const lines: string[] = [];

  lines.push("=".repeat(75));
  lines.push("  CHAMPION-DIVERSIFIED BRACKETS");
  lines.push(`  ${brackets.length} brackets, each with a different champion`);
  lines.push("=".repeat(75));

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const { bracket } = b.bracket;

    lines.push(`\n${"─".repeat(75)}`);
    lines.push(`  BRACKET ${i + 1}: ${b.champion.name} wins it all`);
    lines.push(`  ${b.champion.seed}-seed (${b.champion.region}) — ${(b.champion.champProb * 100).toFixed(1)}% Monte Carlo probability`);
    lines.push(`  Final Four: ${b.ffTeams.join(", ")}`);
    lines.push(`  Upsets: ${b.upsetCount}`);
    lines.push(`${"─".repeat(75)}`);

    for (const region of REGIONS) {
      const rb = bracket.regions[region];
      lines.push(`  ${region.padEnd(8)} E8: ${rb.picks.e8[0]}`);
      lines.push(`           S16: ${rb.picks.s16.join(", ")}`);
      lines.push(`           R32: ${rb.picks.r32.join(", ")}`);
      lines.push(`           R64: ${rb.picks.r64.join(", ")}`);
    }

    lines.push(`  FF: ${bracket.finalFour.semi1.winner} over ${bracket.finalFour.semi1.winner === b.ffTeams[0] ? b.ffTeams[2] || "?" : b.ffTeams[0]}`);
    lines.push(`      ${bracket.finalFour.semi2.winner} over ${bracket.finalFour.semi2.winner === b.ffTeams[1] ? b.ffTeams[3] || "?" : b.ffTeams[1]}`);
    lines.push(`  CHAMPION: ${bracket.champion}`);
  }

  // Summary table
  lines.push(`\n${"=".repeat(75)}`);
  lines.push("  SUBMISSION STRATEGY SUMMARY");
  lines.push("=".repeat(75));
  lines.push("\n  #   Champion                Seed  Region    MC Prob  Upsets  FF Teams");
  lines.push("  " + "─".repeat(72));

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    lines.push(
      `  ${(i + 1).toString().padStart(2)}  ${b.champion.name.padEnd(24)} ${b.champion.seed.toString().padStart(2)}    ${b.champion.region.padEnd(10)} ${(b.champion.champProb * 100).toFixed(1).padStart(5)}%  ${b.upsetCount.toString().padStart(5)}   ${b.ffTeams.join(", ")}`
    );
  }

  const totalCoverage = brackets.reduce((s, b) => s + b.champion.champProb, 0);
  lines.push(`\n  Total champion coverage: ${(totalCoverage * 100).toFixed(1)}% of outcomes`);
  lines.push(`  Remaining field: ${((1 - totalCoverage) * 100).toFixed(1)}%`);

  return lines.join("\n");
}
