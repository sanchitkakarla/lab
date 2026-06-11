'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Order } from '@/types/database'
import { format } from 'date-fns'

export default function LookupPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch(`/api/patients/lookup?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Lookup</h2>

      <form onSubmit={search} className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by first name, last name, or DOB (MM/DD/YYYY)…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <LiquidButton type="submit" disabled={loading} size="sm" className="text-gray-800 font-semibold">
          {loading ? 'Searching…' : 'Search'}
        </LiquidButton>
      </form>

      {searched && results.length === 0 && (
        <p className="text-sm text-gray-500">No patients found for "{query}".</p>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pickup Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {order.patient_last_name}, {order.patient_first_name}
                    </Link>
                    <p className="text-xs text-gray-400">
                      DOB: {format(new Date(order.patient_dob), 'MMM d, yyyy')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.doctors ? `Dr. ${order.doctors.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.case_status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(order.estimated_pickup_date), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
