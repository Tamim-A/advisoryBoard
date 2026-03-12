import { NextResponse } from 'next/server'
import { hasSupabaseServerConfig, supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: 'غير متاح' }, { status: 503 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Delete user data first
    await supabaseAdmin.from('sessions').delete().eq('user_id', user.id)

    // Delete the user via admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 })
  }
}
