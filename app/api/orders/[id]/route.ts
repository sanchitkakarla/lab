import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *, practices ( id, name ), doctors ( id, first_name, last_name, email ),
      products ( id, name )
    `)
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const body = await request.json()

  const allowed = [
    'practice_id', 'doctor_id', 'patient_first_name', 'patient_last_name', 'patient_dob',
    'product_id', 'tooth_numbers', 'colour_shade', 'case_start_date',
    'estimated_pickup_date', 'notes', 'is_archived',
  ]
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
