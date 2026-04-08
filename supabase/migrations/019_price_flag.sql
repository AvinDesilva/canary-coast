-- Price change flagging: new columns, trigger, and partial index
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS prev_price          NUMERIC,
  ADD COLUMN IF NOT EXISTS price_changed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_drop_count    SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_drop_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cumulative_drop_pct NUMERIC  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_flag          TEXT     NOT NULL DEFAULT 'none'
    CHECK (price_flag IN ('none','medium','high','critical'));

-- Trigger function: fires only when price actually changes
CREATE OR REPLACE FUNCTION fn_track_price_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  pct_change            NUMERIC;
  new_cumul             NUMERIC;
  days_since_first_drop NUMERIC;
BEGIN
  IF OLD.price IS NULL OR NEW.price IS NULL OR OLD.price = NEW.price THEN
    RETURN NEW;
  END IF;

  pct_change := (OLD.price - NEW.price) / OLD.price * 100;

  -- Price went UP: reset the downward run
  IF pct_change < 0 THEN
    NEW.prev_price          := OLD.price;
    NEW.price_changed_at    := NOW();
    NEW.price_drop_count    := 0;
    NEW.first_drop_at       := NULL;
    NEW.cumulative_drop_pct := 0;
    NEW.price_flag          := 'none';
    RETURN NEW;
  END IF;

  -- Price went DOWN: accumulate history
  NEW.prev_price       := OLD.price;
  NEW.price_changed_at := NOW();
  NEW.price_drop_count := OLD.price_drop_count + 1;
  NEW.first_drop_at    := COALESCE(OLD.first_drop_at, NOW());
  new_cumul            := OLD.cumulative_drop_pct + pct_change;
  NEW.cumulative_drop_pct := new_cumul;

  days_since_first_drop :=
    EXTRACT(EPOCH FROM (NOW() - NEW.first_drop_at)) / 86400.0;

  -- Determine flag (highest severity wins; evaluate in ascending order)
  NEW.price_flag := 'none';

  IF pct_change >= 3 THEN
    NEW.price_flag := 'medium';
  END IF;

  -- >5% single drop, >7% single drop, bracket crossing, or 5% cumulative in 30d → high
  IF pct_change > 5
    OR pct_change > 7
    OR (new_cumul > 5 AND days_since_first_drop <= 30)
    OR (FLOOR(OLD.price / 25000) != FLOOR(NEW.price / 25000))
    OR (FLOOR(OLD.price / 50000) != FLOOR(NEW.price / 50000))
  THEN
    NEW.price_flag := 'high';
  END IF;

  -- Second drop within 14 days → critical ("Motivated Seller")
  IF NEW.price_drop_count >= 2 AND days_since_first_drop <= 14 THEN
    NEW.price_flag := 'critical';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_price_change
  BEFORE UPDATE OF price ON listings
  FOR EACH ROW EXECUTE FUNCTION fn_track_price_change();

CREATE INDEX IF NOT EXISTS idx_listings_price_flag
  ON listings (price_flag) WHERE price_flag != 'none';
