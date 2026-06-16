import { createServerClient } from '@/lib/supabase/server'
import { AITicket } from '@/types/database'
import { format } from 'date-fns'
import { TicketActions } from './TicketActions'

const TASK_TYPE_LABELS: Record<string, string> = {
  payment:        'Payment',
  case_status:    'Case Status',
  parts_not_found:'Parts Not Found',
  appointment:    'Appointment',
  other:          'Other',
}

const TASK_TYPE_COLORS: Record<string, string> = {
  payment:        'bg-red-100 text-red-700',
  case_status:    'bg-blue-100 text-blue-700',
  parts_not_found:'bg-orange-100 text-orange-700',
  appointment:    'bg-purple-100 text-purple-700',
  other:          'bg-gray-100 text-gray-600',
}

export default async function AIPage() {
  const supabase = await createServerClient()

  const { data: tickets } = await supabase
    .from('ai_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const typedTickets = (tickets ?? []) as AITicket[]
  const open = typedTickets.filter(t => t.status === 'open')
  const resolved = typedTickets.filter(t => t.status === 'resolved')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Agent</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tickets created when the AI couldn't answer a caller</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Agent active
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Open tickets" value={open.length} color="text-red-600" />
        <StatCard label="Resolved" value={resolved.length} color="text-green-600" />
        <StatCard label="Total calls" value={typedTickets.length} color="text-gray-900" />
      </div>

      {/* Open tickets */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Open <span className="ml-1 text-xs font-normal text-gray-400">({open.length})</span>
        </h3>
        {open.length === 0 ? (
          <EmptyState message="No open tickets — the agent handled everything!" />
        ) : (
          <div className="space-y-3">
            {open.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            Resolved <span className="ml-1 text-xs font-normal">({resolved.length})</span>
          </h3>
          <div className="space-y-3 opacity-60">
            {resolved.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function TicketCard({ ticket: t }: { ticket: AITicket }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Task name + type */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TASK_TYPE_COLORS[t.task_type]}`}>
              {TASK_TYPE_LABELS[t.task_type]}
            </span>
            {t.status === 'open' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Open
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{t.task_name}</p>

          {/* Caller info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
            <span>📞 {t.phone_number}</span>
            <span>👤 {t.customer_name}</span>
            <span>🕐 {format(new Date(t.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>

          {/* Question */}
          <p className="text-xs text-gray-400 italic">"{t.question}"</p>
        </div>

        {/* Actions */}
        {t.status === 'open' && <TicketActions id={t.id} />}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card border-dashed p-8 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
