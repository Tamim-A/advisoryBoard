'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppSidebar from '@/components/AppSidebar'
import SummaryTab from '@/components/session/SummaryTab'
import AdvisorDetailTab from '@/components/session/AdvisorDetailTab'
import ScenariosTab from '@/components/session/ScenariosTab'
import VerdictTab from '@/components/session/VerdictTab'
import { type SessionData, type AdvisorAnalysis, type DiscussionPoint } from '@/data/mockData'
import { type AdvisorOutput, type SynthesisOutput } from '@/lib/prompts/types'
import { MOCK_SESSION } from '@/lib/mock-data'
import { exportSessionPDF } from '@/lib/utils/pdf-export'

// ─── Types ──────────────────────────────────────────────
type AdvisorStatus = 'loading' | 'done' | 'error'
type MainTab = 'summary' | 'advisor' | 'discussion' | 'scenarios' | 'verdict'

const SESSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  Quick: { label: 'سريعة', color: '#3B82F6' },
  Full:  { label: 'كاملة', color: '#D4A853' },
  Deep:  { label: 'معمّقة', color: '#A78BFA' },
}

const MAIN_TABS: Array<{ id: MainTab; label: string; icon: string; premium?: boolean }> = [
  { id: 'summary',    label: 'الملخص التنفيذي', icon: '📋' },
  { id: 'advisor',    label: 'المستشارون',       icon: '👥' },
  { id: 'discussion', label: 'نقاش المستشارين',  icon: '⚔️', premium: true },
  { id: 'scenarios',  label: 'السيناريوهات',     icon: '📊' },
  { id: 'verdict',    label: 'الحكم النهائي',    icon: '✅' },
]

const ADVISOR_META: Record<string, { name: string; icon: string }> = {
  strategic:      { name: 'المستشار الاستراتيجي', icon: '🎯' },
  financial:      { name: 'المستشار المالي',       icon: '💰' },
  market:         { name: 'مستشار السوق',          icon: '📊' },
  operational:    { name: 'المستشار التشغيلي',     icon: '⚙️' },
  legal:          { name: 'المستشار القانوني',     icon: '⚖️' },
  technical:      { name: 'المستشار التقني',       icon: '🔧' },
  growth:         { name: 'مستشار النمو',          icon: '🚀' },
  risk:           { name: 'مستشار المخاطر',        icon: '🛡️' },
  sustainability: { name: 'مستشار الاستدامة',      icon: '🌱' },
}

// ─── Convert MOCK_SESSION to SessionData ─────────────────
function buildDemoSessionData(id: string): SessionData {
  const s = MOCK_SESSION

  const advisors: AdvisorAnalysis[] = Object.entries(s.advisorReports).map(([advisorId, report]) => {
    const meta = ADVISOR_META[advisorId] || { name: report.advisor_name, icon: '🎯' }
    const scorecardEntries = Object.entries(report.scorecard).filter(([k]) => k !== 'confidence')
    return {
      id: advisorId,
      name: meta.name,
      icon: meta.icon,
      scorecard: scorecardEntries.map(([dimension, score]) => ({
        dimension,
        score: score as number,
      })),
      summary: report.summary,
      keyPoints: report.key_findings,
      risks: report.risks.map((r) => ({
        risk: r.title,
        impact: (r.impact === 'High' ? 'عالي' : r.impact === 'Medium' ? 'متوسط' : 'منخفض') as 'عالي' | 'متوسط' | 'منخفض',
        probability: (r.likelihood === 'High' ? 'عالية' : r.likelihood === 'Medium' ? 'متوسطة' : 'منخفضة') as 'عالية' | 'متوسطة' | 'منخفضة',
        mitigation: r.mitigation,
      })),
      scenarios: {
        best:  { title: 'أفضل حالة',       description: report.scenarios.best_case },
        base:  { title: 'الحالة المتوقعة', description: report.scenarios.base_case },
        worst: { title: 'أسوأ حالة',       description: report.scenarios.worst_case },
      },
      strongestObjection: report.strongest_objection,
      recommendation: report.recommendation,
      verdict: 'APPROVE_WITH_CONDITIONS',
      confidence: Math.round((report.scorecard.confidence as number) * 100),
    }
  })

  const discussion: DiscussionPoint[] = s.debate.debate_points.map((pt, i) => ({
    id: `debate-${i}`,
    topic: pt.contention,
    advisorA: { name: pt.side_a.advisor, icon: '🎯', argument: pt.side_a.argument },
    advisorB: { name: pt.side_b.advisor, icon: '⚙️', argument: pt.side_b.argument },
    outcome: (
      pt.resolution === 'conditional' ? 'مشروط' :
      pt.resolution === 'resolved_for_b' ? 'محسوم' : 'معلّق'
    ) as 'محسوم' | 'معلّق' | 'مشروط',
  }))

  const syn = s.synthesis

  return {
    id,
    decisionTitle: s.title,
    sessionType: 'Full',
    overallVerdict: 'APPROVE_WITH_CONDITIONS',
    overallConfidence: Math.round(syn.confidence_level * 100),
    date: '2026-03-01',
    company: {
      name: s.companyProfile.company_name,
      sector: s.companyProfile.sector,
      size: s.companyProfile.company_size,
      stage: s.companyProfile.stage,
      revenue: s.companyProfile.annual_revenue,
      teamSize: String(s.companyProfile.team_size),
    },
    decision: {
      description: s.decision.description,
      category: s.decision.category,
      mainGoal: s.decision.primary_goal,
      estimatedCost: s.decision.estimated_cost,
      timeline: s.decision.expected_timeline,
    },
    executiveSummary: syn.decision_summary,
    topFindings: syn.advisors_agree_on,
    conditions: syn.conditions_before_proceeding,
    advisors,
    discussion,
    plan: {
      days30: syn.action_plan_30_60_90.day_30,
      days60: syn.action_plan_30_60_90.day_60,
      days90: syn.action_plan_30_60_90.day_90,
    },
    verdictReason: syn.why_this_decision,
    whatCouldChange: syn.what_could_change_verdict.join(' — '),
  }
}

