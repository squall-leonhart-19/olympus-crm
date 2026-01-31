-- Olympus Audit Fixes Migration
-- Run this in Supabase SQL Editor to fix 404 errors

-- Create clients table if not exists
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create rep_performance table if not exists
CREATE TABLE IF NOT EXISTS rep_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID,
  rep_name TEXT NOT NULL,
  log_date DATE NOT NULL,
  sets INTEGER DEFAULT 0,
  shows INTEGER DEFAULT 0,
  closes INTEGER DEFAULT 0,
  cash_collected DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rep_name, log_date)
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_rep_date ON rep_performance(log_date);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_performance ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if exist)
DROP POLICY IF EXISTS "Allow all for authenticated" ON clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON rep_performance;

CREATE POLICY "Allow all for authenticated" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON rep_performance FOR ALL USING (true);

-- Insert sample clients
INSERT INTO clients (name, email, company, status, source, total_value) VALUES
  ('Acme Corp', 'contact@acme.com', 'Acme Corporation', 'active', 'referral', 25000),
  ('TechStart Inc', 'hello@techstart.io', 'TechStart', 'lead', 'website', 0),
  ('Global Services', 'info@globalservices.com', 'Global Services Ltd', 'completed', 'cold outreach', 15000)
ON CONFLICT DO NOTHING;

-- Insert sample rep performance data
INSERT INTO rep_performance (rep_name, log_date, sets, shows, closes, cash_collected) VALUES
  ('Squall', CURRENT_DATE - INTERVAL '1 day', 5, 3, 2, 5000),
  ('Squall', CURRENT_DATE, 4, 2, 1, 2500),
  ('Marco', CURRENT_DATE - INTERVAL '1 day', 3, 2, 1, 3000),
  ('Marco', CURRENT_DATE, 6, 4, 2, 6000)
ON CONFLICT (rep_name, log_date) DO NOTHING;
