// Score a generated bracket against actual tournament results
// Compares smart builder vs chalk vs MC mode across all 14 historical years

import { Round, Region, ROUNDS_IN_ORDER } from "../types.js";
import { EnsembleModel } from "../models/ensemble-model.js";
import { getCalibratedWeights } from "../models/betting-insights.js";
import { getAllHistoricalBrackets } from "./historical-brackets-index.js";
import { buildTeamsFromHistorical, fetchHistoricalTeams } from "./historical-fetcher.js";
import { HistoricalTournament, ESPN_POINTS } from "./backtest-types.js";
import { buildSmartBracket } from "../engine/smart-builder.js";
import { monteCarloSimulate } from "../engine/monte-carlo.js";

const REGIONS: string[] = ["East", "West", "South", "Midwest"];
const R64_SEED_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

interface BracketScore {
  year: number;
  method: string;
  espnScore: number;
  correctByRound: Record<string, number>;
  totalByRound: Record<string, number>;
  champion: string;
  actualChampion: string;
  championCorrect: boolean;
  upsetsPicked: number;
  upsetsCorrect: number;
}

// Score a bracket's picks against actual results
function scoreBracket(
  picks: Record<string, Record<string, string[]>>,
  ffPicks: { semi1: string; semi2: string; champion: string },
  tournament: HistoricalTournament,
): { espnScore: number; correctByRound: Record<string, number>; totalByRound: Record<string, number>; championCorrect: boolean } {
  let espnScore = 0;
  const correctByRound: Record<string, number> = {};
  const totalByRound: Record<string, number> = {};

  for (const round of ROUNDS_IN_ORDER) {
    correctByRound[round] = 0;
    totalByRound[round] = 0;
  }

  // Score region picks
  for (const [regionName, regionData] of Object.entries(tournament.regions)) {
    const ourPicks = picks[regionName];
    if (!ourPicks) continue;

    // R64
    for (let i = 0; i < regionData.results.r64.length; i++) {
      totalByRound["R64"]++;
      if (ourPicks.r64?.[i] === regionData.results.r64[i]) {
        correctByRound["R64"]++;
        espnScore += ESPN_POINTS["R64"];
      }
    }

    // R32
    for (let i = 0; i < regionData.results.r32.length; i++) {
      totalByRound["R32"]++;
      if (ourPicks.r32?.[i] === regionData.results.r32[i]) {
        correctByRound["R32"]++;
        espnScore += ESPN_POINTS["R32"];
      }
    }

    // S16
    for (let i = 0; i < regionData.results.s16.length; i++) {
      totalByRound["S16"]++;
      if (ourPicks.s16?.[i] === regionData.results.s16[i]) {
        correctByRound["S16"]++;
        espnScore += ESPN_POINTS["S16"];
      }
    }

    // E8
    totalByRound["E8"]++;
    if (ourPicks.e8?.[0] === regionData.results.e8) {
      correctByRound["E8"]++;
      espnScore += ESPN_POINTS["E8"];
    }
  }

  // FF
  const ro = tournament.regionOrder;
  totalByRound["F4"] += 2;
  if (ffPicks.semi1 === tournament.finalFour.semi1Winner) {
    correctByRound["F4"]++;
    espnScore += ESPN_POINTS["F4"];
  }
  if (ffPicks.semi2 === tournament.finalFour.semi2Winner) {
    correctByRound["F4"]++;
    espnScore += ESPN_POINTS["F4"];
  }

  // Championship
  totalByRound["Championship"]++;
  const championCorrect = ffPicks.champion === tournament.finalFour.champion;
  if (championCorrect) {
    correctByRound["Championship"]++;
    espnScore += ESPN_POINTS["Championship"];
  }

  return { espnScore, correctByRound, totalByRound, championCorrect };
}

