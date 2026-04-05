# Canary Coast

> A map-based web app overlaying Harris County housing listings with environmental safety scores — helping renters and buyers understand flood risk and cancer prevalence before they commit to a property.

---

## What It Does

Most rental platforms show price, square footage, and photos. They don't tell you that the property sits in a FEMA 100-year flood zone, or that the census tract has elevated cancer rates compared to the county baseline.

Canary Coast fills that gap. Search any Harris County address or browse live listings on an interactive map — each property is scored on two environmental risk dimensions and displayed with a composite safety rating.

**Safety Score Algorithm**

```
Composite = (Cancer Risk × 0.4) + (Flood Risk × 0.6)
```

| Input | Source | Weight |
|---|---|---|
| Cancer Standardized Incidence Ratio (SIR) | Harris County Public Health | 40% |
| FEMA Flood Zone Classification | ArcGIS / FEMA NFHL | 60% |

Scores run 0–100. Display tiers: **Safe** (0–30) · **Moderate** (31–69) · **High Risk** (70–100)

Cancer risk is derived from the SIR for the census tract the property falls in: `min(SIR / 2.0, 1.0) × 100`. Flood risk maps directly to zone classification: 0 for no zone, 50 for 500-year, 100 for 100-year.

---

## Architecture

```
Browser
  │
  ├── Mapbox GL JS          ← client-side rendering only, no GIS logic
  │
  └── Next.js App Router (Vercel)
        │
        ├── /api/listings       ← proxies Rentcast, caches results in Supabase
        ├── /api/property       ← address lookup via Rentcast /v1/properties
        ├── /api/safety         ← returns composite score for a coordinate
        ├── /api/overlays/flood ← GeoJSON flood zones for map layer
        ├── /api/overlays/cancer← GeoJSON cancer choropleth for map layer
        └── /api/overlays/facilities
              │
              └── Supabase (PostgreSQL + PostGIS)
                    ├── listings          ← cached rental listings (7-day TTL)
                    ├── search_cache      ← bbox-level cache (50 req/mo free tier)
                    ├── cancer_prevalence ← ingested from Harris County Public Health
                    ├── flood_zones       ← ingested from FEMA via ArcGIS
                    ├── census_tracts     ← geometry for point-in-polygon lookups
                    └── safety_scores     ← pre-computed scores per tract
```

**Key architectural decisions:**

- **All spatial queries run in PostGIS, not the browser.** Point-in-polygon (which census tract is this coordinate in?) and flood zone intersection happen via SQL with GiST-indexed geometry columns. No Turf.js, no client-side GIS.
- **Rentcast is never called from the client.** All requests go through `/api/listings` and `/api/property` — the API key stays server-side. Results are cached 7 days to stay within the free-tier limit (50 req/month).
- **Mapbox GL JS is used directly**, not through `react-map-gl`. This keeps the abstraction layer thin and gives full access to the style API for custom overlay rendering.
- **Overlay data is GeoJSON served from Supabase via API routes.** Flood zones and cancer choropleth are rendered as Mapbox fill layers, not as markers — they scale to any zoom level without performance degradation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Mapping | Mapbox GL JS |
| Database | Supabase (PostgreSQL + PostGIS) |
| Listings API | Rentcast |
| Environmental Data | ArcGIS Feature Services (FEMA NFHL) |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root — map view
│   └── api/
│       ├── listings/             # Rentcast proxy + Supabase cache
│       ├── property/             # Address lookup endpoint
│       ├── safety/               # Safety score calculator
│       └── overlays/             # GeoJSON overlay endpoints
│           ├── cancer/
│           ├── flood/
│           └── facilities/
├── components/
│   ├── Map/                      # Mapbox container + overlay layers
│   ├── Listings/                 # Listing panel, cards, filters, detail
│   ├── Safety/                   # Score badge, breakdown, cancer trend chart
│   └── UI/                       # Address search, header, error boundary
├── hooks/
│   ├── useMapListings.ts         # Fetches listings for current map bounds
│   ├── useMapOverlays.ts         # Manages flood/cancer layer visibility
│   ├── useSafetyScore.ts         # Fetches score for a coordinate
│   └── useCancerTrend.ts         # Historical SIR trend for a tract
├── lib/
│   ├── safety.ts                 # Score calculation logic
│   ├── rentcast.ts               # Rentcast API client
│   ├── rate-limit.ts             # Request throttling for Rentcast
│   ├── bbox-utils.ts             # Bounding box helpers
│   └── supabase/                 # Typed Supabase clients (client + server)
└── types/
    ├── database.ts               # Auto-generated from Supabase schema
    ├── listing.ts
    ├── safety.ts
    └── geo.ts
```

---

## Data Pipeline

Environmental data is ingested once via scripts in `scripts/ingest-*.ts` and stored in Supabase:

1. **Census Tracts** — geometry loaded from Census TIGER/Line shapefiles into `census_tracts`
2. **Cancer Prevalence** — SIR data from Harris County Public Health joined to census tracts via FIPS code, stored in `cancer_prevalence`
3. **Flood Zones** — FEMA NFHL polygons fetched from ArcGIS Feature Services, stored in `flood_zones`
4. **Safety Scores** — pre-computed per census tract and stored in `safety_scores`; point lookups use PostGIS `ST_Within` against this table

All geometry columns have GiST spatial indexes. The ingestion scripts are idempotent — safe to re-run after data updates.

---

## Running Locally

```bash
# Prerequisites: Node 18+, a Supabase project with PostGIS, Rentcast API key, Mapbox token

cp .env.local.example .env.local
# Fill in all required env vars (see below)

npm install
npm run dev
# → http://localhost:3000
```

**Required environment variables:**

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=          # Mapbox public token
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=         # Server-only: used by API routes
RENTCAST_API_KEY=                  # Rentcast API key
RENTCAST_MONTHLY_LIMIT=45          # Soft cap on outbound Rentcast calls
NEXT_PUBLIC_DEFAULT_CENTER_LAT=29.7604
NEXT_PUBLIC_DEFAULT_CENTER_LNG=-95.3698
LISTING_CACHE_TTL_HOURS=168        # 7 days
```

---

## Design System

The UI follows an **Editorial Minimalism + High-Contrast Fintech** aesthetic — Swiss Style typography, bold color blocking, sharp borders, and asymmetrical composition. The palette is a saturated monochromatic blue with emerald safety accents:

| Variable | Hex | Role |
|---|---|---|
| `--color-twilight-indigo` | `#273A71` | Primary background |
| `--color-dusk-blue` | `#3358A3` | Cards, secondary containers |
| `--color-sapphire-sky` | `#3A70BA` | Borders, map overlays |
| `--color-fresh-sky` | `#3BADF6` | Buttons, CTAs |
| `--color-emerald` | `#6DD799` | Safe status indicators |
| `--color-alice-blue` | `#D6DEE9` | Primary text on dark |

Typography: **Fraunces** (headlines, data callouts) + **Plus Jakarta Sans** (body, navigation).

---

## Status

Active development. Current phase: UI/UX Polish → Deploy & Optimize.

Completed phases: scaffold & map, data ingestion, Rentcast listings integration, safety score engine.
