import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TicketTaskType } from '@/types/database'

// ElevenLabs calls this tool when the agent cannot answer a question.
// Configure this URL as a custom tool in your ElevenLabs agent:
//   POST https://your-domain.com/api/elevenlabs/webhook
//
// Expected body from ElevenLabs tool call:
// {
//   phone_number: string,
//   customer_name: string,
//   question: string,       // what the caller asked
//   task_type: 'payment' | 'case_status' | 'parts_not_found' | 'appointment' | 'other'
//   task_name: string       // short description generated from the question
// }

function inferTaskType(question: string): TicketTaskType {
  const q = question.toLowerCase()
  if (q.includes('pay') || q.includes('invoice') || q.includes('bill') || q.includes('charge')) return 'payment'
  if (q.includes('status') || q.includes('case') || q.includes('order') || q.includes('ready') || q.includes('pickup')) return 'case_status'
  if (q.includes('part') || q.includes('missing') || q.includes('not found') || q.includes('lost')) return 'parts_not_found'
  if (q.includes('appointment') || q.includes('schedule') || q.includes('book')) return 'appointment'
  return 'other'
}

function inferTaskName(question: string, customer_name: string): string {
  const q = question.toLowerCase()
  if (q.includes('pay')) return `Payment inquiry from ${customer_name}`
  if (q.includes('status') || q.includes('case') || q.includes('ready')) return `Case status check for ${customer_name}`
  if (q.includes('part') || q.includes('missing')) return `Missing parts reported by ${customer_name}`
  if (q.includes('appointment') || q.includes('schedule')) return `Appointment request from ${customer_name}`
  // Fallback: use first 60 chars of question as task name
  const short = question.length > 60 ? question.slice(0, 57) + '...' : question
  return short
}

export async function POST(req: NextRequest) {
  // Verify secret header to ensure requests come from ElevenLabs
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.ELEVENLABS_WEBHOOK_SECRET && secret !== process.env.ELEVENLABS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    phone_number?: string
    customer_name?: string
    question?: string
    task_type?: TicketTaskType
    task_name?: string
    tenant_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const phone_number = body.phone_number ?? 'Unknown'
  const customer_name = body.customer_name ?? 'Unknown caller'
  const question = body.question ?? ''
  const task_type = body.task_type ?? inferTaskType(question)
  const task_name = body.task_name ?? inferTaskName(question, customer_name)

  const admin = createAdminClient()

  // Get tenant_id — use body value or fall back to first active tenant
  let tenant_id = body.tenant_id
  if (!tenant_id) {
    const { data: tenant } = await admin
      .from('tenants')
      .select('id')
      .eq('is_active', true)
      .single()
    tenant_id = tenant?.id
  }

  if (!tenant_id) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  const { data, error } = await admin.from('ai_tickets').insert({
    tenant_id,
    phone_number,
    customer_name,
    task_type,
    task_name,
    question,
    status: 'open',
  }).select().single()

  if (error) {
    console.error('Ticket insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, ticket_id: data.id })
}
