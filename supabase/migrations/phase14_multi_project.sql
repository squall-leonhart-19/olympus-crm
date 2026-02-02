-- Olympus Phase 14 Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD SOURCE COLUMN TO TASKS (for webhook)
-- ============================================
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ============================================
-- 2. ADD PROJECT_ID TO TASKS (if not exists)
-- ============================================
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- ============================================
-- 3. ADD SECTION_ID TO TASKS (departments)
-- ============================================
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES project_sections(id) ON DELETE SET NULL;

-- ============================================
-- 4. ADD PROJECT_ID TO NOTES (for folders)
-- ============================================
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- ============================================
-- 5. ADD CATEGORY & SHARED TO NOTES (team notes)
-- ============================================
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT true;

ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES project_sections(id) ON DELETE SET NULL;

ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS author TEXT;

-- ============================================
-- 6. CREATE INDEX FOR FASTER QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);

-- ============================================
-- DONE! ✅
-- ============================================
