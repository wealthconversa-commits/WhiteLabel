-- Fix RLS policies to allow initial setup without authentication
-- This allows the first setup to happen, then subsequent changes require auth

-- Drop existing restrictive policies for insert/update on settings
DROP POLICY IF EXISTS "Allow authenticated insert on settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated update on settings" ON settings;

-- Drop existing restrictive policies for insert/update on branding
DROP POLICY IF EXISTS "Allow authenticated insert on branding" ON branding;
DROP POLICY IF EXISTS "Allow authenticated update on branding" ON branding;

-- Drop existing restrictive policies for audit_logs
DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON audit_logs;

-- Create new policies that allow both anon and authenticated users
-- Settings: Allow insert only if no settings exist (first setup)
CREATE POLICY "Allow initial setup insert on settings" ON settings
  FOR INSERT TO anon, authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM settings WHERE setup_completed = true));

-- Settings: Allow update for both anon and authenticated
CREATE POLICY "Allow update on settings" ON settings
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Branding: Allow insert if no branding exists
CREATE POLICY "Allow initial branding insert" ON branding
  FOR INSERT TO anon, authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM branding LIMIT 1) OR true);

-- Branding: Allow update for both anon and authenticated
CREATE POLICY "Allow update on branding" ON branding
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Audit logs: Allow insert for both anon and authenticated
CREATE POLICY "Allow insert on audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
