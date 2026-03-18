// Historical Analyzer: Recalculates all thresholds from 14-year dataset
// This is the engine that validates/breaks existing rules

import { Round, ROUNDS_IN_ORDER, POWER_CONFERENCES } from "../types.js";
import {
  CHAMPIONS, FINAL_FOURS, DEEP_RUNS, SEED_ADVANCEMENT_14Y,
  R64_UPSETS_14Y, STRONG_MID_MAJORS, TOTAL_TOURNAMENTS,
  type ChampionProfile, type DeepRunEntry,
} from "./tournament-data.js";

export interface GateValidation {
  gateName: string;
  passCount: number;
  failCount: number;
  failures: Array<{ year: number; name: string; value: string }>;
  recommendation: string;
}

export interface RecalibratedThresholds {
  championGates: GateValidation[];
  seedAdvancement: Record<number, Record<Round, number>>;
  r64UpsetRates: Record<string, number>;
  efficiencyStaircase: Record<Round, { adjEMFloor: number; adjDCeiling: number | null; adjOCeiling: number | null; description: string }>;
  cinderellaFindings: string[];
}

// ============================================================
// CHAMPION GATE VALIDATION
// ============================================================

export function validateChampionGates(): GateValidation[] {
  const gates: GateValidation[] = [];

  const validate = (
    name: string,
    test: (c: ChampionProfile) => boolean,
    describe: (c: ChampionProfile) => string,
    rec: string,
  ): void => {
    const failures = CHAMPIONS.filter((c) => !test(c))
      .map((c) => ({ year: c.year, name: c.name, value: describe(c) }));
    gates.push({
      gateName: name,
      passCount: CHAMPIONS.length - failures.length,
      failCount: failures.length,
      failures,
      recommendation: rec,
    });
  };

  validate(
    "KenPom Top 6", (c) => c.kenpomRank <= 6,
    (c) => `KenPom #${c.kenpomRank}`,
    "Loosen to Top 20 — 2011 UConn (#16) and 2014 UConn (#18) both fail",
  );

  validate(
    "AdjEM >= +25", (c) => c.adjEM >= 25,
    (c) => `AdjEM ${c.adjEM.toFixed(1)}`,
    "Loosen to >= +18 — 2014 UConn (+18.7) and 2011 UConn (+20.5) fail at +25",
  );

  validate(
    "AdjO Top 25", (c) => c.adjORank <= 25,
    (c) => `AdjO #${c.adjORank}`,
    "Loosen to Top 40 — 2014 UConn (AdjO #35) fails at Top 25",
  );

  validate(
    "AdjD Top 25", (c) => c.adjDRank <= 25,
    (c) => `AdjD #${c.adjDRank}`,
    "Keep at Top 25 — all 14 champions pass (2014 UConn AdjD #24)",
  );

  validate(
    "SOS Top 33", (c) => c.sosRank <= 33,
    (c) => `SOS #${c.sosRank}`,
    "Loosen to Top 50 — 2014 UConn (SOS #42) fails at Top 33",
  );

  validate(
    "Seed 1-4", (c) => c.seed <= 4,
    (c) => `${c.seed}-seed`,
    "Loosen to Seed 1-8 — 2014 UConn was a 7-seed",
  );

  const powerOrStrong = [...POWER_CONFERENCES as readonly string[], ...STRONG_MID_MAJORS as readonly string[]];
  validate(
    "Power Conference", (c) => c.isPowerConference,
    (c) => c.conference,
    "Add AAC/MWC/WCC as 'strong mid-major' — 2014 UConn was AAC",
  );

  validate(
    "FT Rate Top 25", (c) => c.ftRateRank <= 25,
    (c) => `FT Rate #${c.ftRateRank}`,
    "Loosen to Top 50 — 2014 UConn (#45) and 2011 UConn (#30) fail at Top 25",
  );

  return gates;
}

// ============================================================
// SEED ADVANCEMENT RATES (14 years)
// ============================================================

export function getSeedAdvancementRates(): Record<number, Record<Round, number>> {
  return { ...SEED_ADVANCEMENT_14Y };
}

// ============================================================
// R64 UPSET RATES (14 years)
// ============================================================

export function getR64UpsetRates(): Record<string, number> {
  return { ...R64_UPSETS_14Y };
}

// ============================================================
// EFFICIENCY STAIRCASE RECALCULATION
// ============================================================
// Based on champion + Final Four + deep run data across 14 years

