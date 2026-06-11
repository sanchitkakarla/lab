'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaseStatus, STAGE_ORDER } from '@/types/database'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function AdvanceButton({
  orderId,
  nextStage,
  currentStage,
}: {
  orderId: string
  nextStage: CaseStatus
  currentStage: CaseStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'forward' | 'backward' | null>(null)
  const [error, setError] = useState('')

  const currentIdx = STAGE_ORDER.indexOf(currentStage)
  const canGoBack = currentIdx > 0
  const prevStage = canGoBack ? STAGE_ORDER[currentIdx - 1] : null

  async function move(direction: 'forward' | 'backward') {
    setLoading(direction)
    setError('')
    const res = await fetch(`/api/orders/${orderId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to update stage')
      setLoading(null)
      return
    }
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {canGoBack && (
          <button
            onClick={() => move('backward')}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 disabled:opacity-50 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
              minWidth: '160px',
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="text-center">{loading === 'backward' ? 'Moving…' : `Back to "${prevStage}"`}</span>
          </button>
        )}
        <button
          onClick={() => move('forward')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-gray-800 disabled:opacity-50 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
            minWidth: '160px',
          }}
        >
          <span className="text-center">{loading === 'forward' ? 'Moving…' : `Advance to "${nextStage}"`}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
