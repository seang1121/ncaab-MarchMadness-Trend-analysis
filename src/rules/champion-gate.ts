import { Team, ChampionGateResult, POWER_CONFERENCES } from "../types.js";
import { STRONG_MID_MAJORS } from "../historical/tournament-data.js";

// Recalibrated from 14 tournaments (2011-2025)
// Key exceptions: 2014 UConn (7-seed, AAC, KenPom #18, AdjEM +18.7)
//                 2011 UConn (3-seed, KenPom #16, AdjEM +20.5)

const CHAMPION_CONFERENCES = [
  ...POWER_CONFERENCES as readonly string[],
  ...STRONG_MID_MAJORS as readonly string[],
];

const GATES = [
  {
    name: "KenPom Top 20",
    test: (t: Team) => t.kenpom.rank <= 20,
    desc: (t: Team) => `KenPom #${t.kenpom.rank} (need top 20)`,
  },
  {
    name: "AdjEM >= +18",
    test: (t: Team) => t.kenpom.adjEM >= 18,
    desc: (t: Team) => `AdjEM ${t.kenpom.adjEM.toFixed(1)} (need +18)`,
  },
  {
    name: "AdjO Top 40",
    test: (t: Team) => t.kenpom.adjORank <= 40,
    desc: (t: Team) => `AdjO rank #${t.kenpom.adjORank} (need top 40)`,
  },
  {
    name: "AdjD Top 25",
    test: (t: Team) => t.kenpom.adjDRank <= 25,
    desc: (t: Team) => `AdjD rank #${t.kenpom.adjDRank} (need top 25)`,
  },
  {
    name: "SOS Top 50",
    test: (t: Team) => t.kenpom.sosRank <= 50,
    desc: (t: Team) => `SOS rank #${t.kenpom.sosRank} (need top 50)`,
  },
  {
    name: "Seed 1-8",
    test: (t: Team) => t.seed <= 8,
    desc: (t: Team) => `${t.seed}-seed (need 1-8)`,
  },
  {
    name: "Power/Strong Conference",
    test: (t: Team) => t.isPowerConference || CHAMPION_CONFERENCES.includes(t.conference),
    desc: (t: Team) => `${t.conference} (need power or strong mid-major)`,
  },
  {
    name: "FT Rate Top 50",
    test: (t: Team) => (t.kenpom.ftRateRank ?? 999) <= 50,
    desc: (t: Team) => `FT rate rank #${t.kenpom.ftRateRank ?? "N/A"} (need top 50)`,
  },
] as const;

export function evaluateChampionGate(team: Team): ChampionGateResult {
  const gatesPassed: string[] = [];
  const gatesFailed: string[] = [];

  for (const gate of GATES) {
    if (gate.test(team)) {
      gatesPassed.push(`${gate.name}: ${gate.desc(team)}`);
    } else {
      gatesFailed.push(`${gate.name}: ${gate.desc(team)}`);
    }
  }

  // 14-year standard: 7+/8 = PASS, 5-6/8 = CONTENDER
  // All 14 champions (2011-2025) pass 7+ with recalibrated gates
  return {
    team,
    passes: gatesPassed.length >= 7,
    gatesPassed,
    gatesFailed,
    score: gatesPassed.length,
  };
}

export function findChampionContenders(teams: Team[]): ChampionGateResult[] {
  return teams
    .map(evaluateChampionGate)
    .filter((r) => r.score >= 6)
    .sort((a, b) => b.score - a.score || a.team.kenpom.rank - b.team.kenpom.rank);
}

export function formatChampionGate(result: ChampionGateResult): string {
  const label = result.passes
    ? "PASS"
    : result.score >= 5
      ? "CONTENDER"
      : `${result.score}/8`;
  const header = `[${label}] ${result.team.name} (${result.team.seed}-seed, ${result.team.conference})`;

  const lines = [header];

  if (result.gatesPassed.length > 0) {
    lines.push("  Passed:");
    result.gatesPassed.forEach((g) => lines.push(`    + ${g}`));
  }
  if (result.gatesFailed.length > 0) {
    lines.push("  Failed:");
    result.gatesFailed.forEach((g) => lines.push(`    - ${g}`));
  }

  return lines.join("\n");
}
