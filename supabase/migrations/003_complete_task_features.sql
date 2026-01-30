-- Complete Task Features Migration
-- Run this in Supabase SQL Editor

-- Phase 1: Quick Wins
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;

-- Phase 2: High Impact
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence JSONB;

-- Phase 3: Advanced
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_by UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;

-- Task Activity Log Table
CREATE TABLE IF NOT EXISTS task_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Templates Table
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    subtasks JSONB DEFAULT '[]',
    labels TEXT[] DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster activity lookups
CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity(created_at DESC);
