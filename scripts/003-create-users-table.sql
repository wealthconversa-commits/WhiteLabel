-- Create users table for account management with approval workflow
-- Status: PENDING (awaiting approval), APPROVED (active), SUSPENDED (blocked)
-- Role: ADMIN (platform admin), USER (client company)

-- Create enum types for status and role
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name TEXT NOT NULL,
  responsible_name TEXT NOT NULL,
  status user_status DEFAULT 'PENDING' NOT NULL,
  role user_role DEFAULT 'USER' NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow reading all users (needed for admin panel)
CREATE POLICY "Allow read users" ON users
  FOR SELECT USING (true);

-- Allow inserting new users (registration)
CREATE POLICY "Allow insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Allow updating users (admin approval, status changes)
CREATE POLICY "Allow update users" ON users
  FOR UPDATE USING (true);

-- RLS Policies for sessions table
CREATE POLICY "Allow all sessions" ON sessions
  FOR ALL USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add user_id to settings table to link settings to specific users
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Add user_id to branding table (global branding controlled by admin)
ALTER TABLE branding ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Update audit_logs to include user_id
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
