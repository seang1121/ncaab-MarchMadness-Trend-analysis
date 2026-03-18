// Multi-model bracket prediction system
// Each model approaches predictions from a different angle to avoid tunnel vision

export { KenPomModel } from "./kenpom-model.js";
export { MarketModel } from "./market-model.js";
export { TempoMatchupModel } from "./tempo-matchup-model.js";
export { SeedHistoryModel } from "./seed-history-model.js";
export { DefensiveIdentityModel } from "./defensive-identity-model.js";
export { EnsembleModel } from "./ensemble-model.js";

import { Team, Round, MatchupPrediction } from "../types.js";

// Standard interface all models implement
export interface PredictionModel {
  name: string;
  description: string;
  weight: number; // ensemble weight (0-1)
  predict(teamA: Team, teamB: Team, round: Round): ModelPrediction;
}

export interface ModelPrediction {
  model: string;
  winProbA: number;
  winProbB: number;
  confidence: number;
  factors: string[];
}

export interface EnsemblePrediction {
  teamA: Team;
  teamB: Team;
  round: Round;
  finalProbA: number;
  finalProbB: number;
  predictedWinner: Team;
  confidence: number;
  modelPredictions: ModelPrediction[];
  agreement: number; // 0-1, how much models agree
  factors: string[];
}
