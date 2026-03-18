import * as cheerio from "cheerio";
import { readFile, writeFile } from "fs/promises";
import { Team, Region, TeamsData, POWER_CONFERENCES } from "../types.js";

const BARTTORVIK_URL = "https://barttorvik.com/trank.php";

interface RawTeamRow {
  rank: number;
  name: string;
  conference: string;
  record: string;
  adjOE: number;
  adjOERank: number;
  adjDE: number;
  adjDERank: number;
  barthag: number;
  effMargin: number;
  tempo: number;
  tempoRank: number;
  sosRank: number;
  ftRate?: number;
  ftRateRank?: number;
}

export async function fetchFromBarttorvik(year: number = 2026): Promise<RawTeamRow[]> {
  const url = `${BARTTORVIK_URL}?year=${year}&conlimit=All`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`BartTorvik fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return parseBarttorvik(html);
}

function parseBarttorvik(html: string): RawTeamRow[] {
  const $ = cheerio.load(html);
  const teams: RawTeamRow[] = [];

  // BartTorvik uses a table with id "content-table" or similar
  $("table tbody tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 10) return;

    const rank = parseInt($(cells[0]).text().trim());
    if (isNaN(rank)) return;

    const name = $(cells[1]).text().trim();
    const conference = $(cells[2]).text().trim();
    const record = $(cells[3]).text().trim();
    const adjOE = parseFloat($(cells[4]).text().trim());
    const adjOERank = parseInt($(cells[5]).text().trim()) || 0;
    const adjDE = parseFloat($(cells[6]).text().trim());
    const adjDERank = parseInt($(cells[7]).text().trim()) || 0;
    const barthag = parseFloat($(cells[8]).text().trim());
    const tempo = parseFloat($(cells[9]).text().trim()) || 70;
    const tempoRank = parseInt($(cells[10])?.text().trim()) || 0;

    if (isNaN(adjOE) || isNaN(adjDE)) return;

    teams.push({
      rank,
      name,
      conference,
      record,
      adjOE,
      adjOERank,
      adjDE,
      adjDERank,
      barthag,
      effMargin: adjOE - adjDE,
      tempo,
      tempoRank,
      sosRank: 0, // Will need separate fetch or manual input
    });
  });

  return teams;
}

export function rawToTeam(
  raw: RawTeamRow,
  seed: number,
  region: Region,
  isFirstFour: boolean = false
): Team {
  const isPower = (POWER_CONFERENCES as readonly string[]).includes(raw.conference);

  return {
    name: raw.name,
    seed,
    region,
    conference: raw.conference,
    isPowerConference: isPower,
    isFirstFourWinner: isFirstFour,
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
      ftRate: raw.ftRate,
      ftRateRank: raw.ftRateRank,
    },
  };
}

export async function loadTeamsFromFile(path: string): Promise<TeamsData> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as TeamsData;
}

export async function saveTeamsToFile(data: TeamsData, path: string): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export async function fetchAndSave(outputPath: string, year: number = 2026): Promise<TeamsData> {
  console.log(`Fetching ${year} team data from BartTorvik...`);
  const rawTeams = await fetchFromBarttorvik(year);
  console.log(`Fetched ${rawTeams.length} teams`);

  const data: TeamsData = {
    asOf: new Date().toISOString().split("T")[0],
    source: "barttorvik.com",
    teams: rawTeams.map((raw) =>
      rawToTeam(raw, 0, "East", false) // seed/region set later when bracket is known
    ),
  };

  await saveTeamsToFile(data, outputPath);
  console.log(`Saved to ${outputPath}`);
  return data;
}
