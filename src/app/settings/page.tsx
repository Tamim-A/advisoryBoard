'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-5" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({
  value, onChange, type = 'text', readOnly, dir, placeholder,
}: { value: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean; dir?: 'ltr' | 'rtl'; placeholder?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      dir={dir}
      placeholder={placeholder}
      onFocus={(e) => {
        setFocused(true)
        if (!readOnly) {
          e.target.style.borderColor = 'var(--accent-gold)'
          e.target.style.boxShadow = '0 0 12px rgba(212,168,83,0.1)'
        }
      }}
      onBlur={(e) => {
        setFocused(false)
        e.target.style.borderColor = readOnly ? 'var(--border)' : 'var(--border)'
        e.target.style.boxShadow = 'none'
      }}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
      style={{
        background: readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused && !readOnly ? 'var(--accent-gold)' : 'var(--border)'}`,
        color: readOnly ? 'var(--text-muted)' : 'var(--text-primary)',
        fontFamily: 'IBM Plex Sans Arabic',
        cursor: readOnly ? 'not-allowed' : 'text',
      }}
    />
  )
}

function PasswordField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          onFocus={(e) => { setFocused(true); e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 12px rgba(212,168,83,0.1)' }}
          onBlur={(e) => { setFocused(false); e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            fontFamily: 'IBM Plex Sans Arabic',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: 'var(--text-muted)' }}
          tabIndex={-1}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  // Profile
  const [fullName, setFullName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  // Usage
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [sessionLimit, setSessionLimit] = useState(2)
  const [planType, setPlanType] = useState('مجاني')

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig()) { setLoading(false); return }
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setFullName((user.user_metadata?.full_name as string | undefined) ?? '')
      setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : '')
      try {
        const r = await fetch('/api/session/count')
        if (r.ok) {
          const { count, limit, vip } = await r.json() as { count: number; limit: number; vip: boolean }
          setSessionCount(count)
          setSessionLimit(limit)
          setPlanType(vip ? 'VIP' : 'مجاني')
        }
      } catch { /* ignore */ }
      setLoading(false)
    })
  }, [router])

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileMsg('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (error) throw error
      // update profiles table if it exists
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId)
      setProfileMsg('تم حفظ التغييرات بنجاح')
    } catch {
      setProfileMsg('حدث خطأ أثناء الحفظ')
    } finally {
      setProfileSaving(false)
      setTimeout(() => setProfileMsg(''), 3000)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordMsg('كلمتا المرور غير متطابقتين'); return }
    if (newPassword.length < 8) { setPasswordMsg('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setPasswordSaving(true)
    setPasswordMsg('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg('تم تحديث كلمة المرور بنجاح')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordMsg('حدث خطأ أثناء التحديث')
    } finally {
      setPasswordSaving(false)
      setTimeout(() => setPasswordMsg(''), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'حذف') return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-6 h-6 border-2 border-[#D4A853]/30 border-t-[#D4A853] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <main className="md:mr-60 min-h-screen p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-4 md:pt-0">
            <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
              الإعدادات
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
              إدارة حسابك وإعداداتك الشخصية
            </p>
          </motion.div>

          <div className="space-y-5">
            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Section title="👤 الملف الشخصي">
                <div className="space-y-4">
                  <Field label="الاسم الكامل">
                    <Input value={fullName} onChange={setFullName} placeholder="الاسم الكامل" />
                  </Field>
                  <Field label="البريد الإلكتروني">
                    <Input value={userEmail} readOnly dir="ltr" />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                      لا يمكن تغيير البريد الإلكتروني
                    </p>
                  </Field>
                  {profileMsg && (
                    <p className="text-sm" style={{ color: profileMsg.includes('خطأ') ? '#EF4444' : '#22C55E', fontFamily: 'IBM Plex Sans Arabic' }}>
                      {profileMsg}
                    </p>
                  )}
                  <button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ fontFamily: 'Tajawal', opacity: profileSaving ? 0.7 : 1 }}
                  >
                    {profileSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </Section>
            </motion.div>

            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Section title="🔒 الأمان">
                <div className="space-y-4">
                  <PasswordField label="كلمة المرور الجديدة" value={newPassword} onChange={setNewPassword} placeholder="8 أحرف على الأقل" />
                  <PasswordField label="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={setConfirmPassword} placeholder="أعد كتابة كلمة المرور" />
                  {passwordMsg && (
                    <p className="text-sm" style={{ color: passwordMsg.includes('خطأ') || passwordMsg.includes('غير') ? '#EF4444' : '#22C55E', fontFamily: 'IBM Plex Sans Arabic' }}>
                      {passwordMsg}
                    </p>
                  )}
                  <button
                    onClick={handleUpdatePassword}
                    disabled={passwordSaving || !newPassword}
                    className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ fontFamily: 'Tajawal', opacity: passwordSaving || !newPassword ? 0.5 : 1 }}
                  >
                    {passwordSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                  </button>
                </div>
              </Section>
            </motion.div>

            {/* Usage */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Section title="📊 الجلسات والاستخدام">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'الجلسات المستخدمة', value: sessionCount !== null ? `${sessionCount} / ${sessionLimit}` : '—' },
                    { label: 'نوع الحساب', value: planType },
                    { label: 'تاريخ التسجيل', value: createdAt || '—' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.15)' }}>
                      <p className="text-lg font-black" style={{ color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}>{stat.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>

            {/* Danger zone */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl p-6" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <h2 className="text-base font-bold mb-2" style={{ fontFamily: 'Tajawal', color: '#EF4444' }}>⚠️ منطقة الخطر</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  حذف الحساب إجراء لا يمكن التراجع عنه
                </p>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontFamily: 'Tajawal' }}
                >
                  حذف حسابي
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full mx-4 rounded-2xl p-6"
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="text-lg font-black mb-2 text-center" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
              تأكيد حذف الحساب
            </h3>
            <p className="text-sm mb-4 text-center" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
              سيتم حذف جميع بياناتك وجلساتك بشكل نهائي. اكتب <strong style={{ color: '#EF4444' }}>حذف</strong> للتأكيد
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="اكتب: حذف"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--text-primary)', fontFamily: 'Tajawal', textAlign: 'center' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'Tajawal' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'حذف' || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: deleteConfirm === 'حذف' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: deleteConfirm === 'حذف' ? '#EF4444' : 'var(--text-muted)',
                  fontFamily: 'Tajawal',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'جاري الحذف...' : 'حذف نهائي'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
