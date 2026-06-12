import { NextRequest, NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!)

// Free model on HF Inference API — no cost, just needs a free HF token
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.3'

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

  // Build conversation in Mistral instruct format
  const turns = (history ?? []) as { role: string; content: string }[]
  let prompt = `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n`

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i]
    if (t.role === 'user') {
      prompt += i === 0 ? `${t.content} [/INST] ` : `[INST] ${t.content} [/INST] `
    } else {
      prompt += `${t.content} </s><s>`
    }
  }
  prompt += turns.length === 0
    ? `${message} [/INST]`
    : `[INST] ${message} [/INST]`

  const result = await hf.textGeneration({
    model: MODEL,
    inputs: prompt,
    parameters: {
      max_new_tokens: 512,
      temperature: 0.4,
      return_full_text: false,
    },
  })

  const reply = result.generated_text.trim()
  return NextResponse.json({ reply })
}