// Generate a chalk bracket for a tournament (pick favorite by seed at every slot)
function generateChalkBracket(
  tournament: HistoricalTournament,
  teams: ReturnType<typeof buildTeamsFromHistorical>,
  ensemble: EnsembleModel,
): { picks: Record<string, Record<string, string[]>>; ff: { semi1: string; semi2: string; champion: string } } {
  const picks: Record<string, Record<string, string[]>> = {};
  const teamMap = new Map(teams.map((t) => [t.name, t]));

  const e8Winners: string[] = [];

  for (const [regionName, regionData] of Object.entries(tournament.regions)) {
    const seeds = regionData.seeds;
    const r64: string[] = [];

    for (const [high, low] of R64_SEED_MATCHUPS) {
      const a = teamMap.get(seeds[high]);
      const b = teamMap.get(seeds[low]);
      if (!a || !b) { r64.push(seeds[high] || seeds[low]); continue; }
      const pred = ensemble.predict(a, b, "R64" as Round);
      r64.push(pred.predictedWinner.name);
    }

    const r32: string[] = [];
    for (let i = 0; i < 4; i++) {
      const a = teamMap.get(r64[i * 2]);
      const b = teamMap.get(r64[i * 2 + 1]);
      if (!a || !b) { r32.push(r64[i * 2]); continue; }
      r32.push(ensemble.predict(a, b, "R32" as Round).predictedWinner.name);
    }

    const s16: string[] = [];
    for (let i = 0; i < 2; i++) {
      const a = teamMap.get(r32[i * 2]);
      const b = teamMap.get(r32[i * 2 + 1]);
      if (!a || !b) { s16.push(r32[i * 2]); continue; }
      s16.push(ensemble.predict(a, b, "S16" as Round).predictedWinner.name);
    }

    const a = teamMap.get(s16[0]);
    const b = teamMap.get(s16[1]);
    const e8 = a && b ? ensemble.predict(a, b, "E8" as Round).predictedWinner.name : s16[0];
    e8Winners.push(e8);

    picks[regionName] = { r64, r32, s16, e8: [e8] };
  }

  // FF using region order
  const ro = tournament.regionOrder;
  const r1 = teamMap.get(picks[ro[0]]?.e8[0]);
  const r2 = teamMap.get(picks[ro[1]]?.e8[0]);
  const r3 = teamMap.get(picks[ro[2]]?.e8[0]);
  const r4 = teamMap.get(picks[ro[3]]?.e8[0]);

  const semi1 = r1 && r2 ? ensemble.predict(r1, r2, "F4" as Round).predictedWinner.name : picks[ro[0]]?.e8[0];
  const semi2 = r3 && r4 ? ensemble.predict(r3, r4, "F4" as Round).predictedWinner.name : picks[ro[2]]?.e8[0];
  const s1t = teamMap.get(semi1);
  const s2t = teamMap.get(semi2);
  const champion = s1t && s2t ? ensemble.predict(s1t, s2t, "Championship" as Round).predictedWinner.name : semi1;

  return { picks, ff: { semi1, semi2, champion } };
}

