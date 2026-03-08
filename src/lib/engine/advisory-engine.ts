import { callAdvisor } from '../claude/client'
import { getWeights } from '../prompts/config/weights'
import { buildDebateMessage, SYSTEM_PROMPT as DEBATE_PROMPT } from '../prompts/debate-engine'
import { buildSynthesisMessage, SYSTEM_PROMPT as SYNTHESIS_PROMPT } from '../prompts/synthesis-engine'
import * as strategic from '../prompts/strategic-advisor'
import * as financial from '../prompts/financial-advisor'
import * as market from '../prompts/market-advisor'
import * as operational from '../prompts/operational-advisor'
import * as legal from '../prompts/legal-advisor'
import * as technical from '../prompts/technical-advisor'
import * as growth from '../prompts/growth-advisor'
import * as risk from '../prompts/risk-advisor'
import * as sustainability from '../prompts/sustainability-advisor'
import {
  type AdvisorOutput,
  type CompanyProfile,
  type Decision,
  type DebateOutput,
  type SessionInput,
  type SessionResult,
  type SynthesisOutput,
} from '../prompts/types'

// ─── Active vs coming-soon advisors ────────────────────
export const ACTIVE_ADVISORS = ['strategic', 'financial', 'market', 'technical']
export const COMING_SOON_ADVISORS = ['operational', 'legal', 'growth', 'risk', 'sustainability']

// ─── Advisor registry ───────────────────────────────────
const ADVISOR_REGISTRY: Record<
  string,
  {
    module: { SYSTEM_PROMPT: string; buildUserMessage: (c: CompanyProfile, d: Decision) => string }
    name: string
    icon: string
  }
