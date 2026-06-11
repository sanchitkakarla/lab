import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Returns the role of the currently authenticated user: 'staff' | 'doctor' | null
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ role: null })

  // Check if lab staff first (anon client is fine — RLS allows users to read their own profile)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile) return NextResponse.json({ role: 'staff' })

  // Check if doctor — use admin to bypass RLS
  const admin = createAdminClient()
  const { data: doctor } = await admin
    .from('doctors')
    .select('id, portal_enabled')
    .eq('email', user.email)
    .single()

  if (doctor?.portal_enabled) return NextResponse.json({ role: 'doctor' })

  return NextResponse.json({ role: null })
}
