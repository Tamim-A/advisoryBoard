// ─── Shared types for advisor inputs and outputs ───────────

export interface CompanyProfile {
  company_name: string
  sector: string
  company_size: string
  stage: string
  annual_revenue?: string
  team_size?: string
}

export interface Decision {
  title: string
  description: string
  category: string
  primary_goal: string
  estimated_cost?: string
  expected_timeline?: string
  alternatives?: string
  constraints?: string
}

export type VerdictType = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT' | 'DELAY'

export interface AdvisorOutput {
  verdict: VerdictType
  confidence: number
  summary: string
  scorecard: Array<{ dimension: string; score: number }>
  keyPoints: string[]
  risks: Array<{
    risk: string
    impact: 'عالي' | 'متوسط' | 'منخفض'
    probability: 'عالية' | 'متوسطة' | 'منخفضة'
    mitigation: string
  }>
  scenarios: {
    best: { title: string; description: string }
    base: { title: string; description: string }
    worst: { title: string; description: string }
  }
  strongestObjection: string
  recommendation: string
  // metadata added by engine
  id?: string
  name?: string
  icon?: string
}

export interface DebatePoint {
  id: string
  topic: string
  advisorA: { name: string; icon: string; argument: string }
  advisorB: { name: string; icon: string; argument: string }
  outcome: 'محسوم' | 'معلّق' | 'مشروط'
}

export interface DebateOutput {
  points: DebatePoint[]
}

export interface SynthesisOutput {
  overallVerdict: VerdictType
  overallConfidence: number
  executiveSummary: string
  topFindings: string[]
  conditions: string[]
  verdictReason: string
  whatCouldChange: string
  plan: {
    days30: string[]
    days60: string[]
    days90: string[]
  }
}

export interface SessionInput {
  companyProfile: CompanyProfile
  decision: Decision
  additionalAdvisors: string[]
  sessionType: 'Quick' | 'Full' | 'Deep'
  specificConcerns?: string
}

export interface SessionResult {
  advisorResults: AdvisorOutput[]
  debate: DebateOutput | null
  synthesis: SynthesisOutput
}
