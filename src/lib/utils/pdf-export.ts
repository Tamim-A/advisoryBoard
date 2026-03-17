'use client'

import { type SessionData } from '@/data/mockData'

const VERDICT_LABELS: Record<string, string> = {
  APPROVE: 'موافقة',
  APPROVE_WITH_CONDITIONS: 'موافقة مشروطة',
  REJECT: 'رفض',
  DELAY: 'تأجيل',
}

const VERDICT_COLORS: Record<string, string> = {
  APPROVE: '#22C55E',
  APPROVE_WITH_CONDITIONS: '#D4A853',
  REJECT: '#EF4444',
  DELAY: '#818CF8',
}

function esc(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function exportSessionPDF(session: SessionData): Promise<void> {
  const verdictLabel = VERDICT_LABELS[session.overallVerdict] || session.overallVerdict
  const verdictColor = VERDICT_COLORS[session.overallVerdict] || '#D4A853'
  const companyName = session.company?.name || ''
  const sector = session.company?.sector || ''
  const dateStr = session.date || new Date().toISOString().split('T')[0]

  // ─── Advisors HTML ──────────────────────────────────
  const advisorsHtml = (session.advisors || []).map((advisor) => {
    const aVerdictLabel = VERDICT_LABELS[advisor.verdict] || advisor.verdict || ''
    const aColor = VERDICT_COLORS[advisor.verdict] || '#D4A853'

    const keyPointsHtml = ((advisor.keyPoints as string[] | undefined) || [])
      .map((p) => `<li>${esc(p)}</li>`).join('')

    const risksHtml = ((advisor.risks as Array<{ risk?: string; title?: string; description?: string; impact?: string; mitigation?: string }> | undefined) || [])
      .slice(0, 4)
      .map((r) => `<li><strong>${esc(r.risk || r.title || '')}</strong>${r.description ? ` — ${esc(r.description)}` : ''}${r.mitigation ? ` (${esc(r.mitigation)})` : ''}</li>`)
      .join('')

    return `
    <div class="advisor-block">
      <div class="advisor-header">
        <div>
          <span class="advisor-name">${esc(advisor.name || '')}</span>
        </div>
        <div>
          <span class="verdict-badge" style="color:${aColor}; border-color:${aColor}">${aVerdictLabel}</span>
          <span class="confidence">${advisor.confidence || 0}%</span>
        </div>
      </div>
      ${advisor.summary ? `<p class="advisor-summary">${esc(advisor.summary)}</p>` : ''}
      ${keyPointsHtml ? `<div class="section-sub"><h4>النقاط الرئيسية</h4><ul>${keyPointsHtml}</ul></div>` : ''}
      ${risksHtml ? `<div class="section-sub"><h4>المخاطر الرئيسية</h4><ul>${risksHtml}</ul></div>` : ''}
    </div>`
  }).join('')

  // ─── Action Plan HTML ──────────────────────────────
  type PlanPhaseRaw = string[] | { goal: string; tasks: string[] }
  const normPhase = (p: PlanPhaseRaw | undefined): { goal?: string; tasks: string[] } => {
    if (!p) return { tasks: [] }
    if (Array.isArray(p)) return { tasks: p }
    return { goal: p.goal, tasks: p.tasks ?? [] }
  }
  const planHtml = session.plan ? `
    <div class="section page-break-before">
      <h2 class="section-title">خطة العمل — 30 / 60 / 90 يوم</h2>
      ${[
        { label: 'أول 30 يوم — الإطلاق', phase: normPhase(session.plan.days30 as PlanPhaseRaw), color: '#D4A853' },
        { label: 'الأيام 31-60 — البناء', phase: normPhase(session.plan.days60 as PlanPhaseRaw), color: '#60A5FA' },
        { label: 'الأيام 61-90 — التوسع', phase: normPhase(session.plan.days90 as PlanPhaseRaw), color: '#A78BFA' },
      ].map(({ label, phase, color }) => phase.tasks?.length ? `
        <div class="plan-phase">
          <h3 style="color:${color}">${label}</h3>
          ${phase.goal ? `<p style="font-size:12px;color:#555;margin-bottom:8px;font-style:italic">${esc(phase.goal)}</p>` : ''}
          <ul>${phase.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>` : ''
      ).join('')}
    </div>` : ''

  // ─── Full HTML Document ────────────────────────────
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير المجلس الاستشاري</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Tajawal', 'Arial', sans-serif;
      direction: rtl;
      background: #fff;
      color: #1a2030;
      font-size: 13px;
      line-height: 1.7;
    }
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #07090F;
      color: white;
      page-break-after: always;
    }
    .cover-header {
      padding: 48px 48px 32px;
      border-bottom: 3px solid #D4A853;
    }
    .cover-title { font-size: 28px; font-weight: 800; color: #D4A853; letter-spacing: 2px; }
    .cover-sub { color: #8B96A8; font-size: 13px; margin-top: 4px; }
    .cover-meta { color: #6B7280; font-size: 12px; margin-top: 8px; }
    .cover-body {
      flex: 1;
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 32px;
    }
    .decision-title { font-size: 22px; font-weight: 700; color: #E8EDF5; line-height: 1.5; }
    .verdict-card {
      border: 2px solid ${verdictColor};
      border-radius: 16px;
      padding: 28px 32px;
      text-align: center;
      background: rgba(255,255,255,0.03);
    }
    .verdict-card .label { font-size: 11px; color: #8B96A8; letter-spacing: 1px; }
    .verdict-card .value { font-size: 26px; font-weight: 800; color: ${verdictColor}; margin: 8px 0; }
    .verdict-card .conf { font-size: 13px; color: #8B96A8; }
    .verdict-reason { font-size: 13px; color: #9CA3AF; font-style: italic; line-height: 1.8; text-align: center; }
    .company-box {
      border: 1px solid #1E2630;
      border-radius: 12px;
      padding: 16px 20px;
      background: rgba(255,255,255,0.02);
    }
    .company-box .clabel { font-size: 10px; color: #8B96A8; letter-spacing: 1px; margin-bottom: 4px; }
    .company-box .cname { font-size: 15px; font-weight: 700; color: #E8EDF5; }
    .company-box .cmeta { font-size: 11px; color: #6B7280; margin-top: 2px; }
    .content { padding: 40px 48px; max-width: 860px; margin: 0 auto; }
    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #D4A853;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding-bottom: 8px;
      border-bottom: 2px solid #D4A853;
      margin-bottom: 16px;
    }
    p { line-height: 1.9; color: #374151; margin-bottom: 8px; }
    ul { padding-right: 20px; }
    ul li { margin-bottom: 6px; color: #374151; }
    .advisor-block {
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      background: #FAFAFA;
    }
    .advisor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .advisor-name { font-size: 15px; font-weight: 700; color: #1a2030; }
    .verdict-badge {
      font-size: 11px;
      font-weight: 700;
      border: 1px solid;
      border-radius: 20px;
      padding: 2px 10px;
      margin-left: 8px;
    }
    .confidence { font-size: 12px; color: #6B7280; }
    .advisor-summary { color: #4B5563; line-height: 1.8; margin-bottom: 10px; }
    .section-sub h4 {
      font-size: 11px;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 10px 0 6px;
    }
    .section-sub ul { padding-right: 16px; }
    .section-sub ul li { color: #4B5563; font-size: 12px; margin-bottom: 4px; }
    .plan-phase { margin-bottom: 20px; }
    .plan-phase h3 { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .plan-phase ul { padding-right: 16px; }
    .plan-phase ul li { color: #374151; font-size: 12px; margin-bottom: 4px; }
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #07090F;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
      border-bottom: 1px solid #1E2630;
    }
    .print-bar span { color: #8B96A8; font-size: 13px; }
    .print-btn {
      background: #D4A853;
      color: #07090F;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Tajawal', sans-serif;
    }
    @media print {
      .no-print { display: none !important; }
      .page-break-before { page-break-before: always; }
      .cover { page-break-after: always; min-height: auto; padding-bottom: 80px; }
      body { font-size: 12px; }
      .content { padding: 24px 32px; }
    }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <span>تقرير المجلس الاستشاري</span>
    <button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
  </div>

  <div class="cover" style="margin-top:44px;">
    <div class="cover-header">
      <div class="cover-title">ADVISORY BOARD</div>
      <div class="cover-sub">Strategic Decision Analysis Report</div>
      <div class="cover-meta">${esc(companyName)} | ${esc(sector)} | ${dateStr}</div>
    </div>
    <div class="cover-body">
      <div class="decision-title">${esc(session.decisionTitle)}</div>
      <div class="verdict-card">
        <div class="label">الحكم النهائي</div>
        <div class="value">${esc(verdictLabel)}</div>
        <div class="conf">نسبة الثقة: ${session.overallConfidence || 0}%</div>
      </div>
      ${session.verdictReason ? `<p class="verdict-reason">${esc(session.verdictReason)}</p>` : ''}
      ${companyName ? `
      <div class="company-box">
        <div class="clabel">الشركة</div>
        <div class="cname">${esc(companyName)}</div>
        <div class="cmeta">${esc(sector)}${session.company?.size ? ` · ${esc(session.company.size)}` : ''}${session.company?.stage ? ` · ${esc(session.company.stage)}` : ''}</div>
      </div>` : ''}
    </div>
  </div>

  <div class="content" style="margin-top:44px;">

    ${session.executiveSummary ? `
    <div class="section">
      <h2 class="section-title">الملخص التنفيذي</h2>
      <p>${esc(session.executiveSummary)}</p>
    </div>` : ''}

    ${(session.topFindings || []).length ? `
    <div class="section">
      <h2 class="section-title">أبرز النتائج</h2>
      <ul>${(session.topFindings || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>` : ''}

    ${(session.conditions || []).length ? `
    <div class="section">
      <h2 class="section-title">الشروط قبل التنفيذ</h2>
      <ul>${(session.conditions || []).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>` : ''}

    ${session.whatCouldChange ? `
    <div class="section">
      <h2 class="section-title">ما الذي قد يغير الحكم</h2>
      <p>${esc(session.whatCouldChange)}</p>
    </div>` : ''}

    ${advisorsHtml ? `
    <div class="section page-break-before">
      <h2 class="section-title">تقارير المستشارين</h2>
      ${advisorsHtml}
    </div>` : ''}

    ${planHtml}

  </div>

  <script>
    document.fonts.ready.then(function() {
      setTimeout(function() { window.print() }, 500)
    })
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    // Popup blocked — fallback to download
    const a = document.createElement('a')
    a.href = url
    const safeName = (session.decisionTitle || 'advisory').replace(/\s+/g, '-').slice(0, 40)
    const dateFile = new Date().toISOString().split('T')[0]
    a.download = `advisory-board-${safeName}-${dateFile}.html`
    a.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
