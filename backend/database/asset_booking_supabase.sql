-- ==============================================
-- CIVIORA Asset Booking Management (Supabase)
-- ==============================================
-- Run this in Supabase SQL Editor.

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_booking_hours INTEGER NOT NULL DEFAULT 0,
  max_bookings_per_day INTEGER NOT NULL DEFAULT 0,
  advance_booking_days INTEGER NOT NULL DEFAULT 0,
  booking_rules TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- Bookings
CREATE TABLE IF NOT EXISTS asset_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES profiles(id),
  resident_name TEXT DEFAULT '',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1,
  purpose TEXT DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_bookings_asset_id ON asset_bookings(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_booking_date ON asset_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_status ON asset_bookings(status);

-- Updated at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_asset_bookings_updated_at ON asset_bookings;
CREATE TRIGGER trg_asset_bookings_updated_at
BEFORE UPDATE ON asset_bookings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================
-- Row Level Security
-- ==============================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_bookings ENABLE ROW LEVEL SECURITY;

-- Helper role check (assumes profiles.id = auth.uid())
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT LOWER(COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 'resident'));
$$;

-- Assets policies
DROP POLICY IF EXISTS assets_admin_full_access ON assets;
CREATE POLICY assets_admin_full_access
ON assets
FOR ALL
USING (user_role() = 'admin')
WITH CHECK (user_role() = 'admin');

DROP POLICY IF EXISTS assets_resident_read_active ON assets;
CREATE POLICY assets_resident_read_active
ON assets
FOR SELECT
USING (status = 'active' AND user_role() = 'resident');

DROP POLICY IF EXISTS assets_security_read_only ON assets;
CREATE POLICY assets_security_read_only
ON assets
FOR SELECT
USING (user_role() = 'security');

-- Bookings policies
DROP POLICY IF EXISTS bookings_admin_full_access ON asset_bookings;
CREATE POLICY bookings_admin_full_access
ON asset_bookings
FOR ALL
USING (user_role() = 'admin')
WITH CHECK (user_role() = 'admin');

DROP POLICY IF EXISTS bookings_security_read_only ON asset_bookings;
CREATE POLICY bookings_security_read_only
ON asset_bookings
FOR SELECT
USING (user_role() = 'security');

DROP POLICY IF EXISTS bookings_resident_select_own ON asset_bookings;
CREATE POLICY bookings_resident_select_own
ON asset_bookings
FOR SELECT
USING (user_role() = 'resident' AND resident_id = auth.uid());

DROP POLICY IF EXISTS bookings_resident_create_own ON asset_bookings;
CREATE POLICY bookings_resident_create_own
ON asset_bookings
FOR INSERT
WITH CHECK (
  user_role() = 'resident'
  AND resident_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM assets a WHERE a.id = asset_bookings.asset_id AND a.status = 'active'
  )
);

-- Optional: if residents can cancel their pending bookings
DROP POLICY IF EXISTS bookings_resident_cancel_pending ON asset_bookings;
CREATE POLICY bookings_resident_cancel_pending
ON asset_bookings
FOR UPDATE
USING (user_role() = 'resident' AND resident_id = auth.uid() AND status = 'pending')
WITH CHECK (user_role() = 'resident' AND resident_id = auth.uid());
