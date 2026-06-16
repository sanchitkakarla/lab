'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export function LookupSearch({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/lookup?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/lookup')
    }
  }

  return (
    <form onSubmit={search} className="flex gap-3 mb-6">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by first name, last name, or DOB…"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <LiquidButton type="submit" size="sm" className="text-gray-800 font-semibold">
        Search
      </LiquidButton>
    </form>
  )
}
