"""Score all 6 predicted brackets against actual 2026 NCAA tournament results.

ESPN Scoring: R64=10, R32=20, S16=40, E8=80, F4=160, Championship=320
"""

# ── ACTUAL 2026 TOURNAMENT RESULTS ─────────────────────────────────────────

ACTUAL = {
    "East": {
        "r64": ["Duke", "TCU", "St. John's", "Kansas", "Louisville", "Michigan St.", "UCLA", "UConn"],
        "r32": ["Duke", "St. John's", "Michigan St.", "UConn"],
        "s16": ["Duke", "UConn"],
        "e8": ["UConn"],
    },
    "West": {
        "r64": ["Arizona", "Utah St.", "High Point", "Arkansas", "Texas", "Gonzaga", "Miami (FL)", "Purdue"],
        "r32": ["Arizona", "Arkansas", "Texas", "Purdue"],
        "s16": ["Arizona", "Purdue"],
        "e8": ["Arizona"],
    },
    "South": {
        "r64": ["Florida", "Iowa", "Vanderbilt", "Nebraska", "VCU", "Illinois", "Texas A&M", "Houston"],
        "r32": ["Iowa", "Vanderbilt", "Illinois", "Houston"],
        "s16": ["Iowa", "Illinois"],
        "e8": ["Illinois"],
    },
    "Midwest": {
        "r64": ["Michigan", "Saint Louis", "Texas Tech", "Alabama", "Tennessee", "Virginia", "Kentucky", "Iowa St."],
        "r32": ["Michigan", "Alabama", "Tennessee", "Iowa St."],
        "s16": ["Michigan", "Tennessee"],
        "e8": ["Michigan"],
    },
    "final_four": {
        "semi1_winner": "Michigan",   # East (UConn) vs West (Arizona) -> but wait...
        "semi2_winner": "UConn",      # Actually: Michigan vs Arizona = Michigan, UConn vs Illinois = UConn
    },
    "champion": "Michigan",
}

# Actually let me correct the Final Four matchups:
# FF Semi 1: East winner (UConn) vs West winner (Arizona) — wait, the results say Michigan vs Arizona
# The bracket structure: East vs West = semi1, South vs Midwest = semi2
# But the actual FF was: Michigan (Midwest) vs Arizona (West), UConn (East) vs Illinois (South)
# NCAA re-seeds for Final Four, so the actual matchups were:
#   1-Michigan vs 1-Arizona => Michigan won 91-73
#   2-UConn vs 3-Illinois => UConn won
#   Championship: Michigan vs UConn => Michigan won 69-63

# For bracket scoring, what matters is: did the bracket predict the correct team
# to reach the Final Four from each region? Then did it predict the correct
# FF winner and champion?

# ESPN scoring by round
POINTS = {"r64": 10, "r32": 20, "s16": 40, "e8": 80, "ff": 160, "champ": 320}


# ── PREDICTED BRACKETS ─────────────────────────────────────────────────────

# Reconstructed from final-brackets-v5.ts overrides + model defaults
# Model defaults (favorites win) unless overridden

# Default model picks (favorites) per region:
DEFAULT = {
    "East": {
        "r64": ["Duke", "Ohio St.", "St. John's", "Kansas", "Louisville", "Michigan St.", "UCLA", "UConn"],
        "r32": ["Duke", "Kansas", "Michigan St.", "UConn"],
        "s16": ["Duke", "UConn"],
        "e8": ["UConn"],
    },
    "West": {
        "r64": ["Arizona", "Villanova", "Wisconsin", "Arkansas", "BYU", "Gonzaga", "Miami (FL)", "Purdue"],
        "r32": ["Arizona", "Arkansas", "Gonzaga", "Purdue"],
        "s16": ["Arizona", "Purdue"],
        "e8": ["Arizona"],
    },
    "South": {
        "r64": ["Florida", "Clemson", "Vanderbilt", "Nebraska", "North Carolina", "Illinois", "Saint Mary's", "Houston"],
        "r32": ["Florida", "Vanderbilt", "Illinois", "Houston"],
        "s16": ["Florida", "Illinois"],
        "e8": ["Illinois"],
    },
    "Midwest": {
        "r64": ["Michigan", "Georgia", "Texas Tech", "Alabama", "Tennessee", "Virginia", "Kentucky", "Iowa St."],
        "r32": ["Michigan", "Alabama", "Tennessee", "Iowa St."],
        "s16": ["Michigan", "Iowa St."],
        "e8": ["Michigan"],
    },
}

import copy

def apply_overrides(base, overrides):
    """Apply bracket overrides to default model picks."""
    b = copy.deepcopy(base)
    for region, rounds in overrides.items():
        for rnd, picks in rounds.items():
            for idx, team in picks.items():
                idx = int(idx)
                if rnd in b[region] and idx < len(b[region][rnd]):
                    b[region][rnd][idx] = team
    return b


