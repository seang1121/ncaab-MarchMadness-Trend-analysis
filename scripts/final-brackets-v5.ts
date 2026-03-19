// FINAL v5: Diversified early rounds — no two brackets identical in R64/R32
// Each bracket has unique upset picks so we catch different scenarios

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { Team, Round, Region, RegionBracket, Bracket, GeneratedBracket } from "../src/types.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];
const R64_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

// Manual bracket builder — full control over every pick
interface BracketSpec {
  label: string;
  champion: string;
  // Override picks: region -> round -> index -> team name to pick
  // If not specified, model picks the favorite
  overrides: Record<string, Record<string, Record<number, string>>>;
  ffSemi1: string; // winner of East vs West
  ffSemi2: string; // winner of South vs Midwest
}

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // Apply injuries
  function inj(name: string, adjODelta: number, adjDDelta: number) {
    const t = teams.find((t) => t.name === name);
    if (!t) return;
    t.kenpom.adjO += adjODelta;
    t.kenpom.adjD += adjDDelta;
    t.kenpom.adjEM = t.kenpom.adjO - t.kenpom.adjD;
  }
  inj("Duke", 0, 2.5);           // center OUT
  inj("Louisville", -3.0, 0);    // Brown Jr OUT
  inj("Texas Tech", -3.5, 1.0);  // Toppin ACL
  inj("Tennessee", -1.0, 0);     // Ament hobbled
  inj("North Carolina", -2.0, 0); // Wilson OUT

  const ensemble = new EnsembleModel(getCalibratedWeights());
  const teamMap = new Map(teams.filter((t) => t.seed > 0).map((t) => [t.name, t]));

  function pick(a: Team, b: Team, round: Round): Team {
    const pred = ensemble.predict(a, b, round);
    return pred.predictedWinner;
  }

  function buildBracket(spec: BracketSpec): { bracket: Bracket; upsets: string[]; upsetCount: number } {
    const regionBrackets: Record<Region, RegionBracket> = {} as any;
    const allUpsets: string[] = [];

    for (const region of REGIONS) {
      const rTeams = teams.filter((t) => t.region === region && t.seed > 0);
      const bySeed: Record<number, Team> = {};
      for (const t of rTeams) bySeed[t.seed] = t;

      const ovr = spec.overrides[region] || {};

      // R64
      const r64Winners: Team[] = [];
      for (let i = 0; i < R64_MATCHUPS.length; i++) {
        const [high, low] = R64_MATCHUPS[i];
        const a = bySeed[high], b = bySeed[low];
        if (!a || !b) { r64Winners.push(a || b); continue; }
        const forced = ovr.r64?.[i];
        let winner: Team;
        if (forced) {
          winner = teamMap.get(forced) || pick(a, b, "R64");
        } else {
          winner = pick(a, b, "R64");
        }
        r64Winners.push(winner);
        if (winner.seed > Math.min(a.seed, b.seed)) {
          allUpsets.push(`R64: ${winner.seed}-${winner.name} over ${winner === a ? b.seed + "-" + b.name : a.seed + "-" + a.name}`);
        }
      }

      // R32
      const r32Winners: Team[] = [];
      for (let i = 0; i < 4; i++) {
        const a = r64Winners[i * 2], b = r64Winners[i * 2 + 1];
        const forced = ovr.r32?.[i];
        let winner: Team;
        if (forced) {
          winner = teamMap.get(forced) || pick(a, b, "R32");
        } else {
          winner = pick(a, b, "R32");
        }
        r32Winners.push(winner);
        if (a && b && winner.seed > Math.min(a.seed, b.seed)) {
          allUpsets.push(`R32: ${winner.seed}-${winner.name} over ${winner === a ? b.seed + "-" + b.name : a.seed + "-" + a.name}`);
        }
      }

      // S16
      const s16Winners: Team[] = [];
      for (let i = 0; i < 2; i++) {
        const a = r32Winners[i * 2], b = r32Winners[i * 2 + 1];
        const forced = ovr.s16?.[i];
        let winner: Team;
        if (forced) {
          winner = teamMap.get(forced) || pick(a, b, "S16");
        } else {
          winner = pick(a, b, "S16");
        }
        s16Winners.push(winner);
        if (a && b && winner.seed > Math.min(a.seed, b.seed)) {
          allUpsets.push(`S16: ${winner.seed}-${winner.name} over ${winner === a ? b.seed + "-" + b.name : a.seed + "-" + a.name}`);
        }
      }

      // E8
      const forced = ovr.e8?.[0];
      let e8Winner: Team;
      if (forced) {
        e8Winner = teamMap.get(forced) || pick(s16Winners[0], s16Winners[1], "E8");
      } else {
        e8Winner = pick(s16Winners[0], s16Winners[1], "E8");
      }
      if (s16Winners[0] && s16Winners[1] && e8Winner.seed > Math.min(s16Winners[0].seed, s16Winners[1].seed)) {
        allUpsets.push(`E8: ${e8Winner.seed}-${e8Winner.name} over ${e8Winner === s16Winners[0] ? s16Winners[1].seed + "-" + s16Winners[1].name : s16Winners[0].seed + "-" + s16Winners[0].name}`);
      }

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

    // FF
    const e8 = REGIONS.map((r) => teamMap.get(regionBrackets[r].picks.e8[0])!);
    const s1 = teamMap.get(spec.ffSemi1)!;
    const s2 = teamMap.get(spec.ffSemi2)!;
    const champ = teamMap.get(spec.champion)!;

    if (s1.name !== e8[0].name && s1.name !== e8[1].name) allUpsets.push(`F4: ${s1.seed}-${s1.name} upset`);
    if (s2.name !== e8[2].name && s2.name !== e8[3].name) allUpsets.push(`F4: ${s2.seed}-${s2.name} upset`);

    const bracket: Bracket = {
      year: 2026,
      regions: regionBrackets,
      finalFour: {
        semi1: { team1Region: "East", team2Region: "West", winner: s1.name },
        semi2: { team1Region: "South", team2Region: "Midwest", winner: s2.name },
      },
      champion: champ.name,
    };

    return { bracket, upsets: allUpsets, upsetCount: allUpsets.length };
  }

  // === 6 BRACKETS WITH DIVERSIFIED EARLY ROUNDS ===
  const specs: BracketSpec[] = [
    {
      label: "#1 SAFE — Arizona Champion (cleanest bracket)",
      champion: "Arizona",
      ffSemi1: "Arizona", ffSemi2: "Michigan",
      overrides: {
        West: { r64: { 1: "Utah St." } },                    // 9 over 8
        South: { r64: { 1: "Iowa" }, r32: { 1: "Vanderbilt" } },  // Iowa 9>8, Vandy 5>4
        Midwest: { r64: { 1: "Saint Louis" }, r32: { 1: "Texas Tech" } }, // StL 9>8, TT 5>4
        East: { r32: { 0: "St. John's" } },                  // SJU 5>4 in R32 (idx 0 = first R32 game... actually need to check)
      },
    },
    {
      label: "#2 SAFE — Michigan Champion (South Florida upset)",
      champion: "Michigan",
      ffSemi1: "Arizona", ffSemi2: "Michigan",
      overrides: {
        West: { r64: { 1: "Utah St." } },
        South: { r64: { 1: "Iowa" }, r32: { 1: "Vanderbilt" } },
        Midwest: { r64: { 1: "Saint Louis" }, r32: { 1: "Texas Tech" } },
        East: { r64: { 4: "South Florida" }, r32: { 0: "St. John's" } }, // South Florida over Louisville
      },
    },
    {
      label: "#3 SAFE — Duke Champion (VCU upsets UNC)",
      champion: "Duke",
      ffSemi1: "Duke", ffSemi2: "Michigan",
      overrides: {
        West: { r64: { 1: "Utah St." } },
        South: { r64: { 1: "Iowa", 4: "VCU" }, r32: { 1: "Vanderbilt" } }, // VCU over UNC
        Midwest: { r64: { 1: "Saint Louis" }, r32: { 1: "Texas Tech" } },
        East: { r32: { 0: "St. John's" } },
      },
    },
    {
      label: "#4 BALANCED — Florida Champion (defending champ, Texas A&M upset)",
      champion: "Florida",
      ffSemi1: "Arizona", ffSemi2: "Florida",
      overrides: {
        West: { r64: { 1: "Utah St." }, r32: { 1: "Wisconsin" }, s16: { 1: "Gonzaga" } },
        South: { r64: { 1: "Iowa", 6: "Texas A&M" }, r32: { 1: "Vanderbilt" }, s16: { 1: "Illinois" }, e8: { 0: "Florida" } },
        Midwest: { r64: { 0: "TCU", 1: "Saint Louis" }, r32: { 1: "Texas Tech" } },
        East: { r32: { 0: "St. John's" } },
      },
    },
    {
      label: "#5 CONTRARIAN — Houston Champion (Akron, Santa Clara upsets)",
      champion: "Houston",
      ffSemi1: "Arizona", ffSemi2: "Houston",
      overrides: {
        West: { r64: { 1: "Utah St.", 4: "Texas" }, r32: { 1: "Wisconsin" }, s16: { 1: "Gonzaga" } },
        South: { r64: { 1: "Iowa" }, r32: { 1: "Vanderbilt" }, e8: { 0: "Houston" } },
        Midwest: { r64: { 0: "TCU", 1: "Saint Louis", 6: "Santa Clara" }, r32: { 1: "Akron" } }, // Akron over Alabama!
        East: { r64: { 4: "South Florida" }, r32: { 0: "St. John's" }, s16: { 1: "Michigan St." } },
      },
    },
    {
      label: "#6 CONTRARIAN — Illinois Champion (UCF, VCU, full chaos)",
      champion: "Illinois",
      ffSemi1: "Arizona", ffSemi2: "Illinois",
      overrides: {
        West: { r64: { 1: "Utah St." }, r32: { 1: "Wisconsin" }, s16: { 1: "Gonzaga" } },
        South: { r64: { 1: "Iowa", 4: "VCU" }, r32: { 1: "Vanderbilt" }, s16: { 1: "Illinois" }, e8: { 0: "Illinois" } },
        Midwest: { r64: { 1: "Saint Louis", 6: "Santa Clara" }, r32: { 1: "Texas Tech" }, e8: { 0: "Iowa St." } },
        East: { r64: { 6: "UCF" }, r32: { 0: "St. John's" }, s16: { 1: "Michigan St." } }, // UCF over UCLA
      },
    },
  ];

  // Fix: R32 index 0 is the first R32 game (1/16 winner vs 8/9 winner)
  // St. John's over Kansas needs to be R32 index 1 (5/12 winner vs 4/13 winner)
  for (const spec of specs) {
    for (const region of Object.keys(spec.overrides)) {
      const ovr = spec.overrides[region];
      if (ovr.r32 && ovr.r32[0] === "St. John's") {
        ovr.r32[1] = ovr.r32[0];
        delete ovr.r32[0];
      }
    }
  }

  console.log("=== FINAL 6 BRACKETS v5 — DIVERSIFIED EARLY ROUNDS ===\n");

  const results: Array<{ label: string; champion: string; ff: string[]; upsets: string[]; }> = [];

  for (const spec of specs) {
    const { bracket, upsets, upsetCount } = buildBracket(spec);

    console.log(`${"~".repeat(70)}`);
    console.log(`  ${spec.label}`);
    console.log(`  ${upsetCount} upsets | Champion: ${spec.champion}`);
    console.log(`${"~".repeat(70)}`);

    for (const region of REGIONS) {
      const rb = bracket.regions[region];
      console.log(`  ${region}`);
      console.log(`    R64: ${rb.picks.r64.join(", ")}`);
      console.log(`    R32: ${rb.picks.r32.join(", ")}`);
      console.log(`    S16: ${rb.picks.s16.join(", ")}`);
      console.log(`    E8:  ${rb.picks.e8[0]}`);
    }
    console.log(`  FF: ${bracket.finalFour.semi1.winner} vs ${bracket.finalFour.semi2.winner}`);
    console.log(`  CHAMPION: ${bracket.champion}`);
    console.log(`  Upsets: ${upsets.join(" | ")}`);
    console.log();

    results.push({
      label: spec.label,
      champion: bracket.champion,
      ff: REGIONS.map((r) => bracket.regions[r].picks.e8[0]),
      upsets,
    });
  }

  // Diversity analysis
  console.log("=".repeat(70));
  console.log("  DIVERSITY ANALYSIS");
  console.log("=".repeat(70));

  const allR64Picks: Record<string, Set<string>> = {};
  for (let i = 0; i < results.length; i++) {
    const key = `B${i + 1}`;
    allR64Picks[key] = new Set(results[i].upsets.filter((u) => u.startsWith("R64")).map((u) => u));
  }

  // Check if any two brackets have identical R64
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i].upsets.filter((u) => u.startsWith("R64")).sort().join(",");
      const b = results[j].upsets.filter((u) => u.startsWith("R64")).sort().join(",");
      if (a === b) {
        console.log(`  WARNING: Brackets ${i + 1} and ${j + 1} have identical R64 upsets`);
      }
    }
  }

  const allUpsets = new Set<string>();
  for (const r of results) for (const u of r.upsets) allUpsets.add(u);

  console.log(`\n  Unique champions: ${new Set(results.map((r) => r.champion)).size}`);
  console.log(`  Unique FF teams: ${new Set(results.flatMap((r) => r.ff)).size}`);
  console.log(`  Unique upsets total: ${allUpsets.size}`);
  console.log(`  R64 upsets per bracket: ${results.map((r, i) => `B${i + 1}:${r.upsets.filter((u) => u.startsWith("R64")).length}`).join(" ")}`);
}

main().then(() => process.exit(0));
