import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('tenant_id', user.id)
    .single()

  return NextResponse.json(data ?? {})
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Save to Supabase
  const { data, error } = await supabase
    .from('agent_settings')
    .upsert({ ...body, tenant_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync to ElevenLabs
  const agentId = process.env.ELEVENLABS_AGENT_ID
  const apiKey  = process.env.ELEVENLABS_API_KEY
  if (agentId && apiKey) {
    const systemPrompt = buildSystemPrompt(body)
    await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: { prompt: systemPrompt },
            first_message: body.greeting_message,
          },
          tts: { voice_id: body.voice_id },
        },
      }),
    })
  }

  return NextResponse.json(data)
}

function buildSystemPrompt(s: {
  office_hours?: string
  office_location_url?: string
  greeting_message?: string
}) {
  return `You are a helpful dental lab assistant answering calls on behalf of the dental lab.

Office hours: ${s.office_hours ?? 'Monday–Friday 9am–5pm'}
${s.office_location_url ? `Office location: ${s.office_location_url}` : ''}

Your responsibilities:
- Help callers with case status, pickup times, payments, and appointments
- If you cannot answer a question, use the create_ticket tool to log it before ending the call
- If a caller asks to speak to a human, use the transfer tool to connect them
- Always be professional, warm, and concise
- Never hang up without either answering the question or creating a ticket`
}
