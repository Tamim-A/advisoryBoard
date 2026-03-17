'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppSidebar from '@/components/AppSidebar'

interface Question {
  question: string
  hint: string
}

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const sessionId = params.id

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/session/${sessionId}/questions/generate`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: { questions: Question[] }) => {
        setQuestions(data.questions)
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 100)
      })
      .catch(() => {
        setError('تعذّر تحميل الأسئلة — يرجى تحديث الصفحة')
        setLoading(false)
      })
  }, [sessionId])

  const handleNext = () => {
    if (!currentAnswer.trim()) return
    const newAnswers = [...answers, currentAnswer.trim()]
    setAnswers(newAnswers)
    setCurrentAnswer('')

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      // All answered — submit and redirect
      handleSubmit(newAnswers)
    }
  }

  const handleSubmit = async (finalAnswers: string[]) => {
    setSubmitting(true)
    const payload = questions.map((q, i) => ({
      question: q.question,
      answer: finalAnswers[i] || '',
    }))

    try {
      const res = await fetch(`/api/session/${sessionId}/questions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payload }),
      })
      if (!res.ok) throw new Error('submit failed')
      router.push(`/session/${sessionId}`)
    } catch {
      setError('تعذّر حفظ الإجابات — يرجى المحاولة مجددًا')
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  const progress = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      <div className="md:mr-60 min-h-screen flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid var(--border-gold)' }}>
              <span className="text-sm font-bold" style={{ fontFamily: 'Tajawal', color: 'var(--accent-gold)' }}>
                🤖 جلسة استشارية — تحضير التحليل
              </span>
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
              أسئلة توضيحية قبل التحليل
            </h1>
            <p className="text-sm" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-secondary)' }}>
              إجاباتك تساعد المستشارين على فهم قرارك بدقة أعلى
            </p>
          </div>

          {/* Progress bar */}
          {questions.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                <span>السؤال {currentIndex + 1} من {questions.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #D4A853, #E8C97A)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-10 h-10 border-2 border-[#D4A853]/20 border-t-[#D4A853] rounded-full animate-spin" />
              <p className="text-sm" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                يُحلل المجلس بياناتك ويضع الأسئلة المناسبة...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm mb-4" style={{ fontFamily: 'IBM Plex Sans Arabic', color: '#EF4444' }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontFamily: 'Tajawal' }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {submitting && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-10 h-10 border-2 border-[#D4A853]/20 border-t-[#D4A853] rounded-full animate-spin" />
              <p className="text-sm" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                جاري حفظ إجاباتك وتحضير التحليل...
              </p>
            </div>
          )}

          {!loading && !error && !submitting && questions.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question card */}
                <div className="rounded-2xl p-6 mb-4"
                  style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid var(--border-gold)' }}>
                  <p className="text-xs mb-3" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                    السؤال {currentIndex + 1}
                  </p>
                  <p className="text-base font-bold leading-relaxed"
                    style={{ fontFamily: 'Tajawal', color: 'var(--text-primary)' }}>
                    {questions[currentIndex].question}
                  </p>
                  {questions[currentIndex].hint && (
                    <p className="text-xs mt-2" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                      💡 {questions[currentIndex].hint}
                    </p>
                  )}
                </div>

                {/* Answer input */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <textarea
                    ref={textareaRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value.slice(0, 500))}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب إجابتك هنا... (Enter للتالي)"
                    rows={3}
                    className="w-full p-4 bg-transparent resize-none outline-none text-sm"
                    style={{
                      fontFamily: 'IBM Plex Sans Arabic',
                      color: 'var(--text-primary)',
                      direction: 'rtl',
                    }}
                  />
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                      {currentAnswer.length}/500
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={!currentAnswer.trim()}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                      style={{
                        background: currentAnswer.trim() ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${currentAnswer.trim() ? 'var(--border-gold)' : 'var(--border)'}`,
                        color: currentAnswer.trim() ? 'var(--accent-gold)' : 'var(--text-muted)',
                        fontFamily: 'Tajawal',
                        cursor: currentAnswer.trim() ? 'pointer' : 'default',
                      }}
                    >
                      {currentIndex + 1 < questions.length ? 'التالي ←' : 'ابدأ التحليل ✓'}
                    </button>
                  </div>
                </div>

                {/* Previous answers */}
                {answers.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs mb-3" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                      إجاباتك السابقة:
                    </p>
                    {answers.map((ans, i) => (
                      <div key={i} className="rounded-xl p-3 flex gap-3"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <span className="text-xs flex-shrink-0 mt-0.5"
                          style={{ fontFamily: 'Tajawal', color: 'var(--text-muted)' }}>
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-1" style={{ fontFamily: 'IBM Plex Sans Arabic', color: 'var(--text-muted)' }}>
                            {questions[i]?.question}
                          </p>
                          <p className="text-xs" style={{ fontFamily: 'IBM Plex Sans Arabic', color: '#22C55E' }}>
                            ✓ {ans}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
