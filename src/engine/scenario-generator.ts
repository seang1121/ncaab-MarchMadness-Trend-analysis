// Scenario-based bracket generation: tiered coverage of different outcomes
// Generates brackets at 3 tiers: Champion (3), Final Four (4), Elite 8 (8)
// Each bracket is fully filled (63 picks) with key outcomes locked in

import { Team, Region, Round, RegionBracket, Bracket, GeneratedBracket, ROUNDS_IN_ORDER } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { EnsemblePrediction } from "../models/index.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

interface RegionCandidate {
  team: Team;
  probability: number;
  path: string[]; // teams beaten to get there
}

interface ScenarioBracket {
  tier: "champion" | "final-four" | "elite-eight";
  label: string;
  description: string;
  bracket: GeneratedBracket;
  probability: number;
  keyPicks: string[];
}

export interface ScenarioOutput {
  championTier: ScenarioBracket[];
  finalFourTier: ScenarioBracket[];
  eliteEightTier: ScenarioBracket[];
}

// Identify top E8 candidates per region by scoring each team's viability
// Uses head-to-head win probability chain rather than exponential branching
function simulateRegionPaths(
  teams: Team[],
  region: Region,
  ensemble: EnsembleModel,
  topN: number = 3,
): RegionCandidate[] {
  const regionTeams = teams.filter((t) => t.region === region && t.seed > 0);
  const teamBySeed: Record<number, Team> = {};
  for (const t of regionTeams) teamBySeed[t.seed] = t;

  // Score every team in the region as a potential E8 winner
  // Probability = product of win probs along their bracket path
  const candidates: RegionCandidate[] = [];

  // Bracket half structure: seeds that meet in each quarter
  // Top quarter: 1,16,8,9 → winner meets 5,12,4,13 winner
  // Bottom quarter: 6,11,3,14 → winner meets 7,10,2,15 winner
  const topQ1Seeds = [1, 16, 8, 9];
  const topQ2Seeds = [5, 12, 4, 13];
  const botQ1Seeds = [6, 11, 3, 14];
  const botQ2Seeds = [7, 10, 2, 15];

  // Get plausible contenders from each quarter (top 2 seeds present)
  function getQuarterContenders(seeds: number[]): Team[] {
    return seeds
      .filter((s) => teamBySeed[s])
      .map((s) => teamBySeed[s])
      .sort((a, b) => a.kenpom.rank - b.kenpom.rank)
      .slice(0, 3); // top 3 by KenPom from each quarter
  }

  const topQ1Teams = getQuarterContenders(topQ1Seeds);
  const topQ2Teams = getQuarterContenders(topQ2Seeds);
  const botQ1Teams = getQuarterContenders(botQ1Seeds);
  const botQ2Teams = getQuarterContenders(botQ2Seeds);

  // For each possible S16 matchup (top half vs top half, bottom half vs bottom half)
  // then E8 matchup, calculate path probability
  for (const topHalf of [...topQ1Teams, ...topQ2Teams]) {
    for (const botHalf of [...botQ1Teams, ...botQ2Teams]) {
      // Simulate this team's path probability
      const topProb = estimatePathProb(topHalf, teamBySeed, ensemble, "top");
      const botProb = estimatePathProb(botHalf, teamBySeed, ensemble, "bottom");

      // E8: top half winner vs bottom half winner
      const e8Pred = ensemble.predict(topHalf, botHalf, "E8");
      const topWinsE8 = e8Pred.finalProbA >= 0.5 ? topHalf === e8Pred.teamA : topHalf === e8Pred.teamB;

      if (topWinsE8) {
        const prob = topProb * Math.max(e8Pred.finalProbA, e8Pred.finalProbB);
        addCandidate(candidates, topHalf, prob);
      } else {
        const prob = botProb * Math.max(e8Pred.finalProbA, e8Pred.finalProbB);
        addCandidate(candidates, botHalf, prob);
      }

      // Also add the loser as a candidate with lower probability
      if (topWinsE8) {
        const prob = botProb * Math.min(e8Pred.finalProbA, e8Pred.finalProbB);
        addCandidate(candidates, botHalf, prob);
      } else {
        const prob = topProb * Math.min(e8Pred.finalProbA, e8Pred.finalProbB);
        addCandidate(candidates, topHalf, prob);
      }
    }
  }

  // Deduplicate and normalize
  const merged = new Map<string, RegionCandidate>();
  for (const c of candidates) {
    const existing = merged.get(c.team.name);
    if (existing) {
      existing.probability = Math.max(existing.probability, c.probability);
    } else {
      merged.set(c.team.name, c);
    }
  }

  const result = [...merged.values()]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topN);

  // Normalize probabilities to sum to ~1
  const totalProb = result.reduce((s, c) => s + c.probability, 0);
  if (totalProb > 0) {
    for (const c of result) c.probability /= totalProb;
  }

  return result;
}

