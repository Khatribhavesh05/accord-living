-- Ensure booking_status exists and is the primary approval field.
-- Run in Supabase SQL Editor.

ALTER TABLE IF EXISTS asset_bookings
ADD COLUMN IF NOT EXISTS booking_status TEXT;

-- Backfill booking_status from legacy status values.
UPDATE asset_bookings
SET booking_status = LOWER(COALESCE(status, 'pending'))
WHERE booking_status IS NULL OR booking_status = '';

-- Normalize to allowed values only.
UPDATE asset_bookings
SET booking_status = CASE
  WHEN LOWER(COALESCE(booking_status, '')) IN ('pending', 'approved', 'rejected') THEN LOWER(booking_status)
  WHEN LOWER(COALESCE(booking_status, '')) IN ('completed') THEN 'approved'
  WHEN LOWER(COALESCE(booking_status, '')) IN ('cancelled', 'canceled') THEN 'rejected'
  ELSE 'pending'
END;

ALTER TABLE IF EXISTS asset_bookings
ALTER COLUMN booking_status SET DEFAULT 'pending';

ALTER TABLE IF EXISTS asset_bookings
ALTER COLUMN booking_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'asset_bookings_booking_status_check'
  ) THEN
    ALTER TABLE asset_bookings
    ADD CONSTRAINT asset_bookings_booking_status_check
    CHECK (booking_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_asset_bookings_booking_status
ON asset_bookings(booking_status);
