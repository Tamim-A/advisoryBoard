import { NextResponse } from 'next/server'
import { getAllSessions } from '@/lib/storage'
import { mockPastSessions } from '@/data/mockData'

export async function GET() {
  try {
    const sessions = getAllSessions()

    if (sessions.length === 0) {
      // Return mock data if no real sessions yet
      return NextResponse.json({ sessions: mockPastSessions, mock: true })
    }

    const formatted = sessions.map((s) => ({
      id: s.id,
      decisionTitle: (s.decision as Record<string, string>)?.title || 'جلسة بدون عنوان',
      date: new Date(s.createdAt).toLocaleDateString('ar-SA'),
      sessionType: s.sessionType,
      verdict: (s.synthesis as Record<string, unknown>)?.overallVerdict || 'APPROVE_WITH_CONDITIONS',
      confidence: (s.synthesis as Record<string, unknown>)?.overallConfidence || 0,
      status: s.status,
    }))

    return NextResponse.json({ sessions: formatted, mock: false })
  } catch {
    return NextResponse.json({ sessions: mockPastSessions, mock: true })
  }
}
