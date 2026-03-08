import { NextRequest, NextResponse } from 'next/server'
import { saveSession } from '@/lib/storage'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSessionDB } from '@/lib/db/sessions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyProfile, decision, additionalAdvisors, sessionType, specificConcerns } = body

    if (!companyProfile || !decision) {
      return NextResponse.json({ error: 'companyProfile and decision are required' }, { status: 400 })
    }

    const title = (decision.title as string) || (companyProfile.company_name as string) || 'جلسة استشارية'

    // ─── Supabase mode (production path) ──────────────────
    // Always use Supabase when configured — even for unauthenticated users (user_id = null).
    // This is the only writable storage on Vercel (filesystem is read-only).
    if (hasSupabaseServerConfig()) {
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      const session = await createSessionDB({
        userId: user?.id ?? null,
        title,
        companyProfile,
        decision,
        additionalContext: { additionalAdvisors, specificConcerns },
        sessionType: sessionType || 'Full',
      })
      return NextResponse.json({ sessionId: session.id })
    }

    // ─── JSON storage fallback (localhost without Supabase only) ──
    const sessionId = saveSession({
      companyProfile,
      decision,
      additionalAdvisors: additionalAdvisors || [],
      sessionType: sessionType || 'Full',
      specificConcerns,
      status: 'pending',
    })

    return NextResponse.json({ sessionId })
  } catch (err) {
    console.error('create session error:', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
