# Contested: Matching Logic Draft (v0.1)

## Objective
Generate a match score between athletes and businesses based on shared criteria, goals, and restrictions.

## Parameters & Weights
- **Goal Match** → +20 pts per overlapping goal
- **Industry Compatibility** → +25 pts (0 if restricted)
- **Geographic Proximity (ZIP match or same state)** → +10 pts
- **Experience Alignment**
  - Both have NIL experience → +15 pts
  - One-sided → +5 pts
- **Budget Compatibility**
  - Within declared budget → +20 pts
  - Slightly above → +10 pts
- **Preferred Industry Match (athlete)** → +10 pts

## Minimum Threshold
- Recommend partnerships when score ≥ 60
- Flag for manual review when score between 40–59
- Reject auto-matching under 40

## Implementation
Initial logic to be written as SQL with `JOIN` and `CASE` statements; migrate to AI/ML scoring in future versions.