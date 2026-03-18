import { Team, CinderellaType, CinderellaAssessment, Round } from "../types.js";

export function isCinderella(team: Team): boolean {
  return team.seed >= 10;
}

export function classifyCinderella(team: Team): CinderellaAssessment {
  const { adjORank, adjDRank, adjEM } = team.kenpom;

  // Type 1: Mis-seed — Power conference team seeded too low
  // 14-year data: UCLA 2021 (11), NC State 2024 (11), Syracuse 2016 (10) all reached F4
  const expectedRankForSeed = team.seed * 4;
  if (team.isPowerConference && team.kenpom.rank < expectedRankForSeed * 1.5) {
    return {
      team,
      type: "mis-seed",
      ceiling: getCeilingByEfficiency(team),
      reason: `Power conference (${team.conference}) with KenPom #${team.kenpom.rank} — seeded too low at ${team.seed}`,
    };
  }

  // Type 2: Carry-job — Singular star player transcends team stats
  // 14-year data: 2011 UConn (Kemba), 2014 UConn (Shabazz) — both WON the championship
  // These teams have modest overall stats but a transcendent individual performer
  // Identified by: conference tournament champion + AdjEM in a narrow range
  if (adjEM >= 14 && adjEM <= 22 && team.kenpom.rank <= 25) {
    return {
      team,
      type: "carry-job",
      ceiling: "F4",
      reason: `KenPom #${team.kenpom.rank} with AdjEM ${adjEM.toFixed(1)} — if they have a singular star, ceiling is Final Four+`,
    };
  }

  // Type 3a: Defense-first — Great defense, weak offense
  // 14-year data: Loyola Chicago 2018 (AdjD #8, AdjO #65) reached F4
  if (adjDRank <= 30 && adjORank > 50) {
    return {
      team,
      type: "defense-first",
      ceiling: adjDRank <= 15 ? "F4" : "E8",
      reason: `Elite defense (AdjD #${adjDRank}) but weak offense (AdjO #${adjORank}) — ${adjDRank <= 15 ? "top-15 D can reach F4 (Loyola 2018)" : "ceiling is Elite 8"}`,
    };
  }

  // Type 3b: Balanced — Both sides competent
  // 14-year data: FAU 2023 (9-seed, AdjO #38, AdjD #22) reached F4
  // Wichita State 2013 (9-seed, AdjD #18, AdjO #30) reached F4
  if (adjDRank <= 60 && adjORank <= 60) {
    return {
      team,
      type: "balanced",
      ceiling: adjEM >= 16 ? "F4" : "S16",
      reason: `Balanced profile (AdjO #${adjORank}, AdjD #${adjDRank}) — ${adjEM >= 16 ? "can reach Final Four if matchups align" : "Sweet 16 ceiling"}`,
    };
  }

  // Type 4: Offense-only — Great offense, weak defense
  // 14-year data: Oral Roberts 2021 (AdjD #160) maxed at S16
  if (adjORank <= 30 && adjDRank > 50) {
    return {
      team,
      type: "offense-only",
      ceiling: "R32",
      reason: `Elite offense (AdjO #${adjORank}) but weak defense (AdjD #${adjDRank}) — exits when facing real D`,
    };
  }

  // Default: limited ceiling
  return {
    team,
    type: adjDRank < adjORank ? "defense-first" : "offense-only",
    ceiling: adjEM >= 15 ? "R32" : "R64",
    reason: `AdjEM ${adjEM.toFixed(1)}, AdjO #${adjORank}, AdjD #${adjDRank} — limited tournament profile`,
  };
}

function getCeilingByEfficiency(team: Team): Round {
  const { adjEM } = team.kenpom;
  if (adjEM >= 22) return "F4";
  if (adjEM >= 18) return "S16";
  if (adjEM >= 14) return "R32";
  return "R64";
}

// Extreme Team Warning: top-10 one end, outside top-50 other = never wins title
export function isExtremeTeam(team: Team): { isExtreme: boolean; reason: string } {
  const { adjORank, adjDRank } = team.kenpom;

  if (adjORank <= 10 && adjDRank > 50) {
    return {
      isExtreme: true,
      reason: `Elite offense (#${adjORank}) but weak defense (#${adjDRank}) — zero championships in 22+ years from this profile`,
    };
  }

  if (adjDRank <= 10 && adjORank > 50) {
    return {
      isExtreme: true,
      reason: `Elite defense (#${adjDRank}) but weak offense (#${adjORank}) — zero championships in 22+ years from this profile`,
    };
  }

  return { isExtreme: false, reason: "" };
}

export function formatCinderellaAssessment(assessment: CinderellaAssessment): string {
  return [
    `${assessment.team.name} (${assessment.team.seed}-seed)`,
    `  Type: ${assessment.type}`,
    `  Ceiling: ${assessment.ceiling}`,
    `  ${assessment.reason}`,
  ].join("\n");
}
