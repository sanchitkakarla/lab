import { createServerClient } from '@/lib/supabase/server'
import { AITicket } from '@/types/database'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const TASK_TYPE_COLORS: Record<string, string> = {
  payment:         'bg-red-100 text-red-700',
  case_status:     'bg-blue-100 text-blue-700',
  parts_not_found: 'bg-orange-100 text-orange-700',
  appointment:     'bg-purple-100 text-purple-700',
  other:           'bg-gray-100 text-gray-600',
}

export default async function CallHistoryPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('ai_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const tickets = (data ?? []) as AITicket[]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Call History</h2>
        <p className="text-sm text-gray-400 mt-0.5">{tickets.length} total calls logged</p>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-gray-400">No calls recorded yet.</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-white/20">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Caller</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Question</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-white/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{t.customer_name}</p>
                    <p className="text-xs text-gray-400">{t.phone_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TASK_TYPE_COLORS[t.task_type]}`}>
                      {t.task_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{t.question}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(t.created_at), 'MMM d, h:mm a')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
