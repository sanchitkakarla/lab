import { Resend } from 'resend'

const STAGE_MESSAGES: Record<string, string> = {
  'Received':       'We have received your case and it is in our queue.',
  'Prep Started':   'Your case has been assigned and prep work has begun.',
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

  await resend.emails.send({
    from:    'Dental Lab <noreply@yourlabdomain.com>',
    to:      toEmail,
    subject: isReady
      ? `✅ Case Ready for Pickup — Patient: ${patientName}`
      : `Case Update — Patient: ${patientName} — ${newStage}`,
    html: `
      <h2>Case Status Update</h2>
      <p>Hello Dr. ${doctorName},</p>
      <p>${message}</p>
      <table cellpadding="4">
        <tr><td><b>Patient:</b></td><td>${patientName}</td></tr>
        <tr><td><b>Status:</b></td><td>${newStage}</td></tr>
        <tr><td><b>Est. pickup:</b></td><td>${pickupDate}</td></tr>
      </table>
      ${isReady
        ? '<p><b>Please arrange collection during our business hours.</b></p>'
        : '<p>We will notify you when the status changes again.</p>'
      }
      <p>You can also view your case status at any time by logging into your portal.</p>
    `,
  })
}
