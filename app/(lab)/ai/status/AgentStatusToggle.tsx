'use client'

import { useState } from 'react'

export function AgentStatusToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const next = !enabled
    setEnabled(next)
    await fetch('/api/agent-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_enabled: next }),
    })
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-gray-900' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'}`} />
      </button>
      <span className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
        {saving ? 'Saving…' : enabled ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}
