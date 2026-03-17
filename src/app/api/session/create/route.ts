import { NextRequest, NextResponse } from 'next/server'
import { saveSession, getDailySessionCountLocal } from '@/lib/storage'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSessionDB, getUserSessionCount, getDailyPlatformSessionCount } from '@/lib/db/sessions'
import { getUserPlan } from '@/lib/db/plans'

const DAILY_PLATFORM_LIMIT = 15
const VIP_ONLY_SESSION_TYPES = ['Quick', 'Deep']

// Per-field max lengths to prevent oversized prompts reaching the AI provider
const FIELD_LIMITS: Record<string, number> = {
  title: 300,
  description: 2000,
  primary_goal: 500,
  alternatives: 1000,
  constraints: 1000,
  company_name: 200,
  sector: 200,
  company_size: 100,
  stage: 100,
  annual_revenue: 100,
  team_size: 100,
  estimated_cost: 200,
  expected_timeline: 200,
}

function sanitize(value: unknown, fieldName?: string): string {
  if (typeof value !== 'string') return ''
  let s = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\[SYSTEM\]/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/ignore\s+previous\s+instructions?/gi, '')
    .trim()
  // Apply per-field length limit
  const limit = (fieldName && FIELD_LIMITS[fieldName]) || 2000
  if (s.length > limit) s = s.slice(0, limit)
  return s
}

function sanitizeRecord(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    out[key] = sanitize(obj[key], key)
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
    const chosenType = sessionType || 'Full'

    const title = cleanDecision.title || cleanProfile.company_name || 'جلسة استشارية'

    // ─── Supabase mode (production path) ──────────────────
    if (hasSupabaseServerConfig()) {
      // ── حد يومي عام: 15 جلسة على مستوى المنصة ──
      const dailyCount = await getDailyPlatformSessionCount()
      if (dailyCount >= DAILY_PLATFORM_LIMIT) {
        return NextResponse.json(
          { error: 'daily_platform_limit', dailyCount, limit: DAILY_PLATFORM_LIMIT },
          { status: 429 }
        )
      }

      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      let isVipUser = false
      if (user) {
        const plan = await getUserPlan(user.id, user.email ?? '')
        isVipUser = plan.plan_type === 'vip' || plan.plan_type === 'vip_plus'

        // ── حد جلسات المستخدم الشخصي ──
        const sessionCount = await getUserSessionCount(user.id)
        if (sessionCount >= plan.session_limit) {
          return NextResponse.json(
            { error: 'trial_limit_reached', limit: plan.session_limit },
            { status: 403 }
          )
        }
      }

      // ── فحص صلاحية نوع الجلسة: Quick و Deep لـ VIP فقط ──
      if (VIP_ONLY_SESSION_TYPES.includes(chosenType) && !isVipUser) {
        return NextResponse.json(
          { error: 'session_type_restricted', sessionType: chosenType },
          { status: 403 }
        )
      }

      const session = await createSessionDB({
        userId: user?.id ?? null,
        title,
        companyProfile: cleanProfile,
        decision: cleanDecision,
        additionalContext: { additionalAdvisors, specificConcerns: cleanConcerns },
        sessionType: chosenType,
      })
      return NextResponse.json({ sessionId: session.id })
    }

    // ─── JSON storage fallback (localhost without Supabase only) ──
    // ── حد يومي عام (JSON mode) ──
    const localDaily = getDailySessionCountLocal()
    if (localDaily >= DAILY_PLATFORM_LIMIT) {
      return NextResponse.json(
        { error: 'daily_platform_limit', dailyCount: localDaily, limit: DAILY_PLATFORM_LIMIT },
        { status: 429 }
      )
    }

    const sessionId = saveSession({
      companyProfile: cleanProfile,
      decision: cleanDecision,
      additionalAdvisors: additionalAdvisors || [],
      sessionType: chosenType,
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
