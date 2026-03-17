'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'

export default function SessionLimitPage() {
  const router = useRouter()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966554422881'
  const message = encodeURIComponent('مرحباً، أريد الحصول على جلسات إضافية في المجلس الاستشاري')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <main className="md:mr-60 min-h-screen p-6 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'rgba(19,24,32,0.9)',
              backdropFilter: 'blur(24px)',
              border: '1px solid var(--border-gold)',
              boxShadow: '0 0 60px rgba(212,168,83,0.08)',
            }}
          >
            <div className="text-5xl mb-5">⏳</div>
            <h2
              className="text-xl font-black mb-3"
              style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}
            >
              استهلكت جلستك المجانية
            </h2>
            <p
              className="text-sm mb-8 leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Sans Arabic' }}
            >
              للحصول على جلسات إضافية، تواصل معنا عبر واتساب وسيتم إضافتها خلال 24 ساعة.
            </p>

            <div className="space-y-3">
              <a
                href={`https://wa.me/${whatsapp}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  fontFamily: 'Tajawal',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                }}
              >
                <span className="text-lg">💬</span>
                تواصل عبر واتساب
              </a>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'Tajawal',
                }}
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
