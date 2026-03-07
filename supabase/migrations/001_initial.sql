-- ═══════════════════════════════════════════════════════
-- Advisory Board — Initial Database Schema
-- شغّل هذا في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الجلسات الاستشارية
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company_profile JSONB NOT NULL DEFAULT '{}',
  decision JSONB NOT NULL DEFAULT '{}',
  additional_context JSONB,
  session_type TEXT NOT NULL DEFAULT 'quick'
    CHECK (session_type IN ('quick', 'full', 'deep')),
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'running', 'completed', 'failed')),
  final_verdict TEXT,
  confidence_level DECIMAL,
  advisor_results JSONB,
  debate JSONB,
  synthesis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تقارير المستشارين
CREATE TABLE IF NOT EXISTS advisor_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  advisor_type TEXT NOT NULL,
  report JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول نتائج النقاش
CREATE TABLE IF NOT EXISTS debates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  debate_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التوحيد النهائي
CREATE TABLE IF NOT EXISTS syntheses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  synthesis_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE syntheses ENABLE ROW LEVEL SECURITY;

-- سياسات profiles
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- سياسات sessions
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- سياسات advisor_reports
CREATE POLICY "advisor_reports_select" ON advisor_reports
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "advisor_reports_insert" ON advisor_reports
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- سياسات debates
CREATE POLICY "debates_select" ON debates
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- سياسات syntheses
CREATE POLICY "syntheses_select" ON syntheses
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- ─── Trigger: إنشاء profile تلقائياً ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Indexes للأداء ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisor_reports_session_id ON advisor_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_debates_session_id ON debates(session_id);
CREATE INDEX IF NOT EXISTS idx_syntheses_session_id ON syntheses(session_id);
