-- 0011_invites — the canonical onboarding path. A distributor/admin issues an
-- invite for a role; the invitee fills the public signup form; that creates a
-- PENDING user seated under the inviter, which surfaces in Web Forms for
-- admin/NSM approval. On approval a VAS-eligible partner is provisioned in VAS.
CREATE TABLE invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text NOT NULL UNIQUE,
  role_code   text NOT NULL,                      -- detailer | installer | distributor
  invited_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  email       text,
  phone       text,
  status      text NOT NULL DEFAULT 'pending',    -- pending | used | expired
  used_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX idx_invites_token ON invites(token);
