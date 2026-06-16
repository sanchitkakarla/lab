import { createServerClient } from '@/lib/supabase/server'
import { AgentStatusToggle } from './AgentStatusToggle'

export const dynamic = 'force-dynamic'

export default async function AgentStatusPage() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('agent_settings').select('agent_enabled').single()
  const enabled = data?.agent_enabled ?? true

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Agent Status</h2>
        <p className="text-sm text-gray-400 mt-0.5">Control whether your AI agent answers calls</p>
      </div>
      <div className="glass-card p-6 flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-gray-900">Agent active</p>
          <p className="text-xs text-gray-400 mt-1">When off, the agent won't pick up calls from your Twilio number</p>
        </div>
        <AgentStatusToggle initial={enabled} />
      </div>
    </div>
  )
}
