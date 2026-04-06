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

## Exploration Guidance

Skip during codebase exploration (low signal-to-token ratio):
- `src/types/generated/` — auto-generated Supabase types (~1,660 lines). Only consumers: `src/lib/supabase/client.ts` and `server.ts`.
- `src/__fixtures__/` — JSON mock/demo data. Only used in demo mode (no Supabase URL configured).
- `docs/` — historical build plan and design spec. Only read `docs/design/canary-coast-design-skill.md` before UI work.
- `scripts/` — one-time data ingestion scripts, not part of the runtime application.

Essential files to read first:
- `CLAUDE.md` (this file)
- `src/lib/constants.ts` — shared constants, scoring tables, enums
- `src/lib/safety.ts` — safety score algorithm
- `src/types/listing.ts`, `safety.ts`, `air-quality.ts`, `geo.ts` — hand-written types (129 lines total)

## Architecture

Data flow: `Frontend → Supabase PostGIS → API Routes (Vercel Functions) → Rentcast / ArcGIS`

**Key decisions:**
- All spatial queries (point-in-polygon, census tract lookup) run in Supabase PostGIS — no client-side GIS
- Rentcast calls always proxied through `/api/listings` and `/api/property` — API key never exposed to client
- Listing results cached 7 days in Supabase; area cache prevents redundant API calls (50 req/month free tier)
- Address lookup via `/api/property` uses Rentcast `/v1/properties` for any property regardless of listing status

**Supabase tables:** `listings`, `search_cache`, `cancer_prevalence`, `flood_zones`, `census_tracts`, `safety_scores`
All geometry columns have GiST spatial indexes. See `docs/CANARY_COAST_BUILD_PLAN-2.md` §3 for full schema.

## Safety Score Algorithm

`Composite = (Cancer Risk × 0.4) + (Flood Risk × 0.6)` — all scores 0–100

- **Cancer Risk:** `min(SIR / 2.0, 1.0) × 100` (SIR from census tract)
- **Flood Risk:** 0 = none, 50 = 500-yr zone, 100 = 100-yr zone
- **Display:** Safe (0–30), Moderate (31–69), High Risk (70–100)

## Design System

**Editorial Minimalism + High-Contrast Fintech** aesthetic. Always review `docs/design/canary-coast-design-skill.md` before building UI.

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

## Supabase CLI Workflow

Supabase CLI is installed at `/usr/local/bin/supabase` and linked to project ref `fqazzecpgzqzfsaehwtl`.
Docker Desktop must be running for local stack commands.

```bash
supabase start                                                        # Start local stack (required for db diff)
supabase stop                                                         # Stop local stack

supabase migration new <name>                                         # Create a new migration file
supabase db diff                                                      # Diff local schema vs migrations (requires supabase start)
supabase db push                                                      # Push local migrations to remote
supabase db pull                                                      # Pull remote schema changes

supabase gen types typescript --linked > src/types/generated/database.ts  # Regenerate TypeScript types from live DB
```

**TypeScript types:** `src/types/generated/database.ts` is auto-generated — do not edit manually. Regenerate after any schema change.
Both Supabase clients (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`) are typed with `Database`.

**Migration naming:** Files in `supabase/migrations/` must have unique numeric prefixes (e.g. `001_`, `002_`). Duplicate prefixes cause `db diff` to fail.

## Data Pipeline

Environmental data is ingested once via `scripts/ingest-*.ts` and stored in Supabase:
1. **Census Tracts** — geometry from Census TIGER/Line into `census_tracts`
2. **Cancer Prevalence** — SIR data from Harris County Public Health, joined to tracts via FIPS, stored in `cancer_prevalence`
3. **Flood Zones** — FEMA NFHL polygons from ArcGIS Feature Services into `flood_zones`
4. **Safety Scores** — pre-computed per census tract into `safety_scores`; point lookups use PostGIS `ST_Within`

All geometry columns have GiST spatial indexes. Ingestion scripts are idempotent.

## References

- **Schema Reference:** `docs/CANARY_COAST_BUILD_PLAN-2.md` — Supabase schema (§3), risks, future enhancements. Archived full original at `docs/archive/`.
- **Design System:** `docs/design/canary-coast-design-skill.md` — colors, typography, component patterns
