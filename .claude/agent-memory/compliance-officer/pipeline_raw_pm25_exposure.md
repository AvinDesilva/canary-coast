---
name: pm25_raw user exposure in tooltips and AirQualityCard
description: Uncalibrated raw PurpleAir PM2.5 values are shown to users in fine-print contexts; labeling differs between the two surfaces
type: project
---

As of 2026-04-05 comprehensive audit:

`src/components/Map/AirQualityOverlay.tsx` line 87:
  `PM2.5: ${props.pm25_corrected} µg/m³ (uncorrected sensor: ${props.pm25_raw} µg/m³) · RH: ${props.humidity}%`
  — Label reads "uncorrected sensor" — COMPLIANT. Clear and unambiguous.

`src/components/Safety/AirQualityCard.tsx` line 50:
  `PM2.5: ${data.pm25_corrected} µg/m³ (raw: ${data.pm25_raw}) · Humidity: ${data.humidity}%`
  — Label reads "raw:" — WARNING. Ambiguous. Should be changed to "uncorrected sensor: X µg/m³" to match
    the overlay and be unambiguous that this value is not EPA-calibrated.

In both cases the corrected value is displayed first/prominently. Raw value is fine-print metadata.

**How to apply:** If adding any new surface that displays pm25_raw, use the label "uncorrected sensor:" not "raw:".
Standardize AirQualityCard.tsx to match overlay wording.
