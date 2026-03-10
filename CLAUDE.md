# CLAUDE.md

## Project Overview

NCAA Basketball March Madness Trend Analysis (2019–2025). A documentation-only research project analyzing why teams win and advance in the NCAA tournament, based on KenPom efficiency metrics across 6 tournament years (2019, 2021–2025; 2020 cancelled due to COVID).

This repository contains **no source code** — it is entirely Markdown analysis documents and a GitHub Pages HTML landing page.

## Repository Structure

```
├── README.md                          # Landing page, stats glossary, key findings summary
├── COMPLETE_MARCH_MADNESS_ANALYSIS.md # Full combined analysis across all rounds
├── R64_R32_ANALYSIS.md                # Round of 64 & Round of 32 deep dive
├── SWEET16_ANALYSIS.md                # Sweet 16 analysis
├── ELITE8_FINAL4_ANALYSIS.md          # Elite 8, Final Four & champion profiles
├── index.html                         # GitHub Pages landing page (dark theme)
└── .gitignore                         # Ignores Python, data files, IDE configs
```

## Key Conventions

### Writing Style
- Use em-dashes (—) for emphasis and description separation, not colons
- All claims must be backed by specific efficiency statistics and year references
- Explain KenPom metrics in plain English when first introduced
- Prioritize clarity over brevity — every metric gets a plain-English explanation

### Document Structure (each analysis file follows this pattern)
1. Header with year range
2. Quick Reference — top findings in table format
3. Betting Reference — ATS data tables
4. Year-by-Year Results — detailed breakdown per tournament year
5. Analytical Sections — efficiency cliffs, dead zones, trends
6. Betting Appendix — ATS records, historical trends

### Markdown Formatting
- `#` for document titles, `##` for major sections, `###` for year-specific headers
- Tables for all statistical comparisons and tournament results
- Blockquotes (`>`) for contextual descriptions
- Bold for metric names and key findings
- Consistent year headers: e.g., `### 2024 — [Theme]`

### Data & Metrics
- **Primary metrics:** KenPom Rank, AdjEM, AdjO, AdjD, Tempo, SOS, ATS records
- **Tournament scope:** 2019, 2021–2025 (6 years; 2020 omitted)
- Separate betting/ATS data into clearly labeled appendix sections
- Use seed and efficiency terminology consistently across files

### Key Concepts
- **AdjEM (Adjusted Efficiency Margin):** Points per 100 possessions vs. average D1 team — the most predictive metric
- **Efficiency Staircase:** Distinct AdjEM floors per tournament stage (+14 R32, +22 Sweet 16, etc.)
- **Dead Zone:** Seeds 6–9 produce only ~7.5% of Sweet 16 spots
- **Extreme Teams:** Top-10 in one efficiency metric but outside top-50 in the other — 0 championships in 22 years
- **Champion Gate:** All 6 champions met: KenPom top 6, AdjEM +25+, AdjO top 25, AdjD top 25

## Commit Conventions

- Use conventional commit prefixes: `feat:`, `docs:`, `chore:`
- Em-dashes (—) in commit descriptions for readability
- Focus commit messages on analytical improvements, data additions, or structural changes

## GitHub Pages

- Landing page: `index.html` with custom dark theme
- CSS variables: primary `#0d1117`, blue accent `#1a3c6e`, orange accent `#e87722`
- Card-based navigation linking to analysis Markdown files

## No Build or Test Steps

This is a pure documentation project. There are no dependencies, build steps, linters, or test suites to run.
