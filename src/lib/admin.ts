// ─── Admin / VIP email list ───────────────────────────────
export const ADMIN_EMAILS = ['tamome2009@hotmail.com', 'tamome00@gmail.com']

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
