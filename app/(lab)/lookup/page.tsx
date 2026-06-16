import { createServerClient } from '@/lib/supabase/server'
import { Order } from '@/types/database'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/ui/StatusBadge'
import Link from 'next/link'
import { LookupSearch } from './LookupSearch'

export const dynamic = 'force-dynamic'

export default async function LookupPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('orders')
    .select(`id, patient_first_name, patient_last_name, patient_dob, case_status, estimated_pickup_date, order_date, doctors ( first_name, last_name ), practices ( name )`)
    .eq('is_archived', false)
    .order('order_date', { ascending: true })

  if (q?.trim()) {
    query = query.or(`patient_last_name.ilike.${q}%,patient_first_name.ilike.${q}%`)
  }

  const { data } = await query.limit(200)
  const orders = (data ?? []) as unknown as Order[]

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Lookup</h2>

      <LookupSearch defaultQuery={q ?? ''} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Doctor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pickup Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {q ? `No patients found for "${q}".` : 'No patients found.'}
                </td>
              </tr>
            )}
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {order.patient_last_name}, {order.patient_first_name}
                  </Link>
                  <p className="text-xs text-gray-400">DOB: {format(new Date(order.patient_dob), 'MMM d, yyyy')}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {order.doctors ? `Dr. ${order.doctors.last_name}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.case_status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(order.order_date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(order.estimated_pickup_date), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
