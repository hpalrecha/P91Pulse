-- 0003 — phone is now ALWAYS required (golden rule), and brand access becomes
-- per-user many-to-many (a distributor may be granted some brands, not all).

-- Backfill any existing phone-less users with a UNIQUE placeholder so both the
-- NOT NULL and the per-tenant unique-phone constraints hold.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM users WHERE phone IS NULL
)
UPDATE users u
SET phone = lpad((9000000000 + n.rn)::text, 10, '0')
FROM numbered n
WHERE u.id = n.id;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Per-user brand access (which brands this user can see/act in).
CREATE TABLE user_brands (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, brand_id)
);
CREATE INDEX idx_user_brands_user ON user_brands(user_id);
