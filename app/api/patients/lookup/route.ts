import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (!q) return NextResponse.json([])

  const supabase = await createServerClient()

  // Detect if query looks like a date (YYYY-MM-DD or MM/DD/YYYY or MM-DD-YYYY)
  const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/
  const isDate = datePattern.test(q)

  let query = supabase
    .from('orders')
    .select(`
      id, patient_first_name, patient_last_name, patient_dob,
      case_status, estimated_pickup_date,
      doctors ( first_name, last_name ),
      practices ( name )
    `)
    .eq('is_archived', false)
    .order('patient_last_name', { ascending: true })

  if (isDate) {
    // Normalise to YYYY-MM-DD for the DB
    let dob = q
    if (!q.startsWith('20') && !q.startsWith('19')) {
      const parts = q.split(/[\/\-]/)
      dob = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`
    }
    query = query.eq('patient_dob', dob)
  } else {
    // Search first name OR last name (OR filter via two separate queries merged)
    query = query.or(
      `patient_last_name.ilike.${q}%,patient_first_name.ilike.${q}%`
    )
  }

  const { data, error } = await query.limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
