'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Sparkles, LogOut } from 'lucide-react'
import { AskAIPanel } from '@/components/portal/AskAIPanel'
import { Skeleton } from '@/components/ui/skeleton'

interface Doctor {
  first_name: string
  last_name: string
}

const NAV = [
  { label: 'My Patients', href: '/portal', icon: Users },
  { label: 'Ask AI', href: '/portal?view=ai', icon: Sparkles, isAI: true },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <div className="bg-gray-900 text-white rounded-lg p-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Doctor Portal</span>
        </header>
        <main className="flex-1 p-6 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Right sidebar */}
      <aside className="w-72 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
        {/* Doctor info */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          {doctor ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-3">
                <span className="text-white text-sm font-semibold">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </span>
              </div>
              <p className="text-xs text-gray-400">Welcome back,</p>
              <p className="text-sm font-semibold text-gray-900">
                Dr. {doctor.first_name} {doctor.last_name}
              </p>
            </>
          ) : (
            <>
              <Skeleton className="w-10 h-10 rounded-full mb-3" />
              <Skeleton className="h-3 w-20 mb-1.5" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="px-3 py-3 space-y-0.5">
          <button
            onClick={() => setShowAI(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              !showAI ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            My Patients
          </button>
          <button
            onClick={() => setShowAI(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              showAI ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>
        </nav>

        {/* AI Panel */}
        {showAI && doctor && (
          <div className="flex-1 overflow-hidden border-t border-gray-100">
            <AskAIPanel doctorName={doctor.last_name} />
          </div>
        )}

        {/* Sign out */}
        <div className="mt-auto px-3 py-4 border-t border-gray-100">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  )
}
