import { NextRequest, NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { getSessionDB, updateSessionDB, saveQuestionsDB } from '@/lib/db/sessions'
import { getSession, updateSession } from '@/lib/storage'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json() as { questions: { question: string; answer: string }[] }
  const { questions } = body

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 })
  }

  // Validate each answer is non-empty
  for (const q of questions) {
    if (!q.question || !q.answer?.trim()) {
      return NextResponse.json({ error: 'All questions must be answered' }, { status: 400 })
    }
    // Limit answer length
    if (q.answer.length > 500) {
      return NextResponse.json({ error: 'Answer too long (max 500 chars)' }, { status: 400 })
    }
  }

  const useSupabase = hasSupabaseServerConfig()

  if (useSupabase) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbSession = await getSessionDB(params.id)
    if (!dbSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (dbSession.user_id && dbSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await saveQuestionsDB(params.id, questions)
    await updateSessionDB(params.id, { status: 'questions_complete' as 'completed' })
  } else {
    const session = getSession(params.id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // For JSON storage, save questions inside session object
    updateSession(params.id, {
      status: 'pending', // JSON storage: mark as pending (questions answered)
      clarifyingAnswers: questions,
    } as Parameters<typeof updateSession>[1])
  }

  return NextResponse.json({ success: true })
}
