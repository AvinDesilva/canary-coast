-- Pollutant facility point data from HCPH cancer reference maps
CREATE TABLE IF NOT EXISTS pollutant_facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'carcinogenic' | 'noncarcinogenic'
  total_emissions NUMERIC,  -- in TON, null for non-carcinogenic layer
  point GEOMETRY(Point, 4326) NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  data_source TEXT DEFAULT 'HCPH',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_category CHECK (category IN ('carcinogenic', 'noncarcinogenic'))
);

CREATE INDEX IF NOT EXISTS idx_facilities_point ON pollutant_facilities USING GIST(point);
CREATE INDEX IF NOT EXISTS idx_facilities_category ON pollutant_facilities(category);
