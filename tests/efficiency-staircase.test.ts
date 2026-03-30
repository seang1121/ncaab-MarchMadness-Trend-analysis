import { describe, it, expect } from "vitest";
import { getThreshold, meetsThreshold, maxViableRound } from "../src/rules/efficiency-staircase.js";
import { Team, Round } from "../src/types.js";

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    name: "Test Team",
    seed: 1,
    region: "East",
    conference: "ACC",
    isPowerConference: true,
    isFirstFourWinner: false,
    kenpom: {
      rank: 5,
      adjEM: 28,
      adjO: 120,
      adjORank: 10,
      adjD: 92,
      adjDRank: 10,
      adjTempo: 68,
      adjTempoRank: 50,
      sosRank: 15,
    },
    ...overrides,
  };
}

describe("getThreshold", () => {
  it("returns thresholds for every round", () => {
    const rounds: Round[] = ["R64", "R32", "S16", "E8", "F4", "Championship"];
    for (const round of rounds) {
      const threshold = getThreshold(round);
      expect(threshold).toBeDefined();
      expect(threshold.round).toBe(round);
      expect(threshold.adjEMFloor).toBeTypeOf("number");
    }
  });

  it("S16 has the highest AdjEM floor (steepest cliff)", () => {
    const s16 = getThreshold("S16");
    const r32 = getThreshold("R32");
    expect(s16.adjEMFloor).toBeGreaterThan(r32.adjEMFloor);
  });
});

describe("meetsThreshold", () => {
  it("elite team meets all thresholds", () => {
    const elite = makeTeam();
    const rounds: Round[] = ["R64", "R32", "S16", "E8", "F4", "Championship"];
    for (const round of rounds) {
      const result = meetsThreshold(elite, round);
      expect(result.meets).toBe(true);
      expect(result.violations).toHaveLength(0);
    }
  });

  it("weak team fails S16 threshold on AdjEM", () => {
    const weak = makeTeam({
      kenpom: {
        rank: 80,
        adjEM: 10,
        adjO: 105,
        adjORank: 80,
        adjD: 95,
        adjDRank: 80,
        adjTempo: 68,
        adjTempoRank: 100,
        sosRank: 90,
      },
    });
    const result = meetsThreshold(weak, "S16");
    expect(result.meets).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toContain("AdjEM");
  });

  it("defense-only team fails Championship AdjO threshold", () => {
    const defenseOnly = makeTeam({
      kenpom: {
        rank: 12,
        adjEM: 22,
        adjO: 108,
        adjORank: 55,
        adjD: 86,
        adjDRank: 5,
        adjTempo: 66,
        adjTempoRank: 30,
        sosRank: 20,
      },
    });
    const result = meetsThreshold(defenseOnly, "Championship");
    expect(result.meets).toBe(false);
    expect(result.violations.some((v) => v.includes("AdjO"))).toBe(true);
  });

  it("R64 threshold is lenient (only AdjEM floor)", () => {
    const decent = makeTeam({
      kenpom: {
        rank: 40,
        adjEM: 12,
        adjO: 110,
        adjORank: 60,
        adjD: 98,
        adjDRank: 60,
        adjTempo: 68,
        adjTempoRank: 100,
        sosRank: 60,
      },
    });
    const result = meetsThreshold(decent, "R64");
    expect(result.meets).toBe(true);
  });
});

describe("maxViableRound", () => {
  it("elite team can reach Championship", () => {
    const elite = makeTeam();
    expect(maxViableRound(elite)).toBe("Championship");
  });

  it("weak team is capped at early round", () => {
    const weak = makeTeam({
      kenpom: {
        rank: 100,
        adjEM: 5,
        adjO: 100,
        adjORank: 120,
        adjD: 95,
        adjDRank: 120,
        adjTempo: 68,
        adjTempoRank: 200,
        sosRank: 150,
      },
    });
    const maxRound = maxViableRound(weak);
    // AdjEM 5 is below R64 floor of 8, so it should be R64
    // (maxViableRound returns last passing round, breaks on first fail)
    expect(["R64"]).toContain(maxRound);
  });

  it("mid-tier team reaches some rounds but not all", () => {
    const midTier = makeTeam({
      kenpom: {
        rank: 30,
        adjEM: 16,
        adjO: 115,
        adjORank: 30,
        adjD: 99,
        adjDRank: 45,
        adjTempo: 70,
        adjTempoRank: 60,
        sosRank: 35,
      },
    });
    const maxRound = maxViableRound(midTier);
    // AdjEM 16 passes R64 (8) and R32 (14), but fails S16 (20)
    expect(maxRound).toBe("R32");
  });
});
