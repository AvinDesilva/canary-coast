---
name: FHA — facility "carcinogenic" category labeling
description: FacilityOverlay uses "carcinogenic" as a data category and displays "Cancer-linked pollutants" in popups; audit status and required sourcing
type: project
---

## Current Implementation (as of 2026-04-05)

`src/components/Map/FacilityOverlay.tsx` lines 61–63:
- category === "carcinogenic" renders: "Cancer-linked pollutants" (red, #ef4444)
- All other categories render: "Non-cancer pollutants" (orange, #f97316)

The map layer paint (line 33) also color-codes circles by this category.

## Audit Status

### WARNING: Missing data source attribution for "carcinogenic" classification

The label "Cancer-linked pollutants" makes a specific health claim (that a facility's emissions cause cancer).
This claim must be traceable to a specific regulatory source — e.g., EPA National Air Toxics Assessment (NATA),
TCEQ Air Emission Inventory, or EPA Toxics Release Inventory (TRI) cancer classification.

The popup currently shows: facility name, category label, and emissions in TON/yr for carcinogenic facilities.
It does NOT cite which regulatory list classifies these pollutants as carcinogenic.

### Not an FHA violation in itself
"Carcinogenic" here refers to facility emissions, not to neighborhoods or people. It does not encode
protected-class demographics. However, it must be scientifically defensible or the app faces general
liability for misleading health claims.

**Remediation required:**
- Add a source line to the facility popup: e.g., "Per EPA Toxics Release Inventory (TRI) / NATA classification"
- OR replace "Cancer-linked pollutants" with "EPA-classified hazardous air pollutants (HAPs)"
  and cite the specific data source

**How to apply:** Any new facility popup or label using the word "carcinogenic" must include the
regulatory data source in the same popup or in the map legend attribution.
