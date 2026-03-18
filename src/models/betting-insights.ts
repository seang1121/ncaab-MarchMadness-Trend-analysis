// Calibration insights from 892 NCAAB resolved picks in the betting analyzer
// These findings adjust model weights and flags based on REAL performance data

// ============================================================
// KEY INSIGHT 1: WHAT ACTUALLY PREDICTS WINS (stat differential W-L)
// ============================================================
// The betting analyzer's 892 NCAAB picks reveal which stats ACTUALLY
// differentiate wins from losses, regardless of what the model weights say.
//
// PREDICTIVE (positive differential = stat present → more wins):
//   1. Injuries (+1.621) — BY FAR the most predictive. Injury awareness = edge.
//   2. ATS Performance (+1.562) — Teams covering spreads = undervalued by market
//   3. Defensive Efficiency (+1.040) — Defense matters more than offense
//   4. Conference Strength (+0.787) — Power conferences have real edge
//
// NOT PREDICTIVE or ANTI-PREDICTIVE (negative differential):
//   - Shooting % (-3.372) — HIGH shooting % actually LOSES more! Unsustainable
//   - 3PT Shooting (-2.764) — Same: 3PT hot = regression incoming
//   - Offensive Rebounding (-2.288) — Offensive boards don't predict wins
//   - Offensive Efficiency (-2.171) — Offense is OVERVALUED by conventional analysis
//   - Rebounding Margin (-0.872) — Less useful than expected
//
// CRITICAL TAKEAWAY: Our KenPom model weights offense and defense equally,
// but the data says DEFENSE is 3x more predictive than offense for NCAAB wins.
// The Defensive Identity Model should carry MORE weight.

export const STAT_DIFFERENTIALS = {
  injuries: +1.621,
  ats_performance: +1.562,
  defensive_efficiency: +1.040,
  conference_strength: +0.787,
  combined_ppg: +0.479,
  free_throw_pct: +0.180,
  block_rate: +0.106,
  turnover_diff: -0.009,
  home_court_advantage: -0.045,
  steal_rate: -0.089,
  pace_matchup: -0.217,
  win_pct: -0.254,
  rebounding_margin: -0.872,
  offensive_efficiency: -2.171,
  off_rebounding: -2.288,
  three_pt_shooting: -2.764,
  shooting_pct: -3.372,
} as const;

// ============================================================
// KEY INSIGHT 2: MONEYLINE IS THE EDGE (bet type performance)
// ============================================================
// Moneyline: 63.9% overall — the model is good at picking WINNERS
// Spread: 50.8% overall — near coin flip (market is efficient)
// Totals: 50.6% overall — near coin flip
//
// FOR BRACKETS: This is great news. Brackets are MONEYLINE bets
// (pick the winner, not the margin). Our model's 63.9% moneyline
// accuracy directly applies to bracket predictions.
//
// Sweet spot: moneyline at 55-64% confidence → 67.2% actual win rate
// This means our model is UNDERCONFIDENT in the 55-64% range —
// when we say 60%, it's actually closer to 67%.

export const MONEYLINE_CALIBRATION = {
  under55: { modelProb: 0.50, actualWinRate: 0.578 },
  range55to64: { modelProb: 0.595, actualWinRate: 0.672 },
  over65: { modelProb: 0.72, actualWinRate: 0.648 },
} as const;

// ============================================================
// KEY INSIGHT 3: MORE EDGES ≠ MORE WINS
// ============================================================
// 3-4 edges: 56.6% win rate (BEST!)
// 5-7 edges: 53.6%
// 8+ edges: 52.4%
// <3 edges: 53.1%
//
// COUNTERINTUITIVE: Fewer, stronger edges beat many weak edges.
// When too many stats align, it often means the line is already
// efficient (market priced it in). 3-4 strong edges = the sweet spot.
//
// FOR BRACKETS: Don't just count how many models agree.
// Look for 2-3 STRONG signals, not 5 weak ones.

export const EDGE_COUNT_INSIGHT = {
  optimal: "3-4 edges",
  bestWinRate: 0.566,
  tooManyEdgesWinRate: 0.524,
  takeaway: "Quality over quantity — 3-4 strong signals beat 8+ weak ones",
} as const;

// ============================================================
// KEY INSIGHT 4: MARCH IS BETTER THAN REGULAR SEASON
// ============================================================
// March: 458 picks at 56.8% win rate
// February: 434 picks at 50.2% win rate
//
// The model performs 6.6% BETTER during tournament time.
// This likely means tournament games have more exploitable
// inefficiencies (neutral sites, single elimination pressure,
// fatigue, travel) that our stat-based approach captures well.

export const TOURNAMENT_BOOST = {
  marchAccuracy: 0.568,
  februaryAccuracy: 0.502,
  differential: 0.066,
  implication: "Tournament dynamics favor stat-based analysis — our approach has an edge in March",
} as const;

// ============================================================
// KEY INSIGHT 5: RECOMMENDED MODEL WEIGHT ADJUSTMENTS
// ============================================================
// Based on all findings, adjust ensemble weights from defaults:

export const CALIBRATED_WEIGHTS = {
  "KenPom Efficiency": 0.25,     // DOWN from 0.30 — offense is overvalued
  "Defensive Identity": 0.28,    // UP from 0.20 — defense is 3x more predictive
  "Market Intelligence": 0.20,   // SAME — market info is valuable
  "Tempo & Matchup": 0.12,      // DOWN from 0.15 — pace is slightly anti-predictive
  "Seed & History": 0.15,       // SAME — structural patterns hold
} as const;

// Apply these to the ensemble for "calibrated" mode
export function getCalibratedWeights(): Record<string, number> {
  return { ...CALIBRATED_WEIGHTS };
}
