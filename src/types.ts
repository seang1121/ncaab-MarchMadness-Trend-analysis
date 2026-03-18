// Core types for March Madness Bracket Analyzer

export type Region = "East" | "West" | "South" | "Midwest";
export type Round = "R64" | "R32" | "S16" | "E8" | "F4" | "Championship";

export const ROUNDS_IN_ORDER: Round[] = ["R64", "R32", "S16", "E8", "F4", "Championship"];
export const POWER_CONFERENCES = ["ACC", "SEC", "Big 12", "Big Ten", "Big East"] as const;

export interface KenPomData {
  rank: number;
  adjEM: number;
  adjO: number;
  adjORank: number;
  adjD: number;
  adjDRank: number;
  adjTempo: number;
  adjTempoRank: number;
  sosRank: number;
  ftRate?: number;
  ftRateRank?: number;
  efgPct?: number;
  tovRate?: number;
  orbRate?: number;
}

export interface Team {
  name: string;
  seed: number;
  region: Region;
  conference: string;
  kenpom: KenPomData;
  isPowerConference: boolean;
  isFirstFourWinner: boolean;
  coachTourneyApps?: number;
}

export interface Matchup {
  round: Round;
  region: Region;
  slotIndex: number;
  teamA: Team;
  teamB: Team;
  winner?: Team;
}

export interface RegionBracket {
  region: Region;
  teams: Team[];
  picks: {
    r64: string[];
    r32: string[];
    s16: string[];
    e8: string[];
  };
}

export interface Bracket {
  year: number;
  regions: Record<Region, RegionBracket>;
  finalFour: {
    semi1: { team1Region: Region; team2Region: Region; winner: string };
    semi2: { team1Region: Region; team2Region: Region; winner: string };
  };
  champion: string;
}

export interface ChampionGateResult {
  team: Team;
  passes: boolean;
  gatesPassed: string[];
  gatesFailed: string[];
  score: number;
}

export type CinderellaType = "mis-seed" | "defense-first" | "balanced" | "offense-only" | "carry-job";

export interface CinderellaAssessment {
  team: Team;
  type: CinderellaType;
  ceiling: Round;
  reason: string;
}

export type FlagSeverity = "error" | "warning" | "info" | "good";

export interface AnalysisFlag {
  severity: FlagSeverity;
  round: Round;
  matchup?: { teamA: string; teamB: string; winner: string };
  rule: string;
  message: string;
}

export interface ATSEdge {
  matchup: string;
  edge: string;
  historicalRecord: string;
  atsPercent: number;
  action: "bet" | "fade" | "lean";
}

export interface AnalysisResult {
  overallScore: number;
  championViability: ChampionGateResult;
  roundBreakdowns: {
    round: Round;
    score: number;
    flags: AnalysisFlag[];
  }[];
  atsEdges: ATSEdge[];
  cinderellaAssessments: CinderellaAssessment[];
  flags: AnalysisFlag[];
}

export interface MatchupPrediction {
  teamA: Team;
  teamB: Team;
  winProbA: number;
  winProbB: number;
  predictedWinner: Team;
  confidence: number;
  factors: string[];
}

export interface GeneratedBracket {
  mode: "chalk" | "balanced" | "upset-heavy";
  bracket: Bracket;
  analysis: AnalysisResult;
  upsetCount: number;
}

export interface TeamsData {
  asOf: string;
  source: string;
  teams: Team[];
}
