// Find upset opportunities the smart builder DIDN'T pick
// Look for games where the underdog has a real shot but we went chalk

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { monteCarloSimulate } from "../src/engine/monte-carlo.js";
import { Team, Round } from "../src/types.js";

const R64_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];
  const ensemble = new EnsembleModel(getCalibratedWeights());

  // Run MC to get advancement probs
  console.log("Running 10K sims for advancement data...\n");
  const mc = monteCarloSimulate(teams, ensemble, 10000);

  const regions = ["East", "West", "South", "Midwest"];

  console.log("=== ALL R64 MATCHUPS — Upset Probability ===\n");
  console.log("Region    Matchup                                    Fav%  Dog%  Dog S16%  Dog E8%  Verdict");
  console.log("-".repeat(100));

  const missedUpsets: Array<{
    region: string; fav: Team; dog: Team; round: string;
    favProb: number; dogProb: number; dogS16: number; dogE8: number;
  }> = [];

  for (const region of regions) {
    const regionTeams = teams.filter((t) => t.region === region && t.seed > 0);
    const bySeed: Record<number, Team> = {};
    for (const t of regionTeams) bySeed[t.seed] = t;

    for (const [high, low] of R64_MATCHUPS) {
      const fav = bySeed[high];
      const dog = bySeed[low];
      if (!fav || !dog) continue;

      const pred = ensemble.predict(fav, dog, "R64");
      const favProb = pred.finalProbA;
      const dogProb = 1 - favProb;

      const dogAdv = mc.advancement.get(dog.name);
      const dogS16 = dogAdv?.s16 || 0;
      const dogE8 = dogAdv?.e8 || 0;

      // Did our brackets pick this upset?
      const ourPick = favProb >= 0.5 ? "CHALK" : "UPSET";
      const shouldConsider = dogProb > 0.25 && ourPick === "CHALK";

      let verdict = ourPick;
      if (shouldConsider) {
        verdict = `CHALK ← MISSED? (${(dogProb * 100).toFixed(0)}% upset chance)`;
      }

      const line = `${region.padEnd(10)}${fav.seed}-${fav.name.padEnd(18)} vs ${dog.seed}-${dog.name.padEnd(18)} ${(favProb * 100).toFixed(0).padStart(3)}%  ${(dogProb * 100).toFixed(0).padStart(3)}%  ${(dogS16 * 100).toFixed(1).padStart(6)}%  ${(dogE8 * 100).toFixed(1).padStart(5)}%  ${verdict}`;
      console.log(line);

      if (shouldConsider) {
        missedUpsets.push({ region, fav, dog, round: "R64", favProb, dogProb, dogS16, dogE8 });
      }
    }
  }

  // Also check R32 potential upsets (5v4, 6v3, 7v2 matchups likely)
  console.log("\n=== POTENTIAL R32 UPSETS WE MIGHT BE MISSING ===\n");
  console.log("These are matchups where a lower seed could beat a higher seed in R32:\n");

  // Simulate likely R32 matchups based on R64 favorites
  for (const region of regions) {
    const regionTeams = teams.filter((t) => t.region === region && t.seed > 0);
    const bySeed: Record<number, Team> = {};
    for (const t of regionTeams) bySeed[t.seed] = t;

    // R32 matchups if favorites win: 1v8, 5v4, 6v3, 7v2
    const r32Pairs: [number, number][] = [[1, 8], [5, 4], [6, 3], [7, 2]];

    for (const [seedA, seedB] of r32Pairs) {
      const a = bySeed[seedA];
      const b = bySeed[seedB];
      if (!a || !b) continue;

      const pred = ensemble.predict(a, b, "R32");
      const probA = pred.finalProbA;
      const underdog = seedA > seedB ? a : b;
      const dogProb = underdog === a ? probA : 1 - probA;

      if (dogProb > 0.35 && seedA !== seedB) {
        const dogAdv = mc.advancement.get(underdog.name);
        console.log(`  ${region}: ${seedA}-${a.name} vs ${seedB}-${b.name} → ${underdog.name} has ${(dogProb * 100).toFixed(0)}% upset chance (S16: ${((dogAdv?.s16 || 0) * 100).toFixed(1)}%)`);
      }
    }
  }

  // Check for 11/12 seed Cinderella potential
  console.log("\n=== CINDERELLA WATCH — 10+ seeds with real S16 potential ===\n");
  const cinderellas = [...mc.advancement.entries()]
    .filter(([name, probs]) => {
      const team = teams.find((t) => t.name === name);
      return team && team.seed >= 10 && probs.s16 > 0.02;
    })
    .sort((a, b) => b[1].s16 - a[1].s16);

  for (const [name, probs] of cinderellas) {
    const team = teams.find((t) => t.name === name)!;
    console.log(`  ${team.seed}-seed ${name.padEnd(22)} R32: ${(probs.r32 * 100).toFixed(1)}%  S16: ${(probs.s16 * 100).toFixed(1)}%  E8: ${(probs.e8 * 100).toFixed(1)}%`);
  }

  // Summary
  console.log("\n=== VERDICT ===\n");
  if (missedUpsets.length === 0) {
    console.log("No significant R64 upsets missed. Our brackets caught everything >25%.");
  } else {
    console.log(`Found ${missedUpsets.length} potential upsets we picked chalk on:`);
    for (const m of missedUpsets) {
      console.log(`  ${m.region}: ${m.dog.seed}-${m.dog.name} over ${m.fav.seed}-${m.fav.name} (${(m.dogProb * 100).toFixed(0)}% chance, ${(m.dogS16 * 100).toFixed(1)}% S16 prob)`);
    }
    console.log("\nConsider flipping 1-2 of these in your contrarian brackets (#4 or #5).");
  }
}

main().then(() => process.exit(0));
