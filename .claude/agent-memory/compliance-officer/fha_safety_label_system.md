---
name: FHA — comprehensive safety label system audit (2026-04-05)
description: Full analysis of the five-band safety label system, composite score framing, map choropleth risk, sort-by, and filter for FHA steering risk
type: project
---

## Safety Band Labels (constants.ts lines 25-31)

Current bands: Excellent (80–100), Good (60–79), Fair (40–59), Caution (20–39), High Risk (0–19)

Score direction: higher = safer (flood 100 = no flood risk; cancer 100 = low SIR). Labels are internally consistent.

Note: CLAUDE.md spec says Safe/Moderate/High Risk (0–30/31–69/70–100) — this is NOT what is deployed.
The five-band system in constants.ts is what is actually used. The spec is outdated.

## FHA Analysis of Each Label

- "Excellent" — WARNING. Superlative quality judgment not anchored to a cited data metric.
  Implies this is a superior neighborhood, not just a lower-risk measurement.
- "Good" — WARNING. Subjective quality judgment. Better phrasing: "Low Risk" or "Risk Score: 60–79."
- "Fair" — BORDERLINE. Less loaded than "Excellent"/"Good" but still qualitative.
- "Caution" — PASS. Describes a user action ("exercise caution") rather than neighborhood quality.
- "High Risk" — PASS when qualified. The label refers to the composite score, and the data sources
  are cited in ListingDetail attribution (line 130) and ScoreLegend (line 25).

## Steering Risk — Map Choropleth

CancerOverlay.tsx paints entire census tracts green-to-red by cancer SIR. Cancer SIR in Harris County
correlates with demographic composition of census tracts (environmental justice data shows higher cancer
burden in communities of color near petrochemical facilities). This creates a proxy-steering risk at scale:
red tracts may systematically correspond to majority-minority neighborhoods.

Mitigations currently in place: overlay is a separate toggle, not the default view; opacity is 0.2;
data source (HCPH/TX Cancer Registry) is cited in the legend.

Missing: no disclosure that cancer SIR data has a demographic correlation risk. The legend does not
explain what SIR values mean or how to interpret them.

## Steering Risk — "Min Safety Score" Filter (ListingFilters.tsx line 60)

Filter label: "Min Safety Score: {value}" with a 0–100 slider.
Default: 0 (no filtering). User must actively engage to change.
No inline explanation of what the score measures.

Risk: a user who slides this filter to 60+ systematically excludes properties in higher-cancer,
higher-flood areas. In Harris County these areas overlap significantly with environmental justice
communities. The filter itself is data-based and user-initiated, which mitigates FHA risk, but
the label gives no context.

Required: tooltip or subtext: "Score based on FEMA flood zone (60%) and Harris County cancer SIR (40%).
Not a neighborhood quality rating."

## Sort-by safety_desc

Defined in src/types/listing.ts line 44: sortBy?: "price_asc" | "price_desc" | "safety_desc" | "newest"
NOT exposed in the current UI (ListingFilters.tsx has no sort controls). Risk is latent, not active.
If "Sort by Safety (High to Low)" is ever added to the UI, it needs the same disambiguation tooltip.

## ListingCard SafetyBadge — Weak Disclosure

ListingCard.tsx line 45: renders SafetyBadge (numeric score only, no label, no tooltip, no data source).
This is the only safety signal visible before a user clicks into a listing.
A score like "87" or "14" has no context at the card level.

Required: title attribute or adjacent micro-label. E.g., title="Composite Safety Score: FEMA flood (60%) + Cancer SIR (40%)"

## How to apply

- Never add a new score display surface without inline attribution or tooltip
- If sort-by safety is exposed in UI, add disambiguation copy
- "Excellent" and "Good" as band labels are the highest-priority FHA terminology concerns in this codebase
