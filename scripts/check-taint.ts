// Check for tainted picks: where the ensemble disagrees with the majority of models
// If KenPom+Defense override 3 other models frequently, our calibrated weights may be wrong

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { Team, Round } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // Test with BOTH default and calibrated weights
  const defaultEnsemble = new EnsembleModel();
  const calibratedEnsemble = new EnsembleModel(getCalibratedWeights());

  const R64_MATCHUPS: [number, number][] = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
  ];
  const regions = ["East", "West", "South", "Midwest"];
  const rounds: Round[] = ["R64", "R32"];

  console.log("=== TAINT CHECK: Where calibrated ensemble overrides model majority ===\n");
  console.log("Looking for games where 3+ models pick team A but ensemble picks team B\n");

  let taintCount = 0;
  let totalGames = 0;
  let disagreeDefault = 0;
  let disagreeCalibrated = 0;

  // Check all R64 matchups
  for (const region of regions) {
    const regionTeams = teams.filter((t) => t.region === region && t.seed > 0);
    const bySeed: Record<number, Team> = {};
    for (const t of regionTeams) bySeed[t.seed] = t;

    for (const [high, low] of R64_MATCHUPS) {
      const a = bySeed[high];
      const b = bySeed[low];
      if (!a || !b) continue;

      totalGames++;

      const defPred = defaultEnsemble.predict(a, b, "R64");
      const calPred = calibratedEnsemble.predict(a, b, "R64");

      // Count how many individual models pick A vs B
      const modelsPickA = calPred.modelPredictions.filter((m) => m.winProbA >= 0.5).length;
      const modelsPickB = 5 - modelsPickA;
      const majorityPick = modelsPickA >= 3 ? a.name : b.name;

      const defaultPick = defPred.predictedWinner.name;
      const calibratedPick = calPred.predictedWinner.name;

      if (defaultPick !== majorityPick) disagreeDefault++;
      if (calibratedPick !== majorityPick) disagreeCalibrated++;

      if (calibratedPick !== majorityPick) {
        taintCount++;
        console.log(`  TAINT: ${region} R64 — ${a.name}(${a.seed}) vs ${b.name}(${b.seed})`);
        console.log(`    Models: ${modelsPickA} pick ${a.name}, ${modelsPickB} pick ${b.name}`);
        console.log(`    Majority says: ${majorityPick}`);
        console.log(`    Default ensemble says: ${defaultPick}`);
        console.log(`    Calibrated ensemble says: ${calibratedPick} ← OVERRIDE`);
        for (const mp of calPred.modelPredictions) {
          const pick = mp.winProbA >= 0.5 ? a.name : b.name;
          console.log(`      ${mp.model.padEnd(22)} ${pick.padEnd(20)} ${(Math.max(mp.winProbA, mp.winProbB) * 100).toFixed(1)}% conf:${(mp.confidence * 100).toFixed(0)}%`);
        }
        console.log();
      }
    }
  }

  // Also check the specific upset picks from our brackets
  console.log("=== UPSET PICKS — Default vs Calibrated ===\n");
  const upsetMatchups: Array<[string, string, Round]> = [
    ["St. John's", "Kansas", "R32"],
    ["Texas Tech", "Alabama", "R32"],
    ["Vanderbilt", "Nebraska", "R32"],
    ["Iowa", "Clemson", "R64"],
    ["Utah St.", "Villanova", "R64"],
    ["Saint Louis", "Georgia", "R64"],
  ];

  for (const [nameA, nameB, round] of upsetMatchups) {
    const a = teams.find((t) => t.name === nameA)!;
    const b = teams.find((t) => t.name === nameB)!;
    if (!a || !b) continue;

    const defPred = defaultEnsemble.predict(a, b, round);
    const calPred = calibratedEnsemble.predict(a, b, round);

    const defWinner = defPred.predictedWinner.name;
    const calWinner = calPred.predictedWinner.name;
    const agree = defWinner === calWinner ? "AGREE" : "DISAGREE";

    console.log(`  ${nameA}(${a.seed}) vs ${nameB}(${b.seed}) ${round}:`);
    console.log(`    Default:    ${defWinner} (${(Math.max(defPred.finalProbA, defPred.finalProbB) * 100).toFixed(1)}%)`);
    console.log(`    Calibrated: ${calWinner} (${(Math.max(calPred.finalProbA, calPred.finalProbB) * 100).toFixed(1)}%)  ${agree}`);
    console.log();
  }

  console.log("=== SUMMARY ===");
  console.log(`Total R64 games checked: ${totalGames}`);
  console.log(`Default overrides majority: ${disagreeDefault}/${totalGames} (${(disagreeDefault / totalGames * 100).toFixed(0)}%)`);
  console.log(`Calibrated overrides majority: ${disagreeCalibrated}/${totalGames} (${(disagreeCalibrated / totalGames * 100).toFixed(0)}%)`);
  console.log(`Tainted picks (calibrated != majority): ${taintCount}`);

  if (disagreeCalibrated > disagreeDefault) {
    console.log(`\nWARNING: Calibrated weights override model majority MORE than default.`);
    console.log(`The 28% Defensive Identity weight may be pulling picks away from consensus.`);
  } else {
    console.log(`\nCalibrated weights are NOT causing more overrides than default. Weights look OK.`);
  }
}

main().then(() => process.exit(0));
