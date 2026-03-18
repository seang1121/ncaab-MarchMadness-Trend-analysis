// Fetches historical KenPom data from BartTorvik and builds Team objects
// Uses existing fetchFromBarttorvik() with year param, caches to data/historical/

import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { Team, Region, POWER_CONFERENCES } from "../types.js";
import { fetchFromBarttorvik } from "../data/stats-fetcher.js";
import { HistoricalTournament } from "./backtest-types.js";

const CACHE_DIR = resolve("data/historical");

// BartTorvik name -> bracket name normalization
const NAME_MAP: Record<string, string> = {
  // Major programs with common abbreviations
  "UConn": "Connecticut",
  "UNC": "North Carolina",
  "Miami": "Miami FL",
  "SMU": "Southern Methodist",
  "BYU": "Brigham Young",
  "VCU": "Virginia Commonwealth",
  "UCSB": "UC Santa Barbara",
  "UCSD": "UC San Diego",
  "FAU": "Florida Atlantic",
  "FDU": "Fairleigh Dickinson",
  "LIU": "Long Island",
  "ACU": "Abilene Christian",
  "SFA": "Stephen F. Austin",
  "MTSU": "Middle Tennessee",
  "SIUE": "SIU Edwardsville",
  "Pitt": "Pittsburgh",
  // Saint/St. normalization
  "Saint John's": "St. John's",
  "Saint Peter's": "St. Peter's",
  "Saint Bonaventure": "St. Bonaventure",
  "St. Mary's": "Saint Mary's",
  "Saint Mary's (CA)": "Saint Mary's",
  "St. Mary's (CA)": "Saint Mary's",
  // NC State variants
  "North Carolina State": "NC State",
  "N.C. State": "NC State",
  "North Carolina St.": "NC State",
  // Ole Miss
  "Mississippi": "Ole Miss",
  // Loyola Chicago variants
  "Loyola-Chicago": "Loyola Chicago",
  "Loyola (IL)": "Loyola Chicago",
  "Loyola-IL": "Loyola Chicago",
  // UNC campuses
  "NC Greensboro": "UNC Greensboro",
  "North Carolina Greensboro": "UNC Greensboro",
  "North Carolina Asheville": "UNC Asheville",
  "North Carolina Wilmington": "UNC Wilmington",
  // State school abbreviations
  "Norfolk St.": "Norfolk State",
  "Jacksonville St.": "Jacksonville State",
  "Georgia St.": "Georgia State",
  "Montana St.": "Montana State",
  "Weber St.": "Weber State",
  "Middle Tenn.": "Middle Tennessee",
  // Cal State system
  "Cal St. Fullerton": "Cal State Fullerton",
  "CSU Fullerton": "Cal State Fullerton",
  "Cal St. Bakersfield": "Cal State Bakersfield",
  "Cal St. Northridge": "Cal State Northridge",
  // Texas schools
  "UTSA": "UT San Antonio",
  "Texas-San Antonio": "UT San Antonio",
  "Texas A&M-Corpus Christi": "Texas A&M CC",
  "TAMU-CC": "Texas A&M CC",
  // Florida Atlantic
  "Fla. Atlantic": "Florida Atlantic",
  // SIU
  "SIU-Edwardsville": "SIU Edwardsville",
  // Wisconsin
  "Milwaukee": "Wisconsin-Milwaukee",
  // California Baptist
  "Cal Baptist": "California Baptist",
};

function normalizeName(name: string): string {
  return NAME_MAP[name] ?? name;
}

function reverseNormalize(bracketName: string): string[] {
  // Return all possible BartTorvik names for a bracket name
  const variants = [bracketName];
  for (const [bartName, mappedName] of Object.entries(NAME_MAP)) {
    if (mappedName === bracketName && bartName !== bracketName) {
      variants.push(bartName);
    }
  }
  return variants;
}

interface CachedTeamData {
  year: number;
  fetchedAt: string;
  teams: Array<{
    name: string;
    rank: number;
    conference: string;
    adjOE: number;
    adjOERank: number;
    adjDE: number;
    adjDERank: number;
    effMargin: number;
    tempo: number;
    tempoRank: number;
    sosRank: number;
    // Four-factors and advanced stats (from BartTorvik JSON API)
    efgPct: number;
    oppEfgPct: number;
    ftRate: number;
    tovRate: number;
    trueShootPct: number;
    oppTrueShootPct: number;
  }>;
}

