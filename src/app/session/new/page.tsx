'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

const FREE_SESSION_LIMIT = 2

// ─── Types ───────────────────────────────────────────
interface FormData {
  // Step 1
  companyName: string
  sector: string
  companySize: string
  stage: string
  revenue: string
  teamSize: string
  // Step 2
  decisionTitle: string
  decisionDescription: string
  decisionCategory: string
  mainGoal: string
  estimatedCost: string
  timeline: string
  alternatives: string
  constraints: string
  // Step 3
  specificConcerns: string
  coreAdvisors: string[]
  additionalAdvisors: string[]
  // Step 4
  sessionType: string
}

// ─── Floating Label Input ─────────────────────────────
function FloatInput({
  label, value, onChange, type = 'text', required, placeholder, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; required?: boolean; placeholder?: string; maxLength?: number
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0
  return (
    <div className="relative">
      <label
        className="absolute transition-all duration-200 pointer-events-none text-sm"
        style={{
          top: active ? '-10px' : '14px',
          right: '14px',
          fontSize: active ? '11px' : '14px',
          color: focused ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      >
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={active ? placeholder : ''}
        maxLength={maxLength}
        className="w-full px-4 pt-5 pb-3 rounded-xl text-sm outline-none transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          boxShadow: focused ? '0 0 16px rgba(212, 168, 83, 0.1)' : 'none',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      />
    </div>
  )
}

function FloatTextarea({
  label, value, onChange, required, rows = 4, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; rows?: number; maxLength?: number
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0
  const atLimit = maxLength ? value.length >= maxLength : false
  const nearLimit = maxLength ? value.length >= maxLength * 0.9 : false
  return (
    <div className="relative">
      <label
        className="absolute transition-all duration-200 pointer-events-none text-sm"
        style={{
          top: active ? '-10px' : '14px',
          right: '14px',
          fontSize: active ? '11px' : '14px',
          color: focused ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      >
        {label}{required && ' *'}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        className="w-full px-4 pt-6 pb-3 rounded-xl text-sm outline-none transition-all duration-300 resize-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          boxShadow: focused ? '0 0 16px rgba(212, 168, 83, 0.1)' : 'none',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      />
      {maxLength && (
        <span className="absolute bottom-2 left-3 text-xs" style={{
          color: atLimit ? '#EF4444' : nearLimit ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontFamily: 'IBM Plex Sans Arabic',
        }}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  )
}

function FloatSelect({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <label
        className="block text-xs mb-1.5"
        style={{ color: focused ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}
      >
        {label}{required && ' *'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 appearance-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      >
        <option value="" disabled hidden>اختر...</option>
        {options.map((o) => <option key={o} value={o} style={{ background: '#131820' }}>{o}</option>)}
      </select>
    </div>
  )
}

function RadioCards({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
        {label} *
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: value === option ? 'rgba(212, 168, 83, 0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${value === option ? 'var(--accent-gold)' : 'var(--border)'}`,
              color: value === option ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Steps ─────────────────────────────────────────────
const STEPS = [
  { number: 1, label: 'الشركة', icon: '🏢' },
  { number: 2, label: 'القرار', icon: '💡' },
  { number: 3, label: 'السياق', icon: '📎' },
  { number: 4, label: 'المراجعة', icon: '✅' },
]

// Active advisors (available now)
const ACTIVE_ADVISORS_UI = [
  { id: 'strategic',  icon: '🎯', name: 'المستشار الاستراتيجي', sub: 'التمركز والميزة التنافسية والرؤية' },
  { id: 'financial',  icon: '💰', name: 'المستشار المالي',       sub: 'الربحية والتدفقات والجدوى المالية' },
  { id: 'market',     icon: '📊', name: 'مستشار السوق',          sub: 'الطلب والمنافسة والعملاء' },
  { id: 'technical',  icon: '🔧', name: 'المستشار التقني',       sub: 'الجاهزية التقنية والبنية التحتية' },
]

// Coming-soon advisors (disabled)
const COMING_SOON_ADVISORS_UI = [
  { id: 'operational',    icon: '⚙️', name: 'المستشار التشغيلي',  sub: 'قابلية التنفيذ وجاهزية الفرق' },
  { id: 'legal',          icon: '⚖️', name: 'المستشار القانوني',  sub: 'المخاطر القانونية والتنظيمية' },
  { id: 'growth',         icon: '🚀', name: 'مستشار النمو',       sub: 'الاكتساب والاحتفاظ والتوسع' },
  { id: 'risk',           icon: '🛡️', name: 'مستشار المخاطر',    sub: 'تقييم شامل للمخاطر' },
  { id: 'sustainability', icon: '🌱', name: 'مستشار الاستدامة',   sub: 'السمعة والاستدامة المؤسسية' },
]

const SESSION_TYPES = [
  {
    id: 'Quick',
    label: 'جلسة سريعة',
    sub: '٤ مستشارين أساسيين + توصية',
    time: '~١ دقيقة',
    borderColor: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.06)',
  },
  {
    id: 'Full',
    label: 'جلسة كاملة',
    sub: 'كل المستشارين + نقاش + توصية',
    time: '~٣ دقائق',
    borderColor: '#D4A853',
    bg: 'rgba(212, 168, 83, 0.08)',
    recommended: true,
  },
  {
    id: 'Deep',
    label: 'جلسة معمّقة',
    sub: 'تحليل شامل + أسئلة متابعة',
    time: '~٥ دقائق',
    borderColor: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.06)',
  },
]

// ─── Main Page ─────────────────────────────────────────
export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [trialLimitReached, setTrialLimitReached] = useState(false)
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [previousCompanies, setPreviousCompanies] = useState<Array<{
    name: string; sector: string; company_size: string; stage: string; annual_revenue: string; team_size: string
  }>>([])

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data) && data.length > 0) setPreviousCompanies(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      // Fetch session count via the API to respect the same limit
      try {
        const r = await fetch('/api/session/count')
        if (r.ok) {
          const { count } = await r.json() as { count: number }
          setSessionCount(count)
          if (count >= FREE_SESSION_LIMIT) setTrialLimitReached(true)
        }
      } catch { /* ignore */ }
    })
  }, [])
  const [form, setForm] = useState<FormData>({
    companyName: '',
    sector: '',
    companySize: '',
    stage: '',
    revenue: '',
    teamSize: '',
    decisionTitle: '',
    decisionDescription: '',
    decisionCategory: '',
    mainGoal: '',
    estimatedCost: '',
    timeline: '',
    alternatives: '',
    constraints: '',
    specificConcerns: '',
    coreAdvisors: ['strategic', 'financial', 'market', 'technical'],
    additionalAdvisors: [],
    sessionType: 'Full',
  })

  const set = (key: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const fillFromPreviousCompany = (name: string) => {
    const company = previousCompanies.find((c) => c.name === name)
    if (!company) return
    setForm((prev) => ({
      ...prev,
      companyName: company.name,
      sector: company.sector || prev.sector,
      companySize: company.company_size || prev.companySize,
      stage: company.stage || prev.stage,
      revenue: company.annual_revenue || prev.revenue,
      teamSize: company.team_size || prev.teamSize,
    }))
  }

  const toggleCoreAdvisor = (id: string) => {
    setForm((prev) => ({
      ...prev,
      coreAdvisors: prev.coreAdvisors.includes(id)
        ? prev.coreAdvisors.filter((a) => a !== id)
        : [...prev.coreAdvisors, id],
    }))
  }

  const toggleAdvisor = (id: string) => {
    setForm((prev) => ({
      ...prev,
      additionalAdvisors: prev.additionalAdvisors.includes(id)
        ? prev.additionalAdvisors.filter((a) => a !== id)
        : [...prev.additionalAdvisors, id],
    }))
  }

  const handleStart = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        companyProfile: {
          company_name: form.companyName || 'شركة غير مسماة',
          sector: form.sector || 'أخرى',
          company_size: form.companySize || 'صغيرة ومتوسطة',
          stage: form.stage || 'نمو',
          annual_revenue: form.revenue,
          team_size: form.teamSize,
        },
        decision: {
          title: form.decisionTitle || 'قرار غير معنون',
          description: form.decisionDescription || '',
          category: form.decisionCategory || 'أخرى',
          primary_goal: form.mainGoal || '',
          estimated_cost: form.estimatedCost,
          expected_timeline: form.timeline,
          alternatives: form.alternatives,
          constraints: form.constraints,
        },
        additionalAdvisors: form.coreAdvisors,
        sessionType: form.sessionType,
        specificConcerns: form.specificConcerns,
      }

      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.error === 'trial_limit_reached') {
          setTrialLimitReached(true)
          return
        }
        throw new Error(err.error || 'Failed to create session')
      }
      const { sessionId } = await res.json()
      router.push(`/session/${sessionId}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'حدث خطأ، حاول مرة ثانية')
    } finally {
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter: { x: -40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: 40, opacity: 0 },
  }

  if (trialLimitReached) {
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966554422881'
    const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'tamome2009@Hotmail.com'
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <AppSidebar />
        <main className="md:mr-60 min-h-screen p-6 md:p-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div
              className="rounded-3xl p-8 md:p-10"
              style={{
                background: 'rgba(19,24,32,0.9)',
                backdropFilter: 'blur(24px)',
                border: '1px solid var(--border-gold)',
                boxShadow: '0 0 60px rgba(212,168,83,0.08)',
              }}
            >
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-black mb-2" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                استنفدت جلساتك المجانية
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                الخطة المجانية تتيح {FREE_SESSION_LIMIT} جلسات. للحصول على المزيد تواصل معنا.
              </p>
              <div className="space-y-3">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن باقات المجلس الاستشاري')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#25D366', color: '#fff', fontFamily: 'Tajawal' }}
                >
                  <span>💬</span> تواصل عبر واتساب
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid var(--border-gold)', color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}
                >
                  <span>✉️</span> راسلنا بالبريد
                </a>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <main className="md:mr-60 min-h-screen p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 pt-4 md:pt-0"
          >
            <h1
              className="text-2xl font-black mb-1"
              style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
            >
              جلسة استشارية جديدة
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
              أدخل تفاصيل قرارك وسيحلله المجلس من ٤ زوايا
            </p>
          </motion.div>

          {/* Trial banner */}
          {sessionCount !== null && (
            <div
              className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between text-sm"
              style={{
                background: sessionCount >= FREE_SESSION_LIMIT - 1 ? 'rgba(239,68,68,0.08)' : 'rgba(212,168,83,0.06)',
                border: `1px solid ${sessionCount >= FREE_SESSION_LIMIT - 1 ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,83,0.2)'}`,
                fontFamily: 'IBM Plex Sans Arabic',
              }}
            >
              <span style={{ color: sessionCount >= FREE_SESSION_LIMIT - 1 ? '#EF4444' : 'var(--text-secondary)' }}>
                {FREE_SESSION_LIMIT - sessionCount === 0
                  ? 'استنفدت جلساتك المجانية'
                  : `متبقي ${FREE_SESSION_LIMIT - sessionCount} جلسة مجانية`}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {sessionCount}/{FREE_SESSION_LIMIT} جلسات
              </span>
            </div>
          )}

          {/* Progress steps */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.number} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => s.number < step && setStep(s.number)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300"
                    style={{
                      background: step === s.number
                        ? 'rgba(212, 168, 83, 0.15)'
                        : step > s.number
                        ? 'rgba(212, 168, 83, 0.08)'
                        : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${
                        step >= s.number ? 'var(--accent-gold)' : 'var(--border)'
                      }`,
                      boxShadow: step === s.number ? '0 0 20px rgba(212,168,83,0.25)' : 'none',
                    }}
                  >
                    {step > s.number ? '✓' : s.icon}
                  </div>
                  <span
                    className="text-xs hidden sm:block"
                    style={{
                      color: step >= s.number ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontFamily: 'IBM Plex Sans Arabic',
                    }}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{
                      background: step > s.number
                        ? 'var(--accent-gold)'
                        : 'var(--border)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="glass-strong rounded-3xl p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                {/* ─── Step 1: Company ─── */}
                {step === 1 && (
                  <>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      🏢 ملف الشركة
                    </h2>

                    {/* Previous company picker */}
                    {previousCompanies.length > 0 && (
                      <div
                        className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)' }}
                      >
                        <span className="text-sm shrink-0" style={{ color: 'var(--accent-gold)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          شركة سابقة:
                        </span>
                        <select
                          className="flex-1 bg-transparent text-sm outline-none appearance-none"
                          style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}
                          defaultValue=""
                          onChange={(e) => fillFromPreviousCompany(e.target.value)}
                        >
                          <option value="" disabled>اختر لملء البيانات تلقائياً...</option>
                          {previousCompanies.map((c) => (
                            <option key={c.name} value={c.name} style={{ background: '#131820' }}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <FloatInput label="اسم الشركة" value={form.companyName} onChange={set('companyName')} required maxLength={100} />
                    <FloatSelect
                      label="القطاع"
                      value={form.sector}
                      onChange={set('sector')}
                      required
                      options={['تقنية', 'مطاعم وضيافة', 'تجارة إلكترونية', 'عقارات', 'صحة', 'تعليم', 'مالية', 'صناعة', 'خدمات', 'أخرى']}
                    />
                    <RadioCards
                      label="حجم الشركة"
                      value={form.companySize}
                      onChange={set('companySize')}
                      options={['شركة ناشئة', 'صغيرة ومتوسطة', 'متوسطة', 'كبيرة']}
                    />
                    <RadioCards
                      label="المرحلة"
                      value={form.stage}
                      onChange={set('stage')}
                      options={['قبل الإيرادات', 'إيرادات مبكرة', 'نمو', 'نضج']}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FloatInput label="الإيرادات السنوية (اختياري)" value={form.revenue} onChange={set('revenue')} />
                      <FloatInput label="عدد الفريق (اختياري)" value={form.teamSize} onChange={set('teamSize')} type="number" />
                    </div>
                  </>
                )}

                {/* ─── Step 2: Decision ─── */}
                {step === 2 && (
                  <>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      💡 تفاصيل القرار
                    </h2>
                    <FloatInput label="عنوان القرار" value={form.decisionTitle} onChange={set('decisionTitle')} required maxLength={150} />
                    <FloatTextarea label="وصف القرار" value={form.decisionDescription} onChange={set('decisionDescription')} required rows={4} maxLength={2000} />
                    <FloatSelect
                      label="فئة القرار"
                      value={form.decisionCategory}
                      onChange={set('decisionCategory')}
                      required
                      options={['استثمار', 'توسع', 'منتج', 'تسعير', 'شراكة', 'إعادة هيكلة', 'توظيف', 'تقنية', 'أخرى']}
                    />
                    <FloatInput label="الهدف الرئيسي" value={form.mainGoal} onChange={set('mainGoal')} required maxLength={300} />
                    <div className="grid grid-cols-2 gap-4">
                      <FloatInput label="التكلفة المتوقعة (اختياري)" value={form.estimatedCost} onChange={set('estimatedCost')} />
                      <FloatSelect
                        label="الجدول الزمني (اختياري)"
                        value={form.timeline}
                        onChange={set('timeline')}
                        options={['فوري', 'خلال ربع سنة', 'خلال سنة', 'مرن']}
                      />
                    </div>
                    <FloatTextarea label="البدائل المدروسة (اختياري)" value={form.alternatives} onChange={set('alternatives')} rows={3} maxLength={500} />
                    <FloatTextarea label="القيود المعروفة (اختياري)" value={form.constraints} onChange={set('constraints')} rows={3} maxLength={500} />
                  </>
                )}

                {/* ─── Step 3: Context ─── */}
                {step === 3 && (
                  <>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      📎 السياق الإضافي
                    </h2>
                    <FloatTextarea label="مخاوف محددة (اختياري)" value={form.specificConcerns} onChange={set('specificConcerns')} rows={3} maxLength={500} />

                    {/* File upload zone */}
                    <div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                        رفع ملفات داعمة (اختياري)
                      </p>
                      <div
                        className="rounded-xl p-8 text-center transition-all duration-300 cursor-pointer"
                        style={{
                          border: '2px dashed rgba(212, 168, 83, 0.3)',
                          background: 'rgba(212, 168, 83, 0.03)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-gold)'
                          e.currentTarget.style.background = 'rgba(212, 168, 83, 0.06)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.3)'
                          e.currentTarget.style.background = 'rgba(212, 168, 83, 0.03)'
                        }}
                      >
                        <span className="text-2xl">📁</span>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          اسحب الملفات هنا أو اضغط للاختيار
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          PDF, Excel, Word — حجم أقصى ٢٠ ميجابايت
                        </p>
                      </div>
                    </div>

                    {/* Active advisors */}
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Tajawal' }}>
                        المستشارون المتاحون
                      </p>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                        مفعّلون افتراضياً — يمكنك إلغاء تفعيل أي منهم
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {ACTIVE_ADVISORS_UI.map((advisor) => {
                          const active = form.coreAdvisors.includes(advisor.id)
                          return (
                            <button
                              key={advisor.id}
                              type="button"
                              onClick={() => toggleCoreAdvisor(advisor.id)}
                              className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-right"
                              style={{
                                background: active ? 'rgba(212, 168, 83, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${active ? 'var(--accent-gold)' : 'var(--border)'}`,
                                boxShadow: active ? '0 0 16px rgba(212,168,83,0.08)' : 'none',
                              }}
                            >
                              <span className="text-lg mt-0.5">{advisor.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium leading-tight" style={{
                                  color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                  fontFamily: 'IBM Plex Sans Arabic',
                                }}>
                                  {advisor.name}
                                </p>
                                <p className="text-xs mt-0.5 leading-tight" style={{
                                  color: 'var(--text-muted)',
                                  fontFamily: 'IBM Plex Sans Arabic',
                                }}>
                                  {advisor.sub}
                                </p>
                              </div>
                              <span className="text-xs mt-0.5 shrink-0" style={{ color: active ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                                {active ? '✓' : '○'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Coming-soon advisors */}
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Tajawal' }}>
                        قريباً — مستشارون إضافيون
                      </p>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                        سيتم إتاحتهم قريباً
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {COMING_SOON_ADVISORS_UI.map((advisor) => (
                          <div
                            key={advisor.id}
                            className="relative flex items-start gap-3 p-3 rounded-xl text-right"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border)',
                              opacity: 0.5,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          >
                            {/* قريباً badge */}
                            <span
                              className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(17,17,24,0.9)',
                                border: '1px solid rgba(212,168,83,0.4)',
                                color: 'var(--accent-gold)',
                                fontFamily: 'Tajawal',
                                fontSize: '10px',
                              }}
                            >
                              قريباً
                            </span>
                            <span className="text-lg mt-0.5">{advisor.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-tight" style={{
                                color: 'var(--text-muted)',
                                fontFamily: 'IBM Plex Sans Arabic',
                              }}>
                                {advisor.name}
                              </p>
                              <p className="text-xs mt-0.5 leading-tight" style={{
                                color: 'var(--text-muted)',
                                fontFamily: 'IBM Plex Sans Arabic',
                              }}>
                                {advisor.sub}
                              </p>
                            </div>
                            <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--border)' }}>🔒</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ─── Step 4: Review ─── */}
                {step === 4 && (
                  <>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      ✅ المراجعة والتأكيد
                    </h2>

                    {/* Summary cards */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>الشركة</p>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                          {form.companyName || 'لم يُحدد'} — {form.sector || 'لم يُحدد'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          {form.companySize} | {form.stage}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>القرار</p>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                          {form.decisionTitle || 'لم يُحدد'}
                        </p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          {form.decisionDescription || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Session type selection */}
                    <div>
                      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'Tajawal' }}>
                        اختر نوع الجلسة
                      </p>
                      <div className="space-y-3">
                        {SESSION_TYPES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, sessionType: st.id }))}
                            className="w-full p-4 rounded-2xl text-right transition-all duration-200 relative"
                            style={{
                              background: form.sessionType === st.id ? st.bg : 'rgba(255,255,255,0.03)',
                              border: `2px solid ${form.sessionType === st.id ? st.borderColor : 'var(--border)'}`,
                              boxShadow: form.sessionType === st.id ? `0 0 20px ${st.borderColor}22` : 'none',
                            }}
                          >
                            {st.recommended && (
                              <span
                                className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{
                                  background: 'rgba(212, 168, 83, 0.15)',
                                  color: 'var(--accent-gold)',
                                  fontFamily: 'Tajawal',
                                }}
                              >
                                مُوصى به
                              </span>
                            )}
                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                              {st.label}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                              {st.sub}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: st.borderColor, fontFamily: 'IBM Plex Sans Arabic' }}>
                              {st.time}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error message */}
            {submitError && (
              <div className="mt-5 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontFamily: 'IBM Plex Sans Arabic' }}>
                ⚠️ {submitError}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: step === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  fontFamily: 'Tajawal, sans-serif',
                  opacity: step === 1 ? 0.5 : 1,
                }}
              >
                ← السابق
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  التالي →
                </button>
              ) : (
                <motion.button
                  whileHover={!submitting ? { scale: 1.03, boxShadow: '0 0 40px rgba(212, 168, 83, 0.3)' } : {}}
                  whileTap={!submitting ? { scale: 0.97 } : {}}
                  onClick={handleStart}
                  disabled={submitting}
                  className="btn-gold px-8 py-3 rounded-xl font-bold text-base"
                  style={{ fontFamily: 'Tajawal, sans-serif', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#07090F]/30 border-t-[#07090F] rounded-full animate-spin" />
                      جاري إنشاء الجلسة...
                    </span>
                  ) : (
                    'ابدأ الجلسة الاستشارية ✨'
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
