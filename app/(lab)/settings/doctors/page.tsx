'use client'

import { useEffect, useState } from 'react'
import { Doctor, Practice } from '@/types/database'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { GlassFilter } from '@/components/ui/liquid-glass'
import { Mail, KeyRound, X, Eye, EyeOff, Check } from 'lucide-react'

type DoctorWithPractice = Doctor & { practices?: { name: string } }

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorWithPractice[]>([])
  const [practices, setPractices] = useState<Practice[]>([])
  const [form, setForm] = useState({ practice_id: '', first_name: '', last_name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  // Invite modal state
  const [inviteDoctor, setInviteDoctor] = useState<DoctorWithPractice | null>(null)
  const [inviteMode, setInviteMode] = useState<'email' | 'password'>('email')
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [d, p] = await Promise.all([
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/practices').then(r => r.json()),
    ])
    setDoctors(d)
    setPractices(p)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ practice_id: '', first_name: '', last_name: '', email: '', phone: '' })
    await load()
    setSaving(false)
  }

  async function sendInvite() {
    if (!inviteDoctor) return
    setInviting(true)
    setInviteResult(null)

    const body: Record<string, string> = { doctor_id: inviteDoctor.id }
    if (inviteMode === 'password') {
      if (tempPassword.length < 6) {
        setInviteResult({ ok: false, msg: 'Password must be at least 6 characters' })
        setInviting(false)
        return
      }
      body.temp_password = tempPassword
    }

    const res = await fetch('/api/doctors/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()

    if (res.ok) {
      setInviteResult({
        ok: true,
        msg: json.method === 'email_sent'
          ? `Invite email sent to ${inviteDoctor.email}`
          : `Password set — share it with Dr. ${inviteDoctor.last_name} securely`,
      })
      await load()
    } else {
      setInviteResult({ ok: false, msg: json.error ?? 'Something went wrong' })
    }
    setInviting(false)
  }

  function openInvite(doctor: DoctorWithPractice) {
    setInviteDoctor(doctor)
    setInviteMode('email')
    setTempPassword('')
    setInviteResult(null)
  }

  function closeInvite() {
    setInviteDoctor(null)
    setInviteResult(null)
  }

  return (
    <div className="max-w-3xl">
      <GlassFilter />

      <h2 className="text-xl font-semibold text-gray-900 mb-6">Doctors</h2>

      {/* Add Doctor form */}
      <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add Doctor</h3>
        <select value={form.practice_id} onChange={e => setForm(f => ({ ...f, practice_id: e.target.value }))} required className={cls}>
          <option value="">Select practice *</option>
          {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name *" required className={cls} />
          <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name *" required className={cls} />
        </div>
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email — required for portal access" type="email" className={cls} />
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={cls} />
        <LiquidButton type="submit" disabled={saving} size="sm" className="font-semibold text-gray-800">
          {saving ? 'Saving…' : 'Add Doctor'}
        </LiquidButton>
      </form>

      {/* Doctors table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Practice</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Portal</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {doctors.map(d => (
              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">Dr. {d.first_name} {d.last_name}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.practices?.name ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.email ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    d.portal_enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {d.portal_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {d.email ? (
                    <button
                      onClick={() => openInvite(d)}
                      className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
                    >
                      {d.portal_enabled ? 'Reset password' : 'Give access'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">No email</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {inviteDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button onClick={closeInvite} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Portal Access — Dr. {inviteDoctor.first_name} {inviteDoctor.last_name}
            </h3>
            <p className="text-sm text-gray-400 mb-5">{inviteDoctor.email}</p>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setInviteMode('email')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  inviteMode === 'email' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Send invite email
              </button>
              <button
                onClick={() => setInviteMode('password')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  inviteMode === 'password' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Set password manually
              </button>
            </div>

            {inviteMode === 'email' ? (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1 mb-5">
                <p>An email will be sent to <strong>{inviteDoctor.email}</strong> with a link for them to set their own password.</p>
                <p className="text-gray-400 text-xs">They will log in at your portal URL using their email + the password they choose.</p>
              </div>
            ) : (
              <div className="mb-5 space-y-2">
                <p className="text-sm text-gray-600">Set a temporary password. Share it with the doctor via phone or secure message.</p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {inviteResult && (
              <div className={`flex items-start gap-2 text-sm mb-4 px-3 py-2.5 rounded-lg ${
                inviteResult.ok ? 'bg-gray-50 text-gray-700' : 'bg-red-50 text-red-600'
              }`}>
                {inviteResult.ok && <Check className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />}
                {inviteResult.msg}
              </div>
            )}

            <div className="flex gap-3">
              {!inviteResult?.ok && (
                <LiquidButton
                  onClick={sendInvite}
                  disabled={inviting}
                  size="sm"
                  className="font-semibold text-gray-800"
                >
                  {inviting ? 'Sending…' : inviteMode === 'email' ? 'Send Invite Email' : 'Set Password & Enable'}
                </LiquidButton>
              )}
              <button onClick={closeInvite} className="text-sm text-gray-400 hover:text-gray-700 px-2">
                {inviteResult?.ok ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white'
