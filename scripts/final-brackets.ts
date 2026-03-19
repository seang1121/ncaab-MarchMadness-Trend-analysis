// Generate 6 final brackets for pool submission
// Injury adjustments: Duke center OUT (weaken AdjD), Louisville Brown Jr OUT (weaken AdjO)
// NO Vegas influence — pure model + efficiency data + injury facts

import { readFile, writeFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { buildSmartBracket, formatSmartBracket } from "../src/engine/smart-builder.js";
import { Team } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // === INJURY ADJUSTMENTS ===
  // Duke: starting center OUT — weaken interior defense
  const duke = teams.find((t) => t.name === "Duke");
  if (duke) {
    console.log(`Injury: Duke starting center OUT — AdjD ${duke.kenpom.adjD.toFixed(1)} → ${(duke.kenpom.adjD + 2.5).toFixed(1)}, AdjDRank ${duke.kenpom.adjDRank} → ${duke.kenpom.adjDRank + 15}`);
    duke.kenpom.adjD += 2.5;    // lose ~2.5 pts per 100 possessions on defense
    duke.kenpom.adjDRank += 15; // drop ~15 spots in defensive ranking
    duke.kenpom.adjEM -= 2.5;   // net efficiency drops
  }

  // Louisville: star guard Mikel Brown Jr OUT — weaken offense
  const louisville = teams.find((t) => t.name === "Louisville");
  if (louisville) {
    console.log(`Injury: Louisville guard Brown Jr OUT — AdjO ${louisville.kenpom.adjO.toFixed(1)} → ${(louisville.kenpom.adjO - 3.0).toFixed(1)}, AdjORank ${louisville.kenpom.adjORank} → ${louisville.kenpom.adjORank + 20}`);
    louisville.kenpom.adjO -= 3.0;    // lose primary scorer
    louisville.kenpom.adjORank += 20;
    louisville.kenpom.adjEM -= 3.0;
  }

  console.log("\nInjuries applied. Generating 6 brackets...\n");

  const ensemble = new EnsembleModel(getCalibratedWeights());

  const configs = [
    { label: "BRACKET 1: SAFE — Math Optimal (model's pick)", pool: "safe" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 2: SAFE — Duke Champion (weakened but still #1 seed)", pool: "safe" as const, champion: "Duke", sims: 10000 },
    { label: "BRACKET 3: SAFE — Arizona Champion (experts' favorite)", pool: "safe" as const, champion: "Arizona", sims: 10000 },
    { label: "BRACKET 4: BALANCED — Model's Best Pick (more upsets)", pool: "balanced" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 5: CONTRARIAN — Houston Champion (best 2-seed)", pool: "contrarian" as const, champion: "Houston", sims: 10000 },
    { label: "BRACKET 6: CONTRARIAN — Illinois Champion (3-seed sleeper)", pool: "contrarian" as const, champion: "Illinois", sims: 10000 },
  ];

  const results: Array<{
    label: string; champion: string; ff: string[];
    upsets: number; espn: number; upsetList: string[];
  }> = [];

  for (const config of configs) {
    console.log(`${"#".repeat(75)}`);
    console.log(`  ${config.label}`);
    console.log(`${"#".repeat(75)}`);

    const sb = buildSmartBracket(teams, ensemble, {
      pool: config.pool,
      champion: config.champion,
      sims: config.sims,
    });

    console.log(formatSmartBracket(sb));

    const bracket = sb.bracket.bracket;
    const regionKeys = Object.keys(bracket.regions);

    results.push({
      label: config.label,
      champion: bracket.champion,
      ff: regionKeys.map((r) => bracket.regions[r as any]?.picks.e8[0] || "?"),
      upsets: sb.upsetCount,
      espn: sb.expectedEspnScore,
      upsetList: sb.picks
        .filter((p) => p.isUpset)
        .map((p) => `${p.round}: ${p.pickedSeed}-${p.picked} over ${p.overSeed}-${p.over}`),
    });
  }

  // Summary
  console.log(`\n${"=".repeat(75)}`);
  console.log("  FINAL 6 BRACKETS — SUBMISSION SUMMARY (injury-adjusted)");
  console.log("=".repeat(75));
  console.log("\n  #  Champion      Final Four                                    Upsets  Exp ESPN");
  console.log("  " + "-".repeat(72));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`  ${i + 1}  ${r.champion.padEnd(14)} ${r.ff.join(" | ").padEnd(44)} ${r.upsets.toString().padStart(4)}  ${r.espn.toFixed(0).padStart(7)}`);
  }

  const allUpsets = new Set<string>();
  for (const r of results) for (const u of r.upsetList) allUpsets.add(u);

  console.log(`\n  Unique champions: ${new Set(results.map((r) => r.champion)).size}`);
  console.log(`  Unique FF teams: ${new Set(results.flatMap((r) => r.ff)).size}`);
  console.log(`  Unique upsets across all 6: ${allUpsets.size}`);

  // Per-bracket upset list
  console.log(`\n${"=".repeat(75)}`);
  console.log("  UPSET PICKS BY BRACKET");
  console.log("=".repeat(75));
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`\n  Bracket ${i + 1} (${r.champion} champion, ${r.upsets} upsets):`);
    for (const u of r.upsetList) {
      console.log(`    ${u}`);
    }
  }

  // Injury impact
  console.log(`\n${"=".repeat(75)}`);
  console.log("  INJURY IMPACT NOTES");
  console.log("=".repeat(75));
  console.log("  Duke: Starting center OUT — AdjD weakened by 2.5 pts/100 possessions");
  console.log("  Louisville: Star guard Brown Jr OUT — AdjO weakened by 3.0 pts/100 possessions");
  console.log("  Impact: Duke still viable but path is harder. Louisville vulnerable to South Florida upset.");
}

main().then(() => process.exit(0));
