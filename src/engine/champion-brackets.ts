// Champion-diversified brackets with FULL Monte Carlo sampling
// Each bracket is a complete random simulation where the target champion happened to win
// Every game has realistic upset probability — no deterministic picks

import { Team, Region, Round, Bracket, RegionBracket, GeneratedBracket } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { monteCarloSimulate } from "./monte-carlo.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];
const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export interface ChampionBracket {
  champion: { name: string; seed: number; region: string; champProb: number };
  bracket: GeneratedBracket;
  ffTeams: string[];
  upsetCount: number;
  upsetDetails: string[];
}

interface SimResult {
  regionBrackets: Record<Region, RegionBracket>;
  semi1: Team; semi2: Team; champion: Team;
  e8Winners: Team[];
  upsetCount: number;
  upsetDetails: string[];
}

// Run a single full Monte Carlo simulation of the entire bracket
function simulateOnce(
  teamsByRegion: Record<Region, Record<number, Team>>,
  allTeams: Team[],
  ensemble: EnsembleModel,
): SimResult {
  const regionBrackets: Record<Region, RegionBracket> = {} as any;
  const e8Winners: Team[] = [];
  let upsetCount = 0;
  const upsetDetails: string[] = [];

  function flip(a: Team, b: Team, round: Round): Team {
    const pred = ensemble.predict(a, b, round);
    const winner = Math.random() < pred.finalProbA ? a : b;
    // Track upsets (higher seed number beating lower seed number)
    if (winner.seed > Math.min(a.seed, b.seed) && winner.seed !== a.seed && winner.seed !== b.seed) {
      // noop — both have different seeds
    }
    const fav = a.seed <= b.seed ? a : b;
    const dog = a.seed <= b.seed ? b : a;
    if (winner === dog && a.seed !== b.seed) {
      upsetCount++;
      upsetDetails.push(`${round}: ${dog.seed}-${dog.name} over ${fav.seed}-${fav.name}`);
    }
    return winner;
  }

  for (const region of REGIONS) {
    const teamBySeed = teamsByRegion[region];
    const rTeams = allTeams.filter((t) => t.region === region);

    const r64Winners: Team[] = [];
    for (const [high, low] of R64_SEED_MATCHUPS) {
      const a = teamBySeed[high];
      const b = teamBySeed[low];
      if (!a || !b) { r64Winners.push(a || b); continue; }
      r64Winners.push(flip(a, b, "R64"));
    }

    const r32Winners: Team[] = [];
    for (let i = 0; i < r64Winners.length; i += 2) {
      r32Winners.push(flip(r64Winners[i], r64Winners[i + 1], "R32"));
    }

    const s16Winners: Team[] = [];
    for (let i = 0; i < r32Winners.length; i += 2) {
      s16Winners.push(flip(r32Winners[i], r32Winners[i + 1], "S16"));
    }

    const e8Winner = flip(s16Winners[0], s16Winners[1], "E8");
    e8Winners.push(e8Winner);

    regionBrackets[region] = {
      region, teams: rTeams,
      picks: {
        r64: r64Winners.map((t) => t.name),
        r32: r32Winners.map((t) => t.name),
        s16: s16Winners.map((t) => t.name),
        e8: [e8Winner.name],
      },
    };
  }

  // FF: East vs West, South vs Midwest
  const semi1 = flip(e8Winners[0], e8Winners[1], "F4");
  const semi2 = flip(e8Winners[2], e8Winners[3], "F4");
  const champion = flip(semi1, semi2, "Championship");

  return { regionBrackets, semi1, semi2, champion, e8Winners, upsetCount, upsetDetails };
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
  console.log(`  Top ${numChampions}: ${topChamps.map((c) => `${c.team} (${(c.prob * 100).toFixed(1)}%)`).join(", ")}`);

  const allTeams = teams.filter((t) => t.seed > 0);
  const teamMap = new Map(allTeams.map((t) => [t.name, t]));

  // Build region lookup
  const teamsByRegion: Record<Region, Record<number, Team>> = {} as any;
  for (const region of REGIONS) {
    teamsByRegion[region] = {};
    for (const t of allTeams) {
      if (t.region === region) teamsByRegion[region][t.seed] = t;
    }
  }

  const results: ChampionBracket[] = [];
  const MAX_ATTEMPTS = 50000; // safety limit

  for (const champ of topChamps) {
    console.log(`  Sampling bracket for ${champ.team} champion...`);

    // Keep simulating until this team wins
    let bestSim: SimResult | null = null;
    let attempts = 0;

    while (!bestSim && attempts < MAX_ATTEMPTS) {
      attempts++;
      const sim = simulateOnce(teamsByRegion, allTeams, ensemble);
      if (sim.champion.name === champ.team) {
        bestSim = sim;
      }
    }

    if (!bestSim) {
      console.log(`    Could not find ${champ.team} winning in ${MAX_ATTEMPTS} sims — skipping`);
      continue;
    }

    console.log(`    Found in ${attempts} attempts (${bestSim.upsetCount} upsets)`);

    const bracket: Bracket = {
      year: 2026,
      regions: bestSim.regionBrackets,
      finalFour: {
        semi1: { team1Region: "East", team2Region: "West", winner: bestSim.semi1.name },
        semi2: { team1Region: "South", team2Region: "Midwest", winner: bestSim.semi2.name },
      },
      champion: bestSim.champion.name,
    };

    const ffTeams = [
      bestSim.e8Winners[0].name, bestSim.e8Winners[1].name,
      bestSim.e8Winners[2].name, bestSim.e8Winners[3].name,
    ];

    results.push({
      champion: { name: champ.team, seed: champ.seed, region: teamMap.get(champ.team)?.region || "", champProb: champ.prob },
      bracket: { mode: "balanced", bracket, analysis: null as never, upsetCount: bestSim.upsetCount },
      ffTeams,
      upsetCount: bestSim.upsetCount,
      upsetDetails: bestSim.upsetDetails,
    });
  }

  return results;
}

