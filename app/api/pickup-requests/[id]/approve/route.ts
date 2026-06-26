import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the pickup request
  const { data: pr, error: prErr } = await supabase
    .from('pickup_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (prErr || !pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (pr.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

  // Create the order from pickup request data
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      tenant_id:             profile.tenant_id,
      practice_id:           pr.practice_id,
      doctor_id:             pr.doctor_id,
      patient_first_name:    pr.patient_first_name,
      patient_last_name:     pr.patient_last_name,
      patient_dob:           pr.patient_dob,
      product_id:            pr.product_id,
      tooth_numbers:         pr.tooth_numbers,
      colour_shade:          pr.colour_shade,
      estimated_pickup_date: pr.preferred_pickup_date,
      notes:                 pr.notes,
      created_by:            user?.id,
    })
    .select('id')
    .single()

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

  // Insert initial stage history
  await supabase.from('order_stage_history').insert({
    order_id:   order.id,
    tenant_id:  profile.tenant_id,
    stage_name: 'Received',
    changed_by: user?.id,
  })

  // Mark pickup request as approved, link the order
  await supabase
    .from('pickup_requests')
    .update({ status: 'approved', order_id: order.id })
    .eq('id', id)

  return NextResponse.json({ order_id: order.id })
}
