---
name: OpenGraph description uses "danger" framing
description: layout.tsx OpenGraph description contains "flood zone danger" — subjective framing not anchored to a specific data metric
type: project
---

`src/app/layout.tsx` line 11:
  `description: "Harris County housing listings scored for cancer risk and flood zone danger."`

The word "danger" in "flood zone danger" is a subjective quality judgment. Prefer objective, data-anchored language, e.g.:
  "Harris County housing listings overlaid with FEMA flood zone classifications and Harris County cancer SIR data."

This is a WARNING. OpenGraph metadata is not user-facing in the app UI, but it appears in link previews and search results and should reflect the same objective-language standard.

**Why:** FHA objective-language requirements apply to all consumer-facing communications, including metadata that appears in search engines and social link previews.
