import { supabaseAdmin } from '@/lib/supabase/admin'
import { isVip, FREE_SESSION_LIMIT, VIP_SESSION_LIMIT } from '@/lib/vip'

export interface UserPlan {
  plan_type: string
  session_limit: number
}

/**
 * Get the session limit for a user.
 * Checks user_plans table first, then falls back to VIP email list, then default free limit.
 */
export async function getUserPlan(userId: string, email: string): Promise<UserPlan> {
  try {
    const { data } = await supabaseAdmin
      .from('user_plans')
      .select('plan_type, session_limit')
      .eq('user_id', userId)
      .single()

    if (data) {
      return { plan_type: data.plan_type as string, session_limit: data.session_limit as number }
    }
  } catch { /* table may not exist yet — fall through */ }

  // Fallback to VIP email list
  if (isVip(email)) return { plan_type: 'vip', session_limit: VIP_SESSION_LIMIT }
  return { plan_type: 'free', session_limit: FREE_SESSION_LIMIT }
}

export async function setUserPlan(
  userId: string,
  planType: string,
  sessionLimit: number
): Promise<void> {
  await supabaseAdmin
    .from('user_plans')
    .upsert({ user_id: userId, plan_type: planType, session_limit: sessionLimit, updated_at: new Date().toISOString() })
}