function addCandidate(candidates: RegionCandidate[], team: Team, prob: number): void {
  candidates.push({ team, probability: prob, path: [team.name] });
}

// Estimate probability a team reaches the S16 from their bracket half
function estimatePathProb(
  team: Team,
  teamBySeed: Record<number, Team>,
  ensemble: EnsembleModel,
  half: "top" | "bottom",
): number {
  // Simplified: estimate based on KenPom rank relative to region
  // Better teams have higher path probability
  const allTeams = Object.values(teamBySeed);
  const halfTeams = half === "top"
    ? allTeams.filter((t) => [1, 16, 8, 9, 5, 12, 4, 13].includes(t.seed))
    : allTeams.filter((t) => [6, 11, 3, 14, 7, 10, 2, 15].includes(t.seed));

  // Rank this team among its half
  const sorted = halfTeams.sort((a, b) => a.kenpom.rank - b.kenpom.rank);
  const rank = sorted.findIndex((t) => t.name === team.name);

  if (rank === -1) return 0.05;

  // Top team ~60%, 2nd ~25%, 3rd ~10%, rest ~5%
  const probs = [0.55, 0.25, 0.12, 0.05, 0.02, 0.005, 0.003, 0.002];
  return probs[Math.min(rank, probs.length - 1)];
}

// Generate a bracket with a specific team locked as the region winner
function generateBracketWithLocks(
  teams: Team[],
  ensemble: EnsembleModel,
  regionLocks: Partial<Record<Region, Team>>,
  ffLocks?: { semi1?: Team; semi2?: Team; champion?: Team },
): GeneratedBracket {
  const regionTeams: Record<Region, Team[]> = { East: [], West: [], South: [], Midwest: [] };
  for (const t of teams) if (t.seed > 0 && t.region) regionTeams[t.region].push(t);

  const regionBrackets: Record<Region, RegionBracket> = {} as Record<Region, RegionBracket>;

  for (const region of REGIONS) {
    const lock = regionLocks[region];
    regionBrackets[region] = simulateRegionWithLock(regionTeams[region], region, ensemble, lock);
  }

  // Final Four
  const e8Winners = REGIONS.map((r) => {
    const e8Pick = regionBrackets[r].picks.e8[0];
    return regionTeams[r].find((t) => t.name === e8Pick)!;
  });

  // Semi 1: East vs West
  let semi1: Team;
  if (ffLocks?.semi1) {
    semi1 = ffLocks.semi1;
  } else {
    const pred = ensemble.predict(e8Winners[0], e8Winners[1], "F4");
    semi1 = pred.predictedWinner;
  }

  // Semi 2: South vs Midwest
  let semi2: Team;
  if (ffLocks?.semi2) {
    semi2 = ffLocks.semi2;
  } else {
    const pred = ensemble.predict(e8Winners[2], e8Winners[3], "F4");
    semi2 = pred.predictedWinner;
  }

  // Championship
  let champion: Team;
  if (ffLocks?.champion) {
    champion = ffLocks.champion;
  } else {
    const pred = ensemble.predict(semi1, semi2, "Championship");
    champion = pred.predictedWinner;
  }

  const bracket: Bracket = {
    year: 2026,
    regions: regionBrackets,
    finalFour: {
      semi1: { team1Region: "East", team2Region: "West", winner: semi1.name },
      semi2: { team1Region: "South", team2Region: "Midwest", winner: semi2.name },
    },
    champion: champion.name,
  };

  let upsetCount = 0;
  for (const region of REGIONS) {
    const rb = regionBrackets[region];
    const rTeams = regionTeams[region];
    for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
      const [highSeed] = R64_SEED_MATCHUPS[i];
      const winner = rTeams.find((t) => t.name === rb.picks.r64[i]);
      if (winner && winner.seed > highSeed) upsetCount++;
    }
  }

  return { mode: "balanced", bracket, analysis: null as never, upsetCount };
}

