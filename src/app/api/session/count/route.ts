import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSessionCount } from '@/lib/db/sessions'
import { getUserPlan } from '@/lib/db/plans'
import { isVip } from '@/lib/vip'

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ count: 0, limit: 2, vip: false })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ count: 0, limit: 2, vip: false })
    }

    const count = await getUserSessionCount(user.id)
    const { plan_type, session_limit: limit } = await getUserPlan(user.id, user.email ?? '')
    const vip = plan_type === 'vip' || plan_type === 'vip_plus' || isVip(user.email)
    return NextResponse.json({ count, limit, vip })
  } catch {
    return NextResponse.json({ count: 0, limit: 2, vip: false })
  }
}