BRACKETS = [
    {
        "label": "#1 SAFE — Arizona Champion",
        "champion": "Arizona",
        "ff_semi1": "Arizona",  # East vs West winner
        "ff_semi2": "Michigan",  # South vs Midwest winner
        "overrides": {
            "West": {"r64": {1: "Utah St."}},
            "South": {"r64": {1: "Iowa"}, "r32": {1: "Vanderbilt"}},
            "Midwest": {"r64": {1: "Saint Louis"}, "r32": {1: "Texas Tech"}},
            "East": {"r32": {1: "St. John's"}},
        },
    },
    {
        "label": "#2 SAFE — Michigan Champion",
        "champion": "Michigan",
        "ff_semi1": "Arizona",
        "ff_semi2": "Michigan",
        "overrides": {
            "West": {"r64": {1: "Utah St."}},
            "South": {"r64": {1: "Iowa"}, "r32": {1: "Vanderbilt"}},
            "Midwest": {"r64": {1: "Saint Louis"}, "r32": {1: "Texas Tech"}},
            "East": {"r64": {4: "South Florida"}, "r32": {1: "St. John's"}},
        },
    },
    {
        "label": "#3 SAFE — Duke Champion",
        "champion": "Duke",
        "ff_semi1": "Duke",
        "ff_semi2": "Michigan",
        "overrides": {
            "West": {"r64": {1: "Utah St."}},
            "South": {"r64": {1: "Iowa", 4: "VCU"}, "r32": {1: "Vanderbilt"}},
            "Midwest": {"r64": {1: "Saint Louis"}, "r32": {1: "Texas Tech"}},
            "East": {"r32": {1: "St. John's"}},
        },
    },
    {
        "label": "#4 BALANCED — Florida Champion",
        "champion": "Florida",
        "ff_semi1": "Arizona",
        "ff_semi2": "Florida",
        "overrides": {
            "West": {"r64": {1: "Utah St."}, "r32": {1: "Wisconsin"}, "s16": {1: "Gonzaga"}},
            "South": {"r64": {1: "Iowa", 6: "Texas A&M"}, "r32": {1: "Vanderbilt"}, "s16": {1: "Illinois"}, "e8": {0: "Florida"}},
            "Midwest": {"r64": {0: "TCU", 1: "Saint Louis"}, "r32": {1: "Texas Tech"}},
            "East": {"r32": {1: "St. John's"}},
        },
    },
    {
        "label": "#5 CONTRARIAN — Houston Champion",
        "champion": "Houston",
        "ff_semi1": "Arizona",
        "ff_semi2": "Houston",
        "overrides": {
            "West": {"r64": {1: "Utah St.", 4: "Texas"}, "r32": {1: "Wisconsin"}, "s16": {1: "Gonzaga"}},
            "South": {"r64": {1: "Iowa"}, "r32": {1: "Vanderbilt"}, "e8": {0: "Houston"}},
            "Midwest": {"r64": {0: "TCU", 1: "Saint Louis", 6: "Santa Clara"}, "r32": {1: "Akron"}},
            "East": {"r64": {4: "South Florida"}, "r32": {1: "St. John's"}, "s16": {1: "Michigan St."}},
        },
    },
    {
        "label": "#6 CONTRARIAN — Illinois Champion",
        "champion": "Illinois",
        "ff_semi1": "Arizona",
        "ff_semi2": "Illinois",
        "overrides": {
            "West": {"r64": {1: "Utah St."}, "r32": {1: "Wisconsin"}, "s16": {1: "Gonzaga"}},
            "South": {"r64": {1: "Iowa", 4: "VCU"}, "r32": {1: "Vanderbilt"}, "s16": {1: "Illinois"}, "e8": {0: "Illinois"}},
            "Midwest": {"r64": {1: "Saint Louis", 6: "Santa Clara"}, "r32": {1: "Texas Tech"}, "e8": {0: "Iowa St."}},
            "East": {"r64": {6: "UCF"}, "r32": {1: "St. John's"}, "s16": {1: "Michigan St."}},
        },
    },
]


