import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verify the caller is a logged-in lab staff member
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { doctor_id, temp_password } = await request.json()
  if (!doctor_id) return NextResponse.json({ error: 'doctor_id required' }, { status: 400 })

  // Fetch the doctor record
  const { data: doctor, error: docErr } = await supabase
    .from('doctors')
    .select('id, email, first_name, last_name, portal_enabled')
    .eq('id', doctor_id)
    .single()

  if (docErr || !doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  if (!doctor.email) return NextResponse.json({ error: 'Doctor has no email address' }, { status: 400 })

  const admin = createAdminClient()

  // Check if an auth user already exists for this email
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = existingUsers?.users.find(
    u => u.email?.toLowerCase() === doctor.email.toLowerCase()
  )

  if (temp_password) {
    // Lab owner is setting a specific temporary password
    if (existing) {
      // Update the existing user's password
      await admin.auth.admin.updateUserById(existing.id, {
        password: temp_password,
        email_confirm: true,
      })
    } else {
      // Create a new auth user with the given password
      const { error: createErr } = await admin.auth.admin.createUser({
        email: doctor.email,
        password: temp_password,
        email_confirm: true,
        user_metadata: { full_name: `Dr. ${doctor.first_name} ${doctor.last_name}` },
      })
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    // Enable portal access
    await admin.from('doctors').update({ portal_enabled: true }).eq('id', doctor_id)

    return NextResponse.json({ success: true, method: 'password_set' })
  } else {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectTo = `${appUrl}/doctor-setup`

    // Send an invite / password reset email so the doctor sets their own password
    if (existing) {
      // Doctor already has an account — send a password reset link to /doctor-setup
      const { error: resetErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: doctor.email,
        options: { redirectTo },
      })
      if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 })
    } else {
      // No account yet — send an invite email that lands on /doctor-setup
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(doctor.email, {
        redirectTo,
        data: { full_name: `Dr. ${doctor.first_name} ${doctor.last_name}` },
      })
      if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 })
    }

    // Enable portal access
    await admin.from('doctors').update({ portal_enabled: true }).eq('id', doctor_id)

    return NextResponse.json({ success: true, method: 'email_sent' })
  }
}
