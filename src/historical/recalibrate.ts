// CLI recalibration command — outputs old vs new thresholds
// Usage: npx tsx src/cli.ts recalibrate

import { ROUNDS_IN_ORDER, Round } from "../types.js";
import { CHAMPIONS, TOTAL_TOURNAMENTS } from "./tournament-data.js";
import { runFullRecalibration } from "./historical-analyzer.js";

export function runRecalibration(): void {
  const results = runFullRecalibration();

  console.log("=== 15-YEAR RECALIBRATION (2011-2025, 14 tournaments) ===\n");

  // Champion Gate Validation
  console.log("--- CHAMPION GATE VALIDATION ---");
  console.log(`Testing all ${CHAMPIONS.length} champions against gates:\n`);

  for (const gate of results.championGates) {
    const status = gate.failCount === 0 ? "[ALL PASS]" : `[${gate.failCount} FAIL]`;
    console.log(`${status} ${gate.gateName}: ${gate.passCount}/${CHAMPIONS.length} pass`);
    if (gate.failures.length > 0) {
      for (const f of gate.failures) {
        console.log(`    FAIL: ${f.year} ${f.name} — ${f.value}`);
      }
      console.log(`    >> ${gate.recommendation}`);
    }
  }

  // Efficiency Staircase
  console.log("\n--- EFFICIENCY STAIRCASE (old → new) ---\n");

  const oldFloors: Record<Round, number> = {
    R64: 8, R32: 14, S16: 22, E8: 20, F4: 25, Championship: 26,
  };

  for (const round of ROUNDS_IN_ORDER) {
    const newData = results.efficiencyStaircase[round];
    const old = oldFloors[round];
    const arrow = newData.adjEMFloor !== old ? " <<< CHANGED" : "";
    console.log(`${round}: AdjEM +${old} → +${newData.adjEMFloor}${arrow}`);
    if (newData.adjDCeiling) console.log(`  AdjD ceiling: top ${newData.adjDCeiling}`);
    if (newData.adjOCeiling) console.log(`  AdjO ceiling: top ${newData.adjOCeiling}`);
    console.log(`  ${newData.description}`);
  }

  // Seed advancement comparison
  console.log("\n--- SEED ADVANCEMENT RATES (14-year vs 6-year) ---\n");
  console.log("Seed  R64     R32     S16     E8      F4      Champ");
  console.log("-".repeat(65));

  for (let seed = 1; seed <= 16; seed++) {
    const rates = results.seedAdvancement[seed];
    if (!rates) continue;
    const line = [
      seed.toString().padEnd(6),
      ...ROUNDS_IN_ORDER.map((r) => (rates[r] * 100).toFixed(1).padStart(6) + "%"),
    ].join(" ");
    console.log(line);
  }

  // R64 upset rates
  console.log("\n--- R64 UPSET RATES (14-year) ---\n");
  for (const [matchup, rate] of Object.entries(results.r64UpsetRates)) {
    console.log(`${matchup}: ${(rate * 100).toFixed(1)}%`);
  }

  // Cinderella findings
  console.log("\n--- CINDERELLA CEILING VALIDATION ---\n");
  for (const finding of results.cinderellaFindings) {
    console.log(finding);
  }

  // Summary of changes needed
  console.log("\n--- SUMMARY OF RULE CHANGES ---\n");
  console.log("champion-gate.ts:");
  console.log("  KenPom Top 6 → Top 20");
  console.log("  AdjEM >= +25 → >= +18");
  console.log("  AdjO Top 25 → Top 40");
  console.log("  SOS Top 33 → Top 50");
  console.log("  Seed 1-4 → 1-8");
  console.log("  Power Conf → Power + Strong Mid-Major (AAC, MWC, WCC)");
  console.log("  FT Rate Top 25 → Top 50");
  console.log("  Scoring: PASS = 7+/8, was all-or-nothing\n");

  console.log("efficiency-staircase.ts:");
  console.log("  S16 floor: +22 → +20");
  console.log("  E8 floor: +20 → +18");
  console.log("  F4 floor: +25 → +14");
  console.log("  Championship floor: +26 → +18\n");

  console.log("seed-patterns.ts:");
  console.log(`  All rates recalculated from ${TOTAL_TOURNAMENTS} tournaments`);
  console.log("  7-seed championship rate: 0.003 → 0.018 (2014 UConn)");
  console.log("  8-seed championship rate: 0.002 → 0.018 (2014 Kentucky runner-up)");
  console.log("  11-seed F4 rate: 0.02 → 0.071 (4 appearances in 14 years)\n");

  console.log("cinderella.ts:");
  console.log("  Add 'carry-job' type for singular star runs (Kemba, Shabazz)");
  console.log("  Balanced ceiling: S16 → F4 (FAU 2023, Wichita St 2013)");
  console.log("  Defense-first ceiling stays at E8/F4\n");

  console.log("seed-history-model.ts:");
  console.log("  Championship seed cap: 4 → 8 (2014 UConn 7-seed won, Kentucky 8-seed runner-up)");

  console.log("\n=== RECALIBRATION COMPLETE ===");
}
