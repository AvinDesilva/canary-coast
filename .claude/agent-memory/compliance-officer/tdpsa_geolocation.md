---
name: TDPSA geolocation consent — status COMPLIANT
description: No geolocation APIs (navigator.geolocation, GeolocateControl, watchPosition, etc.) are used anywhere in the codebase as of 2026-04-05
type: project
---

Full grep across all .ts/.tsx files for: navigator.geolocation, getCurrentPosition, watchPosition, map.locate, GeolocateControl, trackUserLocation — returned zero matches.

The app does not collect user location. Users search by address (typed text input) or pan the map manually. Air quality and safety data are fetched based on listing coordinates, not user location.

TDPSA geolocation consent requirement is not triggered by the current architecture.

**How to apply:** If a "locate me" feature is ever added, a TDPSA consent gate must be implemented BEFORE any geolocation call. The pattern must be:
1. Display an opt-in dialog explaining what location data is used for
2. Store affirmative consent in state (e.g., `userConsentFlags.geolocation_opt_in`)
3. Only call `navigator.geolocation.getCurrentPosition()` inside a block guarded by that flag

A `GeolocateControl` with `trackUserLocation: true` auto-triggered on map load is a BLOCKER.
