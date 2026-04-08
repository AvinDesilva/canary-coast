# Compliance Officer Memory Index

## Terminology Decisions
- [terminology_aqi_buckets.md](terminology_aqi_buckets.md) — AQI bucket naming convention: non-EPA labels in use, "Pristine" is a recurring blocker

## Recurring Violation Sites
- [violation_sites_safety_bands.md](violation_sites_safety_bands.md) — Safety band label/score inversion bug and FHA display issues (note: CLAUDE.md spec is outdated; see fha_safety_label_system.md for current state)
- [violation_sites_pristine.md](violation_sites_pristine.md) — "Pristine" resolved as of 2026-04-05; no matches in codebase

## Environmental Data Pipeline
- [pipeline_purpleair.md](pipeline_purpleair.md) — PurpleAir EPA correction factor implementation status (COMPLIANT)
- [pipeline_raw_pm25_exposure.md](pipeline_raw_pm25_exposure.md) — pm25_raw label differs between AirQualityCard ("raw:") and AirQualityOverlay ("uncorrected sensor:"); card needs update

## Geolocation / TDPSA
- [tdpsa_geolocation.md](tdpsa_geolocation.md) — No geolocation APIs used; TDPSA consent concern is N/A for this codebase
- [tdpsa_privacy_notice.md](tdpsa_privacy_notice.md) — No privacy policy, terms of service, or data collection notice in UI; WARNING

## FHA
- [fha_score_filter.md](fha_score_filter.md) — Safety score minimum filter and composite score labeling review
- [fha_safety_label_system.md](fha_safety_label_system.md) — Full 2026-04-05 audit: band labels, choropleth risk, sort-by, filter, card disclosure
- [fha_facility_labeling.md](fha_facility_labeling.md) — "Cancer-linked pollutants" label missing regulatory source attribution

## Metadata
- [metadata_og_description.md](metadata_og_description.md) — OpenGraph description uses "danger" framing (WARNING, still present)
