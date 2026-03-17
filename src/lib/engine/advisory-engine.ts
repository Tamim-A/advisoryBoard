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
export const ACTIVE_ADVISORS = ['strategic', 'financial', 'market', 'technical', 'operational']
export const COMING_SOON_ADVISORS = ['legal', 'growth', 'risk', 'sustainability']

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
function createFallbackReport(advisorId: string, reason = 'يرجى الضغط على إعادة المحاولة لإكمال التحليل'): AdvisorOutput {
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

// ─── Truncate helper ─────────────────────────────────────
function truncField(s: string | undefined, maxLen: number): string {
  if (!s) return ''
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

// ─── Sanitize decision/company fields to prevent oversized prompts ─
function sanitizeInputs(
  company: CompanyProfile,
  decision: Decision
): { company: CompanyProfile; decision: Decision } {
  return {
    company: {
      ...company,
      company_name: truncField(company.company_name, 200),
      sector: truncField(company.sector, 200),
      company_size: truncField(company.company_size, 100),
      stage: truncField(company.stage, 100),
      annual_revenue: truncField(company.annual_revenue, 100),
      team_size: truncField(company.team_size, 100),
    },
    decision: {
      ...decision,
      title: truncField(decision.title, 300),
      description: truncField(decision.description, 2000),
      category: truncField(decision.category, 100),
      primary_goal: truncField(decision.primary_goal, 500),
      estimated_cost: truncField(decision.estimated_cost, 200),
      expected_timeline: truncField(decision.expected_timeline, 200),
      alternatives: truncField(decision.alternatives, 1000),
      constraints: truncField(decision.constraints, 1000),
    },
  }
}

// ─── Build extra context suffix (clarifying answers + uploaded docs) ─
function buildExtraContext(
  clarifyingAnswers?: { question: string; answer: string }[],
  uploadedContext?: string
): string {
  let extra = ''
  if (clarifyingAnswers && clarifyingAnswers.length > 0) {
    extra += '\n\n## إجابات توضيحية من صاحب القرار:\n'
    // Limit to 10 questions, each answer max 500 chars
    clarifyingAnswers.slice(0, 10).forEach(({ question, answer }) => {
      extra += `- ${truncField(question, 200)}\n  → ${truncField(answer, 500)}\n`
    })
  }
  if (uploadedContext) {
    extra += `\n\n## وثائق مرفوعة (ملخص):\n${uploadedContext.slice(0, 2000)}`
  }
  return extra
}

// ─── Run a single advisor (with rate-limit-aware retry) ─
async function runSingleAdvisor(
  advisorId: string,
  company: CompanyProfile,
  decision: Decision,
  clarifyingAnswers?: { question: string; answer: string }[],
  uploadedContext?: string
): Promise<AdvisorOutput> {
  const config = ADVISOR_REGISTRY[advisorId]
  if (!config) throw new Error(`Unknown advisor: ${advisorId}`)

  // 75s: single attempt for 3500 tokens at ~80 tok/s ≈ 44s + network overhead
  // Generic retry removed from callAdvisor — it doubled execution time
  const ADVISOR_TIMEOUT_MS = 75_000

  // Sanitize inputs to prevent oversized prompts
  const { company: safeCompany, decision: safeDecision } = sanitizeInputs(company, decision)

  const t0 = Date.now()
  try {
    // buildUserMessage inside try so any error is safely caught
    const userMessage =
      config.module.buildUserMessage(safeCompany, safeDecision) +
      buildExtraContext(clarifyingAnswers, uploadedContext)
    console.log(`[Engine] → ${advisorId} started | system: ${config.module.SYSTEM_PROMPT.length} chars, user: ${userMessage.length} chars, total: ${config.module.SYSTEM_PROMPT.length + userMessage.length} chars`)
    const result = await withTimeout(
      callAdvisor(config.module.SYSTEM_PROMPT, userMessage, 3500),
      ADVISOR_TIMEOUT_MS,
      advisorId
    ) as unknown as AdvisorOutput
    const duration = ((Date.now() - t0) / 1000).toFixed(1)
    const isFallback = (result as AdvisorOutput & { _isFallback?: boolean })._isFallback
    console.log(`[Engine] ✓ ${advisorId} done in ${duration}s${isFallback ? ' [FALLBACK — parse error]' : ''}`)
    return { ...result, id: advisorId, name: config.name, icon: config.icon }
  } catch (error: unknown) {
    const duration = ((Date.now() - t0) / 1000).toFixed(1)
    const e = error as { status?: number; error?: { type?: string }; message?: string }
    const isTimeout = e?.message?.startsWith('[Timeout]')
    const reason = isTimeout ? 'استغرق التحليل وقتاً أطول من المتوقع' : 'خطأ تقني'
    console.error(`[Engine] ✗ ${advisorId} FAILED after ${duration}s — ${isTimeout ? 'TIMEOUT' : (e?.message || 'unknown error')}`)
    return createFallbackReport(advisorId, reason)
  }
}

// ─── Single-attempt wrapper (callAdvisor handles rate-limit retry internally) ─
async function runWithRetry(
  advisorId: string,
  company: CompanyProfile,
  decision: Decision,
  clarifyingAnswers?: { question: string; answer: string }[],
  uploadedContext?: string
): Promise<AdvisorOutput> {
  const result = await runSingleAdvisor(advisorId, company, decision, clarifyingAnswers, uploadedContext)
  const isFallback = (result as AdvisorOutput & { _isFallback?: boolean })._isFallback
  if (!isFallback && result.summary && result.scorecard) return result
  console.log(`[Engine] Incomplete result for ${advisorId} — using fallback`)
  return createFallbackReport(advisorId, 'يرجى الضغط على إعادة المحاولة لإكمال التحليل')
}

// ─── Run advisors sequentially — avoids rate-limit collisions ─
async function runAdvisorsSequential(
  advisors: string[],
  company: CompanyProfile,
  decision: Decision,
  clarifyingAnswers?: { question: string; answer: string }[],
  uploadedContext?: string
): Promise<AdvisorOutput[]> {
  const results: AdvisorOutput[] = []
  for (let i = 0; i < advisors.length; i++) {
    console.log(`[Engine] Starting advisor ${i + 1}/${advisors.length}: ${advisors[i]}`)
    const result = await runWithRetry(advisors[i], company, decision, clarifyingAnswers, uploadedContext)
    results.push(result)
    console.log(`[Engine] Completed: ${advisors[i]}`)
    if (i < advisors.length - 1) await delay(2000)
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
    console.log(`[Engine] → debate started | system: ${DEBATE_PROMPT.length} chars, user: ${userMessage.length} chars, total: ${DEBATE_PROMPT.length + userMessage.length} chars`)
    const result = await withTimeout(
      callAdvisor(DEBATE_PROMPT, userMessage, 2000) as Promise<unknown>,
      25_000,
      'debate'
    ) as unknown as DebateOutput
    return result
  } catch {
    return { points: [] }
  }
}

// ─── Fallback synthesis when engine fails ────────────────
function buildFallbackSynthesis(advisorResults: AdvisorOutput[]): SynthesisOutput {
  const usable = successfulAdvisors(advisorResults)
  const source = usable.length > 0 ? usable : advisorResults

  const verdicts = source.map((a) => a.verdict).filter(Boolean)
  const verdict: SynthesisOutput['overallVerdict'] =
    (verdicts[0] as SynthesisOutput['overallVerdict']) || 'APPROVE_WITH_CONDITIONS'

  const avgConf = source.reduce((s, a) => s + (typeof a.confidence === 'number' ? a.confidence : 50), 0) /
    Math.max(source.length, 1)

  const topFindings = source
    .flatMap((a) => a.keyPoints?.slice(0, 1) ?? [])
    .filter(Boolean) as string[]

  const conditions = source
    .flatMap((a) => a.risks?.slice(0, 1).map((r) => r.mitigation) ?? [])
    .filter(Boolean) as string[]

  return {
    overallVerdict: verdict,
    overallConfidence: Math.round(avgConf),
    executiveSummary: source[0]?.summary || 'يرجى مراجعة تقارير المستشارين للحصول على التفاصيل.',
    topFindings: topFindings.length > 0 ? topFindings : ['راجع تقارير المستشارين للتفاصيل'],
    conditions: conditions.length > 0 ? conditions : ['مراجعة التحليلات بعناية قبل اتخاذ القرار'],
    verdictReason: 'بناءً على تحليل المستشارين المتاحين.',
    whatCouldChange: 'مراجعة المعطيات الأساسية قد تغير التوصية.',
    plan: {
      days30: ['مراجعة تقارير المستشارين بعناية'],
      days60: ['اتخاذ القرار النهائي بعد دراسة متأنية'],
      days90: ['تقييم النتائج والمتابعة'],
    },
  }
}

// ─── Run synthesis engine ───────────────────────────────
async function runSynthesis(
  advisorResults: AdvisorOutput[],
  debate: DebateOutput | null,
  weights: Record<string, number>,
  decision: Decision
): Promise<SynthesisOutput> {
  const usable = successfulAdvisors(advisorResults)
  const forSynthesis = usable.length > 0 ? usable : advisorResults
  const userMessage = buildSynthesisMessage(forSynthesis, debate, weights, decision)
  console.log(`[Engine] → synthesis started | system: ${SYNTHESIS_PROMPT.length} chars, user: ${userMessage.length} chars, total: ${SYNTHESIS_PROMPT.length + userMessage.length} chars | using ${forSynthesis.length}/${advisorResults.length} advisors`)
  try {
    const result = await withTimeout(
      callAdvisor(SYNTHESIS_PROMPT, userMessage, 4500, true) as Promise<unknown>,
      90_000,
      'synthesis'
    ) as unknown as SynthesisOutput
    // Validate minimum required fields — if missing, fall through to fallback
    if (result && result.overallVerdict && result.executiveSummary) {
      return result
    }
    if (process.env.NODE_ENV === 'development') console.warn('[Engine] Synthesis returned incomplete data — using fallback')
    return buildFallbackSynthesis(advisorResults)
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.error('[Engine] Synthesis failed — using fallback:', err)
    return buildFallbackSynthesis(advisorResults)
  }
}

// ─── Main orchestrator ──────────────────────────────────
export async function runAdvisorySession(sessionData: SessionInput): Promise<SessionResult> {
  const { companyProfile, decision, additionalAdvisors, sessionType, clarifyingAnswers, uploadedContext } = sessionData

  // Only run advisors that are currently active (filter out coming-soon)
  const requested = additionalAdvisors && additionalAdvisors.length > 0
    ? additionalAdvisors
    : ['strategic', 'financial', 'market', 'technical', 'operational']
  const allAdvisors = requested.filter((a) => ACTIVE_ADVISORS.includes(a))

  console.log('[Engine] Active advisors:', allAdvisors)
  const advisorResults = await runAdvisorsSequential(allAdvisors, companyProfile, decision, clarifyingAnswers, uploadedContext)

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
  const { companyProfile, decision, additionalAdvisors, sessionType, clarifyingAnswers, uploadedContext } = sessionData

  // Only run advisors that are currently active (filter out coming-soon)
  const requested = additionalAdvisors && additionalAdvisors.length > 0
    ? additionalAdvisors
    : ['strategic', 'financial', 'market', 'technical', 'operational']
  const allAdvisors = requested.filter((a) => ACTIVE_ADVISORS.includes(a))

  console.log('[Engine] Active advisors:', allAdvisors)
  // Run sequentially — one advisor at a time to avoid rate-limit collisions
  const advisorResults: AdvisorOutput[] = []

  for (let i = 0; i < allAdvisors.length; i++) {
    const advisorId = allAdvisors[i]
    console.log(`[Engine] Starting advisor ${i + 1}/${allAdvisors.length}: ${advisorId}`)
    const result = await runWithRetry(advisorId, companyProfile, decision, clarifyingAnswers, uploadedContext)
    advisorResults.push(result)
    if (onAdvisorComplete) onAdvisorComplete(advisorId, result)
    yield { type: 'advisor_complete', data: { advisorId, result } }
    console.log(`[Engine] Completed: ${advisorId}`)
    if (i < allAdvisors.length - 1) await delay(2000)
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
