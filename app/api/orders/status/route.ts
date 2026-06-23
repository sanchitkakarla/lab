import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ElevenLabs GET tool — called during a call to look up case status.
// Accepted query params (any combination):
//   ?patient_name=John Smith      — full name
//   ?patient_first_name=John      — first name only
//   ?patient_last_name=Smith      — last name only
//   ?dob=2002-08-03               — date of birth for verification
//   ?doctor_name=Patel            — look up by doctor last name

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const patientName    = (searchParams.get('patient_name') ?? '').trim()
  const firstName      = (searchParams.get('patient_first_name') ?? searchParams.get('first_name') ?? '').trim()
  const lastName       = (searchParams.get('patient_last_name') ?? searchParams.get('last_name') ?? '').trim()
  const dob            = (searchParams.get('dob') ?? searchParams.get('date_of_birth') ?? '').trim()
  const doctorName     = (searchParams.get('doctor_name') ?? '').trim()

  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select(`
      patient_first_name,
      patient_last_name,
      patient_dob,
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
      query = query.ilike('patient_first_name', `${first}%`).ilike('patient_last_name', `${last}%`)
    } else {
      query = query.or(`patient_first_name.ilike.${first}%,patient_last_name.ilike.${first}%`)
    }
  } else if (firstName || lastName) {
    if (firstName) query = query.ilike('patient_first_name', `${firstName}%`)
    if (lastName)  query = query.ilike('patient_last_name', `${lastName}%`)
  } else if (doctorName) {
    const last = doctorName.replace(/^dr\.?\s*/i, '').split(' ').pop() ?? doctorName
    const { data: doctors } = await admin.from('doctors').select('id').ilike('last_name', `${last}%`)
    const ids = (doctors ?? []).map((d: { id: string }) => d.id)
    if (ids.length === 0) {
      return NextResponse.json({ result: `No orders found for doctor "${doctorName}".` })
    }
    query = query.in('doctor_id', ids)
  } else {
    return NextResponse.json({ result: 'Please provide a patient name or doctor name to look up.' })
  }

  // Optionally filter by DOB if provided — handle multiple formats
  if (dob) {
    let normalised: string | null = null
    const clean = dob.trim()

    // YYYY-MM-DD already
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      normalised = clean
    }
    // MM/DD/YYYY or MM-DD-YYYY
    else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
      const parts = clean.split(/[\/\-]/)
      normalised = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`
    }
    // Natural language: "August 3 2002", "aug 3 2002", "aug 3, 2002"
    else {
      const parsed = new Date(clean)
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear()
        const m = String(parsed.getMonth() + 1).padStart(2, '0')
        const d = String(parsed.getDate()).padStart(2, '0')
        normalised = `${y}-${m}-${d}`
      }
    }

    if (normalised) query = query.eq('patient_dob', normalised)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ result: 'Database error, please try again.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    const name = patientName || `${firstName} ${lastName}`.trim() || doctorName
    return NextResponse.json({ result: `No active orders found for "${name}". Please double check the name or date of birth.` })
  }

  const lines = (data as any[]).map(o => {
    const patient = `${o.patient_first_name} ${o.patient_last_name}`
    const pickup = o.estimated_pickup_date ? `estimated pickup on ${o.estimated_pickup_date}` : 'no pickup date set yet'
    return `${patient} — Status: ${o.case_status}, ${pickup}`
  })

  return NextResponse.json({ result: lines.join('. ') })
}
