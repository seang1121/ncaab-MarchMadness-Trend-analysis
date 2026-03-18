import { readFile, writeFile } from "fs/promises";
import { Bracket, Team, Region, RegionBracket } from "../types.js";
import { resolveTeam } from "./team-resolver.js";

export async function loadBracket(path: string, allTeams: Team[]): Promise<Bracket> {
  const raw = await readFile(path, "utf-8");
  const data = JSON.parse(raw);
  return parseBracketData(data, allTeams);
}

export function parseBracketData(data: Record<string, unknown>, allTeams: Team[]): Bracket {
  const regions = data.regions as Record<string, {
    teams?: Array<Record<string, unknown>>;
    picks: { r64: string[]; r32: string[]; s16: string[]; e8: string[] };
  }>;

  const bracket: Bracket = {
    year: (data.year as number) || 2026,
    regions: {} as Record<Region, RegionBracket>,
    finalFour: data.finalFour as Bracket["finalFour"],
    champion: data.champion as string,
  };

  for (const [regionName, regionData] of Object.entries(regions)) {
    const region = regionName as Region;
    const regionTeams = allTeams.filter((t) => t.region === region);

    bracket.regions[region] = {
      region,
      teams: regionTeams,
      picks: {
        r64: regionData.picks.r64.map((name: string) => {
          const team = resolveTeam(name, regionTeams);
          return team?.name ?? name;
        }),
        r32: regionData.picks.r32.map((name: string) => {
          const team = resolveTeam(name, regionTeams);
          return team?.name ?? name;
        }),
        s16: regionData.picks.s16.map((name: string) => {
          const team = resolveTeam(name, regionTeams);
          return team?.name ?? name;
        }),
        e8: regionData.picks.e8.map((name: string) => {
          const team = resolveTeam(name, regionTeams);
          return team?.name ?? name;
        }),
      },
    };
  }

  return bracket;
}

export async function saveBracket(bracket: Bracket, path: string): Promise<void> {
  const output = {
    year: bracket.year,
    regions: Object.fromEntries(
      Object.entries(bracket.regions).map(([region, rb]) => [
        region,
        { picks: rb.picks },
      ])
    ),
    finalFour: bracket.finalFour,
    champion: bracket.champion,
  };

  await writeFile(path, JSON.stringify(output, null, 2), "utf-8");
}

export function bracketToString(bracket: Bracket): string {
  const lines = [`=== ${bracket.year} BRACKET ===`, ""];

  const regions: Region[] = ["East", "West", "South", "Midwest"];
  for (const region of regions) {
    const rb = bracket.regions[region];
    if (!rb) continue;

    lines.push(`--- ${region} Region ---`);
    lines.push(`  R64: ${rb.picks.r64.join(", ")}`);
    lines.push(`  R32: ${rb.picks.r32.join(", ")}`);
    lines.push(`  S16: ${rb.picks.s16.join(", ")}`);
    lines.push(`  E8:  ${rb.picks.e8[0]}`);
    lines.push("");
  }

  lines.push("--- Final Four ---");
  lines.push(`  Semi 1: ${bracket.finalFour.semi1.winner}`);
  lines.push(`  Semi 2: ${bracket.finalFour.semi2.winner}`);
  lines.push(`  CHAMPION: ${bracket.champion}`);

  return lines.join("\n");
}
