# NCAAB March Madness — Full Tournament Analysis (2019–2025)

6 years of NCAA Tournament data (2019, 2021, 2022, 2023, 2024, 2025) broken down round by round. The goal is simple: understand *why* teams actually win and advance, not just that they did. Every upset, every Cinderella run, every chalk result has a statistical explanation hiding in the pre-tournament data. This repo finds it.

*(2020 was cancelled due to COVID-19)*

---

## Understanding the Stats

Before diving in, here's what each metric actually means in plain English. These numbers come from [KenPom.com](https://kenpom.com), which tracks every Division I team's efficiency throughout the season.

**KenPom Rank** — The overall ranking of every D1 team by combined offensive and defensive efficiency. Think of it as the most honest ranking available — it doesn't care about brand names, it measures how efficiently a team scores and prevents scoring against the competition they've faced. A team ranked KenPom #5 is genuinely one of the 5 best teams in the country by this measure.

**AdjEM (Adjusted Efficiency Margin)** — The single most predictive number in this entire dataset. It measures how many points better or worse a team is per 100 possessions compared to an average D1 team, after adjusting for the quality of opponents they've played. A team with AdjEM +30 would beat an average D1 team by 30 points per 100 possessions. Champions in this study ranged from +26 to +36. Teams that exit in R32 typically sit around +14 to +16.

**AdjO (Adjusted Offensive Efficiency Rank)** — How efficient a team's offense is nationally, adjusted for opponent quality. This is a rank — lower is better. AdjO #1 means the most efficient offense in the country. Think of it as "how well does this team convert possessions into points against good defenses."

**AdjD (Adjusted Defensive Efficiency Rank)** — How efficient a team's defense is nationally, adjusted for opponent quality. Also a rank — lower is better. AdjD #1 means the stingiest defense in the country. This is the stat that separates teams with real tournament legs from teams that look good on the surface.

**Tempo** — Possessions per game. A fast-tempo team (75+ possessions/game) plays an up-and-down style with more total shots. A slow-tempo team (65-70 possessions/game) controls the pace and compresses the game — which is a major weapon for underdogs because fewer possessions means less time for the better team's talent to show up.

**ATS (Against the Spread)** — Did a team cover the betting point spread? A team that wins 65% ATS means bettors who took them against the spread would have profited over time. All ATS data is in the **Betting Appendix** sections of each file — kept separate from the analytical content.

**SOS (Strength of Schedule)** — How tough were the opponents a team faced during the regular season? A top-10 SOS means a team played against some of the hardest competition in the country, which matters enormously in March when they face elite opponents back to back.

---

## Files in This Repo

| File | What It Covers | Years |
|------|----------------|-------|
| [COMPLETE_MARCH_MADNESS_ANALYSIS.md](./COMPLETE_MARCH_MADNESS_ANALYSIS.md) | Every round in one document — year-by-year results, champion profiles, why teams win at each stage, betting appendix | 2019–2025 |
| [R64_R32_ANALYSIS.md](./R64_R32_ANALYSIS.md) | Deep dive on the first two rounds — why teams win, Cinderella case studies (with the specific in-game stats that drove each upset), warning signs for vulnerable favorites, full betting appendix | 2019–2025 |
| [ELITE8_FINAL4_ANALYSIS.md](./ELITE8_FINAL4_ANALYSIS.md) | Elite 8 and Final Four deep dive — what separates Sweet 16 teams from Final Four teams, why champions win, betting appendix | 2019–2025 |
| [SWEET16_ANALYSIS.md](./SWEET16_ANALYSIS.md) | Sweet 16 deep dive — the efficiency cliff from R32 to Sweet 16, why certain seeds almost never advance, Cinderella profiles, betting appendix | 2019–2024 |

**Start with `COMPLETE_MARCH_MADNESS_ANALYSIS.md`** if you want everything in one place. Use the individual files when you want round-specific depth. Every file follows the same structure: the analytical "why teams win" content comes first, the ATS/betting data is in clearly labeled appendix sections at the end.

