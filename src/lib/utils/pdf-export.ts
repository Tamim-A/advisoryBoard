'use client'

import { type SessionData } from '@/data/mockData'

const VERDICT_LABELS: Record<string, string> = {
  APPROVE: 'موافقة',
  APPROVE_WITH_CONDITIONS: 'موافقة مشروطة',
  REJECT: 'رفض',
  DELAY: 'تأجيل',
}

// Sanitize text for PDF (remove emoji and special chars that jspdf can't render)
function sanitize(text: string | undefined | null): string {
  if (!text) return ''
  // Strip emoji/non-latin characters that jspdf standard fonts can't render
  return text.replace(/[^\x00-\x7F\u0600-\u06FF]/g, '').trim()
}

export async function exportSessionPDF(session: SessionData): Promise<void> {
  // Dynamically import jspdf to keep it client-only
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  // Helper: add a new page if content overflows
  const checkPage = (needed = 10) => {
    if (y + needed > pageH - margin) {
      doc.addPage()
      y = margin
    }
  }

  // ─── Title block ──────────────────────────────────────
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(212, 168, 83) // gold
  doc.text('Advisory Board - Session Report', pageW / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(sanitize(session.decisionTitle), pageW / 2, y, { align: 'center' })
  y += 6
  doc.text(`Date: ${session.date} | Type: ${session.sessionType}`, pageW / 2, y, { align: 'center' })
  y += 10

  // Gold divider line
  doc.setDrawColor(212, 168, 83)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ─── Overall Verdict ──────────────────────────────────
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text('Overall Verdict', margin, y)
  y += 6

  const verdictLabel = VERDICT_LABELS[session.overallVerdict] || session.overallVerdict
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Verdict: ${verdictLabel}   |   Confidence: ${session.overallConfidence}%`, margin, y)
  y += 6

  if (session.verdictReason) {
    const lines = doc.splitTextToSize(sanitize(session.verdictReason), pageW - margin * 2)
    checkPage(lines.length * 5 + 4)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 4
  }

  // ─── Executive Summary ────────────────────────────────
  checkPage(20)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text('Executive Summary', margin, y)
  y += 6

  if (session.executiveSummary) {
    const lines = doc.splitTextToSize(sanitize(session.executiveSummary), pageW - margin * 2)
    checkPage(lines.length * 5 + 4)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 6
  }

  // ─── Top Findings ─────────────────────────────────────
  if (session.topFindings?.length) {
    checkPage(15)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Key Findings', margin, y)
    y += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    for (const finding of session.topFindings) {
      const lines = doc.splitTextToSize(`• ${sanitize(finding)}`, pageW - margin * 2 - 4)
      checkPage(lines.length * 5 + 2)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 2
    }
    y += 4
  }

  // ─── Conditions ───────────────────────────────────────
  if (session.conditions?.length) {
    checkPage(15)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Conditions Before Proceeding', margin, y)
    y += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    for (const cond of session.conditions) {
      const lines = doc.splitTextToSize(`• ${sanitize(cond)}`, pageW - margin * 2 - 4)
      checkPage(lines.length * 5 + 2)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 2
    }
    y += 4
  }

  // ─── Advisor Reports ──────────────────────────────────
  if (session.advisors?.length) {
    checkPage(20)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Advisor Reports', margin, y)
    y += 8

    for (const advisor of session.advisors) {
      checkPage(25)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(212, 168, 83)
      doc.text(`${sanitize(advisor.name)}   Confidence: ${advisor.confidence}%`, margin, y)
      y += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)

      if (advisor.summary) {
        const lines = doc.splitTextToSize(sanitize(advisor.summary), pageW - margin * 2)
        checkPage(lines.length * 4 + 3)
        doc.text(lines, margin, y)
        y += lines.length * 4 + 3
      }

      if (advisor.keyPoints?.length) {
        for (const pt of advisor.keyPoints.slice(0, 4)) {
          const lines = doc.splitTextToSize(`• ${sanitize(pt)}`, pageW - margin * 2 - 4)
          checkPage(lines.length * 4 + 2)
          doc.text(lines, margin + 2, y)
          y += lines.length * 4 + 2
        }
      }

      // Divider between advisors
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(margin, y + 2, pageW - margin, y + 2)
      y += 8
    }
  }

  // ─── Action Plan ──────────────────────────────────────
  if (session.plan) {
    checkPage(30)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Action Plan (30-60-90 Days)', margin, y)
    y += 8

    const planEntries = [
      { label: 'First 30 Days', text: session.plan.days30 },
      { label: 'Days 31-60',    text: session.plan.days60 },
      { label: 'Days 61-90',    text: session.plan.days90 },
    ]

    for (const entry of planEntries) {
      if (!entry.text?.length) continue
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text(entry.label, margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      for (const item of entry.text) {
        const lines = doc.splitTextToSize(`• ${sanitize(item)}`, pageW - margin * 2 - 4)
        checkPage(lines.length * 4 + 2)
        doc.text(lines, margin + 2, y)
        y += lines.length * 4 + 2
      }
      y += 3
    }
  }

  // ─── Footer ───────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Advisory Board | Generated ${new Date().toLocaleDateString('en-GB')} | Page ${i}/${totalPages}`,
      pageW / 2,
      pageH - 8,
      { align: 'center' }
    )
  }

  // ─── Save ─────────────────────────────────────────────
  const safeName = sanitize(session.decisionTitle).replace(/\s+/g, '-').slice(0, 40) || 'session'
  const dateStr = new Date().toISOString().split('T')[0]
  doc.save(`advisory-board-${safeName}-${dateStr}.pdf`)
}
