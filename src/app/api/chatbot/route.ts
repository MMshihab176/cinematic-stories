import { NextRequest, NextResponse } from 'next/server'
import { chatWithStory } from '@/lib/ai/chatbot'
import type { ChatMessage } from '@/types'

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

  const apiKey = process.env.GROQ_API_KEY ?? ''
  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json({
      reply: 'AI চ্যাটবট এখনো সক্রিয় করা হয়নি। GROQ_API_KEY সেট করতে হবে।'
    })
  }

  try {
    const reply = await chatWithStory(storyId, storyTitle, messages.slice(-20))
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chatbot error:', err)
    return NextResponse.json({
      error: 'উত্তর দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
    }, { status: 500 })
  }
}
