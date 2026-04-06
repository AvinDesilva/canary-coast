-- Batch safety lookup: accepts parallel arrays of lat/lng and returns all
-- results in a single query using UNNEST + LATERAL spatial joins.
-- Replaces N individual get_safety_at_point() calls with one round-trip.
CREATE OR REPLACE FUNCTION get_safety_at_points(
  lats NUMERIC[], lngs NUMERIC[]
) RETURNS TABLE(
  idx INTEGER,
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  cancer_prevalence NUMERIC,
  flood_zone TEXT,
  flood_risk TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pts.idx::INTEGER,
    ct.geoid,
    ct.cancer_sir_overall,
    ct.cancer_prevalence_pct,
    fz.fld_zone,
    fz.risk_level
  FROM unnest(lats, lngs) WITH ORDINALITY AS pts(lat, lng, idx)
  LEFT JOIN LATERAL (
    SELECT c.geoid, c.cancer_sir_overall, c.cancer_prevalence_pct
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
