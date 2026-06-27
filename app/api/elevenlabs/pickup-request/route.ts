import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ElevenLabs calls this tool when a doctor wants to submit a pickup request over the phone.
//
// Add this as a webhook tool in your ElevenLabs agent:
//   Name: create_pickup_request
//   URL:  POST https://dental-lab-seven.vercel.app/api/elevenlabs/pickup-request
//
// Parameters the agent must collect before calling this tool:
//   doctor_name           string  — e.g. "Dr. Smith" or "Smith"
//   patient_first_name    string
//   patient_last_name     string
//   patient_dob           string  — YYYY-MM-DD format
//   product_name          string  — spoken product name, matched to DB or put in notes
//   preferred_pickup_date string  — YYYY-MM-DD format
//   tooth_numbers         string  — optional, e.g. "3, 4, 5" or empty/null to skip
//   notes                 string  — optional

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.ELEVENLABS_WEBHOOK_SECRET && secret !== process.env.ELEVENLABS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    doctor_name?: string
    patient_first_name?: string
    patient_last_name?: string
    patient_dob?: string
    product_name?: string
    preferred_pickup_date?: string
    tooth_numbers?: string
    notes?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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

  if (!doctor_name || !patient_first_name || !patient_last_name || !patient_dob || !preferred_pickup_date) {
    return NextResponse.json({
      result: 'Missing required information. Please make sure you have the doctor name, patient full name, date of birth, and preferred pickup date.'
    })
  }

  const admin = createAdminClient()

  // Look up doctor by last name (case-insensitive)
  const nameParts = doctor_name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]

  const { data: doctors } = await admin
    .from('doctors')
    .select('id, first_name, last_name, practice_id, tenant_id')
    .ilike('last_name', `%${lastName}%`)

  if (!doctors || doctors.length === 0) {
    return NextResponse.json({
      result: `I could not find a doctor with the name "${doctor_name}" in the system. Please ask them to double-check their name or submit the request through the portal.`
    })
  }

  const doctor = doctors[0]

  // Try to match product by name (case-insensitive)
  let product_id: string | null = null
  let finalNotes = notes ?? ''

  if (product_name) {
    const { data: products } = await admin
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .ilike('name', `%${product_name}%`)

    if (products && products.length > 0) {
      product_id = products[0].id
    } else {
      // No match — put spoken product name in notes
      const productNote = `Product requested: ${product_name}`
      finalNotes = finalNotes ? `${productNote}. ${finalNotes}` : productNote
    }
  }

  // Parse tooth numbers if provided
  let toothNumbersArray: number[] = []
  if (tooth_numbers && tooth_numbers.trim() !== '') {
    toothNumbersArray = tooth_numbers
      .split(/[\s,]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 32)
  }

  const { data, error } = await admin
    .from('pickup_requests')
    .insert({
      tenant_id:             doctor.tenant_id,
      doctor_id:             doctor.id,
      practice_id:           doctor.practice_id,
      patient_first_name:    patient_first_name.trim(),
      patient_last_name:     patient_last_name.trim(),
      patient_dob:           patient_dob,
      product_id:            product_id,
      tooth_numbers:         toothNumbersArray,
      colour_shade:          null,
      preferred_pickup_date: preferred_pickup_date,
      notes:                 finalNotes || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Pickup request insert error:', error)
    return NextResponse.json({
      result: 'There was an error submitting the pickup request. Please try again or submit through the portal.'
    })
  }

  const patientName = `${patient_first_name} ${patient_last_name}`
  return NextResponse.json({
    result: `Perfect! I've submitted a pickup request for ${patientName} with a preferred pickup date of ${preferred_pickup_date}. The lab will review it and create an order. Is there anything else I can help you with?`
  })
}
