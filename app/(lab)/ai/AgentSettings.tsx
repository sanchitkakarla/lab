'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MapPin, MessageSquare, Check, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',    description: 'Soft & professional' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',      description: 'Friendly & clear' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Warm & calm' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',      description: 'Bright & energetic' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',    description: 'Deep & trustworthy' },
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

interface DaySchedule { open: boolean; from: string; to: string }
type WeekSchedule = Record<string, DaySchedule>

const DEFAULT_WEEK: WeekSchedule = {
  Monday:    { open: true,  from: '09:00', to: '17:00' },
  Tuesday:   { open: true,  from: '09:00', to: '17:00' },
  Wednesday: { open: true,  from: '09:00', to: '17:00' },
  Thursday:  { open: true,  from: '09:00', to: '17:00' },
  Friday:    { open: true,  from: '09:00', to: '17:00' },
  Saturday:  { open: false, from: '09:00', to: '13:00' },
  Sunday:    { open: false, from: '09:00', to: '13:00' },
}

interface Settings {
  greeting_message: string
  voice_id: string
  office_location_url: string
  office_hours: string
  week_schedule: WeekSchedule
}

function parseSchedule(raw?: string): WeekSchedule {
  if (!raw) return DEFAULT_WEEK
  try { return { ...DEFAULT_WEEK, ...JSON.parse(raw) } } catch { return DEFAULT_WEEK }
}

export function AgentSettings({ initial }: { initial: Partial<Settings & { week_schedule_json?: string }> }) {
  const [settings, setSettings] = useState<Settings>({
    greeting_message:    initial.greeting_message    ?? 'Hello! Thank you for calling. How can I help you today?',
    voice_id:            initial.voice_id            ?? 'EXAVITQu4vr4xnSDxMaL',
    office_location_url: initial.office_location_url ?? '',
    office_hours:        initial.office_hours        ?? '',
    week_schedule:       parseSchedule(initial.week_schedule_json ?? (initial.week_schedule as unknown as string)),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function openVoice() {
    if (triggerRef.current) setDropdownRect(triggerRef.current.getBoundingClientRect())
    setVoiceOpen(o => !o)
  }

  useEffect(() => {
    if (!voiceOpen) return
    function close(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setVoiceOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [voiceOpen])

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }))
    setSaved(false)
  }

  function setDay(day: string, field: keyof DaySchedule, val: string | boolean) {
    setSettings(s => ({
      ...s,
      week_schedule: { ...s.week_schedule, [day]: { ...s.week_schedule[day], [field]: val } }
    }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    const payload = { ...settings, week_schedule: JSON.stringify(settings.week_schedule) }
    await fetch('/api/agent-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const selectedVoice = VOICES.find(v => v.id === settings.voice_id) ?? VOICES[0]

  const dropdown = voiceOpen && dropdownRect ? createPortal(
    <div
      style={{ position: 'fixed', top: dropdownRect.bottom + 6, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
      className="glass-card p-1 shadow-xl"
    >
      {VOICES.map(v => (
        <button
          key={v.id}
          onMouseDown={e => e.preventDefault()}
          onClick={() => { set('voice_id', v.id); setVoiceOpen(false) }}
          className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${v.id === settings.voice_id ? 'bg-gray-900 text-white' : 'hover:bg-white/60 text-gray-700'}`}
        >
          <span className="font-medium">{v.name} <span className={`font-normal ${v.id === settings.voice_id ? 'text-gray-300' : 'text-gray-400'}`}>— {v.description}</span></span>
          {v.id === settings.voice_id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div className="space-y-4">

      {/* Row 1: Voice + Greeting side by side */}
      <div className="grid grid-cols-2 gap-4">

        {/* Voice */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900">Agent voice</p>
          </div>
          <button
            ref={triggerRef}
            onClick={openVoice}
            className="w-full flex items-center justify-between gap-2 text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 hover:bg-white/80 transition-colors"
          >
            <span className="font-medium text-gray-900">{selectedVoice.name} <span className="font-normal text-gray-400">— {selectedVoice.description}</span></span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${voiceOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdown}
        </div>

        {/* Greeting */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900">Greeting message</p>
          </div>
          <textarea
            value={settings.greeting_message}
            onChange={e => set('greeting_message', e.target.value)}
            rows={3}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none text-gray-900 placeholder:text-gray-400"
            placeholder="Hello! Thank you for calling…"
          />
        </div>
      </div>

      {/* Row 2: Office hours + Google Maps side by side */}
      <div className="grid grid-cols-5 gap-4 items-stretch">

        {/* Office hours */}
        <div className="glass-card p-5 col-span-3">
          <p className="text-sm font-medium text-gray-900 mb-4">Office hours</p>
          <div className="space-y-2">
            {DAYS.map(day => {
              const d = settings.week_schedule[day]
              return (
                <div key={day} className="flex items-center gap-2.5 min-w-0">
                  {/* Open checkbox */}
                  <button
                    onClick={() => setDay(day, 'open', !d.open)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${d.open ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white/60'}`}
                  >
                    {d.open && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>

                  {/* Day name */}
                  <span className={`text-xs w-[88px] flex-shrink-0 ${d.open ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{day}</span>

                  {d.open ? (
                    <>
                      <input
                        type="time"
                        value={d.from}
                        onChange={e => setDay(day, 'from', e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900 flex-1 min-w-0"
                      />
                      <span className="text-xs text-gray-400 flex-shrink-0">to</span>
                      <input
                        type="time"
                        value={d.to}
                        onChange={e => setDay(day, 'to', e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-900 flex-1 min-w-0"
                      />
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Closed</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Google Maps */}
        <div className="glass-card p-5 col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900">Office location</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">Google Maps or website URL — shared with callers who ask for directions</p>
          <input
            type="url"
            value={settings.office_location_url}
            onChange={e => set('office_location_url', e.target.value)}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-900 placeholder:text-gray-400"
            placeholder="https://maps.google.com/..."
          />
          {settings.office_location_url && (
            <a
              href={settings.office_location_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 hover:underline"
            >
              <MapPin className="w-3 h-3" /> Preview link
            </a>
          )}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 text-sm font-medium px-6 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
