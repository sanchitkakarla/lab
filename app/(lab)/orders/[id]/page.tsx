import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AdvanceButton } from '@/components/lab/AdvanceButton'
import { STAGE_ORDER, Order, OrderStageHistory } from '@/types/database'
import { format } from 'date-fns'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *, practices ( id, name ), doctors ( id, first_name, last_name, email ),
      products ( id, name )
    `)
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
  const canAdvance = currentIdx < STAGE_ORDER.length - 1

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {typedOrder.patient_last_name}, {typedOrder.patient_first_name}
        </h2>
        <StatusBadge status={typedOrder.case_status} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Patient Info */}
        <Card title="Patient">
          <Row label="First Name"  value={typedOrder.patient_first_name} />
          <Row label="Last Name"   value={typedOrder.patient_last_name} />
          <Row label="Date of Birth" value={format(new Date(typedOrder.patient_dob), 'MMM d, yyyy')} />
        </Card>

        {/* Case Info */}
        <Card title="Case Details">
          <Row label="Practice" value={typedOrder.practices?.name} />
          <Row label="Doctor"   value={typedOrder.doctors ? `Dr. ${typedOrder.doctors.first_name} ${typedOrder.doctors.last_name}` : undefined} />
          <Row label="Product"  value={typedOrder.products?.name} />
          <Row label="Shade"    value={typedOrder.colour_shade ?? undefined} />
          <Row label="Teeth"    value={(typedOrder.tooth_numbers as number[]).join(', ') || '—'} />
        </Card>

        {/* Dates */}
        <Card title="Dates">
          <Row label="Order Date"    value={format(new Date(typedOrder.order_date), 'MMM d, yyyy')} />
          <Row label="Case Start"    value={typedOrder.case_start_date ? format(new Date(typedOrder.case_start_date), 'MMM d, yyyy') : '—'} />
          <Row label="Est. Pickup"   value={format(new Date(typedOrder.estimated_pickup_date), 'MMM d, yyyy')} />
        </Card>

        {/* Notes */}
        <Card title="Notes">
          <p className="text-sm text-gray-600">{typedOrder.notes || 'No notes.'}</p>
        </Card>
      </div>

      {/* Stage progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Stage Progress</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {STAGE_ORDER.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                idx < currentIdx
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : idx === currentIdx
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-300 border-gray-100'
              }`}>
                {idx < currentIdx && <span>✓</span>}
                {stage}
              </div>
              {idx < STAGE_ORDER.length - 1 && (
                <span className="text-gray-200 text-xs">→</span>
              )}
            </div>
          ))}
        </div>

        {(canAdvance || currentIdx > 0) && (
          <div className="mt-5">
            <AdvanceButton
              orderId={typedOrder.id}
              currentStage={typedOrder.case_status}
              nextStage={STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)]}
            />
          </div>
        )}
      </div>

      {/* Stage history */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Stage History</h3>
        {typedHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No history yet.</p>
        ) : (
          <div className="space-y-3">
            {typedHistory.map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.stage_name}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(h.changed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  )
}