function simulateRegionWithLock(
  teams: Team[],
  region: Region,
  ensemble: EnsembleModel,
  lockWinner?: Team,
): RegionBracket {
  const teamBySeed: Record<number, Team> = {};
  for (const t of teams) teamBySeed[t.seed] = t;

  const pick = (a: Team, b: Team, round: Round): Team => {
    // If one of these teams is the locked winner, pick them
    if (lockWinner) {
      if (a.name === lockWinner.name) return a;
      if (b.name === lockWinner.name) return b;
    }
    const pred = ensemble.predict(a, b, round);
    return pred.predictedWinner;
  };

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

// Main scenario generator
export function generateScenarios(
  teams: Team[],
  ensemble: EnsembleModel,
): ScenarioOutput {
  // Step 1: Find top region candidates per region
  const regionCandidates: Record<Region, RegionCandidate[]> = {} as any;
  for (const region of REGIONS) {
    regionCandidates[region] = simulateRegionPaths(teams, region, ensemble, 3);
  }

  // Step 2: Build E8 scenarios (top 8 combos)
  interface E8Combo {
    regions: Record<Region, Team>;
    probability: number;
    label: string;
  }

  const e8Combos: E8Combo[] = [];
  const regionLists = REGIONS.map((r) => regionCandidates[r]);

  // Generate all combos from top candidates per region
  for (const east of regionLists[0]) {
    for (const west of regionLists[1]) {
      for (const south of regionLists[2]) {
        for (const midwest of regionLists[3]) {
          const combo: E8Combo = {
            regions: {
              East: east.team, West: west.team,
              South: south.team, Midwest: midwest.team,
            },
            probability: east.probability * west.probability *
                         south.probability * midwest.probability,
            label: `${east.team.name}/${west.team.name}/${south.team.name}/${midwest.team.name}`,
          };
          e8Combos.push(combo);
        }
      }
    }
  }

  e8Combos.sort((a, b) => b.probability - a.probability);
  const top8E8 = e8Combos.slice(0, 8);

  // Step 3: Generate E8 tier brackets
  const eliteEightTier: ScenarioBracket[] = top8E8.map((combo, i) => {
    const bracket = generateBracketWithLocks(teams, ensemble, combo.regions);
    const pctStr = (combo.probability * 100).toFixed(1);
    return {
      tier: "elite-eight" as const,
      label: `E8-${i + 1}`,
      description: `${combo.label} (${pctStr}% path probability)`,
      bracket,
      probability: combo.probability,
      keyPicks: REGIONS.map((r) => `${r}: ${combo.regions[r].name} (${combo.regions[r].seed})`),
    };
  });

  // Step 4: FF tier — for each E8 combo, simulate FF to find unique FF outcomes
  const seenFF = new Set<string>();
  const ffScenarios: Array<{
    semi1: Team; semi2: Team; champion: Team;
    e8: Record<Region, Team>; probability: number;
  }> = [];

  for (const combo of top8E8) {
    const e = combo.regions.East;
    const w = combo.regions.West;
    const s = combo.regions.South;
    const mw = combo.regions.Midwest;

    // Simulate both semi possibilities
    const semi1Options = [e, w];
    const semi2Options = [s, mw];

    for (const s1 of semi1Options) {
      for (const s2 of semi2Options) {
        const champPred = ensemble.predict(s1, s2, "Championship");
        const champ = champPred.predictedWinner;
        const ffKey = [s1.name, s2.name].sort().join("+") + "→" + champ.name;

        if (!seenFF.has(ffKey)) {
          seenFF.add(ffKey);

          const semi1Prob = s1 === e
            ? ensemble.predict(e, w, "F4").finalProbA
            : ensemble.predict(e, w, "F4").finalProbB;
          const semi2Prob = s2 === s
            ? ensemble.predict(s, mw, "F4").finalProbA
            : ensemble.predict(s, mw, "F4").finalProbB;
          const champProb = Math.max(champPred.finalProbA, champPred.finalProbB);

          ffScenarios.push({
            semi1: s1, semi2: s2, champion: champ,
            e8: combo.regions,
            probability: combo.probability * semi1Prob * semi2Prob * champProb,
          });
        }
      }
    }
  }

  ffScenarios.sort((a, b) => b.probability - a.probability);
  const top4FF = ffScenarios.slice(0, 4);

  const finalFourTier: ScenarioBracket[] = top4FF.map((ff, i) => {
    const bracket = generateBracketWithLocks(teams, ensemble, ff.e8, {
      semi1: ff.semi1, semi2: ff.semi2, champion: ff.champion,
    });
    return {
      tier: "final-four" as const,
      label: `FF-${i + 1}`,
      description: `FF: ${ff.semi1.name} vs ${ff.semi2.name} → Champion: ${ff.champion.name}`,
      bracket,
      probability: ff.probability,
      keyPicks: [
        `Semi 1: ${ff.semi1.name} (${ff.semi1.seed})`,
        `Semi 2: ${ff.semi2.name} (${ff.semi2.seed})`,
        `Champion: ${ff.champion.name} (${ff.champion.seed})`,
      ],
    };
  });

  // Step 5: Champion tier — top 3 unique champions
  const seenChamps = new Set<string>();
  const champScenarios: typeof ffScenarios = [];

  for (const ff of ffScenarios) {
    if (!seenChamps.has(ff.champion.name)) {
      seenChamps.add(ff.champion.name);
      champScenarios.push(ff);
    }
  }

  const top3Champs = champScenarios.slice(0, 3);

  const championTier: ScenarioBracket[] = top3Champs.map((ch, i) => {
    const bracket = generateBracketWithLocks(teams, ensemble, ch.e8, {
      semi1: ch.semi1, semi2: ch.semi2, champion: ch.champion,
    });
    return {
      tier: "champion" as const,
      label: `CHAMP-${i + 1}`,
      description: `Champion: ${ch.champion.name} (${ch.champion.seed}-seed)`,
      bracket,
      probability: ch.probability,
      keyPicks: [
        `CHAMPION: ${ch.champion.name} (${ch.champion.seed})`,
        `Path: ${ch.semi1.name} over ${ch.semi1 === ch.e8.East ? ch.e8.West.name : ch.e8.East.name}, ` +
        `${ch.semi2.name} over ${ch.semi2 === ch.e8.South ? ch.e8.Midwest.name : ch.e8.South.name}`,
      ],
    };
  });

  return { championTier, finalFourTier, eliteEightTier };
}

// Format scenario output for CLI
export function formatScenarios(output: ScenarioOutput): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("  TIERED SCENARIO BRACKETS — Maximum Coverage Strategy");
  lines.push("=".repeat(80));

  // Champion tier
  lines.push("\n" + "=".repeat(80));
  lines.push("  TIER 1: CHAMPION VARIATIONS (3 brackets)");
  lines.push("=".repeat(80));

  for (const scenario of output.championTier) {
    lines.push(`\n--- ${scenario.label}: ${scenario.description} ---`);
    for (const pick of scenario.keyPicks) lines.push(`  ${pick}`);
    lines.push(formatBracketCompact(scenario.bracket));
  }

  // Final Four tier
  lines.push("\n" + "=".repeat(80));
  lines.push("  TIER 2: FINAL FOUR VARIATIONS (4 brackets)");
  lines.push("=".repeat(80));

  for (const scenario of output.finalFourTier) {
    lines.push(`\n--- ${scenario.label}: ${scenario.description} ---`);
    for (const pick of scenario.keyPicks) lines.push(`  ${pick}`);
    lines.push(formatBracketCompact(scenario.bracket));
  }

  // Elite 8 tier
  lines.push("\n" + "=".repeat(80));
  lines.push("  TIER 3: ELITE EIGHT VARIATIONS (8 brackets)");
  lines.push("=".repeat(80));

  for (const scenario of output.eliteEightTier) {
    lines.push(`\n--- ${scenario.label}: ${scenario.description} ---`);
    for (const pick of scenario.keyPicks) lines.push(`  ${pick}`);
    lines.push(formatBracketCompact(scenario.bracket));
  }

  // Summary
  lines.push("\n" + "=".repeat(80));
  lines.push("  SCENARIO COVERAGE SUMMARY");
  lines.push("=".repeat(80));

  const allChamps = new Set(output.championTier.map((s) =>
    s.bracket.bracket.champion));
  const allFF = new Set<string>();
  for (const s of output.finalFourTier) {
    const b = s.bracket.bracket;
    allFF.add(b.finalFour.semi1.winner);
    allFF.add(b.finalFour.semi2.winner);
  }
  const allE8 = new Set<string>();
  for (const s of output.eliteEightTier) {
    for (const region of REGIONS) {
      allE8.add(s.bracket.bracket.regions[region].picks.e8[0]);
    }
  }

  lines.push(`\n  Champions covered:  ${[...allChamps].join(", ")} (${allChamps.size} unique)`);
  lines.push(`  FF teams covered:   ${[...allFF].join(", ")} (${allFF.size} unique)`);
  lines.push(`  E8 teams covered:   ${[...allE8].join(", ")} (${allE8.size} unique)`);
  lines.push(`  Total brackets:     ${output.championTier.length + output.finalFourTier.length + output.eliteEightTier.length}`);

  return lines.join("\n");
}

function formatBracketCompact(gen: GeneratedBracket): string {
  const { bracket, upsetCount } = gen;
  const lines: string[] = [];

  for (const region of REGIONS) {
    const rb = bracket.regions[region];
    lines.push(`  ${region.padEnd(8)} R64: ${rb.picks.r64.join(", ")}`);
    lines.push(`           R32: ${rb.picks.r32.join(", ")}`);
    lines.push(`           S16: ${rb.picks.s16.join(", ")}  |  E8: ${rb.picks.e8[0]}`);
  }

  lines.push(`  FF: ${bracket.finalFour.semi1.winner} vs ${bracket.finalFour.semi2.winner} → CHAMPION: ${bracket.champion} (${upsetCount} upsets)`);
  return lines.join("\n");
}
