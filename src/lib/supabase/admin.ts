import { createClient } from '@supabase/supabase-js'

// Use placeholder values when env vars are absent (build-time / local without Supabase).
// Actual DB calls are guarded by hasSupabaseServerConfig(), so the placeholder client
// is never used for real requests.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key'
)

export function hasSupabaseServerConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
