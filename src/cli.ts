import { Command } from "commander";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { Team, TeamsData, Region } from "./types.js";
import { loadTeamsFromFile, fetchAndSave } from "./data/stats-fetcher.js";
import { loadBracket } from "./data/bracket-io.js";
import { resolveTeamOrThrow } from "./data/team-resolver.js";
import { evaluateChampionGate, findChampionContenders, formatChampionGate } from "./rules/champion-gate.js";
import { getStaircaseProfile, maxViableRound } from "./rules/efficiency-staircase.js";
import { classifyCinderella, formatCinderellaAssessment, isCinderella } from "./rules/cinderella.js";
import { evaluateMatchup, formatPrediction } from "./engine/matchup-evaluator.js";
import { generateBracket, formatGeneratedBracket } from "./engine/generator.js";
import { analyzeBracket, formatAnalysis } from "./engine/analyzer.js";
import { EnsembleModel, formatEnsemblePrediction } from "./models/ensemble-model.js";
import { KenPomModel, MarketModel, TempoMatchupModel, SeedHistoryModel, DefensiveIdentityModel } from "./models/index.js";
import { getCalibratedWeights, STAT_DIFFERENTIALS, MONEYLINE_CALIBRATION, TOURNAMENT_BOOST, EDGE_COUNT_INSIGHT } from "./models/betting-insights.js";
import { runRecalibration } from "./historical/recalibrate.js";
import { runBacktest, validateHistoricalData } from "./backtest/backtester.js";
import { runBracketComparison } from "./backtest/bracket-scorer.js";
import { generateScenarios, formatScenarios } from "./engine/scenario-generator.js";
import { monteCarloSimulate, formatMonteCarloResult } from "./engine/monte-carlo.js";
import { generateChampionBrackets, formatChampionBrackets } from "./engine/champion-brackets.js";
import { buildSmartBracket, formatSmartBracket } from "./engine/smart-builder.js";
import { formatBacktestResult, formatModelComparison, formatOptimizationResult } from "./backtest/backtest-report.js";
import { runStaticOptimization, runAdaptiveOptimization } from "./backtest/weight-optimizer.js";
import type { Predictor } from "./engine/generator.js";

const program = new Command();

program
  .name("bracket-analyzer")
  .description("March Madness bracket analyzer powered by 14 years of KenPom efficiency research (2011-2025)")
  .version("1.0.0");

// Helper to load teams
async function loadTeams(dataPath?: string): Promise<Team[]> {
  const path = dataPath || resolve("data/teams-2026.json");
  try {
    const data = await loadTeamsFromFile(path);
    return data.teams;
  } catch {
    console.error(`Could not load team data from ${path}`);
    console.error("Run 'bracket-analyzer fetch-data' first or provide a --data path");
    process.exit(1);
  }
}

// ---- FETCH DATA ----
program
  .command("fetch-data")
  .description("Fetch team data from BartTorvik")
  .option("-o, --output <path>", "Output file path", "data/teams-2026.json")
  .option("-y, --year <year>", "Season year", "2026")
  .action(async (opts) => {
    await fetchAndSave(resolve(opts.output), parseInt(opts.year));
  });

// ---- CHAMPION GATE ----
program
  .command("champion-gate")
  .description("Run champion predictor gate on all teams")
  .option("-d, --data <path>", "Team data JSON file")
  .option("-t, --team <name>", "Evaluate a specific team")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);

    if (opts.team) {
      const team = resolveTeamOrThrow(opts.team, teams);
      const result = evaluateChampionGate(team);
      console.log(formatChampionGate(result));
    } else {
      console.log("=== CHAMPION PREDICTOR GATE (14-year calibration) ===\n");
      console.log("All 14 champions (2011-2025) pass 7+/8 recalibrated gates.\n");

      const contenders = findChampionContenders(teams);
      const fullPass = contenders.filter((c) => c.passes);
      const nearPass = contenders.filter((c) => !c.passes);

      if (fullPass.length > 0) {
        console.log(`--- FULL PASS (${fullPass.length} teams) ---`);
        fullPass.forEach((c) => console.log(formatChampionGate(c) + "\n"));
      }

      if (nearPass.length > 0) {
        console.log(`--- NEAR MISS (6-7/8 gates, ${nearPass.length} teams) ---`);
        nearPass.forEach((c) => console.log(formatChampionGate(c) + "\n"));
      }

      if (contenders.length === 0) {
        console.log("No teams pass 6+ gates. Data may not include seeds/regions yet.");
      }
    }
  });

