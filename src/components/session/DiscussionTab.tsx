'use client'

import { motion } from 'framer-motion'
import { type DiscussionPoint } from '@/data/mockData'

const outcomeConfig = {
  'محسوم': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  'معلّق': { color: '#D4A853', bg: 'rgba(212,168,83,0.1)' },
  'مشروط': { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
}

export default function DiscussionTab({ discussion }: { discussion: DiscussionPoint[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black mb-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
          ⚔️ نقاش المستشارين
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
          نقاط الخلاف الرئيسية التي برزت خلال تحليل المجلس
        </p>
      </div>

      {discussion.map((point, i) => {
        const outcome = outcomeConfig[point.outcome]
        return (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Topic header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: 'rgba(19,24,32,0.9)', borderBottom: '1px solid var(--border)' }}
            >
              <h3 className="font-bold text-base flex-1" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                {point.topic}
              </h3>
              <span
                className="text-xs px-3 py-1 rounded-full font-bold mr-4 flex-shrink-0"
                style={{ background: outcome.bg, color: outcome.color, fontFamily: 'Tajawal' }}
              >
                {point.outcome}
              </span>
            </div>

            {/* Arguments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
              {/* Advisor A */}
              <div className="p-5" style={{ background: 'rgba(19,24,32,0.7)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{point.advisorA.icon}</span>
                  <span className="text-sm font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                    {point.advisorA.name}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  {point.advisorA.argument}
                </p>
              </div>

              {/* Advisor B */}
              <div className="p-5" style={{ background: 'rgba(13,17,23,0.7)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{point.advisorB.icon}</span>
                  <span className="text-sm font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                    {point.advisorB.name}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}>
                  {point.advisorB.argument}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
