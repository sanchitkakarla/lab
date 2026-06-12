import { createServerClient } from '@/lib/supabase/server'
import { AskAIPanel } from '@/components/portal/AskAIPanel'

export default async function AskAIPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let doctorName = ''
  if (user?.email) {
    const { data } = await supabase
      .from('doctors')
      .select('last_name')
      .eq('email', user.email)
      .single()
    doctorName = data?.last_name ?? ''
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ask AI</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
        <AskAIPanel doctorName={doctorName} />
      </div>
    </div>
  )
}
