import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CaseStatus, Order, STAGE_ORDER } from '@/types/database'
import { format } from 'date-fns'

const STAGE_LABELS: Record<CaseStatus, string> = {
  'Received':       'Received',
  'Prep Started':   'Prep',
  'In Fabrication': 'Fab',
  'Ready':          'Ready',
  'Delivered':      'Delivered',
}

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, patient_first_name, patient_last_name, case_status,
      estimated_pickup_date, case_start_date, tooth_numbers, colour_shade,
      practices ( id, name ),
      doctors ( id, first_name, last_name ),
      products ( id, name )
    `)
    .eq('is_archived', false)
    .order('estimated_pickup_date', { ascending: true })

  const typedOrders = (orders ?? []) as unknown as Order[]

  const counts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = typedOrders.filter(o => o.case_status === stage).length
    return acc
  }, {} as Record<CaseStatus, number>)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{typedOrders.length} active cases</p>
        </div>
        <Link href="/orders/new">
          <LiquidButton size="sm" className="font-semibold text-gray-800">
            + New Order
          </LiquidButton>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {STAGE_ORDER.map(stage => (
          <div key={stage} className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1 font-medium">{STAGE_LABELS[stage]}</p>
            <p className="text-3xl font-bold text-gray-900">{counts[stage]}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Active Orders</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Practice</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Pickup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {typedOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  No active orders.{' '}
                  <Link href="/orders/new" className="text-gray-900 underline underline-offset-2 font-medium">
                    Create one
                  </Link>
                </td>
              </tr>
            )}
            {typedOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-gray-600">
                    {order.patient_last_name}, {order.patient_first_name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {order.doctors ? `Dr. ${order.doctors.last_name}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{order.practices?.name ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{order.products?.name ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.case_status} />
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {order.estimated_pickup_date
                    ? format(new Date(order.estimated_pickup_date), 'MMM d, yyyy')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
