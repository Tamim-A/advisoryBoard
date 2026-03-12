import { NextRequest, NextResponse } from 'next/server'
import { saveSession } from '@/lib/storage'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSessionDB, getUserSessionCount } from '@/lib/db/sessions'

const FREE_SESSION_LIMIT = 2

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

function sanitizeRecord(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    out[key] = sanitize(obj[key])
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') ?? 0)
    if (contentLength > 10_240) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }

    const body = await req.json()
    const { companyProfile, decision, additionalAdvisors, sessionType, specificConcerns } = body

    if (!companyProfile || !decision) {
      return NextResponse.json({ error: 'companyProfile and decision are required' }, { status: 400 })
    }

    const cleanProfile = sanitizeRecord(companyProfile as Record<string, unknown>)
    const cleanDecision = sanitizeRecord(decision as Record<string, unknown>)
    const cleanConcerns = sanitize(specificConcerns)

    const title = cleanDecision.title || cleanProfile.company_name || 'جلسة استشارية'

    // ─── Supabase mode (production path) ──────────────────
    if (hasSupabaseServerConfig()) {
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const sessionCount = await getUserSessionCount(user.id)
        if (sessionCount >= FREE_SESSION_LIMIT) {
          return NextResponse.json(
            { error: 'trial_limit_reached', limit: FREE_SESSION_LIMIT },
            { status: 403 }
          )
        }
      }

      const session = await createSessionDB({
        userId: user?.id ?? null,
        title,
        companyProfile: cleanProfile,
        decision: cleanDecision,
        additionalContext: { additionalAdvisors, specificConcerns: cleanConcerns },
        sessionType: sessionType || 'Full',
      })
      return NextResponse.json({ sessionId: session.id })
    }

    // ─── JSON storage fallback (localhost without Supabase only) ──
    const sessionId = saveSession({
      companyProfile: cleanProfile,
      decision: cleanDecision,
      additionalAdvisors: additionalAdvisors || [],
      sessionType: sessionType || 'Full',
      specificConcerns: cleanConcerns,
      status: 'pending',
    })

    return NextResponse.json({ sessionId })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('create session error:', err)
    }
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
