// Generate clean ESPN-friendly pick sheets for all 6 brackets
// Organized exactly how ESPN Tournament Challenge displays: region by region, round by round

import { readFile } from "fs/promises";
import { EnsembleModel } from "../src/models/ensemble-model.js";
import { getCalibratedWeights } from "../src/models/betting-insights.js";
import { buildSmartBracket } from "../src/engine/smart-builder.js";
import { Team } from "../src/types.js";

async function main() {
  const data = JSON.parse(await readFile("data/teams-2026.json", "utf-8"));
  const teams = data.teams as Team[];

  // Apply injuries
  const duke = teams.find((t) => t.name === "Duke");
  if (duke) { duke.kenpom.adjD += 2.5; duke.kenpom.adjDRank += 15; duke.kenpom.adjEM -= 2.5; }
  const louisville = teams.find((t) => t.name === "Louisville");
  if (louisville) { louisville.kenpom.adjO -= 3.0; louisville.kenpom.adjORank += 20; louisville.kenpom.adjEM -= 3.0; }

  const ensemble = new EnsembleModel(getCalibratedWeights());

  const configs = [
    { label: "BRACKET 1: Arizona Champion (SAFE)", pool: "safe" as const, champion: "Arizona", sims: 10000 },
    { label: "BRACKET 2: Michigan Champion (SAFE)", pool: "safe" as const, champion: "Michigan", sims: 10000 },
    { label: "BRACKET 3: Duke Champion (SAFE)", pool: "safe" as const, champion: "Duke", sims: 10000 },
    { label: "BRACKET 4: Michigan Champion (BALANCED)", pool: "balanced" as const, champion: undefined, sims: 10000 },
    { label: "BRACKET 5: Houston Champion (CONTRARIAN)", pool: "contrarian" as const, champion: "Houston", sims: 10000 },
    { label: "BRACKET 6: Illinois Champion (CONTRARIAN)", pool: "contrarian" as const, champion: "Illinois", sims: 10000 },
  ];

  const R64_MATCHUPS = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
  ];

  for (const config of configs) {
    const sb = buildSmartBracket(teams, ensemble, {
      pool: config.pool, champion: config.champion, sims: config.sims,
    });
    const bracket = sb.bracket.bracket;

    console.log("\n" + "=".repeat(70));
    console.log(`  ${config.label}`);
    console.log(`  ${sb.upsetCount} upsets | Fill in on ESPN Tournament Challenge`);
    console.log("=".repeat(70));

    const regions = ["East", "West", "South", "Midwest"];
    for (const region of regions) {
      const rb = bracket.regions[region as any];
      if (!rb) continue;

      const regionTeams = teams.filter((t) => t.region === region);
      const bySeed: Record<number, string> = {};
      for (const t of regionTeams) bySeed[t.seed] = t.name;

      console.log(`\n  --- ${region.toUpperCase()} REGION ---`);
      console.log("  ROUND OF 64 (click the winner for each matchup):");

      for (let i = 0; i < R64_MATCHUPS.length; i++) {
        const [high, low] = R64_MATCHUPS[i];
        const winner = rb.picks.r64[i];
        const isUpset = winner === bySeed[low];
        const marker = isUpset ? " ** UPSET **" : "";
        console.log(`    (${high}) ${(bySeed[high] || "?").padEnd(22)} vs (${low}) ${(bySeed[low] || "?").padEnd(22)} => PICK: ${winner}${marker}`);
      }

      console.log("  ROUND OF 32:");
      // R32 matchups: r64[0] vs r64[1], r64[2] vs r64[3], etc.
      for (let i = 0; i < 4; i++) {
        const teamA = rb.picks.r64[i * 2];
        const teamB = rb.picks.r64[i * 2 + 1];
        const winner = rb.picks.r32[i];
        const aTeam = regionTeams.find((t) => t.name === teamA);
        const bTeam = regionTeams.find((t) => t.name === teamB);
        const isUpset = aTeam && bTeam && winner === (aTeam.seed > bTeam.seed ? aTeam.name : bTeam.name);
        const marker = isUpset ? " ** UPSET **" : "";
        console.log(`    ${teamA.padEnd(22)} vs ${teamB.padEnd(22)} => PICK: ${winner}${marker}`);
      }

      console.log("  SWEET 16:");
      for (let i = 0; i < 2; i++) {
        const teamA = rb.picks.r32[i * 2];
        const teamB = rb.picks.r32[i * 2 + 1];
        const winner = rb.picks.s16[i];
        const aTeam = regionTeams.find((t) => t.name === teamA);
        const bTeam = regionTeams.find((t) => t.name === teamB);
        const isUpset = aTeam && bTeam && winner === (aTeam.seed > bTeam.seed ? aTeam.name : bTeam.name);
        const marker = isUpset ? " ** UPSET **" : "";
        console.log(`    ${teamA.padEnd(22)} vs ${teamB.padEnd(22)} => PICK: ${winner}${marker}`);
      }

      console.log("  ELITE 8:");
      const s16a = rb.picks.s16[0];
      const s16b = rb.picks.s16[1];
      const e8winner = rb.picks.e8[0];
      const aTeam = regionTeams.find((t) => t.name === s16a);
      const bTeam = regionTeams.find((t) => t.name === s16b);
      const isUpset = aTeam && bTeam && e8winner === (aTeam.seed > bTeam.seed ? aTeam.name : bTeam.name);
      const marker = isUpset ? " ** UPSET **" : "";
      console.log(`    ${s16a.padEnd(22)} vs ${s16b.padEnd(22)} => PICK: ${e8winner}${marker}`);
    }

    console.log(`\n  --- FINAL FOUR ---`);
    const e = bracket.regions.East?.picks.e8[0] || "?";
    const w = bracket.regions.West?.picks.e8[0] || "?";
    const s = bracket.regions.South?.picks.e8[0] || "?";
    const mw = bracket.regions.Midwest?.picks.e8[0] || "?";

    console.log(`  SEMI 1: ${e.padEnd(22)} vs ${w.padEnd(22)} => PICK: ${bracket.finalFour.semi1.winner}`);
    console.log(`  SEMI 2: ${s.padEnd(22)} vs ${mw.padEnd(22)} => PICK: ${bracket.finalFour.semi2.winner}`);
    console.log(`\n  CHAMPIONSHIP:`);
    console.log(`    ${bracket.finalFour.semi1.winner.padEnd(22)} vs ${bracket.finalFour.semi2.winner.padEnd(22)} => PICK: ${bracket.champion}`);
    console.log(`\n  >>> CHAMPION: ${bracket.champion} <<<`);
  }
}

main().then(() => process.exit(0));
