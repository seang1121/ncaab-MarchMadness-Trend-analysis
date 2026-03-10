# CLAUDE.md

## What This Repo Is

A 6-year study (2019, 2021–2025) of why teams win and advance in the NCAA Tournament, built on KenPom efficiency metrics. No source code — just Markdown analysis and a GitHub Pages landing page.

Use this file as a quick-reference playbook when filling out a bracket or evaluating matchups. The detailed analysis lives in the files listed below.

---

## How to Use This for Your Bracket

### Step 1 — Identify Your Champion (Start Here)

Every champion from 2019–2025 passed **all** of these gates. If a team fails any one, fade them for the title:

| Gate | Threshold | Why It Matters |
|------|-----------|----------------|
| KenPom Rank | Top 6 | No champion has ever come from outside this range |
| AdjEM | +25 or higher | The efficiency floor — most champions were +29+ |
| AdjO Rank | Top 25 | Elite offense is non-negotiable |
| AdjD Rank | Top 25 | Elite defense is non-negotiable |
| SOS | Top 33 | Must be schedule-tested against real competition |
| Seed | 1–4 | Average champion seed is 1.5 |
| Conference | Power conference | All 6 champions came from ACC, Big 12, Big East, or SEC |
| FT attempt rate | Top 25 | Getting to the line absorbs variance in close games |

**Action:** Pull up KenPom rankings. Filter to teams meeting all gates. Those are your realistic title contenders — usually 3–5 teams.

### Step 2 — Apply the Efficiency Staircase (Round by Round)

Each round has a distinct efficiency floor. Use this to decide who advances:

| Round | AdjEM Floor | Defense Requirement | What to Look For |
|-------|-------------|--------------------|--------------------|
| R64 winner | +8 to +10 | Any | Check for KenPom inversions — if the lower seed ranks higher on KenPom, pick the upset (60%+ win rate) |
| R32 winner | +14 to +16 | AdjD top 55 | Cinderellas from R64 almost always lose here (0-10 ATS since 1998) |
| Sweet 16 | +22 to +24 | **AdjD top 40** | This is the steepest cliff — the +14 to +22 gap eliminates most mid-tier teams |
| Elite 8 | +20+ | AdjD top 30 | One-dimensional teams get exposed — need both AdjO and AdjD top 30 |
| Final Four | +25+ | AdjD top 25 | Must be matchup-proof on both ends |
| Champion | +26 to +36 | AdjD top 25 | See champion gate above |

### Step 3 — Flag Upsets Using Red Flags and Green Flags

**Red flags (pick the upset):**
- Favorite's AdjD is weak for their seed (e.g., a 2-seed with AdjD outside top 40)
- KenPom inversion — the lower seed actually ranks higher on KenPom
- "Extreme Team" — top-10 in AdjO or AdjD but outside top-50 in the other (0 championships in 22 years)
- Seeds 6–9 in R32 — bracket position makes this a dead zone (only 7.5% of Sweet 16 spots)

**Green flags (trust the underdog):**
- 11-seed vs 6-seed — 63.5% ATS since 2009; most 11s are power conference mis-seeds with KenPom 25–40
- Defense-first Cinderella — AdjD top 30, slow tempo (<70 possessions), won conference tournament
- First Four winner in R64 — 92.1% ATS since 2013
- 10/11-seeds that won R64 entering R32 — 13-5 ATS since 2016

### Step 4 — Fill Out the Late Rounds

**Sweet 16 and beyond:**
- Fade 5+ point Sweet 16 favorites (31.8% ATS) — the market overprices them
- Back 4–6 point Sweet 16 underdogs (56.7% ATS since 1990)
- At the Elite 8, lean underdogs overall (57% ATS all-time)
- 5-seeds in the Elite 8: 8-1 ATS since 1985 (best historical edge)
- Fade 1-seeds in the Elite 8 (43.4% ATS) — overpriced by the market

**Final Four and Championship:**
- Pick the Final Four winner to cover in the championship — 83% ATS (35-7-2 since 2001)
- ACC teams in the Final Four: 10-6 ATS since 2001

---

## Key Concepts (Quick Glossary)

| Metric | What It Means |
|--------|---------------|
| **AdjEM** | Points per 100 possessions vs. average D1 team — the single most predictive stat |
| **AdjO / AdjD** | Offensive / defensive efficiency rank (lower = better) |
| **Tempo** | Possessions per game — slow tempo (<70) compresses games and helps underdogs |
| **SOS** | Strength of schedule — how tough the opponents were |
| **ATS** | Against the spread — did they cover the betting line? |
| **KenPom Rank** | Overall efficiency ranking combining offense and defense |

---

## Cinderella Profile (When to Trust a Low Seed)

All deep-run Cinderellas shared these traits:
1. AdjD inside top 30 nationally (defense-first identity)
2. Slow tempo — below 70 possessions/game
3. One dominant scorer the opponent must game-plan for
4. Won their conference tournament (proven in elimination games)
5. KenPom top 50 (they were mis-seeded, not overmatched)
6. Upperclassman-heavy roster

**Ceiling by type:**
- Defense-first (great AdjD, weak AdjO) — maxes out at Elite 8
- Balanced (both sides top 60) — can reach the Final Four
- Offense-only (great AdjO, weak AdjD) — maxes out in R32

---

## What Does NOT Predict Advancement

Don't use these when filling out your bracket:
- **Regular season win total** — schedule quality matters more than raw wins
- **3-point shooting %** — too volatile, regresses to the mean in small samples
- **Blue Blood brand** — Kansas, Kentucky, Duke, UNC all exited before the Sweet 16 in 2023
- **Margin of victory** — feasting on weak opponents doesn't prepare teams for March
- **Coach name recognition** — elite coaches lose in R64 every year

---

## Repo Files — Where to Go Deeper

| File | Use It When You Need... |
|------|------------------------|
| `README.md` | Quick reference, stats glossary, key findings at a glance |
| `COMPLETE_MARCH_MADNESS_ANALYSIS.md` | Everything in one document — all rounds, all years, all data |
| `R64_R32_ANALYSIS.md` | First-weekend upset picks, Cinderella case studies, R64/R32 betting angles |
| `SWEET16_ANALYSIS.md` | The efficiency cliff, dead zone analysis, which mid-seeds actually advance |
| `ELITE8_FINAL4_ANALYSIS.md` | Late-round profiles, champion breakdowns, what separates good from great |
| `index.html` | GitHub Pages landing page (dark theme, card navigation) |

---

## Writing & Contribution Conventions

When updating or adding analysis to this repo:
- Use em-dashes (—) for emphasis, not colons
- Back every claim with specific efficiency stats and year references
- Follow the document pattern: Quick Reference → Year-by-Year → Analysis → Betting Appendix
- Use tables for all statistical comparisons
- Keep betting/ATS data in clearly labeled appendix sections
- Explain metrics in plain English when first introduced
- Commit messages: use `feat:`, `docs:`, `chore:` prefixes (conventional commits)

**GitHub Pages styling:** dark theme with primary `#0d1117`, blue `#1a3c6e`, orange accent `#e87722`

No build steps, no dependencies, no tests — pure documentation project.
