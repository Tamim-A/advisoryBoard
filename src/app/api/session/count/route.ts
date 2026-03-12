import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSessionCount } from '@/lib/db/sessions'
import { isVip, getSessionLimit } from '@/lib/vip'

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
    const vip = isVip(user.email)
    const limit = getSessionLimit(user.email)
    return NextResponse.json({ count, limit, vip })
  } catch {
    return NextResponse.json({ count: 0, limit: 2, vip: false })
  }
}
