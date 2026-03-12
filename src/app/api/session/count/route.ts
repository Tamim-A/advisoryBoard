import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSessionCount } from '@/lib/db/sessions'

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ count: 0 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const count = await getUserSessionCount(user.id)
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
