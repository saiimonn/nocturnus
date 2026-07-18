DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS club_tables CASCADE;
DROP TABLE IF EXISTS floor_plans CASCADE;
DROP TABLE IF EXISTS club_images CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS owner_verification_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS public.user_owns_club(uuid);
DROP FUNCTION IF EXISTS update_updated_at();

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. users
-- ============================================
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      varchar NOT NULL,
  email          varchar NOT NULL UNIQUE,
  contact_number varchar,
  password_hash  varchar NOT NULL,
  role           varchar NOT NULL CHECK (role IN ('owner', 'admin', 'club_employee')),
  status         varchar NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. owner_verification_tokens
-- ============================================
CREATE TABLE owner_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  varchar NOT NULL,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  revoked     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. clubs
-- ============================================
CREATE TABLE clubs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name            varchar NOT NULL,
  slug            varchar NOT NULL UNIQUE,
  description     text,
  address         varchar NOT NULL,
  operating_hours jsonb,
  cover_image_url varchar,
  status          varchar NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Attach employees to a venue. Null for owner/admin. Added after clubs so
-- the FK can resolve; club_employee_invites below follows the same order.
ALTER TABLE users ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;

-- An employee must always belong to a club; owners/admins must not.
ALTER TABLE users ADD CONSTRAINT users_club_id_role_check
  CHECK (role <> 'club_employee' OR club_id IS NOT NULL);

CREATE INDEX users_club_id_idx ON users (club_id);

-- ============================================
-- 4. club_images
-- ============================================
CREATE TABLE club_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  image_url  varchar NOT NULL,
  caption    varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 5. floor_plans
-- ============================================
CREATE TABLE floor_plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name       varchar NOT NULL,
  image_url  varchar NOT NULL,
  labels     jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 6. club_tables
-- ============================================
CREATE TABLE club_tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id  uuid NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  club_id        uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  label          varchar NOT NULL,
  capacity       integer NOT NULL,
  minimum_spend  decimal(10,2),
  category       varchar CHECK (category IN ('VIP', 'regular', 'booth', 'bar')),
  pos_x          real NOT NULL,
  pos_y          real NOT NULL,
  is_available   boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 7. events
-- ============================================
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title       varchar NOT NULL,
  description text,
  image_url   varchar,
  event_date  timestamptz NOT NULL,
  status      varchar NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 8. reservations
-- ============================================
CREATE TABLE reservations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id         uuid NOT NULL REFERENCES club_tables(id) ON DELETE CASCADE,
  club_id          uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_id         uuid REFERENCES events(id) ON DELETE SET NULL,
  reservation_date timestamptz NOT NULL,
  guest_name       varchar NOT NULL,
  guest_email      varchar NOT NULL,
  guest_contact    varchar,
  party_size       integer NOT NULL,
  qr_code_token    uuid,
  status           varchar NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked_in')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 9. club_employee_invites
-- ============================================
-- Invite tokens. Mirrors owner_verification_tokens, but deliberately
-- carries club_id + email: an employee invite asserts venue identity, which
-- the owner token deliberately does not.
CREATE TABLE club_employee_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email       varchar NOT NULL,
  token_hash  varchar NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  revoked     boolean NOT NULL DEFAULT false,
  invited_by  uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX club_employee_invites_club_id_idx ON club_employee_invites (club_id);

-- At most one live invite per address per club, so an owner cannot pile up
-- duplicate pending invites to the same person.
CREATE UNIQUE INDEX club_employee_invites_one_live_per_email
  ON club_employee_invites (club_id, lower(email))
  WHERE used = false AND revoked = false;

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_floor_plans_updated_at
  BEFORE UPDATE ON floor_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_club_tables_updated_at
  BEFORE UPDATE ON club_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
