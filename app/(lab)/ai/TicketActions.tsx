'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function TicketActions({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resolve() {
    setLoading(true)
    await fetch(`/api/lab/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Resolving…' : 'Resolve'}
    </button>
  )
}
