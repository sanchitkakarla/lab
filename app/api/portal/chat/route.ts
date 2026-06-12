import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'missing' })

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await req.json()

  // Fetch doctor + their live orders from Supabase
  const admin = createAdminClient()
  const { data: doctor } = await admin
    .from('doctors')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .single()

  let ordersContext = 'No active orders at this time.'
  if (doctor) {
    const { data: orders } = await admin
      .from('orders')
      .select('id, patient_first_name, patient_last_name, case_status, estimated_pickup_date, colour_shade, products(name)')
      .eq('doctor_id', doctor.id)
      .eq('is_archived', false)
      .order('estimated_pickup_date', { ascending: true })

    if (orders && orders.length > 0) {
      ordersContext = orders.map(o => {
        const product = (o.products as unknown as { name: string } | null)?.name ?? 'Unknown'
        return `- Patient: ${o.patient_last_name}, ${o.patient_first_name} | Product: ${product} | Status: ${o.case_status} | Est. Pickup: ${o.estimated_pickup_date}${o.colour_shade ? ` | Shade: ${o.colour_shade}` : ''}`
      }).join('\n')
    }
  }

  const systemPrompt = `You are a helpful dental lab assistant for Dr. ${doctor?.first_name ?? ''} ${doctor?.last_name ?? ''}.
You help doctors track their patient cases and answer questions about lab orders.
Current active orders:
${ordersContext}
Be concise and professional. Only answer based on the data above. If a patient is not listed, they have no active case.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history ?? []),
        { role: 'user', content: message },
      ],
      max_tokens: 512,
      temperature: 0.4,
    })

    const reply = response.choices[0]?.message?.content?.trim() ?? 'No response.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Groq error:', err)
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' }, { status: 200 })
  }
}
