-- Fix RLS policies for settings and branding tables to allow setup
-- These tables should be accessed only via authenticated API routes, not directly

-- Disable RLS on settings table (access controlled via API routes only)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on branding table (access controlled via API routes only)  
ALTER TABLE branding DISABLE ROW LEVEL SECURITY;

-- Disable RLS on audit_logs table (access controlled via API routes only)
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on instances table (access controlled via API routes only)
ALTER TABLE instances DISABLE ROW LEVEL SECURITY;
