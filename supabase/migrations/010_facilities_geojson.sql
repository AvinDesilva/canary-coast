-- Serve pollutant facilities as a GeoJSON FeatureCollection for map overlays
CREATE OR REPLACE FUNCTION get_facilities_geojson()
RETURNS json AS $$
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(json_agg(
      json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
          'name', site_name,
          'category', category,
          'total_emissions', total_emissions
        ),
        'geometry', ST_AsGeoJSON(point)::json
      )
    ), '[]'::json)
  )
  FROM pollutant_facilities;
$$ LANGUAGE sql STABLE;
