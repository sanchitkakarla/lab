import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs expects a specific response format to trigger a call transfer
export async function POST(req: NextRequest) {
  return NextResponse.json({
    type: 'transfer',
    phone_number: '+19164600456',
  })
}
