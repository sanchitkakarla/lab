import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.ELEVENLABS_WEBHOOK_SECRET && secret !== process.env.ELEVENLABS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('pickup-request body:', JSON.stringify(body))

  const {
    doctor_name,
    patient_first_name,
    patient_last_name,
    patient_dob,
    product_name,
    preferred_pickup_date,
    tooth_numbers,
    notes,
  } = body

  if (!patient_first_name || !patient_last_name || !patient_dob || !preferred_pickup_date) {
    return NextResponse.json({
      result: 'I am missing some required information. I need the patient full name, date of birth, and preferred pickup date to submit the request.'
    })
  }

  const admin = createAdminClient()

  // Get the active tenant
  const { data: tenant } = await admin
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!tenant) {
    return NextResponse.json({ result: 'System configuration error. Please submit through the portal.' })
  }

  // Try to find the doctor by last name — but don't fail if not found
  let doctor_id: string | null = null
  let practice_id: string | null = null

  if (doctor_name) {
    const nameParts = doctor_name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/)
    const lastName = nameParts[nameParts.length - 1]
    const { data: doctors } = await admin
      .from('doctors')
      .select('id, practice_id')
      .ilike('last_name', `%${lastName}%`)
      .limit(1)

    if (doctors && doctors.length > 0) {
      doctor_id = doctors[0].id
      practice_id = doctors[0].practice_id
    }
  }

  // Try to match product by name
  let product_id: string | null = null
  let finalNotes = notes ?? ''

  if (product_name) {
    const { data: products } = await admin
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .ilike('name', `%${product_name}%`)
      .limit(1)

    if (products && products.length > 0) {
      product_id = products[0].id
    } else {
      const productNote = `Product requested: ${product_name}`
      finalNotes = finalNotes ? `${productNote}. ${finalNotes}` : productNote
    }
  }

  // Add caller name to notes if doctor couldn't be matched
  if (doctor_name && !doctor_id) {
    const callerNote = `Called in by: ${doctor_name}`
    finalNotes = finalNotes ? `${callerNote}. ${finalNotes}` : callerNote
  }

  // Parse tooth numbers
  let toothNumbersArray: number[] = []
  if (tooth_numbers && tooth_numbers.trim() !== '') {
    toothNumbersArray = tooth_numbers
      .split(/[\s,]+/)
      .map((n: string) => parseInt(n.trim(), 10))
      .filter((n: number) => !isNaN(n) && n >= 1 && n <= 32)
  }

  const { error } = await admin
    .from('pickup_requests')
    .insert({
      tenant_id:             tenant.id,
      doctor_id:             doctor_id,
      practice_id:           practice_id,
      caller_name:           doctor_name ?? null,
      patient_first_name:    patient_first_name.trim(),
      patient_last_name:     patient_last_name.trim(),
      patient_dob:           patient_dob,
      product_id:            product_id,
      tooth_numbers:         toothNumbersArray,
      colour_shade:          null,
      preferred_pickup_date: preferred_pickup_date,
      notes:                 finalNotes || null,
    })

  if (error) {
    console.error('Pickup request insert error:', JSON.stringify(error))
    return NextResponse.json({
      result: `I was unable to submit the pickup request. Error: ${error.message}`
    })
  }

  const patientName = `${patient_first_name} ${patient_last_name}`
  return NextResponse.json({
    result: `I have successfully submitted a pickup request for ${patientName} with a preferred pickup date of ${preferred_pickup_date}. The lab will review it shortly. Is there anything else I can help you with?`
  })
}
