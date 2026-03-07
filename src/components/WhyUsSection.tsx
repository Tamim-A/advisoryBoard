'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const cards = [
  {
    number: '01',
    icon: '🔭',
    title: 'تحليل متعدد الزوايا',
    description: 'بدل رأي واحد، تحصل على 9 تحليلات متخصصة مترابطة تغطي كل جانب من جوانب قرارك',
    accent: 'from-[#D4A853]/10 to-[#E8C97A]/5',
    borderColor: 'rgba(212, 168, 83, 0.2)',
    highlight: '#D4A853',
    stats: '9×',
    statsLabel: 'زوايا تحليل',
  },
  {
    number: '02',
    icon: '📈',
    title: 'توصية مدعومة بالبيانات',
    description: 'ليس رأيًا عامًا، بل حكم مبني على سيناريوهات وأرقام وتحليل مقارن مع توقعات واضحة',
    accent: 'from-[#2563EB]/10 to-[#3B82F6]/5',
    borderColor: 'rgba(37, 99, 235, 0.2)',
    highlight: '#3B82F6',
    stats: '100%',
    statsLabel: 'مبني على بيانات',
  },
  {
    number: '03',
    icon: '🔍',
    title: 'كشف ما لا تراه',
    description: 'النقاش بين المستشارين يكشف التعارضات والافتراضات الخفية التي قد تغيّر القرار بالكامل',
    accent: 'from-[#D4A853]/10 to-[#E8C97A]/5',
    borderColor: 'rgba(212, 168, 83, 0.2)',
    highlight: '#D4A853',
    stats: '∞',
    statsLabel: 'افتراض مكشوف',
  },
]

function WhyCard({ card, index }: { card: typeof cards[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="relative rounded-3xl p-8 overflow-hidden group"
      style={{
        background: 'rgba(19, 24, 32, 0.8)',
        border: `1px solid ${card.borderColor}`,
        backdropFilter: 'blur(20px)',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 50px ${card.highlight}22, 0 20px 60px rgba(0,0,0,0.4)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60 pointer-events-none`}
      />

      {/* Large number watermark */}
      <div
        className="absolute top-4 left-6 text-8xl font-black opacity-5 pointer-events-none select-none"
        style={{ fontFamily: 'Tajawal, sans-serif', color: card.highlight }}
      >
        {card.number}
      </div>

      <div className="relative z-10">
        {/* Stats badge */}
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${card.highlight}14`, border: `1px solid ${card.highlight}30` }}
          >
            {card.icon}
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-black"
              style={{ fontFamily: 'Tajawal, sans-serif', color: card.highlight }}
            >
              {card.stats}
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
            >
              {card.statsLabel}
            </div>
          </div>
        </div>

        <h3
          className="text-2xl font-black mb-3"
          style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
        >
          {card.title}
        </h3>

        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
        >
          {card.description}
        </p>

        {/* Bottom accent line */}
        <div
          className="mt-6 h-0.5 w-16 rounded-full transition-all duration-500 group-hover:w-full"
          style={{ background: `linear-gradient(90deg, ${card.highlight}, transparent)` }}
        />
      </div>
    </motion.div>
  )
}

export default function WhyUsSection() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })

  return (
    <section
      id="why-us"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="section-divider absolute top-0 left-0 right-0" />

      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at right top, rgba(212, 168, 83, 0.05), transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p
            className="text-sm font-medium mb-3"
            style={{ color: 'var(--accent-gold)', fontFamily: 'IBM Plex Sans Arabic, sans-serif', letterSpacing: '0.1em' }}
          >
            لماذا Advisory Board
          </p>
          <h2
            className="text-3xl md:text-5xl font-black mb-4"
            style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
          >
            ليس مجرد مساعد ذكاء اصطناعي
            <br />
            <span className="gold-text">بل مجلس استشاري كامل</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <WhyCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>

      <div className="section-divider absolute bottom-0 left-0 right-0" />
    </section>
  )
}
