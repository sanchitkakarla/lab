import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  patient_first_name:    z.string().min(1),
  patient_last_name:     z.string().min(1),
  patient_dob:           z.string().min(1),
  product_id:            z.string().uuid(),
  tooth_numbers:         z.array(z.number()).min(1),
  colour_shade:          z.enum(['White', 'Clear']),
  preferred_pickup_date: z.string().min(1),
  notes:                 z.string().optional(),
})

export async function GET() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('pickup_requests')
    .select(`
      id, patient_first_name, patient_last_name, patient_dob,
      preferred_pickup_date, status, order_id, created_at, notes,
      tooth_numbers, colour_shade,
      doctors ( id, first_name, last_name ),
      practices ( id, name ),
      products ( id, name )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve doctor from logged-in email
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, practice_id, tenant_id')
    .eq('email', user.email)
    .single()

  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 401 })

  const { data, error } = await supabase
    .from('pickup_requests')
    .insert({
      ...parsed.data,
      doctor_id:   doctor.id,
      practice_id: doctor.practice_id,
      tenant_id:   doctor.tenant_id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
