-- Get safety data for a lat/lng point
CREATE OR REPLACE FUNCTION get_safety_at_point(
  lat NUMERIC, lng NUMERIC
) RETURNS TABLE(
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  cancer_prevalence NUMERIC,
  flood_zone TEXT,
  flood_risk TEXT
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
    fz.risk_level
  FROM
    (SELECT geoid, cancer_sir_overall, cancer_prevalence_pct
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

-- Get listings within bounding box with safety scores
CREATE OR REPLACE FUNCTION get_listings_in_bbox(
  lat_min NUMERIC, lng_min NUMERIC,
  lat_max NUMERIC, lng_max NUMERIC,
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 999999999,
  min_safety NUMERIC DEFAULT 0
) RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  WHERE ST_Within(
    l.point,
    ST_MakeEnvelope(lng_min, lat_min, lng_max, lat_max, 4326)
  )
  AND l.price BETWEEN price_min AND price_max
  AND (l.safety_score >= min_safety OR l.safety_score IS NULL)
  AND l.listing_status = 'FOR_SALE'
  AND l.expires_at > NOW()
  ORDER BY l.safety_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Get cancer data by census tract GEOID
DROP FUNCTION IF EXISTS get_cancer_trend(text, text);

CREATE OR REPLACE FUNCTION get_cancer_trend(
  target_geoid TEXT,
  target_cancer_type TEXT DEFAULT 'all'
) RETURNS TABLE(
  year_start INTEGER,
  year_end INTEGER,
  sir NUMERIC,
  confidence_low NUMERIC,
  confidence_high NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.year_start, d.year_end, d.sir, d.confidence_low, d.confidence_high
  FROM tract_cancer_data d
  WHERE d.tract_geoid = target_geoid
    AND d.cancer_type = target_cancer_type
  ORDER BY d.year_start ASC;
END;
$$ LANGUAGE plpgsql;
