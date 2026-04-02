-- Layer 1: is_area_cached — checks if a bbox is fully covered by a non-expired search_cache entry
CREATE OR REPLACE FUNCTION is_area_cached(
  lat_min NUMERIC, lng_min NUMERIC,
  lat_max NUMERIC, lng_max NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM search_cache
    WHERE ST_Contains(bbox, ST_MakeEnvelope(lng_min, lat_min, lng_max, lat_max, 4326))
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Layer 1: Align listings TTL default to 7 days (matches search_cache and CLAUDE.md spec)
ALTER TABLE listings ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');

-- Layer 5: Persistent rate limiting table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'rentcast',
  month_key TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 45,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_provider_month UNIQUE (provider, month_key)
);

-- Layer 5: Atomic increment — returns new count and whether the call is allowed
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_provider TEXT DEFAULT 'rentcast',
  p_limit INTEGER DEFAULT 45
) RETURNS TABLE(new_count INTEGER, is_allowed BOOLEAN) AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
  result_count INTEGER;
BEGIN
  INSERT INTO api_usage (provider, month_key, call_count, monthly_limit)
  VALUES (p_provider, current_month, 1, p_limit)
  ON CONFLICT (provider, month_key)
  DO UPDATE SET
    call_count = api_usage.call_count + 1,
    updated_at = NOW()
  RETURNING api_usage.call_count INTO result_count;

  RETURN QUERY SELECT result_count, (result_count <= p_limit);
END;
$$ LANGUAGE plpgsql;

-- Layer 5: Read current usage without incrementing
CREATE OR REPLACE FUNCTION get_api_usage(
  p_provider TEXT DEFAULT 'rentcast'
) RETURNS TABLE(call_count INTEGER, monthly_limit INTEGER, remaining INTEGER) AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(a.call_count, 0),
    COALESCE(a.monthly_limit, 45),
    GREATEST(0, COALESCE(a.monthly_limit, 45) - COALESCE(a.call_count, 0))
  FROM (SELECT 1) AS dummy
  LEFT JOIN api_usage a ON a.provider = p_provider AND a.month_key = current_month;
END;
$$ LANGUAGE plpgsql STABLE;
