// FINAL v4: All intelligence applied
// Injuries: Duke center OUT, Louisville Brown Jr OUT, Texas Tech Toppin ACL OUT
// Cross-validated: Nate Silver, KenPom, Rithmm, CBS experts, ESPN Giant Killers
// New intel: Akron over Texas Tech (5 of 10 experts), South Florida streak,
//            VCU 16 of 17 wins, Miami OH 31-1 Cinderella

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { buildSmartBracket, formatSmartBracket } from "../src/engine/smart-builder.js";
import { Team } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // === INJURY ADJUSTMENTS ===
  function adjust(name: string, field: string, delta: number, rankField?: string, rankDelta?: number) {
    const t = teams.find((t) => t.name === name);
    if (!t) { console.log(`  WARN: ${name} not found`); return; }
    const old = (t.kenpom as any)[field];
    (t.kenpom as any)[field] = old + delta;
    t.kenpom.adjEM = t.kenpom.adjO - t.kenpom.adjD;
    if (rankField && rankDelta) (t.kenpom as any)[rankField] = (t.kenpom as any)[rankField] + rankDelta;
    console.log(`  Injury: ${name} — ${field} ${old.toFixed(1)} → ${((t.kenpom as any)[field]).toFixed(1)}`);
  }

  console.log("=== APPLYING INJURIES ===");
  adjust("Duke", "adjD", 2.5, "adjDRank", 15);          // starting center OUT
  adjust("Louisville", "adjO", -3.0, "adjORank", 20);    // Brown Jr OUT
  adjust("Texas Tech", "adjO", -3.5, "adjORank", 25);    // Toppin ACL, lost 3 straight
  adjust("Texas Tech", "adjD", 1.0, "adjDRank", 8);      // overall weakened
  // Tennessee's Ament hobbled
  adjust("Tennessee", "adjO", -1.0, "adjORank", 8);
  // North Carolina lost Wilson for season
  adjust("North Carolina", "adjO", -2.0, "adjORank", 15);

  console.log("\n=== GENERATING 6 BRACKETS (v4) ===\n");
  const ensemble = new EnsembleModel(getCalibratedWeights());

  const configs = [
    { label: "BRACKET 1: SAFE — Arizona (analytically best, healthy)", pool: "safe" as const, champion: "Arizona", sims: 10000 },
    { label: "BRACKET 2: SAFE — Michigan (#1 defense, math-optimal)", pool: "safe" as const, champion: "Michigan", sims: 10000 },
    { label: "BRACKET 3: SAFE — Duke (#1 seed despite injuries)", pool: "safe" as const, champion: "Duke", sims: 10000 },
    { label: "BRACKET 4: BALANCED — Model's Choice (let EV decide)", pool: "balanced" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 5: CONTRARIAN — Houston (best 2-seed)", pool: "contrarian" as const, champion: "Houston", sims: 10000 },
    { label: "BRACKET 6: CONTRARIAN — Illinois (#1 offense, 3-seed sleeper)", pool: "contrarian" as const, champion: "Illinois", sims: 10000 },
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
      pool: config.pool, champion: config.champion, sims: config.sims,
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
  console.log("  FINAL 6 BRACKETS v4 — ALL INTELLIGENCE APPLIED");
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
  console.log(`  Champions: ${[...new Set(results.map((r) => r.champion))].join(", ")}`);

  // Per-bracket upset list
  console.log(`\n${"=".repeat(75)}`);
  console.log("  UPSET PICKS BY BRACKET");
  console.log("=".repeat(75));
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`\n  Bracket ${i + 1} (${r.champion} champion, ${r.upsets} upsets):`);
    for (const u of r.upsetList) console.log(`    ${u}`);
  }

  // Intelligence sources
  console.log(`\n${"=".repeat(75)}`);
  console.log("  INTELLIGENCE SOURCES APPLIED");
  console.log("=".repeat(75));
  console.log("  Injuries applied:");
  console.log("    Duke: starting center OUT (AdjD +2.5)");
  console.log("    Louisville: Brown Jr OUT (AdjO -3.0)");
  console.log("    Texas Tech: Toppin ACL + 3 straight losses (AdjO -3.5, AdjD +1.0)");
  console.log("    Tennessee: Ament hobbled (AdjO -1.0)");
  console.log("    North Carolina: Wilson season-ending (AdjO -2.0)");
  console.log("  Cross-validation:");
  console.log("    Nate Silver COOPER: Arizona slight fav, St. John's under-seeded");
  console.log("    KenPom: Arizona #2, Michigan #1 defense, Illinois #1 offense");
  console.log("    CBS/ESPN experts: 5/10 pick Akron over Texas Tech");
  console.log("    ESPN: South Florida 12-game win streak, Louisville vulnerable");
  console.log("    ESPN: VCU won 16 of last 17, UNC weakened by Wilson loss");
  console.log("    Rithmm AI: Texas/BYU, Santa Clara/Kentucky flagged");
}

main().then(() => process.exit(0));
