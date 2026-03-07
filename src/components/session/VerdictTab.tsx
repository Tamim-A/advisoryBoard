'use client'

import { motion } from 'framer-motion'
import { type SessionData, type Verdict } from '@/data/mockData'

const verdictConfig: Record<Verdict, { label: string; color: string; bg: string; glow: string }> = {
  APPROVE: { label: 'موافقة', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', glow: 'rgba(34, 197, 94, 0.25)' },
  APPROVE_WITH_CONDITIONS: { label: 'موافقة مشروطة', color: '#D4A853', bg: 'rgba(212, 168, 83, 0.1)', glow: 'rgba(212, 168, 83, 0.25)' },
  REJECT: { label: 'رفض', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', glow: 'rgba(239, 68, 68, 0.25)' },
  DELAY: { label: 'تأجيل', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', glow: 'rgba(148, 163, 184, 0.25)' },
}

const planStyles = [
  { label: '٣٠ يوم', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
  { label: '٦٠ يوم', color: '#D4A853', bg: 'rgba(212,168,83,0.06)', border: 'rgba(212,168,83,0.2)' },
  { label: '٩٠ يوم', color: '#22C55E', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)' },
]

export default function VerdictTab({ session }: { session: SessionData }) {
  const v = verdictConfig[session.overallVerdict]

  return (
    <div className="space-y-6">
      {/* Big verdict */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl p-10 text-center"
        style={{
          background: v.bg,
          border: `1px solid ${v.color}30`,
          boxShadow: `0 0 80px ${v.glow}`,
        }}
      >
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
          الحكم النهائي للمجلس الاستشاري
        </p>
        <h1
          className="text-5xl md:text-6xl font-black mb-3"
          style={{ fontFamily: 'Tajawal, sans-serif', color: v.color }}
        >
          {v.label}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-24 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${session.overallConfidence}%`,
                background: v.color,
              }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: v.color, fontFamily: 'Tajawal' }}>
            {session.overallConfidence}٪ ثقة
          </span>
        </div>
      </motion.div>

      {/* Why this verdict */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(19,24,32,0.8)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-bold mb-3" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          💡 لماذا هذا الحكم؟
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {session.verdictReason}
        </p>
      </motion.div>

      {/* Conditions checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(212, 168, 83, 0.04)', border: '1px solid var(--border-gold)' }}
      >
        <h3 className="font-bold mb-4" style={{ fontFamily: 'Tajawal', color: 'var(--accent-gold)' }}>
          ✅ الشروط قبل التنفيذ
        </h3>
        <div className="space-y-3">
          {session.conditions.map((cond, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:border-[#D4A853]"
                style={{ border: '1.5px solid var(--border-gold)', background: 'transparent' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                {cond}
              </span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* 30-60-90 plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-bold mb-4" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          🗓️ خطة ٣٠-٦٠-٩٠ يوم
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planStyles.map((ps, i) => {
            const tasks = [session.plan.days30, session.plan.days60, session.plan.days90][i]
            return (
              <div
                key={ps.label}
                className="rounded-2xl p-5"
                style={{ background: ps.bg, border: `1px solid ${ps.border}` }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                  style={{ background: `${ps.color}18`, color: ps.color, fontFamily: 'Tajawal' }}
                >
                  {ps.label}
                </div>
                <ul className="space-y-2.5">
                  {tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold"
                        style={{ background: `${ps.color}18`, color: ps.color, fontFamily: 'Tajawal' }}
                      >
                        {j + 1}
                      </span>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* What could change */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <h3 className="font-bold mb-2" style={{ fontFamily: 'Tajawal', color: '#EF4444' }}>
          🔄 ما الذي قد يغير هذا الحكم؟
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          {session.whatCouldChange}
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          className="btn-gold flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          📄 تصدير PDF
        </button>
        <button
          className="btn-outline-gold flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          🔄 جلسة متابعة
        </button>
      </motion.div>
    </div>
  )
}
