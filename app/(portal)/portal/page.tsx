import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Order } from '@/types/database'
import { format } from 'date-fns'

export default async function PortalDashboard() {
  const supabase = await createServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, patient_first_name, patient_last_name, case_status, estimated_pickup_date')
    .eq('is_archived', false)
    .order('estimated_pickup_date', { ascending: true })

  const typedOrders = (orders ?? []) as Order[]

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Cases</h2>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Est. Pickup</th>
            </tr>
          </thead>
          <tbody>
            {typedOrders.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No active cases.</td>
              </tr>
            )}
            {typedOrders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/portal/orders/${order.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {order.patient_last_name}, {order.patient_first_name}
                  </Link>
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
    </div>
  )
}
