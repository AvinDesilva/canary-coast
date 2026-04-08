---
name: FHA — safety score minimum filter and composite score labeling
description: Min Safety Score slider in ListingFilters.tsx can systematically exclude listings in lower-scoring areas; composite score labels lack inline data attribution at card level
type: project
---

## Min Safety Score Filter (WARNING — FHA steering risk)

`src/components/Listings/ListingFilters.tsx` lines 58-72 expose a "Min Safety Score" range slider (0–100). The default is 0, which is safe. But if users can filter OUT all listings below a composite score threshold, and if composite scores correlate with neighborhood demographics (census tract SIR values + flood zone designations can correlate with race and national origin in Harris County), this filter could produce a disparate-impact steering effect at scale.

The filter is user-initiated and applies to all properties uniformly based on data metrics, not subjective labels. This mitigates the FHA risk significantly. However, the filter label "Min Safety Score" gives no indication of what the score measures. A user could believe they are filtering for "safe neighborhoods" in a subjective sense.

**How to apply:** The filter label should be accompanied by a tooltip or subtext explaining: "Score based on FEMA flood zone (60%) and Harris County cancer SIR (40%). Not a neighborhood quality rating." This disambiguation is important before the product scales.

## Composite Score Label — ListingCard (WARNING)

`src/components/Listings/ListingCard.tsx` line 45 renders a `SafetyBadge` showing only a numeric score. No band label, no data source tooltip. The badge is the only safety signal a user sees in the listings panel before clicking through. This is a weak-disclosure pattern.

**How to apply:** SafetyBadge in card context should include a `title` attribute or adjacent micro-label citing data sources, or the SafetyBadge component itself should accept an optional `showLabel` prop.
