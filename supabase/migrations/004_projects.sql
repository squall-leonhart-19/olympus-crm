-- Projects Feature Migration
-- Run this in Supabase SQL Editor

-- Projects table (AccrediPro, Software, etc.)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#d4af37',
    icon TEXT DEFAULT '📁',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project sections (High Ticket, Software, Portal, etc.)
CREATE TABLE IF NOT EXISTS project_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add project_id and section_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES project_sections(id) ON DELETE SET NULL;

-- Multi-assignee support (array of team member names)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees TEXT[] DEFAULT '{}';

-- Update existing tasks to use new assignees array
UPDATE tasks SET assignees = ARRAY[assignee_name] WHERE assignee_name IS NOT NULL AND (assignees IS NULL OR assignees = '{}');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section_id ON tasks(section_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON project_sections(project_id);

-- Insert sample project
INSERT INTO projects (name, description, color, icon) VALUES 
('AccrediPro', 'Main education platform', '#d4af37', '🎓'),
('Software', 'Internal tools and development', '#8b5cf6', '💻')
ON CONFLICT DO NOTHING;
