// Types for backtesting and bracket optimization

import { Round, Region } from "../types.js";

export interface HistoricalRegion {
  seeds: Record<number, string>; // seed -> team name
  results: {
    r64: string[]; // 8 winners (order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
    r32: string[]; // 4 winners
    s16: string[]; // 2 winners
    e8: string;    // region champion
  };
}

export interface HistoricalTournament {
  year: number;
  regions: Record<string, HistoricalRegion>; // region name -> data
  regionOrder: string[]; // [region1, region2, region3, region4] for FF matchup pairing
  finalFour: {
    semi1Winner: string; // region1 vs region2
    semi2Winner: string; // region3 vs region4
    champion: string;
  };
}

export interface GameResult {
  year: number;
  round: Round;
  region?: string;
  teamA: string;
  teamB: string;
  winner: string;
  seedA: number;
  seedB: number;
}

export interface AccuracyMetrics {
  totalGames: number;
  correctPicks: number;
  accuracy: number;
  byRound: Record<Round, { correct: number; total: number; accuracy: number }>;
  bySeedMatchup: Record<string, { correct: number; total: number; accuracy: number }>;
  espnScore: number;
}

export interface BacktestResult {
  modelName: string;
  mode: "chalk" | "balanced" | "upset-heavy";
  years: number[];
  bracketMode: AccuracyMetrics;  // propagated bracket simulation
  gameLevel: AccuracyMetrics;    // isolated game-by-game
  perYear: Record<number, { bracketEspn: number; gameAccuracy: number }>;
}

export interface OptimizationResult {
  strategy: "static" | "adaptive";
  bestWeights: Record<string, number>;
  bestMode: "chalk" | "balanced" | "upset-heavy";
  bestEspnScore: number;
  bestGameAccuracy: number;
  // For adaptive strategy
  roundGroupWeights?: Record<string, Record<string, number>>;
  top10: Array<{
    weights: Record<string, number>;
    mode: string;
    espnScore: number;
    gameAccuracy: number;
  }>;
  comparison: {
    default: { espnScore: number; gameAccuracy: number };
    calibrated: { espnScore: number; gameAccuracy: number };
    optimized: { espnScore: number; gameAccuracy: number };
  };
}

// ESPN scoring by round
export const ESPN_POINTS: Record<Round, number> = {
  R64: 10,
  R32: 20,
  S16: 40,
  E8: 80,
  F4: 160,
  Championship: 320,
};

// Round groups for adaptive optimization
export const ROUND_GROUPS = {
  early: ["R64", "R32"] as Round[],
  mid: ["S16", "E8"] as Round[],
  late: ["F4", "Championship"] as Round[],
};
