'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

const ADMIN_EMAILS = ['tamome2009@hotmail.com', 'tamome00@gmail.com']

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { href: '/session/new', label: 'جلسة جديدة', icon: '✨' },
  { href: '/dashboard', label: 'الجلسات السابقة', icon: '📂' },
  { href: '/settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDisplay, setUserDisplay] = useState<{ name: string; initial: string; email: string } | null>(null)
  const [isVipUser, setIsVipUser] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [sessionLimit, setSessionLimit] = useState(2)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const email = user.email ?? ''
      const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
      const name = fullName || email.split('@')[0] || 'مستخدم'
      const initial = name.charAt(0).toUpperCase()
      setUserDisplay({ name, initial, email })
      setIsAdmin(ADMIN_EMAILS.includes(email.toLowerCase()))
      try {
        const r = await fetch('/api/session/count')
        if (r.ok) {
          const { count, limit, vip } = await r.json() as { count: number; limit: number; vip: boolean }
          setSessionCount(count)
          setSessionLimit(limit)
          setIsVipUser(vip)
        }
      } catch { /* ignore */ }
    })
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center flex-shrink-0">
          <span className="text-[#07090F] font-black text-sm" style={{ fontFamily: 'Tajawal' }}>AB</span>
        </div>
        <span className="font-bold gold-text text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          Advisory Board
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href && item.href !== '/dashboard' ||
            (item.href === '/dashboard' && item.label === 'الرئيسية' && pathname === '/dashboard')
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative"
              style={{
                background: isActive ? 'rgba(212, 168, 83, 0.08)' : 'transparent',
                color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                borderRight: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Admin link — visible only to admins */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: pathname.startsWith('/admin') ? 'rgba(212, 168, 83, 0.08)' : 'transparent',
              color: pathname.startsWith('/admin') ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              borderRight: pathname.startsWith('/admin') ? '2px solid var(--accent-gold)' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith('/admin')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith('/admin')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            <span className="text-base">🔧</span>
            <span>لوحة التحكم</span>
          </Link>
        )}
      </nav>

      {/* Bottom — user info + logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(212, 168, 83, 0.15)', color: 'var(--accent-gold)' }}
          >
            {userDisplay?.initial ?? '؟'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
              {userDisplay?.name ?? 'مستخدم جديد'}
            </p>
            {isVipUser ? (
              <p className="text-xs font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'IBM Plex Sans Arabic' }}>
                حساب VIP ⭐ — {sessionCount ?? '—'}/{sessionLimit} جلسة
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                الخطة المجانية{sessionCount !== null ? ` — ${sessionCount}/${sessionLimit} جلسات` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: loggingOut ? 'var(--text-muted)' : '#EF4444',
            fontFamily: 'IBM Plex Sans Arabic',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
        >
          {loggingOut ? (
            <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <span>🚪</span>
          )}
          {loggingOut ? 'جاري الخروج...' : 'تسجيل خروج'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 min-h-screen border-l fixed top-0 right-0 z-40"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="text-lg">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 w-64 h-full z-50 md:hidden"
              style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