export async function runBracketComparison(fetchData: boolean = false): Promise<string> {
  const tournaments = getAllHistoricalBrackets();
  const lines: string[] = [];
  const ensemble = new EnsembleModel(getCalibratedWeights());

  const chalkScores: number[] = [];
  const smartSafeScores: number[] = [];
  const smartBalancedScores: number[] = [];
  const smartContrScores: number[] = [];

  lines.push("=".repeat(75));
  lines.push("  BRACKET METHOD COMPARISON — 14 Historical Tournaments");
  lines.push("=".repeat(75));
  lines.push("\n  Year  Chalk    Smart(S) Smart(B) Smart(C) Actual Champ    Chalk Champ?  Smart Champ?");
  lines.push("  " + "-".repeat(72));

  for (const tournament of tournaments) {
    let teams;
    if (fetchData) {
      const cached = await fetchHistoricalTeams(tournament.year);
      teams = buildTeamsFromHistorical(cached, tournament);
    } else {
      // Build from tournament data with placeholder stats
      teams = buildPlaceholderTeams(tournament);
    }

    // 1. Chalk bracket
    const chalk = generateChalkBracket(tournament, teams, ensemble);
    const chalkScore = scoreBracket(chalk.picks, chalk.ff, tournament);

    // 2. Smart brackets (safe, balanced, contrarian)
    // Use lower sim count for speed during backtest
    const smartSafe = buildSmartBracket(teams, ensemble, { pool: "safe", sims: 2000 });
    const smartBal = buildSmartBracket(teams, ensemble, { pool: "balanced", sims: 2000 });
    const smartContr = buildSmartBracket(teams, ensemble, { pool: "contrarian", sims: 2000 });

    // Score smart brackets
    const safePicks = extractPicks(smartSafe.bracket.bracket, tournament);
    const balPicks = extractPicks(smartBal.bracket.bracket, tournament);
    const contrPicks = extractPicks(smartContr.bracket.bracket, tournament);

    const safeScore = scoreBracket(safePicks.picks, safePicks.ff, tournament);
    const balScore = scoreBracket(balPicks.picks, balPicks.ff, tournament);
    const contrScore = scoreBracket(contrPicks.picks, contrPicks.ff, tournament);

    chalkScores.push(chalkScore.espnScore);
    smartSafeScores.push(safeScore.espnScore);
    smartBalancedScores.push(balScore.espnScore);
    smartContrScores.push(contrScore.espnScore);

    const actual = tournament.finalFour.champion;
    lines.push(
      `  ${tournament.year}  ${chalkScore.espnScore.toString().padStart(5)}    ${safeScore.espnScore.toString().padStart(5)}    ${balScore.espnScore.toString().padStart(5)}    ${contrScore.espnScore.toString().padStart(5)}    ${actual.padEnd(16)} ${chalkScore.championCorrect ? "YES" : "no "}         ${safeScore.championCorrect ? "YES" : "no "}`
    );
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  lines.push("  " + "-".repeat(72));
  lines.push(
    `  AVG   ${avg(chalkScores).toFixed(0).padStart(5)}    ${avg(smartSafeScores).toFixed(0).padStart(5)}    ${avg(smartBalancedScores).toFixed(0).padStart(5)}    ${avg(smartContrScores).toFixed(0).padStart(5)}`
  );

  lines.push(`\n  Chalk champion correct: ${chalkScores.filter((_, i) => {
    const t = tournaments[i];
    const chalk = generateChalkBracket(t, buildPlaceholderTeams(t), ensemble);
    return chalk.ff.champion === t.finalFour.champion;
  }).length}/14`);

  // Summary
  lines.push("\n  VERDICT:");
  const safeAvg = avg(smartSafeScores);
  const chalkAvg = avg(chalkScores);
  const diff = safeAvg - chalkAvg;
  if (diff > 0) {
    lines.push(`  Smart Builder beats Chalk by +${diff.toFixed(0)} ESPN pts/year on average`);
  } else if (diff < 0) {
    lines.push(`  Chalk beats Smart Builder by +${(-diff).toFixed(0)} ESPN pts/year — smart builder needs tuning`);
  } else {
    lines.push(`  Dead even — smart builder matches chalk`);
  }

  return lines.join("\n");
}

function extractPicks(
  bracket: { regions: Record<string, { picks: { r64: string[]; r32: string[]; s16: string[]; e8: string[] } }>; finalFour: { semi1: { winner: string }; semi2: { winner: string } }; champion: string },
  tournament: HistoricalTournament,
): { picks: Record<string, Record<string, string[]>>; ff: { semi1: string; semi2: string; champion: string } } {
  const picks: Record<string, Record<string, string[]>> = {};

  // Map bracket regions to tournament regions
  // The bracket uses standard region names, tournament may use different names
  const bracketRegions = Object.keys(bracket.regions);
  const tourneyRegions = Object.keys(tournament.regions);

  // Try direct mapping first
  for (const region of tourneyRegions) {
    if (bracket.regions[region]) {
      picks[region] = bracket.regions[region].picks;
    }
  }

  return {
    picks,
    ff: {
      semi1: bracket.finalFour.semi1.winner,
      semi2: bracket.finalFour.semi2.winner,
      champion: bracket.champion,
    },
  };
}

function buildPlaceholderTeams(tournament: HistoricalTournament) {
  const teams: any[] = [];
  for (const [regionName, region] of Object.entries(tournament.regions)) {
    for (const [seedStr, teamName] of Object.entries(region.seeds)) {
      const seed = parseInt(seedStr);
      teams.push({
        name: teamName, seed, region: regionName,
        conference: "Unknown", isPowerConference: false, isFirstFourWinner: false,
        kenpom: {
          rank: seed * 18, adjEM: Math.max(-5, 35 - seed * 2.5),
          adjO: 115 - seed * 0.8, adjORank: seed * 18,
          adjD: 95 + seed * 0.8, adjDRank: seed * 18,
          adjTempo: 68, adjTempoRank: 150, sosRank: seed * 12,
        },
      });
    }
  }
  return teams;
}
