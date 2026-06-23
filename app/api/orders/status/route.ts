import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ElevenLabs GET tool — called during a call to look up case status.
// Query params:
//   ?patient_name=John Smith
//   ?doctor_name=Patel
// Either one is accepted.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const patientName = (searchParams.get('patient_name') ?? '').trim()
  const doctorName = (searchParams.get('doctor_name') ?? '').trim()

  if (!patientName && !doctorName) {
    return NextResponse.json({ result: 'Please provide a patient name or doctor name to look up.' })
  }

  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select(`
      patient_first_name,
      patient_last_name,
      case_status,
      estimated_pickup_date,
      doctors ( first_name, last_name ),
      practices ( name )
    `)
    .eq('is_archived', false)
    .order('order_date', { ascending: false })
    .limit(5)

  if (patientName) {
    const parts = patientName.split(' ')
    const first = parts[0]
    const last = parts.length > 1 ? parts.slice(1).join(' ') : ''
    if (last) {
      query = query
        .ilike('patient_first_name', `${first}%`)
        .ilike('patient_last_name', `${last}%`)
    } else {
      query = query.or(
        `patient_first_name.ilike.${first}%,patient_last_name.ilike.${first}%`
      )
    }
  } else {
    const lastName = doctorName.replace(/^dr\.?\s*/i, '').split(' ').pop() ?? doctorName
    const { data: doctors } = await admin
      .from('doctors')
      .select('id')
      .ilike('last_name', `${lastName}%`)
    const ids = (doctors ?? []).map((d: { id: string }) => d.id)
    if (ids.length === 0) {
      return NextResponse.json({ result: `No orders found for doctor "${doctorName}".` })
    }
    query = query.in('doctor_id', ids)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ result: 'Database error, please try again.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    const name = patientName || doctorName
    return NextResponse.json({ result: `No active orders found for "${name}".` })
  }

  const lines = (data as any[]).map(o => {
    const patient = `${o.patient_first_name} ${o.patient_last_name}`
    const pickup = o.estimated_pickup_date ? `pickup on ${o.estimated_pickup_date}` : 'no pickup date yet'
    return `${patient} — Status: ${o.case_status}, ${pickup}`
  })

  return NextResponse.json({ result: lines.join('. ') })
}
