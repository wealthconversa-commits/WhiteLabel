-- Delete all users and related data
-- WARNING: This will permanently delete all accounts

-- Delete all instances
DELETE FROM instances;

-- Delete all audit logs
DELETE FROM audit_logs;

-- Delete all branding
DELETE FROM branding;

-- Delete all settings
DELETE FROM settings;

-- Delete all sessions
DELETE FROM sessions;

-- Delete all users
DELETE FROM users;
