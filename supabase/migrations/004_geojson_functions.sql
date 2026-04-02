-- Serve flood zones as a GeoJSON FeatureCollection for map overlays
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
        'geometry', ST_AsGeoJSON(geometry)::json
      )
    ), '[]'::json)
  )
  FROM flood_zones;
$$ LANGUAGE sql STABLE;

-- Serve census tracts as a GeoJSON FeatureCollection for cancer overlay
CREATE OR REPLACE FUNCTION get_cancer_geojson()
RETURNS json AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'geoid', geoid,
          'cancer_sir', cancer_sir_overall,
          'cancer_prevalence', cancer_prevalence_pct
        ),
        'geometry', ST_AsGeoJSON(geometry)::json
      )
    ), '[]'::json)
  )
  FROM census_tracts
  WHERE geometry IS NOT NULL;
$$ LANGUAGE sql STABLE;
