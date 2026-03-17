-- ─── Fix RLS: strict user data isolation ────────────────────────────────────
-- Run this in Supabase SQL Editor.
-- Ensures users ONLY see their own sessions; null user_id rows are hidden from
-- authenticated users and only accessible via the service-role (admin) client.

-- Drop old permissive policies on sessions
DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON sessions;
DROP POLICY IF EXISTS "Users view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users create sessions" ON sessions;
DROP POLICY IF EXISTS "Users update sessions" ON sessions;

-- SELECT: authenticated users see only their own rows (never null user_id rows)
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- INSERT: service-role bypasses RLS, so this only applies to anon/user tokens.
-- Allow insert when user_id matches the authenticated user (or is NULL for anon).
CREATE POLICY "sessions_insert_own" ON sessions
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- UPDATE: authenticated users can only update their own rows
CREATE POLICY "sessions_update_own" ON sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ─── Related tables: tighten to match ────────────────────────────────────────
DROP POLICY IF EXISTS "advisor_reports_select" ON advisor_reports;
DROP POLICY IF EXISTS "advisor_reports_insert" ON advisor_reports;
DROP POLICY IF EXISTS "debates_select" ON debates;
DROP POLICY IF EXISTS "syntheses_select" ON syntheses;

CREATE POLICY "advisor_reports_select" ON advisor_reports
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "advisor_reports_insert" ON advisor_reports
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "debates_select" ON debates
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "syntheses_select" ON syntheses
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );
