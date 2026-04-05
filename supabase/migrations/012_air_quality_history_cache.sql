CREATE TABLE IF NOT EXISTS air_quality_history_cache (
  sensor_index  INTEGER PRIMARY KEY,
  aqi_monthly   INTEGER,
  aqi_yearly    INTEGER,
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
