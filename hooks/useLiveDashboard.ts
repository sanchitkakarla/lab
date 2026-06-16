'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CaseStatus, STAGE_ORDER } from '@/types/database'

export interface DashboardData {
  stageCounts: Record<CaseStatus, number>
  totalActive: number
  newToday: number
  pickupToday: number
  pickupThisWeek: number
  recentOrders: RecentOrder[]
  stageHistory: { time: string; stage: CaseStatus; count: number }[]
  lastUpdated: Date
}

export interface RecentOrder {
  id: string
  patient_first_name: string
  patient_last_name: string
  case_status: CaseStatus
  estimated_pickup_date: string
  doctor_last_name?: string
  practice_name?: string
  product_name?: string
}

const EMPTY: DashboardData = {
  stageCounts: { Received: 0, 'Prep Started': 0, 'In Fabrication': 0, Ready: 0, Delivered: 0 },
  totalActive: 0,
  newToday: 0,
  pickupToday: 0,
  pickupThisWeek: 0,
  recentOrders: [],
  stageHistory: [],
  lastUpdated: new Date(),
}

export function useLiveDashboard(intervalMs = 10000) {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const { data: orders } = await supabase
      .from('orders')
      .select(`id, patient_first_name, patient_last_name, case_status, estimated_pickup_date, order_date,
        doctors ( last_name ), practices ( name ), products ( name )`)
      .eq('is_archived', false)
      .order('order_date', { ascending: false })

    if (!orders) return

    const stageCounts = STAGE_ORDER.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.case_status === s).length
      return acc
    }, {} as Record<CaseStatus, number>)

    const newToday = orders.filter(o => o.order_date?.startsWith(today)).length
    const pickupToday = orders.filter(o => o.estimated_pickup_date?.startsWith(today)).length
    const pickupThisWeek = orders.filter(o => o.estimated_pickup_date >= today && o.estimated_pickup_date <= weekEnd).length

    const recentOrders: RecentOrder[] = orders.slice(0, 20).map((o: any) => ({
      id: o.id,
      patient_first_name: o.patient_first_name,
      patient_last_name: o.patient_last_name,
      case_status: o.case_status,
      estimated_pickup_date: o.estimated_pickup_date,
      doctor_last_name: o.doctors?.last_name,
      practice_name: o.practices?.name,
      product_name: o.products?.name,
    }))

    setData({
      stageCounts,
      totalActive: orders.length,
      newToday,
      pickupToday,
      pickupThisWeek,
      recentOrders,
      stageHistory: [],
      lastUpdated: new Date(),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, intervalMs)
    return () => clearInterval(id)
  }, [fetch, intervalMs])

  return { data, loading }
}