// ---- STAIRCASE ----
program
  .command("staircase")
  .description("Show efficiency staircase profile for a team")
  .argument("<team>", "Team name")
  .option("-d, --data <path>", "Team data JSON file")
  .action(async (teamName, opts) => {
    const teams = await loadTeams(opts.data);
    const team = resolveTeamOrThrow(teamName, teams);
    console.log(getStaircaseProfile(team));
  });

// ---- EVALUATE MATCHUP ----
program
  .command("evaluate")
  .description("Evaluate win probability for a matchup")
  .requiredOption("--team1 <name>", "First team")
  .requiredOption("--team2 <name>", "Second team")
  .option("-r, --round <round>", "Tournament round", "R64")
  .option("-d, --data <path>", "Team data JSON file")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const team1 = resolveTeamOrThrow(opts.team1, teams);
    const team2 = resolveTeamOrThrow(opts.team2, teams);
    const prediction = evaluateMatchup(team1, team2, opts.round);
    console.log(formatPrediction(prediction));
  });

// ---- GENERATE BRACKET ----
program
  .command("generate")
  .description("Generate optimal bracket(s)")
  .option("-m, --mode <mode>", "Generation mode: chalk, balanced, upset-heavy", "balanced")
  .option("-c, --count <n>", "Number of brackets to generate", "1")
  .option("-d, --data <path>", "Team data JSON file")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);

    // Check teams have seeds/regions
    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} teams have seeds. Need 64 seeded teams.`);
      console.error("Update data/teams-2026.json with bracket info after Selection Sunday.");
      process.exit(1);
    }

    const count = parseInt(opts.count);
    for (let i = 0; i < count; i++) {
      const result = generateBracket(teams, opts.mode);
      console.log(formatGeneratedBracket(result));
      if (i < count - 1) console.log("\n" + "=".repeat(60) + "\n");
    }
  });

// ---- ANALYZE BRACKET ----
program
  .command("analyze")
  .description("Analyze a filled bracket against historical patterns")
  .requiredOption("-b, --bracket <path>", "Bracket JSON file")
  .option("-d, --data <path>", "Team data JSON file")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const bracket = await loadBracket(resolve(opts.bracket), teams);
    const result = analyzeBracket(bracket, teams);
    console.log(formatAnalysis(result));
  });

// ---- CINDERELLAS ----
program
  .command("cinderellas")
  .description("Classify all double-digit seeds by Cinderella type and ceiling")
  .option("-d, --data <path>", "Team data JSON file")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const cinderellas = teams.filter((t) => isCinderella(t) && t.seed > 0);

    if (cinderellas.length === 0) {
      console.log("No double-digit seeds found. Update team data with bracket seeds.");
      return;
    }

    console.log("=== CINDERELLA ASSESSMENTS ===\n");
    const assessments = cinderellas.map(classifyCinderella);

    const byType = {
      "mis-seed": assessments.filter((a) => a.type === "mis-seed"),
      balanced: assessments.filter((a) => a.type === "balanced"),
      "defense-first": assessments.filter((a) => a.type === "defense-first"),
      "offense-only": assessments.filter((a) => a.type === "offense-only"),
    };

    for (const [type, group] of Object.entries(byType)) {
      if (group.length === 0) continue;
      console.log(`--- ${type.toUpperCase()} ---`);
      group
        .sort((a, b) => b.team.kenpom.adjEM - a.team.kenpom.adjEM)
        .forEach((a) => console.log(formatCinderellaAssessment(a) + "\n"));
    }
  });

// ---- OVERVIEW ----
program
  .command("overview")
  .description("Quick overview of all teams sorted by AdjEM")
  .option("-d, --data <path>", "Team data JSON file")
  .option("-n, --top <n>", "Show top N teams", "30")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const sorted = [...teams]
      .filter((t) => t.kenpom.adjEM > 0)
      .sort((a, b) => b.kenpom.adjEM - a.kenpom.adjEM)
      .slice(0, parseInt(opts.top));

    console.log("=== TOP TEAMS BY ADJEM ===\n");
    console.log(
      "Rank  Team                          Seed  Conf       AdjEM   AdjO   AdjD   MaxRound"
    );
    console.log("-".repeat(95));

    for (const team of sorted) {
      const maxRound = maxViableRound(team);
      const seedStr = team.seed > 0 ? `${team.seed}` : "-";
      console.log(
        `#${team.kenpom.rank.toString().padEnd(4)} ${team.name.padEnd(30)} ${seedStr.padEnd(5)} ${team.conference.padEnd(10)} ${team.kenpom.adjEM.toFixed(1).padStart(6)}  #${team.kenpom.adjORank.toString().padEnd(4)} #${team.kenpom.adjDRank.toString().padEnd(4)} ${maxRound}`
      );
    }
  });