// BartTorvik JSON API column mapping (verified via test fetch):
// [0] name, [1] adjOE, [2] adjDE, [3] barthag, [4] record, [5] wins, [6] games
// [7] eFG%, [8] opp eFG%, [9] 3P%, [10] opp 3P%, [11] FT rate, [12] opp FT rate
// [13] RPG, [14] opp RPG, [15-18] more box stats, [19] TO rate
// [22] TS%, [23] opp TS%, [24-25] more shooting, [26] SOS-ish metric
// [34] some advanced metric, [35] integer rank?, [36] adjusted tempo

interface BartTovikRow {
  name: string;
  adjOE: number;
  adjDE: number;
  effMargin: number;
  record: string;
  efgPct: number;
  oppEfgPct: number;
  ftRate: number;
  tovRate: number;
  trueShootPct: number;
  oppTrueShootPct: number;
  tempo: number;
  sosMetric: number;
}

async function fetchTeamsJson(year: number): Promise<BartTovikRow[]> {
  const url = `https://barttorvik.com/teamslicejson.php?year=${year}&json=1&type=pointed`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`BartTorvik JSON fetch failed: ${response.status}`);
  }

  const raw = await response.json() as unknown[][];
  const teams: BartTovikRow[] = [];

  for (const row of raw) {
    if (!row || row.length < 20) continue;
    const name = String(row[0]);
    const adjOE = Number(row[1]);
    const adjDE = Number(row[2]);
    if (isNaN(adjOE) || isNaN(adjDE)) continue;

    teams.push({
      name,
      adjOE,
      adjDE,
      effMargin: adjOE - adjDE,
      record: String(row[4] || ""),
      efgPct: Number(row[7]) || 0,
      oppEfgPct: Number(row[8]) || 0,
      ftRate: Number(row[11]) || 0,
      tovRate: Number(row[19]) || 0,
      trueShootPct: Number(row[22]) || 0,
      oppTrueShootPct: Number(row[23]) || 0,
      tempo: Number(row[36]) || 68,
      sosMetric: Number(row[26]) || 0,
    });
  }

  teams.sort((a, b) => b.effMargin - a.effMargin);
  return teams;
}

