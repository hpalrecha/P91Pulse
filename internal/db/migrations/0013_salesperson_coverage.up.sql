-- 0013_salesperson_coverage — EAV table binding a sales user to their coverage
-- across four dimensions. For dimension='territory', value is a territories.id
-- (a node at ANY level: region/state/city). For brand/customer_group/company,
-- value is the literal name. Writes are replace-all (delete + insert), mirroring
-- the user_states pattern (INSERT ... ON CONFLICT DO NOTHING).
CREATE TABLE IF NOT EXISTS salesperson_coverage (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dimension text NOT NULL CHECK (dimension IN ('territory', 'brand', 'customer_group', 'company')),
  value     text NOT NULL,
  PRIMARY KEY (user_id, dimension, value)
);
CREATE INDEX IF NOT EXISTS idx_salesperson_coverage_user ON salesperson_coverage(user_id);
