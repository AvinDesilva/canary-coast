---
name: "Pristine" keyword locations
description: All source locations where the banned word "Pristine" appears — verified cleared as of 2026-04-05 audit
type: project
---

"Pristine" is a BLOCKER term under Canary Coast compliance rules.

## Status: RESOLVED as of 2026-04-05

A previous audit flagged "Pristine" in:
1. `src/lib/constants.ts` AQI_BUCKETS description for the "Good" bucket
2. `src/lib/mock-data.ts` two sensor entries (Heights Station, Clear Lake NASA)

A comprehensive re-scan on 2026-04-05 found zero matches for "pristine" (case-insensitive) anywhere in `src/`. The word has been removed and replaced with EPA-standard descriptions.

Current mock-data AQI sensor descriptions (verified) correctly use:
  "AQI 0–50 (EPA: Good). PM2.5 below 9 µg/m³. Satisfactory air quality for all groups."

**How to apply:** Continue scanning for "pristine" on every audit. It has recurred before.
