'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { MOCK_SESSIONS_LIST } from '@/lib/mock-data'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

type Verdict = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT' | 'DELAY'
type SessionType = 'Quick' | 'Full' | 'Deep'

interface DisplaySession {
  id: string
  title: string
  session_type: string
  final_verdict: string
  confidence_level: number
  created_at: string
  company_name: string
}

// ─── Verdict helpers ───────────────────────────────
const verdictConfig: Record<string, { label: string; color: string; bg: string }> = {
  APPROVE: { label: 'موافقة', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  APPROVE_WITH_CONDITIONS: { label: 'مشروطة', color: '#D4A853', bg: 'rgba(212, 168, 83, 0.12)' },
  REJECT: { label: 'رفض', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  DELAY: { label: 'تأجيل', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' },
}

const sessionTypeConfig: Record<string, { label: string; color: string }> = {
  Quick: { label: 'سريعة', color: '#3B82F6' },
  Full: { label: 'كاملة', color: '#D4A853' },
  Deep: { label: 'معمّقة', color: '#A78BFA' },
}

// ─── Stats Card ────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  delay,
  progress,
}: {
  icon: string
  label: string
  value: string | number
  sub?: string
  iconBg: string
  delay: number
  progress?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass card-hover rounded-2xl p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div
          className="text-3xl font-black"
          style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
        >
          {value}
        </div>
        <div
          className="text-sm mt-0.5"
          style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
            {sub}
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: `${progress}%` } : {}}
            transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)' }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ─── Session Card ──────────────────────────────────
