import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig, supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

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
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [usersRes, totalRes, monthRes, todayRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay),
    ])

    return NextResponse.json({
      totalUsers: usersRes.data?.users?.length ?? 0,
      totalSessions: totalRes.count ?? 0,
      sessionsThisMonth: monthRes.count ?? 0,
      sessionsToday: todayRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
