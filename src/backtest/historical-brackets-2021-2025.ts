import { HistoricalTournament } from "./backtest-types.js";

const R = (
  seeds: [string, string, string, string, string, string, string, string,
          string, string, string, string, string, string, string, string],
  r64: string[], r32: string[], s16: string[], e8: string
): { seeds: Record<number, string>; results: { r64: string[]; r32: string[]; s16: string[]; e8: string } } => ({
  seeds: Object.fromEntries(seeds.map((t, i) => [i + 1, t])),
  results: { r64, r32, s16, e8 },
});

// ===== 2021 =====
// Champion: Baylor. FF: Baylor/Gonzaga/Houston/UCLA
// Verified via sports-reference.com
const T2021: HistoricalTournament = {
  year: 2021,
  regionOrder: ["South", "Midwest", "West", "East"],
  regions: {
    South: R(
      ["Baylor", "Ohio State", "Arkansas", "Purdue", "Villanova", "Texas Tech", "Florida", "North Carolina",
       "Wisconsin", "Virginia Tech", "Utah State", "Winthrop", "North Texas", "Colgate", "Oral Roberts", "Hartford"],
      ["Baylor", "Wisconsin", "Villanova", "North Texas", "Texas Tech", "Arkansas", "Florida", "Oral Roberts"],
      ["Baylor", "Villanova", "Arkansas", "Oral Roberts"],
      ["Baylor", "Arkansas"],
      "Baylor"
    ),
    Midwest: R(
      ["Illinois", "Houston", "West Virginia", "Oklahoma State", "Tennessee", "San Diego State", "Clemson", "Loyola Chicago",
       "Georgia Tech", "Rutgers", "Syracuse", "Oregon State", "Liberty", "Morehead State", "Cleveland State", "Drexel"],
      ["Illinois", "Loyola Chicago", "Oregon State", "Oklahoma State", "Syracuse", "West Virginia", "Rutgers", "Houston"],
      ["Loyola Chicago", "Oregon State", "Syracuse", "Houston"],
      ["Oregon State", "Houston"],
      "Houston"
    ),
    West: R(
      ["Gonzaga", "Iowa", "Kansas", "Virginia", "Creighton", "USC", "Oregon", "Oklahoma",
       "Missouri", "VCU", "Drake", "UC Santa Barbara", "Ohio", "Eastern Washington", "Grand Canyon", "Norfolk State"],
      ["Gonzaga", "Oklahoma", "Creighton", "Ohio", "USC", "Kansas", "Oregon", "Iowa"],
      ["Gonzaga", "Creighton", "USC", "Oregon"],
      ["Gonzaga", "USC"],
      "Gonzaga"
    ),
    East: R(
      ["Michigan", "Alabama", "Texas", "Florida State", "Colorado", "BYU", "Connecticut", "LSU",
       "St. Bonaventure", "Maryland", "UCLA", "Georgetown", "UNC Greensboro", "Abilene Christian", "Iona", "Texas Southern"],
      ["Michigan", "LSU", "Colorado", "Florida State", "UCLA", "Abilene Christian", "Maryland", "Alabama"],
      ["Michigan", "Florida State", "UCLA", "Alabama"],
      ["Michigan", "UCLA"],
      "UCLA"
    ),
  },
  finalFour: { semi1Winner: "Baylor", semi2Winner: "Gonzaga", champion: "Baylor" },
};

// ===== 2022 =====
// Champion: Kansas. FF: Kansas/North Carolina/Villanova/Duke
// Verified via sports-reference.com
const T2022: HistoricalTournament = {
  year: 2022,
  regionOrder: ["Midwest", "South", "East", "West"],
  regions: {
    East: R(
      ["Baylor", "Kentucky", "Purdue", "UCLA", "Saint Mary's", "Texas", "Murray State", "North Carolina",
       "Marquette", "San Francisco", "Virginia Tech", "Indiana", "Akron", "Yale", "Saint Peter's", "Norfolk State"],
      ["Baylor", "North Carolina", "Saint Mary's", "UCLA", "Texas", "Purdue", "Murray State", "Saint Peter's"],
      ["North Carolina", "UCLA", "Purdue", "Saint Peter's"],
      ["North Carolina", "Saint Peter's"],
      "North Carolina"
    ),
    Midwest: R(
      ["Kansas", "Auburn", "Wisconsin", "Providence", "Iowa", "LSU", "USC", "San Diego State",
       "Creighton", "Miami FL", "Iowa State", "Richmond", "South Dakota State", "Colgate", "Jacksonville State", "Texas Southern"],
      ["Kansas", "Creighton", "Richmond", "Providence", "Iowa State", "Wisconsin", "Miami FL", "Auburn"],
      ["Kansas", "Providence", "Iowa State", "Miami FL"],
      ["Kansas", "Miami FL"],
      "Kansas"
    ),
    South: R(
      ["Arizona", "Villanova", "Tennessee", "Illinois", "Houston", "Colorado State", "Ohio State", "Seton Hall",
       "TCU", "Loyola Chicago", "Michigan", "UAB", "Chattanooga", "Longwood", "Delaware", "Wright State"],
      ["Arizona", "TCU", "Houston", "Illinois", "Michigan", "Tennessee", "Ohio State", "Villanova"],
      ["Arizona", "Houston", "Michigan", "Villanova"],
      ["Houston", "Villanova"],
      "Villanova"
    ),
    West: R(
      ["Gonzaga", "Duke", "Texas Tech", "Arkansas", "Connecticut", "Alabama", "Michigan State", "Boise State",
       "Memphis", "Davidson", "Notre Dame", "New Mexico State", "Vermont", "Montana State", "Cal State Fullerton", "Georgia State"],
      ["Gonzaga", "Memphis", "New Mexico State", "Arkansas", "Notre Dame", "Texas Tech", "Michigan State", "Duke"],
      ["Gonzaga", "Arkansas", "Texas Tech", "Duke"],
      ["Arkansas", "Duke"],
      "Duke"
    ),
  },
  finalFour: { semi1Winner: "Kansas", semi2Winner: "North Carolina", champion: "Kansas" },
};

