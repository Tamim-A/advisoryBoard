'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient, hasSupabaseConfig } from '@/lib/supabase/client'

const TYPEWRITER_TEXT = 'قبل أن تُنفّذ قرارًا يكلّفك ملايين...'

function useTypewriter(text: string, speed = 60) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, done }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const stats = [
  { number: '٥', label: 'مستشارين نشطين' },
  { number: 'دقائق', label: 'توصية تنفيذية في' },
  { number: 'AI', label: 'مدعوم بالذكاء الاصطناعي' },
]

export default function HeroSection() {
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, 55)
  const [ctaHref, setCtaHref] = useState('/auth/login')

  useEffect(() => {
    if (!hasSupabaseConfig()) return
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCtaHref('/session/new')
    })
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-mesh dot-grid">
      {/* Rotating accent ring */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          border: '1px solid rgba(212, 168, 83, 0.06)',
          animation: 'rotate-slow 60s linear infinite',
        }}
      >
        <div style={{
          position: 'absolute', top: -4, left: '50%',
          width: 8, height: 8, borderRadius: '50%',
          background: '#D4A853',
          boxShadow: '0 0 20px #D4A853',
        }} />
      </div>

      {/* Radial glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4A853, transparent)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border"
              style={{
                borderColor: 'var(--border-gold)',
                color: 'var(--accent-gold)',
                background: 'rgba(212, 168, 83, 0.06)',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#4ADE80', boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)', animation: 'pulseGlow 2s ease-in-out infinite' }}
              />
              منصة الذكاء الاصطناعي للاستشارات الاستراتيجية
            </span>
          </motion.div>

          {/* Typewriter headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
            style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
          >
            <span className="gold-text">{displayed}</span>
            {!done && (
              <span className="inline-block w-0.5 h-12 md:h-16 bg-[#D4A853] mx-1 animate-pulse align-middle" />
            )}
          </motion.h1>

          {/* Sub-headline */}
          {done && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
            >
              مجلسك الاستشاري{' '}
              <span className="shimmer-text">بقوة الذكاء الاصطناعي</span>
            </motion.h2>
          )}

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
          >
            منصة ذكاء اصطناعي تحلل قراراتك من{' '}
            <span style={{ color: 'var(--accent-gold)' }}>٩ زوايا متخصصة</span> وتصدر توصية تنفيذية مدعومة بالبيانات
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-2">
            <motion.a
              href={ctaHref}
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(212, 168, 83, 0.35)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold px-8 py-4 rounded-xl text-lg font-bold relative overflow-hidden inline-block"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              ابدأ جلستك الأولى
            </motion.a>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-outline-gold px-8 py-4 rounded-xl text-lg font-semibold"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              شاهد كيف تعمل
            </motion.a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-12 mt-8"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div
                  className="gold-text text-4xl font-black"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {stat.number}
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: 'rgba(232, 232, 240, 0.5)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-primary))' }}
      />
    </section>
  )
}
