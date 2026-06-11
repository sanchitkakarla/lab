import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name) => req.cookies.get(name)?.value,
        set:    (name, value, options) => { res.cookies.set({ name, value, ...options }) },
        remove: (name, options) => { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  // Service role client — bypasses RLS for auth checks
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  const publicPaths = ['/login', '/doctor-setup']
  if (!session && !publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session) {
    const isLabRoute = path.startsWith('/dashboard') ||
      path.startsWith('/orders') ||
      path.startsWith('/settings') ||
      path.startsWith('/lookup') ||
      path.startsWith('/calendar')

    if (isLabRoute) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    if (path.startsWith('/portal')) {
      // Use admin client (bypasses RLS) with case-insensitive email match
      const { data: doctor } = await admin
        .from('doctors')
        .select('id, portal_enabled')
        .ilike('email', session.user.email ?? '')
        .single()

      if (!doctor || !doctor.portal_enabled) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/portal/:path*',
    '/lookup/:path*',
    '/calendar/:path*',
  ],
}
