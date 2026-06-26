'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface PickupRequest {
  id: string
  patient_first_name: string
  patient_last_name: string
  patient_dob: string
  preferred_pickup_date: string
  status: 'pending' | 'approved' | 'rejected'
  order_id: string | null
  notes: string | null
  created_at: string
  doctors: { id: string; first_name: string; last_name: string } | null
  practices: { id: string; name: string } | null
  products: { id: string; name: string } | null
}

export default function PickupsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/pickup-requests')
    if (res.ok) setRequests(await res.json())
    setLoading(false)
  }

  async function approve(id: string) {
    setProcessing(id)
    const res = await fetch(`/api/pickup-requests/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      const { order_id } = await res.json()
      router.push(`/orders/${order_id}`)
    } else {
      alert('Failed to approve request')
      setProcessing(null)
    }
  }

  async function reject(id: string) {
    if (!confirm('Reject this pickup request?')) return
    setProcessing(id)
    const res = await fetch(`/api/pickup-requests/${id}/reject`, { method: 'POST' })
    if (res.ok) {
      await load()
    } else {
      alert('Failed to reject request')
    }
    setProcessing(null)
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Pickup Requests</h1>
        <p className="text-sm text-gray-400 mt-0.5">Requests submitted by doctors — approve to create an order</p>
      </div>

      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          Pending
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
              {pending.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="glass-card p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-gray-400">No pending requests.</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white/20">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Practice</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Preferred Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Submitted</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map(r => (
                  <tr key={r.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {r.patient_last_name}, {r.patient_first_name}
                      {r.notes && (
                        <p className="text-xs text-gray-400 font-normal mt-0.5 truncate max-w-[160px]" title={r.notes}>
                          {r.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{r.practices?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.products?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {format(new Date(r.preferred_pickup_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {format(new Date(r.created_at), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approve(r.id)}
                          disabled={processing === r.id}
                          className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === r.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => reject(r.id)}
                          disabled={processing === r.id}
                          className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent (Approved / Rejected)</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white/20">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Preferred Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resolved.map(r => (
                  <tr key={r.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {r.patient_last_name}, {r.patient_first_name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {format(new Date(r.preferred_pickup_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {r.order_id ? (
                        <a href={`/orders/${r.order_id}`} className="text-blue-600 hover:underline text-xs font-medium">
                          View Order →
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'approved'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}
