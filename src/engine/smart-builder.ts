// Smart Bracket Builder — picks upsets based on Expected Value, not chalk or randomness
// Uses Monte Carlo advancement probabilities to make mathematically optimal picks
// Each upset is justified: "picking X over Y because EV is higher"

import { Team, Region, Round, Bracket, RegionBracket, GeneratedBracket, ROUNDS_IN_ORDER } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { monteCarloSimulate, AdvancementProbs } from "./monte-carlo.js";
import { ESPN_POINTS } from "../backtest/backtest-types.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];
const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

type PoolSize = "safe" | "balanced" | "contrarian";

interface PickDecision {
  round: Round;
  region: string;
  picked: string;
  pickedSeed: number;
  over: string;
  overSeed: number;
  isUpset: boolean;
  winProb: number;
  evPicked: number;
  evOther: number;
  reason: string;
}

export interface SmartBracket {
  bracket: GeneratedBracket;
  picks: PickDecision[];
  expectedEspnScore: number;
  upsetCount: number;
  keyDecisions: string[];
}

// Calculate future expected value: how many ESPN points will this team earn
// in LATER rounds if we pick them here?
function futureEV(
  teamName: string,
  currentRound: Round,
  adv: Map<string, AdvancementProbs>,
): number {
  const probs = adv.get(teamName);
  if (!probs) return 0;

  let ev = 0;
  const roundIdx = ROUNDS_IN_ORDER.indexOf(currentRound);

  // Add EV for each future round this team might reach
  const roundProbs: [Round, number][] = [
    ["R32", probs.r32], ["S16", probs.s16], ["E8", probs.e8],
    ["F4", probs.f4], ["Championship", probs.champ],
  ];

  for (const [round, prob] of roundProbs) {
    const rIdx = ROUNDS_IN_ORDER.indexOf(round);
    if (rIdx > roundIdx) {
      ev += prob * ESPN_POINTS[round];
    }
  }

  return ev;
}

