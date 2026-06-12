'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

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

function TypewriterText({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const timeout = setTimeout(() => {
      const id = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i))
          i++
        } else {
          clearInterval(id)
        }
      }, 45)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
    >
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
      )}
    </motion.span>
  )
}

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
    setMessages(prev => [...prev, userMessage])
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

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Hero greeting — shown only before first message */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-6">
          {/* AI icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg"
          >
            <svg fill="none" height="28" viewBox="0 0 48 48" width="28" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="ai-hero-clip"><rect height="48" rx="12" width="48"/></clipPath>
              <g clipPath="url(#ai-hero-clip)">
                <path clipRule="evenodd" d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z" fill="white" fillRule="evenodd" opacity="0.9"/>
              </g>
            </svg>
          </motion.div>

          {/* Typewriter greeting */}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              <TypewriterText text={`Hi Dr. ${doctorName}`} delay={200} />
            </h2>
            <p className="text-base text-gray-400 font-normal">
              <TypewriterText text="How can I help you?" delay={800} />
            </p>
          </div>

          {/* Quick prompts */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-sm px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Chat messages — shown after first message */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {m.content}
              </motion.div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-3 border-t border-gray-100">
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
            className="resize-none text-sm rounded-xl border-gray-200 focus-visible:ring-gray-300 min-h-0"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl bg-gray-900 hover:bg-gray-800 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">AI may make mistakes. Verify important info.</p>
      </div>
    </div>
  )
}
