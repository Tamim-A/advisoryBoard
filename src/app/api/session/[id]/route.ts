import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { getSessionWithResultsDB } from '@/lib/db/sessions'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ─── Try Supabase first, then JSON fallback ────────────
  if (hasSupabaseServerConfig()) {
    const full = await getSessionWithResultsDB(params.id)
    if (full) {
      return NextResponse.json({
        ...full.session,
        advisorResults: full.advisorResults,
        synthesis: full.synthesis,
        debate: full.debate,
      })
    }
    // Not in Supabase → try JSON storage (anonymous sessions)
  }

  const session = getSession(params.id)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  return NextResponse.json(session)
}
