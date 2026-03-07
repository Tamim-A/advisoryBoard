'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="relative py-28 md:py-36 overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Dramatic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      {/* Top/bottom gold lines */}
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="section-divider absolute bottom-0 left-0 right-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-8"
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="text-5xl"
          >
            🏛️
          </motion.div>

          {/* Headline */}
          <div>
            <h2
              className="text-4xl md:text-6xl font-black mb-4 leading-tight"
              style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
            >
              قرارك القادم
              <br />
              <span className="gold-text">يستحق مجلس استشاري</span>
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
            >
              لا تتخذ قرارات مصيرية وحدك. اعقد اجتماعك الأول مع المجلس الآن مجاناً.
            </p>
          </div>

          <motion.a
            href="/auth/login"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 60px rgba(212, 168, 83, 0.45), 0 0 100px rgba(212, 168, 83, 0.2)',
            }}
            whileTap={{ scale: 0.97 }}
            className="btn-gold pulse-glow px-12 py-5 rounded-2xl text-xl font-black inline-block"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            ابدأ جلستك الأولى — مجاناً
          </motion.a>

          {/* Sub text */}
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
          >
            لا تحتاج بطاقة ائتمانية • جاهز خلال ثواني
          </p>
        </motion.div>
      </div>
    </section>
  )
}