export function formatChampionBrackets(brackets: ChampionBracket[]): string {
  const lines: string[] = [];

  lines.push("=".repeat(75));
  lines.push("  MONTE CARLO SAMPLED BRACKETS — Each a realistic simulated tournament");
  lines.push(`  ${brackets.length} brackets, each with a different champion`);
  lines.push("=".repeat(75));

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const { bracket } = b.bracket;

    lines.push(`\n${"~".repeat(75)}`);
    lines.push(`  BRACKET ${i + 1}: ${b.champion.name} wins it all`);
    lines.push(`  ${b.champion.seed}-seed (${b.champion.region}) | ${(b.champion.champProb * 100).toFixed(1)}% MC prob | ${b.upsetCount} upsets`);
    lines.push(`  Final Four: ${b.ffTeams.join(" | ")}`);
    lines.push(`${"~".repeat(75)}`);

    for (const region of REGIONS) {
      const rb = bracket.regions[region];
      lines.push(`  ${region}`);
      lines.push(`    R64: ${rb.picks.r64.join(", ")}`);
      lines.push(`    R32: ${rb.picks.r32.join(", ")}`);
      lines.push(`    S16: ${rb.picks.s16.join(", ")}`);
      lines.push(`    E8:  ${rb.picks.e8[0]}`);
    }

    lines.push(`  Championship: ${bracket.finalFour.semi1.winner} vs ${bracket.finalFour.semi2.winner}`);
    lines.push(`  CHAMPION: ${bracket.champion}`);

    if (b.upsetDetails.length > 0) {
      lines.push(`  Upsets:`);
      for (const u of b.upsetDetails.slice(0, 12)) {
        lines.push(`    ${u}`);
      }
      if (b.upsetDetails.length > 12) {
        lines.push(`    ... and ${b.upsetDetails.length - 12} more`);
      }
    }
  }

  // Summary
  lines.push(`\n${"=".repeat(75)}`);
  lines.push("  COVERAGE SUMMARY");
  lines.push("=".repeat(75));

  lines.push("\n  #   Champion              Seed  Region    MC Prob  Upsets  Final Four");
  lines.push("  " + "-".repeat(72));

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    lines.push(
      `  ${(i + 1).toString().padStart(2)}  ${b.champion.name.padEnd(22)} ${b.champion.seed.toString().padStart(2)}    ${b.champion.region.padEnd(10)} ${(b.champion.champProb * 100).toFixed(1).padStart(5)}%  ${b.upsetCount.toString().padStart(5)}   ${b.ffTeams.join(", ")}`
    );
  }

  // Diversity analysis
  const allE8 = new Set<string>();
  const allFF = new Set<string>();
  const allUpsets = new Set<string>();
  let totalUpsets = 0;

  for (const b of brackets) {
    for (const ff of b.ffTeams) allFF.add(ff);
    for (const region of REGIONS) {
      allE8.add(b.bracket.bracket.regions[region].picks.e8[0]);
    }
    for (const u of b.upsetDetails) allUpsets.add(u);
    totalUpsets += b.upsetCount;
  }

  const totalCoverage = brackets.reduce((s, b) => s + b.champion.champProb, 0);
  lines.push(`\n  Champion coverage: ${(totalCoverage * 100).toFixed(1)}%`);
  lines.push(`  Unique E8 teams: ${allE8.size} (across ${brackets.length} brackets)`);
  lines.push(`  Unique FF teams: ${allFF.size}`);
  lines.push(`  Unique upsets: ${allUpsets.size}`);
  lines.push(`  Avg upsets/bracket: ${(totalUpsets / brackets.length).toFixed(1)}`);

  return lines.join("\n");
}
