import { supabaseAdmin } from '@/lib/supabase/admin'

export interface SessionRow {
  id: string
  user_id: string | null
  title: string
  company_profile: Record<string, unknown>
  decision: Record<string, unknown>
  additional_context: Record<string, unknown> | null
  session_type: string
  status: string
  final_verdict: string | null
  confidence_level: number | null
  created_at: string
  updated_at: string
}

// إنشاء جلسة جديدة
export async function createSessionDB(data: {
  userId: string | null
  title: string
  companyProfile: Record<string, unknown>
  decision: Record<string, unknown>
  additionalContext?: Record<string, unknown>
  sessionType: string
}): Promise<SessionRow> {
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: data.userId,
      title: data.title,
      company_profile: data.companyProfile,
      decision: data.decision,
      additional_context: data.additionalContext ?? null,
      session_type: data.sessionType.toLowerCase(),
      status: 'created',
    })
    .select()
    .single()

  if (error) throw error
  return session as SessionRow
}

// جلب جلسة بالـ ID — يستخدم admin client لتجاوز RLS (يعمل بدون auth)
export async function getSessionDB(sessionId: string): Promise<SessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) return null
  return data as SessionRow
}

// جلب كل جلسات مستخدم
export async function getUserSessionsDB(userId: string): Promise<SessionRow[]> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('id, title, session_type, status, final_verdict, confidence_level, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as SessionRow[]
}

// تحديث حالة الجلسة (admin — يتجاوز RLS)
export async function updateSessionDB(
  sessionId: string,
  updates: Partial<{
    status: string
    final_verdict: string
    confidence_level: number
    advisor_results: unknown[]
    debate: unknown
    synthesis: unknown
  }>
): Promise<void> {
  await supabaseAdmin
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}

// حفظ تقرير مستشار
export async function saveAdvisorReportDB(
  sessionId: string,
  advisorType: string,
  report: unknown
): Promise<void> {
  await supabaseAdmin.from('advisor_reports').insert({
    session_id: sessionId,
    advisor_type: advisorType,
    report,
    status: 'completed',
  })
}

// حفظ نتيجة النقاش
export async function saveDebateDB(sessionId: string, debateData: unknown): Promise<void> {
  await supabaseAdmin.from('debates').insert({ session_id: sessionId, debate_data: debateData })
}

// حفظ التوحيد النهائي
export async function saveSynthesisDB(sessionId: string, synthesisData: unknown): Promise<void> {
  await supabaseAdmin
    .from('syntheses')
    .insert({ session_id: sessionId, synthesis_data: synthesisData })
}
