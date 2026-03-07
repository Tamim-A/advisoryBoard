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

    // ─── Supabase mode (authenticated users only) ──────────
    if (hasSupabaseServerConfig()) {
      // TODO: re-enable mandatory auth when Auth is fully activated
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      if (user) {
        // Authenticated → save to Supabase DB
        const session = await createSessionDB({
          userId: user.id,
          title,
          companyProfile,
          decision,
          additionalContext: { additionalAdvisors, specificConcerns },
          sessionType: sessionType || 'Full',
        })
        return NextResponse.json({ sessionId: session.id })
      }
      // Not authenticated → fall through to JSON storage below
    }

    // ─── JSON storage fallback ─────────────────────────────
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