> = {
  strategic:    { module: strategic,    name: 'المستشار الاستراتيجي', icon: '🎯' },
  financial:    { module: financial,    name: 'المستشار المالي',       icon: '💰' },
  market:       { module: market,       name: 'مستشار السوق',          icon: '📊' },
  operational:  { module: operational,  name: 'المستشار التشغيلي',     icon: '⚙️' },
  legal:        { module: legal,        name: 'المستشار القانوني',     icon: '⚖️' },
  technical:    { module: technical,    name: 'المستشار التقني',       icon: '🔧' },
  growth:       { module: growth,       name: 'مستشار النمو',          icon: '🚀' },
  risk:         { module: risk,         name: 'مستشار المخاطر',        icon: '🛡️' },
  sustainability: { module: sustainability, name: 'مستشار الاستدامة',  icon: '🌱' },
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ─── Timeout wrapper ─────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`)),
      ms
    )
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

// ─── Fallback report when an advisor fails ─────────────
function createFallbackReport(advisorId: string, reason = 'خطأ تقني'): AdvisorOutput {
  const config = ADVISOR_REGISTRY[advisorId]
  return {
    id: advisorId,
    name: config?.name ?? advisorId,
    icon: config?.icon ?? '🎯',
    verdict: 'APPROVE_WITH_CONDITIONS',
    confidence: 0,
    summary: `تعذّر إكمال التحليل — ${reason}.`,
    scorecard: [{ dimension: 'التقييم العام', score: 0 }],
    keyPoints: ['لم يتمكن المستشار من إكمال تحليله في هذه الجلسة.'],
    risks: [],
    scenarios: {
      best:  { title: 'غير متاح', description: 'تعذّر التحليل' },
      base:  { title: 'غير متاح', description: 'تعذّر التحليل' },
      worst: { title: 'غير متاح', description: 'تعذّر التحليل' },
    },
    strongestObjection: 'غير متاح.',
    recommendation: 'أعد المحاولة في جلسة جديدة.',
    _isFallback: true,
  } as AdvisorOutput & { _isFallback: boolean }
}

// ─── Run a single advisor (with rate-limit-aware retry) ─
async function runSingleAdvisor(
  advisorId: string,
  company: CompanyProfile,
  decision: Decision
): Promise<AdvisorOutput> {
  const config = ADVISOR_REGISTRY[advisorId]
  if (!config) throw new Error(`Unknown advisor: ${advisorId}`)

  const userMessage = config.module.buildUserMessage(company, decision)

  const ADVISOR_TIMEOUT_MS = 120_000 // 2 minutes per advisor

  try {
    // callAdvisor already handles 429 retry internally (client.ts)
    const result = await withTimeout(
      callAdvisor(config.module.SYSTEM_PROMPT, userMessage, 6000),
      ADVISOR_TIMEOUT_MS,
      advisorId
    ) as unknown as AdvisorOutput
    return { ...result, id: advisorId, name: config.name, icon: config.icon }
  } catch (error: unknown) {
    const e = error as { status?: number; error?: { type?: string }; message?: string }
    const isTimeout = e?.message?.startsWith('[Timeout]')
    // If rate limit still hits after client retry, wait longer and try once more
    if (!isTimeout && (e?.status === 429 || e?.error?.type === 'rate_limit_error')) {
      console.log(`[Engine] Rate limit for ${advisorId} — waiting 20s for final retry...`)
      await delay(20000)
      try {
        const result = await withTimeout(
          callAdvisor(config.module.SYSTEM_PROMPT, userMessage, 6000),
          ADVISOR_TIMEOUT_MS,
          advisorId
        ) as unknown as AdvisorOutput
        return { ...result, id: advisorId, name: config.name, icon: config.icon }
      } catch {
        console.error(`[Engine] Final retry failed for ${advisorId}`)
        return createFallbackReport(advisorId, 'تجاوز حد الطلبات')
      }
    }
    const reason = isTimeout ? 'استغرق التحليل وقتاً أطول من المتوقع' : 'خطأ تقني'
    console.error(`[Engine] Error for ${advisorId}:`, error)
    return createFallbackReport(advisorId, reason)
  }
}

// ─── Run advisors sequentially with delay between each ──
async function runAdvisorsSequential(
  advisors: string[],
  company: CompanyProfile,
  decision: Decision
): Promise<AdvisorOutput[]> {
  const results: AdvisorOutput[] = []

  for (let i = 0; i < advisors.length; i++) {
    const advisorId = advisors[i]
    console.log(`[Engine] Starting advisor ${i + 1}/${advisors.length}: ${advisorId}`)
    const result = await runSingleAdvisor(advisorId, company, decision)
    results.push(result)
    console.log(`[Engine] Completed: ${advisorId}`)

    // Wait 5 seconds between advisors to stay within rate limits
    if (i < advisors.length - 1) {
      console.log('[Engine] Waiting 5 seconds before next advisor...')
      await delay(5000)
    }
  }

  return results
}

// ─── Filter out fallback (failed) advisor results ───────
function successfulAdvisors(results: AdvisorOutput[]): AdvisorOutput[] {
  return results.filter((a) => !(a as AdvisorOutput & { _isFallback?: boolean })._isFallback)
}

// ─── Run debate engine ──────────────────────────────────
async function runDebate(advisorResults: AdvisorOutput[]): Promise<DebateOutput> {
  const usable = successfulAdvisors(advisorResults)
  if (usable.length < 2) return { points: [] }
  try {
    const userMessage = buildDebateMessage(usable)
    const result = await callAdvisor(DEBATE_PROMPT, userMessage, 6000) as unknown as DebateOutput
    return result
  } catch {
    return { points: [] }
  }
}

// ─── Run synthesis engine ───────────────────────────────
async function runSynthesis(
  advisorResults: AdvisorOutput[],
  debate: DebateOutput | null,
  weights: Record<string, number>,
  decision: Decision
): Promise<SynthesisOutput> {
  // Only pass successful advisor results to synthesis
  const usable = successfulAdvisors(advisorResults)
  const forSynthesis = usable.length > 0 ? usable : advisorResults // fallback: use all if none succeeded
  console.log(`[Engine] Synthesis using ${forSynthesis.length}/${advisorResults.length} advisors`)
  const userMessage = buildSynthesisMessage(forSynthesis, debate, weights, decision)
  const result = await callAdvisor(SYNTHESIS_PROMPT, userMessage, 6000, true) as unknown as SynthesisOutput
  return result
}

// ─── Main orchestrator ──────────────────────────────────
export async function runAdvisorySession(sessionData: SessionInput): Promise<SessionResult> {
  const { companyProfile, decision, additionalAdvisors, sessionType } = sessionData

  // Only run advisors that are currently active (filter out coming-soon)
  const requested = additionalAdvisors && additionalAdvisors.length > 0
    ? additionalAdvisors
    : ['strategic', 'financial', 'market', 'technical']
  const allAdvisors = requested.filter((a) => ACTIVE_ADVISORS.includes(a))

  // Run advisors sequentially to avoid rate limit
  const advisorResults = await runAdvisorsSequential(allAdvisors, companyProfile, decision)

  // Debate (Full + Deep only)
  let debate: DebateOutput | null = null
  if (sessionType !== 'Quick') {
    debate = await runDebate(advisorResults)
  }

  // Synthesis
  const weights = getWeights(decision.category)
  const synthesis = await runSynthesis(advisorResults, debate, weights, decision)

  return { advisorResults, debate, synthesis }
}

// ─── Streaming version for SSE ──────────────────────────
export async function* runAdvisorySessionStream(
  sessionData: SessionInput,
  onAdvisorComplete?: (advisorId: string, result: AdvisorOutput) => void
): AsyncGenerator<{ type: string; data: unknown }> {
  const { companyProfile, decision, additionalAdvisors, sessionType } = sessionData

  // Only run advisors that are currently active (filter out coming-soon)
  const requested = additionalAdvisors && additionalAdvisors.length > 0
    ? additionalAdvisors
    : ['strategic', 'financial', 'market', 'technical']
  const allAdvisors = requested.filter((a) => ACTIVE_ADVISORS.includes(a))

  // Run sequentially — yield each advisor_complete event as it finishes
  const advisorResults: AdvisorOutput[] = []

  for (let i = 0; i < allAdvisors.length; i++) {
    const advisorId = allAdvisors[i]
    console.log(`[Engine] Starting advisor ${i + 1}/${allAdvisors.length}: ${advisorId}`)

    try {
      const result = await runSingleAdvisor(advisorId, companyProfile, decision)
      advisorResults.push(result)
      if (onAdvisorComplete) onAdvisorComplete(advisorId, result)
      yield { type: 'advisor_complete', data: { advisorId, result } }
      console.log(`[Engine] Completed: ${advisorId}`)
    } catch {
      yield { type: 'advisor_error', data: { advisorId } }
    }

    // 5-second delay between advisors
    if (i < allAdvisors.length - 1) {
      console.log('[Engine] Waiting 5 seconds before next advisor...')
      await delay(5000)
    }
  }

  // Debate
  let debate: DebateOutput | null = null
  if (sessionType !== 'Quick') {
    debate = await runDebate(advisorResults)
    yield { type: 'debate_complete', data: debate }
  }

  // Synthesis
  const weights = getWeights(decision.category)
  const synthesis = await runSynthesis(advisorResults, debate, weights, decision)
  yield { type: 'synthesis_complete', data: synthesis }

  yield { type: 'done', data: { advisorResults, debate, synthesis } }
}
