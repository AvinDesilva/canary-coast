-- Fix get_cancer_geojson to exclude tracts with no cancer SIR data.
-- Previously the function returned all census tracts with geometry, including
-- those where ingest-cancer-data.ts hasn't been run yet — producing all-null
-- properties that caused Mapbox interpolation errors and uniform coloring.
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
