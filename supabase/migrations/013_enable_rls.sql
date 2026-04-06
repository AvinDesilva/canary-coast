-- ============================================================
-- Migration 013: Enable Row Level Security on all public tables
-- ============================================================
-- All application writes/reads use the service role key which
-- bypasses RLS. Policies below control direct PostgREST access
-- via the anon / authenticated roles.
--
-- Strategy:
--   • Operational/cache tables  → RLS enabled, no policies
--     (blocks all anon access; service role still bypasses)
--   • Public reference data     → RLS enabled + anon SELECT
--     (census, flood, cancer, facilities — all sourced from
--     openly published government / EPA datasets)
-- ============================================================

-- -------------------------------------------------------
-- Operational / internal tables — no direct client access
-- -------------------------------------------------------

ALTER TABLE public.listings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_history_cache ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- Public reference / environmental data — anon read OK
-- -------------------------------------------------------

ALTER TABLE public.census_tracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.census_tracts
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.flood_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.flood_zones
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.zip_cancer_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.zip_cancer_data
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.zip_geometries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.zip_geometries
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.tract_cancer_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.tract_cancer_data
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.pollutant_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select" ON public.pollutant_facilities
  FOR SELECT TO anon, authenticated USING (true);

-- NOTE: spatial_ref_sys is owned by the PostGIS extension and cannot be
-- altered by the application role. It is a read-only reference table and
-- cannot be written to by any role, so the risk is minimal. The Supabase
-- linter will continue to flag it; no mitigation is possible without
-- superuser access.
