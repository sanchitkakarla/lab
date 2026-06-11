'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

function DoctorSetupInner() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function exchangeToken() {
      // Parse the hash fragment that Supabase puts in invite/recovery links
      // e.g. #access_token=xxx&refresh_token=yyy&type=invite
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type') // 'invite' | 'recovery' | 'signup'

      if (accessToken && refreshToken) {
        // Exchange tokens to establish a session
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError || !data.session) {
          setStatus('error')
          setError(sessionError?.message ?? 'Invalid or expired invite link. Ask the lab to resend.')
          return
        }

        setEmail(data.session.user.email ?? '')
        setStatus('ready')

        // Clear the tokens from the URL bar (security hygiene)
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      // No hash — check if already has a valid session (e.g. page refresh after token exchange)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setEmail(session.user.email ?? '')
        setStatus('ready')
        return
      }

      setStatus('error')
      setError('No invite token found. Please use the link from your email.')
    }

    exchangeToken()
  }, [])

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/portal')
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Verifying your invite…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-xs text-gray-400">
          Ask the lab to resend your invite from Settings → Doctors → Reset password.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={setNewPassword} className="w-full flex flex-col gap-4">
      <p className="text-center text-xs text-gray-400 -mt-2 mb-1">{email}</p>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={showPw ? 'text' : 'password'}
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={showPw ? 'text' : 'password'}
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <div className="flex justify-center mt-1">
        <LiquidButton type="submit" disabled={loading} size="sm" className="font-semibold text-gray-800 px-8">
          {loading ? 'Setting up…' : 'Set Password & Continue'}
        </LiquidButton>
      </div>
    </form>
  )
}

export default function DoctorSetupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-gray-900 text-white rounded-lg p-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-base">Dental Lab</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-light text-gray-900 tracking-tight">
            Set your<br />password
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Choose a password to access your patient portal
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
          </div>
        }>
          <DoctorSetupInner />
        </Suspense>
      </div>
    </div>
  )
}