---

## The Core Finding: The Efficiency Staircase

Every round of the tournament has a distinct efficiency floor. Miss the floor and you exit — not because of a bad game, but because the opponent's quality exposes a structural weakness that worked fine against weaker competition all season.

| Stage | What You Need (AdjEM) | Defense Required (AdjD Rank) | Key Separator |
|-------|----------------------|------------------------------|---------------|
| Win R64 | +8 to +10 | Any — one-game variance matters more | Single-game matchup luck is enough |
| Win R32 | +14 to +16 | Top 55 strongly preferred | Preparation advantage kicks in |
| Reach Sweet 16 | **+22 to +24** | **Top 40 — near-required** | The steepest cliff in the bracket |
| Reach Elite 8 | +20+ (90% of teams) | Top 30 (73% of teams) | One-dimensional teams get exposed |
| Reach Final Four | +25+ | Top 17–38 documented | Matchup-proof competence on both ends |
| Win Championship | +26 to +36 | Top 25 (all 6 champions) | Structural advantage over every opponent |

**The R32 → Sweet 16 jump is the biggest cliff.** AdjEM has to rise from roughly +14 (R32 teams) to +22 (Sweet 16 teams) — an ~8-point gap that's steeper than any other round transition. Teams in the +14 to +21 range live and die by matchup; teams above +22 have a structural advantage that compounds.

---

## Quick Reference — Top Findings By Round

### Round of 64 / Round of 32

