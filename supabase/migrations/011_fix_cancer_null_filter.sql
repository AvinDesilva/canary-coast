-- Restore the null-SIR filter that was dropped in migration 008.
-- Migration 008 added per-type SIR columns but accidentally removed the
-- WHERE cancer_sir_overall IS NOT NULL guard introduced in migration 007.
-- Without this filter, tracts with no ingested cancer data are returned with
-- all-null SIR values, which renders as a uniform fallback colour instead of
-- triggering the API route's mock-data fallback.
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
        'geometry', ST_AsGeoJSON(geometry)::json
      )
    ), '[]'::json)
  )
  FROM census_tracts
  WHERE geometry IS NOT NULL
    AND cancer_sir_overall IS NOT NULL;
$$ LANGUAGE sql STABLE;
