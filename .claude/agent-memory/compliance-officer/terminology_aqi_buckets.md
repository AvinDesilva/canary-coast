---
name: AQI bucket naming convention
description: The codebase uses a custom 6-bucket AQI scale that does not align with EPA's official 6-category nomenclature; "Pristine" is a confirmed blocker
type: project
---

The codebase defines a custom AQI bucket type `AqiBucket = "Excellent" | "Good" | "Fair" | "Moderate" | "Caution" | "Warning"` in `src/types/air-quality.ts`. This does not match the EPA's official AQI categories: Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous.

The label "Excellent" is not an EPA AQI category and was flagged as a WARNING in the 2026-04-05 audit.

The label "Pristine" is used as a description string inside `AQI_BUCKETS` constant (constants.ts line 54) and in multiple mock data entries (mock-data.ts lines 80, 88). It is a confirmed BLOCKER per Canary Coast compliance rules.

**Why:** EPA AQI terminology is the federal standard for communicating air quality risk. Using non-standard labels creates regulatory exposure and may mislead users into underestimating risk.

**How to apply:** Any new AQI label added to the codebase must be drawn from the EPA's official six-category set. The "Pristine" description string must be replaced with an objective, data-sourced alternative such as "AQI [0–17]: EPA Good range. PM2.5 below 9 µg/m³."
