'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassFilter } from '@/components/ui/liquid-glass'
import {
  LayoutGrid, Sparkles, Settings, LayoutDashboard,
  PlusCircle, Search, Calendar, Building2,
  Users, Package, LogOut,
} from 'lucide-react'
import { useState, useEffect } from 'react'

type Section = 'main' | 'ai' | 'settings' | null

const SECONDARY: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  main: [
    { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/orders/new', label: 'New Order',      icon: PlusCircle },
    { href: '/lookup',     label: 'Patient Lookup', icon: Search },
    { href: '/calendar',   label: 'Calendar',       icon: Calendar },
  ],
  ai: [
    { href: '/ai', label: 'AI Agent', icon: Sparkles },
  ],
  settings: [
    { href: '/settings/practices', label: 'Practices', icon: Building2 },
    { href: '/settings/doctors',   label: 'Doctors',   icon: Users },
    { href: '/settings/products',  label: 'Products',  icon: Package },
  ],
}

const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  ai: 'AI',
  settings: 'Settings',
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [active, setActive] = useState<Section>(null)

  // Auto-open the right section based on current path
  useEffect(() => {
    if (pathname.startsWith('/ai')) setActive('ai')
    else if (pathname.startsWith('/settings')) setActive('settings')
    else setActive('main')
  }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggle(section: Section) {
    setActive(prev => prev === section ? null : section)
  }

  const isMainActive = ['/dashboard', '/orders', '/lookup', '/calendar'].some(p => pathname.startsWith(p))
  const isAIActive = pathname.startsWith('/ai')
  const isSettingsActive = pathname.startsWith('/settings')

  return (
    <div className="sticky top-0 h-screen flex shrink-0">
      <GlassFilter />

      {/* Primary icon rail — 48px */}
      <div className="flex flex-col w-12 h-full bg-white border-r border-gray-100">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-gray-100 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>

        {/* Primary icons */}
        <nav className="flex-1 flex flex-col items-center py-3 gap-1">
          <PrimaryIcon
            icon={LayoutGrid}
            label="Main"
            active={active === 'main'}
            highlight={isMainActive}
            onClick={() => toggle('main')}
          />
          <PrimaryIcon
            icon={Sparkles}
            label="AI"
            active={active === 'ai'}
            highlight={isAIActive}
            onClick={() => toggle('ai')}
          />
          <PrimaryIcon
            icon={Settings}
            label="Settings"
            active={active === 'settings'}
            highlight={isSettingsActive}
            onClick={() => toggle('settings')}
          />
        </nav>

        {/* Sign out */}
        <div className="shrink-0 border-t border-gray-100 flex flex-col items-center py-3">
          <button
            onClick={signOut}
            title="Sign out"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Secondary sidebar — slides in */}
      <div
        className="h-full bg-white border-r border-gray-100 overflow-hidden transition-all duration-200 ease-in-out"
        style={{ width: active ? '176px' : '0px' }}
      >
        {active && (
          <div className="w-44 h-full flex flex-col py-4">
            {/* Section label */}
            <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {SECTION_LABELS[active]}
            </p>

            {/* Sub-items */}
            <nav className="px-2 space-y-0.5 flex-1">
              {SECONDARY[active].map(item => {
                const isActive = item.href === '/dashboard'
                  ? pathname === item.href || pathname.startsWith('/orders/')
                  : item.href === '/orders/new'
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'glass-nav-active text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

function PrimaryIcon({
  icon: Icon, label, active, highlight, onClick
}: {
  icon: React.ElementType
  label: string
  active: boolean
  highlight: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-gray-900 text-white'
          : highlight
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
