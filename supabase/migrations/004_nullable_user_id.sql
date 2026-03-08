-- ─── Allow anonymous sessions (user_id can be NULL) ─────────────────────────
-- This lets the app create sessions for unauthenticated users on Vercel,
-- where the filesystem is read-only and Supabase is the only writable storage.

-- Drop the NOT NULL constraint from sessions.user_id
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;

-- The foreign key reference to auth.users still applies when user_id IS NOT NULL,
-- but NULL values are allowed (standard PostgreSQL FK behaviour).
