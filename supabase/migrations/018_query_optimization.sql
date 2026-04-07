-- ============================================================
-- Migration 018: Query optimization
-- ============================================================
-- Adds composite/partial indexes for high-volume queries,
-- fixes missing STABLE volatility markers on read-only functions,
-- adds partial indexes for GeoJSON WHERE clauses, drops dead code,
-- and refreshes planner statistics.

-- ----- 1. Composite partial index for get_listings_in_bbox -----
-- get_listings_in_bbox filters on listing_status + expires_at after a GIST
-- spatial scan. Single-column indexes on each can't be combined efficiently.
-- This composite partial index enables BitmapAnd with the GIST point index.
CREATE INDEX IF NOT EXISTS idx_listings_status_expires
  ON listings (listing_status, expires_at)
  WHERE listing_status = 'FOR_SALE';

-- Drop the now-redundant standalone status index (covered by the composite above)
DROP INDEX IF EXISTS idx_listings_status;

-- ----- 2. Function volatility fixes -----
-- These functions only read data and return consistent results within a
-- statement. Marking them STABLE lets the planner optimise them correctly.
-- (get_safety_at_points, is_area_cached, get_api_usage, and all GeoJSON
-- functions are already STABLE — no change needed for those.)

ALTER FUNCTION get_safety_at_point(NUMERIC, NUMERIC) STABLE;
ALTER FUNCTION get_historical_flood_at_point(NUMERIC, NUMERIC) STABLE;
ALTER FUNCTION get_listings_in_bbox(NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, NUMERIC) STABLE;

-- ----- 3. Partial indexes for GeoJSON filter clauses -----
-- get_cancer_geojson filters WHERE geometry IS NOT NULL.
-- get_historical_flood_geojson filters WHERE geometry IS NOT NULL AND flood_event_count > 0.
-- These indexes let the planner skip excluded rows before the expensive
-- ST_SimplifyPreserveTopology + ST_AsGeoJSON processing.

CREATE INDEX IF NOT EXISTS idx_tracts_cancer_sir_not_null
  ON census_tracts (cancer_sir_overall)
  WHERE cancer_sir_overall IS NOT NULL AND geometry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracts_flood_event_positive
  ON census_tracts (flood_event_count)
  WHERE flood_event_count > 0 AND geometry IS NOT NULL;

-- ----- 4. Dead code cleanup -----
-- get_cancer_trend is defined in migration 003 but never called from any
-- application code. tract_cancer_data is kept (ingestion script populates it).
DROP FUNCTION IF EXISTS get_cancer_trend(TEXT, TEXT);

-- zip_geometries has a GIST index and RLS policy but no reads, writes, or
-- references anywhere in app code or ingestion scripts.
DROP TABLE IF EXISTS zip_geometries CASCADE;

-- Document tract_cancer_data status for future developers.
COMMENT ON TABLE tract_cancer_data IS
  'Per-type cancer SIR data by census tract. Populated by ingest-hcph-cancer.ts. '
  'Not currently consumed by application code — retained for future per-cancer-type trend features.';

-- ----- 5. Refresh planner statistics -----
-- Ensures the query planner has accurate row counts and column statistics
-- after the index changes above.
ANALYZE census_tracts;
ANALYZE flood_zones;
ANALYZE listings;
ANALYZE search_cache;
ANALYZE pollutant_facilities;
ANALYZE zip_cancer_data;
ANALYZE tract_cancer_data;
