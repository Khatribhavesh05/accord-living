-- CIVIORA asset booking RLS hotfix
-- Purpose: unblock Admin/Resident actions when frontend uses anon client key without Supabase Auth sessions.
-- Apply this in Supabase SQL Editor, then refresh the app.
-- IMPORTANT: This is a development compatibility patch and is permissive for anon traffic.

ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_bookings ENABLE ROW LEVEL SECURITY;

-- Make role resolution more robust for authenticated users.
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT LOWER(
    COALESCE(
      (SELECT p.role FROM profiles p WHERE p.id = auth.uid()),
      (
        SELECT p.role
        FROM profiles p
        WHERE LOWER(COALESCE(p.email, '')) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
        LIMIT 1
      ),
      'resident'
    )
  );
$$;

-- Clear existing policies to avoid overlap conflicts.
DROP POLICY IF EXISTS assets_admin_full_access ON assets;
DROP POLICY IF EXISTS assets_resident_read_active ON assets;
DROP POLICY IF EXISTS assets_security_read_only ON assets;
DROP POLICY IF EXISTS assets_anon_full_access_dev ON assets;

DROP POLICY IF EXISTS bookings_admin_full_access ON asset_bookings;
DROP POLICY IF EXISTS bookings_security_read_only ON asset_bookings;
DROP POLICY IF EXISTS bookings_resident_select_own ON asset_bookings;
DROP POLICY IF EXISTS bookings_resident_create_own ON asset_bookings;
DROP POLICY IF EXISTS bookings_resident_cancel_pending ON asset_bookings;
DROP POLICY IF EXISTS bookings_anon_full_access_dev ON asset_bookings;

-- Keep intended role-based policies for authenticated users.
CREATE POLICY assets_admin_full_access
ON assets
FOR ALL
USING (user_role() = 'admin')
WITH CHECK (user_role() = 'admin');

CREATE POLICY assets_resident_read_active
ON assets
FOR SELECT
USING (status = 'active' AND user_role() = 'resident');

CREATE POLICY assets_security_read_only
ON assets
FOR SELECT
USING (user_role() = 'security');

CREATE POLICY bookings_admin_full_access
ON asset_bookings
FOR ALL
USING (user_role() = 'admin')
WITH CHECK (user_role() = 'admin');

CREATE POLICY bookings_security_read_only
ON asset_bookings
FOR SELECT
USING (user_role() = 'security');

CREATE POLICY bookings_resident_select_own
ON asset_bookings
FOR SELECT
USING (user_role() = 'resident' AND resident_id = auth.uid());

CREATE POLICY bookings_resident_create_own
ON asset_bookings
FOR INSERT
WITH CHECK (
  user_role() = 'resident'
  AND resident_id = auth.uid()
  AND EXISTS (SELECT 1 FROM assets a WHERE a.id = asset_bookings.asset_id AND a.status = 'active')
);

CREATE POLICY bookings_resident_cancel_pending
ON asset_bookings
FOR UPDATE
USING (user_role() = 'resident' AND resident_id = auth.uid() AND status = 'pending')
WITH CHECK (user_role() = 'resident' AND resident_id = auth.uid());

-- Development fallback:
-- If request is anonymous (no Supabase auth session), allow app flows to continue.
-- This matches legacy custom-auth setups where role is handled outside Supabase Auth.
CREATE POLICY assets_anon_full_access_dev
ON assets
FOR ALL
USING (auth.uid() IS NULL)
WITH CHECK (auth.uid() IS NULL);

CREATE POLICY bookings_anon_full_access_dev
ON asset_bookings
FOR ALL
USING (auth.uid() IS NULL)
WITH CHECK (auth.uid() IS NULL);
