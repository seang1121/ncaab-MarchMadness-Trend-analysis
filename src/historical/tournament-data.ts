// Historical tournament data: 14 tournaments (2011-2019, 2021-2025)
// 2020 cancelled due to COVID-19
// Sources: BartTorvik/KenPom approximate end-of-season ratings

import { Round } from "../types.js";

export interface ChampionProfile {
  year: number;
  name: string;
  seed: number;
  conference: string;
  isPowerConference: boolean;
  kenpomRank: number;
  adjEM: number;
  adjORank: number;
  adjDRank: number;
  sosRank: number;
  ftRateRank: number;
  notes: string;
}

export interface FinalFourEntry {
  year: number;
  name: string;
  seed: number;
  conference: string;
  result: "Champion" | "Runner-Up" | "Final Four";
}

export interface DeepRunEntry {
  year: number;
  name: string;
  seed: number;
  conference: string;
  deepestRound: Round;
  adjEM: number;
  adjDRank: number;
  adjORank: number;
  notes: string;
}

// ============================================================
// ALL 14 CHAMPIONS (2011-2019, 2021-2025)
// ============================================================
// 2014 UConn is the critical outlier: 7-seed, AAC, KenPom ~#18
// 2011 UConn is secondary outlier: 3-seed, KenPom ~#16

export const CHAMPIONS: ChampionProfile[] = [
  {
    year: 2011, name: "Connecticut", seed: 3, conference: "Big East",
    isPowerConference: true, kenpomRank: 16, adjEM: 20.5,
    adjORank: 18, adjDRank: 22, sosRank: 12, ftRateRank: 30,
    notes: "Kemba Walker carry job — 5 wins in 5 days at Big East Tournament before NCAA run",
  },
  {
    year: 2012, name: "Kentucky", seed: 1, conference: "SEC",
    isPowerConference: true, kenpomRank: 1, adjEM: 32.2,
    adjORank: 2, adjDRank: 2, sosRank: 10, ftRateRank: 8,
    notes: "Anthony Davis — most dominant freshmen class in modern history",
  },
  {
    year: 2013, name: "Louisville", seed: 1, conference: "Big East",
    isPowerConference: true, kenpomRank: 4, adjEM: 28.9,
    adjORank: 12, adjDRank: 5, sosRank: 15, ftRateRank: 3,
    notes: "Rick Pitino's press defense — elite FT rate and defensive identity",
  },
  {
    year: 2014, name: "Connecticut", seed: 7, conference: "AAC",
    isPowerConference: false, kenpomRank: 18, adjEM: 18.7,
    adjORank: 35, adjDRank: 24, sosRank: 42, ftRateRank: 45,
    notes: "BREAKS GATES: 7-seed, AAC, KenPom #18, AdjEM +18.7 — Shabazz Napier tournament mode",
  },
  {
    year: 2015, name: "Duke", seed: 1, conference: "ACC",
    isPowerConference: true, kenpomRank: 3, adjEM: 29.3,
    adjORank: 3, adjDRank: 14, sosRank: 8, ftRateRank: 12,
    notes: "Jahlil Okafor + Tyus Jones — freshmen-led like 2012 Kentucky",
  },
  {
    year: 2016, name: "Villanova", seed: 2, conference: "Big East",
    isPowerConference: true, kenpomRank: 1, adjEM: 28.8,
    adjORank: 1, adjDRank: 10, sosRank: 20, ftRateRank: 18,
    notes: "Kris Jenkins buzzer-beater — elite shooting + balanced defense",
  },
  {
    year: 2017, name: "North Carolina", seed: 1, conference: "ACC",
    isPowerConference: true, kenpomRank: 3, adjEM: 28.7,
    adjORank: 2, adjDRank: 14, sosRank: 5, ftRateRank: 15,
    notes: "Redemption after 2016 loss — Joel Berry II carried in final games",
  },
  {
    year: 2018, name: "Villanova", seed: 1, conference: "Big East",
    isPowerConference: true, kenpomRank: 1, adjEM: 31.1,
    adjORank: 1, adjDRank: 13, sosRank: 18, ftRateRank: 10,
    notes: "Most dominant since 2012 Kentucky — won all 6 games by 12+ points",
  },
  {
    year: 2019, name: "Virginia", seed: 1, conference: "ACC",
    isPowerConference: true, kenpomRank: 1, adjEM: 31.3,
    adjORank: 3, adjDRank: 4, sosRank: 12, ftRateRank: 5,
    notes: "Slowest tempo champion — compressed games, elite FT rate absorbed variance",
  },
  {
    year: 2021, name: "Baylor", seed: 1, conference: "Big 12",
    isPowerConference: true, kenpomRank: 1, adjEM: 29.4,
    adjORank: 3, adjDRank: 4, sosRank: 10, ftRateRank: 20,
    notes: "Three elite guards — no single defensive assignment solved them",
  },
  {
    year: 2022, name: "Kansas", seed: 1, conference: "Big 12",
    isPowerConference: true, kenpomRank: 3, adjEM: 27.6,
    adjORank: 11, adjDRank: 4, sosRank: 8, ftRateRank: 15,
    notes: "Depth + second-half adjustments — erased 16-point deficit in championship",
  },
  {
    year: 2023, name: "Connecticut", seed: 4, conference: "Big East",
    isPowerConference: true, kenpomRank: 2, adjEM: 27.4,
    adjORank: 4, adjDRank: 7, sosRank: 12, ftRateRank: 8,
    notes: "Won every game by 13+ — first team to do that since 64-team field",
  },
  {
    year: 2024, name: "Connecticut", seed: 1, conference: "Big East",
    isPowerConference: true, kenpomRank: 1, adjEM: 34.1,
    adjORank: 1, adjDRank: 4, sosRank: 5, ftRateRank: 6,
    notes: "+140 point differential — most dominant single-tournament performance ever",
  },
  {
    year: 2025, name: "Florida", seed: 1, conference: "SEC",
    isPowerConference: true, kenpomRank: 3, adjEM: 30.2,
    adjORank: 4, adjDRank: 4, sosRank: 6, ftRateRank: 1,
    notes: "Top-4 both ends + #1 FT rate — two-way excellence with variance absorption",
  },
];

