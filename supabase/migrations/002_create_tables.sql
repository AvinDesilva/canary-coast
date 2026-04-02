-- Census tract geometries + cancer data
CREATE TABLE IF NOT EXISTS census_tracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  geoid TEXT UNIQUE NOT NULL,
  tract_name TEXT,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  cancer_sir_overall NUMERIC,
  cancer_sir_brain NUMERIC,
  cancer_sir_lung NUMERIC,
  cancer_sir_breast NUMERIC,
  cancer_sir_prostate NUMERIC,
  cancer_sir_colon NUMERIC,
  cancer_prevalence_pct NUMERIC,
  data_source TEXT,
  data_year INTEGER,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_geoid CHECK (geoid ~ '^[0-9]{11}$')
);

CREATE INDEX IF NOT EXISTS idx_tracts_geom ON census_tracts USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_tracts_geoid ON census_tracts(geoid);

-- Flood zone polygons
CREATE TABLE IF NOT EXISTS flood_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fld_zone TEXT NOT NULL,
  zone_subtype TEXT,
  sfha_tf BOOLEAN,
  static_bfe NUMERIC,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN fld_zone IN ('V','VE') THEN 'very_high'
      WHEN fld_zone IN ('A','AE','AH','AO','AR','A99') THEN 'high'
      WHEN zone_subtype = '0.2 PCT ANNUAL CHANCE FLOOD HAZARD' THEN 'moderate'
      WHEN fld_zone = 'D' THEN 'undetermined'
      ELSE 'minimal'
    END
  ) STORED,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_geom ON flood_zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_flood_zone ON flood_zones(fld_zone);

-- Cached listings from Zillow
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zpid TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Houston',
  state TEXT DEFAULT 'TX',
  zipcode TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  point GEOMETRY(Point, 4326) NOT NULL,
  price INTEGER,
  bedrooms SMALLINT,
  bathrooms NUMERIC,
  sqft INTEGER,
  lot_sqft INTEGER,
  year_built SMALLINT,
  home_type TEXT,
  listing_status TEXT,
  zestimate INTEGER,
  rent_zestimate INTEGER,
  primary_photo_url TEXT,
  photo_urls JSONB DEFAULT '[]',
  listing_url TEXT,
  cancer_tract_geoid TEXT,
  cancer_sir NUMERIC,
  flood_zone_code TEXT,
  flood_risk_level TEXT,
  safety_score NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  CONSTRAINT valid_coords CHECK (
    latitude BETWEEN 29.0 AND 30.5 AND
    longitude BETWEEN -96.0 AND -94.5
  )
);

CREATE INDEX IF NOT EXISTS idx_listings_point ON listings USING GIST(point);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_listings_expires ON listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_safety ON listings(safety_score);

-- Search area cache
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bbox GEOMETRY(Polygon, 4326) NOT NULL,
  listing_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_search_bbox ON search_cache USING GIST(bbox);

-- Zip-code-level cancer data
CREATE TABLE IF NOT EXISTS zip_cancer_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code TEXT NOT NULL,
  cancer_type TEXT NOT NULL,
  year_start INTEGER NOT NULL DEFAULT 2013,
  year_end INTEGER NOT NULL DEFAULT 2021,
  sir NUMERIC,
  observed_cases INTEGER,
  expected_cases NUMERIC,
  age_adjusted_rate NUMERIC,
  confidence_low NUMERIC,
  confidence_high NUMERIC,
  population INTEGER,
  data_source TEXT DEFAULT 'HCPH_TX_CANCER_REGISTRY',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_zip_cancer UNIQUE (zip_code, cancer_type, year_start, year_end)
);

CREATE INDEX IF NOT EXISTS idx_zip_cancer_zip ON zip_cancer_data(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_cancer_type ON zip_cancer_data(cancer_type);

-- Zip code geometries
CREATE TABLE IF NOT EXISTS zip_geometries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code TEXT UNIQUE NOT NULL,
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  centroid_lat NUMERIC,
  centroid_lng NUMERIC,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_geom ON zip_geometries USING GIST(geometry);
