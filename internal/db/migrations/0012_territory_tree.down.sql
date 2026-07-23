-- Revert 0012_territory_tree.
DROP TABLE IF EXISTS pincode_territory;
ALTER TABLE territories DROP COLUMN IF EXISTS created_by;
ALTER TABLE territories DROP CONSTRAINT IF EXISTS territories_level_check;
ALTER TABLE territories
  ADD CONSTRAINT territories_level_check CHECK (level IN ('national', 'region', 'area', 'city', 'pincode'));
ALTER TABLE territories ALTER COLUMN level SET DEFAULT 'area';