// ---- MULTI-MODEL EVALUATE ----
program
  .command("multi-evaluate")
  .description("Evaluate matchup using ALL 5 models + ensemble")
  .requiredOption("--team1 <name>", "First team")
  .requiredOption("--team2 <name>", "Second team")
  .option("-r, --round <round>", "Tournament round", "R64")
  .option("-d, --data <path>", "Team data JSON file")
  .option("--calibrated", "Use betting-analyzer-calibrated weights")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const team1 = resolveTeamOrThrow(opts.team1, teams);
    const team2 = resolveTeamOrThrow(opts.team2, teams);

    const weights = opts.calibrated ? getCalibratedWeights() : undefined;
    const ensemble = new EnsembleModel(weights);
    const prediction = ensemble.predict(team1, team2, opts.round);
    console.log(formatEnsemblePrediction(prediction));
    if (opts.calibrated) {
      console.log("\n[Calibrated with 892 NCAAB picks from betting analyzer]");
    }
  });

// ---- BETTING INSIGHTS ----
program
  .command("insights")
  .description("Show betting analyzer cross-reference insights for bracket calibration")
  .action(() => {
    console.log("=== BETTING ANALYZER CROSS-REFERENCE (892 NCAAB picks) ===\n");

    console.log("1. WHAT ACTUALLY PREDICTS WINS (stat differential W-L):");
    console.log("   Predictive:");
    console.log("     Injuries:          +1.621 (BY FAR #1 — injury awareness = edge)");
    console.log("     ATS Performance:   +1.562 (covering spreads = undervalued)");
    console.log("     Defense:           +1.040 (3x more predictive than offense!)");
    console.log("     Conference:        +0.787 (power conferences have real edge)");
    console.log("   Anti-predictive:");
    console.log("     Shooting %:        -3.372 (hot shooting = regression incoming)");
    console.log("     3PT Shooting:      -2.764 (same — unsustainable)");
    console.log("     Off Rebounding:    -2.288 (doesn't predict wins)");
    console.log("     Offensive Eff:     -2.171 (OVERVALUED by conventional analysis)");

    console.log("\n2. MONEYLINE IS YOUR EDGE:");
    console.log("     Moneyline: 63.9% win rate (brackets ARE moneyline bets!)");
    console.log("     Spread:    50.8% (coin flip)");
    console.log("     Totals:    50.6% (coin flip)");
    console.log("     Sweet spot: 55-64% model confidence → 67.2% actual wins");

    console.log("\n3. QUALITY OVER QUANTITY:");
    console.log("     3-4 edges: 56.6% (BEST)");
    console.log("     8+ edges:  52.4% (too many = market already priced it)");

    console.log("\n4. MARCH MADNESS BOOST:");
    console.log(`     March: ${(TOURNAMENT_BOOST.marchAccuracy * 100).toFixed(1)}% accuracy`);
    console.log(`     Feb:   ${(TOURNAMENT_BOOST.februaryAccuracy * 100).toFixed(1)}% accuracy`);
    console.log("     +6.6% edge during tournament — our approach works BETTER in March");

    console.log("\n5. CALIBRATED MODEL WEIGHTS (adjusted from betting data):");
    const cal = getCalibratedWeights();
    for (const [model, weight] of Object.entries(cal)) {
      console.log(`     ${model}: ${(weight * 100).toFixed(0)}%`);
    }
  });

// ---- MODELS INFO ----
program
  .command("models")
  .description("Show all prediction models and their weights")
  .action(() => {
    const ensemble = new EnsembleModel();
    console.log("=== MULTI-MODEL PREDICTION SYSTEM ===\n");
    console.log("5 independent models, each approaching predictions differently:\n");
    console.log("Model                   Weight  Focus");
    console.log("-".repeat(70));
    console.log("KenPom Efficiency       30%     AdjEM difference + staircase + two-way balance");
    console.log("Defensive Identity      20%     AdjD floors + glass cannon trap + champion profile");
    console.log("Market Intelligence     20%     Seed-as-market-proxy + conference tiers + ATS");
    console.log("Tempo & Matchup         15%     Pace dynamics + variance compression + style clash");
    console.log("Seed & History          15%     Historical rates + dead zones + Cinderella ceilings");
    console.log("\nInsights from betting analyzer (892 NCAAB picks):");
    console.log("  - Moneyline: 63.9% win rate (best edge)");
    console.log("  - March: 56.8% accuracy vs Feb 50.2%");
    console.log("  - Top features: implied_prob (12.6%), offensive_eff (7.1%), agent_spread (6.3%)");
    console.log("  - Model disagreement is a SIGNAL, not noise — flag high-spread matchups");
  });

