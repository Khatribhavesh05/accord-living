-- Visitor Management System schema for CIVIORA
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  purpose TEXT NOT NULL,
  flat_number TEXT NOT NULL,
  vehicle_number TEXT DEFAULT '',
  visitor_photo TEXT DEFAULT '',
  visitor_type TEXT NOT NULL DEFAULT 'Guest' CHECK (visitor_type IN ('Guest', 'Delivery', 'Service')),
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'inside' CHECK (status IN ('inside', 'exited', 'waiting_approval', 'cancelled')),
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approval_method TEXT NOT NULL DEFAULT 'resident' CHECK (approval_method IN ('auto', 'resident', 'admin')),
  approved_by TEXT DEFAULT '',
  created_by_security UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_flat_number ON visitors(flat_number);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_phone_number ON visitors(phone_number);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_type ON visitors(visitor_type);

CREATE TABLE IF NOT EXISTS visitor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_name TEXT NOT NULL DEFAULT 'CIVIORA',
  require_resident_approval BOOLEAN NOT NULL DEFAULT TRUE,
  enable_qr_pass BOOLEAN NOT NULL DEFAULT TRUE,
  enable_photo_capture BOOLEAN NOT NULL DEFAULT TRUE,
  enable_vehicle_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  enable_otp_verification BOOLEAN NOT NULL DEFAULT FALSE,
  allow_walkin_visitors BOOLEAN NOT NULL DEFAULT TRUE,
  auto_approve_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  max_visitors_per_flat INTEGER NOT NULL DEFAULT 5,
  visitor_pass_expiry_hours INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'approved', 'rejected', 'exited')),
  performed_by_role TEXT NOT NULL CHECK (performed_by_role IN ('security', 'admin', 'resident')),
  performed_by_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_timestamp ON visitor_logs(timestamp DESC);

-- Optional add-on: blacklist support
CREATE TABLE IF NOT EXISTS visitor_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  blocked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (phone_number)
);

CREATE INDEX IF NOT EXISTS idx_visitor_blacklist_phone ON visitor_blacklist(phone_number);

CREATE OR REPLACE FUNCTION set_visitor_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visitor_settings_updated_at ON visitor_settings;
CREATE TRIGGER trg_visitor_settings_updated_at
BEFORE UPDATE ON visitor_settings
FOR EACH ROW
EXECUTE FUNCTION set_visitor_settings_updated_at();

-- Seed one settings row if none exists
INSERT INTO visitor_settings (
  society_name,
  require_resident_approval,
  enable_qr_pass,
  enable_photo_capture,
  enable_vehicle_tracking,
  enable_otp_verification,
  allow_walkin_visitors,
  auto_approve_delivery,
  max_visitors_per_flat,
  visitor_pass_expiry_hours
)
SELECT
  'CIVIORA', TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, 5, 12
WHERE NOT EXISTS (SELECT 1 FROM visitor_settings);
