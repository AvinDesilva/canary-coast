-- ============================================================
-- Migration 005: Rentcast API migration
-- Replaces Zillow/RapidAPI integration with Rentcast API
-- ============================================================

-- Rename zpid to external_id (provider-agnostic)
ALTER TABLE listings RENAME COLUMN zpid TO external_id;

-- Drop Zillow-only columns
ALTER TABLE listings DROP COLUMN IF EXISTS zestimate;
ALTER TABLE listings DROP COLUMN IF EXISTS rent_zestimate;
ALTER TABLE listings DROP COLUMN IF EXISTS primary_photo_url;
ALTER TABLE listings DROP COLUMN IF EXISTS photo_urls;
ALTER TABLE listings DROP COLUMN IF EXISTS listing_url;

-- Add Rentcast-specific columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listed_date TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mls_name TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_agent_name TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_office_name TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS county TEXT;

-- Flush stale Zillow-cached data (IDs are incompatible)
TRUNCATE listings;

-- ============================================================
-- search_cache: tracks searched geographic areas to avoid
-- redundant Rentcast API calls (50 req/month free tier)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bbox GEOMETRY(Polygon, 4326) NOT NULL,
  listing_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_search_cache_bbox ON search_cache USING GIST(bbox);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);
