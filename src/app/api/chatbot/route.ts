import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { chatWithStory } from '@/lib/ai/chatbot'
import type { ChatMessage } from '@/types'

const RATE_LIMIT = parseInt(process.env.CHATBOT_RATE_LIMIT ?? '20', 10)

export async function POST(req: NextRequest) {
  let body: { storyId?: string; storyTitle?: string; messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { storyId, storyTitle, messages } = body

  if (!storyId || !storyTitle || !messages?.length) {
    return NextResponse.json({ error: 'storyId, storyTitle and messages are required' }, { status: 400 })
  }

  if (messages.length > 50) {
    return NextResponse.json({ error: 'Conversation too long' }, { status: 400 })
  }

  // ─── Rate limiting (per IP, per hour) ─────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const ipHash  = crypto.createHash('sha256').update(ip).digest('hex')
  const hourKey = new Date().toISOString().slice(0, 13) // e.g. 2026-06-15T14

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('chatbot_rate_limits')
    .select('count')
    .eq('ip_hash', ipHash)
    .eq('hour_key', hourKey)
    .maybeSingle()

  if (existing && existing.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit reached (${RATE_LIMIT} messages/hour). Please try again later.` },
      { status: 429 }
    )
  }

  await supabase.from('chatbot_rate_limits').upsert(
    { ip_hash: ipHash, hour_key: hourKey, count: (existing?.count ?? 0) + 1 },
    { onConflict: 'ip_hash,hour_key' }
  )

  // ─── Generate response ─────────────────────────────────────────────────────
  try {
    const reply = await chatWithStory(storyId, storyTitle, messages.slice(-10))
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chatbot generation error:', err)
    return NextResponse.json({ error: 'Failed to generate a response. Please try again.' }, { status: 500 })
  }
}
