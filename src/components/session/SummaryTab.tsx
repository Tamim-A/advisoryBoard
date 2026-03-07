'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { type SessionData, type Verdict } from '@/data/mockData'

const verdictConfig: Record<Verdict, { label: string; color: string; bg: string; glow: string }> = {
  APPROVE: { label: 'موافقة', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', glow: 'rgba(34, 197, 94, 0.2)' },
  APPROVE_WITH_CONDITIONS: { label: 'موافقة مشروطة', color: '#D4A853', bg: 'rgba(212, 168, 83, 0.1)', glow: 'rgba(212, 168, 83, 0.2)' },
  REJECT: { label: 'رفض', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', glow: 'rgba(239, 68, 68, 0.2)' },
  DELAY: { label: 'تأجيل', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', glow: 'rgba(148, 163, 184, 0.2)' },
}

function CircularProgress({ value, color }: { value: number; color: string }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={isInView ? { strokeDashoffset: circ - (circ * value) / 100 } : {}}
          transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-black" style={{ fontFamily: 'Tajawal', color }}>{value}</span>
        <span className="text-xs block" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>٪</span>
      </div>
    </div>
  )
}

export default function SummaryTab({ session }: { session: SessionData }) {
  const v = verdictConfig[session.overallVerdict]

  return (
    <div className="space-y-6">
      {/* Verdict card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6"
        style={{
          background: v.bg,
          border: `1px solid ${v.color}30`,
          boxShadow: `0 0 60px ${v.glow}`,
        }}
      >
        <div className="text-center sm:text-right flex-1">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
            حكم المجلس الاستشاري
          </p>
          <h2
            className="text-4xl md:text-5xl font-black mb-2"
            style={{ fontFamily: 'Tajawal, sans-serif', color: v.color }}
          >
            {v.label}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
            بناءً على تحليل ٩ مستشارين متخصصين
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CircularProgress value={session.overallConfidence} color={v.color} />
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
            مستوى الثقة
          </p>
        </div>
      </motion.div>

      {/* Executive summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-bold mb-3 text-base" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          📋 الملخص التنفيذي
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {session.executiveSummary}
        </p>
      </motion.div>

      {/* Top 3 findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-bold mb-3 text-base" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          🔍 أهم ٣ نتائج
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {session.topFindings.map((finding, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(212, 168, 83, 0.04)',
                border: '1px solid var(--border-gold)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black mb-3"
                style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}
              >
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                {finding}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(212, 168, 83, 0.04)', border: '1px solid var(--border-gold)' }}
      >
        <h3 className="font-bold mb-4 text-base" style={{ fontFamily: 'Tajawal', color: 'var(--accent-gold)' }}>
          ⚠️ الشروط قبل التنفيذ
        </h3>
        <ol className="space-y-3">
          {session.conditions.map((cond, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--accent-gold)', fontFamily: 'Tajawal' }}
              >
                {i + 1}
              </span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                {cond}
              </p>
            </li>
          ))}
        </ol>
      </motion.div>
    </div>
  )
}
