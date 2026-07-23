-- 0012_territory_tree — turn the dormant `territories` table into the editable
-- hierarchy (national → region → state → city) and add the pincode → city link.
-- Regions are custom admin groupings of states; cities own the pincodes.

-- Normalize any stray legacy rows, then widen the level vocabulary to the new
-- four-level tree (drop the unused 'area'/'pincode' leaf levels).
UPDATE territories SET level = 'city' WHERE level IN ('area', 'pincode');
ALTER TABLE territories DROP CONSTRAINT IF EXISTS territories_level_check;
ALTER TABLE territories
  ADD CONSTRAINT territories_level_check CHECK (level IN ('national', 'region', 'state', 'city'));
ALTER TABLE territories ALTER COLUMN level SET DEFAULT 'city';

-- Provenance (updated_at already exists from 0001; add created_by if missing).
ALTER TABLE territories ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- pincode → city node link. The tree above the city node resolves state/region.
CREATE TABLE IF NOT EXISTS pincode_territory (
  pincode           text PRIMARY KEY,
  city_territory_id uuid REFERENCES territories(id) ON DELETE SET NULL,
  state             text,
  city              text,
  source            text,
  updated_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pincode_territory_city ON pincode_territory(city_territory_id);
