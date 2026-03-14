'use client'

import { motion } from 'framer-motion'
import { type SessionData } from '@/data/mockData'

const SCENARIO_COLUMNS = [
  {
    key: 'best',
    label: 'السيناريو الأفضل',
    icon: '↑',
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.06)',
    border: 'rgba(34, 197, 94, 0.2)',
  },
  {
    key: 'base',
    label: 'السيناريو الأساسي',
    icon: '→',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.06)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  {
    key: 'worst',
    label: 'السيناريو الأسوأ',
    icon: '↓',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.06)',
    border: 'rgba(239, 68, 68, 0.2)',
  },
]

export default function ScenariosTab({ session }: { session: SessionData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          📊 السيناريوهات المجمّعة
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          توقعات المجلس المجمّعة من تحليل جميع المستشارين
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIO_COLUMNS.map((col, colIdx) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIdx * 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${col.border}` }}
          >
            {/* Column header */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ background: col.bg, borderBottom: `1px solid ${col.border}` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
                style={{ background: `${col.color}20`, color: col.color, fontFamily: 'Tajawal' }}
              >
                {col.icon}
              </div>
              <h3 className="font-bold text-sm" style={{ color: col.color, fontFamily: 'Tajawal' }}>
                {col.label}
              </h3>
            </div>

            {/* Advisors' scenarios for this column */}
            <div className="p-4 space-y-4" style={{ background: 'rgba(19,24,32,0.8)' }}>
              {session.advisors.slice(0, 5).map((advisor) => {
                const scenario =
                  col.key === 'best'
                    ? advisor.scenarios?.best
                    : col.key === 'base'
                    ? advisor.scenarios?.base
                    : advisor.scenarios?.worst
                if (!scenario) return null
                return (
                  <div key={advisor.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{advisor.icon}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>
                        {advisor.name}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed font-medium mb-0.5"
                      style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal' }}
                    >
                      {scenario.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Sans Arabic' }}>
                      {scenario.description}
                    </p>
                    <div className="mt-2 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
