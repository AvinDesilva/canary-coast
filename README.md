# Canary Coast

A map-based web app overlaying Harris County housing listings with environmental safety scores — helping renters and buyers understand flood risk and cancer prevalence before committing to a property.

Each property is scored on two dimensions:

```
Composite = (Cancer Risk × 0.4) + (Flood Risk × 0.6)
```

Tiers: **Safe** (0–30) · **Moderate** (31–69) · **High Risk** (70–100)

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

## Status

Active development. Completed: scaffold & map, data ingestion, Rentcast integration, safety score engine, UI/UX polish.
