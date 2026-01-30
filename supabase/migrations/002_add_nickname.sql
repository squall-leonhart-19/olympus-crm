-- Add nickname column to team_members
-- Run this in your Supabase SQL Editor

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create storage bucket for avatars (run in Supabase Dashboard -> Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
