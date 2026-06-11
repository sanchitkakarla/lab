import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { STAGE_ORDER } from '@/types/database'
import { sendStageEmail } from '@/lib/email'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const body = await req.json().catch(() => ({}))
  const direction: 'forward' | 'backward' = body.direction ?? 'forward'

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(`
      id, case_status, tenant_id, estimated_pickup_date,
      patient_last_name,
      doctors ( email, first_name, last_name )
    `)
    .eq('id', id)
    .single()

  if (fetchError || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentIdx = STAGE_ORDER.indexOf(order.case_status)

  if (direction === 'backward') {
    if (currentIdx === 0) return NextResponse.json({ error: 'Already at first stage' }, { status: 400 })
  } else {
    if (currentIdx === STAGE_ORDER.length - 1) return NextResponse.json({ error: 'Already at final stage' }, { status: 400 })
  }

  const nextStage = direction === 'forward' ? STAGE_ORDER[currentIdx + 1] : STAGE_ORDER[currentIdx - 1]

  const { error: updateError } = await supabase
    .from('orders')
    .update({ case_status: nextStage })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('order_stage_history').insert({
    order_id:   id,
    tenant_id:  order.tenant_id,
    stage_name: nextStage,
    changed_by: user?.id,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctor = (order.doctors as any)?.[0] as { email: string; first_name: string; last_name: string } | undefined
  if (doctor?.email) {
    await sendStageEmail({
      toEmail:     doctor.email,
      doctorName:  `${doctor.first_name} ${doctor.last_name}`,
      patientName: order.patient_last_name,
      newStage:    nextStage,
      pickupDate:  order.estimated_pickup_date,
    })
  }

  return NextResponse.json({ success: true, newStage: nextStage })
}
