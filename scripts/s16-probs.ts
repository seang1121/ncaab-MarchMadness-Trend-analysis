import { monteCarloSimulate } from "../src/engine/monte-carlo.js";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { readFile } from "fs/promises";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const ensemble = new EnsembleModel(getCalibratedWeights());
  console.log("Running 10K sims...");
  const mc = monteCarloSimulate(data.teams, ensemble, 10000);

  const s16Teams = [...mc.advancement.entries()]
    .filter(([, p]) => p.s16 > 0.01)
    .sort((a, b) => b[1].s16 - a[1].s16);

  console.log("\nTeams with >1% chance of making Sweet 16:");
  console.log("Team                          Seed   S16%    E8%    FF%  Champ%");
  console.log("-".repeat(68));
  for (const [name, probs] of s16Teams) {
    const team = data.teams.find((t: any) => t.name === name);
    const seed = team?.seed || "?";
    console.log(
      `${name.padEnd(30)} ${String(seed).padStart(3)}  ${(probs.s16 * 100).toFixed(1).padStart(5)}  ${(probs.e8 * 100).toFixed(1).padStart(5)}  ${(probs.f4 * 100).toFixed(1).padStart(5)}  ${(probs.champ * 100).toFixed(1).padStart(5)}`
    );
  }
  console.log("-".repeat(68));
  console.log(`Total teams with >1% S16 chance:  ${s16Teams.length}`);
  console.log(`Total teams with >5% S16 chance:  ${s16Teams.filter(([, p]) => p.s16 > 0.05).length}`);
  console.log(`Total teams with >10% S16 chance: ${s16Teams.filter(([, p]) => p.s16 > 0.10).length}`);
}

main().then(() => process.exit(0));
