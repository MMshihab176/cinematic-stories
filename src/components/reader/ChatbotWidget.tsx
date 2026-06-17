'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { AtmosphereConfig, ChatMessage } from '@/types'

interface Props {
  storyId:    string
  storyTitle: string
  atmosphere: AtmosphereConfig
  onClose:    () => void
}

export function ChatbotWidget({ storyId, storyTitle, atmosphere: atmo, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role:    'assistant',
      content: `Hi! I'm your guide for "${storyTitle}". Ask me about characters, the timeline, lore, or what's happened so far — I'll keep things spoiler-aware based on what's been published.`,
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chatbot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storyId, storyTitle, messages: next }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 flex flex-col"
      style={{
        background:  `${atmo.surfaceColor}f5`,
        borderLeft:  `1px solid ${atmo.borderColor}`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${atmo.borderColor}` }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: atmo.accentColor }}>
            Story Assistant
          </p>
          <p className="text-sm mt-0.5" style={{ color: atmo.mutedColor }}>{storyTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-2xl leading-none opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: atmo.textColor }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
            style={{
              marginLeft:  m.role === 'user' ? 'auto' : '0',
              background:  m.role === 'user' ? atmo.accentColor : atmo.bgColor,
              color:       m.role === 'user' ? atmo.bgColor : atmo.textColor,
              border:      m.role === 'assistant' ? `1px solid ${atmo.borderColor}` : 'none',
              whiteSpace:  'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div
            className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
            style={{ background: atmo.bgColor, border: `1px solid ${atmo.borderColor}`, color: atmo.mutedColor }}
          >
            <span className="inline-flex gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
            </span>
          </div>
        )}
        {error && (
          <p className="text-xs text-center" style={{ color: '#e09090' }}>{error}</p>
        )}
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: `1px solid ${atmo.borderColor}` }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Ask about this story..."
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{
              background: atmo.bgColor,
              color:      atmo.textColor,
              border:     `1px solid ${atmo.borderColor}`,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: atmo.accentColor, color: atmo.bgColor }}
            aria-label="Send"
          >
            →
          </button>
        </div>
      </div>
    </motion.div>
  )
}