// ===== 2023 =====
// Champion: Connecticut. FF: UConn/San Diego State/FAU/Miami
// Verified via sports-reference.com
const T2023: HistoricalTournament = {
  year: 2023,
  regionOrder: ["West", "Midwest", "South", "East"],
  regions: {
    East: R(
      ["Purdue", "Marquette", "Kansas State", "Tennessee", "Duke", "Kentucky", "Michigan State", "Memphis",
       "Florida Atlantic", "USC", "Providence", "Oral Roberts", "Louisiana", "Montana State", "Vermont", "Fairleigh Dickinson"],
      ["Fairleigh Dickinson", "Florida Atlantic", "Duke", "Tennessee", "Kentucky", "Kansas State", "Michigan State", "Marquette"],
      ["Florida Atlantic", "Tennessee", "Kansas State", "Michigan State"],
      ["Florida Atlantic", "Kansas State"],
      "Florida Atlantic"
    ),
    Midwest: R(
      ["Houston", "Texas", "Xavier", "Indiana", "Miami FL", "Iowa State", "Texas A&M", "Iowa",
       "Auburn", "Penn State", "Pittsburgh", "Drake", "Kent State", "Kennesaw State", "Colgate", "Northern Kentucky"],
      ["Houston", "Auburn", "Miami FL", "Indiana", "Pittsburgh", "Xavier", "Penn State", "Texas"],
      ["Houston", "Miami FL", "Xavier", "Texas"],
      ["Miami FL", "Texas"],
      "Miami FL"
    ),
    South: R(
      ["Alabama", "Arizona", "Baylor", "Virginia", "San Diego State", "Creighton", "Missouri", "Maryland",
       "West Virginia", "Utah State", "NC State", "Charleston", "Furman", "UC Santa Barbara", "Princeton", "Texas A&M CC"],
      ["Alabama", "Maryland", "San Diego State", "Furman", "Creighton", "Baylor", "Missouri", "Princeton"],
      ["Alabama", "San Diego State", "Creighton", "Princeton"],
      ["San Diego State", "Creighton"],
      "San Diego State"
    ),
    West: R(
      ["Kansas", "UCLA", "Gonzaga", "Connecticut", "Saint Mary's", "TCU", "Northwestern", "Arkansas",
       "Illinois", "Boise State", "Arizona State", "VCU", "Iona", "Grand Canyon", "UNC Asheville", "Howard"],
      ["Kansas", "Arkansas", "Saint Mary's", "Connecticut", "TCU", "Gonzaga", "Northwestern", "UCLA"],
      ["Arkansas", "Connecticut", "Gonzaga", "UCLA"],
      ["Connecticut", "Gonzaga"],
      "Connecticut"
    ),
  },
  finalFour: { semi1Winner: "Connecticut", semi2Winner: "San Diego State", champion: "Connecticut" },
};

