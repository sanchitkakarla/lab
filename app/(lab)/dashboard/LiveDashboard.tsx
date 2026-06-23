'use client'

import { useLiveDashboard } from '@/hooks/useLiveDashboard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Activity, CalendarCheck, CalendarClock, PlusCircle, TrendingUp } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export function LiveDashboard() {
  const { data, loading } = useLiveDashboard(10000)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <p className="text-sm text-gray-400">
              {loading ? 'Loading…' : `${data.totalActive} active cases · updated ${format(data.lastUpdated, 'h:mm:ss a')}`}
            </p>
          </div>
        </div>
        <Link href="/orders/new">
          <LiquidButton size="sm" className="font-semibold text-gray-800">
            <PlusCircle className="w-4 h-4 mr-1.5" /> New Order
          </LiquidButton>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="New today"
          value={data.newToday}
          icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          color="text-blue-600"
          sub="orders created today"
        />
        <StatCard
          label="Pickup today"
          value={data.pickupToday}
          icon={<CalendarCheck className="w-4 h-4 text-green-500" />}
          color="text-green-600"
          sub="due for pickup today"
        />
        <StatCard
          label="Pickup this week"
          value={data.pickupThisWeek}
          icon={<CalendarClock className="w-4 h-4 text-purple-500" />}
          color="text-purple-600"
          sub="due in next 7 days"
        />
        <StatCard
          label="Total active"
          value={data.totalActive}
          icon={<Activity className="w-4 h-4 text-gray-500" />}
          color="text-gray-900"
          sub="cases in progress"
        />
      </div>

      {/* Recent orders table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Recent orders</h2>
          <span className="text-xs text-gray-400">auto-refreshes every 10s</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-white/20">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Patient</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doctor</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Practice</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Pickup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  No active orders. <Link href="/orders/new" className="text-gray-900 underline underline-offset-2 font-medium">Create one</Link>
                </td>
              </tr>
            )}
            {data.recentOrders.map(order => (
              <tr key={order.id} className="hover:bg-white/20 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-gray-600">
                    {order.patient_last_name}, {order.patient_first_name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{order.doctor_last_name ? `Dr. ${order.doctor_last_name}` : '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{order.practice_name ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{order.product_name ?? '—'}</td>
                <td className="px-5 py-3.5"><StatusBadge status={order.case_status} /></td>
                <td className="px-5 py-3.5 text-gray-500">
                  {order.estimated_pickup_date ? format(new Date(order.estimated_pickup_date), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: number; icon: React.ReactNode; color: string; sub: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
