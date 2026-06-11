'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Practice, Doctor, Product } from '@/types/database'

const schema = z.object({
  practice_id:           z.string().uuid('Select a practice'),
  doctor_id:             z.string().uuid('Select a doctor'),
  patient_first_name:    z.string().min(1, 'Required'),
  patient_last_name:     z.string().min(1, 'Required'),
  patient_dob:           z.string().min(1, 'Required'),
  product_id:            z.string().uuid('Select a product'),
  tooth_numbers:         z.array(z.number()).min(1, 'Select at least one tooth'),
  colour_shade:          z.enum(['White', 'Clear']),
  case_start_date:       z.string().optional(),
  estimated_pickup_date: z.string().min(1, 'Required'),
  notes:                 z.string().optional(),
})

type FormData = z.infer<typeof schema>

const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1)
const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => i + 17)

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [practices, setPractices] = useState<Practice[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tooth_numbers: [] },
  })

  const selectedPracticeId = watch('practice_id')
  const selectedTeeth = watch('tooth_numbers')

  useEffect(() => {
    supabase.from('practices').select('*').eq('is_active', true).then(({ data }) => {
      setPractices(data ?? [])
    })
    supabase.from('products').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setProducts(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!selectedPracticeId) return
    supabase
      .from('doctors')
      .select('*')
      .eq('practice_id', selectedPracticeId)
      .then(({ data }) => setDoctors(data ?? []))
  }, [selectedPracticeId])

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

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? 'Failed to create order')
      setSaving(false)
      return
    }

    const { id } = await res.json()
    router.push(`/orders/${id}`)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">New Order</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Practice */}
        <Field label="Practice" error={errors.practice_id?.message}>
          <select {...register('practice_id')} className={selectCls}>
            <option value="">Select practice…</option>
            {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {/* Doctor */}
        <Field label="Doctor" error={errors.doctor_id?.message}>
          <select {...register('doctor_id')} disabled={!selectedPracticeId} className={selectCls}>
            <option value="">Select doctor…</option>
            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>)}
          </select>
        </Field>

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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Case Start Date" error={errors.case_start_date?.message}>
            <input type="date" {...register('case_start_date')} className={inputCls} />
          </Field>
          <Field label="Estimated Pickup Date" error={errors.estimated_pickup_date?.message}>
            <input type="date" {...register('estimated_pickup_date')} className={inputCls} />
          </Field>
        </div>

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
          <LiquidButton type="submit" disabled={saving} size="sm" className="font-semibold text-gray-800">
            {saving ? 'Saving…' : 'Create Order'}
          </LiquidButton>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
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
