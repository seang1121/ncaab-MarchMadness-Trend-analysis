import { describe, it, expect } from "vitest";
import { evaluateChampionGate, findChampionContenders } from "../src/rules/champion-gate.js";
import { Team } from "../src/types.js";

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
      ftRate: 0.38,
      ftRateRank: 20,
    },
    ...overrides,
  };
}

describe("evaluateChampionGate", () => {
  it("elite team passes all 8 gates", () => {
    const elite = makeTeam();
    const result = evaluateChampionGate(elite);
    expect(result.passes).toBe(true);
    expect(result.score).toBe(8);
    expect(result.gatesFailed).toHaveLength(0);
    expect(result.gatesPassed).toHaveLength(8);
  });

  it("team with bad KenPom rank fails KenPom gate", () => {
    const team = makeTeam({
      kenpom: {
        rank: 30,
        adjEM: 28,
        adjO: 120,
        adjORank: 10,
        adjD: 92,
        adjDRank: 10,
        adjTempo: 68,
        adjTempoRank: 50,
        sosRank: 15,
        ftRateRank: 20,
      },
    });
    const result = evaluateChampionGate(team);
    expect(result.score).toBeLessThan(8);
    expect(result.gatesFailed.some((g) => g.includes("KenPom"))).toBe(true);
  });

  it("high seed (9+) fails seed gate", () => {
    const team = makeTeam({ seed: 10 });
    const result = evaluateChampionGate(team);
    expect(result.gatesFailed.some((g) => g.includes("Seed"))).toBe(true);
  });

  it("non-power conference team may fail conference gate", () => {
    const team = makeTeam({
      conference: "Patriot League",
      isPowerConference: false,
    });
    const result = evaluateChampionGate(team);
    expect(result.gatesFailed.some((g) => g.includes("Conference") || g.includes("Power"))).toBe(true);
  });

  it("team with poor FT rate fails FT gate", () => {
    const team = makeTeam({
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
        ftRateRank: 80,
      },
    });
    const result = evaluateChampionGate(team);
    expect(result.gatesFailed.some((g) => g.includes("FT"))).toBe(true);
  });

  it("passes threshold is 7 out of 8", () => {
    // Team that passes exactly 7 gates
    const team = makeTeam({
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
        ftRateRank: 80, // fails FT
      },
    });
    const result = evaluateChampionGate(team);
    expect(result.score).toBe(7);
    expect(result.passes).toBe(true);
  });

  it("returns team object in result", () => {
    const team = makeTeam({ name: "Duke" });
    const result = evaluateChampionGate(team);
    expect(result.team.name).toBe("Duke");
  });
});

describe("findChampionContenders", () => {
  it("returns only teams with score >= 6", () => {
    const teams = [
      makeTeam({ name: "Elite" }),
      makeTeam({
        name: "Weak",
        seed: 15,
        conference: "Atlantic Sun",
        isPowerConference: false,
        kenpom: {
          rank: 150,
          adjEM: 3,
          adjO: 100,
          adjORank: 150,
          adjD: 97,
          adjDRank: 150,
          adjTempo: 68,
          adjTempoRank: 200,
          sosRank: 200,
          ftRateRank: 200,
        },
      }),
    ];
    const contenders = findChampionContenders(teams);
    expect(contenders.length).toBeGreaterThanOrEqual(1);
    expect(contenders.every((c) => c.score >= 6)).toBe(true);
    expect(contenders.find((c) => c.team.name === "Weak")).toBeUndefined();
  });

  it("sorts by score descending", () => {
    const teams = [
      makeTeam({ name: "A" }),
      makeTeam({ name: "B", kenpom: { ...makeTeam().kenpom, ftRateRank: 80 } }),
    ];
    const contenders = findChampionContenders(teams);
    for (let i = 1; i < contenders.length; i++) {
      expect(contenders[i - 1].score).toBeGreaterThanOrEqual(contenders[i].score);
    }
  });
});