export function recalculateEfficiencyStaircase(): Record<Round, {
  adjEMFloor: number;
  adjDCeiling: number | null;
  adjOCeiling: number | null;
  description: string;
}> {
  // R64/R32 floors stay the same — single-game variance dominant
  // S16+ floors adjusted based on 14-year champion/FF data

  // Key data points from champions:
  // Lowest AdjEM champion: 2014 UConn at +18.7
  // Lowest AdjD champion: 2014 UConn at #24
  // Lowest AdjO champion: 2014 UConn at #35

  return {
    R64: {
      adjEMFloor: 8,
      adjDCeiling: null,
      adjOCeiling: null,
      description: "Single-game variance dominant — AdjEM +8 floor",
    },
    R32: {
      adjEMFloor: 14,
      adjDCeiling: 55,
      adjOCeiling: null,
      description: "Preparation advantage kicks in — AdjEM +14, AdjD top 55",
    },
    S16: {
      adjEMFloor: 20,
      adjDCeiling: 40,
      adjOCeiling: 40,
      description: "Steepest cliff — AdjEM +20, defense + offense top 40",
    },
    E8: {
      adjEMFloor: 18,
      adjDCeiling: 35,
      adjOCeiling: 35,
      description: "Two-way competence — AdjEM +18, both ends top 35",
    },
    F4: {
      adjEMFloor: 14,
      adjDCeiling: 40,
      adjOCeiling: null,
      description: "14-year data shows outliers (2016 Syracuse AdjEM +14.8) — floor lowered to +14",
    },
    Championship: {
      adjEMFloor: 18,
      adjDCeiling: 25,
      adjOCeiling: 40,
      description: "2014 UConn (+18.7) sets the floor — AdjEM +18, AdjD top 25, AdjO top 40",
    },
  };
}

// ============================================================
// CINDERELLA CEILING VALIDATION
// ============================================================

export function validateCinderellaCeilings(): string[] {
  const findings: string[] = [];
  const doubleDigitFF = DEEP_RUNS.filter(
    (r) => r.seed >= 10 && ROUNDS_IN_ORDER.indexOf(r.deepestRound) >= ROUNDS_IN_ORDER.indexOf("F4")
  );

  findings.push(`Double-digit seeds reaching Final Four: ${doubleDigitFF.length} in 14 years`);

  for (const run of doubleDigitFF) {
    const type = classifyRunType(run);
    findings.push(`  ${run.year} ${run.name} (${run.seed}-seed): ${type} — AdjEM ${run.adjEM.toFixed(1)}, AdjD #${run.adjDRank}, AdjO #${run.adjORank}`);
  }

  // Key findings
  const misSeeds = doubleDigitFF.filter((r) =>
    isPowerConf(r.conference) || STRONG_MID_MAJORS.includes(r.conference as typeof STRONG_MID_MAJORS[number])
  );
  findings.push(`\nPower/strong conference mis-seeds: ${misSeeds.length}/${doubleDigitFF.length}`);
  findings.push("11-seed FF appearances: VCU 2011, Loyola 2018, UCLA 2021, NC State 2024 — most are defense-first or power conf");
  findings.push("Balanced Cinderellas (both sides top 40) can reach Final Four — ceiling should be F4, not S16");
  findings.push("Defense-first Cinderellas (AdjD top 30, AdjO outside 60) max at F4 (Loyola 2018)");
  findings.push("Offense-only Cinderellas still max at R32 — Oral Roberts 2021 (AdjD #160) lost to Arkansas in S16");

  return findings;
}

function classifyRunType(run: DeepRunEntry): string {
  if (isPowerConf(run.conference)) return "power-conference mis-seed";
  if (run.adjDRank <= 30 && run.adjORank > 50) return "defense-first";
  if (run.adjDRank <= 40 && run.adjORank <= 40) return "balanced";
  if (run.adjORank <= 30 && run.adjDRank > 50) return "offense-only";
  return "carry-job";
}

function isPowerConf(conf: string): boolean {
  return (POWER_CONFERENCES as readonly string[]).includes(conf);
}

// ============================================================
// FULL RECALIBRATION
// ============================================================

export function runFullRecalibration(): RecalibratedThresholds {
  return {
    championGates: validateChampionGates(),
    seedAdvancement: getSeedAdvancementRates(),
    r64UpsetRates: getR64UpsetRates(),
    efficiencyStaircase: recalculateEfficiencyStaircase(),
    cinderellaFindings: validateCinderellaCeilings(),
  };
}
