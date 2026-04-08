---
name: Safety band label inversion and FHA display issues
description: SAFETY_BANDS constant has inverted score ranges vs CLAUDE.md spec; composite score label lacks data-source disclosure at point of display
type: project
---

## Score Range Inversion (BLOCKER)

`src/lib/constants.ts` SAFETY_BANDS (lines 25-31) defines:
- "Excellent" = 80–100
- "Good" = 60–79
- "Fair" = 40–59
- "Caution" = 20–39
- "High Risk" = 0–19

CLAUDE.md specifies the composite score is `(Cancer Risk × 0.4) + (Flood Risk × 0.6)` where higher scores represent LOWER risk (flood_score 100 = no flood risk, cancer_score 100 = low SIR). So higher composite = safer. The SAFETY_BANDS label mapping is internally consistent with this.

HOWEVER, CLAUDE.md §Safety Score Algorithm defines the display tiers as:
  Safe (0–30), Moderate (31–69), High Risk (70–100)

The actual SAFETY_BANDS in constants.ts use a completely different five-level scale with different ranges (0–19 = "High Risk", 80–100 = "Excellent"). The CLAUDE.md spec does not match what is deployed. One of the two is wrong.

This is a factual discrepancy that must be reconciled with the developer before remediation can be prescribed. The audit flags it as a WARNING because it creates unpredictable labeling behavior, but it does not itself constitute an FHA violation.

## Score Label Disclosure (WARNING)

`src/components/Safety/SafetyBreakdown.tsx` shows "Cancer Risk" and "Flood Risk" score bars with numeric values, but does NOT explain at point-of-display what those scores mean or cite the data sources. The data attribution is present only in the fine print of `ListingDetail.tsx` (line 130) and in `ScoreLegend.tsx` (line 25).

The `ListingCard.tsx` SafetyBadge shows only a numeric score with no label at all — no band name, no data source disclosure. A user seeing only the card view has no context for what the badge number represents.

**Why:** FHA requires that neighborhood/property quality signals be anchored to specific data sources, not presented as uncontextualized ratings.

**How to apply:** Any new score display component must include an inline tooltip or subline citing "Cancer: HCPH/TX Cancer Registry | Flood: FEMA NFHL" or equivalent. Do not add new badge-only displays without attribution.
