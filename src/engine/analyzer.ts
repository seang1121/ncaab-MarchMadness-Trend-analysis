import {
  Team, Bracket, Round, AnalysisResult, AnalysisFlag,
  ChampionGateResult, ATSEdge, CinderellaAssessment,
  ROUNDS_IN_ORDER, Region,
} from "../types.js";
import { evaluateChampionGate } from "../rules/champion-gate.js";
import { meetsThreshold, maxViableRound } from "../rules/efficiency-staircase.js";
import { seedAdvancementRate, isDeadZone, hasNeverReachedS16, is11SeedAnomaly } from "../rules/seed-patterns.js";
import { classifyCinderella, isCinderella, isExtremeTeam } from "../rules/cinderella.js";
import { findATSEdges } from "../rules/ats-edges.js";
import { resolveTeam } from "../data/team-resolver.js";

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

// Standard R64 seed matchups
const R64_SEED_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export function analyzeBracket(bracket: Bracket, allTeams: Team[]): AnalysisResult {
  const flags: AnalysisFlag[] = [];
  const atsEdges: ATSEdge[] = [];
  const cinderellaAssessments: CinderellaAssessment[] = [];

  // Find champion team
  const champion = resolveTeam(bracket.champion, allTeams);
  const championGate = champion
    ? evaluateChampionGate(champion)
    : { team: null as unknown as Team, passes: false, gatesPassed: [], gatesFailed: ["Champion not found"], score: 0 };

  if (champion && !championGate.passes) {
    flags.push({
      severity: championGate.score >= 6 ? "warning" : "error",
      round: "Championship",
      rule: "CHAMPION_GATE",
      message: `${bracket.champion} fails champion gate (${championGate.score}/8). Failed: ${championGate.gatesFailed.join("; ")}`,
    });
  } else if (champion) {
    flags.push({
      severity: "good",
      round: "Championship",
      rule: "CHAMPION_GATE",
      message: `${bracket.champion} passes all 8 champion gates — historically viable`,
    });
  }

  // Analyze each region
  for (const region of REGIONS) {
    const rb = bracket.regions[region];
    if (!rb) continue;
    const regionTeams = rb.teams.length > 0 ? rb.teams : allTeams.filter((t) => t.region === region);

    // R64 analysis
    for (let i = 0; i < rb.picks.r64.length; i++) {
      const winnerName = rb.picks.r64[i];
      const winner = resolveTeam(winnerName, regionTeams);
      if (!winner) continue;

      const [highSeed, lowSeed] = R64_SEED_MATCHUPS[i] || [0, 0];
      const loser = regionTeams.find(
        (t) => t.seed === (winner.seed === highSeed ? lowSeed : highSeed)
      );

      if (winner.seed > highSeed && loser) {
        // Upset picked
        const rate = seedAdvancementRate(winner.seed, "R64");
        if (rate < 0.10) {
          flags.push({
            severity: "warning",
            round: "R64",
            matchup: { teamA: loser.name, teamB: winner.name, winner: winner.name },
            rule: "RARE_UPSET",
            message: `${winner.seed}-over-${highSeed} upsets happen only ${(rate * 100).toFixed(0)}% of the time`,
          });
        }

        if (loser) {
          atsEdges.push(...findATSEdges(winner, loser, "R64"));
        }
      }
    }

    // R32 analysis
    for (const winnerName of rb.picks.r32) {
      const winner = resolveTeam(winnerName, regionTeams);
      if (!winner) continue;

      const check = meetsThreshold(winner, "R32");
      if (!check.meets) {
        flags.push({
          severity: "warning",
          round: "R32",
          rule: "STAIRCASE_VIOLATION",
          message: `${winner.name} below R32 staircase: ${check.violations[0]}`,
        });
      }
    }

    // Sweet 16 analysis
    for (const winnerName of rb.picks.s16) {
      const winner = resolveTeam(winnerName, regionTeams);
      if (!winner) continue;

      const check = meetsThreshold(winner, "S16");
      if (!check.meets) {
        flags.push({
          severity: "error",
          round: "S16",
          rule: "STAIRCASE_VIOLATION",
          message: `${winner.name} below Sweet 16 staircase: ${check.violations.join("; ")}`,
        });
      }

      if (isDeadZone(winner.seed)) {
        flags.push({
          severity: "warning",
          round: "S16",
          rule: "DEAD_ZONE",
          message: `${winner.name} is a ${winner.seed}-seed in Sweet 16 — seeds 6-9 produce only 7.5% of S16 spots`,
        });
      }

      if (hasNeverReachedS16(winner.seed)) {
        flags.push({
          severity: "error",
          round: "S16",
          rule: "NEVER_HAPPENED",
          message: `${winner.seed}-seed has NEVER reached Sweet 16 in 6-year study`,
        });
      }

      if (isCinderella(winner)) {
        const assessment = classifyCinderella(winner);
        cinderellaAssessments.push(assessment);
        const ceilingIdx = ROUNDS_IN_ORDER.indexOf(assessment.ceiling);
        if (ceilingIdx < ROUNDS_IN_ORDER.indexOf("S16")) {
          flags.push({
            severity: "error",
            round: "S16",
            rule: "CINDERELLA_CEILING",
            message: `${winner.name} (${assessment.type}) has a ${assessment.ceiling} ceiling — ${assessment.reason}`,
          });
        }
      }

      const extreme = isExtremeTeam(winner);
      if (extreme.isExtreme) {
        flags.push({
          severity: "warning",
          round: "S16",
          rule: "EXTREME_TEAM",
          message: `${winner.name}: ${extreme.reason}`,
        });
      }
    }

    // Elite 8 analysis
    const e8WinnerName = rb.picks.e8[0];
    if (e8WinnerName) {
      const winner = resolveTeam(e8WinnerName, regionTeams);
      if (winner) {
        const check = meetsThreshold(winner, "E8");
        if (!check.meets) {
          flags.push({
            severity: "error",
            round: "E8",
            rule: "STAIRCASE_VIOLATION",
            message: `${winner.name} below Elite 8 staircase: ${check.violations.join("; ")}`,
          });
        }
      }
    }
  }

  // Check for 11-seed anomaly
  const has11InS16 = REGIONS.some((r) => {
    const rb = bracket.regions[r];
    return rb?.picks.s16.some((name) => {
      const team = resolveTeam(name, allTeams);
      return team && team.seed === 11;
    });
  });

  if (!has11InS16) {
    flags.push({
      severity: "info",
      round: "S16",
      rule: "11_SEED_ANOMALY",
      message: "No 11-seed in Sweet 16 — historically at least one 11-seed reaches S16 every year",
    });
  }

  // Score calculation
  const championScore = championGate.score * 5; // 0-40
  const staircaseViolations = flags.filter((f) => f.rule === "STAIRCASE_VIOLATION").length;
  const staircaseScore = Math.max(0, 30 - staircaseViolations * 6); // 0-30
  const seedScore = Math.max(0, 15 - flags.filter((f) =>
    ["DEAD_ZONE", "NEVER_HAPPENED", "RARE_UPSET"].includes(f.rule)
  ).length * 3); // 0-15
  const cinderellaScore = Math.max(0, 10 - flags.filter((f) =>
    f.rule === "CINDERELLA_CEILING"
  ).length * 5); // 0-10
  const bonusScore = (has11InS16 ? 3 : 0) + (championGate.passes ? 2 : 0); // 0-5

  const overallScore = Math.min(100, championScore + staircaseScore + seedScore + cinderellaScore + bonusScore);

  return {
    overallScore,
    championViability: championGate,
    roundBreakdowns: ROUNDS_IN_ORDER.map((round) => ({
      round,
      score: 0,
      flags: flags.filter((f) => f.round === round),
    })),
    atsEdges,
    cinderellaAssessments,
    flags,
  };
}

