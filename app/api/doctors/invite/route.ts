import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { doctor_id, temp_password } = await request.json()
  if (!doctor_id) return NextResponse.json({ error: 'doctor_id required' }, { status: 400 })

  const { data: doctor, error: docErr } = await supabase
    .from('doctors')
    .select('id, email, first_name, last_name, portal_enabled')
    .eq('id', doctor_id)
    .single()

  if (docErr || !doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  if (!doctor.email) return NextResponse.json({ error: 'Doctor has no email address' }, { status: 400 })

  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dental-lab-seven.vercel.app'

  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = existingUsers?.users.find(
    u => u.email?.toLowerCase() === doctor.email.toLowerCase()
  )

  if (temp_password) {
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, { password: temp_password, email_confirm: true })
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email: doctor.email,
        password: temp_password,
        email_confirm: true,
        user_metadata: { full_name: `Dr. ${doctor.first_name} ${doctor.last_name}` },
      })
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    await admin.from('doctors').update({ portal_enabled: true }).eq('id', doctor_id)
    return NextResponse.json({ success: true, method: 'password_set' })
  }

  // Generate the magic link using Supabase admin (doesn't send email — we send via Resend)
  const redirectTo = `${appUrl}/doctor-setup`
  let magicLink: string

  if (existing) {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: doctor.email,
      options: { redirectTo },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: linkErr?.message ?? 'Failed to generate reset link' }, { status: 500 })
    }
    magicLink = linkData.properties.action_link
  } else {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: doctor.email,
      options: {
        redirectTo,
        data: { full_name: `Dr. ${doctor.first_name} ${doctor.last_name}` },
      },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: linkErr?.message ?? 'Failed to generate invite link' }, { status: 500 })
    }
    magicLink = linkData.properties.action_link
  }

  await admin.from('doctors').update({ portal_enabled: true }).eq('id', doctor_id)

  // Send via Resend
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_xxxxxxxxxx') {
    // No Resend key — return the link so lab can share it manually
    return NextResponse.json({ success: true, method: 'link_only', link: magicLink })
  }

  const resend = new Resend(apiKey)
  const isReset = !!existing
  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`

  const { error: emailErr } = await resend.emails.send({
    from: 'Dental Lab <onboarding@resend.dev>',
    to: doctor.email,
    subject: isReset ? 'Reset your Dental Lab portal password' : `You've been invited to Dental Lab portal`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

        <tr><td style="background:#111827;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">Dental Lab</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Patient Portal</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Hello,</p>
          <p style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:600;letter-spacing:-0.5px;">${doctorName}</p>

          <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
            ${isReset
              ? 'A password reset was requested for your portal account. Click the button below to choose a new password.'
              : "You've been given access to the Dental Lab patient portal. Click the button below to set your password and get started."
            }
          </p>

          <a href="${magicLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:500;">
            ${isReset ? 'Reset Password →' : 'Set Password & Sign In →'}
          </a>

          <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;">This link expires in 24 hours. If you didn't expect this email, you can ignore it.</p>
        </td></tr>

        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Dental Lab · Patient Portal Access</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

  return NextResponse.json({ success: true, method: 'email_sent' })
}
