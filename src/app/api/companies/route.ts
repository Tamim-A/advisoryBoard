import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CompanyProfile {
  name: string
  sector: string
  company_size: string
  stage: string
  annual_revenue: string
  team_size: string
}

// GET /api/companies — returns distinct companies from user's sessions
export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json([])
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { data } = await supabase
    .from('sessions')
    .select('company_profile')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!data) return NextResponse.json([])

  const seen = new Set<string>()
  const companies: CompanyProfile[] = []

  for (const session of data) {
    const profile = session.company_profile as Record<string, string>
    const name = profile?.company_name
    if (name && !seen.has(name)) {
      seen.add(name)
      companies.push({
        name,
        sector: profile.sector ?? '',
        company_size: profile.company_size ?? '',
        stage: profile.stage ?? '',
        annual_revenue: profile.annual_revenue ?? '',
        team_size: profile.team_size ?? '',
      })
    }
  }

  return NextResponse.json(companies)
}
