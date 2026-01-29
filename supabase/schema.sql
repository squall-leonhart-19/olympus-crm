-- Olympus CRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TEAM MEMBERS TABLE
-- =====================
CREATE TABLE team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- TASKS TABLE
-- =====================
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES team_members(id),
  assignee_name TEXT,
  deal_id UUID, -- Link to deals table (FK added after deals table creation)
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- TASK COMMENTS TABLE
-- =====================
CREATE TABLE task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- =====================
-- DEALS (PIPELINE) TABLE
-- =====================
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  value DECIMAL(10, 2) DEFAULT 0,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'booked', 'taken', 'proposal', 'closed_won', 'closed_lost')),
  client_name TEXT,
  client_email TEXT,
  source TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- =====================
-- CLIENTS TABLE
-- =====================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'completed', 'inactive')),
  source TEXT,
  notes TEXT,
  total_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- KPI DAILY LOGS TABLE
-- =====================
CREATE TABLE kpi_daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  log_date DATE NOT NULL UNIQUE,
  leads INTEGER DEFAULT 0,
  sets INTEGER DEFAULT 0,
  shows INTEGER DEFAULT 0,
  closes INTEGER DEFAULT 0,
  cash_collected DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- REP PERFORMANCE TABLE
-- =====================
CREATE TABLE rep_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_member_id UUID REFERENCES team_members(id),
  rep_name TEXT NOT NULL,
  log_date DATE NOT NULL,
  sets INTEGER DEFAULT 0,
  shows INTEGER DEFAULT 0,
  closes INTEGER DEFAULT 0,
  cash_collected DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rep_name, log_date)
);

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_name);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_kpi_date ON kpi_daily_logs(log_date);
CREATE INDEX idx_rep_date ON rep_performance(log_date);

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================
-- For now, enable RLS but allow all authenticated users full access
-- You can make this more restrictive later

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_performance ENABLE ROW LEVEL SECURITY;

-- Simple policies: authenticated users can do everything
CREATE POLICY "Allow all for authenticated" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON deals FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON kpi_daily_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON rep_performance FOR ALL USING (true);

-- =====================
-- INSERT DEMO TEAM MEMBERS
-- =====================
INSERT INTO team_members (name, email, role) VALUES
  ('Marco', 'marco@olympus-ops.com', 'Sales Lead'),
  ('Giulia', 'giulia@olympus-ops.com', 'Closer'),
  ('Alex', 'alex@olympus-ops.com', 'SDR'),
  ('Zeus', 'zeus@olympus-ops.com', 'Admin');