export async function fetchHistoricalTeams(year: number): Promise<CachedTeamData> {
  const cachePath = resolve(CACHE_DIR, `teams-${year}.json`);

  // Try cache first
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf-8")) as CachedTeamData;
    if (cached.teams.length > 100) {
      console.log(`  Cache hit: ${cachePath} (${cached.teams.length} teams)`);
      return cached;
    }
  } catch {
    // Cache miss
  }

  console.log(`  Fetching ${year} data from BartTorvik JSON API...`);

  let teams: CachedTeamData["teams"] = [];

  try {
    const jsonTeams = await fetchTeamsJson(year);
    console.log(`  Fetched ${jsonTeams.length} teams for ${year} (JSON API)`);

    teams = jsonTeams.map((t, idx) => ({
      name: t.name,
      rank: idx + 1,
      conference: "Unknown",
      adjOE: t.adjOE,
      adjOERank: 0,
      adjDE: t.adjDE,
      adjDERank: 0,
      effMargin: t.effMargin,
      tempo: t.tempo,
      tempoRank: 0,
      sosRank: Math.round(t.sosMetric) || 0,
      efgPct: t.efgPct,
      oppEfgPct: t.oppEfgPct,
      ftRate: t.ftRate,
      tovRate: t.tovRate,
      trueShootPct: t.trueShootPct,
      oppTrueShootPct: t.oppTrueShootPct,
    }));
  } catch (jsonErr) {
    console.log(`  JSON API failed, trying HTML parser...`);
    try {
      const rawTeams = await fetchFromBarttorvik(year);
      console.log(`  Fetched ${rawTeams.length} teams for ${year} (HTML)`);
      teams = rawTeams.map((r) => ({
        name: r.name,
        rank: r.rank,
        conference: r.conference,
        adjOE: r.adjOE,
        adjOERank: r.adjOERank,
        adjDE: r.adjDE,
        adjDERank: r.adjDERank,
        effMargin: r.effMargin,
        tempo: r.tempo,
        tempoRank: r.tempoRank,
        sosRank: r.sosRank || 0,
        efgPct: 0, oppEfgPct: 0, ftRate: 0, tovRate: 0,
        trueShootPct: 0, oppTrueShootPct: 0,
      }));
    } catch {
      console.log(`  Both fetchers failed for ${year}, using placeholders`);
      return { year, fetchedAt: "placeholder", teams: [] };
    }
  }

  // Derive adjOE/adjDE ranks from sort order
  const byAdjOE = [...teams].sort((a, b) => b.adjOE - a.adjOE);
  const byAdjDE = [...teams].sort((a, b) => a.adjDE - b.adjDE);
  for (const t of teams) {
    t.adjOERank = byAdjOE.findIndex((x) => x.name === t.name) + 1;
    t.adjDERank = byAdjDE.findIndex((x) => x.name === t.name) + 1;
  }

  const data: CachedTeamData = { year, fetchedAt: new Date().toISOString(), teams };

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  Cached to ${cachePath}`);

  return data;
}

// Levenshtein distance for fuzzy name matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findTeamInCache(
  teamName: string,
  cached: CachedTeamData["teams"],
): CachedTeamData["teams"][0] | undefined {
  const variants = reverseNormalize(teamName);
  const normalizedBracketName = normalizeName(teamName);

  // 1. Exact match via aliases
  let raw = cached.find((t) =>
    variants.some((v) => t.name === v) ||
    normalizeName(t.name) === normalizedBracketName ||
    t.name.toLowerCase() === teamName.toLowerCase()
  );
  if (raw) return raw;

  // 2. Prefix match (8+ chars)
  raw = cached.find((t) =>
    t.name.toLowerCase().startsWith(teamName.toLowerCase().slice(0, 8))
  );
  if (raw) return raw;

  // 3. Reverse prefix (BartTorvik name starts with bracket name)
  raw = cached.find((t) =>
    teamName.toLowerCase().startsWith(t.name.toLowerCase().slice(0, 8))
  );
  if (raw) return raw;

  // 4. Levenshtein distance ≤ 3, first word must match
  const firstWord = teamName.split(/[\s-]/)[0].toLowerCase();
  let bestDist = 4;
  let bestMatch: CachedTeamData["teams"][0] | undefined;
  for (const t of cached) {
    const tFirst = t.name.split(/[\s-]/)[0].toLowerCase();
    if (tFirst !== firstWord && firstWord !== tFirst) continue;
    const dist = levenshtein(teamName.toLowerCase(), t.name.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = t;
    }
  }
  if (bestMatch) return bestMatch;

  // 5. Contains match (one name contains the other)
  raw = cached.find((t) =>
    t.name.toLowerCase().includes(teamName.toLowerCase()) ||
    teamName.toLowerCase().includes(t.name.toLowerCase())
  );
  return raw;
}

export function buildTeamsFromHistorical(
  cached: CachedTeamData,
  tournament: HistoricalTournament,
): Team[] {
  const teams: Team[] = [];
  let matched = 0, placeholder = 0;

  for (const [regionName, regionData] of Object.entries(tournament.regions)) {
    for (const [seedStr, teamName] of Object.entries(regionData.seeds)) {
      const seed = parseInt(seedStr);
      const region = regionName as Region;

      const raw = findTeamInCache(teamName, cached.teams);

      if (raw) {
        matched++;
        const isPower = (POWER_CONFERENCES as readonly string[]).includes(raw.conference);
        teams.push({
          name: teamName,
          seed,
          region,
          conference: raw.conference,
          isPowerConference: isPower,
          isFirstFourWinner: false,
          kenpom: {
            rank: raw.rank,
            adjEM: raw.effMargin,
            adjO: raw.adjOE,
            adjORank: raw.adjOERank,
            adjD: raw.adjDE,
            adjDRank: raw.adjDERank,
            adjTempo: raw.tempo,
            adjTempoRank: raw.tempoRank,
            sosRank: raw.sosRank,
            efgPct: raw.efgPct || undefined,
            tovRate: raw.tovRate || undefined,
            ftRate: raw.ftRate || undefined,
          },
        });
      } else {
        placeholder++;
        teams.push({
          name: teamName,
          seed,
          region,
          conference: "Unknown",
          isPowerConference: false,
          isFirstFourWinner: false,
          kenpom: {
            rank: seed * 20,
            adjEM: Math.max(0, 30 - seed * 2.5),
            adjO: 110 - seed,
            adjORank: seed * 20,
            adjD: 100 + seed * 0.5,
            adjDRank: seed * 20,
            adjTempo: 68,
            adjTempoRank: 150,
            sosRank: seed * 15,
          },
        });
      }
    }
  }

  if (placeholder > 0) {
    console.log(`    ${tournament.year}: ${matched}/${matched + placeholder} teams matched (${placeholder} using placeholders)`);
  }

  return teams;
}