export function buildSmartBracket(
  teams: Team[],
  ensemble: EnsembleModel,
  opts: { pool?: PoolSize; champion?: string; sims?: number } = {},
): SmartBracket {
  const poolSize = opts.pool || "balanced";
  const numSims = opts.sims || 10000;
  const forceChampion = opts.champion;

  // Step 1: Run Monte Carlo to get advancement probabilities
  const mc = monteCarloSimulate(teams, ensemble, numSims);
  const adv = mc.advancement;

  // Upset aggressiveness based on pool size
  // Higher = more willing to pick upsets
  const upsetBoost: Record<PoolSize, number> = {
    safe: 0.0,        // pure EV maximization
    balanced: 0.15,   // slight boost to underdogs
    contrarian: 0.35, // aggressive upset hunting
  };
  const boost = upsetBoost[poolSize];

  const allTeams = teams.filter((t) => t.seed > 0 && t.kenpom);
  const teamMap = new Map(allTeams.map((t) => [t.name, t]));

  // Build region map dynamically (historical tournaments may use non-standard names)
  const teamsByRegion: Record<string, Record<number, Team>> = {};
  for (const t of allTeams) {
    if (!teamsByRegion[t.region]) teamsByRegion[t.region] = {};
    teamsByRegion[t.region][t.seed] = t;
  }
  const activeRegions = Object.keys(teamsByRegion) as Region[];

  const picks: PickDecision[] = [];
  let expectedScore = 0;
  let upsetCount = 0;

  // Step 2: Build bracket bottom-up using EV at each slot
  const regionBrackets: Record<Region, RegionBracket> = {} as any;

  for (const region of activeRegions) {
    const tbs = teamsByRegion[region];

    // R64
    const r64Winners: Team[] = [];
    for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
      const [high, low] = R64_SEED_MATCHUPS[i];
      const a = tbs[high];
      const b = tbs[low];
      if (!a || !b) { r64Winners.push(a || b); continue; }

      const pick = evPick(a, b, "R64", region, adv, ensemble, boost, forceChampion);
      r64Winners.push(pick.winner);
      picks.push(pick.decision);
      expectedScore += pick.decision.evPicked;
      if (pick.decision.isUpset) upsetCount++;
    }

    // R32
    const r32Winners: Team[] = [];
    for (let i = 0; i < 4; i++) {
      const a = r64Winners[i * 2];
      const b = r64Winners[i * 2 + 1];
      const pick = evPick(a, b, "R32", region, adv, ensemble, boost, forceChampion);
      r32Winners.push(pick.winner);
      picks.push(pick.decision);
      expectedScore += pick.decision.evPicked;
      if (pick.decision.isUpset) upsetCount++;
    }

    // S16
    const s16Winners: Team[] = [];
    for (let i = 0; i < 2; i++) {
      const a = r32Winners[i * 2];
      const b = r32Winners[i * 2 + 1];
      const pick = evPick(a, b, "S16", region, adv, ensemble, boost, forceChampion);
      s16Winners.push(pick.winner);
      picks.push(pick.decision);
      expectedScore += pick.decision.evPicked;
      if (pick.decision.isUpset) upsetCount++;
    }

    // E8
    const e8Pick = evPick(s16Winners[0], s16Winners[1], "E8", region, adv, ensemble, boost, forceChampion);
    picks.push(e8Pick.decision);
    expectedScore += e8Pick.decision.evPicked;
    if (e8Pick.decision.isUpset) upsetCount++;

    regionBrackets[region] = {
      region, teams: allTeams.filter((t) => t.region === region),
      picks: {
        r64: r64Winners.map((t) => t.name),
        r32: r32Winners.map((t) => t.name),
        s16: s16Winners.map((t) => t.name),
        e8: [e8Pick.winner.name],
      },
    };
  }

  // Final Four
  const e8Winners = activeRegions.map((r) => teamMap.get(regionBrackets[r].picks.e8[0])!).filter(Boolean);

  if (e8Winners.length < 4) {
    // Not enough regions — return what we have
    return {
      bracket: { mode: "balanced", bracket: {} as any, analysis: null as never, upsetCount },
      picks, expectedEspnScore: expectedScore, upsetCount, keyDecisions: [],
    };
  }

  const semi1 = evPick(e8Winners[0], e8Winners[1], "F4", "FF", adv, ensemble, boost, forceChampion);
  picks.push(semi1.decision);
  expectedScore += semi1.decision.evPicked;
  if (semi1.decision.isUpset) upsetCount++;

  const semi2 = evPick(e8Winners[2], e8Winners[3], "F4", "FF", adv, ensemble, boost, forceChampion);
  picks.push(semi2.decision);
  expectedScore += semi2.decision.evPicked;
  if (semi2.decision.isUpset) upsetCount++;

  const champPick = evPick(semi1.winner, semi2.winner, "Championship", "Final", adv, ensemble, boost, forceChampion);
  picks.push(champPick.decision);
  expectedScore += champPick.decision.evPicked;
  if (champPick.decision.isUpset) upsetCount++;

  const bracket: Bracket = {
    year: 2026,
    regions: regionBrackets,
    finalFour: {
      semi1: { team1Region: "East", team2Region: "West", winner: semi1.winner.name },
      semi2: { team1Region: "South", team2Region: "Midwest", winner: semi2.winner.name },
    },
    champion: champPick.winner.name,
  };

  // Find the 5 closest EV decisions (most interesting upset calls)
  const closeCalls = [...picks]
    .filter((p) => p.evPicked > 0 && p.evOther > 0)
    .sort((a, b) => Math.abs(a.evPicked - a.evOther) - Math.abs(b.evPicked - b.evOther))
    .slice(0, 5)
    .map((p) => `${p.round} ${p.region}: ${p.picked}(${p.pickedSeed}) over ${p.over}(${p.overSeed}) — EV ${p.evPicked.toFixed(1)} vs ${p.evOther.toFixed(1)} (${p.reason})`);

  return {
    bracket: { mode: "balanced", bracket, analysis: null as never, upsetCount },
    picks, expectedEspnScore: expectedScore, upsetCount,
    keyDecisions: closeCalls,
  };
}