// ─── Build SessionData from real API results ──────────────
function buildSessionData(
  base: { id: string; companyProfile: Record<string, string>; decision: Record<string, string>; sessionType: string },
  advisorResults: AdvisorOutput[],
  debate: { points: unknown[] } | null,
  synthesis: SynthesisOutput,
  fallbackSession: SessionData
): SessionData {
  return {
    ...fallbackSession,
    id: base.id,
    decisionTitle: base.decision?.title || fallbackSession.decisionTitle,
    sessionType: (base.sessionType as 'Quick' | 'Full' | 'Deep') || 'Full',
    overallVerdict: synthesis.overallVerdict as SessionData['overallVerdict'],
    overallConfidence: synthesis.overallConfidence,
    executiveSummary: synthesis.executiveSummary,
    topFindings: synthesis.topFindings,
    conditions: synthesis.conditions,
    verdictReason: synthesis.verdictReason,
    whatCouldChange: synthesis.whatCouldChange,
    plan: synthesis.plan,
    advisors: advisorResults as unknown as SessionData['advisors'],
    discussion: (debate?.points || []) as SessionData['discussion'],
    company: {
      name: base.companyProfile?.company_name || '',
      sector: base.companyProfile?.sector || '',
      size: base.companyProfile?.company_size || '',
      stage: base.companyProfile?.stage || '',
      revenue: base.companyProfile?.annual_revenue || '',
      teamSize: base.companyProfile?.team_size || '',
    },
    decision: {
      description: base.decision?.description || '',
      category: base.decision?.category || '',
      mainGoal: base.decision?.primary_goal || '',
      estimatedCost: base.decision?.estimated_cost || '',
      timeline: base.decision?.expected_timeline || '',
    },
  }
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 rounded-lg w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 rounded-lg w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

function LoadingPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-2 border-[#D4A853]/20 border-t-[#D4A853] rounded-full animate-spin" />
      <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
        {message}
      </p>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function SessionPage({ params }: { params: { id: string } }) {
  const sessionId = params.id
  const isMock = sessionId.startsWith('demo-') || sessionId === 'session-001'

  const demoSessionData = isMock ? buildDemoSessionData(sessionId) : null

  const [statuses, setStatuses] = useState<Record<string, AdvisorStatus>>({})
  const [advisorResults, setAdvisorResults] = useState<AdvisorOutput[]>([])
  const [debate, setDebate] = useState<{ points: unknown[] } | null>(null)
  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(null)
  const [sessionMeta, setSessionMeta] = useState<Record<string, unknown>>({})
  const [sessionData, setSessionData] = useState<SessionData | null>(isMock ? demoSessionData : null)
  const [globalLoading, setGlobalLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MainTab>('summary')
  const esRef = useRef<EventSource | null>(null)

  const displayAdvisors: AdvisorAnalysis[] = advisorResults.length > 0
    ? advisorResults as unknown as AdvisorAnalysis[]
    : (sessionData?.advisors || demoSessionData?.advisors || [])

  const doneCount = Object.values(statuses).filter((s) => s === 'done').length
  const totalAdvisors = isMock
    ? (demoSessionData?.advisors.length || 4)
    : Math.max(Object.keys(statuses).length, 4)
  const progress = totalAdvisors > 0 ? Math.round((doneCount / totalAdvisors) * 100) : 0

  // ─── Mock loading simulation ──────────────────────────
  useEffect(() => {
    if (!isMock || !demoSessionData) return
    const advisors = demoSessionData.advisors
    const delays = [800, 1600, 2400, 3200, 4000, 4800, 5400, 6000, 6600]

    advisors.forEach((advisor, i) => {
      setStatuses((p) => ({ ...p, [advisor.id]: 'loading' }))
      setTimeout(() => {
        setAdvisorResults((p) => [...p, advisor as unknown as AdvisorOutput])
        setStatuses((p) => ({ ...p, [advisor.id]: 'done' }))
        if (i === advisors.length - 1) {
          setDebate({ points: demoSessionData.discussion })
          setSynthesis({
            overallVerdict: demoSessionData.overallVerdict,
            overallConfidence: demoSessionData.overallConfidence,
            executiveSummary: demoSessionData.executiveSummary,
            topFindings: demoSessionData.topFindings,
            conditions: demoSessionData.conditions,
            verdictReason: demoSessionData.verdictReason,
            whatCouldChange: demoSessionData.whatCouldChange,
            plan: demoSessionData.plan,
          })
          setGlobalLoading(false)
        }
      }, delays[i] ?? (i + 1) * 800)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock])

  // ─── Real SSE connection ──────────────────────────────
  useEffect(() => {
    if (isMock) return

    setStatuses({ strategic: 'loading', financial: 'loading', market: 'loading', operational: 'loading' })

    const es = new EventSource(`/api/session/${sessionId}/stream`)
    esRef.current = es

    es.addEventListener('demo_mode', () => setDemoMode(true))

    es.addEventListener('advisor_complete', (e: MessageEvent) => {
      const { advisorId, result } = JSON.parse(e.data) as { advisorId: string; result: AdvisorOutput }
      const meta = ADVISOR_META[advisorId]
      const enriched = { ...result, id: advisorId, name: meta?.name || result.name, icon: meta?.icon || result.icon }
      setAdvisorResults((p) => [...p.filter((a) => a.id !== advisorId), enriched])
      setStatuses((p) => ({ ...p, [advisorId]: 'done' }))
    })

    es.addEventListener('advisor_error', (e: MessageEvent) => {
      const { advisorId } = JSON.parse(e.data) as { advisorId: string }
      setStatuses((p) => ({ ...p, [advisorId]: 'error' }))
    })

    es.addEventListener('debate_complete', (e: MessageEvent) => {
      setDebate(JSON.parse(e.data) as { points: unknown[] })
    })

    es.addEventListener('synthesis_complete', (e: MessageEvent) => {
      setSynthesis(JSON.parse(e.data) as SynthesisOutput)
    })

    es.addEventListener('done', () => { setGlobalLoading(false); es.close() })
    es.onerror = () => { setGlobalLoading(false); es.close() }

    fetch(`/api/session/${sessionId}`)
      .then((r) => r.json())
      .then((d) => setSessionMeta(d))
      .catch(() => {})

    return () => { es.close() }
  }, [sessionId, isMock])

  // ─── Rebuild sessionData on synthesis ────────────────
  useEffect(() => {
    if (!synthesis || advisorResults.length === 0) return
    if (isMock) { setSessionData(demoSessionData); return }
    setSessionData(buildSessionData(
      sessionMeta as { id: string; companyProfile: Record<string, string>; decision: Record<string, string>; sessionType: string },
      advisorResults,
      debate,
      synthesis,
      buildDemoSessionData('fallback')
    ))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthesis, advisorResults, debate, sessionMeta, isMock])

  const activeAdvisorResult = displayAdvisors.find((a) => a.id === selectedAdvisor)
  const sessionTypeMeta = SESSION_TYPE_LABELS[
    sessionData?.sessionType || (sessionMeta as Record<string, string>)?.sessionType || 'Full'
  ]
  const decisionTitle = sessionData?.decisionTitle ||
    (sessionMeta as Record<string, Record<string, string>>)?.decision?.title || 'جلسة استشارية'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <div className="md:mr-60 min-h-screen flex flex-col">

        {/* ─── Top bar ─── */}
        <div
          className="glass-strong sticky top-0 z-30 px-5 py-3 flex flex-col gap-2"
          style={{ borderBottom: '1px solid rgba(212,168,83,0.1)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h1 className="font-black text-base truncate" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                {decisionTitle}
              </h1>
              {sessionTypeMeta && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                  style={{ background: `${sessionTypeMeta.color}18`, color: sessionTypeMeta.color, fontFamily: 'Tajawal' }}>
                  {sessionTypeMeta.label}
                </span>
              )}
              {demoMode && (
                <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(148,163,184,0.1)', color: '#94A3B8', fontFamily: 'IBM Plex Sans Arabic' }}>
                  وضع تجريبي
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {globalLoading ? (
                <span className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--accent-gold)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  <span className="w-3 h-3 border-2 border-[#D4A853]/30 border-t-[#D4A853] rounded-full animate-spin" />
                  جاري التحليل ({doneCount}/{totalAdvisors})
                </span>
              ) : (
                <span className="text-xs" style={{ color: '#22C55E', fontFamily: 'IBM Plex Sans Arabic' }}>
                  ✅ مكتمل
                </span>
              )}
              {!globalLoading && sessionData && (
                <button
                  onClick={() => exportSessionPDF(sessionData)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(212,168,83,0.1)',
                    border: '1px solid var(--border-gold)',
                    color: 'var(--accent-gold)',
                    fontFamily: 'IBM Plex Sans Arabic',
                  }}
                >
                  تصدير PDF
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)' }}
              animate={{ width: globalLoading ? `${progress}%` : '100%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex flex-1">
          {/* ─── Advisors sidebar ─── */}
          <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 border-l overflow-y-auto"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', maxHeight: 'calc(100vh - 80px)', position: 'sticky', top: '80px', alignSelf: 'flex-start' }}>

            <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs px-2 mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>المستشارون</p>
              {displayAdvisors.map((advisor) => {
                const id = advisor.id || ''
                const status = statuses[id] || (globalLoading ? 'loading' : 'done')
                const isActive = selectedAdvisor === id && activeTab === 'advisor'
                return (
                  <button key={id}
                    onClick={() => { if (status === 'done') { setSelectedAdvisor(id); setActiveTab('advisor') } }}
                    disabled={status !== 'done'}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-right transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(212,168,83,0.1)' : 'transparent',
                      borderRight: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                      opacity: status === 'loading' ? 0.7 : 1,
                      cursor: status === 'done' ? 'pointer' : 'default',
                    }}>
                    <span className="text-base flex-shrink-0">{advisor.icon}</span>
                    <span className="text-xs flex-1 truncate" style={{ fontFamily: 'IBM Plex Sans Arabic', color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                      {advisor.name}
                    </span>
                    <span className="flex-shrink-0">
                      {status === 'loading' && <span className="w-3 h-3 border border-[#94A3B8]/30 border-t-[#94A3B8] rounded-full animate-spin block" />}
                      {status === 'done' && <span className="text-xs text-green-500">✓</span>}
                      {status === 'error' && <span className="text-xs text-red-500">✗</span>}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="px-3 py-3">
              <p className="text-xs px-2 mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>التقارير</p>
              {MAIN_TABS.map((tab) => {
                const isLocked = globalLoading && tab.id !== 'summary'
                const isActive = activeTab === tab.id && !selectedAdvisor
                return (
                  <button key={tab.id}
                    onClick={() => { if (!isLocked) { setActiveTab(tab.id); setSelectedAdvisor(null) } }}
                    disabled={isLocked}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-right transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(212,168,83,0.1)' : 'transparent',
                      borderRight: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                      opacity: isLocked ? 0.4 : 1,
                    }}>
                    <span className="text-base">{tab.icon}</span>
                    <span className="text-xs flex-1" style={{ fontFamily: 'IBM Plex Sans Arabic', color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                      {tab.label}
                    </span>
                    {tab.premium && <span className="text-xs flex-shrink-0">🔒</span>}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ─── Main content ─── */}
          <main className="flex-1 overflow-y-auto p-5 md:p-7" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {/* Mobile tabs */}
            <div className="flex overflow-x-auto gap-2 mb-5 pb-1 lg:hidden">
              {MAIN_TABS.map((tab) => (
                <button key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedAdvisor(null) }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                  style={{
                    background: activeTab === tab.id && !selectedAdvisor ? 'rgba(212,168,83,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${activeTab === tab.id && !selectedAdvisor ? 'var(--accent-gold)' : 'var(--border)'}`,
                    color: activeTab === tab.id && !selectedAdvisor ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontFamily: 'IBM Plex Sans Arabic',
                  }}>
                  {tab.icon} {tab.label}{tab.premium ? ' 🔒' : ''}
                </button>
              ))}
            </div>

            {/* Demo mode banner */}
            {demoMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
                style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                <span>🔬</span>
                <span>وضع تجريبي — أضف <code className="text-xs bg-black/30 px-1 rounded">ANTHROPIC_API_KEY</code> في <code className="text-xs bg-black/30 px-1 rounded">.env.local</code> للتشغيل الحقيقي</span>
              </motion.div>
            )}

            {/* Loading banner */}
            {globalLoading && activeTab === 'summary' && (
              <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid var(--border-gold)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-2 border-[#D4A853]/30 border-t-[#D4A853] rounded-full animate-spin" />
                  <div>
                    <p className="font-bold text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>المجلس يحلل قرارك...</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                      {doneCount} من {totalAdvisors} مستشارين أكملوا التحليل
                    </p>
                  </div>
                </div>
                <Skeleton />
              </div>
            )}

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAdvisor ? `a-${selectedAdvisor}` : activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'summary' && !selectedAdvisor && (
                  sessionData ? <SummaryTab session={sessionData} /> : <Skeleton />
                )}
                {activeTab === 'advisor' && selectedAdvisor && activeAdvisorResult && (
                  <>
                    <button
                      onClick={() => setSelectedAdvisor(null)}
                      className="mb-5 flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}
                    >
                      ← العودة للمستشارين
                    </button>
                    <AdvisorDetailTab advisor={activeAdvisorResult} />
                  </>
                )}
                {activeTab === 'advisor' && !selectedAdvisor && (
                  <div>
                    <div className="mb-5">
                      <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                        👥 المستشارون
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                        اضغط على أي مستشار أكمل تحليله لعرض تقريره التفصيلي
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {displayAdvisors.map((advisor) => {
                        const adId = advisor.id || ''
                        const adStatus = statuses[adId] || (globalLoading ? 'loading' : 'done')
                        return (
                          <motion.button
                            key={adId}
                            whileHover={adStatus === 'done' ? { y: -2 } : {}}
                            onClick={() => { if (adStatus === 'done') setSelectedAdvisor(adId) }}
                            disabled={adStatus !== 'done'}
                            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-right w-full transition-all"
                            style={{
                              background: 'rgba(19,24,32,0.8)',
                              border: '1px solid var(--border)',
                              cursor: adStatus === 'done' ? 'pointer' : 'default',
                              opacity: adStatus === 'loading' ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => { if (adStatus === 'done') e.currentTarget.style.borderColor = 'var(--border-gold)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                          >
                            <span className="text-2xl flex-shrink-0">{advisor.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                                {advisor.name}
                              </p>
                              <p className="text-xs mt-0.5" style={{
                                fontFamily: 'IBM Plex Sans Arabic',
                                color: adStatus === 'done' ? '#22C55E' : adStatus === 'error' ? '#EF4444' : 'var(--text-muted)',
                              }}>
                                {adStatus === 'done' ? 'اكتمل — اضغط للتفاصيل' : adStatus === 'error' ? 'خطأ في التحليل' : 'جاري التحليل...'}
                              </p>
                            </div>
                            {adStatus === 'loading' && (
                              <span className="w-4 h-4 border-2 border-[#94A3B8]/30 border-t-[#94A3B8] rounded-full animate-spin flex-shrink-0" />
                            )}
                            {adStatus === 'done' && (
                              <span className="text-xs text-green-500 flex-shrink-0">✓</span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {activeTab === 'discussion' && !selectedAdvisor && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl"
                    style={{ border: '1px solid var(--border-gold)', background: 'rgba(212,168,83,0.04)' }}
                  >
                    <div className="text-5xl mb-4">🔒</div>
                    <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      نقاش المستشارين — ميزة متقدمة
                    </h3>
                    <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic', lineHeight: 1.8 }}>
                      ستتوفر هذه الميزة قريبًا ضمن الباقات المخصصة، حيث يتناقش المستشارون فيما بينهم ويعرضون وجهات نظر متعارضة لمساعدتك في اتخاذ القرار الأمثل
                    </p>
                    <span className="mt-5 text-xs px-4 py-2 rounded-full" style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--accent-gold)', border: '1px solid var(--border-gold)', fontFamily: 'IBM Plex Sans Arabic' }}>
                      قريبًا
                    </span>
                  </motion.div>
                )}
                {activeTab === 'scenarios' && !selectedAdvisor && (
                  !globalLoading && sessionData
                    ? <ScenariosTab session={sessionData} />
                    : <LoadingPlaceholder message="السيناريوهات ستظهر بعد اكتمال التحليل..." />
                )}
                {activeTab === 'verdict' && !selectedAdvisor && (
                  !globalLoading && sessionData
                    ? <VerdictTab session={sessionData} />
                    : <LoadingPlaceholder message="الحكم النهائي يحتاج لاكتمال جميع المستشارين..." />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
