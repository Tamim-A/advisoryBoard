-- جدول الملفات المرفوعة مع الجلسة
CREATE TABLE IF NOT EXISTS session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_session_files" ON session_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_files.session_id
        AND sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_session_files_session_id
  ON session_files(session_id);
