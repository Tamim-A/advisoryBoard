'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppSidebar from '@/components/AppSidebar'

interface UserRow {
  id: string
  email: string
  name: string
  plan_type: string
  session_limit: number
  session_count: number
  created_at: string
}

const PLAN_OPTIONS = [
  { value: 'free', label: 'مجاني', limit: 2 },
  { value: 'vip', label: 'VIP', limit: 20 },
  { value: 'vip_plus', label: 'VIP Plus', limit: 50 },
  { value: 'custom', label: 'مخصص', limit: 0 },
]

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' },
    vip: { bg: 'rgba(212,168,83,0.12)', color: 'var(--accent-gold)' },
    vip_plus: { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA' },
    custom: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA' },
  }
  const labels: Record<string, string> = { free: 'مجاني', vip: 'VIP', vip_plus: 'VIP Plus', custom: 'مخصص' }
  const c = colors[plan] ?? colors.free
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-bold"
      style={{ background: c.bg, color: c.color, fontFamily: 'Tajawal' }}
    >
      {labels[plan] ?? plan}
    </span>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState('free')
  const [editLimit, setEditLimit] = useState(2)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setUsers(data as UserRow[])
        else setError('تعذّر تحميل المستخدمين')
      })
      .catch(() => setError('خطأ في الاتصال'))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (user: UserRow) => {
    setEditingId(user.id)
    setEditPlan(user.plan_type)
    setEditLimit(user.session_limit)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPlan('free')
    setEditLimit(2)
  }

  const handlePlanChange = (value: string) => {
    setEditPlan(value)
    const preset = PLAN_OPTIONS.find((p) => p.value === value)
    if (preset && preset.limit > 0) setEditLimit(preset.limit)
  }

  const savePlan = async (userId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: editPlan, session_limit: editLimit }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, plan_type: editPlan, session_limit: editLimit } : u
      ))
      setSavedId(userId)
      setTimeout(() => setSavedId(null), 2000)
      cancelEdit()
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <main className="md:mr-60 min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4 md:pt-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                إدارة المستخدمين
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}>
                Admin
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
              تعديل باقات المستخدمين وحدود الجلسات
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
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {/* Table header */}
              <div
                className="grid gap-3 px-5 py-3 text-xs font-bold"
                style={{
                  gridTemplateColumns: '1fr 1fr 120px 100px 120px',
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontFamily: 'IBM Plex Sans Arabic',
                }}
              >
                <span>المستخدم</span>
                <span>البريد</span>
                <span>الباقة</span>
                <span>الجلسات</span>
                <span>إجراءات</span>
              </div>

              {users.length === 0 ? (
                <div className="py-10 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic', fontSize: '14px' }}>
                  لا يوجد مستخدمون
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {users.map((user, i) => (
                    <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      {/* Main row */}
                      <div
                        className="grid gap-3 px-5 py-3 items-center"
                        style={{
                          gridTemplateColumns: '1fr 1fr 120px 100px 120px',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
                            {user.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                            {new Date(user.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <p className="text-xs truncate" dir="ltr" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <PlanBadge plan={user.plan_type} />
                          {savedId === user.id && (
                            <span className="text-xs" style={{ color: '#22C55E' }}>✓</span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Tajawal' }}>
                          {user.session_count}/{user.session_limit}
                        </p>
                        <button
                          onClick={() => editingId === user.id ? cancelEdit() : startEdit(user)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 font-bold"
                          style={{
                            background: editingId === user.id ? 'rgba(239,68,68,0.08)' : 'rgba(212,168,83,0.08)',
                            border: `1px solid ${editingId === user.id ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,83,0.2)'}`,
                            color: editingId === user.id ? '#EF4444' : 'var(--accent-gold)',
                            fontFamily: 'Tajawal',
                          }}
                        >
                          {editingId === user.id ? 'إلغاء' : 'تعديل'}
                        </button>
                      </div>

                      {/* Edit row */}
                      {editingId === user.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 py-4 flex items-center gap-4 flex-wrap"
                          style={{ background: 'rgba(212,168,83,0.04)', borderTop: '1px solid rgba(212,168,83,0.15)' }}
                        >
                          <div className="flex items-center gap-2">
                            <label className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>الباقة:</label>
                            <select
                              value={editPlan}
                              onChange={(e) => handlePlanChange(e.target.value)}
                              className="px-3 py-1.5 rounded-lg text-sm outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'IBM Plex Sans Arabic' }}
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p.value} value={p.value} style={{ background: '#131820' }}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>الحد:</label>
                            <input
                              type="number"
                              value={editLimit}
                              onChange={(e) => setEditLimit(Number(e.target.value))}
                              min={0}
                              max={1000}
                              className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none text-center"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Tajawal' }}
                            />
                          </div>
                          <button
                            onClick={() => savePlan(user.id)}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-150"
                            style={{
                              background: 'rgba(212,168,83,0.15)',
                              border: '1px solid rgba(212,168,83,0.3)',
                              color: 'var(--accent-gold)',
                              fontFamily: 'Tajawal',
                              opacity: saving ? 0.7 : 1,
                            }}
                          >
                            {saving ? 'جاري الحفظ...' : 'حفظ'}
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
