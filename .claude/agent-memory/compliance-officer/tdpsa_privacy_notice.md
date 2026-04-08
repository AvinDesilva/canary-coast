---
name: TDPSA — privacy notice gap
description: No privacy policy, terms of service, or data collection notice visible in the UI; address searches sent as query params; no consent mechanism
type: project
---

## Status as of 2026-04-05

### No geolocation APIs — PASS
Confirmed: no navigator.geolocation, getCurrentPosition, watchPosition, GeolocateControl, or
trackUserLocation anywhere in src/. TDPSA sensitive data (precise geolocation) is not processed.
Address search only — user types an address, it is sent to the backend as a query parameter.

### Data collection practices
- Supabase cookies: session management only (server.ts). No user identity stored.
- Search queries: cached by bounding box in Supabase search_cache table. Not user-attributed.
- Address searches: sent to /api/property as query parameters (lat/lng or address string).
  These are not precise geolocation (user types an address; server geocodes it). Below TDPSA
  sensitive threshold.
- No analytics, tracking pixels, or third-party data collection confirmed.

### TDPSA Privacy Notice — WARNING

TDPSA §541.101 requires that a controller provide a "reasonably accessible, clear, and meaningful
privacy notice" before or at the time of data collection. The app:
- Has no privacy policy page
- Has no terms of service page
- Has no data collection disclosure in the UI
- Has no cookie banner

Even if data collection is minimal, TDPSA requires a notice. Absence of any notice is a compliance gap.
This becomes a harder violation if the app ever adds analytics or geolocation features.

### Address search query parameter exposure
Address searches go to /api/property as URL query parameters. These appear in server logs.
If server logs are retained, this constitutes data processing under TDPSA (even if not stored
in a user-attributed table). Log retention policy is not documented.

**Remediation required:**
1. Add a minimal privacy notice (footer link or modal) disclosing what data is collected and why.
2. Document server log retention policy and ensure it complies with TDPSA data minimization.

**How to apply:** Flag any new feature that adds geolocation, analytics, or user authentication
as requiring explicit TDPSA consent review before implementation.