// ---- COMPARE-METHODS ----
program
  .command("compare-methods")
  .description("Compare chalk vs smart builder vs MC across all 14 historical tournaments")
  .option("--fetch", "Use real BartTorvik data (recommended)")
  .action(async (opts) => {
    const result = await runBracketComparison(!!opts.fetch);
    console.log(result);
  });

// ---- RECALIBRATE ----
program
  .command("recalibrate")
  .description("Run 14-year historical recalibration — compare old vs new thresholds")
  .action(() => {
    runRecalibration();
  });

// ---- SMART-BRACKET (EV-optimized) ----
program
  .command("smart-bracket")
  .description("Build an EV-optimized bracket — picks the RIGHT upsets based on expected value math")
  .option("-d, --data <path>", "Team data JSON file")
  .option("--pool <size>", "Pool size: safe (small), balanced (medium), contrarian (large)", "balanced")
  .option("--champion <team>", "Lock a specific champion")
  .option("--sims <n>", "Monte Carlo simulations", "10000")
  .option("--calibrated", "Use calibrated weights")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} seeded teams. Need 64.`);
      process.exit(1);
    }

    const weights = opts.calibrated ? getCalibratedWeights() : undefined;
    const ensemble = new EnsembleModel(weights);

    console.log(`Building EV-optimized bracket (pool: ${opts.pool}, sims: ${opts.sims})...`);
    const sb = buildSmartBracket(teams, ensemble, {
      pool: opts.pool as "safe" | "balanced" | "contrarian",
      champion: opts.champion,
      sims: parseInt(opts.sims),
    });
    console.log(formatSmartBracket(sb));
  });

// ---- BRACKET-FOR (champion-diversified brackets) ----
program
  .command("bracket-for")
  .description("Generate N brackets, each with a different champion — maximum pool coverage")
  .option("-d, --data <path>", "Team data JSON file")
  .option("-n, --num <n>", "Number of champion brackets", "6")
  .option("--sims <n>", "Monte Carlo simulations", "10000")
  .option("--calibrated", "Use calibrated weights")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} seeded teams. Need 64.`);
      process.exit(1);
    }

    const weights = opts.calibrated ? getCalibratedWeights() : undefined;
    const ensemble = new EnsembleModel(weights);
    const brackets = generateChampionBrackets(teams, ensemble, parseInt(opts.num), parseInt(opts.sims));
    console.log(formatChampionBrackets(brackets));
  });

// ---- SCENARIOS ----
program
  .command("scenarios")
  .description("Generate tiered scenario brackets: 3 champions × 4 Final Fours × 8 Elite Eights")
  .option("-d, --data <path>", "Team data JSON file")
  .option("--calibrated", "Use betting-analyzer-calibrated weights")
  .option("--weights <json>", "Custom weights JSON")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);

    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} teams have seeds. Need 64 seeded teams.`);
      process.exit(1);
    }

    const weights = opts.weights
      ? JSON.parse(opts.weights)
      : opts.calibrated ? getCalibratedWeights() : getCalibratedWeights();
    const ensemble = new EnsembleModel(weights);

    const output = generateScenarios(teams, ensemble);
    console.log(formatScenarios(output));
  });

// ---- SIMULATE (Monte Carlo) ----
program
  .command("simulate")
  .description("Run Monte Carlo simulation — championship probabilities and mode bracket")
  .option("-d, --data <path>", "Team data JSON file")
  .option("--sims <n>", "Number of simulations", "5000")
  .option("--calibrated", "Use calibrated weights")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);
    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} seeded teams. Need 64.`);
      process.exit(1);
    }

    const weights = opts.calibrated ? getCalibratedWeights() : undefined;
    const ensemble = new EnsembleModel(weights);
    const numSims = parseInt(opts.sims);

    console.log(`Running ${numSims.toLocaleString()} simulations...`);
    const result = monteCarloSimulate(teams, ensemble, numSims);
    console.log(formatMonteCarloResult(result));
  });

