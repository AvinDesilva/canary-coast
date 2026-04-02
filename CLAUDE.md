# CLAUDE.md

## Project Overview

**Canary Coast** — map-based web app overlaying Harris County housing listings with environmental safety scores.
- Cancer prevalence data (Harris County Public Health): 40% weight
- FEMA flood zone risk: 60% weight

## Tech Stack

- **Frontend:** Next.js (App Router) + React 18 + TypeScript + Tailwind CSS
- **Mapping:** Mapbox GL JS (use `mapbox-gl`, not `react-map-gl`)
- **Backend/DB:** Supabase (PostgreSQL + PostGIS)
- **Deployment:** Vercel
- **External APIs:** Rentcast API, ArcGIS Feature Services

## Architecture

Data flow: `Frontend → Supabase PostGIS → API Routes (Vercel Functions) → Rentcast / ArcGIS`

**Key decisions:**
- All spatial queries (point-in-polygon, census tract lookup) run in Supabase PostGIS — no client-side GIS
- Rentcast calls always proxied through `/api/listings` and `/api/property` — API key never exposed to client
- Listing results cached 7 days in Supabase; area cache prevents redundant API calls (50 req/month free tier)
- Address lookup via `/api/property` uses Rentcast `/v1/properties` for any property regardless of listing status

**Supabase tables:** `listings`, `search_cache`, `cancer_prevalence`, `flood_zones`, `census_tracts`, `safety_scores`
All geometry columns have GiST spatial indexes. See `CANARY_COAST_BUILD_PLAN-2.md` §3 for full schema.

## Safety Score Algorithm

`Composite = (Cancer Risk × 0.4) + (Flood Risk × 0.6)` — all scores 0–100

- **Cancer Risk:** `min(SIR / 2.0, 1.0) × 100` (SIR from census tract)
- **Flood Risk:** 0 = none, 50 = 500-yr zone, 100 = 100-yr zone
- **Display:** Safe (0–30), Moderate (31–69), High Risk (70–100)

## Design System

**Editorial Minimalism + High-Contrast Fintech** aesthetic. Always review `canary-coast-design-skill.md` before building UI.

**Color variables (never hardcode hex):**
```css
--color-twilight-indigo: #273A71;  /* Primary background */
--color-dusk-blue: #3358A3;        /* Secondary containers */
--color-sapphire-sky: #3A70BA;     /* Borders, map overlays */
--color-fresh-sky: #3BADF6;        /* Buttons, CTAs */
--color-emerald: #6DD799;          /* Safe status, active */
--color-alice-blue: #D6DEE9;       /* Primary text on dark */
```

**Typography:** Fraunces (700–800) for headlines/data; Plus Jakarta Sans for body/nav.
**Reject:** soft shadows, centered grids, pastel palettes, generic SaaS aesthetics.

## Environment Variables (`.env.local` — never commit)

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # server-side only
RENTCAST_API_KEY=xxxxxxxxxx
RENTCAST_MONTHLY_LIMIT=45
NEXT_PUBLIC_DEFAULT_CENTER_LAT=29.7604
NEXT_PUBLIC_DEFAULT_CENTER_LNG=-95.3698
LISTING_CACHE_TTL_HOURS=168
```

Add all vars to Vercel dashboard before deploying.

## Common Commands

```bash
npm install      # Install dependencies
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Lint TypeScript
npm test -- path/to/test.test.ts
```

Data ingestion scripts: `scripts/ingest-*.ts` (one-time setup for census, cancer, flood data).

## Development Phases

1. Scaffold & Map — Next.js + Mapbox
2. Data Ingestion — cancer, flood, census → Supabase
3. Listings Integration — Rentcast API + caching
4. Safety Score Engine — calculation + storage
5. UI/UX Polish — design system, accessibility
6. Deploy & Optimize — Vercel, performance, monitoring

**Branches:** `main` (production, PR required) → `develop` (integration) → `feature/*`

## References

- **Build Plan:** `CANARY_COAST_BUILD_PLAN-2.md` — full schema, phases, data sources, deployment
- **Design System:** `canary-coast-design-skill.md` — colors, typography, component patterns
