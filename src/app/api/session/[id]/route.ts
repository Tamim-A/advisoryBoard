import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { getSessionDB } from '@/lib/db/sessions'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ─── Try Supabase first, then JSON fallback ────────────
  if (hasSupabaseServerConfig()) {
    const session = await getSessionDB(params.id)
    if (session) return NextResponse.json(session)
    // Not in Supabase → try JSON storage (anonymous sessions)
  }

  const session = getSession(params.id)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  return NextResponse.json(session)
}
