-- Add historical flood data columns to census_tracts.
-- Data sourced from HCFCD Historical_Flooding FeatureServer (MAAPnext program).
-- Columns store structure counts per event (0 = not affected by that event).

ALTER TABLE census_tracts
  ADD COLUMN IF NOT EXISTS flood_event_count SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_total_structures INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_harvey INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_imelda INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_tax_day INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_memorial_day INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flood_allison INTEGER DEFAULT 0;

-- Update get_safety_at_point to also return flood_event_count from census_tracts
DROP FUNCTION IF EXISTS get_safety_at_point(NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION get_safety_at_point(
  lat NUMERIC, lng NUMERIC
) RETURNS TABLE(
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  cancer_prevalence NUMERIC,
  flood_zone TEXT,
  flood_risk TEXT,
  flood_event_count SMALLINT
) AS $$
DECLARE
  pt GEOMETRY := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
BEGIN
  RETURN QUERY
  SELECT
    ct.geoid,
    ct.cancer_sir_overall,
    ct.cancer_prevalence_pct,
    fz.fld_zone,
    fz.risk_level,
    COALESCE(ct.flood_event_count, 0)
  FROM
    (SELECT geoid, cancer_sir_overall, cancer_prevalence_pct, flood_event_count
     FROM census_tracts
     WHERE ST_Contains(geometry, pt)
     LIMIT 1) ct
  FULL OUTER JOIN
    (SELECT fld_zone, risk_level
     FROM flood_zones
     WHERE ST_Contains(geometry, pt)
     ORDER BY
       CASE risk_level
         WHEN 'very_high' THEN 1
         WHEN 'high' THEN 2
         WHEN 'moderate' THEN 3
         ELSE 4
       END
     LIMIT 1) fz ON TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update batch function to also return flood_event_count
DROP FUNCTION IF EXISTS get_safety_at_points(NUMERIC[], NUMERIC[]);

CREATE OR REPLACE FUNCTION get_safety_at_points(
  lats NUMERIC[], lngs NUMERIC[]
) RETURNS TABLE(
  idx INTEGER,
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  cancer_prevalence NUMERIC,
  flood_zone TEXT,
  flood_risk TEXT,
  flood_event_count SMALLINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pts.idx::INTEGER,
    ct.geoid,
    ct.cancer_sir_overall,
    ct.cancer_prevalence_pct,
    fz.fld_zone,
    fz.risk_level,
    COALESCE(ct.flood_event_count, 0)
  FROM unnest(lats, lngs) WITH ORDINALITY AS pts(lat, lng, idx)
  LEFT JOIN LATERAL (
    SELECT c.geoid, c.cancer_sir_overall, c.cancer_prevalence_pct, c.flood_event_count
    FROM census_tracts c
    WHERE ST_Contains(c.geometry, ST_SetSRID(ST_MakePoint(pts.lng, pts.lat), 4326))
    LIMIT 1
  ) ct ON TRUE
  LEFT JOIN LATERAL (
    SELECT f.fld_zone, f.risk_level
    FROM flood_zones f
    WHERE ST_Contains(f.geometry, ST_SetSRID(ST_MakePoint(pts.lng, pts.lat), 4326))
    ORDER BY
      CASE f.risk_level
        WHEN 'very_high' THEN 1
        WHEN 'high' THEN 2
        WHEN 'moderate' THEN 3
        ELSE 4
      END
    LIMIT 1
  ) fz ON TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Point lookup for historical flood data at a lat/lng
CREATE OR REPLACE FUNCTION get_historical_flood_at_point(
  lat NUMERIC, lng NUMERIC
) RETURNS TABLE(
  flood_event_count SMALLINT,
  flood_total_structures INTEGER,
  flood_harvey INTEGER,
  flood_imelda INTEGER,
  flood_tax_day INTEGER,
  flood_memorial_day INTEGER,
  flood_allison INTEGER
) AS $$
DECLARE
  pt GEOMETRY := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ct.flood_event_count, 0),
    COALESCE(ct.flood_total_structures, 0),
    COALESCE(ct.flood_harvey, 0),
    COALESCE(ct.flood_imelda, 0),
    COALESCE(ct.flood_tax_day, 0),
    COALESCE(ct.flood_memorial_day, 0),
    COALESCE(ct.flood_allison, 0)
  FROM census_tracts ct
  WHERE ST_Contains(ct.geometry, pt)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- GeoJSON function for the historical flood overlay
-- Returns census tracts with flood event counts for choropleth rendering
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
        'geometry', ST_AsGeoJSON(geometry)::json
      )
    ), '[]'::json)
  )
  FROM census_tracts
  WHERE geometry IS NOT NULL;
$$ LANGUAGE sql STABLE;
