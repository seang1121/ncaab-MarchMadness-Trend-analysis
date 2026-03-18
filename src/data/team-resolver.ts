import { Team } from "../types.js";

// Common alternate names and abbreviations
const ALIASES: Record<string, string[]> = {
  "UConn": ["Connecticut", "UCONN"],
  "LSU": ["Louisiana State"],
  "UCLA": ["UC Los Angeles"],
  "USC": ["Southern California", "Southern Cal"],
  "UNC": ["North Carolina", "N Carolina"],
  "SMU": ["Southern Methodist"],
  "UNLV": ["Nevada Las Vegas"],
  "VCU": ["Virginia Commonwealth"],
  "UCF": ["Central Florida"],
  "BYU": ["Brigham Young"],
  "Saint Mary's": ["St. Mary's", "St Mary's", "Saint Marys"],
  "Saint Peter's": ["St. Peter's", "St Peter's", "Saint Peters"],
  "Miami (FL)": ["Miami", "Miami FL"],
  "Michigan State": ["Michigan St", "Michigan St.", "Mich State", "MSU"],
  "Ohio State": ["Ohio St", "Ohio St.", "OSU"],
  "Florida State": ["Florida St", "Florida St.", "FSU"],
  "Iowa State": ["Iowa St", "Iowa St."],
  "Kansas State": ["Kansas St", "Kansas St.", "K-State"],
  "Oregon State": ["Oregon St", "Oregon St."],
  "Penn State": ["Penn St", "Penn St."],
  "Texas Tech": ["Texas Tech"],
  "San Diego State": ["San Diego St", "SDSU"],
  "NC State": ["North Carolina State", "N.C. State"],
  "Mississippi State": ["Miss State", "Miss St"],
  "Ole Miss": ["Mississippi"],
  "Pitt": ["Pittsburgh"],
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveTeam(input: string, teams: Team[]): Team | null {
  const normalizedInput = normalize(input);

  // Direct match
  const direct = teams.find((t) => normalize(t.name) === normalizedInput);
  if (direct) return direct;

  // Partial match
  const partial = teams.find(
    (t) =>
      normalize(t.name).includes(normalizedInput) ||
      normalizedInput.includes(normalize(t.name))
  );
  if (partial) return partial;

  // Alias match
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    const allNames = [canonical, ...aliases];
    if (allNames.some((a) => normalize(a) === normalizedInput)) {
      return teams.find((t) =>
        allNames.some((a) => normalize(t.name).includes(normalize(a)))
      ) ?? null;
    }
  }

  // Fuzzy: find best Levenshtein match
  let bestMatch: Team | null = null;
  let bestScore = Infinity;

  for (const team of teams) {
    const dist = levenshtein(normalizedInput, normalize(team.name));
    if (dist < bestScore && dist <= Math.max(3, normalizedInput.length * 0.3)) {
      bestScore = dist;
      bestMatch = team;
    }
  }

  return bestMatch;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export function resolveTeamOrThrow(input: string, teams: Team[]): Team {
  const team = resolveTeam(input, teams);
  if (!team) {
    throw new Error(`Could not resolve team "${input}". Available teams: ${teams.map(t => t.name).join(", ")}`);
  }
  return team;
}
