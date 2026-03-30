import { describe, it, expect } from "vitest";
import { ROUNDS_IN_ORDER, POWER_CONFERENCES } from "../src/types.js";
import type { Region, Round, Team, KenPomData, Bracket } from "../src/types.js";

describe("ROUNDS_IN_ORDER", () => {
  it("contains exactly 6 rounds in correct order", () => {
    expect(ROUNDS_IN_ORDER).toEqual(["R64", "R32", "S16", "E8", "F4", "Championship"]);
  });

  it("each round is a valid Round type value", () => {
    const validRounds: Round[] = ["R64", "R32", "S16", "E8", "F4", "Championship"];
    for (const round of ROUNDS_IN_ORDER) {
      expect(validRounds).toContain(round);
    }
  });
});

describe("POWER_CONFERENCES", () => {
  it("contains the 5 major conferences", () => {
    expect(POWER_CONFERENCES).toContain("ACC");
    expect(POWER_CONFERENCES).toContain("SEC");
    expect(POWER_CONFERENCES).toContain("Big 12");
    expect(POWER_CONFERENCES).toContain("Big Ten");
    expect(POWER_CONFERENCES).toContain("Big East");
  });

  it("has exactly 5 entries", () => {
    expect(POWER_CONFERENCES).toHaveLength(5);
  });
});

describe("Type structure validation", () => {
  it("Team object has required fields", () => {
    const team: Team = {
      name: "Duke",
      seed: 1,
      region: "East",
      conference: "ACC",
      isPowerConference: true,
      isFirstFourWinner: false,
      kenpom: {
        rank: 1,
        adjEM: 30,
        adjO: 125,
        adjORank: 1,
        adjD: 95,
        adjDRank: 5,
        adjTempo: 70,
        adjTempoRank: 40,
        sosRank: 3,
      },
    };
    expect(team.name).toBe("Duke");
    expect(team.seed).toBeGreaterThanOrEqual(1);
    expect(team.seed).toBeLessThanOrEqual(16);
    expect(["East", "West", "South", "Midwest"]).toContain(team.region);
  });

  it("KenPomData has numeric fields", () => {
    const data: KenPomData = {
      rank: 1,
      adjEM: 30,
      adjO: 125,
      adjORank: 1,
      adjD: 95,
      adjDRank: 5,
      adjTempo: 70,
      adjTempoRank: 40,
      sosRank: 3,
    };
    expect(data.rank).toBeTypeOf("number");
    expect(data.adjEM).toBeTypeOf("number");
    expect(data.adjO).toBeTypeOf("number");
  });

  it("Region type only allows 4 values", () => {
    const validRegions: Region[] = ["East", "West", "South", "Midwest"];
    expect(validRegions).toHaveLength(4);
  });
});