// ============================================================
// ALL FINAL FOUR APPEARANCES (56 entries)
// ============================================================

export const FINAL_FOURS: FinalFourEntry[] = [
  // 2011
  { year: 2011, name: "Connecticut", seed: 3, conference: "Big East", result: "Champion" },
  { year: 2011, name: "Butler", seed: 8, conference: "Horizon", result: "Runner-Up" },
  { year: 2011, name: "Kentucky", seed: 4, conference: "SEC", result: "Final Four" },
  { year: 2011, name: "VCU", seed: 11, conference: "CAA", result: "Final Four" },
  // 2012
  { year: 2012, name: "Kentucky", seed: 1, conference: "SEC", result: "Champion" },
  { year: 2012, name: "Kansas", seed: 2, conference: "Big 12", result: "Runner-Up" },
  { year: 2012, name: "Louisville", seed: 4, conference: "Big East", result: "Final Four" },
  { year: 2012, name: "Ohio State", seed: 2, conference: "Big Ten", result: "Final Four" },
  // 2013
  { year: 2013, name: "Louisville", seed: 1, conference: "Big East", result: "Champion" },
  { year: 2013, name: "Michigan", seed: 4, conference: "Big Ten", result: "Runner-Up" },
  { year: 2013, name: "Syracuse", seed: 4, conference: "Big East", result: "Final Four" },
  { year: 2013, name: "Wichita State", seed: 9, conference: "MVC", result: "Final Four" },
  // 2014
  { year: 2014, name: "Connecticut", seed: 7, conference: "AAC", result: "Champion" },
  { year: 2014, name: "Kentucky", seed: 8, conference: "SEC", result: "Runner-Up" },
  { year: 2014, name: "Florida", seed: 1, conference: "SEC", result: "Final Four" },
  { year: 2014, name: "Wisconsin", seed: 2, conference: "Big Ten", result: "Final Four" },
  // 2015
  { year: 2015, name: "Duke", seed: 1, conference: "ACC", result: "Champion" },
  { year: 2015, name: "Wisconsin", seed: 1, conference: "Big Ten", result: "Runner-Up" },
  { year: 2015, name: "Kentucky", seed: 1, conference: "SEC", result: "Final Four" },
  { year: 2015, name: "Michigan State", seed: 7, conference: "Big Ten", result: "Final Four" },
  // 2016
  { year: 2016, name: "Villanova", seed: 2, conference: "Big East", result: "Champion" },
  { year: 2016, name: "North Carolina", seed: 1, conference: "ACC", result: "Runner-Up" },
  { year: 2016, name: "Oklahoma", seed: 2, conference: "Big 12", result: "Final Four" },
  { year: 2016, name: "Syracuse", seed: 10, conference: "ACC", result: "Final Four" },
  // 2017
  { year: 2017, name: "North Carolina", seed: 1, conference: "ACC", result: "Champion" },
  { year: 2017, name: "Gonzaga", seed: 1, conference: "WCC", result: "Runner-Up" },
  { year: 2017, name: "Oregon", seed: 3, conference: "Pac-12", result: "Final Four" },
  { year: 2017, name: "South Carolina", seed: 7, conference: "SEC", result: "Final Four" },
  // 2018
  { year: 2018, name: "Villanova", seed: 1, conference: "Big East", result: "Champion" },
  { year: 2018, name: "Michigan", seed: 3, conference: "Big Ten", result: "Runner-Up" },
  { year: 2018, name: "Kansas", seed: 1, conference: "Big 12", result: "Final Four" },
  { year: 2018, name: "Loyola Chicago", seed: 11, conference: "MVC", result: "Final Four" },
  // 2019
  { year: 2019, name: "Virginia", seed: 1, conference: "ACC", result: "Champion" },
  { year: 2019, name: "Texas Tech", seed: 3, conference: "Big 12", result: "Runner-Up" },
  { year: 2019, name: "Auburn", seed: 5, conference: "SEC", result: "Final Four" },
  { year: 2019, name: "Michigan State", seed: 2, conference: "Big Ten", result: "Final Four" },
  // 2021
  { year: 2021, name: "Baylor", seed: 1, conference: "Big 12", result: "Champion" },
  { year: 2021, name: "Gonzaga", seed: 1, conference: "WCC", result: "Runner-Up" },
  { year: 2021, name: "Houston", seed: 2, conference: "AAC", result: "Final Four" },
  { year: 2021, name: "UCLA", seed: 11, conference: "Pac-12", result: "Final Four" },
  // 2022
  { year: 2022, name: "Kansas", seed: 1, conference: "Big 12", result: "Champion" },
  { year: 2022, name: "North Carolina", seed: 8, conference: "ACC", result: "Runner-Up" },
  { year: 2022, name: "Villanova", seed: 2, conference: "Big East", result: "Final Four" },
  { year: 2022, name: "Duke", seed: 2, conference: "ACC", result: "Final Four" },
  // 2023
  { year: 2023, name: "Connecticut", seed: 4, conference: "Big East", result: "Champion" },
  { year: 2023, name: "San Diego State", seed: 5, conference: "MWC", result: "Runner-Up" },
  { year: 2023, name: "FAU", seed: 9, conference: "CUSA", result: "Final Four" },
  { year: 2023, name: "Miami", seed: 5, conference: "ACC", result: "Final Four" },
  // 2024
  { year: 2024, name: "Connecticut", seed: 1, conference: "Big East", result: "Champion" },
  { year: 2024, name: "Purdue", seed: 1, conference: "Big Ten", result: "Runner-Up" },
  { year: 2024, name: "Alabama", seed: 1, conference: "SEC", result: "Final Four" },
  { year: 2024, name: "NC State", seed: 11, conference: "ACC", result: "Final Four" },
  // 2025
  { year: 2025, name: "Florida", seed: 1, conference: "SEC", result: "Champion" },
  { year: 2025, name: "Houston", seed: 1, conference: "Big 12", result: "Runner-Up" },
  { year: 2025, name: "Auburn", seed: 1, conference: "SEC", result: "Final Four" },
  { year: 2025, name: "Duke", seed: 2, conference: "ACC", result: "Final Four" },
];

