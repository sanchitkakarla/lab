'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AskAIPanelProps {
  doctorName: string
}

const QUICK_PROMPTS = [
  'Track my orders',
  'Case status summary',
]

export function AskAIPanel({ doctorName }: AskAIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMessage: Message = { role: 'user', content: text }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg fill="none" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="ai-clip"><rect height="48" rx="12" width="48"/></clipPath>
              <g clipPath="url(#ai-clip)">
                <path clipRule="evenodd" d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z" fill="white" fillRule="evenodd" opacity="0.8"/>
              </g>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 leading-none">Hi Dr. {doctorName},</p>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">How can I help?</h3>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">Ask me anything about your cases</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-gray-900 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={2}
            className="resize-none text-xs rounded-xl border-gray-200 focus-visible:ring-gray-300 min-h-0"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-xl bg-gray-900 hover:bg-gray-800 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">AI may make mistakes. Verify important info.</p>
      </div>
    </div>
  )
}
