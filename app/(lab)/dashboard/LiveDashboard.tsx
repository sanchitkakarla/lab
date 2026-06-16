'use client'

import { useLiveDashboard } from '@/hooks/useLiveDashboard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CaseStatus, STAGE_ORDER } from '@/types/database'
import { format } from 'date-fns'
import Link from 'next/link'
import { Activity, CalendarCheck, CalendarClock, PlusCircle, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

const STAGE_LABELS: Record<CaseStatus, string> = {
  'Received':       'Received',
  'Prep Started':   'Prep',
  'In Fabrication': 'Fab',
  'Ready':          'Ready',
  'Delivered':      'Delivered',
}

const STAGE_COLORS: Record<CaseStatus, string> = {
  'Received':       'text-gray-600',
  'Prep Started':   'text-blue-600',
  'In Fabrication': 'text-purple-600',
  'Ready':          'text-green-600',
  'Delivered':      'text-gray-400',
}

const CHART_COLORS: Record<CaseStatus, string> = {
  'Received':       '#94a3b8',
  'Prep Started':   '#3b82f6',
  'In Fabrication': '#a855f7',
  'Ready':          '#22c55e',
  'Delivered':      '#d1d5db',
}

export function LiveDashboard() {
  const { data, loading } = useLiveDashboard(10000)

  // Build bar chart data from stage counts
  const chartData = STAGE_ORDER.map(stage => ({
    stage: STAGE_LABELS[stage],
    count: data.stageCounts[stage],
    fill: CHART_COLORS[stage],
  }))

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

      {/* Stage counts + chart */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stage breakdown */}
        <div className="glass-card p-5 col-span-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by stage</h2>
          <div className="space-y-3">
            {STAGE_ORDER.map(stage => {
              const count = data.stageCounts[stage]
              const pct = data.totalActive > 0 ? Math.round((count / data.totalActive) * 100) : 0
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{STAGE_LABELS[stage]}</span>
                    <span className={`text-sm font-bold ${STAGE_COLORS[stage]}`}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: CHART_COLORS[stage] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Area chart */}
        <div className="glass-card p-5 col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Stage distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [v, 'Cases']}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#3b82f6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
