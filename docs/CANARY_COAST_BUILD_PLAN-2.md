# Canary Coast — Build Plan (Schema Reference)

> **Archived sections** (data source research §2, implementation phases §4–8, env vars §7, GitHub setup §8) moved to `docs/archive/CANARY_COAST_BUILD_PLAN-2-full.md`.

**Stack:** React · TypeScript · Tailwind CSS · Supabase · Vercel · Mapbox GL JS

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                 │
│  Next.js App Router + React + TypeScript + Tailwind │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Map View  │  │ Listing  │  │  Score Overlay   │  │
│  │ (Mapbox GL)│  │  Panel   │  │  (Cancer+Flood)  │  │
│  └───────────┘  └──────────┘  └──────────────────┘  │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
    ┌──────▼──────┐          ┌────────▼────────┐
    │  Vercel API │          │    Supabase     │
    │   Routes    │          │  (PostgreSQL +  │
    │ (proxies)   │          │   PostGIS)      │
    └──────┬──────┘          └────────┬────────┘
           │                          │
   ┌───────▼───────┐    ┌─────────────▼──────────────┐
   │   Rentcast    │    │  Pre-ingested GIS Data     │
   │   API proxy   │    │  • Cancer census tracts    │
   │               │    │  • FEMA flood zones        │
   └───────────────┘    │  • Census tract geometries │
                        └────────────────────────────┘
```

**Key decisions:**
- Supabase PostGIS handles all spatial queries (point-in-polygon for flood zone, census tract lookups) — no client-side GIS.
- Vercel API routes proxy Rentcast calls so the API key never reaches the client.
- Mapbox GL JS renders listing pins and colored overlays performantly on the client.

---

## 2. Supabase Schema

Enable PostGIS extension first:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Tables

```sql
-- Census tract geometries + cancer data
CREATE TABLE census_tracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  geoid TEXT UNIQUE NOT NULL,           -- e.g. '48201010100'
  tract_name TEXT,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  cancer_sir_overall NUMERIC,
  cancer_sir_brain NUMERIC,
  cancer_sir_lung NUMERIC,
  cancer_sir_breast NUMERIC,
  cancer_sir_prostate NUMERIC,
  cancer_sir_colon NUMERIC,
  cancer_prevalence_pct NUMERIC,
  data_source TEXT,
  data_year INTEGER,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_geoid CHECK (geoid ~ '^[0-9]{11}$')
);
CREATE INDEX idx_tracts_geom ON census_tracts USING GIST(geometry);
CREATE INDEX idx_tracts_geoid ON census_tracts(geoid);

-- Flood zone polygons
CREATE TABLE flood_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fld_zone TEXT NOT NULL,
  zone_subtype TEXT,
  sfha_tf BOOLEAN,
  static_bfe NUMERIC,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN fld_zone IN ('V','VE') THEN 'very_high'
      WHEN fld_zone IN ('A','AE','AH','AO','AR','A99') THEN 'high'
      WHEN zone_subtype = '0.2 PCT ANNUAL CHANCE FLOOD HAZARD' THEN 'moderate'
      WHEN fld_zone = 'D' THEN 'undetermined'
      ELSE 'minimal'
    END
  ) STORED,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_flood_geom ON flood_zones USING GIST(geometry);
CREATE INDEX idx_flood_zone ON flood_zones(fld_zone);

-- Cached listings from Rentcast
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Houston',
  state TEXT DEFAULT 'TX',
  zipcode TEXT,
  county TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  point GEOMETRY(Point, 4326) NOT NULL,
  price INTEGER,
  bedrooms SMALLINT,
  bathrooms NUMERIC,
  sqft INTEGER,
  lot_sqft INTEGER,
  year_built SMALLINT,
  home_type TEXT,
  listing_status TEXT,
  listing_type TEXT,
  days_on_market INTEGER,
  listed_date TIMESTAMPTZ,
  mls_name TEXT,
  listing_agent_name TEXT,
  listing_office_name TEXT,
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  flood_zone_code TEXT,
  flood_risk_level TEXT,
  safety_score NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '168 hours'),
  CONSTRAINT valid_coords CHECK (
    latitude BETWEEN 29.0 AND 30.5 AND
    longitude BETWEEN -96.0 AND -94.5
  )
);
CREATE INDEX idx_listings_point ON listings USING GIST(point);
CREATE INDEX idx_listings_expires ON listings(expires_at);
CREATE INDEX idx_listings_safety ON listings(safety_score);

-- Search areas (bbox-level cache to prevent redundant API calls)
CREATE TABLE search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox GEOMETRY(Polygon, 4326) NOT NULL,
  listing_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '168 hours')
);
CREATE INDEX idx_search_bbox ON search_cache USING GIST(bbox);

-- Pre-computed safety scores per census tract
CREATE TABLE safety_scores (
  geoid TEXT PRIMARY KEY,
  cancer_score NUMERIC,
  flood_score NUMERIC,
  composite_score NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key PostGIS Functions

```sql
-- Get safety data for a lat/lng point
CREATE OR REPLACE FUNCTION get_safety_at_point(
  lat NUMERIC, lng NUMERIC
) RETURNS TABLE(
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  flood_zone TEXT,
  flood_risk TEXT
) AS $$
DECLARE
  pt GEOMETRY := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
BEGIN
  RETURN QUERY
  SELECT
    ct.geoid,
    ct.cancer_sir_overall,
    fz.fld_zone,
    fz.risk_level
  FROM
    (SELECT geoid, cancer_sir_overall
     FROM census_tracts
     WHERE ST_Contains(geometry, pt)
     LIMIT 1) ct
  FULL OUTER JOIN
    (SELECT fld_zone, risk_level
     FROM flood_zones
     WHERE ST_Contains(geometry, pt)
     ORDER BY
       CASE risk_level
         WHEN 'very_high' THEN 1
         WHEN 'high' THEN 2
         WHEN 'moderate' THEN 3
         ELSE 4
       END
     LIMIT 1) fz ON TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Rentcast API changes/shutdown** | No listing data | Abstract behind `rentcast.ts` interface; swap to alternative provider. |
| **Harris County cancer service auth-gated** | No tract-level cancer data | Fall back to CDC PLACES (census tract level, public API). |
| **FEMA NFHL query limits** | Can't ingest all flood polygons | Paginate aggressively. Alternative: download full county NFHL shapefile from FEMA Map Service Center. |
| **Supabase PostGIS performance** | Slow safety lookups | Spatial indexes (already in schema). Simplify geometries on ingest. Pre-compute safety scores in `safety_scores` table. |
| **Rentcast rate limits (free tier = 50/mo)** | Quota exhausted | Aggressive caching in Supabase (7-day TTL). Serve cached data with "may be stale" indicator. |
| **Mapbox costs at scale** | Map tile usage limits | Free tier = 50K map loads/mo. Monitor via Mapbox dashboard. |

---

## 4. Future Enhancements

- **User accounts** (Supabase Auth): save favorite listings, alerts when safety scores change.
- **Historical flood events overlay**: Harvey inundation data from Harris County Flood Control District.
- **School ratings layer**: GreatSchools API integration.
- **Commute time heatmap**: Mapbox Isochrone API.
- **Comparative view**: side-by-side comparison of 2–3 listings with radar chart of safety dimensions.
- **Expanded geography**: Fort Bend, Montgomery, Galveston counties.
