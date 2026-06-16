import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AdvanceButton } from '@/components/lab/AdvanceButton'
import { STAGE_ORDER, Order, OrderStageHistory } from '@/types/database'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`*, practices ( id, name ), doctors ( id, first_name, last_name, email ), products ( id, name )`)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const typedOrder = order as Order
  const currentIdx = STAGE_ORDER.indexOf(typedOrder.case_status)
  const canAdvance = currentIdx < STAGE_ORDER.length - 1

  // Fetch stage history for this order
  const { data: history } = await supabase
    .from('order_stage_history')
    .select('*')
    .eq('order_id', id)
    .order('changed_at', { ascending: true })

  // Fetch ALL orders for this patient oldest to latest
  const { data: patientOrders } = await supabase
    .from('orders')
    .select('id, order_date, case_status, estimated_pickup_date, products ( name )')
    .eq('patient_first_name', typedOrder.patient_first_name)
    .eq('patient_last_name', typedOrder.patient_last_name)
    .eq('patient_dob', typedOrder.patient_dob)
    .order('order_date', { ascending: true })

  const typedHistory = (history ?? []) as OrderStageHistory[]

  return (
    <div className="w-full">
      {/* Back link */}
      <div className="mb-4">
        <Link href="/lookup" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to Patient Lookup
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {typedOrder.patient_last_name}, {typedOrder.patient_first_name}
        </h2>
        <StatusBadge status={typedOrder.case_status} />
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Left column — case details */}
        <div className="col-span-2 space-y-6">

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card title="Patient">
              <Row label="First Name"    value={typedOrder.patient_first_name} />
              <Row label="Last Name"     value={typedOrder.patient_last_name} />
              <Row label="Date of Birth" value={format(new Date(typedOrder.patient_dob), 'MMM d, yyyy')} />
            </Card>

            <Card title="Case Details">
              <Row label="Practice" value={typedOrder.practices?.name} />
              <Row label="Doctor"   value={typedOrder.doctors ? `Dr. ${typedOrder.doctors.first_name} ${typedOrder.doctors.last_name}` : undefined} />
              <Row label="Product"  value={typedOrder.products?.name} />
              <Row label="Shade"    value={typedOrder.colour_shade ?? undefined} />
              <Row label="Teeth"    value={(typedOrder.tooth_numbers as number[]).join(', ') || '—'} />
            </Card>

            <Card title="Dates">
              <Row label="Order Date"  value={format(new Date(typedOrder.order_date), 'MMM d, yyyy')} />
              <Row label="Case Start"  value={typedOrder.case_start_date ? format(new Date(typedOrder.case_start_date), 'MMM d, yyyy') : '—'} />
              <Row label="Est. Pickup" value={format(new Date(typedOrder.estimated_pickup_date), 'MMM d, yyyy')} />
            </Card>

            <Card title="Notes">
              <p className="text-sm text-gray-600">{typedOrder.notes || 'No notes.'}</p>
            </Card>
          </div>

          {/* Stage progress */}
          <div className="glass-card p-5">
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
                  {idx < STAGE_ORDER.length - 1 && <span className="text-gray-200 text-xs">→</span>}
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
          <div className="glass-card p-5">
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
                      <p className="text-xs text-gray-400">{format(new Date(h.changed_at), 'MMM d, yyyy h:mm a')}</p>
                      {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — patient order history */}
        <div className="col-span-1">
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Patient History</h3>
            <p className="text-xs text-gray-400 mb-4">All orders — oldest to latest</p>

            {(patientOrders ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No other orders.</p>
            ) : (
              <div className="space-y-2">
                {(patientOrders ?? []).map((o: any) => {
                  const isCurrent = o.id === id
                  const product = (o.products as { name: string } | null)?.name ?? '—'
                  return (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className={`block rounded-lg p-3 border transition-colors ${
                        isCurrent
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900 truncate">{product}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full shrink-0">
                            current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {format(new Date(o.order_date), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge status={o.case_status} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
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
