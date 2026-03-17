-- ═══════════════════════════════════════════════════════
-- Migration: user_plans table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════

-- User plans table — controls session limits per user
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'vip', 'vip_plus', 'custom')),
  session_limit INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Users can read their own plan only
CREATE POLICY "Users read own plan" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role (admin API) can insert/update/delete plans
-- No client-side write policies

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default VIP plans for known admin emails
INSERT INTO user_plans (user_id, plan_type, session_limit)
SELECT id, 'vip', 20
FROM auth.users
WHERE email IN ('tamome2009@hotmail.com', 'tamome00@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET plan_type = 'vip', session_limit = 20, updated_at = NOW();
