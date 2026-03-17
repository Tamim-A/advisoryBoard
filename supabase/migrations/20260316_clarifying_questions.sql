-- جدول الأسئلة التوضيحية قبل التحليل
CREATE TABLE IF NOT EXISTS clarifying_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  -- [{question: "...", answer: "..."}]
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(session_id)
);

ALTER TABLE clarifying_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_clarifying_questions" ON clarifying_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = clarifying_questions.session_id
        AND sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_clarifying_questions_session_id
  ON clarifying_questions(session_id);
