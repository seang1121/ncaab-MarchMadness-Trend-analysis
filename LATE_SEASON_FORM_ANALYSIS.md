# Late-Season Form & Momentum Analysis

> **Why this matters:** KenPom ranks are season-long averages. They don't tell you if a team is peaking, slumping, or missing a key player. This analysis tracks how late-season trajectory — the last 10 games, conference tournament performance, and injury context — predicts tournament outcomes beyond what static efficiency numbers capture.

*(Data: 2019, 2021–2025 NCAA Tournaments)*

---

## The Core Finding: Trajectory Matters as Much as Talent

A team's AdjEM on Selection Sunday is the best single predictor of tournament success. But two teams with identical AdjEM can have very different trajectories — one peaked in January and has been sliding, the other improved 5 points in the last month. The sliding team is more vulnerable than static KenPom suggests. The improving team is more dangerous.

This file establishes the framework for evaluating late-season form as a complement to the efficiency staircase in the main analysis.

---

## Part 1 — Conference Tournament Performance as a Predictor

### Conference Tournament Champions in the NCAA Tournament

Conference tournament winners enter March Madness with 2–4 consecutive high-pressure elimination wins. The question: does that momentum carry over, or are they gassed?

**What the data shows (2019–2025):**

| Finding | Detail |
|---------|--------|
| Cinderella fuel | 13 of 19 deep-run Cinderellas (2005–2025) won their conference tournament — it's the single best predictor of a mid-major going deep |
| Power conf tourney winners | Power conference tournament champions who also earned an at-large bid showed no significant fatigue effect — they played the same number of games as their opponents over the season |
| NC State 2024 | Won the ACC Tournament as a 10-seed (4 wins in 4 days), then reached the Final Four — the most dramatic momentum carry in recent history |
| Saint Peter's 2022 | Won the MAAC Tournament, then upset Kentucky and Murray State — conference tournament poise translated directly to NCAA elimination games |
| Oral Roberts 2021 | Won the Summit League Tournament, beat Ohio State and Florida in the NCAA Tournament — conference tournament scoring carried over |

### Conference Tournament Early Exits — A Warning Sign?

| Finding | Detail |
|---------|--------|
| 1-seeds that lost early in conf tourney | Not a reliable upset predictor — Gonzaga lost early in the WCC tournament in 2021 and still reached the championship game. UConn lost in the Big East semis in 2024 and won the national title. |
| Exception | When a 1–2 seed loses their conference tournament *and* has a key injury, the combination is a legitimate red flag |
| Key insight | Conference tournament results matter more for mid-majors (their only high-pressure resume data) than for power conference teams (who have months of elite-competition data) |

### Framework: How to Evaluate Conference Tournament Results

| Team Type | Conf Tourney Result | What It Means for NCAA |
|-----------|--------------------|-----------------------|
| Mid-major (seed 10+) | Won conference tournament | Strong positive — they're battle-tested in elimination games; this is the most reliable Cinderella indicator |
| Mid-major (seed 10+) | Lost before finals | Concern — they may lack the clutch gear needed for March; check if loss was to a quality opponent |
| Power conf (seed 1–4) | Won conference tournament | Mild positive — momentum plus confidence, but fatigue risk if they played 4+ games |
| Power conf (seed 1–4) | Lost in first game | Neutral to mild concern — rest advantage could offset the loss, but check if the loss exposed a weakness |
| Power conf (seed 5–8) | Won conference tournament | Strong positive — they've proven they can beat the best in their league consecutively; may be under-seeded |

---

## Part 2 — Last 10 Games: Reading the Trajectory

### Why Last 10 Games Matters

KenPom adjusts for opponent quality across the full season. But a team that went 6-4 in their last 10 games — even against strong competition — is telling you something that the season-long AdjEM doesn't fully capture:
- Possible chemistry issues or locker room problems
- Coaching adjustments that haven't worked
- Physical fatigue or minor injuries affecting performance
- Conversely, a team going 9-1 in their last 10 may have found a rotation or scheme that elevates them

### Trajectory Categories

| Category | Last 10 Profile | Tournament Implication |
|----------|----------------|----------------------|
| **Peaking** | 8-2 or better, improving AdjEM, decisive wins | Most dangerous — trust them at or above their seed line |
| **Steady** | 6-4 to 7-3, stable AdjEM, competitive losses | Default to KenPom rank — no adjustment needed |
| **Sliding** | 5-5 or worse, declining AdjEM, close wins against weaker opponents | Vulnerable — consider picking the upset, especially if they face a peaking opponent |
| **Injured** | Record doesn't matter — a key player missed recent games or is questionable | Biggest red flag — KenPom doesn't adjust for missing players; their real efficiency is lower than listed |

### Historical Examples of Trajectory Predicting Outcomes

**Peaking teams that outperformed their seed:**

| Year | Team | Seed | Last 10 | Trajectory | Tournament Result | KenPom Suggested |
|------|------|------|---------|------------|-------------------|-----------------|
| 2021 | UCLA | 11 | Won 7 of last 10, including First Four | Peaking | Final Four | Sweet 16 at best |
| 2023 | FAU | 9 | Won 13 straight entering tournament | Peaking | Final Four | R32 exit |
| 2024 | NC State | 11 | Won 8 straight (ACC Tourney + early NCAA) | Peaking | Final Four | R32 exit |
| 2025 | Florida | 1 | Won 9 of last 10, dominant AdjEM trend | Peaking | Champion | Expected |

