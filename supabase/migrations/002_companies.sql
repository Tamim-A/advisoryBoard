-- ═══════════════════════════════════════════════════════
-- Advisory Board — Companies Table
-- شغّل هذا في Supabase SQL Editor بعد 001_initial.sql
-- ═══════════════════════════════════════════════════════

-- جدول الشركات (ملفات شركات قابلة للإعادة)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  company_size TEXT,
  stage TEXT,
  annual_revenue TEXT,
  team_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "companies_insert_own" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_delete_own" ON companies
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(user_id, name);

-- ─── Backfill من الجلسات الموجودة ────────────────────
-- (اختياري — يملأ companies من company_profile الموجود في sessions)
INSERT INTO companies (user_id, name, sector, company_size, stage, annual_revenue, team_size)
SELECT DISTINCT ON (user_id, company_profile->>'company_name')
  user_id,
  company_profile->>'company_name',
  company_profile->>'sector',
  company_profile->>'company_size',
  company_profile->>'stage',
  company_profile->>'annual_revenue',
  company_profile->>'team_size'
FROM sessions
WHERE company_profile->>'company_name' IS NOT NULL
  AND company_profile->>'company_name' != ''
ON CONFLICT (user_id, name) DO NOTHING;
