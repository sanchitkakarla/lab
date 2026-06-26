'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Truck } from 'lucide-react'

interface PickupRequest {
  id: string
  patient_first_name: string
  patient_last_name: string
  preferred_pickup_date: string
  created_at: string
  doctors: { first_name: string; last_name: string } | null
  practices: { name: string } | null
  products: { name: string } | null
}

export function PendingPickupsSection() {
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pickup-requests')
      .then(r => r.json())
      .then((data: (PickupRequest & { status: string })[]) => {
        setRequests(data.filter(r => r.status === 'pending'))
        setLoading(false)
      })
  }, [])

  if (!loading && requests.length === 0) return null

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-yellow-600" />
          <h2 className="text-sm font-semibold text-gray-700">Pending Pickup Requests</h2>
          {!loading && requests.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
              {requests.length}
            </span>
          )}
        </div>
        <Link href="/pickups" className="text-xs text-blue-600 hover:underline font-medium">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="px-5 py-6 text-sm text-gray-400">Loading…</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-white/20">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Practice</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Preferred Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-white/20 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">
                  {r.patient_last_name}, {r.patient_first_name}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{r.practices?.name ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {format(new Date(r.preferred_pickup_date), 'MMM d, yyyy')}
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href="/pickups"
                    className="px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
