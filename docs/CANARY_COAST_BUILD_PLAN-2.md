# Canary Coast — Build Plan

**Project:** A map-based web app that overlays Harris County housing listings with environmental safety scores derived from cancer prevalence data and FEMA flood zone risk.

**Codename:** Canary Coast

**Stack:** React · TypeScript · Tailwind CSS · Supabase · Vercel · Mapbox GL JS

**Design System:** Editorial Minimalism + High-Contrast Fintech (see `docs/design/canary-coast-design-skill.md`)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Sources & API Strategy](#2-data-sources--api-strategy)
3. [Supabase Schema](#3-supabase-schema)
4. [Safety Score Algorithm](#4-safety-score-algorithm)
5. [Project Structure](#5-project-structure)
6. [Implementation Phases](#6-implementation-phases)
7. [Phase 1 — Scaffold & Map](#phase-1--scaffold--map)
8. [Phase 2 — Data Ingestion Pipeline](#phase-2--data-ingestion-pipeline)
9. [Phase 3 — Listings Integration](#phase-3--listings-integration)
10. [Phase 4 — Safety Score Engine](#phase-4--safety-score-engine)
11. [Phase 5 — UI & UX Polish](#phase-5--ui--ux-polish)
12. [Phase 6 — Deploy & Optimize](#phase-6--deploy--optimize)
13. [Environment Variables](#7-environment-variables)
14. [GitHub Setup & Deployment](#8-github-setup--deployment)
15. [Key Risks & Mitigations](#9-key-risks--mitigations)
16. [Future Enhancements](#10-future-enhancements)

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
   │  RapidAPI     │    │  Pre-ingested GIS Data     │
   │  Zillow Proxy │    │  • Cancer census tracts    │
   │               │    │  • FEMA flood zones        │
   └───────────────┘    │  • Census tract geometries │
                        └────────────────────────────┘
```

**Why this architecture:**
- Supabase PostGIS handles all spatial queries (point-in-polygon for flood zone, census tract lookups) at the database level — no client-side GIS processing.
- Vercel API routes proxy RapidAPI calls so the API key never reaches the client.
- Mapbox GL JS renders listing pins and colored overlays (cancer heatmap, flood zone polygons) performantly on the client.

---

## 2. Data Sources & API Strategy

### 2A. Housing Listings — Zillow via RapidAPI

**Provider:** "Real-Time Zillow Data" by OpenWeb Ninja on RapidAPI
**URL:** `https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-zillow-data`
**Why:** Unofficial but well-maintained; returns full listing data including lat/lng, price, beds, baths, sqft, photos, Zestimate, listing URL. Free tier: 50 requests/month. Paid: starts ~$10/mo for 500 requests.

**Key endpoints to use:**
| Endpoint | Purpose | Params |
|---|---|---|
| `GET /searchByCoordinates` | Listings within a bounding box | `lat_min`, `lat_max`, `lng_min`, `lng_max`, `status` (ForSale), `home_type` |
| `GET /propertyDetails` | Full detail for a single listing | `zpid` (Zillow property ID) |
| `GET /searchByUrl` | Search by Zillow search URL | `url` (e.g. Zillow search URL for Houston) |

**Alternative provider (if OpenWeb Ninja goes down):**
- "Zillow.com" by apimaker: `https://rapidapi.com/apimaker/api/zillow-com1`
- "Zillow Working API": `https://rapidapi.com/oneapiproject/api/zillow-working-api`

**Rate limit strategy:**
- Cache listing results in Supabase with a 24-hour TTL (listings don't change minute-by-minute).
- On map pan/zoom, check Supabase first; only call RapidAPI if the bounding box has no cached results within TTL.

---

### 2B. Cancer Prevalence — Harris County Cancer Data Explorer

**Source:** Harris County Public Health Cancer Data Explorer
**URL:** `https://experience.arcgis.com/experience/5e729a01dffc4fc58e9a5d02618e24f1/`
**Data:** Census-tract-level prevalence rates for 16 cancer types (brain, lung, colon, prostate, breast, etc.) with Standardized Incidence Ratios (SIRs) comparing each tract to statewide Texas rates.

**Data acquisition strategy (two-tier):**

**Tier 1 — ArcGIS Feature Service (preferred, try first):**
The Experience Builder app consumes an ArcGIS Feature Service. Reverse-engineer the service URL:
1. Open the Experience Builder URL in a browser.
2. Open DevTools → Network tab → filter by `FeatureServer` or `MapServer`.
3. Look for requests to URLs like:
   ```
   https://services[X].arcgis.com/[orgId]/arcgis/rest/services/[serviceName]/FeatureServer/[layerId]/query
   ```
4. Once you find the service URL, query it directly:
   ```
   GET {serviceUrl}/query?where=1=1&outFields=*&f=geojson&resultRecordCount=2000
   ```
5. This returns GeoJSON with census tract polygons + cancer prevalence fields.

**Tier 2 — Fallback: CDC PLACES + manual data:**
If the Harris County service is private/auth-gated:
- Use **CDC PLACES** census-tract-level data (publicly available ArcGIS FeatureServer):
  ```
  https://services.arcgis.com/[cdcOrgId]/arcgis/rest/services/PLACES_CensusTract/FeatureServer/0/query
  ?where=CountyFIPS='48201'    (48201 = Harris County FIPS)
  &outFields=*
  &f=geojson
  ```
  This provides cancer prevalence (adults ever told they had cancer) at census tract level.
- Supplement with the downloadable data from Harris County Open Data Hub: `https://geo-harriscounty.opendata.arcgis.com/`

**Data to extract per census tract:**
- `GEOID` (census tract FIPS code, e.g. `48201010100`)
- `geometry` (polygon boundary)
- Cancer prevalence rates (per 100,000 or SIR ratio) for each cancer type
- Overall cancer SIR (Standardized Incidence Ratio) — the primary score input

**Ingestion: STATIC — one-time bulk download into Supabase.**
This data is derived from Texas DSHS cancer registry records spanning 2013–2021. It will not change on any regular cadence — at most an annual refresh when a new study period is published. There is no reason to query ArcGIS at runtime. Store the full dataset (geometry + all prevalence fields) in Supabase PostGIS and serve from there.

**How to reverse-engineer the ArcGIS service URL (manual, one-time):**

The Experience Builder app is fully client-rendered — the data service URLs are embedded in XHR requests, not visible in the page source. To extract them:

1. Open the Cancer Data Explorer URL in Chrome.
2. Open DevTools → **Network** tab → clear the log.
3. In the filter bar, type `query` or `FeatureServer`.
4. Interact with the map: zoom into a census tract, click a polygon, or switch between cancer types using the app's dropdowns/tabs.
5. Watch for requests to URLs matching this pattern:
   ```
   https://services[X].arcgis.com/[orgId]/arcgis/rest/services/[serviceName]/FeatureServer/[layerNum]/query?...
   ```
6. Right-click the request → **Copy → Copy URL**.
7. The URL fragment from your link (`dataSource_57-19d282a14ef-layer-32`) suggests **layer 32** in a multi-layer service — likely prostate cancer. Other cancer types will be on adjacent layer IDs (e.g., 30, 31, 33, etc.).
8. Once you have the base URL, validate by opening this in a browser:
   ```
   {baseServiceUrl}/FeatureServer/{layerId}/query?where=1=1&outFields=*&f=geojson&resultRecordCount=1
   ```
   Confirm it returns a GeoJSON feature with census tract geometry + cancer prevalence fields.
9. Also check the service root (`{baseServiceUrl}/FeatureServer?f=json`) to see ALL available layers — this will list all 16 cancer types and their layer IDs.

**Alternative discovery method:** Check the Experience Builder's config:
```
https://www.arcgis.com/sharing/rest/content/items/5e729a01dffc4fc58e9a5d02618e24f1/data?f=json
```
This JSON config file lists all data sources with their service URLs.

---

### 2C. Flood Zone Risk — FEMA NFHL

**Source:** FEMA National Flood Hazard Layer (NFHL)
**REST Service:** `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer`
**Feature Service:** `https://services.arcgis.com/2gdL2gxYNFY2TOUb/arcgis/rest/services/FEMA_National_Flood_Hazard_Layer/FeatureServer`

**Key layer:** Layer 28 — "Flood Hazard Zones" (`S_FLD_HAZ_AR`)
This contains the actual flood zone polygons with the `FLD_ZONE` field:
| Zone Code | Risk Level | Description |
|---|---|---|
| `A`, `AE`, `AH`, `AO`, `AR` | **High** | 1% annual chance (100-year flood), Special Flood Hazard Area |
| `VE`, `V` | **Very High** | Coastal high-velocity flood zone |
| `X` (shaded / 0.2%) | **Moderate** | 0.2% annual chance (500-year flood) |
| `X` (unshaded) | **Minimal** | Outside mapped floodplain |
| `D` | **Undetermined** | Possible but undetermined risk |

**Query to get Harris County flood zones:**
```
GET https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query
  ?where=DFIRM_ID='48201C'
  &outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE
  &f=geojson
  &resultRecordCount=2000
  &resultOffset=0
```
Note: FEMA limits to 2000 records per request. Paginate with `resultOffset`.

**Alternative — Harris County-specific overlay:**
The Harris County FEMT tool (`harriscountyfemt.org`) uses its own ArcGIS service at:
```
https://www.gis.hctx.net/arcgis/rest/services/
```
Inspect the FEMT app's network requests for the exact service URL. This may have more granular local data including ponding zones and watershed boundaries.

**Ingestion: STATIC — one-time bulk download into Supabase.**
FEMA updates the NFHL monthly nationwide, but Harris County flood zone boundaries are very stable (last major revision was the 2007 FIRM adoption + subsequent LOMRs). Download once, re-ingest only if FEMA issues a LOMR affecting Harris County.

---

### 2E. Static Data Caching Strategy (Cancer + Flood)

Both the cancer prevalence data and flood zone data are **static reference datasets** — they change on timescales of months to years, not minutes. The architecture treats them as pre-loaded lookup tables, not live API integrations.

**Runtime flow (no external GIS calls):**
```
User pans map → fetch listings from Zillow/cache → for each listing lat/lng:
  └→ PostGIS: ST_Contains(census_tracts.geometry, point) → cancer SIR
  └→ PostGIS: ST_Contains(flood_zones.geometry, point) → flood zone code
  └→ Compute safety score in-app
  └→ Return listing + score to client
```

All spatial lookups happen inside Supabase — zero network calls to ArcGIS or FEMA at runtime.

**Ingestion cadence:**

| Dataset | Source Update Frequency | Recommended Re-ingest |
|---|---|---|
| Cancer prevalence (Harris County PH) | ~Annually (study period-based) | Manually, when HCPH announces a new release |
| Flood zones (FEMA NFHL) | Monthly (nationwide), rare for Harris County | Every 6–12 months, or after a major LOMR |
| Census tract boundaries (TIGER) | Decennially (Census 2020 is current) | Never, unless Census 2030 changes tracts |

**Ingestion script design:**
```
scripts/
├── ingest-cancer-data.ts     # One-time: ArcGIS → Supabase
├── ingest-flood-zones.ts     # One-time: FEMA NFHL → Supabase
├── ingest-census-tracts.ts   # One-time: TIGER shapefiles → Supabase
└── utils/
    ├── arcgis-paginator.ts   # Generic: paginate any ArcGIS REST query
    └── geometry-simplifier.ts # Reduce vertex count for map rendering
```

Each script is idempotent (uses `UPSERT ON CONFLICT`) so re-running is safe.

**Supabase storage estimates:**
| Table | Rows | Geometry Size | Total Est. |
|---|---|---|---|
| `census_tracts` | ~800 tracts | ~2 KB/tract simplified | ~5 MB |
| `flood_zones` | ~5,000–15,000 polygons | ~1–5 KB/polygon simplified | ~30–50 MB |
| `listings` (cached) | ~500–2,000 active | Point only (tiny) | ~2 MB |

Well within Supabase free tier (500 MB database).

---

### 2F. Historical Cancer Trend Data (Single Source: HCPH Explorer)

The HCPH Cancer Data Explorer is built on **Texas Cancer Registry** (DSHS) case data — actual diagnosed incidence with Standardized Incidence Ratios (SIRs) comparing each area to statewide Texas rates. This is the only cancer data source Canary Coast should use. Mixing in CDC PLACES (which uses self-reported BRFSS survey data) or NCI State Cancer Profiles (which uses different aggregation methods) would create apples-to-oranges comparisons that mislead users.

#### Determining if Trend Data Exists (DevTools Discovery)

Reporting indicates the explorer lets users filter by **cancer site, year range, sex, and race/ethnicity**. If year-range filtering exists, the underlying ArcGIS service likely stores temporal data in one of two ways:

**Option A — Multiple layers per time period:**
The service may have separate layer IDs for different year windows:
```
Layer 30: Prostate Cancer SIR (2013-2016)
Layer 31: Prostate Cancer SIR (2017-2021)
Layer 32: Prostate Cancer SIR (2013-2021)  ← your URL fragment
```

**Option B — Year fields within a single layer:**
Each feature (zip code polygon) may have multiple year-range columns:
```
{
  ZCTA: "77002",
  SIR_2013_2016: 1.24,
  SIR_2017_2021: 1.31,
  SIR_2013_2021: 1.28,
  ...
}
```

**How to find out (manual, one-time — do this before building the ingestion script):**

1. Open the Cancer Data Explorer in Chrome.
2. DevTools → Network → filter for `FeatureServer` or `query`.
3. Change the **time period** filter in the explorer UI.
4. Watch what changes in the network request:
   - If the **layer ID** changes (e.g., `/32/query` becomes `/28/query`), it's Option A.
   - If the layer stays the same but a **`where` clause** or **`outFields`** changes, it's Option B.
5. Also check the service root: `{baseServiceUrl}/FeatureServer?f=json`
   - The `layers` array will list all available layers with their names — look for year ranges in the names.

#### Path A: Multi-Period Data Available

If the service has year-range breakdowns (either via multiple layers or year fields), you can build a real trend visualization:

**Supabase schema for trends:**

```sql
-- Census-tract-level cancer data (from HCPH ArcGIS / TX Cancer Registry)
-- NOTE: HCPH data is at census-tract level (GEOID), not zip-code level.
CREATE TABLE tract_cancer_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tract_geoid TEXT NOT NULL,                 -- 11-digit census tract GEOID, e.g. '48201010100'
  cancer_type TEXT NOT NULL,                 -- 'prostate', 'breast', 'lung', 'brain', 'colon', etc.
  year_start INTEGER NOT NULL,               -- e.g. 2013
  year_end INTEGER NOT NULL,                 -- e.g. 2021
  sir NUMERIC,                               -- Standardized Incidence Ratio vs Texas average
  observed_cases INTEGER,
  expected_cases NUMERIC,
  confidence_low NUMERIC,                    -- 95% CI lower bound (lowr_CI)
  confidence_high NUMERIC,                   -- 95% CI upper bound (uppr_CI)
  data_source TEXT DEFAULT 'HCPH_TX_CANCER_REGISTRY',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tract_cancer_period UNIQUE (tract_geoid, cancer_type, year_start, year_end)
);

CREATE INDEX idx_tract_cancer_geoid ON tract_cancer_data(tract_geoid);
CREATE INDEX idx_tract_cancer_type ON tract_cancer_data(cancer_type);
CREATE INDEX idx_tract_cancer_years ON tract_cancer_data(year_start, year_end);

-- NOTE: Tract geometry is stored in census_tracts.geometry (via ingest-census-tracts.ts).
-- No separate zip_geometries table is needed.
```

**Trend query function:**

```sql
-- DROP first if upgrading from the old zip-based signature
DROP FUNCTION IF EXISTS get_cancer_trend(text, text);

CREATE OR REPLACE FUNCTION get_cancer_trend(
  target_geoid TEXT,
  target_cancer_type TEXT DEFAULT 'all'
) RETURNS TABLE(
  year_start INTEGER,
  year_end INTEGER,
  sir NUMERIC,
  confidence_low NUMERIC,
  confidence_high NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.year_start, d.year_end, d.sir, d.confidence_low, d.confidence_high
  FROM tract_cancer_data d
  WHERE d.tract_geoid = target_geoid
    AND d.cancer_type = target_cancer_type
  ORDER BY d.year_start ASC;
END;
$$ LANGUAGE plpgsql;
```

**UI: Trend chart in detail panel:**
- X-axis: year-range labels (e.g., "2013–16", "2017–21")
- Y-axis: SIR value
- Reference line at SIR = 1.0 (state average), labeled "Texas Average"
- Confidence interval band (shaded)
- Color-coded: green below 1.0, red above 1.0
- Dropdown to switch between cancer types (brain, lung, prostate, etc.)

#### Path B: Only a Single Aggregated Snapshot (2013–2021)

If the explorer only contains one time window per cancer type, there's no honest way to show a trend from this source. In that case, the feature set shifts from "trend over time" to **"comparative analysis across cancer types"**:

**Alternative visualization — Cancer Type Comparison Chart:**
- Horizontal bar chart showing SIR for each of the 16 cancer types in the user's zip code.
- Each bar color-coded: green (SIR < 0.8), yellow (0.8–1.2), red (> 1.2).
- Reference line at 1.0 = Texas state average.
- This answers the question: "Which cancers are elevated in my area?" — which is arguably more useful than a trend of a single aggregate number.
- Include a note: "Data covers 2013–2021. Trend analysis will be available when HCPH publishes updated data for a new time period."

**Schema (one row per tract × cancer type):**

```sql
CREATE TABLE tract_cancer_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tract_geoid TEXT NOT NULL,                 -- 11-digit GEOID, e.g. '48201010100'
  cancer_type TEXT NOT NULL,                 -- 17 types from HCPH HC_ layers
  year_start INTEGER NOT NULL DEFAULT 2013,
  year_end INTEGER NOT NULL DEFAULT 2021,
  sir NUMERIC,
  observed_cases INTEGER,
  expected_cases NUMERIC,
  confidence_low NUMERIC,
  confidence_high NUMERIC,
  data_source TEXT DEFAULT 'HCPH_TX_CANCER_REGISTRY',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tract_cancer UNIQUE (tract_geoid, cancer_type, year_start, year_end)
);
```

**Total rows:** ~1,115 census tracts × 17 cancer types = ~18,955 rows (confirmed).

#### Ingestion Script

```
scripts/
├── ...existing scripts...
├── ingest-hcph-cancer.ts         # ArcGIS HC_ layers (17–33) → tract_cancer_data
```

This script handles everything:
1. Hardcoded HCPH ArcGIS service URL (no DevTools extraction needed).
2. Iterates HC_ layers 17–33 (one per cancer type, Harris County census-tract level).
3. Upserts SIR data into `tract_cancer_data` using GEOID as the tract identifier.
4. Tract geometry is sourced from `census_tracts` table (ingest-census-tracts.ts).

---

### 2D. Census Tract Boundaries (base geometry)

**Source:** US Census Bureau TIGER/Line
**URL:** `https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_48_tract.zip`
(Texas state-level census tracts; filter to `COUNTYFP = '201'` for Harris County)

This provides the baseline geometry to join cancer data against. If the cancer data comes with its own geometry, this may be redundant — but it's a reliable fallback.

---

## 3. Supabase Schema

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
  
  -- Cancer prevalence (SIR = Standardized Incidence Ratio vs Texas avg)
  -- SIR > 1.0 means higher than state average
  cancer_sir_overall NUMERIC,            -- overall cancer SIR
  cancer_sir_brain NUMERIC,
  cancer_sir_lung NUMERIC,
  cancer_sir_breast NUMERIC,
  cancer_sir_prostate NUMERIC,
  cancer_sir_colon NUMERIC,
  cancer_prevalence_pct NUMERIC,         -- CDC PLACES: % adults ever told cancer
  
  -- Metadata
  data_source TEXT,                      -- 'harris_county_ph' or 'cdc_places'
  data_year INTEGER,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_geoid CHECK (geoid ~ '^[0-9]{11}$')
);

CREATE INDEX idx_tracts_geom ON census_tracts USING GIST(geometry);
CREATE INDEX idx_tracts_geoid ON census_tracts(geoid);

-- Flood zone polygons
CREATE TABLE flood_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fld_zone TEXT NOT NULL,               -- 'AE', 'X', 'VE', etc.
  zone_subtype TEXT,
  sfha_tf BOOLEAN,                      -- Special Flood Hazard Area true/false
  static_bfe NUMERIC,                   -- Base Flood Elevation
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

-- Cached listings from Zillow
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zpid TEXT UNIQUE NOT NULL,            -- Zillow property ID
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Houston',
  state TEXT DEFAULT 'TX',
  zipcode TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  point GEOMETRY(Point, 4326) NOT NULL,
  
  -- Property details
  price INTEGER,
  bedrooms SMALLINT,
  bathrooms NUMERIC,
  sqft INTEGER,
  lot_sqft INTEGER,
  year_built SMALLINT,
  home_type TEXT,                       -- 'SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE'
  listing_status TEXT,                  -- 'FOR_SALE', 'PENDING', 'SOLD'
  zestimate INTEGER,
  rent_zestimate INTEGER,
  
  -- Photos
  primary_photo_url TEXT,
  photo_urls JSONB DEFAULT '[]',
  
  -- Zillow link
  listing_url TEXT,
  
  -- Computed safety (denormalized for fast queries)
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  flood_zone_code TEXT,
  flood_risk_level TEXT,
  safety_score NUMERIC,                -- 0-100, computed
  
  -- Cache management
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  CONSTRAINT valid_coords CHECK (
    latitude BETWEEN 29.0 AND 30.5 AND
    longitude BETWEEN -96.0 AND -94.5
  )
);

CREATE INDEX idx_listings_point ON listings USING GIST(point);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_status ON listings(listing_status);
CREATE INDEX idx_listings_expires ON listings(expires_at);
CREATE INDEX idx_listings_safety ON listings(safety_score);

-- Search areas (track which bounding boxes have been fetched)
CREATE TABLE search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox GEOMETRY(Polygon, 4326) NOT NULL,
  listing_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_search_bbox ON search_cache USING GIST(bbox);
```

### Key PostGIS Functions

```sql
-- Get safety data for a lat/lng point
CREATE OR REPLACE FUNCTION get_safety_at_point(
  lat NUMERIC, lng NUMERIC
) RETURNS TABLE(
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  cancer_prevalence NUMERIC,
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
    ct.cancer_prevalence_pct,
    fz.fld_zone,
    fz.risk_level
  FROM 
    (SELECT geoid, cancer_sir_overall, cancer_prevalence_pct 
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

-- Get listings within bounding box with safety scores
CREATE OR REPLACE FUNCTION get_listings_in_bbox(
  lat_min NUMERIC, lng_min NUMERIC,
  lat_max NUMERIC, lng_max NUMERIC,
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 999999999,
  min_safety NUMERIC DEFAULT 0
) RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  WHERE ST_Within(
    l.point,
    ST_MakeEnvelope(lng_min, lat_min, lng_max, lat_max, 4326)
  )
  AND l.price BETWEEN price_min AND price_max
  AND (l.safety_score >= min_safety OR l.safety_score IS NULL)
  AND l.listing_status = 'FOR_SALE'
  AND l.expires_at > NOW()
  ORDER BY l.safety_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Safety Score Algorithm

The safety score is a **composite 0–100 rating** where 100 = safest. Two sub-scores are weighted and combined:

### Cancer Risk Sub-Score (40% weight)

Input: `cancer_sir_overall` (Standardized Incidence Ratio for the census tract)

```
SIR = 1.0  → tract matches Texas state average
SIR > 1.0  → higher cancer rate than average
SIR < 1.0  → lower cancer rate than average
```

Scoring:
```
cancer_score = CLAMP(0, 100, 100 - ((SIR - 0.5) / 1.5) * 100)

SIR ≤ 0.5   → 100 (very low cancer prevalence)
SIR = 1.0   → 67  (average)
SIR = 1.5   → 33  (elevated)
SIR ≥ 2.0   → 0   (very high cancer prevalence)
```

If using CDC PLACES percentage instead of SIR:
```
cancer_score = CLAMP(0, 100, 100 - (prevalence_pct / 15) * 100)
(where 15% is the upper-bound benchmark)
```

### Flood Risk Sub-Score (60% weight — higher weight because flood risk is more actionable)

Input: `flood_risk_level` derived from FEMA zone code

Scoring:
```
minimal        → 100
undetermined   → 70
moderate       → 40
high           → 15
very_high      → 0
```

### Composite Score

```
safety_score = (cancer_score * 0.4) + (flood_score * 0.6)
```

Interpretation bands (display to user):
| Score | Label | Color |
|---|---|---|
| 80–100 | Excellent | Green `#22c55e` |
| 60–79 | Good | Lime `#84cc16` |
| 40–59 | Fair | Yellow `#eab308` |
| 20–39 | Caution | Orange `#f97316` |
| 0–19 | High Risk | Red `#ef4444` |

---

## 5. Project Structure

```
canary-coast/
├── .env.local                    # Local environment variables
├── .env.example                  # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vercel.json
│
├── docs/
│   └── design/
│       └── canary-coast-design-skill.md  # Design system: Editorial Minimalism + Fintech
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_enable_postgis.sql
│   │   ├── 002_create_tables.sql
│   │   └── 003_create_functions.sql
│   └── seed/
│       └── README.md              # Instructions for data ingestion
│
├── scripts/                       # Data ingestion scripts (run locally)
│   ├── ingest-cancer-data.ts      # Fetch ArcGIS cancer data → Supabase
│   ├── ingest-flood-zones.ts      # Fetch FEMA NFHL data → Supabase
│   ├── ingest-census-tracts.ts    # Fetch TIGER boundaries → Supabase
│   ├── ingest-hcph-cancer.ts      # HCPH ArcGIS HC_ layers → tract_cancer_data
│   ├── compute-safety-scores.ts   # Batch compute scores for cached listings
│   └── utils/
│       ├── arcgis-client.ts       # Paginated ArcGIS REST query helper
│       └── supabase-admin.ts      # Supabase service-role client
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Main map view
│   │   ├── globals.css
│   │   │
│   │   └── api/
│   │       ├── listings/
│   │       │   └── route.ts       # Proxy: Zillow search via RapidAPI
│   │       ├── listing/[zpid]/
│   │       │   └── route.ts       # Proxy: Zillow property detail
│   │       └── safety/
│   │           └── route.ts       # Get safety score for a lat/lng
│   │
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.tsx   # Mapbox GL wrapper
│   │   │   ├── ListingMarkers.tsx # Colored pins by safety score
│   │   │   ├── FloodOverlay.tsx   # Flood zone polygon layer
│   │   │   ├── CancerOverlay.tsx  # Census tract choropleth layer
│   │   │   └── MapControls.tsx    # Layer toggles, legend
│   │   │
│   │   ├── Listings/
│   │   │   ├── ListingPanel.tsx   # Sidebar with listing cards
│   │   │   ├── ListingCard.tsx    # Individual listing preview
│   │   │   ├── ListingDetail.tsx  # Full detail modal/drawer
│   │   │   └── ListingFilters.tsx # Price, beds, safety score filters
│   │   │
│   │   ├── Safety/
│   │   │   ├── SafetyBadge.tsx    # Score display component (0-100)
│   │   │   ├── SafetyBreakdown.tsx # Cancer + Flood sub-scores
│   │   │   ├── ScoreLegend.tsx    # Color legend explanation
│   │   │   └── CancerTrend.tsx    # SIR trend or cancer-type comparison chart
│   │   │
│   │   └── UI/
│   │       ├── Header.tsx
│   │       ├── LoadingOverlay.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── hooks/
│   │   ├── useMapListings.ts      # Fetch listings for current viewport
│   │   ├── useSafetyScore.ts      # Get/compute safety for a point
│   │   ├── useCancerTrend.ts      # Fetch zip-level cancer data from Supabase
│   │   ├── useMapOverlays.ts      # Toggle cancer/flood overlays
│   │   └── useDebounce.ts         # Debounce map pan/zoom events
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   └── server.ts          # Server-side Supabase client
│   │   ├── zillow.ts              # RapidAPI Zillow wrapper
│   │   ├── safety.ts              # Score computation logic
│   │   └── constants.ts           # Map defaults, score thresholds
│   │
│   └── types/
│       ├── listing.ts
│       ├── safety.ts
│       └── geo.ts
│
└── public/
    ├── favicon.ico
    └── marker-icons/              # Custom map pin SVGs by score band
        ├── pin-excellent.svg
        ├── pin-good.svg
        ├── pin-fair.svg
        ├── pin-caution.svg
        └── pin-high-risk.svg
```

---

## 6. Implementation Phases

---

### Phase 1 — Scaffold & Map

**Goal:** Next.js app with a full-screen Mapbox GL map centered on Harris County.

**Tasks:**
1. `npx create-next-app@latest canary-coast --typescript --tailwind --app --src-dir`
2. Install dependencies:
   ```bash
   npm install mapbox-gl @types/mapbox-gl
   npm install @supabase/supabase-js
   npm install @supabase/ssr          # for server-side Supabase in App Router
   ```
3. Create `src/lib/constants.ts`:
   ```typescript
   export const HARRIS_COUNTY_CENTER = { lng: -95.3698, lat: 29.7604 };
   export const HARRIS_COUNTY_BOUNDS = {
     sw: { lng: -95.95, lat: 29.45 },
     ne: { lng: -94.90, lat: 30.15 }
   };
   export const DEFAULT_ZOOM = 10;
   ```
4. Build `MapContainer.tsx`:
   - Initialize Mapbox GL with `mapbox://styles/mapbox/light-v11` (clean base for overlays).
   - Constrain to Harris County bounds.
   - Emit `onMoveEnd` with current bounding box (debounced 500ms).
5. Build `Header.tsx` with app title and layer toggle buttons.
6. Wire up `page.tsx` as a full-screen layout: header (fixed top) + map (fills remaining viewport).

**Deliverable:** A working Next.js app with a pannable/zoomable map of Harris County. No data yet.

---

### Phase 2 — Static Data Ingestion (One-Time Setup)

**Goal:** Populate Supabase with cancer and flood GIS data. These are **static reference datasets** — this phase runs once (or very rarely) and never at runtime.

**Pre-requisite:** Before Claude Code can build the ingestion scripts, you need to manually extract the ArcGIS service URL for the cancer data (see Section 2B above). Save it in `.env.local` as `ARCGIS_CANCER_SERVICE_URL`.

**Tasks:**

1. **Set up Supabase project:**
   - Create project at `supabase.com`.
   - Enable PostGIS: run `CREATE EXTENSION IF NOT EXISTS postgis;` in SQL editor.
   - Run migration files from `supabase/migrations/` in order.

2. **Build `scripts/utils/arcgis-client.ts`:**
   A generic paginated ArcGIS REST query function:
   ```typescript
   async function queryArcGIS(
     serviceUrl: string,
     layerId: number,
     where: string = '1=1',
     outFields: string = '*',
     pageSize: number = 2000
   ): Promise<GeoJSON.FeatureCollection> {
     // Paginate with resultOffset until all features fetched
     // Return merged GeoJSON FeatureCollection
   }
   ```

3. **Build `scripts/ingest-cancer-data.ts`:**
   - Reads `ARCGIS_CANCER_SERVICE_URL` from env (you extracted this manually from DevTools).
   - Queries each cancer type layer (the service likely has 16+ layers, one per cancer type).
   - For each layer, paginate through all census tract features.
   - Parse response, map fields to `census_tracts` table schema.
   - Upsert into Supabase using `supabase.from('census_tracts').upsert()`.
   - **This script runs once.** Re-run only when Harris County Public Health publishes a new study.

   **Fallback if Harris County service is private:** Query CDC PLACES instead:
   ```
   https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/
     PLACES_LocalData_for_BetterHealth/FeatureServer/2/query
     ?where=CountyFIPS='48201'&outFields=*&f=geojson
   ```

4. **Build `scripts/ingest-flood-zones.ts`:**
   - Query FEMA NFHL Layer 28 (Flood Hazard Zones):
     ```
     https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query
     ?where=DFIRM_ID LIKE '48201C%'
     &outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE
     &f=geojson
     &resultRecordCount=2000
     ```
   - Paginate (Harris County has thousands of flood zone polygons).
   - Important: simplify geometries before inserting (`ST_SimplifyPreserveTopology`) to keep Supabase responsive. Target ~500 vertices per polygon max.
   - Upsert into `flood_zones` table.
   - **This script runs once.** Re-run every 6–12 months or after a major FEMA LOMR.

5. **Build `scripts/ingest-census-tracts.ts`:**
   - Fetches census tract polygon geometry from HCPH ArcGIS FeatureServer (layer 17).
   - Uses HCPH as the geometry source for GEOID consistency (11-digit GEOIDs matching cancer data).
   - TIGERweb layer 8 was found to return block group GEOIDs (12-digit) — avoid it.
   - Normalizes `Polygon` → `MultiPolygon` to match the column type.
   - Upserts into `census_tracts` for geometry only (cancer SIR data added by ingest-cancer-data.ts).

6. **Build `scripts/ingest-hcph-cancer.ts` (census-tract-level cancer detail):**
   - Service URL is hardcoded (HCPH ArcGIS FeatureServer, no DevTools extraction needed).
   - Iterates HC_ layers 17–33 — one per cancer type, all Harris County census-tract level.
   - Upserts SIR, observed/expected counts, and 95% CI into `tract_cancer_data` using GEOID.
   - Tract geometry is already in `census_tracts` from step 5 — no separate geometry table needed.
   - Single source, single methodology, no mixing. **Runs once.**

7. **Run all ingestion scripts:**
   ```bash
   npx tsx scripts/ingest-census-tracts.ts
   npx tsx scripts/ingest-cancer-data.ts       # census_tracts SIR columns for safety score
   npx tsx scripts/ingest-hcph-cancer.ts       # tract_cancer_data for detail/comparison UI
   npx tsx scripts/ingest-flood-zones.ts
   ```

**Deliverable:** Supabase populated with ~1,115 census tracts (with cancer SIR data), ~18,955 rows in `tract_cancer_data` (17 cancer types per tract), and ~5,000+ flood zone polygons covering Harris County.

---

### Phase 3 — Listings Integration

**Goal:** Fetch Zillow listings for the visible map viewport and display as markers.

**Tasks:**

1. **Create RapidAPI account and subscribe to Real-Time Zillow Data API.**

2. **Build `src/lib/zillow.ts`:**
   ```typescript
   export async function searchListingsByCoordinates(
     bbox: BoundingBox,
     filters?: ListingFilters
   ): Promise<ZillowListing[]> {
     const res = await fetch('/api/listings?' + new URLSearchParams({
       lat_min: bbox.south.toString(),
       lat_max: bbox.north.toString(),
       lng_min: bbox.west.toString(),
       lng_max: bbox.east.toString(),
       status: 'ForSale',
       home_type: filters?.homeType || '',
     }));
     return res.json();
   }
   ```

3. **Build `src/app/api/listings/route.ts`:**
   ```typescript
   // Proxy to RapidAPI — keeps API key server-side
   // 1. Check Supabase cache first (search_cache table for matching bbox)
   // 2. If cache miss or expired, call RapidAPI
   // 3. Parse response, upsert listings into Supabase
   // 4. For each listing, call get_safety_at_point() to compute scores
   // 5. Return listings with scores
   ```

4. **Build `src/hooks/useMapListings.ts`:**
   - On map `moveend` (debounced 500ms), extract bounding box.
   - Call `/api/listings` with bbox.
   - Store results in React state.
   - Pass to `ListingMarkers` component.

5. **Build `ListingMarkers.tsx`:**
   - Add a Mapbox GL `GeoJSON` source with listings as points.
   - Use `circle` or `symbol` layer with color driven by `safety_score`:
     ```typescript
     'circle-color': [
       'interpolate', ['linear'], ['get', 'safety_score'],
       0, '#ef4444',    // red
       25, '#f97316',   // orange
       50, '#eab308',   // yellow
       75, '#84cc16',   // lime
       100, '#22c55e'   // green
     ]
     ```
   - On marker click, open `ListingDetail` drawer.

6. **Build `ListingPanel.tsx` + `ListingCard.tsx`:**
   - Sidebar (or bottom sheet on mobile) showing listing cards for visible markers.
   - Each card: thumbnail, price, beds/baths/sqft, SafetyBadge.
   - Click card → fly map to location + open detail.

**Deliverable:** Map shows colored listing pins; sidebar lists properties with safety scores.

---

### Phase 4 — Safety Score Engine

**Goal:** Compute and display safety scores with visual overlays.

**Tasks:**

1. **Build `src/lib/safety.ts`:**
   ```typescript
   export function computeSafetyScore(
     cancerSIR: number | null,
     floodRiskLevel: string | null
   ): { total: number; cancer: number; flood: number } {
     const cancerScore = cancerSIR != null
       ? clamp(0, 100, 100 - ((cancerSIR - 0.5) / 1.5) * 100)
       : 50; // default to neutral if no data
     
     const floodScoreMap: Record<string, number> = {
       minimal: 100,
       undetermined: 70,
       moderate: 40,
       high: 15,
       very_high: 0,
     };
     const floodScore = floodRiskLevel
       ? floodScoreMap[floodRiskLevel] ?? 50
       : 50;
     
     return {
       cancer: Math.round(cancerScore),
       flood: Math.round(floodScore),
       total: Math.round(cancerScore * 0.4 + floodScore * 0.6),
     };
   }
   ```

2. **Build `src/app/api/safety/route.ts`:**
   - Accepts `lat`, `lng` query params.
   - Calls Supabase RPC `get_safety_at_point(lat, lng)`.
   - Runs `computeSafetyScore()` on results.
   - Returns JSON with sub-scores + total.

3. **Build `scripts/compute-safety-scores.ts`:**
   - Batch job: for all listings in Supabase where `safety_score IS NULL`:
     - Call `get_safety_at_point()` for each.
     - Compute score, update listing row.
   - Can be run as a cron or manually after ingestion.

4. **Build `CancerOverlay.tsx`:**
   - Fetch census tract GeoJSON from Supabase (with simplified geometries for map rendering).
   - Add as a Mapbox `fill` layer with choropleth coloring by `cancer_sir_overall`:
     ```
     SIR < 0.8  → transparent green
     SIR 0.8–1.2 → transparent yellow
     SIR > 1.2  → transparent red
     ```
   - Toggle on/off via MapControls.

5. **Build `FloodOverlay.tsx`:**
   - Fetch flood zone GeoJSON from Supabase (simplified).
   - Add as Mapbox `fill` layer with colors by risk level:
     ```
     very_high → dark blue
     high → blue
     moderate → light blue
     minimal → transparent
     ```
   - Toggle on/off via MapControls.

6. **Build `SafetyBadge.tsx` + `SafetyBreakdown.tsx`:**
   - Circular badge with score number + color ring.
   - Breakdown shows two horizontal bars (cancer sub-score, flood sub-score).
   - Tooltip explains what each sub-score means.

7. **Build `ScoreLegend.tsx`:**
   - Fixed bottom-right overlay explaining the color scale.
   - Includes data source attribution (FEMA, Harris County Public Health / TX Cancer Registry).

8. **Build `CancerTrend.tsx` (cancer type comparison view):**
   - Accepts a census tract GEOID as prop (passed from the selected listing's `cancer_tract_geoid`).
   - Fetches from `tract_cancer_data` table (Supabase query, no external API call).
   - Renders a horizontal bar chart comparing SIR across all 17 cancer types for that tract.
   - Bars colored green (SIR < 0.8), yellow (0.8–1.2), red (> 1.2).
   - Reference line at SIR = 1.0 labeled "Texas Average".
   - Dropdown to highlight a specific cancer type.
   - All data sourced exclusively from HCPH / TX Cancer Registry — no mixing.

9. **Build `src/app/api/cancer/[geoid]/route.ts`:**
   - Returns all cancer type SIRs for a given census tract GEOID from `tract_cancer_data`.
   - Lightweight — just a Supabase query, no external calls.

10. **Add census tract choropleth overlay option to `MapControls.tsx`:**
    - New toggle: "Census Tract Cancer Risk" layer.
    - Fetches tract geometries from `census_tracts` in Supabase (with `cancer_sir_overall`).
    - Colors each tract by `cancer_sir_overall`.
    - On click, opens cancer detail chart in the detail panel.

**Deliverable:** Full safety scoring pipeline working end-to-end. Map shows colored overlays (cancer by zip code + flood zones) + colored listing pins. Detail view shows score breakdown and cancer type comparison or trend chart (depending on data availability).

---

### Phase 5 — UI & UX Polish

**Goal:** Production-quality interface, responsive design, error handling.

**Tasks:**

1. **Design direction:** Follow `docs/design/canary-coast-design-skill.md` — Editorial Minimalism + High-Contrast Fintech.
   - **Palette:** Twilight Indigo `#273A71` backgrounds, Emerald `#6DD799` for safe indicators, Fresh Sky `#3BADF6` for actions, Alice Blue `#D6DEE9` for text.
   - **Typography:** Fraunces (700–800) for headlines and oversized data metrics, Plus Jakarta Sans for body/nav/labels. Data numerals are the hero — 4–6rem, bold.
   - **Layout:** Asymmetrical grids, 2px hard borders, pill-shaped cards, perfect circle badges. No soft shadows, no gradients, no centered symmetric grids.
   - **Map:** Desaturated base tiles (`filter: saturate(0.4)`), Sapphire Sky `#3A70BA` overlays at 15–20% opacity for risk zones, circular Emerald markers for properties.
   - **Motion:** Staggered slide-up on load, heartbeat pulse on hover. One orchestrated moment, not scattered micro-interactions.
   - Claude Code should read the full design skill doc before building any component.

2. **ListingFilters.tsx:**
   - Price range slider (dual-thumb).
   - Bedroom/bathroom selectors.
   - Home type checkboxes (single family, condo, townhouse).
   - **Safety score minimum slider** (the killer feature — "only show me homes with score ≥ 60").
   - Sort by: price, safety score, newest.

3. **ListingDetail.tsx:**
   - Slide-out drawer (right side on desktop, bottom sheet on mobile).
   - Photo carousel at top.
   - Price, address, beds/baths/sqft/year.
   - Large SafetyBadge + SafetyBreakdown.
   - **CancerTrend chart** showing SIR trend or cancer-type breakdown for the listing's zip code.
   - Mini-map showing the property's census tract highlighted.
   - "View on Zillow" external link button.
   - Nearby comparable listings section.

4. **Mobile responsiveness:**
   - Map fills viewport on mobile.
   - Listing panel becomes a swipeable bottom sheet.
   - Filters in a modal triggered by FAB button.

5. **Loading states:**
   - Skeleton cards while listings load.
   - Map overlay shimmer while GIS data loads.
   - Progressive loading: show pins first, then fetch scores.

6. **Error handling:**
   - RapidAPI rate limit → show "too many searches, try again in X seconds."
   - Supabase connection error → retry with exponential backoff.
   - No listings in area → friendly empty state message.

7. **Data attribution footer:**
   - "Cancer data: Harris County Public Health / Texas Cancer Registry (DSHS)"
   - "Flood data: FEMA National Flood Hazard Layer"
   - "Listings: Zillow (unofficial)"
   - Disclaimer: "Safety scores are informational only. Consult professionals before making purchasing decisions."

---

### Phase 6 — Deploy & Optimize

**Goal:** Production deployment on Vercel with performance optimizations.

**Tasks:**

1. **Vercel deployment:**
   - Follow the detailed instructions in [GitHub Setup & Deployment (Section 8)](#8-github-setup--deployment).
   - **Summary:** Push code to GitHub, sign in to Vercel, authorize GitHub, import `canary-coast` repo, add environment variables, and deploy.
   - Add all environment variables in Vercel dashboard (do NOT commit `.env.local` to GitHub).
   - Set `vercel.json` for long-running API routes:
     ```json
     {
       "functions": {
         "src/app/api/**/*.ts": {
           "maxDuration": 30
         }
       }
     }
     ```
   - Enable automatic deployments: Preview on every PR, Production on `main` push.

2. **Performance optimizations:**
   - Mapbox vector tiles for overlay layers (instead of loading full GeoJSON).
   - Create a Supabase Edge Function to serve simplified GeoJSON at different zoom levels (fewer vertices at low zoom).
   - Listing cache: 24-hour TTL in Supabase, so repeated viewport queries don't hit RapidAPI.
   - Image optimization: use Next.js `<Image>` for Zillow photos.

3. **Supabase Row Level Security (optional for v1):**
   - Public read-only access to all tables via anon key.
   - Service role key only used in API routes and ingestion scripts.

4. **Monitoring:**
   - Vercel Analytics for page views and Web Vitals.
   - Track RapidAPI usage to stay within plan limits.
   - Supabase Dashboard for query performance.

5. **SEO / Meta:**
   - OpenGraph image with Houston map + safety heatmap preview.
   - Meta description: "Canary Coast — Harris County housing listings scored for cancer risk and flood zone danger."

---

## 7. Environment Variables

```bash
# .env.local (never commit)

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...    # server-side only

# RapidAPI (Zillow proxy)
RAPIDAPI_KEY=xxxxxxxxxx
RAPIDAPI_ZILLOW_HOST=real-time-zillow-data.p.rapidapi.com

# App Config
NEXT_PUBLIC_DEFAULT_CENTER_LAT=29.7604
NEXT_PUBLIC_DEFAULT_CENTER_LNG=-95.3698
LISTING_CACHE_TTL_HOURS=24
```

---

## 8. GitHub Setup & Deployment

**Goal:** Initialize version control, push to GitHub, and connect to Vercel for automated deployments.

### 8A. Local Git Initialization

**Prerequisites:** Git installed locally, GitHub account created.

**Tasks:**

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `canary-coast`
   - Description: "A map-based web app overlaying Harris County housing listings with environmental safety scores"
   - Visibility: **Public** (required for Vercel free tier, unless using pro)
   - Do NOT initialize with README, .gitignore, or license (you'll add these locally)
   - Click "Create repository"

2. **Initialize local Git and push initial commit:**
   ```bash
   cd ~/path/to/canary-coast-repo
   git init
   git add .
   git commit -m "Initial commit: project scaffold, design system, build plan"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/canary-coast.git
   git push -u origin main
   ```
   Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

3. **Create `.gitignore` (should already be in Next.js template):**
   ```
   # Dependencies
   node_modules/
   .pnp
   .pnp.js

   # Testing
   coverage/

   # Next.js
   .next/
   out/

   # Environment variables
   .env.local
   .env.*.local

   # IDE
   .vscode/
   .idea/
   *.swp
   *.swo

   # OS
   .DS_Store
   Thumbs.db

   # Build
   dist/
   build/
   ```
   Commit:
   ```bash
   git add .gitignore
   git commit -m "Add .gitignore"
   git push
   ```

### 8B. Branch Strategy

**Main branches:**
- `main` — Production-ready code. Protected branch; requires PR review before merge.
- `develop` — Integration branch for features. Merges into `main` after testing.

**Feature branches:**
- Pattern: `feature/name-of-feature` (e.g., `feature/map-overlay`, `feature/cancer-data-ingest`)
- Branch from: `develop`
- Merge back to: `develop` (via pull request)

**Bugfix branches:**
- Pattern: `bugfix/name-of-bug` (e.g., `bugfix/mapbox-load-error`)
- Branch from: `develop` or `main` (if critical)
- Merge back to: `develop` or `main`

**Quick setup:**
```bash
git checkout -b develop
git push -u origin develop
```

### 8C. GitHub Protection Rules (Optional but Recommended)

In your GitHub repo settings:
1. Go to **Settings** → **Branches** → **Branch protection rules**.
2. Add a rule for `main`:
   - Require pull request reviews before merging: ✓ (1 review minimum)
   - Dismiss stale pull request approvals: ✓
   - Require status checks to pass before merging: ✓ (once CI/CD is set up)
   - Require branches to be up to date before merging: ✓
3. Add a rule for `develop` (looser, but still require 1 review for merge commits).

### 8D. Connect to Vercel

**Prerequisites:** Vercel account created (free tier is fine).

**Tasks:**

1. **Sign in to Vercel:**
   - Go to https://vercel.com and sign in (or create account).
   - Use "Sign in with GitHub" for seamless integration.

2. **Import your GitHub repo:**
   - Click **Add New** → **Project**.
   - Select your GitHub account (or authorize Vercel to access GitHub).
   - Search for and click on `canary-coast` repository.
   - Vercel will auto-detect Next.js framework.

3. **Configure environment variables in Vercel:**
   - In the import dialog, add all variables from `.env.local`:
     ```
     NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
     RAPIDAPI_KEY=xxxxxxxxxx
     RAPIDAPI_ZILLOW_HOST=real-time-zillow-data.p.rapidapi.com
     NEXT_PUBLIC_DEFAULT_CENTER_LAT=29.7604
     NEXT_PUBLIC_DEFAULT_CENTER_LNG=-95.3698
     LISTING_CACHE_TTL_HOURS=24
     ```
   - **Important:** Do NOT commit `.env.local` to GitHub. Vercel reads these from the dashboard only.

4. **Deploy:**
   - Click **Deploy**.
   - Vercel will build and deploy from `main` branch.
   - You'll get a live URL (e.g., `canary-coast.vercel.app`).

5. **Set up automatic deployments:**
   - In Vercel project settings → **Git**, enable:
     - **Preview Deployments:** Enabled (automatic on every PR)
     - **Production Deployments:** `main` branch only
   - Now every push to `main` triggers a production build. Every PR creates a preview deployment.

### 8E. Continuous Deployment Workflow

**Day-to-day development:**
```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Make changes, commit locally
git add src/components/MyComponent.tsx
git commit -m "Add MyComponent with Editorial Minimalism styling"

# Push and open PR
git push origin feature/my-feature
# Go to GitHub → create Pull Request against `develop`

# After review/approval, merge PR on GitHub
# Then locally:
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0    # Or merge develop → main for production release
```

**Merging to production:**
```bash
# When develop is stable and tested:
git checkout main
git pull origin main
git merge develop --no-ff -m "Merge develop → main: Phase 1 complete"
git push origin main
# Vercel automatically deploys to canary-coast.vercel.app
```

### 8F. Rollback (if needed)

If production breaks:
```bash
# Revert the last commit on main
git checkout main
git revert HEAD
git push origin main
# Vercel redeploys immediately with the reverted state
```

---

## 9. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Zillow RapidAPI shuts down / changes** | No listing data | Abstract behind `zillow.ts` interface; swap to alternative provider (apimaker, Zillow Working API). Consider ATTOM or Mashvisor as paid alternatives. |
| **Harris County cancer service is auth-gated** | Can't get tract-level cancer data | Fall back to CDC PLACES (census tract level, nationwide, public API). Lower granularity but still usable. |
| **FEMA NFHL query limits** | Can't ingest all flood polygons | Paginate aggressively (resultOffset). Alternative: download full county NFHL shapefile from FEMA Map Service Center and convert locally. |
| **Supabase PostGIS performance on large polygon queries** | Slow safety lookups | Add spatial indexes (already in schema). Simplify geometries on ingest. Consider materializing safety scores in a lookup table by census tract. |
| **RapidAPI rate limits (free tier = 50/mo)** | Users exhaust quota quickly | Aggressive caching in Supabase. Upgrade to paid plan ($10/mo for 500 requests). Serve cached data beyond TTL with a "data may be stale" indicator. |
| **Mapbox costs at scale** | Map tiles have usage limits | Free tier = 50K map loads/mo (generous for a side project). Monitor via Mapbox dashboard. |

---

## 10. Future Enhancements

- **User accounts** (Supabase Auth): save favorite listings, get alerts when safety scores change.
- **Historical flood events overlay**: Harvey inundation data from Harris County Flood Control District.
- **EPA Toxics Release Inventory (TRI)**: nearby industrial pollution sources as another safety factor.
- **School ratings layer**: GreatSchools API integration.
- **Air quality index**: EPA AirNow API for real-time AQI.
- **Commute time heatmap**: Mapbox Isochrone API showing drive/transit time to a workplace.
- **Comparative view**: side-by-side comparison of 2–3 listings with radar chart of safety dimensions.
- **Push notifications**: "New listing in your preferred area with safety score ≥ 80."
- **Expanded geography**: Expand beyond Harris County to Fort Bend, Montgomery, Galveston counties.
