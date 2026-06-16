'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Practice } from '@/types/database'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export default function PracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/practices')
    setPractices(await res.json())
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/practices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, address }),
    })
    setName(''); setPhone(''); setEmail(''); setAddress('')
    await load()
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Practices</h2>

      <form onSubmit={save} className="glass-card p-5 mb-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add Practice</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Practice name *" required className={cls} />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className={cls} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className={cls} />
        <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" rows={2} className={cls} />
        <LiquidButton type="submit" disabled={saving} size="sm" className="font-semibold text-gray-800">
          {saving ? 'Saving…' : 'Add Practice'}
        </LiquidButton>
      </form>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
          </tr></thead>
          <tbody>
            {practices.map(p => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