// ---- BACKTEST ----
program
  .command("backtest")
  .description("Backtest model(s) against all 14 historical tournaments (2011-2025)")
  .option("--model <model>", "Model to test: all, kenpom, defense, market, tempo, seed, ensemble, calibrated", "all")
  .option("--fetch", "Fetch historical KenPom data from BartTorvik (uses placeholders if omitted)")
  .option("--mode <mode>", "Generation mode: chalk, balanced, upset-heavy", "chalk")
  .option("--validate", "Validate historical bracket data against tournament-data.ts")
  .action(async (opts) => {
    if (opts.validate) {
      console.log("=== VALIDATING HISTORICAL DATA ===\n");
      const errors = validateHistoricalData();
      if (errors.length === 0) {
        console.log("All historical data validated successfully!");
      } else {
        console.log(`Found ${errors.length} issues:`);
        errors.forEach((e) => console.log(`  - ${e}`));
      }
      return;
    }

    const mode = opts.mode as "chalk" | "balanced" | "upset-heavy";
    const modelMap: Record<string, { model: any; name: string }> = {
      kenpom: { model: new KenPomModel(), name: "KenPom Efficiency" },
      defense: { model: new DefensiveIdentityModel(), name: "Defensive Identity" },
      market: { model: new MarketModel(), name: "Market Intelligence" },
      tempo: { model: new TempoMatchupModel(), name: "Tempo & Matchup" },
      seed: { model: new SeedHistoryModel(), name: "Seed & History" },
      ensemble: { model: new EnsembleModel(), name: "Ensemble (default)" },
      calibrated: { model: new EnsembleModel(getCalibratedWeights()), name: "Ensemble (calibrated)" },
    };

    const modelsToTest = opts.model === "all"
      ? Object.values(modelMap)
      : [modelMap[opts.model]];

    if (!modelsToTest[0]) {
      console.error(`Unknown model: ${opts.model}. Options: all, kenpom, defense, market, tempo, seed, ensemble, calibrated`);
      process.exit(1);
    }

    const results = [];
    for (const { model, name } of modelsToTest) {
      console.log(`\nBacktesting: ${name}...`);
      const result = await runBacktest(model, name, mode, !!opts.fetch);
      results.push(result);
      console.log(formatBacktestResult(result));
    }

    if (results.length > 1) {
      console.log(formatModelComparison(results));
    }
  });

// ---- OPTIMIZE ----
program
  .command("optimize")
  .description("Grid search for optimal model weights across all historical tournaments")
  .option("--step <step>", "Weight step size (e.g., 0.05, 0.10)", "0.10")
  .option("--top <n>", "Show top N configurations", "10")
  .option("--adaptive", "Enable round-group-specific weight optimization (super model)")
  .option("--fetch", "Fetch historical KenPom data from BartTorvik")
  .action(async (opts) => {
    const step = parseFloat(opts.step);
    const topN = parseInt(opts.top);
    const fetchData = !!opts.fetch;

    if (opts.adaptive) {
      const result = await runAdaptiveOptimization(step, topN, fetchData);
      console.log(formatOptimizationResult(result));
    } else {
      const result = await runStaticOptimization(step, topN, fetchData);
      console.log(formatOptimizationResult(result));
    }
  });

// ---- GENERATE-OPTIMAL ----
program
  .command("generate-optimal")
  .description("Generate 2026 brackets using optimized weights from backtest data")
  .option("-d, --data <path>", "Team data JSON file")
  .option("--weights <json>", "Custom weights JSON (e.g., '{\"KenPom Efficiency\": 0.25, ...}')")
  .action(async (opts) => {
    const teams = await loadTeams(opts.data);

    const seeded = teams.filter((t) => t.seed > 0);
    if (seeded.length < 64) {
      console.error(`Only ${seeded.length} teams have seeds. Need 64 seeded teams.`);
      process.exit(1);
    }

    const weights = opts.weights ? JSON.parse(opts.weights) : getCalibratedWeights();
    const ensemble = new EnsembleModel(weights);

    console.log("=== OPTIMIZED BRACKET GENERATION ===");
    console.log(`Weights: ${Object.entries(weights).map(([m, w]) => `${m}: ${((w as number) * 100).toFixed(0)}%`).join(", ")}\n`);

    const modes: Array<"chalk" | "balanced" | "upset-heavy"> = ["chalk", "balanced", "upset-heavy"];
    for (const mode of modes) {
      const predictor: Predictor = (teamA, teamB, round) => {
        const pred = ensemble.predict(teamA, teamB, round);
        return pred.predictedWinner;
      };

      const result = generateBracket(teams, mode, predictor);
      console.log(formatGeneratedBracket(result));
      console.log("");
    }
  });

program.parse();
