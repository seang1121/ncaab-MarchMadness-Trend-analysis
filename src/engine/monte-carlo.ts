// Monte Carlo bracket simulation — runs thousands of sims with randomness
// proportional to win probability, producing probability distributions

import { Team, Region, Round, Bracket, RegionBracket, ROUNDS_IN_ORDER } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];
const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export interface MonteCarloResult {
  numSims: number;
  champProbs: Array<{ team: string; seed: number; prob: number }>;
  ffProbs: Array<{ team: string; seed: number; prob: number }>;
  e8Probs: Array<{ team: string; seed: number; region: string; prob: number }>;
  modeBracket: {
    regions: Record<string, { r64: string[]; r32: string[]; s16: string[]; e8: string }>;
    semi1: string;
    semi2: string;
    champion: string;
  };
}

export function monteCarloSimulate(
  teams: Team[],
  ensemble: EnsembleModel,
  numSims: number = 5000,
): MonteCarloResult {
  const regionTeams: Record<Region, Team[]> = { East: [], West: [], South: [], Midwest: [] };
  for (const t of teams) {
    if (t.seed > 0 && t.region) regionTeams[t.region].push(t);
  }

  // Track advancement counts
  const champCounts: Record<string, number> = {};
  const ffCounts: Record<string, number> = {};
  const e8Counts: Record<string, number> = {};

  // Track mode bracket (most common winner at each slot)
  const slotCounts: Record<string, Record<string, number>> = {};

  function trackSlot(slotKey: string, winner: string): void {
    if (!slotCounts[slotKey]) slotCounts[slotKey] = {};
    slotCounts[slotKey][winner] = (slotCounts[slotKey][winner] || 0) + 1;
  }

  function pickRandom(teamA: Team, teamB: Team, round: Round): Team {
    const pred = ensemble.predict(teamA, teamB, round);
    return Math.random() < pred.finalProbA ? teamA : teamB;
  }

  for (let sim = 0; sim < numSims; sim++) {
    const e8Winners: Team[] = [];

    for (const region of REGIONS) {
      const rTeams = regionTeams[region];
      const teamBySeed: Record<number, Team> = {};
      for (const t of rTeams) teamBySeed[t.seed] = t;

      // R64
      const r64Winners: Team[] = [];
      for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
        const [high, low] = R64_SEED_MATCHUPS[i];
        const a = teamBySeed[high];
        const b = teamBySeed[low];
        if (!a || !b) { r64Winners.push(a || b); continue; }
        const winner = pickRandom(a, b, "R64");
        r64Winners.push(winner);
        trackSlot(`${region}-R64-${i}`, winner.name);
      }

      // R32
      const r32Winners: Team[] = [];
      for (let i = 0; i < 4; i++) {
        const winner = pickRandom(r64Winners[i * 2], r64Winners[i * 2 + 1], "R32");
        r32Winners.push(winner);
        trackSlot(`${region}-R32-${i}`, winner.name);
      }

      // S16
      const s16Winners: Team[] = [];
      for (let i = 0; i < 2; i++) {
        const winner = pickRandom(r32Winners[i * 2], r32Winners[i * 2 + 1], "S16");
        s16Winners.push(winner);
        trackSlot(`${region}-S16-${i}`, winner.name);
      }

      // E8
      const e8Winner = pickRandom(s16Winners[0], s16Winners[1], "E8");
      trackSlot(`${region}-E8`, e8Winner.name);
      e8Winners.push(e8Winner);

      e8Counts[e8Winner.name] = (e8Counts[e8Winner.name] || 0) + 1;
    }

    // Final Four: East vs West, South vs Midwest
    const semi1Winner = pickRandom(e8Winners[0], e8Winners[1], "F4");
    const semi2Winner = pickRandom(e8Winners[2], e8Winners[3], "F4");
    trackSlot("FF-semi1", semi1Winner.name);
    trackSlot("FF-semi2", semi2Winner.name);

    ffCounts[semi1Winner.name] = (ffCounts[semi1Winner.name] || 0) + 1;
    ffCounts[semi2Winner.name] = (ffCounts[semi2Winner.name] || 0) + 1;

    const champion = pickRandom(semi1Winner, semi2Winner, "Championship");
    trackSlot("Championship", champion.name);
    champCounts[champion.name] = (champCounts[champion.name] || 0) + 1;
  }

  // Build mode bracket (most common winner at each slot)
  function modeWinner(slotKey: string): string {
    const counts = slotCounts[slotKey] || {};
    let best = "", bestCount = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > bestCount) { best = name; bestCount = count; }
    }
    return best;
  }

  const modeBracket: MonteCarloResult["modeBracket"] = {
    regions: {},
    semi1: modeWinner("FF-semi1"),
    semi2: modeWinner("FF-semi2"),
    champion: modeWinner("Championship"),
  };

  for (const region of REGIONS) {
    modeBracket.regions[region] = {
      r64: Array.from({ length: 8 }, (_, i) => modeWinner(`${region}-R64-${i}`)),
      r32: Array.from({ length: 4 }, (_, i) => modeWinner(`${region}-R32-${i}`)),
      s16: Array.from({ length: 2 }, (_, i) => modeWinner(`${region}-S16-${i}`)),
      e8: modeWinner(`${region}-E8`),
    };
  }

  // Build sorted probability lists
  const allTeams = teams.filter((t) => t.seed > 0);
  const teamMap = new Map(allTeams.map((t) => [t.name, t]));

  const champProbs = Object.entries(champCounts)
    .map(([name, count]) => ({ team: name, seed: teamMap.get(name)?.seed ?? 0, prob: count / numSims }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 15);

  const ffProbs = Object.entries(ffCounts)
    .map(([name, count]) => ({ team: name, seed: teamMap.get(name)?.seed ?? 0, prob: count / numSims }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 20);

  const e8Probs = Object.entries(e8Counts)
    .map(([name, count]) => ({
      team: name, seed: teamMap.get(name)?.seed ?? 0,
      region: teamMap.get(name)?.region ?? "", prob: count / numSims,
    }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 25);

  return { numSims, champProbs, ffProbs, e8Probs, modeBracket };
}

export function formatMonteCarloResult(result: MonteCarloResult): string {
  const lines: string[] = [];

  lines.push("=".repeat(70));
  lines.push(`  MONTE CARLO SIMULATION (${result.numSims.toLocaleString()} brackets)`);
  lines.push("=".repeat(70));

  lines.push("\n--- CHAMPIONSHIP PROBABILITIES ---");
  for (const { team, seed, prob } of result.champProbs) {
    const bar = "#".repeat(Math.round(prob * 100));
    lines.push(`  ${seed}-seed ${team.padEnd(28)} ${(prob * 100).toFixed(1)}% ${bar}`);
  }

  lines.push("\n--- FINAL FOUR PROBABILITIES (top 15) ---");
  for (const { team, seed, prob } of result.ffProbs.slice(0, 15)) {
    lines.push(`  ${seed}-seed ${team.padEnd(28)} ${(prob * 100).toFixed(1)}%`);
  }

  lines.push("\n--- ELITE EIGHT PROBABILITIES (top 16) ---");
  for (const { team, seed, region, prob } of result.e8Probs.slice(0, 16)) {
    lines.push(`  ${region.padEnd(8)} ${seed}-seed ${team.padEnd(28)} ${(prob * 100).toFixed(1)}%`);
  }

  lines.push("\n--- MODE BRACKET (most likely outcome at each slot) ---");
  for (const region of REGIONS) {
    const r = result.modeBracket.regions[region];
    if (!r) continue;
    lines.push(`  ${region.padEnd(8)} R64: ${r.r64.join(", ")}`);
    lines.push(`           R32: ${r.r32.join(", ")}`);
    lines.push(`           S16: ${r.s16.join(", ")}  |  E8: ${r.e8}`);
  }
  lines.push(`  FF: ${result.modeBracket.semi1} vs ${result.modeBracket.semi2}`);
  lines.push(`  CHAMPION: ${result.modeBracket.champion}`);

  return lines.join("\n");
}