function SessionCard({ session, index }: { session: DisplaySession; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const v = verdictConfig[session.final_verdict] || verdictConfig.DELAY
  // Supabase stores session_type lowercase; normalize to capitalized for config lookup
  const typeKey = session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1).toLowerCase()
  const t = sessionTypeConfig[typeKey] || sessionTypeConfig.Full
  const confidencePct = Math.round(session.confidence_level * 100)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -3 }}
      className="glass card-hover rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      {/* Title + date */}
      <div className="flex-1">
        <h3
          className="font-bold text-base mb-1"
          style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
        >
          {session.title}
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {session.created_at}
        </span>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Session type */}
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: `${t.color}18`,
            color: t.color,
            border: `1px solid ${t.color}30`,
            fontFamily: 'Tajawal, sans-serif',
          }}
        >
          {t.label}
        </span>

        {/* Verdict */}
        <span
          className="text-xs px-3 py-1 rounded-full font-bold"
          style={{ background: v.bg, color: v.color, fontFamily: 'Tajawal, sans-serif' }}
        >
          {v.label}
        </span>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${confidencePct}%`,
                background: 'linear-gradient(90deg, #D4A853, #E8C97A)',
              }}
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
            {confidencePct}٪
          </span>
        </div>

        {/* View button */}
        <Link
          href={`/session/${session.id}`}
          className="btn-outline-gold text-xs px-4 py-2 rounded-lg font-medium"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          عرض التفاصيل
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Grouped Sessions ──────────────────────────────
function GroupedSessions({ sessions }: { sessions: DisplaySession[] }) {
  // Group by company_name
  const groups: Record<string, DisplaySession[]> = {}
  for (const s of sessions) {
    const key = s.company_name || '—'
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  const entries = Object.entries(groups)

  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
          لا توجد جلسات سابقة — ابدأ جلستك الاستشارية الأولى
        </p>
      </div>
    )
  }

  // If only one company (or all unidentified), show flat list
  if (entries.length === 1) {
    return (
      <div className="flex flex-col gap-3">
        {sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {entries.map(([companyName, companySessions], gi) => (
        <motion.div
          key={companyName}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: gi * 0.08 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏢</span>
            <h3
              className="text-sm font-bold"
              style={{ color: 'var(--accent-gold)', fontFamily: 'Tajawal, sans-serif' }}
            >
              {companyName}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(212,168,83,0.1)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(212,168,83,0.2)',
                fontFamily: 'IBM Plex Sans Arabic',
              }}
            >
              {companySessions.length} {companySessions.length === 1 ? 'جلسة' : 'جلسات'}
            </span>
          </div>
          <div className="flex flex-col gap-3 pr-5" style={{ borderRight: '2px solid rgba(212,168,83,0.15)' }}>
            {companySessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />)}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────
export default function DashboardPage() {
  const [sessions, setSessions] = useState<DisplaySession[]>(hasSupabaseConfig() ? [] : MOCK_SESSIONS_LIST)
  const [loading, setLoading] = useState(hasSupabaseConfig())

  useEffect(() => {
    if (!hasSupabaseConfig()) return

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Not authenticated — show mock demo session
        setSessions(MOCK_SESSIONS_LIST)
        setLoading(false)
        return
      }
      supabase
        .from('sessions')
        .select('id, title, session_type, status, final_verdict, confidence_level, created_at, company_profile')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          // Always replace with user's real sessions (empty list means no sessions yet)
          setSessions(
            (data ?? []).map((s) => {
              const profile = (s.company_profile ?? {}) as Record<string, string>
              return {
                id: s.id,
                title: s.title,
                session_type: s.session_type,
                final_verdict: s.final_verdict ?? 'DELAY',
                confidence_level: s.confidence_level ?? 0,
                created_at: new Date(s.created_at).toLocaleDateString('ar-SA'),
                company_name: profile.company_name ?? '—',
              }
            })
          )
          setLoading(false)
        })
    })
  }, [])

  const completedSessions = sessions.filter((s) => s.final_verdict && s.final_verdict !== 'DELAY')
  const avgConfidence = sessions.length
    ? Math.round((sessions.reduce((sum, s) => sum + s.confidence_level, 0) / sessions.length) * 100)
    : 0
  const lastSession = sessions[0]
  const lastVerdictLabel = lastSession ? (verdictConfig[lastSession.final_verdict]?.label ?? '—') : '—'

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 pt-4 md:pt-0"
      >
        <h1
          className="text-3xl font-black mb-1"
          style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
        >
          مرحبًا بك في المجلس الاستشاري 👋
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
          قراراتك المهمة تستحق تحليلاً متعمقاً من كل الزوايا
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📋"
          label="إجمالي الجلسات"
          value={sessions.length}
          iconBg="rgba(37, 99, 235, 0.15)"
          delay={0}
        />
        <StatCard
          icon="✅"
          label="آخر حكم"
          value={lastVerdictLabel}
          sub={lastSession?.title}
          iconBg="rgba(212, 168, 83, 0.15)"
          delay={0.1}
        />
        <StatCard
          icon="📈"
          label="متوسط الثقة"
          value={`${avgConfidence}٪`}
          iconBg="rgba(34, 197, 94, 0.15)"
          delay={0.2}
          progress={avgConfidence}
        />
        <StatCard
          icon="🧠"
          label="المستشارون النشطون"
          value={4}
          sub="جاهزون للتحليل"
          iconBg="rgba(167, 139, 250, 0.15)"
          delay={0.3}
        />
      </div>

      {/* New session CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <Link href="/session/new">
          <motion.div
            whileHover={{
              scale: 1.01,
              boxShadow: '0 0 50px rgba(212, 168, 83, 0.2), 0 20px 60px rgba(0,0,0,0.3)',
            }}
            className="pulse-glow rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.08) 0%, rgba(19, 24, 32, 0.9) 100%)',
              border: '1px solid var(--border-gold)',
            }}
          >
            <div>
              <h2
                className="text-xl font-black mb-1"
                style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
              >
                ✨ ابدأ جلسة استشارية جديدة
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                حلّل قرارك القادم مع ٤ مستشارين متخصصين
              </p>
            </div>
            <span
              className="btn-gold px-6 py-3 rounded-xl font-bold text-sm flex-shrink-0"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              ابدأ الآن →
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Past sessions — grouped by company */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-bold mb-4"
          style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
        >
          {loading ? 'جارٍ تحميل الجلسات...' : 'الجلسات السابقة'}
        </motion.h2>
        <GroupedSessions sessions={sessions} />
        {hasSupabaseConfig() && sessions.length > 0 && (
          <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
            🗓️ تُحفظ الجلسات لمدة 180 يومًا من تاريخ الإنشاء
          </p>
        )}
      </div>
    </div>
  )
}
