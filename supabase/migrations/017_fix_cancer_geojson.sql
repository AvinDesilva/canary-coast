-- Restore per-type SIR columns in get_cancer_geojson.
-- Migration 016 accidentally used the pre-008 field names (cancer_sir,
-- cancer_prevalence) instead of the per-type columns required by CancerOverlay.
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
