# NCAAB March Madness — Full Tournament Analysis (2019–2025)

> 6-year research report covering every round of the NCAA Tournament across 2019, 2021, 2022, 2023, 2024, and 2025.
> *(2020 cancelled due to COVID-19)*
> Goal: identify the statistical profiles, ATS edges, and Cinderella traits that predict advancement at every stage — Sweet 16 through champion.
> Intended for use in NCAAB betting model development.

---

## Files in This Repo

| File | What It Covers | Years |
|------|----------------|-------|
| [COMPLETE_MARCH_MADNESS_ANALYSIS.md](./COMPLETE_MARCH_MADNESS_ANALYSIS.md) | Full bracket — Sweet 16 + Elite 8 + Final Four combined in one doc | 2019–2025 |
| [R64_R32_ANALYSIS.md](./R64_R32_ANALYSIS.md) | Deep dive — R64 + R32 only — Why teams win (statistical + efficiency analysis) and Betting Appendix (ATS/totals data) | 2019–2025 |
| [ELITE8_FINAL4_ANALYSIS.md](./ELITE8_FINAL4_ANALYSIS.md) | Deep dive — Elite 8 and Final Four only, champion profiles, ATS edges | 2019–2025 |
| [SWEET16_ANALYSIS.md](./SWEET16_ANALYSIS.md) | Deep dive — Sweet 16 only, seed distribution, conference trends, Cinderella traits | 2019–2024 |

**Start with `COMPLETE_MARCH_MADNESS_ANALYSIS.md`** if you want everything in one place. Use the individual files for deep research on specific rounds. **`R64_R32_ANALYSIS.md` is the most analytically complete file** — it covers why teams win statistically (efficiency cliffs, Cinderella case studies, favorite warning signs) and includes a full Betting Appendix with efficiency tiers, KenPom upset thresholds, and the ATS decision tree.

---

## Quick Reference — Top Findings By Round

### Round of 64 / Round of 32

