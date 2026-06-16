'use client'

import { useState, useEffect } from 'react'
import { Power, Mic, MessageSquare, MapPin, Clock, Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
]

interface Settings {
  agent_enabled: boolean
  greeting_message: string
  voice_id: string
  office_location_url: string
  office_hours: string
}

const DEFAULTS: Settings = {
  agent_enabled: true,
  greeting_message: 'Hello! Thank you for calling. How can I help you today?',
  voice_id: 'EXAVITQu4vr4xnSDxMaL',
  office_location_url: '',
  office_hours: 'Monday–Friday 9am–5pm',
}

export function AgentSidebarPanel() {
  const pathname = usePathname()
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  useEffect(() => {
    fetch('/api/agent-settings')
      .then(r => r.json())
      .then(d => { if (d && d.agent_enabled !== undefined) setSettings({ ...DEFAULTS, ...d }); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/agent-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const selectedVoice = VOICES.find(v => v.id === settings.voice_id) ?? VOICES[0]
  const isTicketsActive = pathname === '/ai'

  return (
    <div className="w-44 h-full flex flex-col">
      {/* Section label */}
      <p className="px-4 pt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Agent</p>

      {/* Tickets link */}
      <nav className="px-2 mb-3">
        <Link
          href="/ai"
          className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-200 ${
            isTicketsActive ? 'glass-nav-active text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="truncate whitespace-nowrap">Tickets</span>
        </Link>
      </nav>

      <div className="px-3 shrink-0">
        <div className="h-px bg-gray-100 mb-3" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Settings</p>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">

        {/* Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Power className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-medium">Active</span>
          </div>
          <button
            onClick={() => set('agent_enabled', !settings.agent_enabled)}
            className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${settings.agent_enabled ? 'bg-gray-900' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${settings.agent_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Voice */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Mic className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-medium">Voice</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setVoiceOpen(o => !o)}
              className="w-full flex items-center justify-between gap-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/60 hover:bg-white/80 transition-colors text-gray-900"
            >
              <span>{selectedVoice.name}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${voiceOpen ? 'rotate-180' : ''}`} />
            </button>
            {voiceOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 glass-card p-1 z-50 shadow-lg">
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { set('voice_id', v.id); setVoiceOpen(false) }}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-xs transition-colors ${v.id === settings.voice_id ? 'bg-gray-900 text-white' : 'hover:bg-white/60 text-gray-700'}`}
                  >
                    {v.name}
                    {v.id === settings.voice_id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-medium">Greeting</span>
          </div>
          <textarea
            value={settings.greeting_message}
            onChange={e => set('greeting_message', e.target.value)}
            rows={3}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none text-gray-900 placeholder:text-gray-400"
            placeholder="Hello! Thank you for calling…"
          />
        </div>

        {/* Office hours */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-medium">Office hours</span>
          </div>
          <input
            type="text"
            value={settings.office_hours}
            onChange={e => set('office_hours', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900 placeholder:text-gray-400"
            placeholder="Mon–Fri 9am–5pm"
          />
        </div>

        {/* Office location */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-medium">Location URL</span>
          </div>
          <input
            type="url"
            value={settings.office_location_url}
            onChange={e => set('office_location_url', e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900 placeholder:text-gray-400"
            placeholder="maps.google.com/…"
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || !loaded}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {saved ? <><Check className="w-3 h-3" /> Saved</> : saving ? 'Saving…' : 'Save'}
        </button>

      </div>
    </div>
  )
}
