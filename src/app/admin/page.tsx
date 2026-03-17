'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'

interface Stats {
  totalUsers: number
  totalSessions: number
  sessionsThisMonth: number
  sessionsToday: number
}

interface FeatureFlag {
  key: string
  enabled: boolean
  label_ar: string
  updated_at: string
}

interface RecentSession {
  id: string
  title: string
  session_type: string
  status: string
  final_verdict: string | null
  created_at: string
  user_id: string | null
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>{label}</p>
          <p className="text-3xl font-black" style={{ color, fontFamily: 'Tajawal' }}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </motion.div>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.ok ? r.json() : null),
      fetch('/api/admin/sessions').then((r) => r.ok ? r.json() : []),
      fetch('/api/admin/feature-flags').then((r) => r.ok ? r.json() : []),
    ]).then(([s, sessions, flags]) => {
      if (s) setStats(s as Stats)
      else setError('تعذّر تحميل الإحصائيات')
      if (Array.isArray(sessions)) setRecentSessions(sessions as RecentSession[])
      if (Array.isArray(flags)) setFeatureFlags(flags as FeatureFlag[])
    }).catch(() => setError('خطأ في الاتصال')).finally(() => setLoading(false))
  }, [])

  const toggleFlag = async (key: string, currentEnabled: boolean) => {
    setTogglingKey(key)
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      })
      if (res.ok) {
        setFeatureFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !currentEnabled } : f))
      }
    } finally {
      setTogglingKey(null)
    }
  }

  const statCards = stats ? [
    { icon: '👥', label: 'إجمالي المستخدمين', value: stats.totalUsers, color: 'var(--accent-gold)' },
    { icon: '📋', label: 'إجمالي الجلسات', value: stats.totalSessions, color: '#60A5FA' },
    { icon: '📊', label: 'جلسات هذا الشهر', value: stats.sessionsThisMonth, color: '#34D399' },
    { icon: '⚡', label: 'جلسات اليوم', value: stats.sessionsToday, color: '#F472B6' },
  ] : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <main className="md:mr-60 min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4 md:pt-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                لوحة التحكم
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}>
                Admin
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
              نظرة عامة على استخدام المنصة
            </p>
          </motion.div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontFamily: 'IBM Plex Sans Arabic' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#D4A853]/30 border-t-[#D4A853] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 p-5 rounded-2xl transition-all duration-200"
                  style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)' }}
                >
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>إدارة المستخدمين</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>تعديل الباقات والحدود</p>
                  </div>
                </Link>
                <div
                  className="flex items-center gap-3 p-5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', opacity: 0.5 }}
                >
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>التقارير</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>قريباً</p>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              {featureFlags.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                      التحكم في الميزات
                    </h2>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {featureFlags.map((flag) => (
                      <div
                        key={flag.key}
                        className="px-5 py-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                            {flag.label_ar}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                            {flag.key}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFlag(flag.key, flag.enabled)}
                          disabled={togglingKey === flag.key}
                          className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
                          style={{
                            background: flag.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
                            border: `1px solid ${flag.enabled ? '#22C55E' : 'var(--border)'}`,
                            opacity: togglingKey === flag.key ? 0.5 : 1,
                          }}
                        >
                          <span
                            className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                            style={{
                              background: flag.enabled ? '#22C55E' : 'var(--text-muted)',
                              right: flag.enabled ? '2px' : 'calc(100% - 22px)',
                            }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sessions */}
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 className="text-sm font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                    آخر الجلسات
                  </h2>
                </div>
                {recentSessions.length === 0 ? (
                  <div className="py-10 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic', fontSize: '14px' }}>
                    لا توجد جلسات بعد
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {recentSessions.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="px-5 py-3 flex items-center justify-between gap-4"
                        style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                            {session.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                            {new Date(session.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: session.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(212,168,83,0.1)',
                              color: session.status === 'completed' ? '#22C55E' : 'var(--accent-gold)',
                              fontFamily: 'IBM Plex Sans Arabic',
                            }}
                          >
                            {session.status === 'completed' ? 'مكتملة' : 'جارية'}
                          </span>
                          <Link
                            href={`/session/${session.id}`}
                            className="text-xs px-2 py-0.5 rounded-lg transition-all duration-150"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}
                          >
                            عرض
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
