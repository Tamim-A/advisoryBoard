'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { type AdvisorAnalysis, type Verdict } from '@/data/mockData'

const verdictConfig: Record<Verdict, { label: string; color: string; bg: string }> = {
  APPROVE: { label: 'موافقة', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
  APPROVE_WITH_CONDITIONS: { label: 'مشروطة', color: '#D4A853', bg: 'rgba(212, 168, 83, 0.1)' },
  REJECT: { label: 'رفض', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  DELAY: { label: 'تأجيل', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' },
}

function ScoreBar({ score, label, delay }: { score: number; label: string; delay: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const color = score >= 8 ? '#22C55E' : score >= 5 ? '#D4A853' : '#EF4444'

  return (
    <div ref={ref} className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {label}
        </span>
        <span className="text-sm font-black" style={{ color, fontFamily: 'Tajawal' }}>
          {score}/10
        </span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${score * 10}%` } : {}}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

const impactColor: Record<string, string> = {
  'عالي': '#EF4444',
  'متوسط': '#D4A853',
  'منخفض': '#22C55E',
}
const probColor: Record<string, string> = {
  'عالية': '#EF4444',
  'متوسطة': '#D4A853',
  'منخفضة': '#22C55E',
}

export default function AdvisorDetailTab({ advisor }: { advisor: AdvisorAnalysis }) {
  const v = verdictConfig[advisor.verdict]

  return (
    <motion.div
      key={advisor.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Advisor header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid var(--border-gold)' }}
        >
          {advisor.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
            {advisor.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: v.bg, color: v.color, fontFamily: 'Tajawal' }}
            >
              {v.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
              ثقة: {advisor.confidence}٪
            </span>
          </div>
        </div>
      </div>

      {/* Scorecard */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold mb-4 text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          📊 بطاقة التقييم
        </h3>
        <div className="flex flex-col gap-4">
          {advisor.scorecard.map((item, i) => (
            <ScoreBar key={item.dimension} score={item.score} label={item.dimension} delay={i * 0.1} />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold mb-2 text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          📋 الملخص التنفيذي
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {advisor.summary}
        </p>
      </div>

      {/* Key points */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold mb-3 text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          🔑 النقاط الرئيسية
        </h3>
        <ul className="space-y-2">
          {advisor.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-gold)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risks table */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold mb-4 text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          ⚠️ المخاطر
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ fontFamily: 'IBM Plex Sans Arabic' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['الخطر', 'التأثير', 'الاحتمالية', 'التخفيف'].map((h) => (
                  <th key={h} className="text-right pb-2 pr-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {advisor.risks.map((risk, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-2.5 pr-2" style={{ color: 'var(--text-secondary)' }}>{risk.risk}</td>
                  <td className="py-2.5 pr-2">
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{
                      background: `${impactColor[risk.impact]}18`,
                      color: impactColor[risk.impact],
                    }}>
                      {risk.impact}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{
                      background: `${probColor[risk.probability]}18`,
                      color: probColor[risk.probability],
                    }}>
                      {risk.probability}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-xs" style={{ color: 'var(--text-muted)', maxWidth: '180px' }}>
                    {risk.mitigation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenarios */}
      <div>
        <h3 className="font-bold mb-3 text-sm" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          🔮 السيناريوهات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'best', label: 'الأفضل ↑', color: '#22C55E', data: advisor.scenarios.best },
            { key: 'base', label: 'الأساسي →', color: '#3B82F6', data: advisor.scenarios.base },
            { key: 'worst', label: 'الأسوأ ↓', color: '#EF4444', data: advisor.scenarios.worst },
          ].map((s) => (
            <div
              key={s.key}
              className="rounded-xl p-4"
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}30`,
              }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: s.color, fontFamily: 'Tajawal' }}>
                {s.label} — {s.data.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                {s.data.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Strongest objection */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(212, 168, 83, 0.05)',
          border: '1px solid rgba(212, 168, 83, 0.25)',
        }}
      >
        <h3 className="font-bold mb-2 text-sm flex items-center gap-2" style={{ fontFamily: 'Tajawal', color: '#D4A853' }}>
          ⚠️ أقوى اعتراض
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {advisor.strongestObjection}
        </p>
      </div>

      {/* Recommendation */}
      <div
        className="rounded-2xl p-5"
        style={{ background: v.bg, border: `1px solid ${v.color}30` }}
      >
        <h3 className="font-bold mb-2 text-sm" style={{ fontFamily: 'Tajawal', color: v.color }}>
          ✅ التوصية النهائية
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {advisor.recommendation}
        </p>
      </div>
    </motion.div>
  )
}
