import { NextRequest, NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { setUserPlan } from '@/lib/db/plans'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: 'غير متاح' }, { status: 503 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const body = await req.json() as { plan_type: string; session_limit: number }
    const { plan_type, session_limit } = body

    if (!plan_type || typeof session_limit !== 'number' || session_limit < 0) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    await setUserPlan(params.id, plan_type, session_limit)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
