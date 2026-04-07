-- Simplify GeoJSON export functions to avoid statement timeouts.
--
-- Census tract and flood zone geometries from TIGER/Line and FEMA NFHL
-- have high vertex counts suited for precision analysis, not screen rendering.
-- ST_SimplifyPreserveTopology at 0.001 degrees (~111m) reduces payload size
-- dramatically while keeping polygons visually accurate at county zoom levels.
--
-- Historical flood function also filters to flood_event_count > 0, eliminating
-- tracts with no flood history from the overlay payload.

-- Replace get_flood_geojson with simplified geometry
CREATE OR REPLACE FUNCTION get_flood_geojson()
RETURNS json AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'fld_zone', fld_zone,
          'risk_level', risk_level,
          'sfha_tf', sfha_tf
        ),
        'geometry', ST_AsGeoJSON(
          ST_SimplifyPreserveTopology(geometry, 0.001)
        )::json
      )
    ), '[]'::json)
  )
  FROM flood_zones;
$$ LANGUAGE sql STABLE;

-- Replace get_cancer_geojson with simplified geometry (preserves all per-type
-- SIR columns added in migration 008 — required by CancerOverlay paint expression)
CREATE OR REPLACE FUNCTION get_cancer_geojson()
RETURNS json AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'geoid',               geoid,
          'cancer_sir_overall',  cancer_sir_overall,
          'cancer_sir_brain',    cancer_sir_brain,
          'cancer_sir_lung',     cancer_sir_lung,
          'cancer_sir_breast',   cancer_sir_breast,
          'cancer_sir_prostate', cancer_sir_prostate,
          'cancer_sir_colon',    cancer_sir_colon
        ),
        'geometry', ST_AsGeoJSON(
          ST_SimplifyPreserveTopology(geometry, 0.001)
        )::json
      )
    ), '[]'::json)
  )
  FROM census_tracts
  WHERE geometry IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Replace get_historical_flood_geojson: simplified geometry + filter to
-- affected tracts only (flood_event_count > 0)
CREATE OR REPLACE FUNCTION get_historical_flood_geojson()
RETURNS json AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'geoid', geoid,
          'flood_event_count', COALESCE(flood_event_count, 0),
          'flood_total_structures', COALESCE(flood_total_structures, 0),
          'flood_harvey', COALESCE(flood_harvey, 0),
          'flood_imelda', COALESCE(flood_imelda, 0),
          'flood_tax_day', COALESCE(flood_tax_day, 0),
          'flood_memorial_day', COALESCE(flood_memorial_day, 0),
          'flood_allison', COALESCE(flood_allison, 0)
        ),
        'geometry', ST_AsGeoJSON(
          ST_SimplifyPreserveTopology(geometry, 0.001)
        )::json
      )
    ), '[]'::json)
  )
  FROM census_tracts
  WHERE geometry IS NOT NULL
    AND COALESCE(flood_event_count, 0) > 0;
$$ LANGUAGE sql STABLE;