// ============================================================
// NOTABLE DOUBLE-DIGIT SEED DEEP RUNS (for Cinderella analysis)
// ============================================================

export const DEEP_RUNS: DeepRunEntry[] = [
  // Final Four runs by double-digit seeds
  { year: 2011, name: "VCU", seed: 11, conference: "CAA", deepestRound: "F4",
    adjEM: 16.2, adjDRank: 28, adjORank: 35, notes: "Shaka Smart havoc press — defense-first run" },
  { year: 2013, name: "Wichita State", seed: 9, conference: "MVC", deepestRound: "F4",
    adjEM: 19.8, adjDRank: 18, adjORank: 30, notes: "Balanced profile with elite defense" },
  { year: 2014, name: "Kentucky", seed: 8, conference: "SEC", deepestRound: "Championship",
    adjEM: 20.1, adjDRank: 12, adjORank: 18, notes: "8-seed reaching championship game — young roster peaked in March" },
  { year: 2015, name: "Michigan State", seed: 7, conference: "Big Ten", deepestRound: "F4",
    adjEM: 22.5, adjDRank: 15, adjORank: 20, notes: "Izzo March magic — power conference 7-seed mis-seed" },
  { year: 2016, name: "Syracuse", seed: 10, conference: "ACC", deepestRound: "F4",
    adjEM: 14.8, adjDRank: 32, adjORank: 42, notes: "Jim Boeheim zone defense — ACC power conference mis-seed" },
  { year: 2017, name: "South Carolina", seed: 7, conference: "SEC", deepestRound: "F4",
    adjEM: 15.3, adjDRank: 20, adjORank: 55, notes: "Defense-first identity — SEC pedigree" },
  { year: 2018, name: "Loyola Chicago", seed: 11, conference: "MVC", deepestRound: "F4",
    adjEM: 18.5, adjDRank: 8, adjORank: 65, notes: "Elite defense (#8), weak offense — classic defense-first Cinderella" },
  { year: 2021, name: "UCLA", seed: 11, conference: "Pac-12", deepestRound: "F4",
    adjEM: 17.9, adjDRank: 25, adjORank: 32, notes: "Power conference mis-seed — KenPom top 20, Pac-12 pedigree" },
  { year: 2022, name: "North Carolina", seed: 8, conference: "ACC", deepestRound: "Championship",
    adjEM: 20.8, adjDRank: 18, adjORank: 14, notes: "ACC 8-seed reaching championship — Hubert Davis first year" },
  { year: 2022, name: "Saint Peter's", seed: 15, conference: "MAAC", deepestRound: "E8",
    adjEM: 4.2, adjDRank: 48, adjORank: 120, notes: "15-seed Elite 8 — defense + slow tempo compressed games" },
  { year: 2023, name: "FAU", seed: 9, conference: "CUSA", deepestRound: "F4",
    adjEM: 17.8, adjDRank: 22, adjORank: 38, notes: "KenPom #17 — massively under-seeded by committee" },
  { year: 2024, name: "NC State", seed: 11, conference: "ACC", deepestRound: "F4",
    adjEM: 14.2, adjDRank: 38, adjORank: 35, notes: "ACC Tournament champion — hot streak carry job" },
  // Notable Elite 8 / Sweet 16 runs
  { year: 2011, name: "Butler", seed: 8, conference: "Horizon", deepestRound: "Championship",
    adjEM: 17.5, adjDRank: 16, adjORank: 40, notes: "8-seed runner-up — second consecutive championship game" },
  { year: 2012, name: "Ohio", seed: 13, conference: "MAC", deepestRound: "R32",
    adjEM: 8.5, adjDRank: 55, adjORank: 48, notes: "13-seed upset of 4-seed Michigan — high variance" },
  { year: 2021, name: "Oral Roberts", seed: 15, conference: "Summit", deepestRound: "S16",
    adjEM: 5.1, adjDRank: 160, adjORank: 5, notes: "15-seed S16 — pure offense (Max Abmas), no defense" },
  { year: 2023, name: "Princeton", seed: 15, conference: "Ivy", deepestRound: "S16",
    adjEM: 6.8, adjDRank: 13, adjORank: 145, notes: "15-seed S16 — elite defense, slow tempo, held Arizona to 4/25 from 3" },
];

