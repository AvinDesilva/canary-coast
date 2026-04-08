# Canary Coast

**[canary-coast.vercel.app](https://canary-coast.vercel.app)**

A map-based web app overlaying Harris County housing listings with environmental safety scores — helping renters and buyers understand flood risk and cancer prevalence before committing to a property.

Each property is scored on two dimensions:

```
Composite = (Cancer Risk × 0.4) + (Flood Risk × 0.6)
```

Tiers: **Safe** (0–30) · **Moderate** (31–69) · **High Risk** (70–100)

---

## Features

- Interactive Mapbox map with live Rentcast listings for Harris County
- FEMA flood zone overlay (100-yr / 500-yr zones)
- Cancer incidence overlay by census tract (Harris County Public Health / TX Cancer Registry)
- Air quality layer (PurpleAir, EPA-corrected PM2.5)
- Historical flood events overlay (HCFCD MAAPnext, 1977–2019)
- Industrial facilities overlay
- Price change flagging — listings with significant price drops are marked with an exclamation pin and severity badge (Medium / High / Critical)
- Mobile-responsive layout with Zillow-style map UX

---

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_MAPBOX_TOKEN, Supabase keys, RENTCAST_API_KEY

npm install
npm run dev
# → http://localhost:3000
```

See [CLAUDE.md](./CLAUDE.md) for full architecture, environment variables, Supabase CLI workflow, and development conventions.

---

## Stack

Next.js · TypeScript · Tailwind CSS · Mapbox GL JS · Supabase (PostgreSQL + PostGIS) · Vercel
