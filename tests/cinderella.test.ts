import { describe, it, expect } from "vitest";
import {
  isCinderella,
  classifyCinderella,
  isExtremeTeam,
} from "../src/rules/cinderella.js";
import { Team } from "../src/types.js";

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    name: "Test Team",
    seed: 12,
    region: "East",
    conference: "Mountain West",
    isPowerConference: false,
    isFirstFourWinner: false,
    kenpom: {
      rank: 45,
      adjEM: 14,
      adjO: 110,
      adjORank: 40,
      adjD: 96,
      adjDRank: 40,
      adjTempo: 68,
      adjTempoRank: 100,
      sosRank: 60,
    },
    ...overrides,
  };
}

describe("isCinderella", () => {
  it("returns true for seeds 10+", () => {
    expect(isCinderella(makeTeam({ seed: 10 }))).toBe(true);
    expect(isCinderella(makeTeam({ seed: 11 }))).toBe(true);
    expect(isCinderella(makeTeam({ seed: 16 }))).toBe(true);
  });

  it("returns false for seeds below 10", () => {
    expect(isCinderella(makeTeam({ seed: 1 }))).toBe(false);
    expect(isCinderella(makeTeam({ seed: 9 }))).toBe(false);
  });
});

describe("classifyCinderella", () => {
  it("classifies power conference low-seed as mis-seed", () => {
    const team = makeTeam({
      seed: 11,
      conference: "ACC",
      isPowerConference: true,
      kenpom: {
        rank: 20,
        adjEM: 20,
        adjO: 115,
        adjORank: 20,
        adjD: 95,
        adjDRank: 25,
        adjTempo: 68,
        adjTempoRank: 50,
        sosRank: 30,
      },
    });
    const assessment = classifyCinderella(team);
    expect(assessment.type).toBe("mis-seed");
    expect(assessment.reason).toContain("Power conference");
  });

  it("classifies defense-first team correctly", () => {
    const team = makeTeam({
      seed: 12,
      kenpom: {
        rank: 50,
        adjEM: 12,
        adjO: 105,
        adjORank: 70,
        adjD: 93,
        adjDRank: 15,
        adjTempo: 64,
        adjTempoRank: 200,
        sosRank: 80,
      },
    });
    const assessment = classifyCinderella(team);
    expect(assessment.type).toBe("defense-first");
    expect(assessment.ceiling).toBe("F4"); // top-15 D
  });

  it("classifies offense-only team with low ceiling", () => {
    const team = makeTeam({
      seed: 13,
      kenpom: {
        rank: 60,
        adjEM: 10,
        adjO: 115,
        adjORank: 15,
        adjD: 105,
        adjDRank: 80,
        adjTempo: 72,
        adjTempoRank: 30,
        sosRank: 90,
      },
    });
    const assessment = classifyCinderella(team);
    expect(assessment.type).toBe("offense-only");
    expect(assessment.ceiling).toBe("R32");
  });

  it("assessment always includes team, type, ceiling, and reason", () => {
    const team = makeTeam();
    const assessment = classifyCinderella(team);
    expect(assessment.team).toBeDefined();
    expect(assessment.type).toBeDefined();
    expect(assessment.ceiling).toBeDefined();
    expect(assessment.reason).toBeTruthy();
  });
});

describe("isExtremeTeam", () => {
  it("flags offense-elite / defense-weak team", () => {
    const team = makeTeam({
      kenpom: {
        rank: 20,
        adjEM: 18,
        adjO: 120,
        adjORank: 5,
        adjD: 102,
        adjDRank: 70,
        adjTempo: 72,
        adjTempoRank: 20,
        sosRank: 30,
      },
    });
    const result = isExtremeTeam(team);
    expect(result.isExtreme).toBe(true);
    expect(result.reason).toContain("offense");
  });

  it("flags defense-elite / offense-weak team", () => {
    const team = makeTeam({
      kenpom: {
        rank: 20,
        adjEM: 18,
        adjO: 105,
        adjORank: 70,
        adjD: 87,
        adjDRank: 5,
        adjTempo: 64,
        adjTempoRank: 250,
        sosRank: 30,
      },
    });
    const result = isExtremeTeam(team);
    expect(result.isExtreme).toBe(true);
    expect(result.reason).toContain("defense");
  });

  it("balanced team is not extreme", () => {
    const team = makeTeam({
      kenpom: {
        rank: 10,
        adjEM: 25,
        adjO: 118,
        adjORank: 15,
        adjD: 93,
        adjDRank: 15,
        adjTempo: 68,
        adjTempoRank: 50,
        sosRank: 20,
      },
    });
    const result = isExtremeTeam(team);
    expect(result.isExtreme).toBe(false);
  });
});
