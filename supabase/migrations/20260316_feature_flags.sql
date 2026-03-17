-- جدول Feature Flags للأدمن
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  label_ar TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- لا RLS — هذا الجدول يُقرأ من admin client فقط
-- الأدمن يعدّل عبر service role key

-- القيم الافتراضية
INSERT INTO feature_flags (key, enabled, label_ar) VALUES
  ('mode_quick',            false, 'وضع التحليل السريع'),
  ('mode_deep',             false, 'وضع التحليل العميق'),
  ('advisor_legal',         false, 'المستشار القانوني'),
  ('advisor_growth',        false, 'مستشار النمو'),
  ('advisor_risk',          false, 'مستشار المخاطر'),
  ('advisor_sustainability',false, 'مستشار الاستدامة'),
  ('feature_discussion',    false, 'نقاش المستشارين')
ON CONFLICT (key) DO NOTHING;
