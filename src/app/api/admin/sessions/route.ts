import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig, supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json([])
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  try {
    const { data } = await supabaseAdmin
      .from('sessions')
      .select('id, title, session_type, status, final_verdict, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