// ===== 2024 =====
// Champion: Connecticut. FF: UConn/Purdue/NC State/Alabama
// Verified via sports-reference.com
const T2024: HistoricalTournament = {
  year: 2024,
  regionOrder: ["East", "West", "Midwest", "South"],
  regions: {
    East: R(
      ["Connecticut", "Iowa State", "Illinois", "Auburn", "San Diego State", "BYU", "Texas", "Florida Atlantic",
       "Northwestern", "Colorado", "Duquesne", "UAB", "Yale", "Morehead State", "South Dakota State", "Stetson"],
      ["Connecticut", "Northwestern", "San Diego State", "Yale", "BYU", "Illinois", "Colorado", "Iowa State"],
      ["Connecticut", "San Diego State", "Illinois", "Iowa State"],
      ["Connecticut", "Illinois"],
      "Connecticut"
    ),
    South: R(
      ["Houston", "Marquette", "Kentucky", "Duke", "Wisconsin", "Texas Tech", "Florida", "Nebraska",
       "Texas A&M", "Colorado", "NC State", "James Madison", "Vermont", "Oakland", "Western Kentucky", "Longwood"],
      ["Houston", "Texas A&M", "James Madison", "Duke", "NC State", "Oakland", "Florida", "Marquette"],
      ["Houston", "Duke", "NC State", "Marquette"],
      ["Duke", "NC State"],
      "NC State"
    ),
    Midwest: R(
      ["Purdue", "Tennessee", "Creighton", "Kansas", "Gonzaga", "South Carolina", "Texas", "Utah State",
       "TCU", "Colorado State", "Oregon", "McNeese", "Samford", "Akron", "Montana State", "Grambling"],
      ["Purdue", "Utah State", "Gonzaga", "Kansas", "South Carolina", "Creighton", "Texas", "Tennessee"],
      ["Purdue", "Gonzaga", "Creighton", "Tennessee"],
      ["Purdue", "Tennessee"],
      "Purdue"
    ),
    West: R(
      ["North Carolina", "Arizona", "Baylor", "Alabama", "Saint Mary's", "Clemson", "Dayton", "Mississippi State",
       "Michigan State", "Nevada", "New Mexico", "Grand Canyon", "Charleston", "Colgate", "Long Beach State", "Wagner"],
      ["North Carolina", "Michigan State", "Grand Canyon", "Alabama", "Clemson", "Baylor", "Dayton", "Arizona"],
      ["North Carolina", "Alabama", "Clemson", "Arizona"],
      ["Alabama", "Clemson"],
      "Alabama"
    ),
  },
  finalFour: { semi1Winner: "Connecticut", semi2Winner: "Purdue", champion: "Connecticut" },
};

// ===== 2025 =====
// Champion: Florida. FF: Florida/Houston/Auburn/Duke
// Verified via sports-reference.com
const T2025: HistoricalTournament = {
  year: 2025,
  regionOrder: ["East", "South", "West", "Midwest"],
  regions: {
    East: R(
      ["Duke", "Alabama", "Wisconsin", "Arizona", "Oregon", "BYU", "Saint Mary's", "Baylor",
       "Mississippi State", "Vanderbilt", "VCU", "Liberty", "Akron", "Montana", "Robert Morris", "Mount St. Mary's"],
      ["Duke", "Baylor", "Oregon", "Arizona", "BYU", "Wisconsin", "Saint Mary's", "Alabama"],
      ["Duke", "Arizona", "Wisconsin", "Alabama"],
      ["Duke", "Alabama"],
      "Duke"
    ),
    South: R(
      ["Auburn", "Michigan State", "Iowa State", "Texas A&M", "Michigan", "Ole Miss", "Marquette", "Louisville",
       "Creighton", "New Mexico", "UNC", "UC San Diego", "Yale", "Lipscomb", "Bryant", "Alabama State"],
      ["Auburn", "Creighton", "Michigan", "Texas A&M", "Ole Miss", "Iowa State", "New Mexico", "Michigan State"],
      ["Auburn", "Michigan", "Ole Miss", "Michigan State"],
      ["Auburn", "Michigan State"],
      "Auburn"
    ),
    West: R(
      ["Florida", "St. John's", "Texas Tech", "Maryland", "Memphis", "Missouri", "Kansas", "Connecticut",
       "Oklahoma", "Arkansas", "Drake", "Colorado State", "Grand Canyon", "UNC Wilmington", "Omaha", "Norfolk State"],
      ["Florida", "Connecticut", "Colorado State", "Maryland", "Drake", "Texas Tech", "Arkansas", "St. John's"],
      ["Florida", "Maryland", "Texas Tech", "St. John's"],
      ["Florida", "St. John's"],
      "Florida"
    ),
    Midwest: R(
      ["Houston", "Tennessee", "Kentucky", "Purdue", "Clemson", "Illinois", "UCLA", "Gonzaga",
       "Georgia", "Utah State", "Xavier", "McNeese", "High Point", "Troy", "Wofford", "SIU Edwardsville"],
      ["Houston", "Gonzaga", "McNeese", "Purdue", "Illinois", "Kentucky", "UCLA", "Tennessee"],
      ["Houston", "Purdue", "Kentucky", "Tennessee"],
      ["Houston", "Tennessee"],
      "Houston"
    ),
  },
  finalFour: { semi1Winner: "Duke", semi2Winner: "Florida", champion: "Florida" },
};

export const TOURNAMENTS_2021_2025: HistoricalTournament[] = [T2021, T2022, T2023, T2024, T2025];
