// Re-exports all historical bracket data with lookup functions

import { HistoricalTournament } from "./backtest-types.js";
import { TOURNAMENTS_2011_2015 } from "./historical-brackets-2011-2015.js";
import { TOURNAMENTS_2016_2019 } from "./historical-brackets-2016-2019.js";
import { TOURNAMENTS_2021_2025 } from "./historical-brackets-2021-2025.js";

const ALL_TOURNAMENTS: HistoricalTournament[] = [
  ...TOURNAMENTS_2011_2015,
  ...TOURNAMENTS_2016_2019,
  ...TOURNAMENTS_2021_2025,
];

export function getHistoricalBracket(year: number): HistoricalTournament | undefined {
  return ALL_TOURNAMENTS.find((t) => t.year === year);
}

export function getAvailableYears(): number[] {
  return ALL_TOURNAMENTS.map((t) => t.year);
}

export function getAllHistoricalBrackets(): HistoricalTournament[] {
  return ALL_TOURNAMENTS;
}
