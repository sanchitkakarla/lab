'use client'

import { useState } from 'react'
import { Mic, MapPin, Clock, MessageSquare, Check, ChevronDown } from 'lucide-react'

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',    description: 'Soft & professional' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',      description: 'Friendly & clear' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Warm & calm' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',      description: 'Bright & energetic' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',    description: 'Deep & trustworthy' },
]

interface Settings {
  greeting_message: string
  voice_id: string
  office_location_url: string
  office_hours: string
}

export function AgentSettings({ initial }: { initial: Partial<Settings> }) {
  const [settings, setSettings] = useState<Settings>({
    greeting_message:    initial.greeting_message    ?? 'Hello! Thank you for calling. How can I help you today?',
    voice_id:            initial.voice_id            ?? 'EXAVITQu4vr4xnSDxMaL',
    office_location_url: initial.office_location_url ?? '',
    office_hours:        initial.office_hours        ?? 'Monday–Friday 9am–5pm',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

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
    setTimeout(() => setSaved(false), 3000)
  }

  const selectedVoice = VOICES.find(v => v.id === settings.voice_id) ?? VOICES[0]

  return (
    <div className="space-y-4">

      {/* Voice */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <Mic className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Agent voice</p>
            <p className="text-xs text-gray-400">ElevenLabs voice for calls</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setVoiceOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 hover:bg-white/80 transition-colors"
          >
            <span className="font-medium text-gray-900">{selectedVoice.name} <span className="font-normal text-gray-400">— {selectedVoice.description}</span></span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${voiceOpen ? 'rotate-180' : ''}`} />
          </button>
          {voiceOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 glass-card p-1 z-20 shadow-lg">
              {VOICES.map(v => (
                <button
                  key={v.id}
                  onClick={() => { set('voice_id', v.id); setVoiceOpen(false) }}
                  className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${v.id === settings.voice_id ? 'bg-gray-900 text-white' : 'hover:bg-white/60 text-gray-700'}`}
                >
                  <span className="font-medium">{v.name} <span className={`font-normal ${v.id === settings.voice_id ? 'text-gray-300' : 'text-gray-400'}`}>— {v.description}</span></span>
                  {v.id === settings.voice_id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Greeting */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Greeting message</p>
            <p className="text-xs text-gray-400">What the agent says first on every call</p>
          </div>
        </div>
        <textarea
          value={settings.greeting_message}
          onChange={e => set('greeting_message', e.target.value)}
          rows={3}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none text-gray-900 placeholder:text-gray-400"
          placeholder="Hello! Thank you for calling…"
        />
      </div>

      {/* Office hours */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Office hours</p>
            <p className="text-xs text-gray-400">The agent tells callers these hours when asked</p>
          </div>
        </div>
        <input
          type="text"
          value={settings.office_hours}
          onChange={e => set('office_hours', e.target.value)}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-900 placeholder:text-gray-400"
          placeholder="Monday–Friday 9am–5pm"
        />
      </div>

      {/* Office location */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Office location</p>
            <p className="text-xs text-gray-400">Google Maps or website URL shared with callers</p>
          </div>
        </div>
        <input
          type="url"
          value={settings.office_location_url}
          onChange={e => set('office_location_url', e.target.value)}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-900 placeholder:text-gray-400"
          placeholder="https://maps.google.com/..."
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 text-sm font-medium px-6 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saved ? <><Check className="w-4 h-4" /> Saved & synced to ElevenLabs</> : saving ? 'Saving…' : 'Save & sync to ElevenLabs'}
      </button>
    </div>
  )
}