// ============================================================
// PRE-CALCULATED 14-YEAR SEED ADVANCEMENT RATES
// ============================================================
// Based on 56 teams per seed (4 per year * 14 years)
// These replace the 6-year rates in seed-patterns.ts

export const SEED_ADVANCEMENT_14Y: Record<number, Record<Round, number>> = {
  1:  { R64: 0.982, R32: 0.929, S16: 0.714, E8: 0.482, F4: 0.321, Championship: 0.161 },
  2:  { R64: 0.929, R32: 0.768, S16: 0.482, E8: 0.268, F4: 0.143, Championship: 0.071 },
  3:  { R64: 0.857, R32: 0.571, S16: 0.286, E8: 0.143, F4: 0.054, Championship: 0.018 },
  4:  { R64: 0.804, R32: 0.500, S16: 0.250, E8: 0.125, F4: 0.054, Championship: 0.018 },
  5:  { R64: 0.661, R32: 0.411, S16: 0.179, E8: 0.089, F4: 0.054, Championship: 0.018 },
  6:  { R64: 0.625, R32: 0.304, S16: 0.089, E8: 0.036, F4: 0.018, Championship: 0.000 },
  7:  { R64: 0.607, R32: 0.286, S16: 0.089, E8: 0.036, F4: 0.036, Championship: 0.018 },
  8:  { R64: 0.500, R32: 0.232, S16: 0.071, E8: 0.036, F4: 0.018, Championship: 0.018 },
  9:  { R64: 0.500, R32: 0.214, S16: 0.054, E8: 0.018, F4: 0.018, Championship: 0.000 },
  10: { R64: 0.393, R32: 0.179, S16: 0.054, E8: 0.018, F4: 0.018, Championship: 0.000 },
  11: { R64: 0.375, R32: 0.214, S16: 0.125, E8: 0.054, F4: 0.071, Championship: 0.000 },
  12: { R64: 0.339, R32: 0.125, S16: 0.036, E8: 0.018, F4: 0.000, Championship: 0.000 },
  13: { R64: 0.196, R32: 0.054, S16: 0.000, E8: 0.000, F4: 0.000, Championship: 0.000 },
  14: { R64: 0.143, R32: 0.036, S16: 0.000, E8: 0.000, F4: 0.000, Championship: 0.000 },
  15: { R64: 0.089, R32: 0.036, S16: 0.036, E8: 0.018, F4: 0.000, Championship: 0.000 },
  16: { R64: 0.036, R32: 0.000, S16: 0.000, E8: 0.000, F4: 0.000, Championship: 0.000 },
};

// ============================================================
// PRE-CALCULATED 14-YEAR R64 UPSET RATES
// ============================================================

export const R64_UPSETS_14Y: Record<string, number> = {
  "1v16": 0.036,   // 2/56 — UMBC 2018, FDU 2023
  "2v15": 0.089,   // 5/56 — increasing trend
  "3v14": 0.143,   // 8/56
  "4v13": 0.196,   // 11/56
  "5v12": 0.339,   // 19/56 — one of the most reliable upset spots
  "6v11": 0.375,   // 21/56 — 11-seeds are often power conference mis-seeds
  "7v10": 0.393,   // 22/56
  "8v9":  0.500,   // 28/56 — true coin flip
};

// Convenience: all tournament years in the dataset
export const TOURNAMENT_YEARS = [
  2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025,
] as const;

export const TOTAL_TOURNAMENTS = TOURNAMENT_YEARS.length; // 14

// Strong mid-major conferences that produced champions or deep runs
export const STRONG_MID_MAJORS = ["AAC", "MWC", "WCC", "MVC"] as const;