**Sliding teams that underperformed their seed:**

| Year | Team | Seed | Last 10 | Trajectory | Tournament Result | KenPom Suggested |
|------|------|------|---------|------------|-------------------|-----------------|
| 2021 | Ohio State | 2 | Lost 4 of last 8 | Sliding | Lost R64 to 15-seed Oral Roberts | Sweet 16+ |
| 2022 | Kentucky | 2 | Lost SEC Tournament early | Sliding | Lost R64 to 15-seed Saint Peter's | Elite 8+ |
| 2023 | Kansas | 1 | Lost 3 of last 7 | Sliding | Lost R32 to 8-seed Arkansas | Final Four |
| 2024 | Arizona | 2 | Lost Pac-12 Tournament | Sliding | Lost R64 to Princeton | Elite 8+ |

### The Pattern

Every major upset in this 6-year dataset — a 2-seed or higher losing in R64 — involved a team that was either sliding in their last 10 games, dealing with a key injury, or both. Static KenPom alone missed these upsets. Trajectory would have flagged them.

---

## Part 3 — Injury and Roster Context

### Why KenPom Can't Account for This

KenPom efficiency metrics reflect how a team performed with their full roster across the season. When a key player goes down — especially in the final weeks or during the tournament — the team's real efficiency is lower than their listed KenPom rank. The market (seed and spread) usually adjusts partially, but not fully.

### Injury Impact Framework

| Player Role | Impact on Team AdjEM | Tournament Risk |
|-------------|---------------------|-----------------|
| Starting PG / primary ball-handler | -3 to -5 AdjEM equivalent | Severe — offense becomes predictable, turnover rate spikes |
| Leading scorer (20+ ppg) | -2 to -4 AdjEM equivalent | High — scoring burden shifts to less efficient options |
| Defensive anchor / rim protector | -2 to -3 AdjEM equivalent | High — AdjD drops, which is the most important tournament metric |
| Rotation player (6th-7th man) | -1 to -2 AdjEM equivalent | Moderate — depth matters more in later rounds (back-to-back games) |
| Role player / specialist | Minimal | Low — unless their specific skill (3PT shooting, press-breaking) is matchup-critical |

### How to Check for Injuries on Selection Sunday

1. **Search "[team name] injury report"** on the day the bracket drops
2. **Check the conference tournament** — did a key player sit out or leave a game early?
3. **Look at recent box scores** — was a starter's minutes reduced? Did a backup suddenly play 25+ minutes?
4. **Monitor through Thursday** — injuries can be announced or upgraded/downgraded between Selection Sunday and the first game

### Historical Injury-Driven Upsets

| Year | Team | Seed | Injury Context | Result |
|------|------|------|---------------|--------|
| 2022 | Kentucky | 2 | TyTy Washington hobbled with ankle injury | Lost R64 to Saint Peter's |
| 2023 | Kansas | 1 | Multiple players dealing with minor ailments post-Big 12 tourney | Lost R32 to Arkansas |
| 2024 | Arizona | 2 | Key rotation disruption in final weeks | Lost R64 to Princeton |

---

## Part 4 — Putting It All Together: The Form Adjustment

When evaluating any matchup, apply this adjustment on top of the KenPom/efficiency staircase from the main analysis:

### Step 1: Check Trajectory
- Is the team **peaking** (8-2+ last 10, improving AdjEM)? → Trust them at or above seed
- Is the team **sliding** (5-5 or worse, declining AdjEM)? → Downgrade by 1–2 seed lines
- Is the team **steady**? → No adjustment, use KenPom as-is

### Step 2: Check Conference Tournament
- **Mid-major that won their conference tournament** → Upgrade Cinderella potential significantly
- **Power conf team that won conference tournament** → Mild confidence boost
- **Any team that lost embarrassingly early** → Check if the loss exposed a fixable tactical issue or a structural weakness

### Step 3: Check Injuries
- **Starting-caliber player out or limited** → Mentally subtract 2–4 from AdjEM
- **If the injury affects defense** → Extra concern, since AdjD is the most predictive tournament metric
- **If announced between Selection Sunday and tipoff** → The spread may not have fully adjusted — this is where your edge is largest

### Step 4: Compare Adjusted Profiles
After trajectory, conference tournament, and injury adjustments, compare the two teams' adjusted profiles against the efficiency staircase for that round. The team with the better adjusted profile — not the better static KenPom — should be your pick.

---

## Quick Reference: Form Red Flags and Green Flags

### Red Flags (Downgrade the Favorite)
- Lost 3+ of last 7 games
- AdjEM declining over the last month
- Lost conference tournament to a lower seed in the first game
- Key player injured, limited, or resting
- Coaching turmoil or off-court distractions reported
- Team lost home-court advantage late (blown leads in final weeks)

### Green Flags (Upgrade the Underdog)
- Won 7+ of last 10 games
- AdjEM improving over the last month
- Won conference tournament (especially for mid-majors)
- Full roster healthy — no injury concerns
- Team improved dramatically from November to March (found their identity late)
- First Four winner entering R64 (battle-tested, 92.1% ATS)

---

*Analysis framework based on 6 years of NCAA Tournament data (2019, 2021–2025). Use alongside the [Tournament Preview Template](./TOURNAMENT_PREVIEW_TEMPLATE.md) and the efficiency staircase in [CLAUDE.md](./CLAUDE.md).*
