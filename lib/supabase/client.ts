import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export function createClient() {
  return createBrowserClient(url, key)
}
