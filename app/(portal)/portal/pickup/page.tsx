'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/database'
import { format } from 'date-fns'

const schema = z.object({
  patient_first_name:    z.string().min(1, 'Required'),
  patient_last_name:     z.string().min(1, 'Required'),
  patient_dob:           z.string().min(1, 'Required'),
  product_id:            z.string().uuid('Select a product'),
  tooth_numbers:         z.array(z.number()).min(1, 'Select at least one tooth'),
  colour_shade:          z.enum(['White', 'Clear']),
  preferred_pickup_date: z.string().min(1, 'Required'),
  notes:                 z.string().optional(),
})

type FormData = z.infer<typeof schema>

const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1)
const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => i + 17)

export default function PickupRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [myRequests, setMyRequests] = useState<MyRequest[]>([])

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tooth_numbers: [] },
  })

  const selectedTeeth = watch('tooth_numbers')

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setProducts(data ?? [])
    })
    loadMyRequests()
  }, [])

  async function loadMyRequests() {
    const res = await fetch('/api/pickup-requests')
    if (res.ok) {
      const data = await res.json()
      setMyRequests(data)
    }
  }

  function toggleTooth(num: number) {
    const current = selectedTeeth ?? []
    const next = current.includes(num)
      ? current.filter(t => t !== num)
      : [...current, num]
    setValue('tooth_numbers', next, { shouldValidate: true })
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    setServerError('')

    const res = await fetch('/api/pickup-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? 'Failed to submit request')
      setSaving(false)
      return
    }

    reset({ tooth_numbers: [] })
    setSaving(false)
    loadMyRequests()
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">New Pickup Request</h2>
        <p className="text-sm text-gray-500 mt-1">Fill out the case details and the lab will create an order once approved.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Patient */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Patient First Name" error={errors.patient_first_name?.message}>
            <input {...register('patient_first_name')} className={inputCls} />
          </Field>
          <Field label="Patient Last Name" error={errors.patient_last_name?.message}>
            <input {...register('patient_last_name')} className={inputCls} />
          </Field>
        </div>

        <Field label="Date of Birth" error={errors.patient_dob?.message}>
          <input type="date" {...register('patient_dob')} className={inputCls} />
        </Field>

        {/* Product */}
        <Field label="Product" error={errors.product_id?.message}>
          <select {...register('product_id')} className={selectCls}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {/* Colour Shade */}
        <Field label="Colour Shade" error={errors.colour_shade?.message}>
          <select {...register('colour_shade')} className={selectCls}>
            <option value="">Select shade…</option>
            <option value="White">White</option>
            <option value="Clear">Clear</option>
          </select>
        </Field>

        {/* Tooth Numbers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tooth Numbers <span className="text-gray-400 font-normal">(select at least 1)</span>
          </label>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Upper Arch (1–16)</p>
              <div className="flex flex-wrap gap-1.5">
                {UPPER_ARCH.map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => toggleTooth(n)}
                    className={`w-8 h-8 rounded text-xs font-medium border transition-all duration-200 ${
                      selectedTeeth?.includes(n)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Lower Arch (17–32)</p>
              <div className="flex flex-wrap gap-1.5">
                {LOWER_ARCH.map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => toggleTooth(n)}
                    className={`w-8 h-8 rounded text-xs font-medium border transition-all duration-200 ${
                      selectedTeeth?.includes(n)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {errors.tooth_numbers && (
            <p className="text-xs text-red-600 mt-1">{errors.tooth_numbers.message}</p>
          )}
        </div>

        {/* Preferred Pickup Date */}
        <Field label="Preferred Pickup Date" error={errors.preferred_pickup_date?.message}>
          <input type="date" {...register('preferred_pickup_date')} className={inputCls} />
        </Field>

        {/* Notes */}
        <Field label="Notes (optional)" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={3} className={inputCls} />
        </Field>

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex gap-3 pt-2 items-center">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Submitting…' : 'Submit Pickup Request'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-2"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* My previous requests */}
      {myRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Pickup Requests</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Preferred Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(r => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.patient_last_name}, {r.patient_first_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(r.preferred_pickup_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

interface MyRequest {
  id: string
  patient_first_name: string
  patient_last_name: string
  preferred_pickup_date: string
  status: 'pending' | 'approved' | 'rejected'
}

function RequestStatusBadge({ status }: { status: MyRequest['status'] }) {
  const cls = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectCls = inputCls + ' bg-white'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
