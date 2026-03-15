import { NextRequest } from 'next/server'
import { getSession, updateSession } from '@/lib/storage'
import { runAdvisorySessionStream } from '@/lib/engine/advisory-engine'
import { hasApiKey } from '@/lib/claude/client'
import { mockSessionData } from '@/data/mockData'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getSessionDB,
  updateSessionDB,
  saveAdvisorReportDB,
  saveDebateDB,
  saveSynthesisDB,
} from '@/lib/db/sessions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Try Supabase first (admin — bypasses RLS), fall back to JSON for anonymous sessions
  let useSupabase = false
  let session = hasSupabaseServerConfig() ? await getSessionDB(params.id) : null
  if (session) {
    useSupabase = true
    // Verify the requesting user owns this session
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const sessionRow = session as { user_id?: string }
    if (user && sessionRow.user_id && sessionRow.user_id !== user.id) {
      return new Response('Forbidden', { status: 403 })
    }
  } else {
    session = getSession(params.id) as typeof session
  }

  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  // ── Don't re-run completed sessions — emit already_complete ──
  const existingStatus = (session as unknown as { status?: string }).status
  if (existingStatus === 'completed') {
    const enc = new TextEncoder()
    const doneStream = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode('event: already_complete\ndata: {}\n\n'))
        c.close()
      },
    })
    return new Response(doneStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  }

  const encoder = new TextEncoder()
  const sendEvent = (type: string, data: unknown) =>
    encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)

  // ─── Demo mode (no API key) ────────────────────────────
  if (!hasApiKey()) {
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          sendEvent('demo_mode', { message: 'وضع تجريبي — أضف ANTHROPIC_API_KEY لتشغيل حقيقي' })
        )

        for (const advisor of mockSessionData.advisors) {
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
          controller.enqueue(
            sendEvent('advisor_complete', { advisorId: advisor.id, result: advisor })
          )
        }

        await new Promise((r) => setTimeout(r, 1000))
        controller.enqueue(sendEvent('debate_complete', { points: mockSessionData.discussion }))

        await new Promise((r) => setTimeout(r, 800))
        const synthesis = {
          overallVerdict: mockSessionData.overallVerdict,
          overallConfidence: mockSessionData.overallConfidence,
          executiveSummary: mockSessionData.executiveSummary,
          topFindings: mockSessionData.topFindings,
          conditions: mockSessionData.conditions,
          verdictReason: mockSessionData.verdictReason,
          whatCouldChange: mockSessionData.whatCouldChange,
          plan: mockSessionData.plan,
        }
        controller.enqueue(sendEvent('synthesis_complete', synthesis))

        if (useSupabase) {
          await updateSessionDB(params.id, {
            status: 'completed',
            final_verdict: mockSessionData.overallVerdict,
            confidence_level: mockSessionData.overallConfidence / 100,
          })
        } else {
          updateSession(params.id, {
            status: 'completed',
            advisorResults: mockSessionData.advisors,
            debate: { points: mockSessionData.discussion },
            synthesis,
          })
        }

        controller.enqueue(sendEvent('done', {}))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // ─── Real API mode ─────────────────────────────────────
  if (useSupabase) {
    await updateSessionDB(params.id, { status: 'running' })
  } else {
    updateSession(params.id, { status: 'running' })
  }

  const s = session as unknown as Record<string, unknown>
  const sessionCompanyProfile = useSupabase
    ? (s.company_profile as Record<string, string>)
    : (s.companyProfile as Record<string, string>)

  const sessionDecision = s.decision as Record<string, string>

  const sessionType = useSupabase
    ? (s.session_type as string)
    : (s.sessionType as string)

  const additionalAdvisors = useSupabase
    ? ((s.additional_context as { additionalAdvisors?: string[] } | null)?.additionalAdvisors ?? [])
    : (s.additionalAdvisors as string[] | undefined) ?? []

  const stream = new ReadableStream({
    async start(controller) {
      // ── Keepalive: send SSE comment every 20s to prevent connection drops ──
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')) } catch { /* stream closed */ }
      }, 20_000)

      try {
        const gen = runAdvisorySessionStream({
          companyProfile: sessionCompanyProfile as never,
          decision: sessionDecision as never,
          additionalAdvisors,
          sessionType: sessionType as 'Quick' | 'Full' | 'Deep',
          specificConcerns: undefined,
        })

        const collectedAdvisors: unknown[] = []
        let collectedDebate: unknown = null
        let collectedSynthesis: unknown = null

        for await (const event of gen) {
          controller.enqueue(sendEvent(event.type, event.data))

          if (event.type === 'advisor_complete') {
            const d = event.data as { advisorId: string; result: unknown }
            collectedAdvisors.push(d.result)
            if (useSupabase) {
              await saveAdvisorReportDB(params.id, d.advisorId, d.result).catch(() => {})
            }
          } else if (event.type === 'debate_complete') {
            collectedDebate = event.data
            if (useSupabase) {
              await saveDebateDB(params.id, event.data).catch(() => {})
            }
          } else if (event.type === 'synthesis_complete') {
            collectedSynthesis = event.data
            if (useSupabase) {
              await saveSynthesisDB(params.id, event.data).catch(() => {})
              const syn = event.data as { overallVerdict?: string; overallConfidence?: number }
              await updateSessionDB(params.id, {
                status: 'completed',
                final_verdict: syn.overallVerdict,
                confidence_level: syn.overallConfidence ? syn.overallConfidence / 100 : undefined,
              }).catch(() => {})
            }
          } else if (event.type === 'done' && !useSupabase) {
            const d = event.data as { advisorResults: unknown[]; debate: unknown; synthesis: unknown }
            updateSession(params.id, {
              status: 'completed',
              advisorResults: d.advisorResults,
              debate: d.debate,
              synthesis: d.synthesis,
            })
          }
        }
      } catch (err) {
        console.error('stream error:', err)
        controller.enqueue(sendEvent('error', { message: 'حدث خطأ في التحليل' }))
        if (useSupabase) {
          await updateSessionDB(params.id, { status: 'failed' }).catch(() => {})
        } else {
          updateSession(params.id, { status: 'error' })
        }
      } finally {
        clearInterval(heartbeat)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
