# NCAAB Sweet 16 Analysis

**Deep-dive matchup analysis for NCAA Tournament Sweet 16 and beyond -- 6 years of KenPom efficiency data revealing why teams actually win in March.**

![Status](https://img.shields.io/badge/status-maintained-blue)
![Format](https://img.shields.io/badge/format-markdown-lightgrey)

## What It Does

A comprehensive statistical analysis of every NCAA Tournament from 2019-2025 (excluding 2020), breaking down round-by-round what separates winners from losers using KenPom efficiency metrics. Identifies the "Efficiency Staircase" -- the distinct AdjEM floor each tournament round demands -- and documents why upsets happen, how Cinderellas are built, and what champion profiles actually look like.

## Features

- **Efficiency Staircase** -- AdjEM floors by round (R64: +8, R32: +14, S16: +22, E8: +20, FF: +25, Champ: +26-36)
- **Champion Gate filter** -- 8 criteria every 2019-2025 champion met (KenPom top 6, AdjEM +25, AdjO/AdjD top 25, etc.)
- **Cinderella classification** -- defense-first vs balanced vs offense-only profiles with advancement ceilings
- **Round-by-round analysis** -- R64/R32, Sweet 16, Elite 8, Final Four each with statistical findings and ATS betting data
- **Seed distribution** -- where advancement actually comes from (seeds 6-9 hold just 7.5% of Sweet 16 spots)
- **6 champion profiles** -- Virginia, Baylor, Kansas, UConn (x2), Florida with what made each different

## Analysis Files

| File | Coverage |
|------|----------|
| `COMPLETE_MARCH_MADNESS_ANALYSIS.md` | Everything in one document -- all rounds, champions, betting appendix |
| `R64_R32_ANALYSIS.md` | First two rounds -- upsets, Cinderella case studies, vulnerable favorites |
| `SWEET16_ANALYSIS.md` | Sweet 16 -- the efficiency cliff, the 6-9 seed dead zone |
| `ELITE8_FINAL4_ANALYSIS.md` | Elite 8 and Final Four -- two-way requirements, champion gate |

## Tech Stack

- **Markdown** (analysis documents)
- **KenPom / BartTorvik** data (AdjEM, AdjO, AdjD, Tempo, SOS)
- **HTML** (index page)

## Quick Start

Start with `COMPLETE_MARCH_MADNESS_ANALYSIS.md` for the full picture. Use individual files for round-specific depth.

## Key Finding

The R32 to Sweet 16 jump is the steepest cliff in the bracket: AdjEM must rise from ~+14 to ~+22, an 8-point gap larger than any other round transition. Teams in the +14 to +21 range live and die by matchup; teams above +22 have a structural advantage that compounds.

## License

MIT
