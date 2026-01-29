-- =====================
-- NEW TABLES: Run this in Supabase SQL Editor
-- =====================

-- Add comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- Add deal_id to tasks (for task-deal linking)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id);

-- Enable RLS on comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for comments" ON task_comments FOR ALL USING (true);

-- Add phone to team_members (for WhatsApp)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS phone TEXT;
