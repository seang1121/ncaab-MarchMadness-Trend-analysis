// Build real 2026 team data file from BartTorvik + actual bracket seedings
import { writeFile } from "fs/promises";

const BRACKET: Record<string, Array<[number, string]>> = {
  East: [
    [1, "Duke"], [2, "Connecticut"], [3, "Michigan St."], [4, "Kansas"],
    [5, "St. John's"], [6, "Louisville"], [7, "UCLA"], [8, "Ohio St."],
    [9, "TCU"], [10, "UCF"], [11, "South Florida"], [12, "Northern Iowa"],
    [13, "Cal Baptist"], [14, "North Dakota St."], [15, "Furman"], [16, "Siena"],
  ],
  West: [
    [1, "Arizona"], [2, "Purdue"], [3, "Gonzaga"], [4, "Arkansas"],
    [5, "Wisconsin"], [6, "BYU"], [7, "Miami FL"], [8, "Villanova"],
    [9, "Utah St."], [10, "Missouri"], [11, "Texas"], [12, "High Point"],
    [13, "Hawaii"], [14, "Kennesaw St."], [15, "Queens"], [16, "LIU"],
  ],
  Midwest: [
    [1, "Michigan"], [2, "Iowa St."], [3, "Virginia"], [4, "Alabama"],
    [5, "Texas Tech"], [6, "Tennessee"], [7, "Kentucky"], [8, "Georgia"],
    [9, "Saint Louis"], [10, "Santa Clara"], [11, "SMU"], [12, "Akron"],
    [13, "Hofstra"], [14, "Wright St."], [15, "Tennessee St."], [16, "UMBC"],
  ],
  South: [
    [1, "Florida"], [2, "Houston"], [3, "Illinois"], [4, "Nebraska"],
    [5, "Vanderbilt"], [6, "North Carolina"], [7, "Saint Mary's"], [8, "Clemson"],
    [9, "Iowa"], [10, "Texas A&M"], [11, "VCU"], [12, "McNeese"],
    [13, "Troy"], [14, "Penn"], [15, "Idaho"], [16, "Prairie View A&M"],
  ],
};

// Name mapping: bracket name -> BartTorvik name
const BART_NAMES: Record<string, string> = {
  "Connecticut": "Connecticut",
  "Michigan St.": "Michigan St.",
  "St. John's": "St. John's",
  "Ohio St.": "Ohio St.",
  "Cal Baptist": "California Baptist",
  "North Dakota St.": "North Dakota St.",
  "Miami FL": "Miami FL",
  "Utah St.": "Utah St.",
  "Kennesaw St.": "Kennesaw St.",
  "Iowa St.": "Iowa St.",
  "Texas Tech": "Texas Tech",
  "Saint Louis": "Saint Louis",
  "Wright St.": "Wright St.",
  "Tennessee St.": "Tennessee St.",
  "Saint Mary's": "Saint Mary's",
  "Texas A&M": "Texas A&M",
  "Prairie View A&M": "Prairie View A&M",
  "SMU": "SMU",
};

const POWER_CONFERENCES = ["ACC", "SEC", "Big 12", "Big Ten", "Big East"];

async function main() {
  // Fetch 2026 BartTorvik data
  const url = "https://barttorvik.com/teamslicejson.php?year=2026&json=1&type=pointed";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const raw = (await res.json()) as unknown[][];

  console.log(`Fetched ${raw.length} teams from BartTorvik 2026`);

  // Build lookup by name
  interface BartTeam {
    name: string; adjOE: number; adjDE: number; effMargin: number;
    efgPct: number; ftRate: number; tovRate: number; tempo: number;
    trueShootPct: number; sosMetric: number;
  }

  const bartTeams: BartTeam[] = raw
    .filter((r) => r && r.length >= 20)
    .map((r) => ({
      name: String(r[0]),
      adjOE: Number(r[1]),
      adjDE: Number(r[2]),
      effMargin: Number(r[1]) - Number(r[2]),
      efgPct: Number(r[7]) || 0,
      ftRate: Number(r[11]) || 0,
      tovRate: Number(r[19]) || 0,
      tempo: Number(r[36]) || 68,
      trueShootPct: Number(r[22]) || 0,
      sosMetric: Number(r[26]) || 0,
    }))
    .sort((a, b) => b.effMargin - a.effMargin);

  // Derive ranks
  const byAdjOE = [...bartTeams].sort((a, b) => b.adjOE - a.adjOE);
  const byAdjDE = [...bartTeams].sort((a, b) => a.adjDE - b.adjDE);

  function findBart(bracketName: string): BartTeam | undefined {
    const bartName = BART_NAMES[bracketName] || bracketName;
    // Try exact
    let t = bartTeams.find((bt) => bt.name === bartName);
    if (t) return t;
    // Case insensitive
    t = bartTeams.find((bt) => bt.name.toLowerCase() === bartName.toLowerCase());
    if (t) return t;
    // Prefix
    t = bartTeams.find((bt) => bt.name.toLowerCase().startsWith(bartName.toLowerCase().slice(0, 8)));
    if (t) return t;
    // Contains
    t = bartTeams.find((bt) =>
      bt.name.toLowerCase().includes(bracketName.toLowerCase()) ||
      bracketName.toLowerCase().includes(bt.name.toLowerCase())
    );
    return t;
  }

  const teams: unknown[] = [];
  let matched = 0, missed = 0;

  for (const [region, seedings] of Object.entries(BRACKET)) {
    for (const [seed, name] of seedings) {
      const bart = findBart(name);
      if (bart) {
        matched++;
        const rank = bartTeams.indexOf(bart) + 1;
        const adjOERank = byAdjOE.indexOf(bart) + 1;
        const adjDERank = byAdjDE.indexOf(bart) + 1;

        teams.push({
          name, seed, region,
          conference: "Unknown",
          isPowerConference: false,
          isFirstFourWinner: seed === 11 && ["Texas", "SMU"].includes(name),
          kenpom: {
            rank, adjEM: bart.effMargin,
            adjO: bart.adjOE, adjORank: adjOERank,
            adjD: bart.adjDE, adjDRank: adjDERank,
            adjTempo: bart.tempo, adjTempoRank: 0,
            sosRank: Math.round(bart.sosMetric),
            efgPct: bart.efgPct, tovRate: bart.tovRate, ftRate: bart.ftRate,
          },
        });
      } else {
        missed++;
        console.log(`  MISS: ${name} (${seed}-seed ${region})`);
        teams.push({
          name, seed, region,
          conference: "Unknown", isPowerConference: false, isFirstFourWinner: false,
          kenpom: {
            rank: seed * 20, adjEM: Math.max(0, 35 - seed * 2.5),
            adjO: 115 - seed, adjORank: seed * 20,
            adjD: 95 + seed, adjDRank: seed * 20,
            adjTempo: 68, adjTempoRank: 150, sosRank: seed * 12,
          },
        });
      }
    }
  }

  console.log(`Matched: ${matched}/64, Missed: ${missed}/64`);

  const data = {
    asOf: "2026-03-18",
    source: "barttorvik.com + official NCAA bracket",
    teams,
  };

  await writeFile("data/teams-2026.json", JSON.stringify(data, null, 2), "utf-8");
  console.log("Saved to data/teams-2026.json");
}

main().then(() => process.exit(0));
