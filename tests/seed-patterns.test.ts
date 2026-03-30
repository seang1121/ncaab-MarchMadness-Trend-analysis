import { describe, it, expect } from "vitest";
import {
  seedAdvancementRate,
  r64UpsetRate,
  isDeadZone,
  is11SeedAnomaly,
  hasNeverReachedS16,
  getSeedProfile,
} from "../src/rules/seed-patterns.js";

describe("seedAdvancementRate", () => {
  it("returns a value between 0 and 1 for valid seeds and rounds", () => {
    const rate = seedAdvancementRate(1, "R64");
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it("returns higher advancement for 1-seeds than 16-seeds in R64", () => {
    const rate1 = seedAdvancementRate(1, "R64");
    const rate16 = seedAdvancementRate(16, "R64");
    expect(rate1).toBeGreaterThan(rate16);
  });

  it("returns 0 for unknown seed", () => {
    const rate = seedAdvancementRate(99, "R64");
    expect(rate).toBe(0);
  });

  it("rates decrease in later rounds for most seeds", () => {
    const r64 = seedAdvancementRate(5, "R64");
    const s16 = seedAdvancementRate(5, "S16");
    expect(r64).toBeGreaterThanOrEqual(s16);
  });
});

describe("r64UpsetRate", () => {
  it("returns a value between 0 and 1", () => {
    const rate = r64UpsetRate(1, 16);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it("returns 0.5 for unknown matchup", () => {
    const rate = r64UpsetRate(99, 100);
    expect(rate).toBe(0.5);
  });

  it("5v12 upset rate is historically significant (15-40%)", () => {
    const rate = r64UpsetRate(5, 12);
    expect(rate).toBeGreaterThan(0.10);
    expect(rate).toBeLessThan(0.50);
  });
});

describe("isDeadZone", () => {
  it("returns true for seeds 6-9", () => {
    expect(isDeadZone(6)).toBe(true);
    expect(isDeadZone(7)).toBe(true);
    expect(isDeadZone(8)).toBe(true);
    expect(isDeadZone(9)).toBe(true);
  });

  it("returns false for seeds outside 6-9", () => {
    expect(isDeadZone(1)).toBe(false);
    expect(isDeadZone(5)).toBe(false);
    expect(isDeadZone(10)).toBe(false);
    expect(isDeadZone(16)).toBe(false);
  });
});

describe("is11SeedAnomaly", () => {
  it("returns true only for seed 11", () => {
    expect(is11SeedAnomaly(11)).toBe(true);
    expect(is11SeedAnomaly(10)).toBe(false);
    expect(is11SeedAnomaly(12)).toBe(false);
  });
});

describe("hasNeverReachedS16", () => {
  it("returns true for seeds 13-14", () => {
    expect(hasNeverReachedS16(13)).toBe(true);
    expect(hasNeverReachedS16(14)).toBe(true);
  });

  it("returns false for other seeds", () => {
    expect(hasNeverReachedS16(12)).toBe(false);
    expect(hasNeverReachedS16(15)).toBe(false);
    expect(hasNeverReachedS16(1)).toBe(false);
  });
});

describe("getSeedProfile", () => {
  it("returns a string containing the seed number", () => {
    const profile = getSeedProfile(1);
    expect(profile).toContain("1-seed");
  });

  it("includes dead zone note for seeds 6-9", () => {
    const profile = getSeedProfile(7);
    expect(profile).toContain("DEAD ZONE");
  });

  it("includes 11-seed anomaly note", () => {
    const profile = getSeedProfile(11);
    expect(profile).toContain("11-SEED ANOMALY");
  });

  it("includes never-reached note for seeds 13-14", () => {
    const profile = getSeedProfile(13);
    expect(profile).toContain("NEVER reached Sweet 16");
  });

  it("returns unknown message for invalid seed", () => {
    const profile = getSeedProfile(99);
    expect(profile).toContain("Unknown seed");
  });
});
