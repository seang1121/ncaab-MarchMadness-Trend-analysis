import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { Team, Round } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const ensemble = new EnsembleModel(getCalibratedWeights());
  const teams = data.teams as Team[];

  function showMatchup(nameA: string, nameB: string, round: Round) {
    const a = teams.find((t) => t.name === nameA)!;
    const b = teams.find((t) => t.name === nameB)!;
    if (!a || !b) { console.log(`Missing: ${nameA} or ${nameB}`); return; }

    const pred = ensemble.predict(a, b, round);
    console.log(`\n=== ${nameA} (${a.seed}) vs ${nameB} (${b.seed}) — ${round} ===`);
    console.log(`  ${nameA}: ${(pred.finalProbA * 100).toFixed(1)}%  |  ${nameB}: ${(pred.finalProbB * 100).toFixed(1)}%`);
    console.log(`  Winner: ${pred.predictedWinner.name} (confidence: ${(pred.confidence * 100).toFixed(1)}%)`);
    console.log(`  Model agreement: ${(pred.agreement * 100).toFixed(0)}%`);
    console.log("  Per-model breakdown:");
    for (const mp of pred.modelPredictions) {
      const winner = mp.winProbA >= 0.5 ? nameA : nameB;
      const prob = Math.max(mp.winProbA, mp.winProbB);
      console.log(`    ${mp.model.padEnd(22)} → ${winner} ${(prob * 100).toFixed(1)}%`);
    }
  }

  // Verify the key picks from our 5 brackets
  console.log("VERIFYING KEY BRACKET PICKS AGAINST MODEL\n");

  showMatchup("St. John's", "Kansas", "R32");       // upset in all 5 brackets
  showMatchup("Texas Tech", "Alabama", "R32");       // upset in all 5 brackets
  showMatchup("Vanderbilt", "Nebraska", "R32");      // upset in all 5 brackets
  showMatchup("Iowa", "Clemson", "R64");             // upset in all 5 brackets
  showMatchup("Duke", "Michigan", "Championship");   // bracket 2 champion pick
  showMatchup("Houston", "Florida", "E8");           // bracket 4 key upset
  showMatchup("Illinois", "Houston", "S16");         // bracket 5 key upset
  showMatchup("Utah St.", "Villanova", "R64");       // close call
  showMatchup("Duke", "Connecticut", "E8");          // East region final
  showMatchup("Arizona", "Purdue", "E8");            // West region final
}

main().then(() => process.exit(0));
