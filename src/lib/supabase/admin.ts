import { createClient } from '@supabase/supabase-js'

// Use placeholder values when env vars are absent (build-time / local without Supabase).
// Actual DB calls are guarded by hasSupabaseServerConfig(), so the placeholder client
// is never used for real requests.
//
// CRITICAL: Next.js 14 patches fetch() and caches GET requests by default.
// Supabase client uses GET for .select() calls via PostgREST.
// Without { cache: 'no-store' }, reads return stale cached data after updates.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' })
      },
    },
  }
)

export function hasSupabaseServerConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
