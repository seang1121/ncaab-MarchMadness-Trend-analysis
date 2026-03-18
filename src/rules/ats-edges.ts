import { Team, Round, ATSEdge } from "../types.js";

interface ATSRule {
  id: string;
  description: string;
  applies: (teamA: Team, teamB: Team, round: Round) => boolean;
  getEdge: (teamA: Team, teamB: Team, round: Round) => ATSEdge;
}

const ATS_RULES: ATSRule[] = [
  {
    id: "11v6_r64",
    description: "11-seeds vs 6-seeds: 63.5% ATS (14-year sample) — power conference mis-seeds",
    applies: (a, b, round) =>
      round === "R64" && ((a.seed === 11 && b.seed === 6) || (a.seed === 6 && b.seed === 11)),
    getEdge: (a, b) => {
      const eleven = a.seed === 11 ? a : b;
      const six = a.seed === 6 ? a : b;
      return {
        matchup: `${eleven.name} (11) vs ${six.name} (6)`,
        edge: "11-seeds cover 63.5% ATS vs 6-seeds — most are power conference mis-seeds",
        historicalRecord: "63.5% ATS since 2009",
        atsPercent: 63.5,
        action: "bet",
      };
    },
  },
  {
    id: "5seed_e8",
    description: "5-seeds in Elite 8: 10-2 ATS (14-year sample) — best single edge in tournament",
    applies: (a, b, round) =>
      round === "E8" && (a.seed === 5 || b.seed === 5),
    getEdge: (a, b) => {
      const five = a.seed === 5 ? a : b;
      return {
        matchup: `${five.name} (5-seed) in Elite 8`,
        edge: "5-seeds in Elite 8 are 10-2 ATS — best single edge in the tournament",
        historicalRecord: "10-2 ATS (14-year sample)",
        atsPercent: 83.3,
        action: "bet",
      };
    },
  },
  {
    id: "first_four_r64",
    description: "First Four winners in R64: 92.1% ATS — battle-tested, undervalued",
    applies: (a, b, round) =>
      round === "R64" && (a.isFirstFourWinner || b.isFirstFourWinner),
    getEdge: (a, b) => {
      const ffWinner = a.isFirstFourWinner ? a : b;
      return {
        matchup: `${ffWinner.name} (First Four winner) in R64`,
        edge: "First Four winners cover 92.1% ATS in R64 — battle-tested and undervalued by market",
        historicalRecord: "38-5 ATS (88.4%, 14-year sample)",
        atsPercent: 88.4,
        action: "bet",
      };
    },
  },
  {
    id: "r32_cinderella_fade",
    description: "R32 Cinderellas (12-15 seeds): 0-10 ATS — market overreacts to Cinderella stories",
    applies: (a, b, round) =>
      round === "R32" && (a.seed >= 12 || b.seed >= 12),
    getEdge: (a, b) => {
      const cinderella = a.seed >= 12 ? a : b;
      const favorite = a.seed >= 12 ? b : a;
      return {
        matchup: `${cinderella.name} (${cinderella.seed}) vs ${favorite.name} (${favorite.seed}) in R32`,
        edge: "R32 Cinderellas (12-15 seeds) are 2-14 ATS — fade the fairy tale",
        historicalRecord: "2-14 ATS (14-year sample)",
        atsPercent: 0,
        action: "fade",
      };
    },
  },
  {
    id: "r32_10_11_lean",
    description: "10/11-seeds that won R64: 13-5 ATS in R32 since 2016",
    applies: (a, b, round) =>
      round === "R32" && ((a.seed === 10 || a.seed === 11) || (b.seed === 10 || b.seed === 11)),
    getEdge: (a, b) => {
      const underdog = (a.seed === 10 || a.seed === 11) ? a : b;
      return {
        matchup: `${underdog.name} (${underdog.seed}-seed) in R32`,
        edge: "10/11-seeds that won R64 cover 13-5 ATS in R32 — legitimate top-50 programs",
        historicalRecord: "13-5 ATS since 2016",
        atsPercent: 72.2,
        action: "bet",
      };
    },
  },
  {
    id: "1seed_e8_overpriced",
    description: "1-seeds in Elite 8: 43.4% ATS — consistently overpriced",
    applies: (a, b, round) =>
      round === "E8" && (a.seed === 1 || b.seed === 1),
    getEdge: (a, b) => {
      const one = a.seed === 1 ? a : b;
      const opponent = a.seed === 1 ? b : a;
      return {
        matchup: `${one.name} (1) vs ${opponent.name} (${opponent.seed}) in Elite 8`,
        edge: "1-seeds are just 43.4% ATS in Elite 8 — market overprices them at this stage",
        historicalRecord: "43.4% ATS since 2001",
        atsPercent: 43.4,
        action: "lean",
      };
    },
  },
  {
    id: "s16_underdog_4_6",
    description: "Sweet 16 underdogs +4-6 points: 56.7% ATS",
    applies: (a, b, round) =>
      round === "S16" && Math.abs(a.seed - b.seed) >= 2 && Math.abs(a.seed - b.seed) <= 5,
    getEdge: (a, b) => {
      const underdog = a.seed > b.seed ? a : b;
      const favorite = a.seed > b.seed ? b : a;
      return {
        matchup: `${underdog.name} (${underdog.seed}) vs ${favorite.name} (${favorite.seed}) in Sweet 16`,
        edge: "Sweet 16 underdogs favored by 4-6 points cover 56.7% — most durable trend since 1990",
        historicalRecord: "56.7% ATS",
        atsPercent: 56.7,
        action: "lean",
      };
    },
  },
  {
    id: "small_chalk_avoid",
    description: "Small chalk (-1 to -3 favorites): 39.5% ATS — dead zone, no value",
    applies: (a, b, round) =>
      round === "R64" && Math.abs(a.seed - b.seed) <= 1 && a.seed !== b.seed,
    getEdge: (a, b) => ({
      matchup: `${a.name} (${a.seed}) vs ${b.name} (${b.seed})`,
      edge: "Small chalk favorites (-1 to -3 pts) cover only 39.5% — neither side has value",
      historicalRecord: "39.5% ATS",
      atsPercent: 39.5,
      action: "fade",
    }),
  },
  {
    id: "f4_winner_covers",
    description: "Final Four winners cover 83% of the time",
    applies: (_a, _b, round) => round === "F4",
    getEdge: (a, b) => ({
      matchup: `${a.name} vs ${b.name} in Final Four`,
      edge: "Final Four winners cover 83% of the time — pick the winner, they'll cover",
      historicalRecord: "83% cover rate",
      atsPercent: 83,
      action: "bet",
    }),
  },
];

export function findATSEdges(teamA: Team, teamB: Team, round: Round): ATSEdge[] {
  return ATS_RULES
    .filter((rule) => rule.applies(teamA, teamB, round))
    .map((rule) => rule.getEdge(teamA, teamB, round));
}

export function findAllATSEdges(
  matchups: Array<{ teamA: Team; teamB: Team; round: Round }>
): ATSEdge[] {
  return matchups.flatMap(({ teamA, teamB, round }) => findATSEdges(teamA, teamB, round));
}
