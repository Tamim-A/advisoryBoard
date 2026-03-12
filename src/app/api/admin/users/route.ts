import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig, supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { getUserPlan } from '@/lib/db/plans'

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: 'غير متاح' }, { status: 503 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
    const users = usersData?.users ?? []

    // Get session counts for all users in one query
    const { data: sessionCounts } = await supabaseAdmin
      .from('sessions')
      .select('user_id')

    const countMap: Record<string, number> = {}
    for (const s of sessionCounts ?? []) {
      if (s.user_id) countMap[s.user_id] = (countMap[s.user_id] ?? 0) + 1
    }

    const result = await Promise.all(users.map(async (u) => {
      const plan = await getUserPlan(u.id, u.email ?? '')
      return {
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.full_name as string | undefined) ?? u.email?.split('@')[0] ?? 'مستخدم',
        plan_type: plan.plan_type,
        session_limit: plan.session_limit,
        session_count: countMap[u.id] ?? 0,
        created_at: u.created_at,
      }
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
