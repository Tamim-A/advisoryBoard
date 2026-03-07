'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { href: '/session/new', label: 'جلسة جديدة', icon: '✨' },
  { href: '/dashboard', label: 'الجلسات السابقة', icon: '📂' },
  { href: '/dashboard', label: 'الإعدادات', icon: '⚙️' },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
      </nav>

      {/* Bottom — user info */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(212, 168, 83, 0.15)', color: 'var(--accent-gold)' }}
          >
            م
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}>
              مطعم نخيل
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
              الخطة المجانية
            </p>
          </div>
        </div>
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
