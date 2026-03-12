// ─── VIP / Admin user list ────────────────────────────────
const VIP_EMAILS = [
  'tamome2009@hotmail.com',
  'tamome00@gmail.com',
]

export const FREE_SESSION_LIMIT = 2
export const VIP_SESSION_LIMIT = 20

export function isVip(email: string | undefined | null): boolean {
  if (!email) return false
  return VIP_EMAILS.includes(email.toLowerCase())
}

export function getSessionLimit(email: string | undefined | null): number {
  return isVip(email) ? VIP_SESSION_LIMIT : FREE_SESSION_LIMIT
}
