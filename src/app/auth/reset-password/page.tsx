'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4A853, transparent)' }}
        />
        <div className="absolute inset-0 dot-grid opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4 z-10"
      >
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: 'rgba(19, 24, 32, 0.9)',
            backdropFilter: 'blur(24px)',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 0 60px rgba(212, 168, 83, 0.08), 0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center mb-4">
              <span className="text-[#07090F] font-black text-lg" style={{ fontFamily: 'Tajawal' }}>AB</span>
            </div>
            <h1 className="text-xl font-black gold-text" style={{ fontFamily: 'Tajawal' }}>
              تعيين كلمة مرور جديدة
            </h1>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-base font-bold mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                تم تحديث كلمة المرور
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                سيتم تحويلك إلى لوحة التحكم...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontFamily: 'IBM Plex Sans Arabic' }}>
                  {error}
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    required
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'IBM Plex Sans Arabic' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 12px rgba(212,168,83,0.1)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    required
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'IBM Plex Sans Arabic' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 12px rgba(212,168,83,0.1)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="btn-gold w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2"
                style={{ fontFamily: 'Tajawal', opacity: loading ? 0.7 : 1 }}
              >
                {loading && <span className="w-4 h-4 border-2 border-[#07090F]/30 border-t-[#07090F] rounded-full animate-spin" />}
                {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  )
}