**Why Teams Win — Statistical**
| Finding | Detail |
|---------|--------|
| Defense floor | AdjD top 40 required for any Sweet 16+ run — every exception exited in R32 |
| Efficiency cliff | R32→Sweet 16 is the steepest jump: AdjEM must rise from +14 to +22+ |
| Why chalk dominates R32 | Cinderella R64 wins rely on AdjEM gaps + luck; regression hits hard in R32 |
| Why favorites lose | Defensive weakness relative to seed — Kentucky 2022 (AdjD weak for 2-seed) and 2024 (AdjD #109 for 3-seed) both lost |
| KenPom inversion | Lower seed ranked higher overall: **60%+ outright win rate** — not a real upset by efficiency |
| Extreme Team warning | Top 10 one metric, outside top 50 other: **0 championships in 22 years** |
| Cinderella ceiling | Defense-first: Elite 8 max / Balanced: Final Four possible / Offense-first: R32 max |
| Elite 8 floor | KenPom top 20 + AdjEM +20+ required (**87-90% of Elite 8 teams**) |

**Betting Reference — ATS**
| Finding | Detail |
|---------|--------|
| Best ATS bet | 11-seeds vs 6-seeds: **63.5% ATS** since 2009 |
| Worst ATS bet | Small chalk -1 to -3: **39.5% ATS** — dead zone |
| R32 rule | Fade R1 Cinderellas (12-15 seeds): **0-10 ATS** since 1998 |
| R32 lean | 10/11-seeds that won R1: **13-5 ATS since 2016** |
| Totals (6v11) | Under **39-19-2 (67.2%)** — when 6-seed favored 4+: **80% Under** |
| Totals (8v9) | Over **19-of-29 (65.5%)** — only matchup to bet the Over |
| First Four winners | **35-3 ATS (92.1%)** in R64 since 2013 |

### Sweet 16
| Finding | Detail |
|---------|--------|
| Best predictor | KenPom top 25 = **~80% Sweet 16 rate** |
| Defense floor | Top 30 AdjD = required to be a legitimate contender |
| Dead zone | Seeds 6–9 = only **7.5% of Sweet 16 spots** combined |
| 11-seed anomaly | An 11-seed appeared in the Sweet 16 **every single year** studied |
| Never happened | Seeds 13–14 have **NEVER** made the Sweet 16 in these 6 years |
| Best ATS fade | 5+ pt Sweet 16 favorites: **7-15 ATS (31.8%)** since 2017 |
| Best ATS back | 4-6 pt Sweet 16 underdogs: **56.7% ATS** since 1990 |
| All underdogs | Sweet 16 underdogs overall: **57.6% ATS** since 2011 |

### Elite 8
| Finding | Detail |
|---------|--------|
| Best bet in tourney | 5-seeds in Elite 8: **8-1 ATS** since 1985 — auto-buy |
| Fade | 1-seeds in Elite 8: **43.4% ATS** since 2001 |
| Underdogs | All Elite 8 underdogs: **57% ATS** all-time |
| Mid-major edge | Non-power conference teams in Elite 8: **60% ATS** since 2003 |
| Chalk trap | Elite 8 favorites under 5 pts: **1-10-1 ATS (9%)** recently |
| Both teams seed 3+ | Take the higher seed number: **8-2 ATS** since 2013 |

### Final Four
| Finding | Detail |
|---------|--------|
| Best rule | Pick the winner — they cover **83%** of the time (35-7-2 ATS since 2001) |
| Best conference | ACC teams in Final Four: **10-6 ATS** since 2001 |
| 1-seeds | Dominant SU (favorites 5+ win 19-3) but moderate ATS (13-8-1) |
| Underdogs | Cover more than they win: **12-9-1 ATS, 6-16 SU** |

---

## Champion Predictor Gate

Every champion 2019–2025 met ALL of these criteria at tournament time:

- [ ] **KenPom top 6** overall rank
- [ ] **AdjEM above +25** (most were +29 or higher)
- [ ] **AdjO top 25**
- [ ] **AdjD top 25** — two-way excellence is non-negotiable
- [ ] **SOS top 33** — schedule-tested résumé
- [ ] **Seed 1–4** (avg champion seed: 1.5)
- [ ] **Power conference** — ACC, Big 12, Big East, or SEC
- [ ] **Top 25 free throw attempt rate** — variance absorber in close games
- [ ] **Proven head coach** with multiple tournament appearances

**No champion since 2019 had a sub-top-6 KenPom ranking at tournament time.**

---

## Champion Profile — All 6 Years

| Year | Champion | Seed | Conf | KenPom | AdjEM | AdjO | AdjD | Signature |
|------|----------|------|------|--------|-------|------|------|-----------|
| 2019 | Virginia | 1 | ACC | #1 | ~+34 | 2nd | 5th | Pack-line D, slowest tempo in nation |
| 2021 | Baylor | 1 | Big 12 | ~#2 | ~+29 | ~8th | ~22nd | Best 3PT team in America |
| 2022 | Kansas | 1 | Big 12 | ~#6 | ~+26 | ~15th | ~12th | Erased 16-pt deficit in championship |
| 2023 | UConn | 4 | Big East | #1 | ~+32 | Top 10 | Top 10 | Won every game by 13+ pts |
| 2024 | UConn | 1 | Big East | #1 | +36.4 | 1st | 11th | +140 point differential — best ever |
| 2025 | Florida | 1 | SEC | ~#1 | +36.2 | ~4th | ~4th | Top 3 FT rate + offensive rebounding |

---

## Seed Distribution Summary

### Sweet 16 (80 spots across 5 years)
- Seeds 1–5: **72.5%** of all spots
- Seeds 6–9: **7.5%** combined — the dead zone
- 11-seeds: appeared every single year
- Seeds 13–14: never happened

### Elite 8 (48 spots across 6 years)
- Seeds 1–3: **66%** of all spots
- Seeds 5+: only **26%** combined
- Double-digit seeds made Elite 8 in 4 of 6 years

### Final Four (24 spots across 6 years)
- 1-seeds: **54%** of all Final Four spots
- Double-digit seeds reached Final Four in 3 of 6 years (UCLA 11, FAU 9, NC State 11)

---

## Conference Power Rankings (Final Four Appearances 2019–2025)

| Conference | Final Four Apps | Championships | Notes |
|------------|----------------|---------------|-------|
| Big 12 | 6 | 2 | Baylor 2021, Kansas 2022 |
| ACC | 5 | 1 | Virginia 2019 |
| Big East | 5 | 2 | UConn 2023, UConn 2024 |
| SEC | 5 | 1 | Florida 2025 |
| Big Ten | 3 | 0 | 0-for-3 in championships |
| WCC (Gonzaga) | 2 | 0 | 2 Final Fours, 0 rings |
| Mid-Major | 3+ | 0 | FAU, NC State, UCLA — cover, don't win |

---

## Cinderella Checklist (Non-Power Conference)

Teams that made Elite 8 or deeper without being from a power conference all shared:
- Defense-first identity (zone or physical man-to-man)
- Slow tempo — outside top 100 in adjusted pace (equalizes talent gap)
- A singular scoring alpha who carried them
- Won their conference tournament
- KenPom top 50 at tournament time (they weren't truly overmatched)
- Upperclassman-heavy rosters (grad transfers, 4th/5th year players)
- Positive turnover margin

**The 11-seed trap:** Most 11-seeds that go deep are power conference at-large teams (mis-seeds), not true Cinderellas. UCLA, NC State, Michigan — these are legitimate top-40 KenPom programs.

---

## What Does NOT Predict Advancement

| Stat | Why It Fails |
|------|-------------|
| Regular season win total | Weak SOS inflates records |
| 3-point percentage | Too volatile — regresses fast in March |
| Blue Blood brand | 2023: Kansas, Kentucky, Duke, UNC all eliminated before Sweet 16 |
| Regular season margin of victory | Doesn't transfer vs elite tournament opponents |
| Coach name recognition | Upsets happen to elite coaches every year |

---

*Research compiled February 2026. Data covers 2019, 2021, 2022, 2023, 2024, 2025 NCAA Tournaments.*
*All files intended for NCAAB betting model development.*
