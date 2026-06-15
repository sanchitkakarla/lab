'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/components/ui/sidebar'
import { GlassFilter } from '@/components/ui/liquid-glass'
import {
  LayoutDashboard, PlusCircle, Search, Building2,
  Users, Package, LogOut, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/orders/new', label: 'New Order',      icon: PlusCircle },
  { href: '/lookup',     label: 'Patient Lookup', icon: Search },
]

const NAV_AI = [
  { href: '/ai', label: 'AI Agent', icon: Sparkles },
]

const NAV_SETTINGS = [
  { href: '/settings/practices', label: 'Practices', icon: Building2 },
  { href: '/settings/doctors',   label: 'Doctors',   icon: Users },
  { href: '/settings/products',  label: 'Products',  icon: Package },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { open, toggleSidebar } = useSidebar()

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
              <p className="truncate text-xs text-gray-400 whitespace-nowrap">Order Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5">
        <NavSection label="Main" collapsed={!open}>
          {NAV_MAIN.map(item => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href || (item.href !== '/orders/new' && pathname.startsWith(item.href + '/'))}
              collapsed={!open}
            />
          ))}
        </NavSection>

        <NavSection label="AI" collapsed={!open}>
          {NAV_AI.map(item => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed={!open} />
          ))}
        </NavSection>

        <NavSection label="Settings" collapsed={!open}>
          {NAV_SETTINGS.map(item => (
            <NavItem key={item.href} item={item} active={pathname === item.href} collapsed={!open} />
          ))}
        </NavSection>
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

function NavSection({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && (
        <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
      )}
      <div className="px-2 space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({ item, active, collapsed }: {
  item: { href: string; label: string; icon: React.ElementType }
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-300 ${
        active
          ? 'glass-nav-active text-gray-900 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}
