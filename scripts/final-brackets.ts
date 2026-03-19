// FINAL v3: 6 brackets with injury adjustments + cross-validated against
// Nate Silver (COOPER), KenPom, Rithmm AI, and contrarian strategy research
// Key intel: Arizona is analytically the best team but under-picked by public
// St. John's massively under-seeded (Silver says #3/#2, stuck at #5)
// Texas/BYU and VCU/UNC flagged by multiple independent AI models

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { buildSmartBracket, formatSmartBracket } from "../src/engine/smart-builder.js";
import { Team } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // === INJURY ADJUSTMENTS (facts, not market opinions) ===
  const duke = teams.find((t) => t.name === "Duke");
  if (duke) {
    console.log(`Injury: Duke starting center OUT — AdjD +2.5, AdjDRank +15`);
    duke.kenpom.adjD += 2.5;
    duke.kenpom.adjDRank += 15;
    duke.kenpom.adjEM -= 2.5;
  }

  const louisville = teams.find((t) => t.name === "Louisville");
  if (louisville) {
    console.log(`Injury: Louisville guard Brown Jr OUT — AdjO -3.0, AdjORank +20`);
    louisville.kenpom.adjO -= 3.0;
    louisville.kenpom.adjORank += 20;
    louisville.kenpom.adjEM -= 3.0;
  }

  console.log("\nInjuries applied. Generating 6 brackets...\n");

  const ensemble = new EnsembleModel(getCalibratedWeights());

  // 6 brackets: 3 safe (different champs) + 1 balanced + 2 contrarian
  const configs = [
    { label: "BRACKET 1: SAFE — Arizona Champion (analytically best team, under-picked)", pool: "safe" as const, champion: "Arizona", sims: 10000 },
    { label: "BRACKET 2: SAFE — Michigan Champion (model's math-optimal pick)", pool: "safe" as const, champion: "Michigan", sims: 10000 },
    { label: "BRACKET 3: SAFE — Duke Champion (#1 overall seed, weakened by injury)", pool: "safe" as const, champion: "Duke", sims: 10000 },
    { label: "BRACKET 4: BALANCED — Model's Choice (let EV decide everything)", pool: "balanced" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 5: CONTRARIAN — Houston Champion (best 2-seed, runs the South)", pool: "contrarian" as const, champion: "Houston", sims: 10000 },
    { label: "BRACKET 6: CONTRARIAN — Illinois Champion (3-seed sleeper, #1 offense)", pool: "contrarian" as const, champion: "Illinois", sims: 10000 },
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
  console.log("  FINAL 6 BRACKETS — SUBMISSION READY (v3: injury + cross-validated)");
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

  // Coverage
  const champSet = new Set(results.map((r) => r.champion));
  console.log(`\n  Champions covered: ${[...champSet].join(", ")}`);

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

  // Cross-validation notes
  console.log(`\n${"=".repeat(75)}`);
  console.log("  CROSS-VALIDATION NOTES");
  console.log("=".repeat(75));
  console.log("  Nate Silver (COOPER): Arizona slight favorite, St. John's under-seeded at 5");
  console.log("  KenPom: Arizona #2 overall, ahead of Michigan. Michigan #1 in defense.");
  console.log("  Rithmm AI: Texas over BYU, Santa Clara over Kentucky flagged");
  console.log("  Public: Duke/Michigan overselected. Arizona = contrarian value as 1-seed");
  console.log("  Injuries: Duke center OUT (AdjD +2.5), Louisville Brown Jr OUT (AdjO -3.0)");
}

main().then(() => process.exit(0));
