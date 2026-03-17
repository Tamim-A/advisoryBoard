import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSessionCount, getDailyPlatformSessionCount } from '@/lib/db/sessions'
import { getDailySessionCountLocal } from '@/lib/storage'
import { getUserPlan } from '@/lib/db/plans'
import { isVip } from '@/lib/vip'

const DAILY_PLATFORM_LIMIT = 15

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    const dailyCount = getDailySessionCountLocal()
    return NextResponse.json({
      count: 0, limit: 2, vip: false,
      dailyPlatformCount: dailyCount, dailyPlatformLimit: DAILY_PLATFORM_LIMIT,
    })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const dailyCount = await getDailyPlatformSessionCount()

    if (!user) {
      return NextResponse.json({
        count: 0, limit: 2, vip: false,
        dailyPlatformCount: dailyCount, dailyPlatformLimit: DAILY_PLATFORM_LIMIT,
      })
    }

    const count = await getUserSessionCount(user.id)
    const { plan_type, session_limit: limit } = await getUserPlan(user.id, user.email ?? '')
    const vip = plan_type === 'vip' || plan_type === 'vip_plus' || isVip(user.email)
    return NextResponse.json({
      count, limit, vip,
      dailyPlatformCount: dailyCount, dailyPlatformLimit: DAILY_PLATFORM_LIMIT,
    })
  } catch {
    return NextResponse.json({
      count: 0, limit: 2, vip: false,
      dailyPlatformCount: 0, dailyPlatformLimit: DAILY_PLATFORM_LIMIT,
    })
  }
}
