import { createServerClient } from '@/lib/supabase/server'
import { AgentSettings } from '../AgentSettings'

export const dynamic = 'force-dynamic'

export default async function AgentSettingsPage() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('agent_settings').select('*').single()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Agent Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Changes sync live to your ElevenLabs agent</p>
      </div>
      <AgentSettings initial={data ?? {}} />
    </div>
  )
}
