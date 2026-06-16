import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { STATUS_HEX } from '@/types/database'

export async function GET() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, patient_last_name, case_status, case_start_date, estimated_pickup_date, products ( name )')
    .eq('is_archived', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (data ?? []).map((order: any) => ({
    id:    order.id,
    title: `${order.patient_last_name} — ${(order.products as { name: string } | null)?.name ?? ''}`,
    start: order.estimated_pickup_date,
    allDay: true,
    color: STATUS_HEX[order.case_status as keyof typeof STATUS_HEX] ?? '#6B7280',
    extendedProps: { status: order.case_status, orderId: order.id },
  }))

  return NextResponse.json(events)
}
