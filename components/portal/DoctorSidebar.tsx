'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/components/ui/sidebar'
import { GlassFilter } from '@/components/ui/liquid-glass'
import { Users, Sparkles, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Doctor {
  first_name: string
  last_name: string
}

const NAV = [
  { href: '/portal',          label: 'My Patients', icon: Users },
  { href: '/portal/ask-ai',   label: 'Ask AI',      icon: Sparkles },
]

export function DoctorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { open, toggleSidebar } = useSidebar()
  const [doctor, setDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('doctors')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single()
      if (data) setDoctor(data)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="sticky top-0 h-screen flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ease-linear shrink-0"
      style={{ width: open ? '220px' : '56px' }}
    >
      <GlassFilter />

      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-100 px-3 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          {open && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 whitespace-nowrap">Dental Lab</p>
              <p className="truncate text-xs text-gray-400 whitespace-nowrap">Doctor Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Doctor profile */}
      {open && (
        <div className="px-4 py-3 border-b border-gray-100 overflow-hidden">
          {doctor ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-semibold">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-900 whitespace-nowrap">
                  Dr. {doctor.first_name} {doctor.last_name}
                </p>
                <p className="truncate text-[10px] text-gray-400 whitespace-nowrap">Doctor</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {!open || (
          <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Portal
          </p>
        )}
        <div className="px-2 space-y-0.5">
          {NAV.map(item => {
            const active = item.href === '/portal'
              ? pathname === '/portal'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!open ? item.label : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-300 ${
                  active
                    ? 'glass-nav-active text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 p-2 space-y-0.5">
        <button
          onClick={signOut}
          title="Sign out"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {open && <span className="truncate">Sign out</span>}
        </button>
        <button
          onClick={toggleSidebar}
          title={open ? 'Collapse' : 'Expand'}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          {open
            ? <ChevronLeft className="h-4 w-4 shrink-0" />
            : <ChevronRight className="h-4 w-4 shrink-0" />}
          {open && <span className="truncate text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
