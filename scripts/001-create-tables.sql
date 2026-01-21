-- White Label Evolution API - Database Schema
-- Tables for settings, branding, and audit logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Settings table for Evolution API credentials
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evolution_url TEXT NOT NULL,
  evolution_token TEXT NOT NULL,
  instance_name TEXT,
  instance_id TEXT,
  setup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branding table for white-label customization
CREATE TABLE IF NOT EXISTS branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url TEXT,
  app_name TEXT DEFAULT 'WhatsApp Manager',
  primary_color TEXT DEFAULT '#10B981',
  secondary_color TEXT DEFAULT '#059669',
  background_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#1F2937',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default branding if none exists
INSERT INTO branding (app_name, primary_color, secondary_color)
SELECT 'WhatsApp Manager', '#10B981', '#059669'
WHERE NOT EXISTS (SELECT 1 FROM branding LIMIT 1);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access only
CREATE POLICY "Allow authenticated read on settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on settings" ON settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on settings" ON settings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on branding" ON branding
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on branding" ON branding
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on branding" ON branding
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on audit_logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on audit_logs" ON audit_logs
  FOR SELECT TO authenticated USING (true);

-- Also allow anon access for initial setup (before user is created)
CREATE POLICY "Allow anon read on branding" ON branding
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read on settings for setup check" ON settings
  FOR SELECT TO anon USING (true);
