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
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <AskAIPanel doctorName={doctorName} />
      </div>
    </div>
  )
}
