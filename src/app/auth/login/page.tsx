'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const useSupabase = hasSupabaseConfig()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!useSupabase) {
      // Mock mode — direct redirect
      await new Promise((r) => setTimeout(r, 1000))
      router.push('/dashboard')
      return
    }

    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (err) throw err
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')

    if (!useSupabase) {
      await new Promise((r) => setTimeout(r, 800))
      router.push('/dashboard')
      return
    }

    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (err) throw err
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4A853, transparent)' }}
        />
        <div className="absolute inset-0 dot-grid opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center mb-4">
              <span className="text-[#07090F] font-black text-lg" style={{ fontFamily: 'Tajawal' }}>
                AB
              </span>
            </div>
            <h1
              className="text-2xl font-black gold-text"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              مرحبًا بك في المجلس الاستشاري
            </h1>
            <p
              className="text-sm mt-2 text-center"
              style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
            >
              سجّل دخولك للوصول إلى مجلسك الاستشاري
            </p>
          </div>

          {/* Magic Link sent state */}
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="text-4xl mb-4">📬</div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}
              >
                تحقق من بريدك الإلكتروني
              </h2>
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}
              >
                أرسلنا رابط الدخول إلى <strong>{email}</strong>
                <br />
                اضغط عليه للدخول مباشرة
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}
              >
                استخدم إيميل آخر
              </button>
            </motion.div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#EF4444',
                    fontFamily: 'IBM Plex Sans Arabic',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="relative group">
                  <label
                    className="block text-sm mb-1.5 font-medium"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-gold)'
                      e.target.style.boxShadow = '0 0 20px rgba(212, 168, 83, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="btn-gold w-full py-3.5 rounded-xl text-base font-bold mt-2"
                  style={{ fontFamily: 'Tajawal, sans-serif', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#07090F]/30 border-t-[#07090F] rounded-full animate-spin" />
                      جاري الإرسال...
                    </span>
                  ) : useSupabase ? (
                    'دخول برابط سريع'
                  ) : (
                    'دخول (تجريبي)'
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
                  أو
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Google button */}
              <motion.button
                onClick={handleGoogle}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="btn-outline-gold w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-3"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                دخول بحساب Google
              </motion.button>

              {/* Demo login */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>أو</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                }}
              >
                دخول تجريبي بدون حساب
              </button>

              <p
                className="text-xs text-center mt-4"
                style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
              >
                بالدخول فأنت توافق على الشروط وسياسة الخصوصية
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  )
}
