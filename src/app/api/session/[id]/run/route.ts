import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/storage'
import { runAdvisorySession } from '@/lib/engine/advisory-engine'
import { hasApiKey } from '@/lib/claude/client'
import { mockSessionData } from '@/data/mockData'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import {
  getSessionDB,
  updateSessionDB,
  saveAdvisorReportDB,
  saveDebateDB,
  saveSynthesisDB,
} from '@/lib/db/sessions'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Try Supabase first (admin — bypasses RLS), fall back to JSON for anonymous sessions
  let useSupabase = false
  let session = hasSupabaseServerConfig() ? await getSessionDB(params.id) : null
  if (session) {
    useSupabase = true
  } else {
    session = getSession(params.id) as typeof session
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Already completed — return cached results
  const sessionAny = session as unknown as Record<string, unknown>
  const sessionStatus = sessionAny.status as string
  const sessionSynthesis = sessionAny.synthesis
  if (sessionStatus === 'completed' && sessionSynthesis) {
    return NextResponse.json(session)
  }

  // Mark as running
  if (useSupabase) {
    await updateSessionDB(params.id, { status: 'running' }).catch(() => {})
  } else {
    updateSession(params.id, { status: 'running' })
  }

  const companyProfile = useSupabase
    ? (sessionAny.company_profile as Record<string, string>)
    : (sessionAny.companyProfile as Record<string, string>)
  const decision = sessionAny.decision as Record<string, string>
  const additionalAdvisors = useSupabase
    ? ((sessionAny.additional_context as { additionalAdvisors?: string[] } | null)?.additionalAdvisors ?? [])
    : (sessionAny.additionalAdvisors as string[] | undefined) ?? []
  const sessionType = useSupabase
    ? (sessionAny.session_type as string)
    : (sessionAny.sessionType as string)

  // Demo mode — no API key
  if (!hasApiKey()) {
    const syn = {
      overallVerdict: mockSessionData.overallVerdict,
      overallConfidence: mockSessionData.overallConfidence,
      executiveSummary: mockSessionData.executiveSummary,
      topFindings: mockSessionData.topFindings,
      conditions: mockSessionData.conditions,
      verdictReason: mockSessionData.verdictReason,
      whatCouldChange: mockSessionData.whatCouldChange,
      plan: mockSessionData.plan,
    }
    if (useSupabase) {
      await updateSessionDB(params.id, {
        status: 'completed',
        final_verdict: mockSessionData.overallVerdict,
        confidence_level: mockSessionData.overallConfidence / 100,
      }).catch(() => {})
    } else {
      updateSession(params.id, {
        status: 'completed',
        advisorResults: mockSessionData.advisors,
        debate: { points: mockSessionData.discussion },
        synthesis: syn,
      })
    }
    return NextResponse.json({ ...session, status: 'completed', synthesis: syn, demoMode: true })
  }

  try {
    const result = await runAdvisorySession({
      companyProfile: companyProfile as never,
      decision: decision as never,
      additionalAdvisors,
      sessionType: sessionType as 'Quick' | 'Full' | 'Deep',
      specificConcerns: undefined,
    })

    if (useSupabase) {
      for (const advisor of result.advisorResults) {
        await saveAdvisorReportDB(params.id, (advisor as { id: string }).id, advisor).catch(() => {})
      }
      if (result.debate) {
        await saveDebateDB(params.id, result.debate).catch(() => {})
      }
      if (result.synthesis) {
        await saveSynthesisDB(params.id, result.synthesis).catch(() => {})
      }
      const syn = result.synthesis as { overallVerdict?: string; overallConfidence?: number }
      await updateSessionDB(params.id, {
        status: 'completed',
        final_verdict: syn.overallVerdict,
        confidence_level: syn.overallConfidence ? syn.overallConfidence / 100 : undefined,
      }).catch(() => {})
      return NextResponse.json({ id: params.id, status: 'completed', ...result })
    } else {
      const updated = updateSession(params.id, {
        status: 'completed',
        advisorResults: result.advisorResults,
        debate: result.debate,
        synthesis: result.synthesis,
      })
      return NextResponse.json(updated)
    }
  } catch (err) {
    console.error('advisory engine error:', err)
    if (useSupabase) {
      await updateSessionDB(params.id, { status: 'failed' }).catch(() => {})
    } else {
      updateSession(params.id, { status: 'error' })
    }
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 })
  }
}
