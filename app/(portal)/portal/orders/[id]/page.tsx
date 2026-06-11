import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Order, OrderStageHistory, STAGE_ORDER } from '@/types/database'
import { format } from 'date-fns'

export default async function PortalOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, products ( name )')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const { data: history } = await supabase
    .from('order_stage_history')
    .select('*')
    .eq('order_id', id)
    .order('changed_at', { ascending: true })

  const typedOrder = order as Order
  const typedHistory = (history ?? []) as OrderStageHistory[]
  const currentIdx = STAGE_ORDER.indexOf(typedOrder.case_status)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {typedOrder.patient_last_name}, {typedOrder.patient_first_name}
        </h2>
        <StatusBadge status={typedOrder.case_status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2">
          {STAGE_ORDER.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                idx < currentIdx ? 'bg-green-100 text-green-700' :
                idx === currentIdx ? 'bg-blue-600 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {idx < currentIdx && '✓ '}{stage}
              </div>
              {idx < STAGE_ORDER.length - 1 && <span className="text-gray-300 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Case Details</p>
          <Row label="Product"    value={(typedOrder.products as { name: string } | null)?.name} />
          <Row label="Shade"      value={typedOrder.colour_shade ?? undefined} />
          <Row label="Est. Pickup" value={format(new Date(typedOrder.estimated_pickup_date), 'MMM d, yyyy')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Stage History</h3>
        {typedHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No history yet.</p>
        ) : (
          <div className="space-y-3">
            {typedHistory.map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.stage_name}</p>
                  <p className="text-xs text-gray-400">{format(new Date(h.changed_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  )
}