def score_bracket(bracket_spec):
    """Score a bracket against actual results. Returns (total_points, details)."""
    picks = apply_overrides(DEFAULT, bracket_spec["overrides"])
    total = 0
    correct = 0
    total_games = 0
    details = []

    for region in ["East", "West", "South", "Midwest"]:
        for rnd in ["r64", "r32", "s16", "e8"]:
            actual_winners = ACTUAL[region][rnd]
            predicted = picks[region].get(rnd, [])
            pts_per = POINTS[rnd]

            for i, actual in enumerate(actual_winners):
                total_games += 1
                if i < len(predicted) and predicted[i] == actual:
                    total += pts_per
                    correct += 1
                    details.append(f"  ✅ {rnd.upper()} {region}: {actual} ({pts_per} pts)")
                else:
                    pred = predicted[i] if i < len(predicted) else "?"
                    details.append(f"  ❌ {rnd.upper()} {region}: picked {pred}, actual {actual}")

    # Final Four
    total_games += 2
    # Semi 1: East vs West
    # Actual: Michigan beat Arizona in FF (Michigan from Midwest, Arizona from West)
    # But bracket structure has semi1 = East vs West winner
    # The actual E8 winners: East=UConn, West=Arizona, South=Illinois, Midwest=Michigan
    # Actual FF: Michigan vs Arizona (semi), UConn vs Illinois (semi)
    # For scoring: did the bracket predict the correct FF participant from each region? (already scored in E8)
    # FF semi winners: Michigan and UConn
    # Our brackets predict semi1 = East vs West winner, semi2 = South vs Midwest winner

    # Actual semi results: the champion path was Michigan (Midwest E8 winner) beat Arizona (West E8 winner)
    # and UConn (East E8 winner) beat Illinois (South E8 winner)
    # So semi1 (East vs West) = East winner = UConn (since UConn beat Illinois which is South... wait)

    # Let me just check: did the bracket's FF semi winners match reality?
    # Actual: from East=UConn, from West=Arizona. Semi1 winner between them...
    # The actual FF matchups were Michigan vs Arizona and UConn vs Illinois
    # That means the NCAA re-seeded. For bracket scoring, what matters:
    # Did you pick the right team to come out of each region (E8)? Already scored.
    # Did you pick the right FF semifinal winners?
    # Actual FF winners: Michigan and UConn advanced to championship

    # For bracket purposes: if your bracket says "East vs West winner = X" and X made the championship, you get points
    ff_semi1 = bracket_spec["ff_semi1"]  # East vs West winner
    ff_semi2 = bracket_spec["ff_semi2"]  # South vs Midwest winner

    # Actual championship participants: Michigan and UConn
    # Michigan came from Midwest, UConn came from East
    # So: East vs West actual winner needs to be one of the championship participants
    # In standard bracket: Semi1 = East (UConn) vs West (Arizona) -> actual winner = ???
    # The actual game was Michigan vs Arizona where Michigan won. But Michigan is Midwest not East.
    # NCAA Final Four re-seeds by overall seed, so matchups don't follow the bracket structure.

    # For ESPN scoring: you just need to pick the right teams to reach the Final Four (E8 already scored)
    # and the right champion. The semifinal matchups are determined by the NCAA, not the bracket.
    # So FF points = did you pick the champion correctly?

    # Simplification: just score if FF picks made the actual Final Four, and if champion is correct
    actual_ff_teams = {"Michigan", "Arizona", "UConn", "Illinois"}

    if ff_semi1 in actual_ff_teams:
        total += POINTS["ff"]
        correct += 1
        details.append(f"  ✅ FF Semi1: {ff_semi1} reached Final Four ({POINTS['ff']} pts)")
    else:
        details.append(f"  ❌ FF Semi1: picked {ff_semi1}, not in actual Final Four")

    if ff_semi2 in actual_ff_teams:
        total += POINTS["ff"]
        correct += 1
        details.append(f"  ✅ FF Semi2: {ff_semi2} reached Final Four ({POINTS['ff']} pts)")
    else:
        details.append(f"  ❌ FF Semi2: picked {ff_semi2}, not in actual Final Four")

    # Championship
    total_games += 1
    champ = bracket_spec["champion"]
    if champ == ACTUAL["champion"]:
        total += POINTS["champ"]
        correct += 1
        details.append(f"  ✅ CHAMPION: {champ} ({POINTS['champ']} pts)")
    else:
        details.append(f"  ❌ CHAMPION: picked {champ}, actual {ACTUAL['champion']}")

    return total, correct, total_games, details


# ── SCORE ALL BRACKETS ─────────────────────────────────────────────────────

print("=" * 70)
print("  2026 NCAA TOURNAMENT — BRACKET SCORING")
print("  Actual Champion: Michigan (defeated UConn 69-63)")
print("=" * 70)
print()

results = []

for b in BRACKETS:
    total, correct, games, details = score_bracket(b)
    pct = round(correct / games * 100, 1)
    results.append((b["label"], total, correct, games, pct, details))

# Sort by score descending
results.sort(key=lambda x: x[1], reverse=True)

for i, (label, total, correct, games, pct, details) in enumerate(results):
    rank = i + 1
    print(f"{'🥇' if rank == 1 else '🥈' if rank == 2 else '🥉' if rank == 3 else f'#{rank}'} {label}")
    print(f"   Score: {total} pts | {correct}/{games} correct ({pct}%)")
    champ_hit = "✅" if "CHAMPION" in [d for d in details if "✅ CHAMPION" in d] else "❌"
    print(f"   Champion pick: {'✅ CORRECT' if any('✅ CHAMPION' in d for d in details) else '❌ WRONG'}")
    print()

print()
print("=" * 70)
print("  DETAILED RESULTS — BEST BRACKET")
print("=" * 70)
best_label, best_pts, best_correct, best_games, best_pct, best_details = results[0]
print(f"\n{best_label} — {best_pts} pts\n")
for d in best_details:
    print(d)

print()
print("=" * 70)
print("  SUMMARY")
print("=" * 70)
print()
for label, total, correct, games, pct, _ in results:
    champ_correct = any("✅ CHAMPION" in d for d in _)
    print(f"  {total:4d} pts | {correct:2d}/{games} ({pct:5.1f}%) | {'✅' if champ_correct else '❌'} Champ | {label}")
