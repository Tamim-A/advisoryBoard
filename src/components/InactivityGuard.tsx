'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, createClient } from '@/lib/supabase/client'

const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes

export default function InactivityGuard() {
  const router = useRouter()

  useEffect(() => {
    if (!hasSupabaseConfig()) return

    let timeout: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/login')
      }, INACTIVITY_LIMIT)
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    resetTimer()

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [router])

  return null
}
