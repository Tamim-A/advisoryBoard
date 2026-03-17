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

// جلب جلسة كاملة مع تقارير المستشارين والتوليف والنقاش
export interface FullSessionData {
  session: SessionRow
  advisorResults: unknown[]
  synthesis: unknown | null
  debate: unknown | null
}

export async function getSessionWithResultsDB(sessionId: string): Promise<FullSessionData | null> {
  const session = await getSessionDB(sessionId)
  if (!session) return null

  // Always fetch results — even for running sessions (partial results from first execution)
  const [reportsRes, synthRes, debateRes] = await Promise.all([
    supabaseAdmin.from('advisor_reports').select('advisor_type, report').eq('session_id', sessionId),
    supabaseAdmin.from('syntheses').select('synthesis_data').eq('session_id', sessionId).limit(1),
    supabaseAdmin.from('debates').select('debate_data').eq('session_id', sessionId).limit(1),
  ])

  return {
    session,
    advisorResults: (reportsRes.data ?? []).map((r: { advisor_type: string; report: unknown }) => r.report),
    synthesis: (synthRes.data ?? [])[0]?.synthesis_data ?? null,
    debate: (debateRes.data ?? [])[0]?.debate_data ?? null,
  }
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

// عدد جلسات المستخدم (للتحقق من حد التجربة المجانية)
export async function getUserSessionCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) return 0
  return count ?? 0
}

// عدد الجلسات اليومي على مستوى المنصة كاملة (UTC+3 لتوقيت السعودية)
export async function getDailyPlatformSessionCount(): Promise<number> {
  // حساب بداية اليوم بتوقيت السعودية (UTC+3)
  const now = new Date()
  const saudiOffset = 3 * 60 // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const saudiDate = new Date(now)
  if (utcMinutes + saudiOffset >= 1440) {
    saudiDate.setUTCDate(saudiDate.getUTCDate() + 1)
  }
  const yyyy = saudiDate.getUTCFullYear()
  const mm = String(saudiDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(saudiDate.getUTCDate()).padStart(2, '0')
  // بداية اليوم السعودي بالـ UTC = منتصف الليل السعودي - 3 ساعات = 21:00 UTC أمس
  const todayStartUTC = new Date(`${yyyy}-${mm}-${dd}T00:00:00+03:00`).toISOString()

  const { count, error } = await supabaseAdmin
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStartUTC)

  if (error) return 0
  return count ?? 0
}

// تحديث حالة الجلسة (admin — يتجاوز RLS)
export async function updateSessionDB(
  sessionId: string,
  updates: Partial<{
    status: string
    final_verdict: string
    confidence_level: number
  }>
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select('id, status')
  if (error) {
    console.error(`[DB] updateSessionDB failed for ${sessionId}:`, error.message)
    throw new Error(`[DB] updateSessionDB failed: ${error.message}`)
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.warn(`[DB] updateSessionDB: UPDATE matched 0 rows for session ${sessionId}`)
  }
}

// حفظ تقرير مستشار
export async function saveAdvisorReportDB(
  sessionId: string,
  advisorType: string,
  report: unknown
): Promise<void> {
  const { error } = await supabaseAdmin.from('advisor_reports').insert({
    session_id: sessionId,
    advisor_type: advisorType,
    report,
    status: 'completed',
  })
  if (error) throw new Error(`[DB] saveAdvisorReport failed for ${advisorType}: ${error.message}`)
}

// حفظ نتيجة النقاش
export async function saveDebateDB(sessionId: string, debateData: unknown): Promise<void> {
  const { error } = await supabaseAdmin.from('debates').insert({ session_id: sessionId, debate_data: debateData })
  if (error) throw new Error(`[DB] saveDebate failed: ${error.message}`)
}

// حفظ التوحيد النهائي
export async function saveSynthesisDB(sessionId: string, synthesisData: unknown): Promise<void> {
  const { error } = await supabaseAdmin
    .from('syntheses')
    .insert({ session_id: sessionId, synthesis_data: synthesisData })
  if (error) throw new Error(`[DB] saveSynthesis failed: ${error.message}`)
}

// ─── الأسئلة التوضيحية ─────────────────────────────────

export interface ClarifyingQuestion {
  question: string
  answer: string
}

export async function saveQuestionsDB(
  sessionId: string,
  questions: ClarifyingQuestion[]
): Promise<void> {
  await supabaseAdmin
    .from('clarifying_questions')
    .upsert({
      session_id: sessionId,
      questions,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'session_id' })
}

export async function getQuestionsDB(
  sessionId: string
): Promise<ClarifyingQuestion[] | null> {
  const { data } = await supabaseAdmin
    .from('clarifying_questions')
    .select('questions, submitted_at')
    .eq('session_id', sessionId)
    .single()
  if (!data?.submitted_at) return null
  return (data.questions as ClarifyingQuestion[]) ?? null
}

// ─── ملفات الجلسة ───────────────────────────────────────

export interface SessionFile {
  id: string
  file_name: string
  storage_path: string
  file_type: string
  file_size: number
  extracted_text: string | null
}

export async function saveFileDB(
  sessionId: string,
  file: Omit<SessionFile, 'id'>
): Promise<SessionFile> {
  const { data, error } = await supabaseAdmin
    .from('session_files')
    .insert({ session_id: sessionId, ...file })
    .select()
    .single()
  if (error) throw error
  return data as SessionFile
}

export async function getSessionFilesDB(
  sessionId: string
): Promise<SessionFile[]> {
  const { data } = await supabaseAdmin
    .from('session_files')
    .select('id, file_name, storage_path, file_type, file_size, extracted_text')
    .eq('session_id', sessionId)
  return (data ?? []) as SessionFile[]
}

export async function deleteFileDB(fileId: string): Promise<void> {
  await supabaseAdmin.from('session_files').delete().eq('id', fileId)
}
