// Generate 5 final brackets for pool submission
// Bracket 1: Smart Safe (Michigan) — math-optimal, fewest upsets
// Bracket 2: Smart Safe locked Duke — the betting favorite
// Bracket 3: Smart Balanced (model's choice) — middle ground
// Bracket 4: Smart Contrarian locked Houston — best 2-seed dark horse
// Bracket 5: Smart Contrarian locked Illinois — 3-seed sleeper nobody picks

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { buildSmartBracket, formatSmartBracket } from "../src/engine/smart-builder.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const ensemble = new EnsembleModel(getCalibratedWeights());

  const configs = [
    { label: "BRACKET 1: SAFE — Math Optimal", pool: "safe" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 2: SAFE — Duke Champion (betting favorite)", pool: "safe" as const, champion: "Duke", sims: 10000 },
    { label: "BRACKET 3: BALANCED — Model's Best Pick", pool: "balanced" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 4: CONTRARIAN — Houston Champion (best 2-seed)", pool: "contrarian" as const, champion: "Houston", sims: 10000 },
    { label: "BRACKET 5: CONTRARIAN — Illinois Champion (3-seed sleeper)", pool: "contrarian" as const, champion: "Illinois", sims: 10000 },
  ];

  const results: Array<{ label: string; champion: string; ff: string[]; upsets: number; espn: number; upsetList: string[] }> = [];

  for (const config of configs) {
    console.log(`\n${"#".repeat(75)}`);
    console.log(`  ${config.label}`);
    console.log(`${"#".repeat(75)}`);

    const sb = buildSmartBracket(data.teams, ensemble, {
      pool: config.pool,
      champion: config.champion,
      sims: config.sims,
    });

    console.log(formatSmartBracket(sb));

    const bracket = sb.bracket.bracket;
    const ff = [
      bracket.finalFour.semi1.winner,
      bracket.finalFour.semi2.winner,
      // losers
    ];

    results.push({
      label: config.label,
      champion: bracket.champion,
      ff: [
        bracket.regions.East?.picks.e8[0] || "?",
        bracket.regions.West?.picks.e8[0] || "?",
        bracket.regions.South?.picks.e8[0] || "?",
        bracket.regions.Midwest?.picks.e8[0] || "?",
      ],
      upsets: sb.upsetCount,
      espn: sb.expectedEspnScore,
      upsetList: sb.picks.filter(p => p.isUpset).map(p => `${p.round}: ${p.pickedSeed}-${p.picked} over ${p.overSeed}-${p.over}`),
    });
  }

  // Summary table
  console.log(`\n${"=".repeat(75)}`);
  console.log("  FINAL 5 BRACKETS — SUBMISSION SUMMARY");
  console.log("=".repeat(75));
  console.log("\n  #  Champion      Final Four                                Upsets  Exp ESPN");
  console.log("  " + "-".repeat(72));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`  ${i + 1}  ${r.champion.padEnd(14)} ${r.ff.join(" | ").padEnd(42)} ${r.upsets.toString().padStart(4)}  ${r.espn.toFixed(0).padStart(7)}`);
  }

  // Upset diversity
  const allUpsets = new Set<string>();
  for (const r of results) for (const u of r.upsetList) allUpsets.add(u);

  console.log(`\n  Unique champions: ${new Set(results.map(r => r.champion)).size}`);
  console.log(`  Unique FF teams: ${new Set(results.flatMap(r => r.ff)).size}`);
  console.log(`  Unique upsets across all 5: ${allUpsets.size}`);

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
}

main().then(() => process.exit(0));