**Why Teams Win — Statistical**
| Finding | What It Means |
|---------|---------------|
| Defense floor | Every team that reached the Sweet 16 had AdjD inside the top 40 nationally. The one exception (Oral Roberts 2021, AdjD #285) won on offense alone — and exited the moment they faced a real defense in R32. |
| The steepest efficiency cliff | Getting from R32 to Sweet 16 requires a team's AdjEM to jump from roughly +14 to +22. That ~8-point gap is the hardest single jump in the bracket. |
| Why Cinderellas fade in R32 | Most 12-15 seed R64 wins happen because of an AdjEM gap smaller than expected, not because the underdog is genuinely better. In R32, the opponent is comparably qualified — the luck advantage disappears. |
| Why favorites lose | The most consistent warning sign: a team's AdjD (defensive rank) is weaker than expected for their seeding. Kentucky 2022 was seeded 2nd but had a defensive rank far below what a 2-seed should have — Saint Peter's exploited it. Same Kentucky pattern in 2024 vs Oakland. |
| KenPom inversions | When a lower seed (say, a 12-seed) actually ranks *higher* on KenPom than their opponent (the 5-seed), that team wins outright more than 60% of the time. The "upset" isn't really an upset — the committee mis-seeded them. |
| Extreme Team warning | Teams that rank top-10 nationally in either offense OR defense, but rank outside the top 50 in the other: **zero championships in 22 years.** One elite dimension isn't enough when opponents have film and can attack the weakness. |
| Cinderella ceilings | A defense-first Cinderella (great AdjD, weak AdjO) can reach the Elite 8, but eventually faces an opponent with both elite offense and defense. A balanced Cinderella (both sides inside top 60) can reach the Final Four. An offense-only Cinderella (great AdjO, weak AdjD) maxes out in R32. |

**Betting Reference — ATS**
| Finding | Detail |
|---------|--------|
| Best ATS bet | 11-seeds vs 6-seeds: **63.5% ATS** since 2009 — because most 11-seeds are power conference mis-seeds, not true underdogs |
| Worst ATS bet | Small chalk (-1 to -3 point favorites): **39.5% ATS** — spreads set in the middle zone where neither side has value |
| R32 rule | Fade the R1 Cinderella (12-15 seeds): **0-10 ATS** since 1998 — the market overreacts to Cinderella stories |
| R32 lean | 10/11-seeds that won R1: **13-5 ATS since 2016** — these are legitimate top-50 programs, not flukes |
| Totals (6v11) | Under **39-19-2 (67.2%)** — coaching gets conservative; when 6-seed is favored by 4+: **80% Under** |
| Totals (8v9) | Over **19-of-29 (65.5%)** — the only matchup in the tournament where Over is the data-backed play |
| First Four winners | **35-3 ATS (92.1%)** in R64 since 2013 — teams that survived a play-in game are battle-tested and undervalued |

---

### Sweet 16

**Why Teams Reach the Sweet 16 — Statistical**
| Finding | What It Means |
|---------|---------------|
| The efficiency cliff | Teams that exit in R32 average around AdjEM +14. Teams that advance to the Sweet 16 average +22. That's not a small difference — it's the difference between a good team and a legitimate contender. |
| Defense is the floor | AdjD inside the top 40 is effectively required to reach the Sweet 16. You can survive one game with a weak defense. You can't survive two games against prepared, film-studied opponents. |
| The 6-9 seed dead zone | Seeds 6 through 9 produced just 7.5% of Sweet 16 spots across 5 years. It's not because those teams are bad — it's pure bracket position. 6-seeds face legitimate top-50 programs disguised as 11-seeds in R32. 8-9 seeds who win R1 face a 1-seed in R32. The path is structurally punishing. |
| Why 11-seeds appear every year | An 11-seed reached the Sweet 16 every single year studied. Almost all of them were power conference at-large teams with KenPom rankings of 25–40 — they were better than their seed implied. UCLA in 2021 was KenPom top-20. NC State in 2024 won the ACC Tournament. These aren't Cinderellas. |
| True Cinderella formula | The three 15-seeds that reached the Sweet 16 all shared the same profile: elite defense (AdjD top 30), slow tempo to control possessions, and a specific defensive weakness in the opponent they were facing. Saint Peter's beat Kentucky because Kentucky's defense was weak for a 2-seed. Princeton beat Arizona because Princeton's AdjD #13 defense held them to 4-for-25 from three. |

**Betting Reference**
| Finding | Detail |
|---------|--------|
| Best ATS fade | 5+ pt Sweet 16 favorites: **7-15 ATS (31.8%)** since 2017 — the market overprices big favorites |
| Best ATS back | 4-6 pt Sweet 16 underdogs: **56.7% ATS** since 1990 — the most durable trend in March |
| All underdogs | Sweet 16 underdogs overall: **57.6% ATS** since 2011 |

---

### Elite 8

**Why Teams Reach the Elite 8 — Statistical**
| Finding | What It Means |
|---------|---------------|
| Two-way requirement | At the Elite 8, one-dimensional teams get exposed. Opponents have full film packages and will attack whichever side of the ball is weaker. 87.5% of Elite 8 teams had both AdjO and AdjD inside the top 30 nationally. |
| The Extreme Team ceiling | A team with an elite offense (top-10 nationally) but a weak defense (outside top 50) — or vice versa — produces an easy scouting report. Run plays against their weakness, limit their strength. Zero of 155 such teams won a championship in 22 years. |
| How hard it is to get here from the outside | Only 3 of 48 Elite 8 teams (6.25%) came from outside KenPom's top 35 in this study. All three (Saint Peter's, Princeton, NC State) had either an elite defense in the top 15 nationally, or a balanced profile with AdjEM +14 or better. |
| The defense-first Cinderella cap | Defense-first teams — great defense, weaker offense — tend to max out at the Elite 8. They get there by keeping games close, but eventually face an opponent with both elite offense and elite defense, and the offense limitation ends the run. |

**Betting Reference**
| Finding | Detail |
|---------|--------|
| Best bet in tourney | 5-seeds in Elite 8: **8-1 ATS** since 1985 — best historical edge in the tournament |
| Fade | 1-seeds in Elite 8: **43.4% ATS** since 2001 — overpriced by the market |
| Underdogs | All Elite 8 underdogs: **57% ATS** all-time |
| Chalk trap | Elite 8 favorites under 5 pts: **1-10-1 ATS (9%)** recently |

