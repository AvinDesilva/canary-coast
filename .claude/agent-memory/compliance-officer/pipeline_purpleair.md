---
name: PurpleAir EPA correction factor implementation
description: EPA correction is applied correctly in purpleair.ts before any value reaches a user-facing surface; pm25_raw is also exposed in tooltips
type: project
---

As of 2026-04-05 audit:

`src/lib/purpleair.ts` — `applyEPACorrection(pm25cf1, humidity)` is exported and called:
- Line 148: inside `getSensorsForBbox()` before building GeoJSON features
- Line 187: inside `getAirQuality()` before building the `AirQualityReading` response

The corrected value (`pm25_corrected`) is used for all AQI calculations. Raw sensor value (`pm25_cf1`) is stored as `pm25_raw` for transparency.

The EPA correction formula used (lines 85-89) is the US-EPA correction:
- pm25 <= 343: 0.524 × pm25 − 0.0862 × humidity + 5.75
- pm25 > 343: 0.46 × pm25 + 3.93e-4 × pm25² + 2.97

This matches the standard US-EPA/LRAPA correction algorithm. COMPLIANT.

Note: `pm25_raw` is surfaced to users in tooltips:
- `AirQualityCard.tsx` line 50: shown in an info tooltip
- `AirQualityOverlay.tsx` line 67: shown in map popup fine print

This is a WARNING — raw sensor values should not be the primary display but as fine-print metadata with a clear label they are acceptable. The label reads "raw:" which could be improved to "uncorrected sensor value:" to be unambiguous.

**How to apply:** Never call `computeAQI()` with `pm25_cf1` directly. Always call `applyEPACorrection()` first. If pm25_raw is displayed, it must be clearly labeled as uncalibrated/uncorrected.