export function formatAnalysis(result: AnalysisResult): string {
  const lines = [
    `=== BRACKET ANALYSIS (Score: ${result.overallScore}/100) ===`,
    "",
  ];

  // Champion
  const cg = result.championViability;
  if (cg.passes) {
    lines.push(`CHAMPION: ${cg.team.name} — PASSES all 8 gates`);
  } else {
    lines.push(`CHAMPION: ${cg.team.name} — ${cg.score}/8 gates (${cg.gatesFailed.length} failed)`);
    cg.gatesFailed.forEach((g) => lines.push(`  FAIL: ${g}`));
  }
  lines.push("");

  // Flags by severity
  const errors = result.flags.filter((f) => f.severity === "error");
  const warnings = result.flags.filter((f) => f.severity === "warning");
  const goods = result.flags.filter((f) => f.severity === "good");
  const infos = result.flags.filter((f) => f.severity === "info");

  if (errors.length > 0) {
    lines.push("ERRORS (historically never/rarely happens):");
    errors.forEach((f) => lines.push(`  [${f.round}] ${f.message}`));
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push("WARNINGS (against historical trends):");
    warnings.forEach((f) => lines.push(`  [${f.round}] ${f.message}`));
    lines.push("");
  }

  if (goods.length > 0) {
    lines.push("STRONG PICKS:");
    goods.forEach((f) => lines.push(`  [${f.round}] ${f.message}`));
    lines.push("");
  }

  if (infos.length > 0) {
    lines.push("NOTES:");
    infos.forEach((f) => lines.push(`  [${f.round}] ${f.message}`));
    lines.push("");
  }

  // ATS edges
  if (result.atsEdges.length > 0) {
    lines.push("ATS EDGES:");
    result.atsEdges.forEach((e) => lines.push(`  ${e.action.toUpperCase()}: ${e.edge} (${e.historicalRecord})`));
    lines.push("");
  }

  // Cinderella assessments
  if (result.cinderellaAssessments.length > 0) {
    lines.push("CINDERELLA ASSESSMENTS:");
    result.cinderellaAssessments.forEach((c) => {
      lines.push(`  ${c.team.name} (${c.team.seed}-seed): ${c.type} — ceiling ${c.ceiling}`);
      lines.push(`    ${c.reason}`);
    });
  }

  return lines.join("\n");
}
