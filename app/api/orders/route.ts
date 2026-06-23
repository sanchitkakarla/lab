import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createOrderSchema = z.object({
  practice_id:           z.string().uuid(),
  doctor_id:             z.string().uuid(),
  patient_first_name:    z.string().min(1),
  patient_last_name:     z.string().min(1),
  patient_dob:           z.string().min(1).transform(v => v === '' ? undefined : v),
  product_id:            z.string().uuid(),
  tooth_numbers:         z.array(z.number()).min(1),
  colour_shade:          z.enum(['White', 'Clear']),
  case_start_date:       z.string().optional().transform(v => v === '' ? undefined : v),
  estimated_pickup_date: z.string().min(1),
  notes:                 z.string().optional(),
})

export async function GET() {
  const supabase = await createServerClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, patient_first_name, patient_last_name, patient_dob,
      case_status, estimated_pickup_date, case_start_date,
      tooth_numbers, colour_shade, is_archived,
      practices ( id, name ),
      doctors ( id, first_name, last_name ),
      products ( id, name )
    `)
    .eq('is_archived', false)
    .order('estimated_pickup_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      ...parsed.data,
      tenant_id:  profile.tenant_id,
      created_by: user?.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert initial stage history
  await supabase.from('order_stage_history').insert({
    order_id:   order.id,
    tenant_id:  profile.tenant_id,
    stage_name: 'Received',
    changed_by: user?.id,
  })

  return NextResponse.json(order, { status: 201 })
}
