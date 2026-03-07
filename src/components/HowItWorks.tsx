'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '📋',
    title: 'أدخل بيانات شركتك والقرار',
    description: 'وصف القرار، بيانات الشركة، السياق والقيود',
  },
  {
    number: '02',
    icon: '🧠',
    title: 'المجلس يحلل من 9 زوايا',
    description: 'كل مستشار يحلل من تخصصه بشكل مستقل',
  },
  {
    number: '03',
    icon: '⚔️',
    title: 'نقاش وتحدي بين المستشارين',
    description: 'كشف التعارضات واختبار الافتراضات',
  },
  {
    number: '04',
    icon: '✅',
    title: 'توصية تنفيذية واضحة',
    description: 'حكم نهائي + خطة 90 يوم + سيناريوهات',
  },
]

function StepItem({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-6 md:gap-8"
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10"
          style={{
            background: 'rgba(212, 168, 83, 0.08)',
            border: '1px solid var(--border-gold)',
            fontFamily: 'Tajawal, sans-serif',
            color: 'var(--accent-gold)',
            boxShadow: '0 0 20px rgba(212, 168, 83, 0.1)',
          }}
        >
          {step.number}
        </div>
        {/* Vertical connector */}
        {index < steps.length - 1 && (
          <div
            className="w-0.5 flex-1 mt-2"
            style={{
              background: 'linear-gradient(to bottom, rgba(212,168,83,0.4), rgba(212,168,83,0.05))',
              minHeight: '60px',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-10 flex-1">
        <div
          className="glass-card rounded-2xl p-6 animated-gold-border transition-all duration-300 hover:shadow-glow-gold hover:-translate-y-1"
          style={{ background: 'rgba(19, 24, 32, 0.6)' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">{step.icon}</span>
            <div>
              <h3
                className="text-xl font-bold mb-1"
                style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
              >
                {step.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function HowItWorks() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Section divider top */}
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p
            className="text-sm font-medium mb-3"
            style={{ color: 'var(--accent-gold)', fontFamily: 'IBM Plex Sans Arabic, sans-serif', letterSpacing: '0.1em' }}
          >
            العملية
          </p>
          <h2
            className="text-3xl md:text-5xl font-black mb-4 gold-underline inline-block"
            style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
          >
            من قرار غامض...
            <br />
            إلى توصية تنفيذية واضحة
          </h2>
        </motion.div>

        {/* Steps timeline */}
        <div className="flex flex-col">
          {steps.map((step, index) => (
            <StepItem key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>

      {/* Section divider bottom */}
      <div className="section-divider absolute bottom-0 left-0 right-0" />
    </section>
  )
}
