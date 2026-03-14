'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseConfig } from '@/lib/supabase/client'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    createClient().auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-strong' : ''
      }`}
      style={{
        borderBottom: scrolled ? '1px solid rgba(212, 168, 83, 0.15)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center">
            <span className="text-[#07090F] font-bold text-sm font-heading">AB</span>
          </div>
          <span
            className="text-lg font-bold gold-text font-heading"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            Advisory Board
          </span>
        </div>

        {/* Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: 'كيف تعمل', href: '#how-it-works' },
            { name: 'المستشارون', href: '#advisors' },
            { name: 'لماذا نحن', href: '#why-us' }
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm text-[#94A3B8] hover:text-[#D4A853] transition-colors duration-300"
              style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        {loggedIn ? (
          <Link href="/dashboard">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold px-5 py-2.5 rounded-lg text-sm inline-block cursor-pointer"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              لوحة التحكم
            </motion.span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-outline-gold px-4 py-2 rounded-lg text-sm relative overflow-hidden inline-block cursor-pointer"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                تسجيل دخول
              </motion.span>
            </Link>
            <Link href="/auth/login">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-gold px-4 py-2 rounded-lg text-sm inline-block cursor-pointer"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إنشاء حساب
              </motion.span>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  )
}
