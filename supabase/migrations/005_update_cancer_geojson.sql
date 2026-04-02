-- Expand cancer GeoJSON to include per-type SIR columns so the client can
-- switch cancer type without re-fetching.
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
  WHERE geometry IS NOT NULL;
$$ LANGUAGE sql STABLE;
