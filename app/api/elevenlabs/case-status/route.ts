import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ElevenLabs calls this tool during a conversation to look up case status.
// Configure as a custom tool in ElevenLabs agent:
//   POST https://your-domain.com/api/elevenlabs/case-status
//
// Expected body:
// { patient_name: string }   — e.g. "John Smith"
// OR
// { doctor_name: string }    — e.g. "Dr. Patel"

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.ELEVENLABS_WEBHOOK_SECRET && secret !== process.env.ELEVENLABS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { patient_name?: string; doctor_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()

  const patientName = (body.patient_name ?? '').trim()
  const doctorName = (body.doctor_name ?? '').trim()

  if (!patientName && !doctorName) {
    return NextResponse.json({ error: 'Provide patient_name or doctor_name' }, { status: 400 })
  }

  let query = admin
    .from('orders')
    .select(`
      id,
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
  } else if (doctorName) {
    const parts = doctorName.replace(/^dr\.?\s*/i, '').split(' ')
    const last = parts[parts.length - 1]
    const { data: doctors } = await admin
      .from('doctors')
      .select('id')
      .ilike('last_name', `${last}%`)
    const doctorIds = (doctors ?? []).map((d: { id: string }) => d.id)
    if (doctorIds.length === 0) {
      return NextResponse.json({ result: `No orders found for doctor "${doctorName}".` })
    }
    query = query.in('doctor_id', doctorIds)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    const name = patientName || doctorName
    return NextResponse.json({ result: `No active orders found for "${name}".` })
  }

  const lines = data.map((o: any) => {
    const patient = `${o.patient_first_name} ${o.patient_last_name}`
    const pickup = o.estimated_pickup_date
      ? `Estimated pickup: ${o.estimated_pickup_date}`
      : 'No pickup date set'
    return `Patient: ${patient} | Status: ${o.case_status} | ${pickup}`
  })

  return NextResponse.json({
    result: lines.join('\n'),
  })
}
