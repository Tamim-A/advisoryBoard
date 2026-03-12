'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

type Tab = 'login' | 'signup'
type View = 'main' | 'forgot' | 'forgot_sent' | 'magic_sent'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function PasswordInput({
  value, onChange, placeholder, label, required,
}: { value: string; onChange: (v: string) => void; placeholder?: string; label: string; required?: boolean }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
        {label}{required && ' *'}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          dir="ltr"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 pr-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            fontFamily: 'IBM Plex Sans Arabic',
            boxShadow: focused ? '0 0 16px rgba(212,168,83,0.1)' : 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute left-3 top-1/2 -translate-y-1/2 transition-opacity"
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, label, type = 'text', required, dir,
}: { value: string; onChange: (v: string) => void; placeholder?: string; label: string; type?: string; required?: boolean; dir?: 'ltr' | 'rtl' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={dir}
        onFocus={(e) => {
          setFocused(true)
          e.target.style.borderColor = 'var(--accent-gold)'
          e.target.style.boxShadow = '0 0 16px rgba(212,168,83,0.1)'
        }}
        onBlur={(e) => {
          setFocused(false)
          e.target.style.borderColor = 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          fontFamily: 'IBM Plex Sans Arabic',
        }}
      />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const useSupabase = hasSupabaseConfig()

  const [tab, setTab] = useState<Tab>('login')
  const [view, setView] = useState<View>('main')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sign-up fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')

  const clearError = () => setError('')

  // ── Handlers ────────────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (signupPassword !== signupConfirm) { setError('كلمتا المرور غير متطابقتين'); return }
    if (signupPassword.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    if (!useSupabase) { await new Promise((r) => setTimeout(r, 800)); router.push('/dashboard'); return }
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: signupName } },
      })
      if (err) throw err
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    if (!useSupabase) { await new Promise((r) => setTimeout(r, 800)); router.push('/dashboard'); return }
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (err) {
        if (err.message.includes('Invalid login credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }
        throw err
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (err) throw err
      setView('forgot_sent')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    clearError()
    setLoading(true)
    if (!useSupabase) { await new Promise((r) => setTimeout(r, 800)); router.push('/dashboard'); return }
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (err) throw err
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ — حاول مجدداً')
      setLoading(false)
    }
  }

  const Spinner = () => (
    <span className="w-4 h-4 border-2 border-[#07090F]/30 border-t-[#07090F] rounded-full animate-spin inline-block" />
  )

  // ── Inner views ──────────────────────────────────────────────

  const renderForgot = () => (
    <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <button
        onClick={() => { setView('main'); clearError() }}
        className="flex items-center gap-1.5 text-xs mb-5"
        style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}
      >
        → العودة لتسجيل الدخول
      </button>
      <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
        استعادة كلمة المرور
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
        سنرسل لك رابط لإعادة تعيين كلمة المرور
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <form onSubmit={handleForgot} className="space-y-4">
        <TextInput label="البريد الإلكتروني" value={forgotEmail} onChange={setForgotEmail} type="email" required dir="ltr" placeholder="you@example.com" />
        <GoldButton loading={loading}>{loading ? <><Spinner /> جاري الإرسال...</> : 'إرسال رابط الاستعادة'}</GoldButton>
      </form>
    </motion.div>
  )

  const renderForgotSent = () => (
    <motion.div key="forgot_sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
      <div className="text-4xl mb-4">📬</div>
      <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
        تحقق من بريدك الإلكتروني
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
        أرسلنا رابط إعادة التعيين إلى <strong>{forgotEmail}</strong>
      </p>
      <button onClick={() => { setView('main'); clearError() }} className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
        العودة لتسجيل الدخول
      </button>
    </motion.div>
  )

  const renderMain = () => (
    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Tabs */}
      <div className="flex gap-1 mb-7 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); clearError() }}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200"
            style={{
              background: tab === t ? 'rgba(212,168,83,0.12)' : 'transparent',
              color: tab === t ? 'var(--accent-gold)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent-gold)' : '2px solid transparent',
              fontFamily: 'Tajawal',
            }}
          >
            {t === 'login' ? 'تسجيل دخول' : 'إنشاء حساب'}
          </button>
        ))}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <AnimatePresence mode="wait">
        {tab === 'signup' ? (
          <motion.form key="signup" onSubmit={handleSignUp} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
            <TextInput label="الاسم الكامل" value={signupName} onChange={setSignupName} required placeholder="محمد أحمد" />
            <TextInput label="البريد الإلكتروني" value={signupEmail} onChange={setSignupEmail} type="email" required dir="ltr" placeholder="you@example.com" />
            <PasswordInput label="كلمة المرور" value={signupPassword} onChange={setSignupPassword} required placeholder="8 أحرف على الأقل" />
            <PasswordInput label="تأكيد كلمة المرور" value={signupConfirm} onChange={setSignupConfirm} required placeholder="أعد كتابة كلمة المرور" />
            <GoldButton loading={loading}>{loading ? <><Spinner /> جاري الإنشاء...</> : 'إنشاء حساب'}</GoldButton>
            <Divider />
            <GoogleButton loading={loading} onClick={handleGoogle} />
          </motion.form>
        ) : (
          <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            <TextInput label="البريد الإلكتروني" value={loginEmail} onChange={setLoginEmail} type="email" required dir="ltr" placeholder="you@example.com" />
            <div>
              <PasswordInput label="كلمة المرور" value={loginPassword} onChange={setLoginPassword} required placeholder="••••••••" />
              <button
                type="button"
                onClick={() => { setForgotEmail(loginEmail); setView('forgot'); clearError() }}
                className="mt-1.5 text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <GoldButton loading={loading}>{loading ? <><Spinner /> جاري الدخول...</> : 'تسجيل دخول'}</GoldButton>
            <Divider />
            <GoogleButton loading={loading} onClick={handleGoogle} />
          </motion.form>
        )}
      </AnimatePresence>

      <p className="text-xs text-center mt-5" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
        بالدخول فأنت توافق على الشروط وسياسة الخصوصية
      </p>
    </motion.div>
  )

  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
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
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center mb-4">
              <span className="text-[#07090F] font-black text-lg" style={{ fontFamily: 'Tajawal' }}>AB</span>
            </div>
            <h1 className="text-2xl font-black gold-text" style={{ fontFamily: 'Tajawal' }}>
              المجلس الاستشاري
            </h1>
            <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
              سجّل دخولك للوصول إلى مجلسك الاستشاري
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'main' && renderMain()}
            {view === 'forgot' && renderForgot()}
            {view === 'forgot_sent' && renderForgotSent()}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  )
}

// ── Shared sub-components ────────────────────────────────────

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontFamily: 'IBM Plex Sans Arabic' }}>
      {children}
    </div>
  )
}

function GoldButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.02 } : {}}
      whileTap={!loading ? { scale: 0.98 } : {}}
      className="btn-gold w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2"
      style={{ fontFamily: 'Tajawal', opacity: loading ? 0.7 : 1 }}
    >
      {children}
    </motion.button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>أو</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={!loading ? { scale: 1.02 } : {}}
      whileTap={!loading ? { scale: 0.98 } : {}}
      className="btn-outline-gold w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-3"
      style={{ fontFamily: 'Tajawal' }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      دخول بحساب Google
    </motion.button>
  )
}
