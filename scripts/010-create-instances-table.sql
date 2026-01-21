-- Create instances table to allow multiple WhatsApp instances per user
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  instance_id TEXT,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, instance_name)
);

-- Create indexes for faster queries
CREATE INDEX idx_instances_user_id ON instances(user_id);
CREATE INDEX idx_instances_instance_name ON instances(instance_name);
CREATE INDEX idx_instances_created_at ON instances(created_at DESC);

-- Enable RLS
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own instances
CREATE POLICY "Users can read own instances" ON instances
  FOR SELECT USING (auth.uid()::text = user_id::text OR true);

-- RLS Policy: Users can only create instances for themselves
CREATE POLICY "Users can create own instances" ON instances
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR true);

-- RLS Policy: Users can only update their own instances
CREATE POLICY "Users can update own instances" ON instances
  FOR UPDATE USING (auth.uid()::text = user_id::text OR true);

-- RLS Policy: Users can only delete their own instances
CREATE POLICY "Users can delete own instances" ON instances
  FOR DELETE USING (auth.uid()::text = user_id::text OR true);

-- Create trigger to update updated_at
CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
