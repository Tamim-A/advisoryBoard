'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const advisors = [
  {
    icon: '🎯',
    name: 'المستشار الاستراتيجي',
    description: 'يقيّم التمركز والميزة التنافسية والانسجام مع الرؤية',
    color: '#D4A853',
  },
  {
    icon: '💰',
    name: 'المستشار المالي',
    description: 'يحلل الربحية والتدفقات والتعادل واختبار السيناريوهات',
    color: '#E8C97A',
  },
  {
    icon: '📊',
    name: 'مستشار السوق',
    description: 'يقرأ الطلب والمنافسة وحساسية السعر ورد فعل السوق',
    color: '#D4A853',
  },
  {
    icon: '⚙️',
    name: 'المستشار التشغيلي',
    description: 'يختبر قابلية التنفيذ وجاهزية الفرق والتعقيد',
    color: '#E8C97A',
  },
  {
    icon: '⚖️',
    name: 'المستشار القانوني',
    description: 'يقيّم المخاطر التنظيمية والتعاقدية والامتثالية',
    color: '#D4A853',
  },
  {
    icon: '🔧',
    name: 'المستشار التقني',
    description: 'يحلل الجاهزية التقنية والتكاملات وقابلية التوسع',
    color: '#E8C97A',
  },
  {
    icon: '🚀',
    name: 'مستشار النمو',
    description: 'يقيّم أثر القرار على الاكتساب والاحتفاظ والتوسع',
    color: '#D4A853',
  },
  {
    icon: '🛡️',
    name: 'مستشار المخاطر',
    description: 'يبني خريطة مخاطر شاملة مع خطط التخفيف',
    color: '#E8C97A',
  },
  {
    icon: '🌱',
    name: 'مستشار الاستدامة',
    description: 'يحلل الأثر على السمعة والثقة والاستدامة المؤسسية',
    color: '#D4A853',
  },
]

function AdvisorCard({ advisor, index }: { advisor: typeof advisors[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative rounded-2xl p-6 cursor-default glass card-hover animated-gold-border"
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `rgba(212, 168, 83, 0.08)`,
          border: `1px solid rgba(212, 168, 83, 0.2)`,
        }}
      >
        {advisor.icon}
      </div>

      {/* Name */}
      <h3
        className="text-lg font-bold mb-2 transition-colors duration-300"
        style={{
          fontFamily: 'Tajawal, sans-serif',
          color: 'var(--text-primary)',
        }}
      >
        {advisor.name}
      </h3>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{
          color: 'var(--text-secondary)',
          fontFamily: 'IBM Plex Sans Arabic, sans-serif',
        }}
      >
        {advisor.description}
      </p>

      {/* Hover glow accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }}
      />
    </motion.div>
  )
}

export default function AdvisorsSection() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })

  return (
    <section
      id="advisors"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D4A853, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
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
            فريقك الاستشاري
          </p>
          <h2
            className="text-3xl md:text-5xl font-black mb-4"
            style={{ fontFamily: 'Tajawal, sans-serif', color: 'var(--text-primary)' }}
          >
            9 عقول متخصصة
            <br />
            <span className="gold-text">تفكر في قرارك</span>
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}
          >
            كل مستشار يحلل القرار من زاوية تخصصه بشكل مستقل، ثم يتناقشون لإخراج الحكم الأفضل
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {advisors.map((advisor, index) => (
            <AdvisorCard key={advisor.name} advisor={advisor} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
