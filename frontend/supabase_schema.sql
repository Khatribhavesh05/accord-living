-- ============================================================
-- CIVIORA Society Management Platform - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'resident', 'security')),
    flat_number TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role, status, is_approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        'resident',
        'pending_approval',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Rejected')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    image_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. BILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Monthly Maintenance',
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Partial')),
    due_date DATE NOT NULL,
    month TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode TEXT DEFAULT 'UPI',
    transaction_id TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. VISITORS
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    visitor_name TEXT NOT NULL,
    mobile_number TEXT,
    purpose TEXT,
    flat_number TEXT,
    vehicle_number TEXT,
    approval_code TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'checked_in', 'checked_out', 'rejected', 'expired')),
    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,
    logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'amenity',
    location TEXT,
    capacity INTEGER,
    rate_per_hour NUMERIC(10, 2) DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. ASSET BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    purpose TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. DELIVERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    flat_number TEXT,
    package_name TEXT NOT NULL,
    courier TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Collected', 'Returned')),
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. EMERGENCY ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL DEFAULT 'Emergency Alert',
    message TEXT NOT NULL,
    alert_type TEXT DEFAULT 'general' CHECK (alert_type IN ('fire', 'medical', 'security', 'natural_disaster', 'general')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    salary NUMERIC(10, 2),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
    shift TEXT DEFAULT 'Day',
    joined_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. STAFF ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_name TEXT,
    selfie_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. COMMITTEE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS committee_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    designation TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'car' CHECK (vehicle_type IN ('car', 'bike', 'scooter', 'other')),
    make_model TEXT,
    parking_slot TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 17. VEHICLE LOGS (security gate entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('entry', 'exit')),
    flat_number TEXT,
    logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. SHOPS
-- ============================================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_name TEXT,
    shop_number TEXT,
    category TEXT,
    rent NUMERIC(10, 2),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Vacant')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: check if user is security
CREATE OR REPLACE FUNCTION is_security()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'security'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==================== PROFILES ====================
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (is_admin());

-- ==================== ANNOUNCEMENTS ====================
CREATE POLICY "Anyone authenticated can read announcements" ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (is_admin());

-- ==================== COMPLAINTS ====================
CREATE POLICY "Residents read own complaints" ON complaints FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Residents create own complaints" ON complaints FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Admins manage all complaints" ON complaints FOR ALL USING (is_admin());

-- ==================== BILLS ====================
CREATE POLICY "Residents read own bills" ON bills FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Admins manage all bills" ON bills FOR ALL USING (is_admin());

-- ==================== PAYMENTS ====================
CREATE POLICY "Residents read own payments" ON payments FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Residents create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Admins manage all payments" ON payments FOR ALL USING (is_admin());

-- ==================== VISITORS ====================
CREATE POLICY "Residents read own visitors" ON visitors FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Residents create visitors" ON visitors FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Security read all visitors" ON visitors FOR SELECT USING (is_security());
CREATE POLICY "Security update visitors" ON visitors FOR UPDATE USING (is_security());
CREATE POLICY "Admins manage all visitors" ON visitors FOR ALL USING (is_admin());

-- ==================== ASSETS ====================
CREATE POLICY "Anyone authenticated can read assets" ON assets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage assets" ON assets FOR ALL USING (is_admin());

-- ==================== ASSET BOOKINGS ====================
CREATE POLICY "Residents read own bookings" ON asset_bookings FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Residents create bookings" ON asset_bookings FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Admins manage all bookings" ON asset_bookings FOR ALL USING (is_admin());

-- ==================== DELIVERIES ====================
CREATE POLICY "Residents read own deliveries" ON deliveries FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Security read all deliveries" ON deliveries FOR SELECT USING (is_security());
CREATE POLICY "Security manage deliveries" ON deliveries FOR ALL USING (is_security());
CREATE POLICY "Admins manage all deliveries" ON deliveries FOR ALL USING (is_admin());

-- ==================== EMERGENCY ALERTS ====================
CREATE POLICY "Anyone authenticated reads alerts" ON emergency_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage alerts" ON emergency_alerts FOR ALL USING (is_admin());
CREATE POLICY "Security create alerts" ON emergency_alerts FOR INSERT WITH CHECK (is_security());

-- ==================== STAFF ====================
CREATE POLICY "Anyone authenticated reads staff" ON staff FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage staff" ON staff FOR ALL USING (is_admin());

-- ==================== STAFF ATTENDANCE ====================
CREATE POLICY "Security manages attendance" ON staff_attendance FOR ALL USING (is_security());
CREATE POLICY "Admins read attendance" ON staff_attendance FOR SELECT USING (is_admin());

-- ==================== COMMITTEE ====================
CREATE POLICY "Anyone reads committee" ON committee_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage committee" ON committee_members FOR ALL USING (is_admin());

-- ==================== EXPENSES ====================
CREATE POLICY "Admins manage expenses" ON expenses FOR ALL USING (is_admin());

-- ==================== DOCUMENTS ====================
CREATE POLICY "Anyone reads public docs" ON documents FOR SELECT USING (is_public = TRUE AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage documents" ON documents FOR ALL USING (is_admin());

-- ==================== VEHICLES ====================
CREATE POLICY "Residents read own vehicles" ON vehicles FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "Admins manage vehicles" ON vehicles FOR ALL USING (is_admin());
CREATE POLICY "Security reads vehicles" ON vehicles FOR SELECT USING (is_security());

-- ==================== VEHICLE LOGS ====================
CREATE POLICY "Security manages vehicle logs" ON vehicle_logs FOR ALL USING (is_security());
CREATE POLICY "Admins read vehicle logs" ON vehicle_logs FOR SELECT USING (is_admin());

-- ==================== SHOPS ====================
CREATE POLICY "Anyone reads shops" ON shops FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage shops" ON shops FOR ALL USING (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_bills_resident ON bills(resident_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_payments_resident ON payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_resident ON visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_resident ON asset_bookings(resident_id);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_status ON asset_bookings(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_resident ON deliveries(resident_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_number ON vehicle_logs(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- ============================================================
-- REALTIME: Enable for key tables
-- ============================================================
-- Run these in Supabase Dashboard > Database > Replication
-- or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE asset_bookings;

-- ============================================================
-- STORAGE: Create buckets (run via Supabase Dashboard or API)
-- ============================================================
-- Bucket: documents (for resident documents, notices)
-- Bucket: complaint-images (for complaint attachments)
-- Bucket: avatars (for profile pictures)
-- Bucket: assets (for asset images)
