import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllFeatureFlagsDB, setFeatureFlagDB } from '@/lib/db/feature-flags'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

async function checkAdmin(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const flags = await getAllFeatureFlagsDB()
  return NextResponse.json(flags)
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { key, enabled } = await req.json() as { key: string; enabled: boolean }
  if (!key || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'key and enabled required' }, { status: 400 })
  }
  await setFeatureFlagDB(key, enabled)
  return NextResponse.json({ success: true })
}
