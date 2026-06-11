'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types/database'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/products')
    setProducts(await res.json())
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sort_order: products.length }),
    })
    setName('')
    await load()
    setSaving(false)
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Products</h2>

      <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name *" required
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <LiquidButton type="submit" disabled={saving} size="sm" className="font-semibold text-gray-800">
          {saving ? 'Saving…' : 'Add'}
        </LiquidButton>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Product Name</th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="px-4 py-3 text-gray-900">{p.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