---

### Final Four & Championship

**Why Champions Win — Statistical**
| Finding | What It Means |
|---------|---------------|
| The AdjEM floor | Getting to the Final Four requires AdjEM of roughly +25 or better. Below +20, reaching the Final Four is a structural long shot regardless of seed. The efficiency gap is simply too large to overcome across multiple elite opponents. |
| The champion gate — never broken | Every champion from 2019–2025 met all three criteria: KenPom top 6, offensive efficiency inside the top 25 nationally, and defensive efficiency inside the top 25 nationally. No champion has ever come from outside the KenPom top 6 in the modern efficiency era. |
| Three ways to win a title | **(1) Efficiency dominance** — UConn 2023 (+32 AdjEM) and 2024 (+36.4, highest ever) were simply better than every opponent on both ends. **(2) Two-way balance + a variance absorber** — Virginia 2019 and Florida 2025 controlled pace with elite defense and got to the free throw line at elite rates, which absorbs the one close game every champion faces. **(3) Depth + adaptability** — Kansas 2022 erased a 16-point halftime deficit because their bench depth gave Bill Self options in the second half that opponents couldn't prepare for. |
| Final Four winners cover 83% | The team that wins the Final Four game covers the spread 83% of the time in the championship. They have the momentum, the conditioning, and the structural efficiency advantage. |

**Betting Reference**
| Finding | Detail |
|---------|--------|
| Best rule | Pick the winner — **83% ATS** (35-7-2 since 2001) |
| Best conference | ACC teams in Final Four: **10-6 ATS** since 2001 |
| Underdogs | Cover more than they win: **12-9-1 ATS, 6-16 SU** |

---

## Champion Predictor Gate

Every champion from 2019–2025 met **all** of these criteria entering the tournament. This is not a betting system — it's a filter for identifying teams with a realistic shot at the title:

- **KenPom top 6** — No champion has come from outside this range. Ever.
- **AdjEM above +25** — The efficiency floor. Most champions were +29 or higher.
- **AdjO top 25** — Elite offense is non-negotiable. All 6 champions scored efficiently against good defenses.
- **AdjD top 25** — Elite defense is non-negotiable. One-dimensional teams don't win championships.
- **SOS top 33** — Schedule-tested. Champions faced hard competition all season and proved it.
- **Seed 1–4** — Average champion seed is 1.5. The committee's seeding generally reflects the underlying efficiency data.
- **Power conference** — ACC, Big 12, Big East, or SEC. Six championships, six power conference teams.
- **Top 25 free throw attempt rate** — Getting to the line wins close games. It's the variance absorber.
- **Proven head coach** — Every 2019–2025 champion had a coach with multiple tournament appearances.

---

## Champion Profile — All 6 Years

| Year | Champion | Seed | Conf | KenPom | AdjEM | AdjO | AdjD | What Made Them Different |
|------|----------|------|------|--------|-------|------|------|--------------------------|
| 2019 | Virginia | 1 | ACC | #1 | ~+34 | 2nd | 5th | Slowest tempo in America — compressed every game to 55-60 possessions, suffocated opponents with pack-line defense |
| 2021 | Baylor | 1 | Big 12 | ~#2 | ~+29 | ~8th | ~22nd | Three interchangeable elite guard scorers — no single defensive assignment solved them; Gonzaga (AdjO #1) couldn't keep up |
| 2022 | Kansas | 1 | Big 12 | ~#6 | ~+26 | ~15th | ~12th | Depth + second-half adjustments — erased a 16-point deficit in the championship game on bench production |
| 2023 | UConn | 4 | Big East | #1 | ~+32 | Top 10 | Top 10 | Won every game by 13+ points — the first team to do that since the field expanded to 64 teams |
| 2024 | UConn | 1 | Big East | #1 | +36.4 | 1st | 11th | +140 point differential across 6 games — the most dominant single-tournament performance ever recorded |
| 2025 | Florida | 1 | SEC | ~#1 | +36.2 | ~4th | ~4th | Top-4 nationally in both offense AND defense, plus #1 in free throw attempts — two-way excellence with built-in variance absorption |

