import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Twilio calls this webhook when someone dials your number.
// Set your Twilio phone number webhook to:
//   https://dental-lab-seven.vercel.app/api/twilio/voice  (HTTP POST)

export async function POST() {
  const admin = createAdminClient()

  // Check if agent is enabled for any active tenant
  const { data } = await admin
    .from('agent_settings')
    .select('agent_enabled')
    .limit(1)
    .single()

  const agentEnabled = data?.agent_enabled ?? true
  const elevenLabsUrl = process.env.ELEVENLABS_AGENT_WEBHOOK_URL ?? ''

  if (agentEnabled && elevenLabsUrl) {
    // Forward the call to ElevenLabs
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${elevenLabsUrl}" />
  </Connect>
</Response>`
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }

  // Agent is off — play a message and hang up
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Thank you for calling. Our office is currently unavailable.
    Please call back during business hours or leave us a message.
  </Say>
  <Hangup />
</Response>`

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
}
