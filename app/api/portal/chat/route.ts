import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await req.json()

  // Fetch doctor + their orders for context
  const admin = createAdminClient()
  const { data: doctor } = await admin
    .from('doctors')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .single()

  let ordersContext = ''
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

Current active orders for this doctor:
${ordersContext || 'No active orders at this time.'}

Be concise and professional. When asked about a patient or order, refer to the data above.
If a patient isn't in the list, they may not have an active case.`

  const messages = [
    ...(history ?? []),
    { role: 'user' as const, content: message }
  ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ reply })
}
