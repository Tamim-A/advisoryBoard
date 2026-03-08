-- ─── Session Retention: Auto-delete sessions older than 180 days ───────────

-- Function: deletes sessions created more than 180 days ago
create or replace function delete_old_sessions()
returns void
language plpgsql
security definer
as $$
begin
  delete from sessions
  where created_at < now() - interval '180 days';
end;
$$;

-- Schedule the cleanup to run daily via pg_cron (enable pg_cron extension first)
-- Run in Supabase SQL editor after enabling pg_cron:
--   select cron.schedule('delete-old-sessions', '0 3 * * *', 'select delete_old_sessions()');
