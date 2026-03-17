import { supabaseAdmin } from '@/lib/supabase/admin'

export interface FeatureFlag {
  key: string
  enabled: boolean
  label_ar: string
  updated_at: string
}

export async function getFeatureFlagsDB(): Promise<Record<string, boolean>> {
  const { data } = await supabaseAdmin
    .from('feature_flags')
    .select('key, enabled')
  if (!data) return {}
  return Object.fromEntries(data.map((f: { key: string; enabled: boolean }) => [f.key, f.enabled]))
}

export async function getAllFeatureFlagsDB(): Promise<FeatureFlag[]> {
  const { data } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .order('key')
  return (data ?? []) as FeatureFlag[]
}

export async function setFeatureFlagDB(key: string, enabled: boolean): Promise<void> {
  await supabaseAdmin
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('key', key)
}