---

## Seed Distribution — Where Advancement Actually Comes From

### Sweet 16 (80 spots across 5 years)
Seeds 1–5 hold **72.5%** of all Sweet 16 spots. Seeds 6–9 combined hold just **7.5%** — the dead zone created by bracket positioning, not talent. 11-seeds appeared every single year. Seeds 13 and 14 have **never** made the Sweet 16 in this dataset.

### Elite 8 (48 spots across 6 years)
Seeds 1–3 hold **66%** of spots. Double-digit seeds reached the Elite 8 in 4 of 6 years — but almost always with elite defensive profiles or power conference credentials.

### Final Four (24 spots across 6 years)
1-seeds hold **54%** of all Final Four spots. Double-digit seeds made the Final Four in 3 of 6 years: UCLA (11-seed, 2021, KenPom top-20), FAU (9-seed, 2023, KenPom #17), NC State (11-seed, 2024, ACC Tournament champion). None of them were true underdogs by efficiency metrics.

---

## Conference Power Rankings (Final Four Appearances 2019–2025)

| Conference | Final Four Apps | Championships | Notes |
|------------|----------------|---------------|-------|
| Big 12 | 6 | 2 | Baylor 2021, Kansas 2022 |
| ACC | 5 | 1 | Virginia 2019 |
| Big East | 5 | 2 | UConn 2023, UConn 2024 |
| SEC | 5 | 1 | Florida 2025 |
| Big Ten | 3 | 0 | 0-for-3 in championships despite Final Four appearances |
| WCC (Gonzaga) | 2 | 0 | 2 Final Fours, 0 rings — Gonzaga's offense-heavy profile has met its ceiling twice |
| Mid-Major | 3+ | 0 | FAU, NC State, UCLA all covered their spreads deep in the bracket but none won a title |

---

## The Cinderella Checklist

Non-power conference teams that reached the Elite 8 or deeper shared every one of these traits:

- **Defense-first identity** — zone or physical man-to-man; AdjD inside the top 30 nationally
- **Slow tempo** — below 70 possessions/game; limits total possessions so the talent gap matters less
- **A singular scoring alpha** — one player the opponent has to account for (Max Abmas, Daryl Banks, DJ Burns)
- **Won their conference tournament** — proven ability to win consecutive high-pressure games
- **KenPom top 50** — they were never truly overmatched; the committee mis-assessed them
- **Upperclassman-heavy roster** — graduate transfers and 4th/5th-year players who handle elimination pressure better

**The 11-seed misconception:** Most 11-seeds that go deep (UCLA, NC State, Michigan, Iowa State) are power conference teams with KenPom rankings of 25–40. They aren't Cinderellas — they were just under-seeded. The committee put them at 11 due to perception bias; the efficiency data saw them as 4–6 seeds all along.

---

## What Does NOT Predict Advancement

| Stat | Why It Fails |
|------|-------------|
| Regular season win total | A 28-3 team from a weak conference loses to an 18-13 ACC team because the schedule lied about their quality |
| 3-point shooting percentage | Too volatile across a small sample of games — regresses to the mean fast in March |
| Blue Blood brand | In 2023, Kansas, Kentucky, Duke, and UNC all exited before the Sweet 16. The brand is already priced into the point spread. It doesn't add wins. |
| Regular season margin of victory | Feasting on weak opponents doesn't prepare teams for back-to-back elite competition in elimination games |
| Coach name recognition | Elite coaches lose in the first round every year. The name on the sideline doesn't compensate for an AdjD outside the top 50. |

---

*Research compiled February 2026. Covers 2019, 2021, 2022, 2023, 2024, 2025 NCAA Tournaments.*
*All four files: statistical analysis of why teams win is primary content; ATS/betting data in clearly labeled appendix sections.*
