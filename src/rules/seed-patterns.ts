import { Round } from "../types.js";
import { SEED_ADVANCEMENT_14Y, R64_UPSETS_14Y } from "../historical/tournament-data.js";

// Historical seed advancement rates from 14-year study (2011-2025, skip 2020)
// Percentage of teams from each seed that reached each round
// Based on 56 teams per seed (4 per year * 14 tournaments)
const SEED_ADVANCEMENT: Record<number, Record<Round, number>> = SEED_ADVANCEMENT_14Y;

export function seedAdvancementRate(seed: number, round: Round): number {
  return SEED_ADVANCEMENT[seed]?.[round] ?? 0;
}

// Head-to-head win rates by seed matchup in R64 (14-year sample)
const R64_UPSET_RATES: Record<string, number> = R64_UPSETS_14Y;

export function r64UpsetRate(higherSeed: number, lowerSeed: number): number {
  const key = `${higherSeed}v${lowerSeed}`;
  return R64_UPSET_RATES[key] ?? 0.5;
}

// Dead zone: seeds 6-9 produce only ~7% of Sweet 16 spots across 14 years
export function isDeadZone(seed: number): boolean {
  return seed >= 6 && seed <= 9;
}

// 11-seeds appear in Sweet 16 every year (power conference mis-seeds)
export function is11SeedAnomaly(seed: number): boolean {
  return seed === 11;
}

// Seeds 13-14 have NEVER reached Sweet 16 in 14-year study
export function hasNeverReachedS16(seed: number): boolean {
  return seed >= 13 && seed <= 14;
}

export function getSeedProfile(seed: number): string {
  const rates = SEED_ADVANCEMENT[seed];
  if (!rates) return `Unknown seed ${seed}`;

  const lines = [`${seed}-seed historical rates (14-year study, 2011-2025):`];
  const entries: [string, number][] = [
    ["Win R64", rates.R64],
    ["Win R32", rates.R32],
    ["Sweet 16", rates.S16],
    ["Elite 8", rates.E8],
    ["Final Four", rates.F4],
    ["Champion", rates.Championship],
  ];

  for (const [label, rate] of entries) {
    lines.push(`  ${label}: ${(rate * 100).toFixed(1)}%`);
  }

  if (isDeadZone(seed)) lines.push("  ** DEAD ZONE — only ~7% of Sweet 16 spots **");
  if (is11SeedAnomaly(seed)) lines.push("  ** 11-SEED ANOMALY — appears in Sweet 16 every year **");
  if (hasNeverReachedS16(seed)) lines.push("  ** NEVER reached Sweet 16 in 14-year study **");

  return lines.join("\n");
}
