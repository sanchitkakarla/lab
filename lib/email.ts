import { Resend } from 'resend'

const STAGE_MESSAGES: Record<string, string> = {
  'Received':       'We have received your case and it is now in our queue.',
  'Prep Started':   'Your case has been assigned and prep work has started.',
  'In Fabrication': 'Your case is actively being fabricated in our lab.',
  'Ready':          'Great news — your case is complete and ready for pickup!',
  'Delivered':      'Your case has been marked as delivered. Thank you!',
}

export async function sendStageEmail({
  toEmail,
  doctorName,
  patientName,
  newStage,
  pickupDate,
}: {
  toEmail: string
  doctorName: string
  patientName: string
  newStage: string
  pickupDate: string
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxx') {
    console.log(`[Email skipped — RESEND_API_KEY not set] To: ${toEmail}, Stage: ${newStage}`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const message = STAGE_MESSAGES[newStage] ?? `Status updated to: ${newStage}`
  const isReady = newStage === 'Ready'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dental-lab-seven.vercel.app'

  const formattedDate = pickupDate
    ? new Date(pickupDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  await resend.emails.send({
    from: 'Dental Lab <onboarding@resend.dev>',
    to: toEmail,
    subject: isReady
      ? `✅ Case Ready — ${patientName}`
      : `Case Update: ${newStage} — ${patientName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

        <!-- Header -->
        <tr><td style="background:#111827;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">Dental Lab</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Order Management System</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Hello,</p>
          <p style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:600;letter-spacing:-0.5px;">Dr. ${doctorName}</p>

          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">${message}</p>

          <!-- Status pill -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:${isReady ? '#ecfdf5' : '#f3f4f6'};color:${isReady ? '#065f46' : '#374151'};border:1px solid ${isReady ? '#a7f3d0' : '#e5e7eb'};border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;">
              ${newStage}
            </td></tr>
          </table>

          <!-- Details card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:28px;">
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">Patient</p>
                <p style="margin:2px 0 0;color:#111827;font-size:15px;font-weight:500;">${patientName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;">
                <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">Estimated Pickup</p>
                <p style="margin:2px 0 0;color:#111827;font-size:15px;font-weight:500;">${formattedDate}</p>
              </td>
            </tr>
          </table>

          <a href="${appUrl}/portal" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">View in Portal →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">You're receiving this because you have portal access to Dental Lab.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