function evPick(
  a: Team, b: Team, round: Round, region: string,
  adv: Map<string, AdvancementProbs>, ensemble: EnsembleModel,
  upsetBoost: number, forceChampion?: string,
): { winner: Team; decision: PickDecision } {
  // If forcing a champion, always pick them
  if (forceChampion) {
    if (a.name === forceChampion) return makeDecision(a, b, round, region, 1.0, adv, "forced champion");
    if (b.name === forceChampion) return makeDecision(b, a, round, region, 1.0, adv, "forced champion");
  }

  const pred = ensemble.predict(a, b, round);
  const probA = pred.finalProbA;
  const probB = 1 - probA;

  const pointsThisRound = ESPN_POINTS[round];
  const futureA = futureEV(a.name, round, adv);
  const futureB = futureEV(b.name, round, adv);

  // EV = probability of being correct × points this round + future round value
  let evA = probA * pointsThisRound + futureA;
  let evB = probB * pointsThisRound + futureB;

  // Apply upset boost to the underdog
  const favorite = a.seed <= b.seed ? a : b;
  const underdog = a.seed <= b.seed ? b : a;

  if (upsetBoost > 0 && a.seed !== b.seed) {
    if (underdog === a) evA *= (1 + upsetBoost);
    else evB *= (1 + upsetBoost);
  }

  if (evA >= evB) {
    const isUpset = a.seed > b.seed;
    const reason = isUpset
      ? `upset EV ${evA.toFixed(1)} > chalk ${evB.toFixed(1)} (${(probA * 100).toFixed(0)}% win + future ${futureA.toFixed(0)})`
      : `chalk EV ${evA.toFixed(1)} > upset ${evB.toFixed(1)}`;
    return makeDecision(a, b, round, region, probA, adv, reason);
  } else {
    const isUpset = b.seed > a.seed;
    const reason = isUpset
      ? `upset EV ${evB.toFixed(1)} > chalk ${evA.toFixed(1)} (${(probB * 100).toFixed(0)}% win + future ${futureB.toFixed(0)})`
      : `chalk EV ${evB.toFixed(1)} > upset ${evA.toFixed(1)}`;
    return makeDecision(b, a, round, region, probB, adv, reason);
  }
}

function makeDecision(
  picked: Team, over: Team, round: Round, region: string,
  winProb: number, adv: Map<string, AdvancementProbs>, reason: string,
): { winner: Team; decision: PickDecision } {
  const pointsThisRound = ESPN_POINTS[round];
  return {
    winner: picked,
    decision: {
      round, region, picked: picked.name, pickedSeed: picked.seed,
      over: over.name, overSeed: over.seed,
      isUpset: picked.seed > over.seed,
      winProb: winProb,
      evPicked: winProb * pointsThisRound + futureEV(picked.name, round, adv),
      evOther: (1 - winProb) * pointsThisRound + futureEV(over.name, round, adv),
      reason,
    },
  };
}

export function formatSmartBracket(sb: SmartBracket): string {
  const lines: string[] = [];
  const { bracket } = sb.bracket;

  lines.push("=".repeat(75));
  lines.push("  SMART BRACKET — Expected Value Optimized");
  lines.push(`  ${sb.upsetCount} upsets | Expected ESPN Score: ${sb.expectedEspnScore.toFixed(0)}`);
  lines.push("=".repeat(75));

  // Full bracket
  for (const region of REGIONS) {
    const rb = bracket.regions[region];
    lines.push(`\n  ${region}`);
    lines.push(`    R64: ${rb.picks.r64.join(", ")}`);
    lines.push(`    R32: ${rb.picks.r32.join(", ")}`);
    lines.push(`    S16: ${rb.picks.s16.join(", ")}`);
    lines.push(`    E8:  ${rb.picks.e8[0]}`);
  }
  lines.push(`\n  FF: ${bracket.finalFour.semi1.winner} vs ${bracket.finalFour.semi2.winner}`);
  lines.push(`  CHAMPION: ${bracket.champion}`);

  // Upsets with EV justification
  const upsets = sb.picks.filter((p) => p.isUpset);
  if (upsets.length > 0) {
    lines.push(`\n${"─".repeat(75)}`);
    lines.push(`  UPSET PICKS (${upsets.length} total) — each justified by Expected Value`);
    lines.push("─".repeat(75));
    lines.push("  Round  Region    Pick                   Over                   Win%  EV Diff  Why");
    lines.push("  " + "-".repeat(72));

    for (const u of upsets.sort((a, b) => ROUNDS_IN_ORDER.indexOf(b.round) - ROUNDS_IN_ORDER.indexOf(a.round))) {
      const evDiff = u.evPicked - u.evOther;
      lines.push(
        `  ${u.round.padEnd(5)}  ${u.region.padEnd(10)} ${u.pickedSeed}-${u.picked.padEnd(20)} ${u.overSeed}-${u.over.padEnd(20)} ${(u.winProb * 100).toFixed(0).padStart(3)}%  ${evDiff > 0 ? "+" : ""}${evDiff.toFixed(1).padStart(5)}  ${u.reason.slice(0, 50)}`
      );
    }
  }

  // Key decisions
  if (sb.keyDecisions.length > 0) {
    lines.push(`\n${"─".repeat(75)}`);
    lines.push("  CLOSEST CALLS — these could go either way");
    lines.push("─".repeat(75));
    for (const d of sb.keyDecisions) {
      lines.push(`  ${d}`);
    }
  }

  return lines.join("\n");
}
